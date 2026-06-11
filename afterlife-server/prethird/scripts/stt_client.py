"""stt_client — 가비아 STT(8202) /transcribe {clone_id} 호출. ref_text.txt 선빌드용.
실패는 False 반환(graceful). prethird→8202 내부망."""
from __future__ import annotations
import logging
import aiohttp

log = logging.getLogger("prethird.stt_client")

async def transcribe_clone(clone_id: str, stt_url: str = "http://127.0.0.1:8202",
                           timeout_s: float = 180.0) -> bool:
    """STT 서버에 clone_id 전사 요청. voice.wav→ref_text.txt 원자 배치는 STT 서버가 수행.
    성공 True, 실패 False(예외 전파 안 함)."""
    url = f"{stt_url}/transcribe"
    try:
        async with aiohttp.ClientSession() as sess:
            async with sess.post(url, json={"clone_id": clone_id},
                                 timeout=aiohttp.ClientTimeout(total=timeout_s)) as resp:
                if resp.status == 200:
                    return True
                body = await resp.json()
                log.warning("stt transcribe http=%s clone=%s body=%s", resp.status, clone_id, body)
                return False
    except Exception as e:
        log.warning("stt transcribe failed clone=%s: %s", clone_id, e)
        return False
