"""AFL-1034 통화 다국어 — 답 언어 규칙 · 스트리밍 태그 제거 · 언어별 TTS 분기."""
import asyncio

import numpy as np

import tts_client
from clone_dialog.lang_tag import CALL_LANGS, lang_instruction
from pipeline import DialoguePipeline

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

    async def say_fn(text, se_path, lang=None):
        said.append((text, lang))
        return b"WAV"

    def decode_wav_fn(b):
        return np.zeros(480, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame):
        on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 1

    return DialoguePipeline(
        _T(), _T(), chat_fn, say_fn, decode_wav_fn, infer_fn,
        persona_messages=[{"role": "system", "content": "너는 클론"}],
    )

def test_구앱은_언어규칙_없음_태그없으면_ko():
    said, cap = [], []
    pipe = _make(["응,", " 알겠어."], said, cap)
    _run(pipe.say("안녕"))
    assert cap[0] == [{"role": "system", "content": "너는 클론"}, {"role": "user", "content": "안녕"}]
    assert said and all(lang == "ko" for _, lang in said)

def test_user_lang_있으면_규칙이_이번말_바로앞():
    said, cap = [], []
    pipe = _make(["<lang=en>", "Hi", " there."], said, cap)
    pipe.user_lang = "en"
    _run(pipe.say("hello"))
    msgs = cap[0]
    assert msgs[-1] == {"role": "user", "content": "hello"}
    assert msgs[-2]["role"] == "system" and "<lang=" in msgs[-2]["content"]

def test_스트리밍_태그는_tts_와_기록에서_빠지고_언어로_분기():
    said, cap = [], []
    pipe = _make(["<la", "ng=es>", "¡Hola", "! ¿Qué tal?"], said, cap)
    pipe.user_lang = "en"
    rec = []
    pipe._history.record = lambda u, a: rec.append(a)
    _run(pipe.say("hola"))
    assert said, "TTS 호출이 있어야 한다"
    assert all("<lang" not in t for t, _ in said)
    assert all(lang == "es" for _, lang in said)
    assert rec and "<lang" not in rec[-1] and rec[-1].startswith("¡Hola")

def test_say_fn_2인자_가짜도_그대로_동작():
    said = []

    async def chat_fn(messages):
        yield "<lang=ja>こんにちは。"

    async def say_fn(text, se_path):
        said.append(text)
        return b"WAV"

    pipe = DialoguePipeline(
        _T(), _T(), chat_fn, say_fn,
        lambda b: (np.zeros(480, dtype=np.int16), 48000, 1),
        lambda p, cb: (cb(np.zeros((4, 4, 3), dtype=np.uint8)), 1)[1],
        persona_messages=[],
    )
    pipe.user_lang = "ja"
    _run(pipe.say("こんにちは"))
    assert said and "<lang" not in said[0]

def test_통화_언어규칙은_지원언어만_밖이면_영어():
    txt = lang_instruction("id", CALL_LANGS)
    assert "`en`" in txt
    assert "ko·en·ja·zh·es" in txt
    assert "`ja`" in lang_instruction("ja-JP", CALL_LANGS)

def test_tts_url_언어별_env(monkeypatch):
    monkeypatch.setenv("PRETHIRD_TTS_URL_ES", "http://127.0.0.1:8205")
    monkeypatch.delenv("PRETHIRD_TTS_URL_EN", raising=False)
    assert tts_client.tts_url_for("es") == "http://127.0.0.1:8205"
    assert tts_client.tts_url_for("en") == tts_client.TTS_URL
    assert tts_client.tts_url_for(None) == tts_client.TTS_URL
