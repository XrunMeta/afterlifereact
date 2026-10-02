# scripts/ 직하(비패키지) → 절대 import. turn_writeback.py 와 같은 graceful 패턴.
#
# AFL-926: 계정×클론 이전 대화 조회 (통화 간 이어붙이기).
#
# 통화 시작 시 이 계정과 이 클론이 예전 통화에서 나눈 대화(call_turns)를 받아 LLM 맥락
# 앞에 붙인다. 대화 맥락을 OpenAI 서버 세션에 맡기지 않고 우리 DB 를 정본으로 쓰는
# 결정(2026-10-02 히즈키)에 따른 읽기 경로다 — 쓰기는 turn_writeback 이 이미 하고 있다.
#
# 인증은 turn_writeback 과 같은 ORCH_SECRET (같은 데이터의 읽기 쪽).
# 실패는 절대 통화로 전파하지 않는다 — 이전 대화는 보조 맥락이라 못 받으면 빈 목록.
#
# env:
#   PRETHIRD_PRIOR_CONVERSATION : "1" 이면 조회(기본 "0" — 배선해도 기존 동작 그대로)
#   PRETHIRD_PRIOR_MAX_TURNS    : 최근 몇 턴까지 받을지(기본 400 · API 상한 1000)
from __future__ import annotations
import os
import re
import logging
import aiohttp

log = logging.getLogger("prethird.prior")

# 통화 준비(다이얼링) 중에 부르므로 짧게 끊는다. bundle 조회(2s)와 같은 감각.
_TIMEOUT_S = 2.0
_CALL_ID_RE = re.compile(r"[0-9a-f]{12}")


def enabled() -> bool:
    return os.environ.get("PRETHIRD_PRIOR_CONVERSATION", "0") == "1"


def _max_turns() -> int:
    try:
        v = int(os.environ.get("PRETHIRD_PRIOR_MAX_TURNS", "400"))
        return v if v > 0 else 400
    except ValueError:
        return 400


async def fetch_prior_turns(user_id, clone_id, exclude_call_id: str | None = None) -> list[dict]:
    """[{callId, role, text, at}, ...] 시간순. 꺼져 있거나 실패하면 []."""
    try:
        if not enabled():
            return []
        secret = os.environ.get("ORCH_SECRET")
        api_base = os.environ.get("PRETHIRD_API_BASE")
        if not secret or not api_base:
            log.warning("prior: ORCH_SECRET/PRETHIRD_API_BASE 미설정 — 이전 대화 생략")
            return []
        uid, cid = int(user_id), int(clone_id)
        if uid <= 0 or cid <= 0:
            return []
        params = {"maxTurns": str(_max_turns())}
        if exclude_call_id and _CALL_ID_RE.fullmatch(exclude_call_id):
            params["excludeCallId"] = exclude_call_id
        url = f"{api_base.rstrip('/')}/oth-path"
        timeout = aiohttp.ClientTimeout(total=_TIMEOUT_S)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.get(url, params=params,
                                headers={"Authorization": f"Bearer {secret}"}) as resp:
                if resp.status != 200:
                    log.warning("prior: http %s user=%s clone=%s", resp.status, uid, cid)
                    return []
                body = await resp.json()
        turns = body.get("turns") if isinstance(body, dict) else None
        if not isinstance(turns, list):
            return []
        log.info("prior: user=%s clone=%s turns=%d resetAt=%s",
                 uid, cid, len(turns), body.get("resetAt"))
        return turns
    except Exception as exc:  # noqa: BLE001 — 어떤 실패도 통화로 새지 않는다
        log.warning("prior: fetch 실패 user=%s clone=%s: %s", user_id, clone_id, exc)
        return []
