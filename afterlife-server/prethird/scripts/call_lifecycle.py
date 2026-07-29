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

# call_start는 offer 경로에서 await로 통화 연결을 막으므로 timeout을 보수적으로(통화 지연 상한).
# call_end는 teardown best-effort라 동일 timeout으로 충분.
_TIMEOUT_S = 3.0


async def _post(url: str, headers: dict, body: bytes) -> None:
    timeout = aiohttp.ClientTimeout(total=_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as s:
        async with s.post(url, data=body, headers=headers) as r:
            if r.status != 200:
                log.warning("call lifecycle http %s url=%s", r.status, url)


async def _post_json(url: str, headers: dict, body: bytes) -> dict | None:
    """응답 JSON이 필요한 POST. 기존 _post는 fire-and-forget이라 별도로 둔다."""
    timeout = aiohttp.ClientTimeout(total=_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as s:
        async with s.post(url, data=body, headers=headers) as r:
            if r.status != 200:
                log.warning("call lifecycle http %s url=%s", r.status, url)
                return None
            return await r.json()


async def call_greeted(api_base: str | None, session_id: str | None) -> dict | None:
    """[T-167] 클론 인사 시작을 서버에 알리고 과금 데드라인을 받아온다.

    과금은 학습 토글(PRETHIRD_LEARN_ENABLED)과 무관하다 — 게이트를 걸지 않는다.
    반환: {"allowedSec": int, "maxEndAt": int} 또는 None(실패).
    서버가 필드를 빠뜨리면 0으로 강제한다(fail-closed, 무제한 해석 금지)."""
    try:
        secret = os.environ.get("LEARN_SECRET")
        if not api_base or not session_id or not secret:
            return None
        # call_end와 동일한 심층방어 — URL path 보간 전 형식 강제.
        if not re.fullmatch(r"[0-9a-f]{12}", session_id):
            return None
        url = f"{api_base}/oth-path"
        data = await _post_json(url, {
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
        }, b"")
        if not data:
            return None
        return {
            "allowedSec": int(data.get("allowedSec") or 0),
            "maxEndAt": int(data.get("maxEndAt") or 0),
        }
    except Exception as e:
        log.warning("call_greeted session=%s failed: %s", session_id, e)
        return None


async def call_start(
    api_base: str | None, clone_id: int | None, session_id: str | None, access_token: str | None,
) -> None:
    """통화 시작 시 call_sessions 기록 생성. JWT(access_token)로 api가 userId 확정.
    실패는 흡수(통화 무영향). access_token은 로그에 절대 출력하지 않는다(mizu H-2).

    [T-167] PRETHIRD_LEARN_ENABLED 게이트를 제거했다.
    call_sessions 는 통화기록(누가·누구와·언제·얼마나)의 단일 출처이고,
    call_end 가 갱신할 대상 행이기도 하다. 이 INSERT 가 학습 토글에 묶여 있으면
    학습이 꺼진 환경에서 통화기록이 통째로 사라지고, 정산할 행조차 없어진다.
    통화기록은 학습 여부와 무관하게 항상 남긴다 — 과금 제외는 별도 플래그로 한다."""
    try:
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
    """통화 종료 시 ended_at 기록 + [T-167] 과금 정산 트리거.
    teardown 시점엔 토큰 폐기라 LEARN_SECRET로 인증.
    best-effort fire-and-forget. 실패는 흡수.

    [T-167] PRETHIRD_LEARN_ENABLED 게이트를 제거했다 — 이 호출이 정산을
    트리거하므로 학습 토글과 무관하게 항상 나가야 한다. 게이트가 남아 있으면
    학습 토글이 꺼진 환경에서 모든 통화의 과금이 통째로 누락된다.
    (call_start 는 학습용 세션 생성이라 게이트를 유지한다.)"""
    try:
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
