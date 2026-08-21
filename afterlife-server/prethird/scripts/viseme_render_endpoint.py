"""T-545 E: POST /oth-path — 얼굴 이미지 URL → 10 viseme PNG (base64) 반환.

Body:
    {
        "face_image_url": "https:
        "clone_id": 9126                             # (선택) 로깅용
    }

Response:
    {
        "visemes": [
            {"v": "REST",  "png_b64": "iVBORw0KGgo..."},
            {"v": "A",     "png_b64": "..."},
            ...
            {"v": "DENT",  "png_b64": "..."}
        ]
    }

MVP:
    - PIL 기반 오버레이 렌더 (`render_visemes.render_visemes()` 를 in-memory 로 실행).
    - 파일 IO 없이 BytesIO → base64 반환 (호출자 = workers · admin UI 가 R2 업로드 담당).
    - 인증: LEARN_SECRET (viseme_synth_endpoint 와 동일).

관련: [[T-545]] · viseme/render_visemes.py · viseme_synth_endpoint.py.
"""
from __future__ import annotations
import os
import io
import base64
import logging
from aiohttp import web, ClientSession, ClientTimeout

from viseme.render_visemes import VISEMES, _draw_mouth
from PIL import Image

log = logging.getLogger("prethird.viseme_render")

LEARN_SECRET = os.environ.get("LEARN_SECRET", "") or os.environ.get("PRETHIRD_LEARN_SECRET", "")

# 얼굴 다운로드 timeout · size limit.
_DL_TIMEOUT = ClientTimeout(total=15)
_MAX_BYTES = 15 * 1024 * 1024  # 15MB

async def _download(url: str) -> bytes:
    async with ClientSession(timeout=_DL_TIMEOUT) as session:
        async with session.get(url) as resp:
            if resp.status != 200:
                raise ValueError(f"download {resp.status}")
            data = await resp.read()
            if len(data) > _MAX_BYTES:
                raise ValueError(f"image too large: {len(data)}")
            return data

def _render_all_b64(face_bytes: bytes) -> list[dict]:
    """얼굴 bytes → [{"v": ..., "png_b64": ...}] 10개."""
    src = Image.open(io.BytesIO(face_bytes))
    if src.mode != "RGB":
        src = src.convert("RGB")
    # 얼굴이 너무 크면 다운스케일 (payload 절약 + 렌더 속도).
    max_side = max(src.size)
    if max_side > 512:
        scale = 512 / max_side
        new_size = (int(src.size[0] * scale), int(src.size[1] * scale))
        src = src.resize(new_size, Image.LANCZOS)

    out: list[dict] = []
    for v in VISEMES:
        rendered = _draw_mouth(src, v)
        buf = io.BytesIO()
        rendered.save(buf, "PNG", optimize=True)
        out.append({
            "v": v,
            "png_b64": base64.b64encode(buf.getvalue()).decode("ascii"),
        })
    return out

async def viseme_render(req: web.Request) -> web.Response:
    secret = req.headers.get("X-Admin-Secret", "")
    if not LEARN_SECRET or secret != LEARN_SECRET:
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)

    face_url = body.get("face_image_url")
    clone_id = body.get("clone_id")
    if not isinstance(face_url, str) or not face_url.startswith(("http:
        return web.json_response({"error": "face_image_url required (http/https)"}, status=400)

    try:
        face_bytes = await _download(face_url)
    except Exception as e:
        log.warning("viseme_render download failed: %s", e)
        return web.json_response({"error": f"download: {e}"}, status=502)

    try:
        visemes = _render_all_b64(face_bytes)
    except Exception as e:
        log.warning("viseme_render PIL failed: %s", e)
        return web.json_response({"error": f"render: {e}"}, status=500)

    log.info("viseme_render ok clone_id=%s bytes=%d", clone_id, len(face_bytes))
    return web.json_response({"visemes": visemes})

def register_viseme_render_routes(app: web.Application) -> None:
    app.router.add_post("/oth-path", viseme_render)
    log.info("viseme_render endpoint registered: POST /oth-path (T-545 E)")
