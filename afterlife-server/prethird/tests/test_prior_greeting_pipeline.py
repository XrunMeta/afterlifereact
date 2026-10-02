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
    assert any(m["role"] == "system" and "다음 주에 딴다" in m["content"] for m in captured[0])


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
