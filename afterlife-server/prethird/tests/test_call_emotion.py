"""AFL-1067 통화 감정 태그 — 지시문 · 스트리밍 태그 제거 · TTS 에 emotion 파라미터."""
import asyncio
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import tts_client  # noqa: E402
from pipeline import DialoguePipeline  # noqa: E402


def _run(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


class _T:
    def push_ndarray(self, a): pass
    def push_pcm_int16(self, p): pass
    def signal_end(self): pass
    def begin_response(self): pass


def _make(tokens, said, captured):
    async def chat_fn(messages):
        captured.append(messages)
        for tok in tokens:
            yield tok

    async def say_fn(text, se_path, lang=None, emotion=None):
        said.append((text, lang, emotion))
        return b"WAV"

    return DialoguePipeline(
        _T(), _T(), chat_fn, say_fn,
        lambda b: (np.zeros(480, dtype=np.int16), 48000, 1),
        lambda p, cb: (cb(np.zeros((4, 4, 3), dtype=np.uint8)), 1)[1],
        persona_messages=[{"role": "system", "content": "너는 클론"}],
    )


def test_감정_지시문은_언어규칙과_같은_메시지에(monkeypatch):
    monkeypatch.delenv("PRETHIRD_EMO_TAG", raising=False)
    said, cap = [], []
    pipe = _make(["<lang=ko><emo=sad>", "보고 싶었어."], said, cap)
    pipe.user_lang = "ko"
    _run(pipe.say("안녕"))
    rule = cap[0][-2]
    assert rule["role"] == "system" and "<lang=" in rule["content"] and "<emo=" in rule["content"]


def test_감정_지시문_env_로_끔(monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_TAG", "0")
    said, cap = [], []
    pipe = _make(["<lang=ko>", "응."], said, cap)
    pipe.user_lang = "ko"
    _run(pipe.say("안녕"))
    assert "<emo=" not in cap[0][-2]["content"]


def test_스트리밍_감정태그는_tts_와_기록에서_빠지고_emotion_으로_전달():
    said, cap = [], []
    pipe = _make(["<lang=ko>", "<emo=", "warm>", "괜찮아.", " 내가 있잖아."], said, cap)
    pipe.user_lang = "ko"
    rec = []
    pipe._history.record = lambda u, a: rec.append(a)
    _run(pipe.say("힘들어"))
    assert said, "TTS 호출이 있어야 한다"
    assert all("<emo" not in t for t, _, _ in said)
    assert all(emo == "warm" for _, _, emo in said)
    assert rec and "<emo" not in rec[-1]


def test_태그_없으면_neutral():
    said, cap = [], []
    pipe = _make(["응,", " 알겠어."], said, cap)
    _run(pipe.say("안녕"))
    assert said and all(emo == "neutral" for _, _, emo in said)


def test_다음_답에_이전_감정이_남지_않음():
    said, cap = [], []
    pipe = _make(["<lang=ko><emo=sad>", "그랬구나."], said, cap)
    pipe.user_lang = "ko"
    _run(pipe.say("슬퍼"))
    toks = ["<lang=ko>", "응."]

    async def chat2(messages):
        for t in toks:
            yield t
    pipe.chat_fn = chat2
    said.clear()
    _run(pipe.say("이제 괜찮아"))
    assert said and all(emo == "neutral" for _, _, emo in said)


def test_say_fn_lang_만_받는_가짜도_그대로_동작():
    said = []

    async def chat_fn(messages):
        yield "<lang=ko><emo=happy>좋아!"

    async def say_fn(text, se_path, lang=None):
        said.append((text, lang))
        return b"WAV"

    pipe = DialoguePipeline(
        _T(), _T(), chat_fn, say_fn,
        lambda b: (np.zeros(480, dtype=np.int16), 48000, 1),
        lambda p, cb: (cb(np.zeros((4, 4, 3), dtype=np.uint8)), 1)[1],
        persona_messages=[],
    )
    pipe.user_lang = "ko"
    _run(pipe.say("안녕"))
    assert said and "<emo" not in said[0][0]


def test_tts_client_emotion_본문에_실음(monkeypatch):
    bodies = []

    class _Resp:
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        def raise_for_status(self): pass
        async def read(self): return b"WAV"

    class _Sess:
        def __init__(self, *a, **k): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        def post(self, url, json=None):
            bodies.append(json)
            return _Resp()

    monkeypatch.setattr(tts_client.aiohttp, "ClientSession", _Sess)
    _run(tts_client.say("안녕", "x/se.pth", lang="ko", emotion="sad"))
    _run(tts_client.say("안녕", "x/se.pth", lang="ko"))
    assert bodies[0]["emotion"] == "sad"
    assert "emotion" not in bodies[1]


def test_speak_은_직전_답_감정을_물려받지_않음():
    said, cap = [], []
    pipe = _make(["<lang=ko><emo=angry>", "야, 그만해."], said, cap)
    pipe.user_lang = "ko"
    _run(pipe.say("시끄러워"))
    assert said and all(emo == "angry" for _, _, emo in said)
    said.clear()
    _run(pipe.speak("공지 안내입니다."))
    assert said and all(emo == "neutral" for _, _, emo in said)
