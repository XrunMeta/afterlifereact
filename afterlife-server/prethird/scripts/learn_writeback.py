# scripts/ 직하(비패키지) → 절대 import. signaling.py의 `from clone_dialog import ...` 관례와 동일.
from __future__ import annotations
import os
import json
import base64
import logging
import aiohttp
from clone_dialog import extract_l2

log = logging.getLogger("prethird.learn")

_TIMEOUT_S = 5.0


def user_id_from_token(token: str | None) -> int | None:
    """JWT payload(sub) 에서 userId 정수만 1회 추출. 서명 재검증 X(bundle 200이 유효성 입증).
    토큰 문자열은 호출측에서 즉시 폐기(mizu H-2: 세션 저장 금지)."""
    if not token:
        return None
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return None
        seg = parts[1]
        seg += "=" * (-len(seg) % 4)  # base64 padding 복원
        payload = json.loads(base64.urlsafe_b64decode(seg))
        uid = int(payload.get("sub"))
        return uid if uid > 0 else None
    except Exception:
        return None


async def _post_learn(clone_id: int, user_id: int, session_id: str | None, extracted: dict) -> None:
    secret = os.environ.get("LEARN_SECRET")
    api_base = os.environ.get("PRETHIRD_API_BASE")
    if not secret or not api_base:
        return
    url = f"{api_base}/oth-path"
    body = json.dumps({
        "userId": user_id, "extracted": extracted, "source": "call", "session_id": session_id,
    }).encode("utf-8")
    timeout = aiohttp.ClientTimeout(total=_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as s:
        async with s.post(url, data=body, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {secret}",
        }) as r:
            if r.status != 200:
                log.warning("l2 learn writeback http %s clone=%s", r.status, clone_id)


async def learn_writeback(
    clone_id: int, user_id: int | None, session_id: str | None,
    user_text: str, clone_reply: str,
) -> None:
    """통화 턴 종료 후 fire-and-forget 자동학습. 통화 경로를 절대 블로킹/예외전파하지 않는다.
    토글: PRETHIRD_LEARN_ENABLED="1" + LEARN_SECRET/PRETHIRD_API_BASE + user_id 모두 있어야 동작."""
    try:
        if os.environ.get("PRETHIRD_LEARN_ENABLED") != "1":
            return
        if not user_id:
            return
        extracted = await extract_l2(user_text, clone_reply)
        if not extracted:
            return
        await _post_learn(clone_id, user_id, session_id, extracted)
    except Exception as e:
        log.warning("learn_writeback clone=%s failed: %s", clone_id, e)
