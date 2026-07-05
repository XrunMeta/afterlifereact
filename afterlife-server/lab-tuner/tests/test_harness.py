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

def test_knobs_fifth_build_body_injects_per_request():
    from harness import KnobsFifthInproc
    r = KnobsRegistry()
    r.update({"fifth": {"blink": False, "jpeg_quality": 70, "idle_motion_scale": 0.3}})
    f = KnobsFifthInproc("/vid.jpg", registry=r, render_url="http://127.0.0.1:8810")
    body = f._build_body("/w.wav", "/v.jpg")
    assert body["wav_path"] == "/w.wav"
    assert body["video_path"] == "/v.jpg"
    assert body["blink"] is False
    assert body["jpeg_quality"] == 70
    assert body["idle_motion_scale"] == 0.3
    assert body["idle_rms_low"] == 0.05        # 기본 유지
    assert body["head_slew_frames"] == 5       # 기본 유지

class _FakeResp:
    status = 200
    def raise_for_status(self): pass
    async def read(self): return b"WAVBYTES"
    async def __aenter__(self): return self
    async def __aexit__(self, *a): pass

class _FakeSession:
    def __init__(self, posts):
        self._posts = posts
    async def __aenter__(self): return self
    async def __aexit__(self, *a): pass
    def post(self, url, json):
        self._posts["url"] = url
        self._posts["json"] = json
        return _FakeResp()

def test_build_say_fn_openvoice_default_url(monkeypatch):
    posts = {}
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: _FakeSession(posts))
    r = KnobsRegistry()   # 기본 engine=openvoice
    fn = harness.build_say_fn(r)
    asyncio.run(fn("안녕"))
    assert posts["url"] == "http://127.0.0.1:8200/tts/kr"

def test_build_say_fn_url_override_beats_engine(monkeypatch):
    posts = {}
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: _FakeSession(posts))
    r = KnobsRegistry()
    r.update({"tts": {"engine": "qwen", "url": "http://127.0.0.1:9999"}})
    fn = harness.build_say_fn(r)
    asyncio.run(fn("안녕"))
    assert posts["url"] == "http://127.0.0.1:9999/tts/kr"

def test_build_say_fn_denoise_true_includes_key(monkeypatch):
    posts = {}
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: _FakeSession(posts))
    r = KnobsRegistry()
    r.update({"tts": {"denoise": True}})
    fn = harness.build_say_fn(r)
    asyncio.run(fn("안녕"))
    assert posts["json"]["denoise"] is True

def test_build_say_fn_denoise_false_excludes_key(monkeypatch):
    posts = {}
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: _FakeSession(posts))
    r = KnobsRegistry()   # 기본 denoise=False
    fn = harness.build_say_fn(r)
    asyncio.run(fn("안녕"))
    assert "denoise" not in posts["json"]

def test_build_say_fn_text_field_passthrough(monkeypatch):
    posts = {}
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: _FakeSession(posts))
    r = KnobsRegistry()
    fn = harness.build_say_fn(r)
    asyncio.run(fn("안녕"))
    assert posts["json"]["text"] == "안녕"

def test_knobs_fifth_build_body_all_six_and_base_preserved():
    from harness import KnobsFifthInproc
    r = KnobsRegistry()
    r.update({"fifth": {
        "blink": False, "jpeg_quality": 55,
        "idle_motion_scale": 0.4, "idle_rms_low": 0.1,
        "idle_rms_high": 0.6, "head_slew_frames": 9,
    }})
    f = KnobsFifthInproc("/vid.jpg", registry=r, render_url="http://127.0.0.1:8810")
    body = f._build_body("/w.wav", "/v.jpg")
    # base(super()._build_body) 키 보존
    assert body["wav_path"] == "/w.wav"
    assert body["video_path"] == "/v.jpg"
    # PER_REQUEST 6종 전부
    assert body["blink"] is False
    assert body["jpeg_quality"] == 55
    assert body["idle_motion_scale"] == 0.4
    assert body["idle_rms_low"] == 0.1
    assert body["idle_rms_high"] == 0.6
    assert body["head_slew_frames"] == 9

def test_build_say_fn_forwards_gen_params(monkeypatch):
    posts = {}
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: _FakeSession(posts))
    r = KnobsRegistry()
    r.update({"tts": {"engine": "qwen", "temperature": 0.6, "top_p": 0.9}})
    fn = harness.build_say_fn(r)
    asyncio.run(fn("안녕", "/se/path"))
    assert posts["json"]["temperature"] == 0.6
    assert posts["json"]["top_p"] == 0.9
    assert "top_k" not in posts["json"]     # None 필드는 body에서 생략

def test_build_say_fn_omits_none_gen_params(monkeypatch):
    posts = {}
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: _FakeSession(posts))
    r = KnobsRegistry()
    r.update({"tts": {"engine": "qwen"}})   # gen params 전부 None
    fn = harness.build_say_fn(r)
    asyncio.run(fn("안녕", "/se/path"))
    for k in ("temperature", "top_p", "top_k", "repetition_penalty", "max_new_tokens"):
        assert k not in posts["json"]

def test_knobs_fifth_build_body_forwards_extra_kwargs(monkeypatch):
    # 배포 prethird 버전 스큐: FifthInproc.infer 가 phase_token 을 넘길 때
    # 오버라이드가 이를 상위로 포워딩해야 한다(TypeError 방지). knob 은 그대로 얹힘.
    import fifth_inproc
    from harness import KnobsFifthInproc
    recorded = {}

    def fake_super(self, wav, vid, **kw):
        recorded.update(kw)
        return {"wav_path": wav, "video_path": vid}

    monkeypatch.setattr(fifth_inproc.FifthInproc, "_build_body", fake_super)
    r = KnobsRegistry()
    f = KnobsFifthInproc("/v.jpg", registry=r, render_url="http://127.0.0.1:8810")
    body = f._build_body("/w.wav", "/v.jpg", phase_token="TOK")
    assert recorded == {"phase_token": "TOK"}
    assert body["blink"] is True and body["idle_motion_scale"] == 0.15
