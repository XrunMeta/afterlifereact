"""tts_preview_endpoint — verify_lab 페이지에서 clone 목소리 TTS 테스트.

앱 통화 flow 와 동일한 code path:
  1. workers /oth-path 로 voice_se URL 조회 (앱 통화 시작 시와 동일)
  2. voice_se 파일 다운로드
  3. tts_client.say(text, se_path=<voice_se>) 호출 — 통화 중 서버가 하는 것과 동일
  4. wav bytes 반환

목적: clone 별 음성 이상 여부 진단. voice_se broken 인지, cosyvoice 자체 문제인지 구분.
"""
from __future__ import annotations
import os, pathlib, aiohttp, logging
from aiohttp import web

log = logging.getLogger("prethird.tts_preview")

API_BASE = os.environ.get("PRETHIRD_API_BASE", "")
VERIFY_PASSWORD = os.environ.get("PRETHIRD_VERIFY_PASSWORD", "")
_BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def _check_verify_pass(req: web.Request) -> bool:
    """chat_endpoint._check_verify_pass 와 동일 규약. 쿼리 or 헤더."""
    pw = req.query.get("pass") or req.headers.get("X-Verify-Pass", "")
    return bool(VERIFY_PASSWORD and pw == VERIFY_PASSWORD)


def _bearer(req: web.Request) -> str | None:
    """chat_endpoint._bearer 와 동일. Authorization: Bearer XXX 에서 XXX 추출."""
    auth = req.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


async def tts_preview(req: web.Request) -> web.Response:
    """GET /oth-path?clone_id=X&text=Y

    응답: audio/wav (통화 시 실제 재생되는 것과 동일 오디오).

    인증 2층: verify 비밀번호 (X-Verify-Pass 헤더 or ?pass=) + JWT bearer (xrun 세션).
    """
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "bearer token required"}, status=401)

    cid = req.query.get("clone_id", "").strip()
    text = req.query.get("text", "").strip()
    if not cid or not text:
        return web.json_response({"error": "clone_id and text required"}, status=400)
    if len(text) > 300:
        return web.json_response({"error": "text too long (max 300 chars)"}, status=400)
    if not API_BASE:
        return web.json_response({"error": "PRETHIRD_API_BASE not configured"}, status=500)

    # 1) workers 에서 personaBundle 조회 (voice_se URL 포함).
    #    이 endpoint 를 사용해야 admin 브릿지가 필요없이 사용자 JWT 로 fetch 가능.
    bundle_url = f"{API_BASE}/oth-path"
    try:
        timeout = aiohttp.ClientTimeout(total=8.0)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.get(bundle_url, headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": _BROWSER_UA,
            }) as r:
                if r.status != 200:
                    body = await r.text()
                    log.warning("bundle fetch clone=%s http=%s body=%r", cid, r.status, body[:200])
                    return web.json_response({"error": f"bundle {r.status}"}, status=r.status)
                bundle = await r.json()
    except Exception as e:
        log.warning("bundle fetch failed clone=%s: %s", cid, e)
        return web.json_response({"error": f"bundle upstream: {e}"}, status=502)

    assets = bundle.get("assets") or {}
    # voice_se_url (converter 학습 결과) 우선, 없으면 voice_raw (원본) 폴백.
    voice_se_url = assets.get("voiceSeUrl") or assets.get("voiceRawUrl")
    if not voice_se_url:
        return web.json_response({"error": "clone has no voice_se available"}, status=404)

    # 2) voice_se 파일 다운로드 → tempfile
    try:
        timeout = aiohttp.ClientTimeout(total=15.0)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.get(voice_se_url, headers={
                "Authorization": f"Bearer {token}",  # /oth-path 도 인증 필요할 수 있음
                "User-Agent": _BROWSER_UA,
            }) as r:
                if r.status != 200:
                    return web.json_response({"error": f"voice_se fetch {r.status}"}, status=502)
                se_bytes = await r.read()
    except Exception as e:
        log.warning("voice_se download failed clone=%s url=%s: %s", cid, voice_se_url, e)
        return web.json_response({"error": f"voice_se download: {e}"}, status=502)

    if len(se_bytes) < 100:
        return web.json_response({"error": f"voice_se too small ({len(se_bytes)}B)"}, status=500)

    # 3) TTS 실행 (앱 통화 중과 동일 함수).
    #    tts_client.say(text, se_path) → cosyvoice2 (또는 OpenVoice 세팅에 따라)
    # T-467 (2026-08-12): cosyvoice(:8203) 는 se_path 문자열에서 clone_id 를 parse.
    #   임시 파일 /tmp/xxxx.pth 는 clone_id 못 뽑아서 503. 통화 flow 와 동일하게
    #   {ROOT}/{clone_id}/se.pth 경로 형태로 만들어야 한다.
    from tts_client import say
    tmp_dir = pathlib.Path(f"/tmp/tts_preview/{cid}")
    tmp_dir.mkdir(parents=True, exist_ok=True)
    se_path = str(tmp_dir / "se.pth")
    try:
        with open(se_path, "wb") as f:
            f.write(se_bytes)
        os.chmod(se_path, 0o644)
        log.info("tts_preview clone=%s text_len=%d se_bytes=%d se_path=%s",
                 cid, len(text), len(se_bytes), se_path)
        wav = await say(text, se_path=se_path)
    except Exception as e:
        log.warning("tts failed clone=%s: %s", cid, e)
        return web.json_response({"error": f"tts: {e}"}, status=502)

    return web.Response(body=wav, content_type="audio/wav", headers={
        # verify iframe 내 fetch 에서 사용 — origin 은 iframe 도메인(rtc.example.invalid)과 동일하니 CORS 무관.
        "Cache-Control": "no-store",
    })


def register_tts_preview_routes(app: web.Application) -> None:
    """signaling.py 에서 호출."""
    app.router.add_get("/oth-path", tts_preview)
    log.info("tts_preview endpoint registered: GET /oth-path")
