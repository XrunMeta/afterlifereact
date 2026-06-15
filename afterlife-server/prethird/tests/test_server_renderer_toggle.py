import sys
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
