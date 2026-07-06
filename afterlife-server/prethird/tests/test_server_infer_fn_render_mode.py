"""tests/test_server_infer_fn_render_mode.py — server.py _infer_fn 이
render_mode 를 렌더러로 포워딩하는지 검증 (T-113 Task6, plan gap 보강).

배경: pipeline.py `_run_batch`(Task5)는 `infer_fn(wav, cb, render_mode="batch")`
로 호출하지만, 실제 프로덕션 `infer_fn` — server.py `_build_pipeline_factory`
내부 `_infer_fn` closure — 는 그 값을 renderer.infer 로 전달하지 않았다
(plan 누락 배선). 이 스위트는 그 배선을 고정한다.

- renderer=fifth: render_mode 를 그대로 FifthInproc.infer 로 전달.
  render_mode=None(파라미터 기본값, partial 경로가 kwarg 자체를 안 넘길 때)
  이면 fifth_inproc 계약(Task2)상 body 키 생략 → 현행과 byte-identical.
- renderer=musetalk(등 fifth 아닌 렌더러): render_mode 인자를 받지 않는
  MuseTalkInproc.infer 에 절대 전달하지 않는다(TypeError 방지, batch 는
  fifth 전용) — 값이 있으면 무시하고 로그만 남긴다.

server.py 는 무거운 GPU 의존(clone_dialog/tts_client/pipeline)을 factory
내부에서 import 하므로, test_server_renderer_toggle.py 와 동일하게
sys.modules 스텁 + `_build_renderer` monkeypatch 로 무겁지 않게 단위 검증한다.
"""
from __future__ import annotations

import importlib
import pathlib
import sys
import types

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import server  # noqa: E402


def _stub_heavy_imports(monkeypatch, captured_pipeline_kwargs: dict):
    """clone_dialog/tts_client/audio_utils/pipeline — factory 내부 heavy import stub.

    test_server_renderer_toggle.py 의 _stub_heavy_imports 와 동일 패턴이되,
    DialoguePipeline 생성자에 전달된 kwargs(특히 infer_fn)를
    captured_pipeline_kwargs 에 기록해 테스트에서 꺼내 쓸 수 있게 한다.
    """
    for mod_name in ("clone_dialog", "tts_client", "audio_utils"):
        fake_mod = types.ModuleType(mod_name)
        fake_mod.chat_stream = None  # type: ignore[attr-defined]
        fake_mod.say = None  # type: ignore[attr-defined]
        fake_mod._decode_wav = None  # type: ignore[attr-defined]
        monkeypatch.setitem(sys.modules, mod_name, fake_mod)

    fake_pipeline_mod = types.ModuleType("pipeline")

    class _FakePipeline:
        def __init__(self, **kw):
            captured_pipeline_kwargs.update(kw)

    fake_pipeline_mod.DialoguePipeline = _FakePipeline  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "pipeline", fake_pipeline_mod)

    importlib.reload(server)


def _make_fake_sess():
    sess = types.SimpleNamespace()
    sess.persona_messages = []
    sess.se_path = None
    sess.clone_id = None
    sess.face_path = None
    sess.video_path = None
    sess.video_track = object()
    sess.audio_track = object()
    return sess


class FakeRenderer:
    """renderer.infer 호출 인자를 캡처하는 가짜 렌더러(fifth 자리)."""

    def __init__(self):
        self.calls: list[dict] = []

    def infer(self, wav, cb, video_path=None, render_mode=None):
        self.calls.append({"wav": wav, "video_path": video_path, "render_mode": render_mode})
        return 0


class FakeMusetalkRenderer:
    """render_mode 인자를 아예 받지 않는 가짜 렌더러(musetalk 자리) — 배선이
    render_mode 를 넘기면 TypeError 로 즉시 드러난다."""

    def __init__(self):
        self.calls: list[dict] = []

    def infer(self, wav, cb, video_path=None):
        self.calls.append({"wav": wav, "video_path": video_path})
        return 0


@pytest.fixture(autouse=True)
def _reload_server_after():
    """다른 테스트 파일의 server 모듈 상태에 영향 주지 않게 마지막에 원복 reload."""
    yield
    importlib.reload(server)


def test_infer_fn_forwards_render_mode_to_fifth(monkeypatch):
    monkeypatch.setenv("PRETHIRD_RENDERER", "fifth")
    monkeypatch.setenv("PRETHIRD_REFERENCE_VIDEO", "/fake/ref.mp4")

    captured: dict = {}
    _stub_heavy_imports(monkeypatch, captured)

    fake_renderer = FakeRenderer()
    monkeypatch.setattr(server, "_build_renderer", lambda name, vp: fake_renderer)

    factory = server._build_pipeline_factory()
    assert factory is not None
    factory(_make_fake_sess())

    infer_fn = captured["infer_fn"]
    infer_fn("/tmp/x.wav", lambda f: None, render_mode="batch")
    assert fake_renderer.calls[-1]["render_mode"] == "batch"


def test_infer_fn_none_render_mode_is_byte_identical_for_fifth(monkeypatch):
    """[회귀 0] partial 경로는 render_mode kwarg 자체를 안 넘긴다 → _infer_fn
    기본값 None 이 쓰이고, fifth 로도 render_mode=None 그대로 전달돼
    fifth_inproc 계약(Task2)상 body 키 생략과 동일해진다."""
    monkeypatch.setenv("PRETHIRD_RENDERER", "fifth")
    monkeypatch.setenv("PRETHIRD_REFERENCE_VIDEO", "/fake/ref.mp4")

    captured: dict = {}
    _stub_heavy_imports(monkeypatch, captured)

    fake_renderer = FakeRenderer()
    monkeypatch.setattr(server, "_build_renderer", lambda name, vp: fake_renderer)

    factory = server._build_pipeline_factory()
    factory(_make_fake_sess())

    infer_fn = captured["infer_fn"]
    infer_fn("/tmp/x.wav", lambda f: None)  # partial 경로와 동일하게 render_mode 미전달
    assert fake_renderer.calls[-1]["render_mode"] is None


def test_infer_fn_ignores_render_mode_for_musetalk(monkeypatch):
    """renderer=musetalk 이면 render_mode 를 절대 renderer.infer 로 넘기지
    않는다 — 넘기면 FakeMusetalkRenderer.infer 가 TypeError 를 던져 이
    테스트가 실패한다(안전 가드 확인)."""
    monkeypatch.delenv("PRETHIRD_RENDERER", raising=False)
    monkeypatch.setenv("PRETHIRD_REFERENCE_VIDEO", "/fake/ref.mp4")

    captured: dict = {}
    _stub_heavy_imports(monkeypatch, captured)

    fake_renderer = FakeMusetalkRenderer()
    monkeypatch.setattr(server, "_build_renderer", lambda name, vp: fake_renderer)

    factory = server._build_pipeline_factory()
    factory(_make_fake_sess())

    infer_fn = captured["infer_fn"]
    # batch 로 잘못 설정돼 있어도 musetalk 은 render_mode 인자가 없어 무시돼야 함
    infer_fn("/tmp/x.wav", lambda f: None, render_mode="batch")
    assert fake_renderer.calls == [{"wav": "/tmp/x.wav", "video_path": None}]


def test_infer_fn_musetalk_default_call_unchanged(monkeypatch):
    """[회귀 0] render_mode 인자를 아예 안 주는 기존 호출부(partial)는
    musetalk 렌더러에서도 현행과 동일하게 동작(video_path 만 전달)."""
    monkeypatch.delenv("PRETHIRD_RENDERER", raising=False)
    monkeypatch.setenv("PRETHIRD_REFERENCE_VIDEO", "/fake/ref.mp4")

    captured: dict = {}
    _stub_heavy_imports(monkeypatch, captured)

    fake_renderer = FakeMusetalkRenderer()
    monkeypatch.setattr(server, "_build_renderer", lambda name, vp: fake_renderer)

    factory = server._build_pipeline_factory()
    factory(_make_fake_sess())

    infer_fn = captured["infer_fn"]
    infer_fn("/tmp/x.wav", lambda f: None)
    assert fake_renderer.calls == [{"wav": "/tmp/x.wav", "video_path": None}]
