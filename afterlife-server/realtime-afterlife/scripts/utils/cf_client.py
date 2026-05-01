"""CF Realtime API HTTP wrapper.

회차 029-D-2a — publisher.py 가 사용.

Usage:
    client = CFRealtimeClient(base, app_id, token)
    sid = await client.create_session()
    answer = await client.tracks_new(sid, offer_sdp, "video1")
    # answer = {"answer_sdp": "...", "tracks": [...]}
"""
from __future__ import annotations

import aiohttp


class CFRealtimeError(RuntimeError):
    """CF Realtime API non-2xx 응답."""


class CFRealtimeClient:
    def __init__(self, base: str, app_id: str, token: str, timeout: float = 10.0):
        if not base or not app_id or not token:
            raise ValueError("CFRealtimeClient: base/app_id/token required")
        self._base = base.rstrip("/")
        self._app_id = app_id
        self._token = token
        self._timeout = aiohttp.ClientTimeout(total=timeout)

    @property
    def _app_base(self) -> str:
        return f"{self._base}/apps/{self._app_id}"

    @property
    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._token}"}

    async def create_session(self) -> str:
        url = f"{self._app_base}/sessions/new"
        async with aiohttp.ClientSession(timeout=self._timeout) as s:
            async with s.post(url, headers=self._headers) as r:
                body = await r.text()
                if r.status >= 300:
                    raise CFRealtimeError(
                        f"sessions/new failed: HTTP {r.status} body={body[:200]}"
                    )
                try:
                    data = await r.json(content_type=None)
                except Exception as e:  # noqa: BLE001
                    raise CFRealtimeError(f"sessions/new json parse: {e}; body={body[:200]}")
                sid = data.get("sessionId")
                if not sid:
                    raise CFRealtimeError(f"sessions/new no sessionId: keys={list(data.keys())}")
                return sid

    async def tracks_new(
        self,
        session_id: str,
        offer_sdp: str,
        track_name: str = "video1",
        mid: str = "0",
    ) -> dict:
        """tracks/new — CF 는 트랙별 `mid`(SDP transceiver mid) 를 요구."""
        url = f"{self._app_base}/sessions/{session_id}/tracks/new"
        payload = {
            "sessionDescription": {"type": "offer", "sdp": offer_sdp},
            "tracks": [
                {"location": "local", "trackName": track_name, "mid": mid}
            ],
        }
        async with aiohttp.ClientSession(timeout=self._timeout) as s:
            async with s.post(url, headers=self._headers, json=payload) as r:
                body = await r.text()
                if r.status >= 300:
                    raise CFRealtimeError(
                        f"tracks/new failed: HTTP {r.status} body={body[:300]}"
                    )
                try:
                    data = await r.json(content_type=None)
                except Exception as e:  # noqa: BLE001
                    raise CFRealtimeError(f"tracks/new json parse: {e}; body={body[:200]}")
                sd = data.get("sessionDescription") or {}
                answer_sdp = sd.get("sdp")
                if not answer_sdp:
                    raise CFRealtimeError(
                        f"tracks/new no answer sdp: keys={list(data.keys())}"
                    )
                return {
                    "answer_sdp": answer_sdp,
                    "tracks": data.get("tracks", []),
                    "raw": data,
                }

    async def tracks_new_remote_pull(
        self,
        subscriber_session_id: str,
        publisher_session_id: str,
        track_name: str = "video1",
    ) -> dict:
        """tracks/new (remote, pull) — body 에 SDP 없이 호출하여
        CF 로부터 offer SDP 를 받음. CF Realtime subscriber 표준 흐름.

        반환: {"offer_sdp": "...", "tracks": [...], "requires_renegotiation": bool}

        실험으로 확인된 트랩:
        - sessionDescription 을 offer 로 보내면 CF 가 답변 대신
          requiresImmediateRenegotiation 만 반환하는 케이스가 있음.
        - body 에 SDP 없이 호출하면 CF 가 offer SDP 를 보내주고
          requiresImmediateRenegotiation:true 와 tracks 정보 동봉.
        - 클라이언트는 그 offer 로 createAnswer 하고 /renegotiate 로 answer 송신.
        """
        url = (
            f"{self._app_base}/sessions/{subscriber_session_id}/tracks/new"
        )
        payload = {
            "tracks": [
                {
                    "location": "remote",
                    "sessionId": publisher_session_id,
                    "trackName": track_name,
                }
            ],
        }
        async with aiohttp.ClientSession(timeout=self._timeout) as s:
            async with s.post(url, headers=self._headers, json=payload) as r:
                body = await r.text()
                if r.status >= 300:
                    raise CFRealtimeError(
                        f"tracks/new(remote pull) failed: HTTP {r.status} body={body[:300]}"
                    )
                try:
                    data = await r.json(content_type=None)
                except Exception as e:  # noqa: BLE001
                    raise CFRealtimeError(
                        f"tracks/new(remote pull) json parse: {e}; body={body[:200]}"
                    )
                sd = data.get("sessionDescription") or {}
                offer_sdp = sd.get("sdp")
                if not offer_sdp:
                    raise CFRealtimeError(
                        f"tracks/new(remote pull) no SDP: keys={list(data.keys())}"
                    )
                return {
                    "offer_sdp": offer_sdp,
                    "tracks": data.get("tracks", []),
                    "requires_renegotiation": bool(
                        data.get("requiresImmediateRenegotiation", False)
                    ),
                    "raw": data,
                }

    async def renegotiate(
        self,
        session_id: str,
        answer_sdp: str,
    ) -> dict:
        """PUT /oth-path — subscriber pull 흐름 마무리.

        body: {"sessionDescription": {"type": "answer", "sdp": ...}}
        """
        url = f"{self._app_base}/sessions/{session_id}/renegotiate"
        payload = {
            "sessionDescription": {"type": "answer", "sdp": answer_sdp},
        }
        async with aiohttp.ClientSession(timeout=self._timeout) as s:
            async with s.put(url, headers=self._headers, json=payload) as r:
                body = await r.text()
                if r.status >= 300:
                    raise CFRealtimeError(
                        f"renegotiate failed: HTTP {r.status} body={body[:300]}"
                    )
                try:
                    return await r.json(content_type=None)
                except Exception:  # noqa: BLE001
                    return {"raw": body}
