"""AFL-926 — 이전 대화 주입 + 대안 B(LLM 인사 prerender → greet 가 캐시 사용)."""
import asyncio, sys, pathlib
import numpy as np
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from pipeline import DialoguePipeline, GREETING_PROMPT, GREETING_PROMPT_WITH_PRIOR

PRIOR = [{"callId": "c1", "role": "user", "text": "고추 언제 따요?", "at": 1_759_280_400_000},
         {"callId": "c1", "role": "clone", "text": "다음 주에 딴다", "at": 1_759_280_401_000}]


class _Track:
    def __init__(self):
        self.frames, self.pcm, self.ended = [], [], False
    def push_ndarray(self, arr): self.frames.append(arr)
    def push_pcm_int16(self, pcm): self.pcm.append(pcm)
    def signal_end(self): self.ended = True
    # 실제 트랙(media_tracks.py)의 인터페이스 합집합 — 좁은 목킹은 드리프트를 삼킨다.
    def begin_response(self): pass
    def queue_depth(self): return 0
    def flush(self): return 0


def _make(captured, reply=("반갑다", " 민수야.")):
    async def chat_fn(messages):
        captured.append(messages)
        for tok in reply:
            yield tok
    async def say_fn(text, se_path):
        return b"WAVDATA"
    def decode_wav_fn(b):
        return np.zeros(480, dtype=np.int16), 48000, 1
    def infer_fn(wav_path, on_frame):
        on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 1
    vt, at = _Track(), _Track()
    pipe = DialoguePipeline(vt, at, chat_fn, say_fn, decode_wav_fn, infer_fn,
                            persona_messages=[{"role": "system", "content": "너는 클론"}])
    return pipe, vt, at


@pytest.fixture(autouse=True)
def _no_bridge_delay(monkeypatch):
    # T-824/845 Bridge 대기(기본 3+8+2초)는 이 테스트의 관심사가 아니다.
    for k in ("PRETHIRD_BRIDGE_GRACE_MS", "PRETHIRD_BRIDGE_DURATION_MS",
              "PRETHIRD_POST_BRIDGE_DELAY_MS"):
        monkeypatch.setenv(k, "0")


@pytest.fixture
def prior_on(monkeypatch):
    async def _fetch(user_id, clone_id, exclude_call_id=None):
        return PRIOR
    import prior_conversation
    monkeypatch.setattr(prior_conversation, "fetch_prior_turns", _fetch)
    monkeypatch.setenv("PRETHIRD_GREETING_ENABLED", "1")


@pytest.mark.asyncio
async def test_llm_prerender_greeting_uses_prior_and_greet_pushes_cache(prior_on):
    captured = []
    pipe, vt, at = _make(captured)
    pipe._prior_task = asyncio.ensure_future(pipe.load_prior(7, 9, "abcdef012345"))
    pipe.start_prerender_greeting(None)
    first_audio = []
    await pipe.greet(on_first_audio=lambda: first_audio.append(1))

    assert len(captured) == 1                     # LLM 은 prerender 에서 1번만
    msgs = captured[0]
    assert msgs[-1] == {"role": "user", "content": GREETING_PROMPT_WITH_PRIOR}
    assert any(m["role"] == "system" and "고추 언제 따요?" in m["content"] for m in msgs)
    assert first_audio == [1]                     # speech_start·과금 시작 신호
    assert vt.frames and at.ended
    # 인사는 히스토리에 남아 다음 턴에 또 인사하지 않는다
    assert {"role": "assistant", "content": "반갑다 민수야."} in pipe._history.messages() \
        or pipe._history.max_turns == 0


@pytest.mark.asyncio
async def test_greet_enabled_say_does_not_eat_cache(prior_on, monkeypatch):
    """T-820 '두 답변 사고' 회귀 방지: greet 가 켜져 있으면 캐시는 첫 say 의 대답이 아니다."""
    captured = []
    pipe, vt, at = _make(captured)
    await pipe.prerender_greeting("안녕! 반가워.")        # 캐시 준비(greet 아직 안 옴)
    assert pipe._prerender_ready
    await pipe.say("할아버지")
    assert len(captured) == 1 and captured[0][-1] == {"role": "user", "content": "할아버지"}


@pytest.mark.asyncio
async def test_legacy_greeting_disabled_say_uses_cache(monkeypatch):
    monkeypatch.setenv("PRETHIRD_GREETING_ENABLED", "0")
    captured = []
    pipe, vt, at = _make(captured)
    await pipe.prerender_greeting("안녕! 반가워.")
    await pipe.say("여보세요")
    assert captured == []                          # LLM 안 부르고 캐시로 대답(기존 T-820)
    assert pipe._prerender_used


@pytest.mark.asyncio
async def test_greet_falls_back_to_llm_when_prerender_slow(prior_on, monkeypatch):
    monkeypatch.setenv("PRETHIRD_PRERENDER_WAIT_S", "0.05")
    captured = []
    pipe, vt, at = _make(captured)

    async def _slow(text):
        await asyncio.sleep(0.3)
        await DialoguePipeline.prerender_greeting(pipe, "늦은 인사")
    pipe._prerender_task = asyncio.ensure_future(_slow(None))

    await pipe.greet()
    assert captured[-1][-1] == {"role": "user", "content": GREETING_PROMPT}   # prior 없음
    await asyncio.sleep(0.4)                       # 늦게 끝난 prerender
    n = len(captured)
    await pipe.say("그래서요?")
    assert len(captured) == n + 1                  # say 는 캐시가 아니라 LLM 으로 대답


@pytest.mark.asyncio
async def test_say_waits_for_prior_and_includes_it(prior_on):
    captured = []
    pipe, vt, at = _make(captured)

    async def _slow_load():
        await asyncio.sleep(0.05)
        await pipe.load_prior(7, 9)
    pipe._prior_task = asyncio.ensure_future(_slow_load())
    await pipe.say("고추 얘기 기억나요?")
    prior_sys = [m["content"] for m in captured[0] if m["role"] == "system" and "<prior_transcript>" in m["content"]]
    assert prior_sys, "이전 대화가 프롬프트에 없다"
    # AFL-926: 상대 말만 넣고 클론의 지난 말은 넣지 않는다(예전 말버릇 재생산 방지).
    assert "다음 주에 딴다" not in prior_sys[0]


@pytest.mark.asyncio
async def test_prerender_llm_failure_falls_back_to_fixed_text(prior_on, monkeypatch):
    monkeypatch.setenv("PRETHIRD_PRERENDER_TEXT", "여보세요?")
    pipe, vt, at = _make([])

    async def _broken(messages):
        raise RuntimeError("llm down")
        yield  # pragma: no cover
    pipe.chat_fn = _broken
    await pipe.prerender_greeting(None)
    assert pipe._prerender_ready and pipe._prerender_text == "여보세요?"


@pytest.mark.asyncio
async def test_cancel_background_and_react_blocks_cache(prior_on):
    pipe, vt, at = _make([])

    async def _forever():
        await asyncio.sleep(10)
    pipe._prior_task = asyncio.ensure_future(_forever())
    pipe._prerender_task = asyncio.ensure_future(_forever())
    pipe.cancel_background()
    await asyncio.sleep(0)
    assert pipe._prior_task.cancelled() and pipe._prerender_task.cancelled()

    pipe2, _, _ = _make([])
    await pipe2.react("unknown")
    assert pipe2._prerender_used        # react 가 먼저 오면 캐시 인사는 나가지 않는다


@pytest.mark.asyncio
async def test_abandoned_prerender_skips_render(prior_on):
    """(el) greet 가 포기한 뒤엔 TTS 이후 GPU 렌더를 하지 않는다."""
    pipe, vt, at = _make([])
    rendered = []
    orig = pipe._render_to_cache

    async def _spy(*a, **kw):
        rendered.append(1)
        return await orig(*a, **kw)
    pipe._render_to_cache = _spy

    orig_tts = pipe._tts_stage
    async def _tts_then_abandon(text):
        out = await orig_tts(text)
        pipe._prerender_used = True     # TTS 도중 greet 가 포기
        return out
    pipe._tts_stage = _tts_then_abandon
    await pipe.prerender_greeting("여보세요")
    assert rendered == [] and not pipe._prerender_ready


@pytest.mark.asyncio
async def test_say_on_reply_done_fires_before_playback(prior_on):
    """AFL-926: 응답 텍스트는 렌더·push(재생) 전에 통지된다."""
    events = []
    pipe, vt, at = _make([], reply=("고추", " 땄구나."))
    orig_infer = pipe.infer_fn

    def _infer(wav_path, on_frame):
        events.append("render")
        return orig_infer(wav_path, on_frame)
    pipe.infer_fn = _infer
    await pipe.say("나 오늘 고추 땄어", on_reply_done=lambda t: events.append(("done", t)))
    assert events[0] == ("done", "고추 땄구나.")
    assert "render" in events


@pytest.mark.asyncio
async def test_say_on_reply_done_failure_does_not_break_say(prior_on):
    pipe, vt, at = _make([])

    def _boom(_t):
        raise RuntimeError("record failed")
    await pipe.say("안녕", on_reply_done=_boom)
    assert vt.frames and at.ended


# ---- AFL-926 (2026-10-02 4차 실통화): 첫인사 한 문장 강제 ----
from pipeline import first_sentence, GREETING_MAX_CHARS  # noqa: E402


@pytest.mark.parametrize("raw,want", [
    ("오랜만이네, 전에 말하던 그 생각 정리하는 거는 좀 됐어? 아직 얼굴은 안 보이네.",
     "오랜만이네, 전에 말하던 그 생각 정리하는 거는 좀 됐어?"),
    ("고추는 다 땄어?", "고추는 다 땄어?"),
    ("여보세요\n누구세요", "여보세요"),
    ("", ""),
])
def test_first_sentence(raw, want):
    assert first_sentence(raw) == want


def test_first_sentence_caps_length_at_separator():
    raw = "아이고 반갑다 우리 손주 오늘은 날씨도 좋은데 밥은 잘 챙겨 먹었고 학교는 잘 다녀왔나 궁금하다"
    out = first_sentence(raw)
    assert len(out) <= GREETING_MAX_CHARS and raw.startswith(out) and not out.endswith(" ")


@pytest.mark.asyncio
async def test_prerender_greeting_uses_only_first_sentence(prior_on):
    """LLM 이 길게 말해도 인사는 첫 문장만 — 렌더 시간이 곧 연결 대기다."""
    pulled = []
    pipe, vt, at = _make([], reply=("반갑다,", " 고추는 다 땄어?", " 오늘은", " 날씨가", " 좋네."))
    orig = pipe.chat_fn

    async def _counting(messages):
        async for t in orig(messages):
            pulled.append(t)
            yield t
    pipe.chat_fn = _counting
    await pipe.prerender_greeting(None)
    assert pipe._prerender_text == "반갑다, 고추는 다 땄어?"
    assert len(pulled) == 2                  # 첫 문장 뒤 토큰은 받지 않는다
