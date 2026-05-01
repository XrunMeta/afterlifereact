"""aiortc PeerConnection offer SDP smoke test.

회차 029-D-1: PoC 의 첫 단계 — MediaPlayer 로 video track 만들고
PeerConnection.createOffer() 까지만 검증. 실제 publish 는 029-D-2.
"""
import asyncio
import os

from aiortc import RTCPeerConnection
from aiortc.contrib.media import MediaPlayer


CANDIDATES = [
    "/home/afterlife/afterlife-server/liveportrait-afterlife/outputs/halbae-front--d11.mp4",
    "/home/afterlife/afterlife-server/musetalk-afterlife/source/data/video/yongen.mp4",
]


async def main() -> None:
    src = next((c for c in CANDIDATES if os.path.isfile(c)), None)
    if not src:
        print("no_video_source")
        return
    print(f"video_src: {src}")

    pc = RTCPeerConnection()
    try:
        player = MediaPlayer(src)
        if player.video is None:
            print("no_video_track_in_source")
            return
        pc.addTrack(player.video)
        print("video_track_added")

        offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        sdp = pc.localDescription.sdp
        first_line = sdp.splitlines()[0] if sdp else ""
        print(f"sdp_type: {pc.localDescription.type}")
        print(f"sdp_len: {len(sdp)}")
        print(f"sdp_first_line: {first_line}")
        # m=video / m=audio 라인 카운트만
        m_lines = [ln for ln in sdp.splitlines() if ln.startswith("m=")]
        print(f"m_lines: {m_lines}")
        print("OK")
    finally:
        await pc.close()


if __name__ == "__main__":
    asyncio.run(main())
