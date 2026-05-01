"""CF Realtime SFU smoke test — sessions/new only.

Usage (server-side):
    set -a; source /home/afterlife/.env.vars; set +a
    python cf_realtime_smoke.py
"""
import os
import asyncio
import httpx

APP_ID = os.environ.get("CF_REALTIME_APP_ID")
APP_SECRET = os.environ.get("CF_REALTIME_APP_SECRET")
BASE = f"https://rtc.live.cloudflare.com/v1/apps/{APP_ID}"

async def main() -> None:
    if not APP_ID or not APP_SECRET:
        raise SystemExit("missing CF_REALTIME_APP_ID / SECRET in env")

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f"{BASE}/sessions/new",
            headers={"Authorization": f"Bearer {APP_SECRET}"},
        )
        print(f"sessions/new: HTTP {r.status_code}")
        # body 길이만 노출 — secret/sessionId 본문은 짧아 안전하지만 secret 인근 헤더는 출력 X
        body = r.text
        print(f"  body_len: {len(body)}")
        if r.status_code != 200:
            print(f"  body_preview: {body[:200]}")
            return
        try:
            data = r.json()
        except Exception as e:  # noqa: BLE001
            print(f"  json_parse_err: {e}")
            return
        session_id = data.get("sessionId") or data.get("sessionDescription", {}).get("sessionId")
        # sessionId 는 secret 아님(임시 식별자) — 길이만 표시해서 모자이크
        print(f"  sessionId_present: {bool(session_id)}")
        if session_id:
            print(f"  sessionId_len: {len(session_id)}")
            print(f"  sessionId_prefix8: {session_id[:8]}")
        print(f"  keys: {sorted(data.keys())}")

if __name__ == "__main__":
    asyncio.run(main())
