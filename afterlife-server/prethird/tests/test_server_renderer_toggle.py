import sys
import types
import pathlib
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import server


def test_default_renderer_is_musetalk(monkeypatch):
    monkeypatch.delenv("PRETHIRD_RENDERER", raising=False)
    assert server._select_renderer_name() == "musetalk"


def test_fifth_renderer_when_env_set(monkeypatch):
    monkeypatch.setenv("PRETHIRD_RENDERER", "fifth")
    assert server._select_renderer_name() == "fifth"


def test_unknown_renderer_falls_back_to_musetalk(monkeypatch):
    monkeypatch.setenv("PRETHIRD_RENDERER", "bogus")
    assert server._select_renderer_name() == "musetalk"


def test_build_renderer_dispatches(monkeypatch):
    calls = {}

    def _fake_mt(vp):
        calls["mt"] = vp
        return "MT"

    def _fake_f5(vp):
        calls["f5"] = vp
        return "F5"

    monkeypatch.setattr(server, "_make_musetalk", _fake_mt)
    monkeypatch.setattr(server, "_make_fifth", _fake_f5)
    assert server._build_renderer("musetalk", "/v.mp4") == "MT"
    assert server._build_renderer("fifth", "/v.mp4") == "F5"
    assert calls == {"mt": "/v.mp4", "f5": "/v.mp4"}


# --------------------------------------------------------------------------
# 통합 테스트: _build_pipeline_factory가 _build_renderer를 올바른 name으로 호출
#
# 방식: _build_renderer monkeypatch
#   factory 내부에 clone_dialog/tts_client/pipeline heavy import가 있으므로
#   test_say_wiring 패턴처럼 해당 모듈 stub도 필요하나,
#   _build_renderer 자체를 mock해두면 "토글 결과가 factory에 실제 연결됨"을
#   깔끔하게 검증할 수 있음 — factory 반환값 존재 + renderer_name 전달 확인.
# --------------------------------------------------------------------------

def _stub_heavy_imports(monkeypatch):
    """clone_dialog/tts_client/audio_utils/pipeline — factory 내부 heavy import stub."""
    for mod_name in ("clone_dialog", "tts_client", "audio_utils"):
        fake_mod = types.ModuleType(mod_name)
        fake_mod.chat_stream = None  # type: ignore[attr-defined]
        fake_mod.say = None  # type: ignore[attr-defined]
        fake_mod._decode_wav = None  # type: ignore[attr-defined]
        monkeypatch.setitem(sys.modules, mod_name, fake_mod)

    fake_pipeline_mod = types.ModuleType("pipeline")

    class _FakePipeline:
        def __init__(self, **kw):
            pass

    fake_pipeline_mod.DialoguePipeline = _FakePipeline  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "pipeline", fake_pipeline_mod)

    import importlib
    importlib.reload(server)


def test_factory_uses_fifth_when_env_set(monkeypatch):
    """PRETHIRD_RENDERER=fifth → _build_pipeline_factory 가 _build_renderer("fifth", ...) 호출."""
    monkeypatch.setenv("PRETHIRD_RENDERER", "fifth")
    monkeypatch.setenv("PRETHIRD_REFERENCE_VIDEO", "/fake/ref.mp4")

    _stub_heavy_imports(monkeypatch)

    build_renderer_calls: list[tuple] = []

    class FakeRenderer:
        def infer(self, *a, **kw): ...

    def _fake_build_renderer(name: str, vp: str):
        build_renderer_calls.append((name, vp))
        return FakeRenderer()

    monkeypatch.setattr(server, "_build_renderer", _fake_build_renderer)

    factory = server._build_pipeline_factory()

    assert factory is not None, "_build_pipeline_factory가 None 반환 (REFERENCE_VIDEO 세팅 확인)"
    assert len(build_renderer_calls) == 1, "_build_renderer 가 정확히 1회 호출돼야 함"
    assert build_renderer_calls[0][0] == "fifth", (
        f"renderer_name 불일치: 기대=fifth, 실제={build_renderer_calls[0][0]!r}"
    )


def test_factory_uses_musetalk_by_default(monkeypatch):
    """PRETHIRD_RENDERER 미설정 → _build_pipeline_factory 가 _build_renderer("musetalk", ...) 호출."""
    monkeypatch.delenv("PRETHIRD_RENDERER", raising=False)
    monkeypatch.setenv("PRETHIRD_REFERENCE_VIDEO", "/fake/ref.mp4")

    _stub_heavy_imports(monkeypatch)

    build_renderer_calls: list[tuple] = []

    class FakeRenderer:
        def infer(self, *a, **kw): ...

    def _fake_build_renderer(name: str, vp: str):
        build_renderer_calls.append((name, vp))
        return FakeRenderer()

    monkeypatch.setattr(server, "_build_renderer", _fake_build_renderer)

    factory = server._build_pipeline_factory()

    assert factory is not None, "_build_pipeline_factory가 None 반환 (REFERENCE_VIDEO 세팅 확인)"
    assert len(build_renderer_calls) == 1, "_build_renderer 가 정확히 1회 호출돼야 함"
    assert build_renderer_calls[0][0] == "musetalk", (
        f"renderer_name 불일치: 기대=musetalk, 실제={build_renderer_calls[0][0]!r}"
    )
