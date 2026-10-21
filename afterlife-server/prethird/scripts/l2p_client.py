# scripts/ 직하(비패키지) → 절대 import. learn_writeback._post_learn HTTP 관례 복제.
from __future__ import annotations
import os
import logging
import aiohttp

log = logging.getLogger("prethird.l2p")

_TIMEOUT_S = 5.0


def _params(person_id: int, user_id: int) -> dict:
    # AFL-1030: API 가 person.user_id == userId 까지 검증(필수)
    return {"personId": person_id, "userId": user_id}


async def fetch_l2p(clone_id: int, person_id: int, user_id: int) -> dict | None:
    """T-067 Task 12: 화자(person)별 L2' 관계 컨텍스트 조회.

    GET {api_base}/oth-path?personId={person_id}
    → {"data": object|null, "displayName": str|None}. data가 있으면 반환, 없거나
    (404=비연관 조합·환경변수 미설정·네트워크 오류) 어떤 경우든 None — 통화 무영향
    (호출측은 None을 "화자 이름 힌트만" 폴백으로 처리).
    """
    secret = os.environ.get("LEARN_SECRET")
    api_base = os.environ.get("PRETHIRD_API_BASE")
    if not secret or not api_base or not user_id:
        return None  # AFL-1030: user_id 필수 — 없으면 호출하지 않는다(fail-closed)
    url = f"{api_base}/oth-path"
    timeout = aiohttp.ClientTimeout(total=_TIMEOUT_S)
    try:
        async with aiohttp.ClientSession(timeout=timeout) as s:
            async with s.get(
                url,
                params=_params(person_id, user_id),
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


async def verify_person_scope(clone_id, user_id, person_id) -> str:
    """AFL-1030: person 이 이 통화의 (user_id x clone_id) 소속인지 API 로 검증한다.

    반환: "ok"(200 소속) | "denied"(404 범위 밖 — 확정 거부, 캐시해도 됨) |
          "error"(그 외 일시 오류: 401·5xx·네트워크·타임아웃·env 미설정·입력 누락 — 캐시 금지).
    둘 다 채택하지 않는다(fail-closed). 응답 본문은 쓰지 않는다.
    """
    secret = os.environ.get("LEARN_SECRET")
    api_base = os.environ.get("PRETHIRD_API_BASE")
    if not secret or not api_base or clone_id is None or not user_id or person_id is None:
        return "error"
    url = f"{api_base}/oth-path"
    timeout = aiohttp.ClientTimeout(total=_TIMEOUT_S)
    try:
        async with aiohttp.ClientSession(timeout=timeout) as s:
            async with s.get(
                url,
                params=_params(person_id, user_id),
                headers={"Authorization": f"Bearer {secret}"},
            ) as r:
                if r.status == 200:
                    return "ok"
                return "denied" if r.status == 404 else "error"
    except Exception as e:
        log.warning("verify_person_scope failed clone=%s person=%s: %s", clone_id, person_id, e)
        return "error"
