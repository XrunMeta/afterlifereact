"""bundle_client — api GET /oth-path 조회. 실패 시 graceful(None).
prethird는 토큰 검증 안 함(api가 함). 토큰을 로그에 출력하지 말 것.
경로 prefix는 /oth-path (RN 의 /oth-path 과 동일 mount)."""
from __future__ import annotations
import os, logging, aiohttp

log = logging.getLogger("prethird.bundle_client")
API_BASE = os.environ.get("PRETHIRD_API_BASE")  # 미설정 시 None → fetch_bundle이 graceful skip
TIMEOUT_S = float(os.environ.get("PRETHIRD_BUNDLE_TIMEOUT", "2.0"))


async def fetch_bundle(api_base: str | None, clone_id, access_token: str | None) -> dict | None:
    """{personaBundle, assets} 또는 None(graceful). token/clone_id 없으면 None."""
    if not access_token or clone_id is None:
        return None
    base = api_base or API_BASE
    if not base:
        log.warning("PRETHIRD_API_BASE 미설정 — bundle 조회 skip (clone=%s)", clone_id)
        return None
    url = f"{base}/oth-path"
    try:
        timeout = aiohttp.ClientTimeout(total=TIMEOUT_S)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.get(url, headers={"Authorization": f"Bearer {access_token}"}) as resp:
                if resp.status != 200:
                    log.warning("bundle fetch http=%s clone=%s", resp.status, clone_id)
                    return None
                return await resp.json()
    except Exception as e:
        log.warning("bundle fetch failed clone=%s: %s", clone_id, e)
        return None
