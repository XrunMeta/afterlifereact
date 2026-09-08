"""업로드 음성 override 가 pipeline_factory 에서 실제로 갈아끼워지는지.

핵심 계약 세 가지:
  1. 목소리(se_path)만 바뀌고 **얼굴·페르소나는 클론 것 그대로** 다.
  2. 지정이 없거나 해석 실패면 클론 기본 se_path 로 되돌아간다(회귀 0 · fail-open).
  3. 렌더 소스 override 와 서로 간섭하지 않는다(둘은 독립 노브다).
"""
import json
import types

import pytest

import pipeline_factory
import voice_lab
from registry import KnobsRegistry


class _Track:
    def __init__(self):
        self.idle_video = None

    def push_ndarray(self, a): pass
    def push_pcm_int16(self, p): pass
    def signal_end(self): pass
    def set_idle_video(self, p): self.idle_video = p
    def set_idle_frames(self, f): pass


@pytest.fixture(autouse=True)
def _root(tmp_path, monkeypatch):
    monkeypatch.setenv("LAB_VOICE_ROOT", str(tmp_path / "reference_voices"))
    monkeypatch.setenv("LAB_SOURCE_ROOT", str(tmp_path / "lab-sources"))
    return tmp_path / "reference_voices"


def _upload(root, vid="lab-20260818-120000"):
    d = root / vid
    d.mkdir(parents=True, exist_ok=True)
    (d / "voice.wav").write_bytes(b"RIFF")
    (d / "meta.json").write_text(json.dumps({
        "id": vid, "lab": True, "orig_name": "v.wav", "bytes": 4,
        "wav": str(d / "voice.wav"), "se_path": voice_lab.se_path_for(vid),
        "ref_text": "안녕하세요", "prompt_pair": True,
    }))
    return vid


def _sess(**kw):
    base = dict(
        video_track=_Track(), audio_track=_Track(),
        persona_messages=[{"role": "system", "content": "P"}],
        se_path="reference_voices/9055/se.pth", clone_id=9055,
        face_path="/clone/face.jpg", video_path="/clone/idle.mp4",
        filler_player=object(),
    )
    base.update(kw)
    return types.SimpleNamespace(**base)


def _factory(monkeypatch, registry):
    captured = {}

    class FakePipeline:
        def __init__(self, **kw):
            captured.update(kw)

    monkeypatch.setattr(pipeline_factory, "DialoguePipeline", FakePipeline)
    monkeypatch.setattr(pipeline_factory, "_decode_wav", lambda b: (b"", 16000, 1))
    renderer = types.SimpleNamespace(infer=lambda w, cb, video_path=None: None)
    return pipeline_factory.build_knobs_pipeline_factory(registry, renderer), captured


def test_no_override_keeps_clone_voice(monkeypatch):
    """voice_source 미지정 = 기존 동작 그대로(회귀 0)."""
    r = KnobsRegistry()
    factory, cap = _factory(monkeypatch, r)
    factory(_sess())
    assert cap["se_path"] == "reference_voices/9055/se.pth"


def test_override_replaces_se_path(monkeypatch, _root):
    vid = _upload(_root)
    r = KnobsRegistry()
    r.update({"source": {"voice_source": vid}})
    factory, cap = _factory(monkeypatch, r)
    factory(_sess())
    assert cap["se_path"] == voice_lab.se_path_for(vid)


def test_override_keeps_face_and_persona(monkeypatch, _root):
    """목소리만 바꾼다 — 얼굴·페르소나는 클론 것이어야 한다."""
    vid = _upload(_root)
    r = KnobsRegistry()
    r.update({"source": {"voice_source": vid}})
    factory, cap = _factory(monkeypatch, r)
    sess = _sess()
    factory(sess)
    assert cap["persona_messages"][0]["content"].startswith("P")
    assert sess.filler_player is not None          # 얼굴 자산은 건드리지 않는다
    assert sess.video_track.idle_video is None


def test_unknown_id_falls_back_to_clone_voice(monkeypatch):
    """지운 업로드를 노브가 아직 가리켜도 통화는 클론 목소리로 살아야 한다."""
    r = KnobsRegistry()
    r.update({"source": {"voice_source": "lab-20260818-999999"}})
    factory, cap = _factory(monkeypatch, r)
    factory(_sess())
    assert cap["se_path"] == "reference_voices/9055/se.pth"


def test_missing_wav_falls_back_to_clone_voice(monkeypatch, _root):
    vid = _upload(_root)
    (_root / vid / "voice.wav").unlink()
    r = KnobsRegistry()
    r.update({"source": {"voice_source": vid}})
    factory, cap = _factory(monkeypatch, r)
    factory(_sess())
    assert cap["se_path"] == "reference_voices/9055/se.pth"


def test_override_works_when_clone_has_no_se_path(monkeypatch, _root):
    """클론이 se_path 를 안 주는 세션(env 기본 사용)에서도 업로드 목소리가 이긴다."""
    vid = _upload(_root)
    r = KnobsRegistry()
    r.update({"source": {"voice_source": vid}})
    factory, cap = _factory(monkeypatch, r)
    factory(_sess(se_path=None))
    assert cap["se_path"] == voice_lab.se_path_for(vid)


def test_voice_and_render_overrides_are_independent(monkeypatch, _root, tmp_path):
    """음성만 지정했을 때 렌더 소스가 딸려 바뀌면 안 된다(그 반대도)."""
    vid = _upload(_root)
    r = KnobsRegistry()
    r.update({"source": {"voice_source": vid}})
    captured = {}

    class FakePipeline:
        def __init__(self, **kw):
            captured.update(kw)

    monkeypatch.setattr(pipeline_factory, "DialoguePipeline", FakePipeline)
    monkeypatch.setattr(pipeline_factory, "_decode_wav", lambda b: (b"", 16000, 1))
    seen = {}
    renderer = types.SimpleNamespace(
        infer=lambda w, cb, video_path=None: seen.setdefault("src", video_path))
    factory = pipeline_factory.build_knobs_pipeline_factory(r, renderer)
    factory(_sess())
    captured["infer_fn"](b"w", None)
    assert seen["src"] == "/clone/face.jpg"
