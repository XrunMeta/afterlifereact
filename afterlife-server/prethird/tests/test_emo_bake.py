"""AFL-1064 감정 영상 세트 굽기 대기열."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import emo_bake  # noqa: E402
import emotion_video as ev  # noqa: E402
import json  # noqa: E402

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _isolate(tmp_path, monkeypatch):
    """관리자 설정 파일은 기본 없음(→ env 폴백), 상태 기록은 테스트마다 비운다."""
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(tmp_path / "no-config.json"))
    monkeypatch.setattr(emo_bake, "_fails", {})
    monkeypatch.setattr(emo_bake, "_jobs", {})
    monkeypatch.setattr(emo_bake, "_last", {})
    monkeypatch.setattr(emo_bake, "_pending", set())


def _config(tmp_path, monkeypatch, mode, clones=()):
    p = tmp_path / f"cfg-{mode}-{len(clones)}.json"
    p.write_text(json.dumps({"video": {"mode": mode, "clones": list(clones)}}))
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(p))


def _drain():
    async def go():
        for _ in range(100):
            await asyncio.sleep(0.05)
            if not emo_bake._pending:
                return
    return go()


def _clone(tmp_path, clone="9300", face=True, clips=(), ready=None):
    d = tmp_path / clone / "emo"
    d.mkdir(parents=True)
    if face:
        (tmp_path / clone / f"{clone}-face.jpg").write_bytes(b"x")
    for c in clips:
        (d / f"{clone}-emo-{c}.mp4").write_bytes(b"x")
    if ready is not None:
        ev.mark_ready(str(d), *ready) if ready else (d / ev.READY).write_text("")
    return str(tmp_path)


def test_새_클론은_굽는다(tmp_path):
    assert emo_bake.needs_bake(_clone(tmp_path), "9300")


def test_얼굴_사진이_없으면_안_굽는다(tmp_path):
    assert not emo_bake.needs_bake(_clone(tmp_path, face=False), "9300")


def test_기본_세트만_있으면_나머지를_굽는다(tmp_path):
    root = _clone(tmp_path, clips=ev.CLIPS, ready=ev.BASE_CLIPS)
    assert emo_bake.needs_bake(root, "9300")


def test_다_구웠으면_안_굽는다(tmp_path):
    root = _clone(tmp_path, clips=ev.CLIPS, ready=ev.CLIPS)
    assert not emo_bake.needs_bake(root, "9300")


def test_표시_없이_구운_옛_세트는_건드리지_않는다(tmp_path):
    root = _clone(tmp_path, clips=ev.CLIPS)
    assert not emo_bake.needs_bake(root, "9300")


def test_자동_켜기_꺼지면_대기열에_안_넣는다(tmp_path, monkeypatch):
    monkeypatch.delenv("PRETHIRD_EMO_VIDEO_AUTO", raising=False)
    assert not emo_bake.enqueue(_clone(tmp_path), "9300")


def test_대기열은_한_클론을_한_번만_돌린다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    log = tmp_path / "ran.txt"
    cmd = tmp_path / "bake.sh"
    cmd.write_text(f'echo "$1" >> {log}; sleep 0.1\n')
    monkeypatch.setattr(emo_bake, "BAKE_CMD", str(cmd))
    root = _clone(tmp_path)

    async def go():
        assert emo_bake.enqueue(root, "9300")
        assert not emo_bake.enqueue(root, 9300)  # 이미 대기 중
        for _ in range(50):
            await asyncio.sleep(0.05)
            if not emo_bake._pending:
                break

    asyncio.run(go())
    assert log.read_text().split() == ["9300"]
    assert not emo_bake._pending


def test_길이_버전이_켜지면_버전까지_다_있어야_끝(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_LEN_SECS", "2,3")
    root = _clone(tmp_path, clips=ev.CLIPS, ready=ev.CLIPS)
    assert emo_bake.needs_bake(root, "9300")
    d = ev.emo_dir(root, "9300")
    ev.mark_ready(d, *(ev.version_key(c, s) for c in ev.EMO_CLIPS for s in (2, 3)))
    assert not emo_bake.needs_bake(root, "9300")


def test_연속_실패하면_다시_넣지_않는다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    monkeypatch.setattr(emo_bake, "_fails", {"9300": emo_bake.MAX_FAIL})
    assert not emo_bake.enqueue(_clone(tmp_path), "9300")


def test_실패하면_횟수를_세고_성공하면_지운다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    monkeypatch.setattr(emo_bake, "_fails", {})
    cmd = tmp_path / "bake.sh"
    cmd.write_text("exit 1\n")
    monkeypatch.setattr(emo_bake, "BAKE_CMD", str(cmd))
    root = _clone(tmp_path)

    async def run_once():
        assert emo_bake.enqueue(root, "9300")
        for _ in range(50):
            await asyncio.sleep(0.05)
            if not emo_bake._pending:
                break

    asyncio.run(run_once())
    assert emo_bake._fails == {"9300": 1}
    cmd.write_text("exit 0\n")
    asyncio.run(run_once())
    assert emo_bake._fails == {}


def test_이어_굽기는_시작한_클론만_다시_넣는다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    monkeypatch.setattr(emo_bake, "_fails", {})
    started = []
    monkeypatch.setattr(emo_bake, "enqueue", lambda root, c: started.append(c) or True)
    _clone(tmp_path, clone="9300", ready=["neutral"])         # 시작했다가 멈춤
    _clone(tmp_path, clone="9301")                              # 통화 전 — 표시 없음
    _clone(tmp_path, clone="9302", clips=ev.CLIPS)             # 옛 세트 — 표시 없음
    assert emo_bake.started_clones(str(tmp_path)) == ["9300"]
    assert emo_bake.sweep(str(tmp_path)) == ["9300"]


# ── AFL-1073: 관리자 설정 기준 굽기·다시 굽기·상태 ───────────────────────

def test_굽기_대상은_관리자_영상_설정을_따른다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    _config(tmp_path, monkeypatch, "off")
    assert not ev.bake_enabled("9300")            # 설정이 있으면 env 자동 켜기는 안 본다
    _config(tmp_path, monkeypatch, "some", ["9301"])
    assert not ev.bake_enabled("9300") and ev.bake_enabled("9301")
    _config(tmp_path, monkeypatch, "all")
    assert ev.bake_enabled("9300")
    assert not ev.bake_enabled(None)


def test_설정_파일이_없으면_자동_켜기_env(tmp_path, monkeypatch):
    monkeypatch.delenv("PRETHIRD_EMO_VIDEO_AUTO", raising=False)
    assert not ev.bake_enabled("9300")
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    assert ev.bake_enabled("9300")


def test_설정이_some이면_목록_밖_클론은_대기열에_안_넣는다(tmp_path, monkeypatch):
    _config(tmp_path, monkeypatch, "some", ["9301"])
    assert not emo_bake.enqueue(_clone(tmp_path), "9300")


def _bake_cmd(tmp_path, monkeypatch, body):
    cmd = tmp_path / "bake.sh"
    cmd.write_text(body)
    monkeypatch.setattr(emo_bake, "BAKE_CMD", str(cmd))
    return cmd


def test_다시_굽기는_다_구운_클론도_EMO_REBAKE로_처음부터(tmp_path, monkeypatch):
    _config(tmp_path, monkeypatch, "off")   # 대상이 아니어도 관리자가 고르면 굽는다
    log = tmp_path / "env.txt"
    _bake_cmd(tmp_path, monkeypatch, f'echo "$1 ${{EMO_REBAKE:-0}}" >> {log}\n')
    root = _clone(tmp_path, clips=ev.CLIPS, ready=ev.CLIPS)
    monkeypatch.setattr(emo_bake, "_fails", {"9300": emo_bake.MAX_FAIL})
    assert not emo_bake.enqueue(root, "9300")

    async def go():
        assert emo_bake.enqueue(root, "9300", rebake=True)
        assert not emo_bake.enqueue(root, "9300", rebake=True)   # 이미 대기 중
        await _drain()

    asyncio.run(go())
    assert log.read_text().split() == ["9300", "1"]
    assert emo_bake._last["9300"]["ok"] and emo_bake._last["9300"]["rebake"]
    assert emo_bake._fails == {}


def test_다시_굽기도_얼굴_사진이_없으면_못_한다(tmp_path):
    assert not emo_bake.enqueue(_clone(tmp_path, face=False), "9300", rebake=True)


def test_굽는_중_단계와_결과를_상태에_남긴다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    _bake_cmd(tmp_path, monkeypatch, 'echo "[시간] 기본 단계 1.0s"; sleep 0.3; echo "[준비] neutral"; exit 2\n')
    root = _clone(tmp_path, ready=[])
    seen = {}

    async def go():
        assert emo_bake.enqueue(root, "9300")
        assert emo_bake.clone_status(root, "9300")["state"] in ("queued", "running")
        for _ in range(40):
            await asyncio.sleep(0.02)
            st = emo_bake.clone_status(root, "9300")
            if st["job"] and st["job"]["stage"]:
                seen.update(st)
                break
        await _drain()

    asyncio.run(go())
    assert seen["state"] == "running" and seen["job"]["stage"] == "[시간] 기본 단계 1.0s"
    st = emo_bake.clone_status(root, "9300")
    assert st["state"] == "failed" and st["fails"] == 1
    assert st["last"]["rc"] == 2 and st["last"]["tail"][-1] == "[준비] neutral"


def test_상태_종류(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_LEN_SECS", "")
    _clone(tmp_path, clone="9300", clips=ev.CLIPS, ready=ev.CLIPS)
    _clone(tmp_path, clone="9301", clips=ev.CLIPS, ready=ev.BASE_CLIPS)
    _clone(tmp_path, clone="9302", clips=ev.CLIPS)
    _clone(tmp_path, clone="9303")
    _clone(tmp_path, clone="9304", face=False)
    root = str(tmp_path)
    st = {c: emo_bake.clone_status(root, c) for c in ("9300", "9301", "9302", "9303", "9304")}
    assert {c: s["state"] for c, s in st.items()} == {
        "9300": "done", "9301": "partial", "9302": "legacy", "9303": "none", "9304": "no_face"}
    assert st["9300"]["ready"] == st["9300"]["total"] == len(ev.CLIPS)
    assert st["9301"]["base_ready"] and not st["9303"]["base_ready"]
    assert st["9302"]["legacy_clips"] == sorted(ev.CLIPS)
    monkeypatch.setattr(emo_bake, "_fails", {"9301": emo_bake.MAX_FAIL})
    assert emo_bake.clone_status(root, "9301")["state"] == "stopped"


def test_상태_표는_관련_클론만_scope_all이면_얼굴_있는_전부(tmp_path, monkeypatch):
    _clone(tmp_path, clone="9300", clips=ev.CLIPS, ready=ev.BASE_CLIPS)   # 굽기 시작
    _clone(tmp_path, clone="9301")                                         # 설정 목록
    _clone(tmp_path, clone="9302")                                         # 아무것도 아님
    _config(tmp_path, monkeypatch, "some", ["9301"])
    root = str(tmp_path)
    rel = emo_bake.status(root)
    assert [r["clone"] for r in rel["clones"]] == ["9300", "9301"]       # partial → none 순
    assert rel["video_setting"] == {"mode": "some", "clones": ["9301"]}
    assert rel["clones"][0]["bake_target"] and rel["clones"][1]["bake_target"]   # 시작한 굽기·목록
    allrows = {r["clone"]: r for r in emo_bake.status(root, "all")["clones"]}
    assert set(allrows) == {"9300", "9301", "9302"} and not allrows["9302"]["bake_target"]


def _config_raw(tmp_path, monkeypatch, video):
    p = tmp_path / "cfg-raw.json"
    p.write_text(json.dumps({"video": video}))
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(p))


def test_생성_즉시_굽기는_영상_설정과_따로(tmp_path, monkeypatch):
    _config_raw(tmp_path, monkeypatch, {"mode": "off", "clones": [], "bake_on_create": True})
    root = _clone(tmp_path)
    assert ev.bake_on_create()
    assert not emo_bake.is_target(root, "9300")                 # 통화 시작·이어 굽기 경로로는 안 넣는다
    assert emo_bake.is_target(root, "9300", on_create=True)     # 클론 생성 때만
    _config_raw(tmp_path, monkeypatch, {"mode": "all", "clones": [], "bake_on_create": "yes"})
    assert not ev.bake_on_create()                               # bool true 만 켬


def test_시작한_굽기는_대상에서_빠져도_끝까지(tmp_path, monkeypatch):
    _config(tmp_path, monkeypatch, "off")
    root = _clone(tmp_path, ready=["neutral"])
    assert emo_bake.is_target(root, "9300")
    assert emo_bake.needs_bake(root, "9300")
