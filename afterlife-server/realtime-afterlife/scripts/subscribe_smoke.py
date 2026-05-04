"""CF Realtime subscriber smoke (optional).

회차 029-D-2a — publisher 가 CF 에 publish 한 트랙을
별도 세션에서 location:"remote" 로 잡아당겨 첫 5 frame 만 수신 검증.

Usage:
    set -a && . /home/afterlife/.env.vars && set +a
    python scripts/subscribe_smoke.py <publisher_session_id> <track_name>
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import aiohttp
from aiortc import RTCPeerConnection, RTCSessionDescription

sys.path.insert(0, str(Path(__file__).resolve().parent))
from utils.cf_client import CFRealtimeClient  # noqa: E402

async def _tracks_new_remote(
    base: str,
    app_id: str,
    token: str,
    session_id: str,
    remote_session_id: str,
    track_name: str,
    offer_sdp: str,
) -> dict:
    url = f"{base.rstrip('/')}/apps/{app_id}/sessions/{session_id}/tracks/new"
    payload = {
        "sessionDescription": {"type": "offer", "sdp": offer_sdp},
        "tracks": [
            {
                "location": "remote",
                "sessionId": remote_session_id,
                "trackName": track_name,
            }
        ],
    }
    async with aiohttp.ClientSession() as s:
        async with s.post(url, headers={"Authorization": f"Bearer {token}"}, json=payload) as r:
            body = await r.text()
            if r.status >= 300:
                raise SystemExit(f"remote tracks/new failed HTTP {r.status} body={body[:300]}")
            return await r.json(content_type=None)

async def main() -> None:
    if len(sys.argv) < 3:
        print("usage: subscribe_smoke.py <publisher_session_id> <track_name>")
        sys.exit(2)
    pub_sid = sys.argv[1]
    track_name = sys.argv[2]

    base = os.environ.get("CF_REALTIME_BASE", "https://rtc.live.cloudflare.com/v1")
    app_id = os.environ.get("CF_REALTIME_APP_ID")
    token = os.environ.get("CF_REALTIME_APP_TOKEN") or os.environ.get(
        "CF_REALTIME_APP_SECRET"
    )
    if not app_id or not token:
        raise SystemExit("missing CF_REALTIME_APP_ID / (CF_REALTIME_APP_TOKEN|_APP_SECRET)")

    cf = CFRealtimeClient(base, app_id, token)
    sub_sid = await cf.create_session()
    print(f"subscriber sessionId_prefix={sub_sid[:8]} len={len(sub_sid)}")

    pc = RTCPeerConnection()

    received = 0
    done = asyncio.Event()

    @pc.on("track")
    def _on_track(track):  # noqa: ARG001
        async def _consume() -> None:
            nonlocal received
            try:
                while received < 5:
                    frame = await track.recv()
                    received += 1
                    print(f"frame#{received} pts={frame.pts} size={frame.width}x{frame.height}")
                done.set()
            except Exception as e:  # noqa: BLE001
                print(f"recv err: {e}")
                done.set()

        asyncio.create_task(_consume())

    # SFU 가 보낼 트랙 자리를 미리 — recvonly transceiver
    pc.addTransceiver("video", direction="recvonly")
    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    ans = await _tracks_new_remote(
        base, app_id, token, sub_sid, pub_sid, track_name, pc.localDescription.sdp
    )
    answer_sdp = (ans.get("sessionDescription") or {}).get("sdp")
    if not answer_sdp:
        raise SystemExit(f"no answer sdp keys={list(ans.keys())}")
    await pc.setRemoteDescription(RTCSessionDescription(sdp=answer_sdp, type="answer"))
    print("remote desc set, waiting frames…")

    try:
        await asyncio.wait_for(done.wait(), timeout=15.0)
        if received >= 5:
            print("OK")
        else:
            print(f"PARTIAL received={received}")
    except asyncio.TimeoutError:
        print(f"TIMEOUT received={received}")
    finally:
        await pc.close()

if __name__ == "__main__":
    asyncio.run(main())
