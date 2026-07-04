# scripts/ 직하(비패키지) → 절대 import. learn_writeback._post_learn HTTP 관례 복제.
from __future__ import annotations
import os
import logging
import aiohttp

log = logging.getLogger("prethird.l2p")

_TIMEOUT_S = 5.0


async def fetch_l2p(clone_id: int, person_id: int) -> dict | None:
    """T-067 Task 12: 화자(person)별 L2' 관계 컨텍스트 조회.

    GET {api_base}/oth-path?personId={person_id}
    → {"data": object|null, "displayName": str|None}. data가 있으면 반환, 없거나
    (404=비연관 조합·환경변수 미설정·네트워크 오류) 어떤 경우든 None — 통화 무영향
    (호출측은 None을 "화자 이름 힌트만" 폴백으로 처리).
    """
    secret = os.environ.get("LEARN_SECRET")
    api_base = os.environ.get("PRETHIRD_API_BASE")
    if not secret or not api_base:
        return None
    url = f"{api_base}/oth-path"
    timeout = aiohttp.ClientTimeout(total=_TIMEOUT_S)
    try:
        async with aiohttp.ClientSession(timeout=timeout) as s:
            async with s.get(
                url,
                params={"personId": person_id},
                headers={"Authorization": f"Bearer {secret}"},
            ) as r:
                if r.status != 200:
                    return None
                payload = await r.json()
                data = payload.get("data") if isinstance(payload, dict) else None
                return data if isinstance(data, dict) else None
    except Exception as e:
        log.warning("fetch_l2p failed clone=%s person=%s: %s", clone_id, person_id, e)
        return None
