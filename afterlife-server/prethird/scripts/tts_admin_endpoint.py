"""tts_admin_endpoint — 어드민 전용 TTS. LEARN_SECRET 인증.

Workers `/oth-path` 가 이 endpoint 로 forward.
- se_key (preset-XXXX 등): REF_VOICES_ROOT 폴더에서 se.pth 직접 사용
- voice_se_url: R2 에서 다운로드 → /tmp/tts_admin_cache/<cid>/se.pth 캐시

v3 (T-501): 텍스트 길이 정규화.
- < 30자: 앞에 "네, " filler prepend → MeloTTS 짧은 문장 앞부분 mangle 회피
- > 80자: 문장 단위 분할 → 각각 합성 → WAV 이어붙임
"""
from __future__ import annotations
import os, logging, aiohttp, re, io, wave
import numpy as np
from aiohttp import web

log = logging.getLogger("prethird.tts_admin")

REF_VOICES_ROOT = os.environ.get(
    "PRETHIRD_REF_VOICES_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)
LEARN_SECRET = os.environ.get("LEARN_SECRET", "") or os.environ.get("PRETHIRD_LEARN_SECRET", "")
CACHE_ROOT = "/tmp/tts_admin_cache"

MIN_TEXT_LEN = 50
MAX_TEXT_LEN = 130
SHORT_PREFIX = "네, 잘 알겠어요. 다음 내용을 말씀드릴게요. "
SHORT_SUFFIX = ". 이상 내용이었어요. 감사합니다."

# 앱 특유 영단어 → 한국어 음역 (MeloTTS KR 는 영어 phoneme mangle)
ENGLISH_MAP = {
    "Remember Me": "리멤버 미",
    "remember me": "리멤버 미",
    "OK": "오케이",
    "ok": "오케이",
}

async def _download_se(url: str, dst_path: str) -> bool:
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    try:
        timeout = aiohttp.ClientTimeout(total=15.0)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.get(url) as r:
                if r.status != 200:
                    log.warning("se_url fetch %s → http=%s", url, r.status)
                    return False
                data = await r.read()
                if len(data) < 100:
                    return False
                tmp = dst_path + ".partial"
                with open(tmp, "wb") as f:
                    f.write(data)
                os.chmod(tmp, 0o644)
                os.rename(tmp, dst_path)
                return True
    except Exception as e:
        log.warning("se_url download failed %s: %s", url, e)
        return False

def _split_sentences(text: str) -> list[str]:
    """. ? ! 뒤 공백 기준 분할."""
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p for p in parts if p.strip()]

def _normalize_chunks(text: str) -> list[str]:
    """긴 텍스트는 문장 분할. 짧은 텍스트는 filler prepend (이미 처리)."""
    text = text.strip()
    if len(text) <= MAX_TEXT_LEN:
        return [text]
    sents = _split_sentences(text)
    return sents or [text]

def _trim_tail(wav_bytes: bytes, threshold_db: float = -35.0, tail_pad_s: float = 0.15) -> bytes:
    """MeloTTS 가 speech 끝나고 이상한 소리 남기는 tail 트림 + fade out.
    100ms window RMS energy 분석 → threshold_db 넘는 마지막 window 찾아 cut."""
    try:
        with wave.open(io.BytesIO(wav_bytes), "rb") as w:
            params = w.getparams()
            sr = w.getframerate()
            n = w.getnframes()
            raw = w.readframes(n)
    except Exception:
        return wav_bytes
    if params.nchannels != 1 or params.sampwidth != 2:
        return wav_bytes  # 예상 밖 포맷은 건드리지 않음
    arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    win = int(sr * 0.05)  # 50ms window
    if win < 1 or len(arr) < win * 4:
        return wav_bytes
    n_win = len(arr) 
    rms = np.array([
        np.sqrt(np.mean(arr[i * win:(i + 1) * win] ** 2) + 1e-9)
        for i in range(n_win)
    ])
    db = 20.0 * np.log10(rms + 1e-6)
    speech = db > threshold_db
    if not np.any(speech):
        return wav_bytes
    last = int(np.where(speech)[0][-1])
    cut_sample = min(len(arr), (last + 1) * win + int(sr * tail_pad_s))
    trimmed = arr[:cut_sample].copy()
    # 마지막 100ms fade out
    fade_n = min(int(sr * 0.1), cut_sample)
    if fade_n > 0:
        trimmed[-fade_n:] *= np.linspace(1.0, 0.0, fade_n)
    out_int16 = (trimmed * 32768.0).clip(-32768, 32767).astype(np.int16).tobytes()
    out = io.BytesIO()
    with wave.open(out, "wb") as ow:
        ow.setparams(params)
        ow.writeframes(out_int16)
    return out.getvalue()

def _concat_wavs(wav_list: list[bytes]) -> bytes:
    """같은 format WAV bytes 여러 개를 하나로 concat."""
    if len(wav_list) == 1:
        return wav_list[0]
    out = io.BytesIO()
    frames_list: list[bytes] = []
    params = None
    for b in wav_list:
        with wave.open(io.BytesIO(b), "rb") as w:
            if params is None:
                params = w.getparams()
            frames_list.append(w.readframes(w.getnframes()))
    with wave.open(out, "wb") as ow:
        ow.setparams(params)
        for f in frames_list:
            ow.writeframes(f)
    return out.getvalue()

async def admin_tts(req: web.Request) -> web.Response:
    secret = req.headers.get("X-Admin-Secret", "")
    if not LEARN_SECRET or secret != LEARN_SECRET:
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
    text = (body.get("text") or "").strip()
    se_key = body.get("se_key")
    clone_id = body.get("clone_id")
    voice_se_url = body.get("voice_se_url")
    voice_raw_url = body.get("voice_raw_url")
    if not text:
        return web.json_response({"error": "text required"}, status=400)
    if len(text) > 500:
        return web.json_response({"error": "text too long (max 500)"}, status=400)

    # 1) preset (se_key) — REF_VOICES_ROOT 안 se.pth
    if se_key:
        se_path = os.path.join(REF_VOICES_ROOT, se_key, "se.pth")
        if os.path.isfile(se_path):
            return await _run_tts(text, se_path, se_key)
        log.info("se_key %s: no local se.pth at %s", se_key, se_path)

    # 2) voice_se_url 폴백
    cid_key = str(clone_id) if clone_id else (se_key or "unknown")
    if voice_se_url:
        cached = os.path.join(CACHE_ROOT, cid_key, "se.pth")
        if not os.path.isfile(cached):
            ok = await _download_se(voice_se_url, cached)
            if not ok:
                return web.json_response(
                    {"error": f"se download failed for '{cid_key}'"}, status=502,
                )
        if voice_raw_url:
            wav = os.path.join(CACHE_ROOT, cid_key, "voice.wav")
            if not os.path.isfile(wav):
                await _download_se(voice_raw_url, wav)
        return await _run_tts(text, cached, cid_key)

    return web.json_response(
        {"error": "se not found (need se_key with local file or voice_se_url)"},
        status=404,
    )

def _substitute_english(text: str) -> str:
    """앱 특유 영단어 → 한국어 음역. 그 외 영단어는 그대로 (드물게 등장)."""
    for en, ko in ENGLISH_MAP.items():
        text = text.replace(en, ko)
    return text

async def _run_tts(text: str, se_path: str, key: str) -> web.Response:
    original_len = len(text)
    # 1) 영단어 치환
    text = _substitute_english(text)
    # 2) 짧으면 prefix + suffix 로 감싸기
    if len(text) < MIN_TEXT_LEN:
        text = f"{SHORT_PREFIX}{text}{SHORT_SUFFIX}"
    # 3) 길면 문장별 분할
    chunks = _normalize_chunks(text)
    log.info(
        "admin_tts key=%s orig_len=%d final_len=%d chunks=%d",
        key, original_len, len(text), len(chunks),
    )
    try:
        from tts_client import say
        wav_list = []
        for i, chunk in enumerate(chunks):
            log.info("  chunk[%d] len=%d: %s", i, len(chunk), chunk[:40])
            w = await say(chunk, se_path=se_path)
            # 각 chunk 의 tail 노이즈 트림 (이어붙일 때 사이사이 잡음 방지)
            w = _trim_tail(w)
            wav_list.append(w)
        wav = _concat_wavs(wav_list)
    except Exception as e:
        log.warning("admin_tts say failed key=%s: %s", key, e)
        return web.json_response({"error": f"tts: {e}"}, status=502)
    return web.Response(
        body=wav,
        content_type="audio/wav",
        headers={"Cache-Control": "no-store"},
    )

def register_tts_admin_routes(app: web.Application) -> None:
    app.router.add_post("/oth-path", admin_tts)
    log.info("tts_admin endpoint registered: POST /oth-path (v3, text normalized)")
