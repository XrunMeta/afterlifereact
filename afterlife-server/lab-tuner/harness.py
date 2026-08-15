from __future__ import annotations
import logging
import os
import time
import aiohttp

from clone_dialog import chat_stream          # prethird
from fifth_inproc import FifthInproc          # prethird
from knobs import DialogueKnobs, TtsKnobs, FifthKnobs

log = logging.getLogger("lab-tuner.harness")

def _num(v, default):
    """사용자 입력 숫자 안전 파싱 — 쉼표 소수점(1,2)도 허용, 실패 시 기본값 + 경고."""
    try:
        return float(str(v).replace(",", "."))
    except (ValueError, TypeError):
        log.warning("say: 잘못된 숫자 knob %r → 기본값 %s 사용", v, default)
        return default

def build_chat_fn(registry, metrics=None):
    """registry에서 model/temperature를 매 호출 읽어 chat_stream에 위임.

    metrics: TurnMetrics | None — 주면 첫 토큰까지 걸린 시간을 기록한다.
    None(기본)이면 계측 코드가 사실상 no-op(기존 호출부 무영향).
    """
    async def chat_fn(messages):
        dk = registry.get().dialogue
        _t0 = time.perf_counter()
        _first = True
        # max_response_tokens → ollama num_predict. chat_stream 이 이미 지원한다.
        # None 이면 서버 기본(운영 경로와 동일) — 회귀 0.
        _np = getattr(dk, "max_response_tokens", None)
        async for tok in chat_stream(messages, model=dk.model, temperature=dk.temperature,
                                     num_predict=_np):
            if _first:
                _first = False
                if metrics is not None:
                    metrics.record("llm_first_token", (time.perf_counter() - _t0) * 1000)
            yield tok
    return chat_fn

def apply_persona_knobs(base_persona: list, dk: DialogueKnobs) -> list:
    """system_override 지정 시 맨 앞에 system 메시지 삽입. 없으면 base 그대로."""
    if dk.system_override:
        return [{"role": "system", "content": dk.system_override}] + list(base_persona)
    return base_persona

_ENGINE_URLS = {
    "openvoice": "http://127.0.0.1:8200",
    "qwen": "http://127.0.0.1:8201",
    "cosyvoice": "http://127.0.0.1:8203",   # 라이브 기본(2026-08-14 실측)
}
_TTS_PATH = os.environ.get("PRETHIRD_TTS_PATH", "/tts/kr")
_GEN_KEYS = ("temperature", "top_p", "top_k", "repetition_penalty", "max_new_tokens")

def build_say_fn(registry, metrics=None):
    """registry.tts에서 engine URL·speed·denoise를 읽어 TTS POST.

    metrics: TurnMetrics | None — 주면 TTS 왕복 시간을 기록하고, 턴의 첫 문장에서
    start_turn() 을 호출한다(턴 시작 = say 진입).
    """
    async def say_fn(text: str, se_path=None) -> bytes:
        tk: TtsKnobs = registry.get().tts
        _t0 = time.perf_counter()
        base = tk.url or _ENGINE_URLS.get(tk.engine, _ENGINE_URLS["openvoice"])
        body = {
            "text": text, "speed": _num(tk.speed, 1.0),
            "sdp_ratio": 0.5, "noise_scale": 0.6, "noise_scale_w": 1.0,
        }
        if se_path:
            body["se_path"] = se_path
        if tk.denoise:
            body["denoise"] = True
        # 엔진마다 해석하는 파라미터가 다르다 — 엉뚱한 엔진으로 새지 않게 분기한다.
        if tk.engine == "qwen":                   # gen params 는 qwen 전용
            for k in _GEN_KEYS:                    # None 이 아닌 gen param 만 실어보냄
                v = getattr(tk, k, None)
                if v is not None:
                    body[k] = v
        elif tk.engine == "cosyvoice":            # CosyVoice 는 sampling/ramble 계열
            sent_cv = {}
            for knob, key in TtsKnobs.COSYVOICE_KEYS.items():
                v = getattr(tk, knob, None)
                if v is None:                      # 미지정 → 키 생략 → 서버 config 기본(회귀 0)
                    continue
                body[key] = v
                sent_cv[key] = v
            if sent_cv:
                log.info("[cosyvoice-knobs] /tts/kr 파라미터 %d개: %s", len(sent_cv), sent_cv)
        async with aiohttp.ClientSession() as sess:
            async with sess.post(f"{base}{_TTS_PATH}", json=body) as resp:
                resp.raise_for_status()
                out = await resp.read()
        if metrics is not None:
            metrics.record("tts", (time.perf_counter() - _t0) * 1000)
        return out
    return say_fn

class KnobsFifthInproc(FifthInproc):
    """공유 프로덕션 fifth 렌더(:8810)에 per-request 파라미터를 /render body로 주입.
    fifth_render.py가 매 호출 env를 읽으므로, body에 값이 있으면 그 값(Task 8에서 스레딩),
    없으면 env 기본 → 회귀 0. render_url 기본 = 라이브 :8810(FIFTH_RENDER_URL)."""

    # 마지막으로 /render 에 실제로 실어 보낸 파라미터. UI 가 "적용됐는지" 를 추측하지 않고
    # 눈으로 확인할 수 있게 노출한다(로그를 뒤지지 않아도 되도록).
    # **클래스 변수**인 이유: /replay/fifth 는 통화 경로와 다른 렌더러 인스턴스를 새로 만든다.
    # 인스턴스 속성으로 두면 어느 쪽 전송인지에 따라 UI 에 안 잡힌다.
    last_sent = None

    def __init__(self, video_path, registry, clone_id=None, render_url=None):
        super().__init__(video_path, clone_id=clone_id, render_url=render_url)
        self._registry = registry

    def _build_body(self, wav_path: str, video_path: str, *args, **kwargs) -> dict:
        # *args

