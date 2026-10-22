from __future__ import annotations
import os, aiohttp

TTS_URL = os.environ.get("PRETHIRD_TTS_URL", "http://127.0.0.1:8200")
TTS_PATH = os.environ.get("PRETHIRD_TTS_PATH", "/tts/kr")
DEFAULT_SE_PATH = os.environ.get("PRETHIRD_TTS_SE_PATH", "")
# 한 문장 합성 대기 상한(초). 지정하지 않으면 aiohttp 기본값 300초라, TTS 가 한 문장을
# 끝내지 못하면 대답이 5분간 멈춘다(2026-10-03 실통화). 한 문장은 60초를 넘기지 않는다.
_DEFAULT_TIMEOUT_S = 60.0

def _timeout_s() -> float:
    try:
        v = float(os.environ.get("PRETHIRD_TTS_TIMEOUT_S", _DEFAULT_TIMEOUT_S))
    except ValueError:
        return _DEFAULT_TIMEOUT_S
    return v if v > 0 else _DEFAULT_TIMEOUT_S

def tts_url_for(lang: str | None) -> str:
    """AFL-1034: 답 언어별 TTS 엔진. env PRETHIRD_TTS_URL_<LANG>(예: PRETHIRD_TTS_URL_ES) 가 있으면
    그 언어만 그쪽으로, 없으면 기본 PRETHIRD_TTS_URL(CosyVoice2). 매 호출 읽어 env 변경을 바로 반영."""
    if lang:
        url = os.environ.get(f"PRETHIRD_TTS_URL_{lang.upper()}", "").strip()
        if url:
            return url
    return TTS_URL

async def say(text: str, se_path: str | None = None, lang: str | None = None) -> bytes:
    """text → TTS wav bytes. MeloTTS(KR) base → OpenVoice ToneColorConverter(se_path).
    testbed/lib/tts.js 와 동일 계약(/tts/kr, speed/sdp_ratio/noise_scale/noise_scale_w).

    AFL-1034: lang = 답 언어(ko·en·ja·zh·es). 엔진 선택(tts_url_for) + 본문에 실어 보낸다
    (CosyVoice 어댑터가 숫자 한글 수사 변환을 ko 에만 건다). 옛 어댑터는 lang 을 무시한다."""
    body = {
        "text": text,
        "speed": float(os.environ.get("PRETHIRD_TTS_SPEED", "1.0")),
        "sdp_ratio": 0.5,
        "noise_scale": 0.6,
        "noise_scale_w": 1.0,
    }
    se = se_path or DEFAULT_SE_PATH
    if se:
        body["se_path"] = se
    if lang:
        body["lang"] = lang
    timeout = aiohttp.ClientTimeout(total=_timeout_s())
    async with aiohttp.ClientSession(timeout=timeout) as sess:
        async with sess.post(f"{tts_url_for(lang)}{TTS_PATH}", json=body) as resp:
            resp.raise_for_status()
            return await resp.read()
