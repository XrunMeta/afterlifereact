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
