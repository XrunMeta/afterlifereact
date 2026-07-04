import types
from registry import KnobsRegistry
import pipeline_factory


class _Track:
    def push_ndarray(self, a): pass
    def push_pcm_int16(self, p): pass
    def signal_end(self): pass


def test_factory_builds_pipeline_with_knobs(monkeypatch):
    captured = {}
    class FakePipeline:
        def __init__(self, **kw): captured.update(kw)
    monkeypatch.setattr(pipeline_factory, "DialoguePipeline", FakePipeline)
    monkeypatch.setattr(pipeline_factory, "_decode_wav", lambda b: (b"", 16000, 1))

    r = KnobsRegistry()
    r.update({"dialogue": {"min_len": 8, "force_flush": 40, "system_override": "SYS"}})
    renderer = types.SimpleNamespace(infer=lambda w, cb, video_path=None: 0)
    factory = pipeline_factory.build_knobs_pipeline_factory(r, renderer)

    sess = types.SimpleNamespace(
        video_track=_Track(), audio_track=_Track(),
        persona_messages=[{"role": "system", "content": "P"}],
        se_path="/se", clone_id=9055, face_path="/f.jpg", video_path=None,
    )
    factory(sess)
    assert captured["min_len"] == 8
    assert captured["force_flush"] == 40
    # persona override 앞에 삽입
    assert captured["persona_messages"][0]["content"] == "SYS"
    assert captured["se_path"] == "/se"
    assert captured["clone_locked"] is True


def test_infer_fn_propagates_guard_busy(monkeypatch):
    captured = {}
    class FakePipeline:
        def __init__(self, **kw): captured.update(kw)
    monkeypatch.setattr(pipeline_factory, "DialoguePipeline", FakePipeline)
    monkeypatch.setattr(pipeline_factory, "_decode_wav", lambda b: (b"", 16000, 1))

    r = KnobsRegistry()
    renderer = types.SimpleNamespace(infer=lambda w, cb, video_path=None: 0)

    class _BusyGuard:
        def assert_free(self):
            raise RuntimeError("busy")

    factory = pipeline_factory.build_knobs_pipeline_factory(r, renderer, guard=_BusyGuard())
    sess = types.SimpleNamespace(
        video_track=_Track(), audio_track=_Track(),
        persona_messages=[{"role": "system", "content": "P"}],
        se_path="/se", clone_id=9055, face_path="/f.jpg", video_path=None,
    )
    factory(sess)
    import pytest
    with pytest.raises(RuntimeError, match="busy"):
        captured["infer_fn"]("/w.wav", lambda frame: None)


def test_infer_fn_no_guard_calls_renderer_normally(monkeypatch):
    captured = {}
    class FakePipeline:
        def __init__(self, **kw): captured.update(kw)
    monkeypatch.setattr(pipeline_factory, "DialoguePipeline", FakePipeline)
    monkeypatch.setattr(pipeline_factory, "_decode_wav", lambda b: (b"", 16000, 1))

    r = KnobsRegistry()
    infer_calls = {}
    def _infer(w, cb, video_path=None):
        infer_calls["wav"] = w
        infer_calls["video_path"] = video_path
        return 3
    renderer = types.SimpleNamespace(infer=_infer)

    factory = pipeline_factory.build_knobs_pipeline_factory(r, renderer)   # guard=None(기본)
    sess = types.SimpleNamespace(
        video_track=_Track(), audio_track=_Track(),
        persona_messages=[{"role": "system", "content": "P"}],
        se_path="/se", clone_id=9055, face_path="/f.jpg", video_path=None,
    )
    factory(sess)
    result = captured["infer_fn"]("/w.wav", lambda frame: None)
    assert result == 3
    assert infer_calls["wav"] == "/w.wav"
    assert infer_calls["video_path"] == "/f.jpg"
