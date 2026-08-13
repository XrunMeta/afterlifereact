"""admin_records_endpoint.py — 관리자 통화 대화 조회 endpoint (T-500).

/data/records/<clone_id>/<timestamp>-{input,answer,meta}.txt 를 읽어
관리자 UI 로 반환한다.

인증: `Authorization: Bearer <PRETHIRD_LEARN_SECRET>` — 기존 관례 승계.
  admin API 프록시에서 서명 붙여 호출. 사용자 앱은 이 endpoint 접근 못 함.

Endpoints:
  GET /oth-path
    → {items: [{ts, input, answer, meta}], count}
    - 최신 순 정렬 (파일명 timestamp 기준)
    - 각 turn 텍스트 통째로 반환 (최대 100 turn per clone — 무제한 폭주 방지)
"""
from __future__ import annotations
import glob
import json
import logging
import os
import re
from aiohttp import web

log = logging.getLogger("prethird.admin_records")

RECORDS_ROOT = os.environ.get("PRETHIRD_RECORDS_ROOT", "/data/records")
ADMIN_SECRET = (
    os.environ.get("PRETHIRD_LEARN_SECRET", "")
    or os.environ.get("PRETHIRD_DEV_SECRET", "")
)
MAX_TURNS_PER_CLONE = 100


def _auth_ok(req: web.Request) -> bool:
    if not ADMIN_SECRET:
        return False
    auth = req.headers.get("Authorization", "")
    return auth == f"Bearer {ADMIN_SECRET}"


def _read_text(path: str) -> str:
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def _read_json(path: str) -> dict:
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


async def records_by_clone(req: web.Request) -> web.Response:
    if not _auth_ok(req):
        return web.json_response({"error": "UNAUTHENTICATED"}, status=401)

    try:
        clone_id = int(req.match_info["clone_id"])
    except (KeyError, ValueError):
        return web.json_response({"error": "INVALID_CLONE_ID"}, status=400)

    clone_dir = os.path.join(RECORDS_ROOT, str(clone_id))
    if not os.path.isdir(clone_dir):
        return web.json_response({"items": [], "count": 0, "note": "no records dir"})

    # <timestamp>-input.txt 기준으로 세션 목록. answer/meta 가 짝인지 추가 확인.
    input_paths = sorted(
        glob.glob(os.path.join(clone_dir, "*-input.txt")),
        key=os.path.getmtime,
        reverse=True,
    )[:MAX_TURNS_PER_CLONE]

    items = []
    for input_path in input_paths:
        m = re.search(r"(\d+)-input\.txt$", os.path.basename(input_path))
        if not m:
            continue
        ts = m.group(1)
        answer_path = os.path.join(clone_dir, f"{ts}-answer.txt")
        meta_path = os.path.join(clone_dir, f"{ts}-meta.json")
        items.append({
            "ts": int(ts),
            "input": _read_text(input_path),
            "answer": _read_text(answer_path) if os.path.isfile(answer_path) else "",
            "meta": _read_json(meta_path) if os.path.isfile(meta_path) else {},
        })

    return web.json_response({"items": items, "count": len(items)})


def register_admin_records_routes(app: web.Application) -> None:
    app.router.add_get("/oth-path", records_by_clone)
    log.info("[admin_records] registered GET /oth-path")
