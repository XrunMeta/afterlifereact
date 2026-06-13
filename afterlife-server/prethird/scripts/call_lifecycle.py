# scripts/ 직하(비패키지) → 절대 import. learn_writeback.py와 동일 graceful 패턴.
# prethird P2P 통화 lifecycle을 api에 통보해 call_sessions를 기록(mizu H-2 충족).
# 통화 경로를 절대 블로킹/예외전파하지 않는다.
from __future__ import annotations
import os
import re
import json
import logging
import aiohttp

log = logging.getLogger("prethird.calllife")

_TIMEOUT_S = 5.0


async def _post(url: str, headers: dict, body: bytes) -> None:
    timeout = aiohttp.ClientTimeout(total=_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as s:
        async with s.post(url, data=body, headers=headers) as r:
            if r.status != 200:
                log.warning("call lifecycle http %s url=%s", r.status, url)


async def call_start(
    api_base: str | None, clone_id: int | None, session_id: str | None, access_token: str | None,
) -> None:
    """통화 시작 시 call_sessions 기록 생성. JWT(access_token)로 api가 userId 확정.
    토글 PRETHIRD_LEARN_ENABLED="1" + 모든 인자 존재해야 동작. 실패는 흡수(통화 무영향).
    access_token은 로그에 절대 출력하지 않는다(mizu H-2)."""
    try:
        if os.environ.get("PRETHIRD_LEARN_ENABLED") != "1":
            return
        if not api_base or not clone_id or not session_id or not access_token:
            return
        url = f"{api_base}/oth-path"
        body = json.dumps({"sessionId": session_id}).encode("utf-8")
        await _post(url, {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        }, body)
    except Exception as e:
        log.warning("call_start clone=%s failed: %s", clone_id, e)


async def call_end(api_base: str | None, clone_id: int | None, session_id: str | None) -> None:
    """통화 종료 시 ended_at 기록. teardown 시점엔 토큰 폐기라 LEARN_SECRET로 인증.
    best-effort fire-and-forget. 실패는 흡수."""
    try:
        if os.environ.get("PRETHIRD_LEARN_ENABLED") != "1":
            return
        secret = os.environ.get("LEARN_SECRET")
        if not api_base or not session_id or not secret:
            return
        # 심층방어: session_id는 prethird uuid4().hex[:12](12 소문자 hex). URL path 보간 전 형식 강제.
        if not re.fullmatch(r"[0-9a-f]{12}", session_id):
            return
        url = f"{api_base}/oth-path"
        await _post(url, {"Authorization": f"Bearer {secret}"}, b"")
    except Exception as e:
        log.warning("call_end clone=%s failed: %s", clone_id, e)
