import asyncio
import harness
from registry import KnobsRegistry
from knobs import DialogueKnobs

def test_build_chat_fn_passes_knobs(monkeypatch):
    captured = {}
    async def fake_stream(messages, model=None, temperature=None):
        captured["model"] = model
        captured["temperature"] = temperature
        yield "hi"
    monkeypatch.setattr(harness, "chat_stream", fake_stream)
    r = KnobsRegistry()
    r.update({"dialogue": {"model": "gemma3:4b", "temperature": 0.9}})
    fn = harness.build_chat_fn(r)

    async def run():
        return [t async for t in fn([{"role": "user", "content": "x"}])]
    out = asyncio.run(run())
    assert out == ["hi"]
    assert captured == {"model": "gemma3:4b", "temperature": 0.9}

def test_apply_persona_knobs_prepends_override():
    base = [{"role": "system", "content": "persona"}]
    dk = DialogueKnobs(system_override="너는 테스트다")
    out = harness.apply_persona_knobs(base, dk)
    assert out[0] == {"role": "system", "content": "너는 테스트다"}
    assert out[1:] == base

def test_apply_persona_knobs_noop_when_none():
    base = [{"role": "system", "content": "persona"}]
    assert harness.apply_persona_knobs(base, DialogueKnobs()) == base

def test_build_say_fn_engine_url_and_speed(monkeypatch):
    posts = {}
    class FakeResp:
        status = 200
        def raise_for_status(self): pass
        async def read(self): return b"WAVBYTES"
        async def __aenter__(self): return self
        async def __aexit__(self, *a): pass
    class FakeSession:
        async def __aenter__(self): return self
        async def __aexit__(self, *a): pass
        def post(self, url, json):
            posts["url"] = url; posts["json"] = json
            return FakeResp()
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: FakeSession())
    r = KnobsRegistry()
    r.update({"tts": {"engine": "qwen", "speed": 1.3}})
    fn = harness.build_say_fn(r)
    out = asyncio.run(fn("안녕", "/se/path"))
    assert out == b"WAVBYTES"
    assert posts["url"] == "http://127.0.0.1:8201/tts/kr"
    assert posts["json"]["speed"] == 1.3
    assert posts["json"]["se_path"] == "/se/path"
