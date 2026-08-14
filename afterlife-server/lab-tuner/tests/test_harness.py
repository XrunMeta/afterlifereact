import asyncio
import harness
from registry import KnobsRegistry
from knobs import DialogueKnobs

def test_build_chat_fn_passes_knobs(monkeypatch):
    captured = {}
    async def fake_stream(messages, model=None, temperature=None, num_predict=None):
        captured["model"] = model
        captured["temperature"] = temperature
        captured["num_predict"] = num_predict
        yield "hi"
    monkeypatch.setattr(harness, "chat_stream", fake_stream)
    r = KnobsRegistry()
    r.update({"dialogue": {"model": "gemma3:4b", "temperature": 0.9}})
    fn = harness.build_chat_fn(r)

    async def run():
        return [t async for t in fn([{"role": "user", "content": "x"}])]
    out = asyncio.run(run())
    assert out == ["hi"]
    # num_predict 는 미지정(None) → ollama 서버 기본을 그대로 쓴다(회귀 0).
    assert captured == {"model": "gemma3:4b", "temperature": 0.9, "num_predict": None}

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

def test_build_say_fn_speed_comma_decimal_normalized(monkeypatch):
    """한국 키보드 흔한 실수: speed="1,2"(쉼표 소수점) → 1.2 로 정규화, say 안 죽음."""
    posts = {}
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: _FakeSession(posts))
    r = KnobsRegistry()
    r.update({"tts": {"engine": "qwen", "speed": "1,2"}})
    fn = harness.build_say_fn(r)
    out = asyncio.run(fn("안녕", "/se/path"))
    assert out == b"WAVBYTES"
    assert posts["json"]["speed"] == 1.2

def test_build_say_fn_speed_unparseable_falls_back_to_default(monkeypatch):
    """speed 가 완전히 파싱 불가("abc")면 기본값 1.0 으로 fallback, say 안 죽음."""
    posts = {}
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: _FakeSession(posts))
    r = KnobsRegistry()
    r.update({"tts": {"engine": "qwen", "speed": "abc"}})
    fn = harness.build_say_fn(r)
    out = asyncio.run(fn("안녕", "/se/path"))
    assert out == b"WAVBYTES"
    assert posts["json"]["speed"] == 1.0

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

def test_미지정_노브는_body에_안_실린다():
    """None(미지정) 노브를 실어 보내면 컨테이너 env 기본을 덮어버린다 — 회귀 0 위반.

    입모양·눈머리 노브는 기본이 None 이므로 아무것도 안 건드린 상태에서는
    /render body 에 키 자체가 없어야 한다.
    """
    from harness import KnobsFifthInproc
    r = KnobsRegistry()
    f = KnobsFifthInproc("/vid.jpg", registry=r, render_url="http://127.0.0.1:8810")
    body = f._build_body("/w.wav", "/v.jpg")
    for key in ("lip_open", "lip_closed", "sigma", "gamma", "offset", "silence",
                "lip_lock", "source_face_lock", "source_face_lock_full",
                "eyes_open_lock", "head_sway_amp", "head_yaw_offset", "fps"):
        assert key not in body, f"미지정인데 실렸다: {key}"
    # 명시 기본값을 가진 6종은 그대로 실린다(기존 동작).
    assert body["blink"] is True
    assert body["jpeg_quality"] == 90

def test_지정한_입모양_노브는_실린다():
    from harness import KnobsFifthInproc
    r = KnobsRegistry()
    r.update({"fifth": {"lip_open": 0.3, "sigma": 1.5, "offset": 3,
                        "source_face_lock": True}})
    f = KnobsFifthInproc("/vid.jpg", registry=r, render_url="http://127.0.0.1:8810")
    body = f._build_body("/w.wav", "/v.jpg")
    assert body["lip_open"] == 0.3
    assert body["sigma"] == 1.5
    assert body["offset"] == 3
    assert body["source_face_lock"] is True
    assert "gamma" not in body        # 안 건드린 건 여전히 미전송

def test_false_는_미지정이_아니다():
    """bool 노브를 False 로 명시하면 반드시 실려야 한다(None 과 구분)."""
    from harness import KnobsFifthInproc
    r = KnobsRegistry()
    r.update({"fifth": {"lip_lock": False, "source_face_lock": False}})
    f = KnobsFifthInproc("/vid.jpg", registry=r, render_url="http://127.0.0.1:8810")
    body = f._build_body("/w.wav", "/v.jpg")
    assert body["lip_lock"] is False
    assert body["source_face_lock"] is False

def test_0_은_미지정이_아니다():
    """숫자 0 이 falsy 라고 걸러지면 안 된다 — is None 으로만 판정해야 한다."""
    from harness import KnobsFifthInproc
    r = KnobsRegistry()
    r.update({"fifth": {"head_yaw_offset": 0, "lip_closed": 0.0}})
    f = KnobsFifthInproc("/vid.jpg", registry=r, render_url="http://127.0.0.1:8810")
    body = f._build_body("/w.wav", "/v.jpg")
    assert body["head_yaw_offset"] == 0
    assert body["lip_closed"] == 0.0

def test_cosyvoice_엔진_url():
    """라이브 TTS(:8203) 로 보낼 수 있어야 한다."""
    assert harness._ENGINE_URLS["cosyvoice"] == "http://127.0.0.1:8203"

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

def test_build_say_fn_openvoice_excludes_gen_params(monkeypatch):
    """gen params(_GEN_KEYS)는 qwen 전용 — openvoice(8200) 선택 시 body에 실리면 422 위험.
    engine=openvoice 이면 temperature 등을 설정해도 body에 실리지 않아야 한다."""
    posts = {}
    monkeypatch.setattr(harness.aiohttp, "ClientSession", lambda: _FakeSession(posts))
    r = KnobsRegistry()
    r.update({"tts": {"engine": "openvoice", "temperature": 0.6, "top_p": 0.9}})
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

def test_max_response_tokens가_num_predict로_전달된다(monkeypatch):
    """노브만 있고 배선이 없으면 UI 에서 바꿔도 아무 일이 안 일어난다."""
    captured = {}

    async def fake_stream(messages, model=None, temperature=None, num_predict=None):
        captured["num_predict"] = num_predict
        yield "hi"

    monkeypatch.setattr(harness, "chat_stream", fake_stream)
    r = KnobsRegistry()
    r.update({"dialogue": {"max_response_tokens": 120}})
    fn = harness.build_chat_fn(r)

    async def run():
        return [t async for t in fn([{"role": "user", "content": "x"}])]
    asyncio.run(run())
    assert captured["num_predict"] == 120

def test_last_sent_에_전송값이_기록된다():
    """UI 가 "실제로 뭐가 갔는지" 를 보여주려면 마지막 전송값이 기록돼야 한다."""
    from harness import KnobsFifthInproc
    KnobsFifthInproc.last_sent = None      # 클래스 변수라 테스트 간 오염 방지
    r = KnobsRegistry()
    r.update({"fifth": {"lip_open": 0.44, "sigma": 1.7}})
    f = KnobsFifthInproc("/vid.jpg", registry=r, render_url="http://x")
    assert KnobsFifthInproc.last_sent is None      # 렌더 전에는 없음
    f._build_body("/w.wav", "/v.jpg")
    assert KnobsFifthInproc.last_sent["params"]["lip_open"] == 0.44
    assert KnobsFifthInproc.last_sent["params"]["sigma"] == 1.7
    assert KnobsFifthInproc.last_sent["at"] > 0

def test_last_sent_는_매_렌더마다_갱신된다():
    from harness import KnobsFifthInproc
    KnobsFifthInproc.last_sent = None
    r = KnobsRegistry()
    f = KnobsFifthInproc("/vid.jpg", registry=r, render_url="http://x")
    r.update({"fifth": {"lip_open": 0.1}})
    f._build_body("/w.wav", "/v.jpg")
    first = dict(KnobsFifthInproc.last_sent["params"])
    r.update({"fifth": {"lip_open": 0.8}})
    f._build_body("/w.wav", "/v.jpg")
    assert first["lip_open"] == 0.1
    assert KnobsFifthInproc.last_sent["params"]["lip_open"] == 0.8

def test_last_sent_는_다른_인스턴스_전송도_잡는다():
    """replay 는 통화 경로와 다른 렌더러 인스턴스를 새로 만든다 — 그래도 UI 에 보여야 한다."""
    from harness import KnobsFifthInproc
    KnobsFifthInproc.last_sent = None
    r = KnobsRegistry()
    r.update({"fifth": {"lip_open": 0.33}})
    other = KnobsFifthInproc("/other.jpg", registry=r, render_url="http://x")
    other._build_body("/w.wav", "/v.jpg")
    # 전혀 다른 인스턴스에서 조회해도 보인다
    watcher = KnobsFifthInproc("/watch.jpg", registry=r, render_url="http://x")
    assert watcher.last_sent["params"]["lip_open"] == 0.33
