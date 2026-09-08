import inspect
import types
from registry import KnobsRegistry
from artifact_store import ArtifactStore
from store_recorder import StoreRecorder
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
    pipe = factory(sess)
    # min_len/force_flush 는 생성자 인자가 아니라 _sb_factory 로 주입된다
    # (→ test_sentence_buffer_knobs_reach_pipeline). 생성자에 넣으면 TypeError.
    assert "min_len" not in captured
    assert "force_flush" not in captured
    assert pipe._sb_factory().min_len == 8
    # persona override 앞에 삽입
    assert captured["persona_messages"][0]["content"] == "SYS"
    assert captured["se_path"] == "/se"
    assert captured["clone_locked"] is True


def _build_and_capture(monkeypatch, knobs=None):
    """factory 를 돌려 DialoguePipeline 에 넘어간 kwargs 와 만들어진 pipe 를 돌려준다."""
    captured = {}
    class FakePipeline:
        def __init__(self, **kw): captured.update(kw)
    monkeypatch.setattr(pipeline_factory, "DialoguePipeline", FakePipeline)
    monkeypatch.setattr(pipeline_factory, "_decode_wav", lambda b: (b"", 16000, 1))

    r = KnobsRegistry()
    if knobs:
        r.update({"dialogue": knobs})
    renderer = types.SimpleNamespace(infer=lambda w, cb, video_path=None: 0)
    factory = pipeline_factory.build_knobs_pipeline_factory(r, renderer)
    sess = types.SimpleNamespace(
        video_track=_Track(), audio_track=_Track(),
        persona_messages=[{"role": "system", "content": "P"}],
        se_path="/se", clone_id=9055, face_path="/f.jpg", video_path=None,
    )
    return factory(sess), captured


def test_factory_kwargs_bind_to_real_pipeline_signature(monkeypatch):
    """factory 가 넘기는 kwargs 가 **실제** DialoguePipeline 시그니처에 바인딩되는지.

    다른 테스트는 전부 FakePipeline(**kw) 로 모킹해서 어떤 kwargs 든 삼켜버린다 →
    prethird 쪽 시그니처가 바뀌어도(T-120 B 에서 min_len/force_flush 가 제거되고
    SentenceBuffer.from_env() 로 이동) 테스트는 통과하고 실서버 /offer 만 500 으로
    죽었다. 이 테스트가 그 구멍을 막는다.
    """
    from pipeline import DialoguePipeline as RealPipeline

    _pipe, captured = _build_and_capture(
        monkeypatch, {"min_len": 8, "force_flush": 40, "system_override": "SYS"})

    sig = inspect.signature(RealPipeline.__init__)
    sig.bind(object(), **captured)   # 드리프트가 있으면 여기서 TypeError


def test_sentence_buffer_knobs_reach_pipeline(monkeypatch):
    """min_len/force_flush 노브가 (생성자 인자가 사라진 뒤에도) 실제로 먹는지."""
    pipe, _captured = _build_and_capture(
        monkeypatch, {"min_len": 8, "force_flush": 40})

    sb = pipe._sb_factory()
    assert sb.min_len == 8
    assert sb.force_flush == 40
    # first_min_len 을 env 로 지정하지 않았으면 min_len 을 따라간다(SentenceBuffer 규약)
    assert sb.first_min_len == 8


def test_sentence_buffer_env_first_min_len_respected(monkeypatch):
    """env 로 first_min_len 을 명시했으면 노브가 그걸 덮지 않는다."""
    monkeypatch.setenv("PRETHIRD_SENTENCE_FIRST_MIN_LEN", "2")
    pipe, _captured = _build_and_capture(monkeypatch, {"min_len": 8, "force_flush": 40})

    sb = pipe._sb_factory()
    assert sb.min_len == 8
    assert sb.first_min_len == 2   # env 우선


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


def test_store_injection_replaces_sess_recorder(monkeypatch, tmp_path):
    captured = {}
    class FakePipeline:
        def __init__(self, **kw): captured.update(kw)
    monkeypatch.setattr(pipeline_factory, "DialoguePipeline", FakePipeline)
    monkeypatch.setattr(pipeline_factory, "_decode_wav", lambda b: (b"", 16000, 1))

    r = KnobsRegistry()
    store = ArtifactStore(str(tmp_path))
    renderer = types.SimpleNamespace(infer=lambda w, cb, video_path=None: 0)

    factory = pipeline_factory.build_knobs_pipeline_factory(r, renderer, store=store)
    original_recorder = object()   # prethird offer가 세팅했을 기존 recorder(교체 대상)
    sess = types.SimpleNamespace(
        video_track=_Track(), audio_track=_Track(),
        persona_messages=[{"role": "system", "content": "P"}],
        se_path="/se", clone_id=9055, face_path="/f.jpg", video_path=None,
        recorder=original_recorder,
    )
    factory(sess)
    assert isinstance(sess.recorder, StoreRecorder)
    assert sess.recorder is not original_recorder


def test_no_store_leaves_sess_recorder_untouched(monkeypatch):
    captured = {}
    class FakePipeline:
        def __init__(self, **kw): captured.update(kw)
    monkeypatch.setattr(pipeline_factory, "DialoguePipeline", FakePipeline)
    monkeypatch.setattr(pipeline_factory, "_decode_wav", lambda b: (b"", 16000, 1))

    r = KnobsRegistry()
    renderer = types.SimpleNamespace(infer=lambda w, cb, video_path=None: 0)
    factory = pipeline_factory.build_knobs_pipeline_factory(r, renderer)   # store=None(기본)
    original_recorder = object()
    sess = types.SimpleNamespace(
        video_track=_Track(), audio_track=_Track(),
        persona_messages=[{"role": "system", "content": "P"}],
        se_path="/se", clone_id=9055, face_path="/f.jpg", video_path=None,
        recorder=original_recorder,
    )
    factory(sess)
    assert sess.recorder is original_recorder   # 회귀 0 — store 미지정 시 무영향


# ---------------------------------------------------------------------------
# 2026-08-18: batch 모드에서 매 턴 예외로 죽던 버그
#
#   ERROR batch render/TTS failed: _infer_fn() got an unexpected keyword
#         argument 'render_mode'
#
# prethird 는 batch 경로에서 infer_fn(wp, cb, render_mode="batch") 로 부른다
# (pipeline.py:381,592). partial 경로는 그 인자를 안 넘겨서 드러나지 않았다.
# 랩이 감싼 래퍼가 상위 시그니처를 따라가지 못한 전형적 드리프트다
# (_build_body 가 *args/**kwargs 로 포워딩하는 것과 같은 이유).
# ---------------------------------------------------------------------------
import types as _types

from registry import KnobsRegistry as _Reg


def _factory_with_capture(monkeypatch):
    captured, seen = {}, {}

    class FakePipeline:
        def __init__(self, **kw):
            captured.update(kw)

    def _infer(wav, cb, **kw):
        seen.update(kw)
        return 7

    monkeypatch.setattr(pipeline_factory, "DialoguePipeline", FakePipeline)
    monkeypatch.setattr(pipeline_factory, "_decode_wav", lambda b: (b"", 16000, 1))
    renderer = _types.SimpleNamespace(infer=_infer)
    f = pipeline_factory.build_knobs_pipeline_factory(_Reg(), renderer)
    sess = _types.SimpleNamespace(
        video_track=None, audio_track=None, persona_messages=[],
        se_path=None, clone_id=None, face_path="/clone/face.jpg", video_path=None,
        filler_player=None,
    )
    f(sess)
    return captured["infer_fn"], seen


def test_infer_fn이_render_mode를_그대로_넘긴다(monkeypatch):
    """batch 경로가 넘기는 키워드를 삼키면 매 턴 TypeError 로 죽는다."""
    infer_fn, seen = _factory_with_capture(monkeypatch)
    assert infer_fn(b"w", None, render_mode="batch") == 7
    assert seen["render_mode"] == "batch"


def test_infer_fn이_모르는_키워드도_포워딩한다(monkeypatch):
    """상위 시그니처가 또 늘어나도 랩이 병목이 되지 않게 한다."""
    infer_fn, seen = _factory_with_capture(monkeypatch)
    infer_fn(b"w", None, phase_token="tok", 미래인자=1)
    assert seen["phase_token"] == "tok" and seen["미래인자"] == 1


def test_업로드_소스는_랩이_최종_결정한다(monkeypatch):
    """호출자가 video_path 를 줘도 랩의 override 가 이겨야 한다."""
    infer_fn, seen = _factory_with_capture(monkeypatch)
    infer_fn(b"w", None, video_path="/caller/other.jpg", render_mode="batch")
    assert seen["video_path"] == "/clone/face.jpg"
