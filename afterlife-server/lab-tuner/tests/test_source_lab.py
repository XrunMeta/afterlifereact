"""업로드 소스 저장·정규화 단위 테스트.

모킹은 최소로 쓴다 — ffmpeg 만 주입으로 대체하고 파일시스템은 실제 tmp_path 를 쓴다
(관대한 모킹이 드리프트를 삼킨 전례가 있다. test_render_contract.py 헤더 참조).
"""
import ast
import json
import pathlib
import types

import pytest

import source_lab


@pytest.fixture(autouse=True)
def _root(tmp_path, monkeypatch):
    monkeypatch.setenv("LAB_SOURCE_ROOT", str(tmp_path / "lab-sources"))
    return tmp_path / "lab-sources"


def _ok(*a, **kw):
    """ffmpeg 성공 대역 — dest 를 실제로 만들어 준다(build_idle 이 존재를 확인한다)."""
    cmd = a[0]
    pathlib.Path(cmd[-1]).write_bytes(b"idle")
    return types.SimpleNamespace(returncode=0, stderr="")


def _fail(*a, **kw):
    return types.SimpleNamespace(returncode=1, stderr="boom")


# --- 확장자 판정 -----------------------------------------------------------

@pytest.mark.parametrize("name,kind", [
    ("a.mp4", "video"), ("a.MOV", "video"), ("a.webm", "video"),
    ("a.jpg", "image"), ("a.PNG", "image"), ("a.webp", "image"),
])
def test_kind_of(name, kind):
    assert source_lab.kind_of(name) == kind


@pytest.mark.parametrize("name", ["a.txt", "a.gif", "a.exe", "noext", ""])
def test_kind_of_rejects(name):
    with pytest.raises(source_lab.SourceError):
        source_lab.kind_of(name)


def test_image_exts_match_fifth_render_server():
    """랩과 렌더서버의 이미지 확장자 목록이 어긋나면 조용히 오분류된다.

    랩이 사진을 영상으로 보면 idle 을 ffmpeg 로 굽다 실패하고, 렌더서버가 사진을
    영상으로 보면 cv2.VideoCapture 가 0프레임으로 죽는다. 실제 소스에서 읽어 대조.
    """
    server = (pathlib.Path(__file__).resolve().parents[2]
              / "fifth" / "scripts" / "fifth_render_server.py")
    tree = ast.parse(server.read_text(encoding="utf-8"))
    found = None
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and any(
                getattr(t, "id", None) == "_IMAGE_EXTS" for t in node.targets):
            found = tuple(e.value for e in node.value.elts)
    assert found is not None, "fifth_render_server._IMAGE_EXTS 를 못 찾음"
    assert set(source_lab.IMAGE_EXTS) == set(found)


# --- id 생성 ---------------------------------------------------------------

def test_make_id_is_datetime():
    sid = source_lab.make_id(now=1755234622.0, exists=lambda n: False)
    assert len(sid) == 15 and sid[8] == "-"
    assert sid.replace("-", "").isdigit()


def test_make_id_avoids_collision():
    """같은 초에 두 번 올라와도 디렉터리가 겹치면 안 된다.

    디렉터리 이름이 곧 fifth 소스 캐시 키라, 겹치면 이전 업로드 얼굴이 나온다.
    """
    base = source_lab.make_id(now=1755234622.0, exists=lambda n: False)
    taken = {base}
    sid = source_lab.make_id(now=1755234622.0, exists=lambda n: n in taken)
    assert sid not in taken and sid == f"{base}-2"


# --- idle 정규화 -----------------------------------------------------------

def test_idle_size_matches_fifth_render_output():
    """idle 해상도 ≠ fifth 렌더 출력이면 통화 중 영상 크기가 왔다갔다 한다.

    fifth 는 모든 소스 이미지를 image_normalize.TARGET_W/H(9:16)로 강제 정규화하므로
    렌더 출력은 항상 그 크기다. 실제 소스에서 읽어 대조한다(모킹 없이).
    """
    norm = (pathlib.Path(__file__).resolve().parents[2]
            / "fifth" / "scripts" / "image_normalize.py")
    tree = ast.parse(norm.read_text(encoding="utf-8"))
    got = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for t in node.targets:
                if getattr(t, "id", None) in ("TARGET_W", "TARGET_H"):
                    got[t.id] = node.value.value
    assert got.get("TARGET_W") and got.get("TARGET_H"), "TARGET_W/H 를 못 찾음"
    assert (source_lab.IDLE_W, source_lab.IDLE_H) == (got["TARGET_W"], got["TARGET_H"])


def test_build_idle_cmd_pins_fps_duration_and_size():
    """세 가지가 빠지면 각각 배속 붕괴·RAM 폭발·해상도 불일치가 난다."""
    cmd = source_lab.build_idle_cmd("/in.mp4", "/out.mp4")
    assert cmd[-1] == "/out.mp4"
    assert "-t" in cmd and cmd[cmd.index("-t") + 1] == str(source_lab.IDLE_SEC)
    assert "-an" in cmd                       # idle 은 무음
    vf = cmd[cmd.index("-vf") + 1]
    assert f"fps={source_lab.IDLE_FPS}" in vf
    assert f"scale={source_lab.IDLE_W}:{source_lab.IDLE_H}" in vf
    assert "force_original_aspect_ratio=decrease" in vf   # 찌그러짐 방지
    assert f"pad={source_lab.IDLE_W}:{source_lab.IDLE_H}" in vf


def test_build_idle_returns_none_on_ffmpeg_failure(tmp_path):
    assert source_lab.build_idle("/in.mp4", str(tmp_path / "o.mp4"), run=_fail) is None


def test_build_idle_returns_none_when_ffmpeg_missing(tmp_path):
    def _boom(*a, **kw):
        raise FileNotFoundError("ffmpeg")
    assert source_lab.build_idle("/in.mp4", str(tmp_path / "o.mp4"), run=_boom) is None


# --- 섬네일 ----------------------------------------------------------------

def test_build_thumb_cmd_scales_by_height():
    cmd = source_lab.build_thumb_cmd("/in.jpg", "/out.jpg")
    vf = cmd[cmd.index("-vf") + 1]
    # 폭은 -2(짝수 자동) — 홀수 폭이 나오면 인코더가 거부한다
    assert vf == f"scale=-2:{source_lab.THUMB_H}"
    assert cmd[cmd.index("-frames:v") + 1] == "1"
    assert cmd[-1] == "/out.jpg"


def test_upload_makes_thumb(_root):
    m = source_lab.save_bytes(b"a", "a.jpg", now=1755234622.0, run=_ok)
    assert m["thumb"] == str(_root / m["id"] / "thumb.jpg")
    assert (_root / m["id"] / "thumb.jpg").is_file()


def test_upload_survives_thumb_failure(_root):
    """섬네일은 보조 기능 — 실패해도 업로드는 살아야 한다."""
    def _thumb_fails(cmd, **kw):
        return _fail(cmd, **kw) if str(cmd[-1]).endswith("thumb.jpg") else _ok(cmd, **kw)
    m = source_lab.save_bytes(b"a", "a.jpg", now=1755234622.0, run=_thumb_fails)
    assert m["thumb"] is None and (_root / m["id"] / "source.jpg").is_file()


def test_ensure_thumb_backfills_old_upload(_root):
    """섬네일 기능 이전에 올라온 업로드도 목록에 보여야 한다(지연 생성)."""
    m = source_lab.save_bytes(b"a", "a.jpg", now=1755234622.0, run=_ok)
    d = _root / m["id"]
    (d / "thumb.jpg").unlink()
    meta = json.loads((d / "meta.json").read_text())
    del meta["thumb"]                              # 구 meta 재현
    (d / "meta.json").write_text(json.dumps(meta))

    got = source_lab.ensure_thumb(m["id"], run=_ok)
    assert got == str(d / "thumb.jpg") and (d / "thumb.jpg").is_file()
    # 두 번째 호출은 다시 만들지 않는다(meta 에 기록됐다)
    assert json.loads((d / "meta.json").read_text())["thumb"] == got

    def _never(*a, **kw):
        raise AssertionError("이미 있는 섬네일을 다시 만들면 안 된다")
    assert source_lab.ensure_thumb(m["id"], run=_never) == got


def test_ensure_thumb_none_for_unknown_id():
    assert source_lab.ensure_thumb("없는id") is None


# --- 저장 -----------------------------------------------------------------

def test_save_video_creates_face_and_idle(_root):
    """영상 업로드는 원본·대표프레임·idle 3종을 만든다.

    렌더 소스가 원본 mp4 가 아니라 face.jpg 여야 한다 — fifth 는 영상 경로를 받으면
    프레임 0 으로 죽는다(2026-08-15 실측, build_face docstring).
    """
    m = source_lab.save_bytes(b"\x00\x01", "clip.MP4", now=1755234622.0, run=_ok)
    d = _root / m["id"]
    assert (d / "source.mp4").is_file()        # 확장자는 소문자로 정규화
    assert (d / "face.jpg").is_file()
    assert (d / "idle.mp4").is_file()
    assert m["kind"] == "video"
    assert m["source"] == str(d / "face.jpg")  # 렌더 소스 = 이미지
    assert m["video"] == str(d / "source.mp4")
    assert m["idle"] == str(d / "idle.mp4")
    meta = json.loads((d / "meta.json").read_text())
    assert meta["orig_name"] == "clip.MP4" and meta["bytes"] == 2


def test_build_face_cmd_seeks_past_first_frame():
    """0초 프레임은 검거나 페이드인이라 얼굴 검출이 실패한다."""
    cmd = source_lab.build_face_cmd("/in.mp4", "/out.jpg")
    assert cmd[cmd.index("-ss") + 1] == str(source_lab.FACE_AT_SEC)
    assert float(source_lab.FACE_AT_SEC) > 0
    assert cmd[cmd.index("-frames:v") + 1] == "1"
    assert cmd[-1] == "/out.jpg"


def test_save_video_rejected_when_face_extraction_fails(_root):
    """렌더 소스를 못 만들면 쓸 수 없는 업로드다 — 디스크에 남기지 않는다."""
    with pytest.raises(source_lab.SourceError):
        source_lab.save_bytes(b"\x00", "clip.mp4", now=1755234622.0, run=_fail)
    assert not _root.exists() or not list(_root.iterdir())


def test_save_image_has_no_idle(_root):
    m = source_lab.save_bytes(b"\x00", "face.jpg", now=1755234622.0, run=_ok)
    assert m["kind"] == "image" and m["idle"] is None and m["video"] is None
    assert m["source"] == str(_root / m["id"] / "source.jpg")


def test_save_video_survives_idle_failure(_root):
    """idle 을 못 구워도 업로드 자체는 성공해야 한다(클론 idle 로 폴백).

    대표 프레임(치명적)과 idle(폴백 가능)의 실패 취급이 다르다는 계약.
    """
    def _face_ok_idle_fail(cmd, **kw):
        if str(cmd[-1]).endswith(".jpg"):
            return _ok(cmd, **kw)
        return _fail(cmd, **kw)
    m = source_lab.save_bytes(b"\x00", "clip.mp4", now=1755234622.0, run=_face_ok_idle_fail)
    assert m["idle"] is None
    assert m["source"].endswith("face.jpg")
    assert (_root / m["id"] / "source.mp4").is_file()


def test_save_rejects_oversize(monkeypatch):
    monkeypatch.setattr(source_lab, "MAX_BYTES", 4)
    with pytest.raises(source_lab.SourceError):
        source_lab.save_bytes(b"12345", "a.mp4", run=_ok)


def test_save_rejects_empty():
    with pytest.raises(source_lab.SourceError):
        source_lab.save_bytes(b"", "a.mp4", run=_ok)


def test_save_rejects_bad_ext_before_writing(_root):
    with pytest.raises(source_lab.SourceError):
        source_lab.save_bytes(b"x", "a.txt", run=_ok)
    assert not _root.exists() or not list(_root.iterdir())


# --- 조회·해석·삭제 ---------------------------------------------------------

def test_list_sources_newest_first(_root):
    a = source_lab.save_bytes(b"a", "a.jpg", now=1755234622.0, run=_ok)
    b = source_lab.save_bytes(b"b", "b.jpg", now=1755238222.0, run=_ok)
    ids = [s["id"] for s in source_lab.list_sources()]
    assert ids == [b["id"], a["id"]]
    assert all(s["ok"] for s in source_lab.list_sources())


def test_list_sources_empty_when_root_missing():
    assert source_lab.list_sources() == []


def test_resolve_roundtrip(_root):
    m = source_lab.save_bytes(b"a", "a.mp4", now=1755234622.0, run=_ok)
    got = source_lab.resolve(m["id"])
    assert got["source"] == m["source"] and got["idle"] == m["idle"]


@pytest.mark.parametrize("bad", ["", None, "없는id", "../etc", "./x", "a/b"])
def test_resolve_fail_open(bad):
    """통화 경로에서 불린다 — 무엇이 들어와도 예외 없이 None 이어야 한다."""
    assert source_lab.resolve(bad) is None


def test_resolve_none_when_source_file_gone(_root):
    m = source_lab.save_bytes(b"a", "a.mp4", now=1755234622.0, run=_ok)
    (_root / m["id"] / "face.jpg").unlink()      # 렌더 소스 = face.jpg
    assert source_lab.resolve(m["id"]) is None


def test_resolve_drops_missing_idle(_root):
    m = source_lab.save_bytes(b"a", "a.mp4", now=1755234622.0, run=_ok)
    (_root / m["id"] / "idle.mp4").unlink()
    got = source_lab.resolve(m["id"])
    assert got is not None and got["idle"] is None   # 소스는 살고 idle 만 폴백


def test_delete(_root):
    m = source_lab.save_bytes(b"a", "a.mp4", now=1755234622.0, run=_ok)
    assert source_lab.delete(m["id"]) is True
    assert not (_root / m["id"]).exists()
    assert source_lab.delete(m["id"]) is False


@pytest.mark.parametrize("bad", ["../etc", "a/b", ".hidden", ""])
def test_delete_rejects_path_escape(bad):
    with pytest.raises(source_lab.SourceError):
        source_lab.delete(bad)
