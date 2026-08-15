"""업로드 소스 override 가 pipeline_factory 에서 실제로 갈아끼워지는지.

핵심 계약 세 가지:
  1. 렌더 소스만 바뀌고 **목소리(se_path)·페르소나는 클론 것 그대로** 다.
  2. 지정이 없거나 해석 실패면 클론 기본 경로로 되돌아간다(회귀 0 · fail-open).
  3. idle·필러도 함께 정리된다(업로드 얼굴과 클론 얼굴이 섞이지 않게).
"""
import pathlib
import types

import pytest

import pipeline_factory
import source_lab
from registry import KnobsRegistry


class _Track:
    def __init__(self):
        self.idle_video = None
        self.idle_frames = None

    def push_ndarray(self, a): pass
    def push_pcm_int16(self, p): pass
    def signal_end(self): pass
    def set_idle_video(self, p): self.idle_video = p
    def set_idle_frames(self, f): self.idle_frames = f


@pytest.fixture(autouse=True)
def _root(tmp_path, monkeypatch):
    monkeypatch.setenv("LAB_SOURCE_ROOT", str(tmp_path / "lab-sources"))
    return tmp_path / "lab-sources"


def _ffmpeg_ok(*a, **kw):
    pathlib.Path(a[0][-1]).write_bytes(b"idle")
    return types.SimpleNamespace(returncode=0, stderr="")


def _sess(**kw):
    base = dict(
        video_track=_Track(), audio_track=_Track(),
        persona_messages=[{"role": "system", "content": "P"}],
        se_path="/ref/9055/se.pth", clone_id=9055,
        face_path="/clone/face.jpg", video_path="/clone/idle.mp4",
        filler_player=object(),
    )
    base.update(kw)
    return types.SimpleNamespace(**base)


def _factory(monkeypatch, registry, renderer=None):
    captured = {}

    class FakePipeline:
        def __init__(self, **kw):
            captured.update(kw)

    monkeypatch.setattr(pipeline_factory, "DialoguePipeline", FakePipeline)
    monkeypatch.setattr(pipeline_factory, "_decode_wav", lambda b: (b"", 16000, 1))
    renderer = renderer or types.SimpleNamespace(
        infer=lambda w, cb, video_path=None: captured.setdefault("_src", video_path))
    return pipeline_factory.build_knobs_pipeline_factory(registry, renderer), captured


def test_no_override_keeps_clone_assets(monkeypatch):
    """override 미지정 = 기존 동작 그대로(회귀 0)."""
    r = KnobsRegistry()
    seen = {}
    renderer = types.SimpleNamespace(
        infer=lambda w, cb, video_path=None: seen.update(src=video_path))
    factory, captured = _factory(monkeypatch, r, renderer)
    sess = _sess()
    factory(sess)
    captured["infer_fn"](b"wav", lambda *a: None)
    assert seen["src"] == "/clone/face.jpg"         # 클론 정면사진 우선
    assert sess.video_track.idle_video is None      # idle 손대지 않음
    assert sess.filler_player is not None           # 필러 유지


def test_video_override_swaps_source_and_idle(monkeypatch):
    m = source_lab.save_bytes(b"v", "up.mp4", run=_ffmpeg_ok)
    r = KnobsRegistry()
    r.update({"source": {"render_source": m["id"]}})

    seen = {}
    renderer = types.SimpleNamespace(
        infer=lambda w, cb, video_path=None: seen.update(src=video_path))
    factory, captured = _factory(monkeypatch, r, renderer)
    sess = _sess()
    factory(sess)
    captured["infer_fn"](b"wav", lambda *a: None)

    assert seen["src"] == m["source"]                     # 렌더 소스 교체
    assert sess.video_track.idle_video == m["idle"]       # idle 도 교체
    assert sess.idle_video_applied is True
    assert sess.filler_player is None                     # 클론 필러 차단
    # 목소리·페르소나는 그대로 — 이게 이 기능의 존재 이유다
    assert captured["se_path"] == "/ref/9055/se.pth"
    assert captured["persona_messages"] == [{"role": "system", "content": "P"}]
    assert captured["clone_locked"] is True


def test_image_override_uses_prebake_not_idle_video(monkeypatch):
    m = source_lab.save_bytes(b"i", "up.jpg", run=_ffmpeg_ok)
    r = KnobsRegistry()
    r.update({"source": {"render_source": m["id"]}})
    called = {}
    fake = types.ModuleType("idle_prebake")
    fake.start_prebake = lambda renderer, face, track, **kw: called.update(face=face)
    monkeypatch.setitem(__import__("sys").modules, "idle_prebake", fake)

    seen = {}
    renderer = types.SimpleNamespace(
        infer=lambda w, cb, video_path=None: seen.update(src=video_path))
    factory, captured = _factory(monkeypatch, r, renderer)
    sess = _sess()
    factory(sess)
    captured["infer_fn"](b"wav", lambda *a: None)

    assert seen["src"] == m["source"]
    assert sess.video_track.idle_video is None    # 사진은 idle mp4 를 만들지 않는다
    assert called["face"] == m["source"]          # 대신 prebake 로 굽는다


def test_use_idle_off_keeps_clone_idle(monkeypatch):
    m = source_lab.save_bytes(b"v", "up.mp4", run=_ffmpeg_ok)
    r = KnobsRegistry()
    r.update({"source": {"render_source": m["id"], "use_idle": False}})
    seen = {}
    renderer = types.SimpleNamespace(
        infer=lambda w, cb, video_path=None: seen.update(src=video_path))
    factory, captured = _factory(monkeypatch, r, renderer)
    sess = _sess()
    factory(sess)
    captured["infer_fn"](b"wav", lambda *a: None)
    assert seen["src"] == m["source"]
    assert sess.video_track.idle_video is None


def test_mute_filler_off_keeps_filler(monkeypatch):
    m = source_lab.save_bytes(b"v", "up.mp4", run=_ffmpeg_ok)
    r = KnobsRegistry()
    r.update({"source": {"render_source": m["id"], "mute_filler": False}})
    factory, captured = _factory(monkeypatch, r)
    sess = _sess()
    factory(sess)
    assert sess.filler_player is not None


def test_unknown_id_falls_back_to_clone(monkeypatch):
    """id 가 사라져도 통화는 살아야 한다 — 클론 기본 자산으로 되돌아간다."""
    r = KnobsRegistry()
    r.update({"source": {"render_source": "20260101-000000"}})
    seen = {}
    renderer = types.SimpleNamespace(
        infer=lambda w, cb, video_path=None: seen.update(src=video_path))
    factory, captured = _factory(monkeypatch, r, renderer)
    sess = _sess()
    factory(sess)
    captured["infer_fn"](b"wav", lambda *a: None)
    assert seen["src"] == "/clone/face.jpg"
    assert sess.video_track.idle_video is None
    assert sess.filler_player is not None


def test_prebake_failure_does_not_break_call(monkeypatch):
    m = source_lab.save_bytes(b"i", "up.jpg", run=_ffmpeg_ok)
    r = KnobsRegistry()
    r.update({"source": {"render_source": m["id"]}})
    fake = types.ModuleType("idle_prebake")

    def _boom(*a, **kw):
        raise RuntimeError("gpu busy")
    fake.start_prebake = _boom
    monkeypatch.setitem(__import__("sys").modules, "idle_prebake", fake)

    seen = {}
    renderer = types.SimpleNamespace(
        infer=lambda w, cb, video_path=None: seen.update(src=video_path))
    factory, captured = _factory(monkeypatch, r, renderer)
    sess = _sess()
    factory(sess)                       # 예외가 새면 여기서 죽는다
    captured["infer_fn"](b"wav", lambda *a: None)
    assert seen["src"] == m["source"]   # 소스 교체는 그대로 성립
