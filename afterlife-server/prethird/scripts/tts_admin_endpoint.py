"""tts_admin_endpoint — 어드민 전용 TTS. LEARN_SECRET 인증.

Workers `/oth-path` 가 이 endpoint 로 forward.
- se_key (preset-XXXX 등): REF_VOICES_ROOT 폴더에서 se.pth 직접 사용
- voice_se_url: R2 에서 다운로드 → /tmp/tts_admin_cache/<cid>/se.pth 캐시

v3 (T-501): 텍스트 길이 정규화.
- < 30자: 앞에 "네, " filler prepend → MeloTTS 짧은 문장 앞부분 mangle 회피
- > 80자: 문장 단위 분할 → 각각 합성 → WAV 이어붙임
"""
from __future__ import annotations
import os, logging, aiohttp, re, io, wave, subprocess, tempfile
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
    n_win = len(arr) // win
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


# ─── 음색 프리셋 업로드 (2026-11-19, voice-preset-gabia-sync) ────────────────
# Worker POST /oth-path → Worker 가 R2 샘플을 받아 이 엔드포인트로 multipart
# 포워드. 성공 시 {REF_VOICES_ROOT}/<se_key>/voice.wav 로 저장 → signaling.py 가
# 통화 시점에 그 디렉토리를 찾아 sess.se_path 설정 → TTS 정상 작동.

# se_key 안전 — 디렉토리 traversal 방지. 영숫자·대시·언더스코어, 1~120자.
_SE_KEY_RE = re.compile(r"^[A-Za-z0-9_-]{1,120}$")
PRESET_UPLOAD_MAX = 8 * 1024 * 1024  # 8MB — admin.ts VOICE_SAMPLE_MAX 와 동일.


async def preset_upload(req: web.Request) -> web.Response:
    """음색 프리셋 샘플을 받아 {REF_VOICES_ROOT}/<se_key>/voice.wav 로 저장.
    multipart/form-data: se_key (text), file (binary).
    X-Admin-Secret 로 LEARN_SECRET 인증 (/oth-path 와 동일 규약).
    """
    secret = req.headers.get("X-Admin-Secret", "")
    if not LEARN_SECRET or secret != LEARN_SECRET:
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        reader = await req.multipart()
    except Exception:
        return web.json_response({"error": "multipart/form-data required"}, status=400)
    se_key: str | None = None
    file_bytes: bytes | None = None
    # se_key 멀티파트 파트의 안전 상한 — 정규식 통과 길이의 넉넉한 몇 배. 이걸 넘으면
    #   굳이 regex 대 보지도 않고 400. OOM 방어 (파일 파트와 동일 설계, 리뷰 fix).
    SE_KEY_MAX_BYTES = 512
    while True:
        part = await reader.next()
        if part is None:
            break
        if part.name == "se_key":
            # text() 는 내부적으로 전체를 읽어 디코드 — 스트림 카운트로 상한 적용.
            buf = bytearray()
            while True:
                chunk = await part.read_chunk(size=256)
                if not chunk:
                    break
                buf.extend(chunk)
                if len(buf) > SE_KEY_MAX_BYTES:
                    return web.json_response(
                        {"error": f"se_key too long (max {SE_KEY_MAX_BYTES} bytes)"},
                        status=400,
                    )
            se_key = buf.decode("utf-8", errors="replace").strip()
        elif part.name == "file":
            # 스트림을 통째로 읽되 상한 초과 즉시 거절 (OOM 방어).
            buf = bytearray()
            while True:
                chunk = await part.read_chunk(size=64 * 1024)
                if not chunk:
                    break
                buf.extend(chunk)
                if len(buf) > PRESET_UPLOAD_MAX:
                    return web.json_response(
                        {"error": f"file too large (max {PRESET_UPLOAD_MAX} bytes)"},
                        status=400,
                    )
            file_bytes = bytes(buf)
    if not se_key or not _SE_KEY_RE.match(se_key):
        return web.json_response(
            {"error": "se_key required (alnum/dash/underscore, 1-120 chars)"},
            status=400,
        )
    if file_bytes is None or len(file_bytes) == 0:
        return web.json_response({"error": "file required"}, status=400)

    target_dir = os.path.join(REF_VOICES_ROOT, se_key)
    target = os.path.join(target_dir, "voice.wav")
    try:
        os.makedirs(target_dir, exist_ok=True)
    except Exception as e:
        log.warning("[preset_upload] mkdir failed %s: %s", target_dir, e)
        return web.json_response({"error": f"write failed: {e}"}, status=500)

    # 입력 bytes → tmp 파일 → ffmpeg(16kHz mono wav) → voice.wav.partial → rename.
    #   원자 저장: 중간에 crash 해도 voice.wav 는 이전 상태 유지 (또는 부재).
    with tempfile.NamedTemporaryFile(delete=False, suffix=".in") as tmp_in:
        tmp_in.write(file_bytes)
        tmp_in_path = tmp_in.name
    # ffmpeg 가 출력 포맷을 확장자로 결정하므로 명시 -f wav. .partial 경로는
    #   atomic rename 소스이자 ffmpeg 가 덮어쓰기 쉽게 .wav 확장자는 생략.
    tmp_out_path = target + ".partial"
    try:
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_in_path, "-f", "wav", "-ar", "16000", "-ac", "1", tmp_out_path],
            capture_output=True,
            timeout=30,
        )
        if result.returncode != 0:
            stderr = (result.stderr or b"").decode("utf-8", errors="replace")[:500]
            log.warning("[preset_upload] ffmpeg failed se_key=%s: %s", se_key, stderr)
            return web.json_response(
                {"error": f"ffmpeg failed: {stderr}"}, status=500,
            )
        if not os.path.isfile(tmp_out_path) or os.path.getsize(tmp_out_path) == 0:
            return web.json_response(
                {"error": "ffmpeg produced empty output"}, status=500,
            )
        os.replace(tmp_out_path, target)
        bytes_written = os.path.getsize(target)
        log.info("[preset_upload] saved se_key=%s path=%s bytes=%d", se_key, target, bytes_written)
        return web.json_response({"ok": True, "path": target, "bytes": bytes_written})
    except subprocess.TimeoutExpired:
        return web.json_response({"error": "ffmpeg timeout"}, status=500)
    except Exception as e:
        log.warning("[preset_upload] unexpected error se_key=%s: %s", se_key, e)
        return web.json_response({"error": f"write failed: {e}"}, status=500)
    finally:
        try:
            os.unlink(tmp_in_path)
        except Exception:
            pass
        try:
            if os.path.isfile(tmp_out_path):
                os.unlink(tmp_out_path)
        except Exception:
            pass


# ─── 등록 전 미리듣기 (2026-11-19 Option B) ────────────────────────────────
# 어드민이 신규 샘플을 D1 에 등록하기 전에 바로 들어볼 수 있도록. 임시 디렉토리에
# 업로드 → make_prompt_ref (lenient) → TTS → 응답 후 cleanup. D1 미접근.

import uuid, shutil, asyncio
MAKE_PROMPT_REF_PATH = os.environ.get(
    "PRETHIRD_MAKE_PROMPT_REF",
    "/home/afterlife/afterlife-server/cosyvoice/scripts/make_prompt_ref.py",
)
COSYVOICE_PYTHON = os.environ.get(
    "COSYVOICE_PYTHON",
    "/home/afterlife/miniconda3/envs/cosyvoice-poc/bin/python",
)
STT_URL = os.environ.get("PRETHIRD_STT_URL", "http://127.0.0.1:8202")
PREBUILD_TIMEOUT_S = float(os.environ.get("PRETHIRD_PREVIEW_PREBUILD_TIMEOUT_S", "90"))


async def _run_make_prompt_ref_lenient(se_key: str) -> bool:
    """make_prompt_ref 를 쉼 감지 임계 완화 환경변수로 실행. 성공 시 True."""
    env = dict(
        os.environ,
        COSYVOICE_REF_ROOT=REF_VOICES_ROOT,
        PRETHIRD_STT_URL=STT_URL,
        # 쉼 없는 샘플도 통과하도록 완화 (실측: preset-bright-9523 해결 조합).
        COSYVOICE_PROMPT_SILENCE_MIN="0.08",
        COSYVOICE_PROMPT_SILENCE_DB="-35dB",
        COSYVOICE_PROMPT_CUT_AFTER_SEC="5.0",
    )
    proc = None
    try:
        proc = await asyncio.create_subprocess_exec(
            COSYVOICE_PYTHON if os.path.isfile(COSYVOICE_PYTHON) else "python3",
            MAKE_PROMPT_REF_PATH,
            se_key,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=os.path.dirname(MAKE_PROMPT_REF_PATH),
            env=env,
        )
        out, _ = await asyncio.wait_for(proc.communicate(), timeout=PREBUILD_TIMEOUT_S)
        if proc.returncode != 0:
            tail = (out or b"").decode("utf-8", "replace")[-300:]
            log.warning("[preview] make_prompt_ref rc=%s: %s", proc.returncode, tail)
            return False
    except asyncio.TimeoutError:
        log.warning("[preview] make_prompt_ref timeout clone=%s", se_key)
        try:
            proc.kill()
        except Exception:
            pass
        return False
    except Exception as e:
        log.warning("[preview] make_prompt_ref 실행 실패: %s", e)
        return False
    d = os.path.join(REF_VOICES_ROOT, se_key)
    return os.path.isfile(os.path.join(d, "voice_prompt.wav")) and os.path.isfile(
        os.path.join(d, "ref_prompt.txt")
    )


async def preview_synthesize(req: web.Request) -> web.Response:
    """등록 전 미리듣기 — multipart(text, file) → wav. 임시 dir 사용, 자동 cleanup."""
    secret = req.headers.get("X-Admin-Secret", "")
    if not LEARN_SECRET or secret != LEARN_SECRET:
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        reader = await req.multipart()
    except Exception:
        return web.json_response({"error": "multipart/form-data required"}, status=400)
    text: str | None = None
    file_bytes: bytes | None = None
    TEXT_MAX = 500
    while True:
        part = await reader.next()
        if part is None:
            break
        if part.name == "text":
            buf = bytearray()
            while True:
                chunk = await part.read_chunk(size=256)
                if not chunk:
                    break
                buf.extend(chunk)
                if len(buf) > TEXT_MAX * 4:  # UTF-8 4x margin
                    return web.json_response({"error": "text too long"}, status=400)
            text = buf.decode("utf-8", errors="replace").strip()
        elif part.name == "file":
            buf = bytearray()
            while True:
                chunk = await part.read_chunk(size=64 * 1024)
                if not chunk:
                    break
                buf.extend(chunk)
                if len(buf) > PRESET_UPLOAD_MAX:
                    return web.json_response(
                        {"error": f"file too large (max {PRESET_UPLOAD_MAX} bytes)"},
                        status=400,
                    )
            file_bytes = bytes(buf)
    if not text:
        return web.json_response({"error": "text required"}, status=400)
    if len(text) > TEXT_MAX:
        return web.json_response({"error": f"text too long (max {TEXT_MAX} chars)"}, status=400)
    if not file_bytes:
        return web.json_response({"error": "file required"}, status=400)

    # 임시 se_key — 충돌 방지 + 쉽게 패턴 매칭 가능한 접두어.
    se_key = f"tmp-preview-{uuid.uuid4().hex}"
    target_dir = os.path.join(REF_VOICES_ROOT, se_key)
    try:
        os.makedirs(target_dir, exist_ok=True)
        # 1) ffmpeg → voice.wav (preset_upload 와 동일 패턴)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".in") as tmp_in:
            tmp_in.write(file_bytes)
            tmp_in_path = tmp_in.name
        voice_wav = os.path.join(target_dir, "voice.wav")
        try:
            result = subprocess.run(
                ["ffmpeg", "-y", "-i", tmp_in_path, "-f", "wav", "-ar", "16000", "-ac", "1", voice_wav],
                capture_output=True, timeout=30,
            )
            if result.returncode != 0:
                stderr = (result.stderr or b"").decode("utf-8", "replace")[:300]
                return web.json_response({"error": f"ffmpeg failed: {stderr}"}, status=500)
        finally:
            try:
                os.unlink(tmp_in_path)
            except Exception:
                pass

        # 2) prebuild (prompt pair + STT). 실패해도 TTS 는 polyfill 로 계속.
        await _run_make_prompt_ref_lenient(se_key)
        # 빈 se.pth stub — admin_tts se.pth 체크 통과용 (CosyVoice 는 같은 dir 의 voice.wav 사용).
        se_pth = os.path.join(target_dir, "se.pth")
        if not os.path.isfile(se_pth):
            open(se_pth, "a").close()

        # 3) TTS 실행 — /oth-path 와 동일 파이프라인(_run_tts) 재사용.
        return await _run_tts(text, se_pth, se_key)
    except Exception as e:
        log.warning("[preview] unexpected error se_key=%s: %s", se_key, e)
        return web.json_response({"error": f"preview failed: {e}"}, status=500)
    finally:
        # 자동 cleanup — 성공·실패 모두 임시 dir 제거.
        try:
            shutil.rmtree(target_dir, ignore_errors=True)
            log.info("[preview] cleaned up %s", target_dir)
        except Exception as e:
            log.warning("[preview] cleanup failed %s: %s", target_dir, e)


def register_tts_admin_routes(app: web.Application) -> None:
    app.router.add_post("/oth-path", admin_tts)
    app.router.add_post("/oth-path", preset_upload)
    app.router.add_post("/oth-path", preview_synthesize)
    log.info("tts_admin endpoint registered: POST /oth-path, /oth-path, /oth-path")
