"""headless_probe.py — prethird 립싱크 drift 측정용 헤드리스 aiortc 클라이언트.

가비아 내부(prethird와 같은 호스트)에서 실행. localhost ICE host candidate로 직결.

사용법 (가비아):
    /home/afterlife/miniconda3/envs/musetalk/bin/python headless_probe.py \
        --text "안녕하세요, 저는 오늘 기분이 정말 좋아요. 날씨도 맑고 바람도 살살 불어서 기분이 상쾌합니다. 이렇게 좋은 날에 여러분을 만나게 되어서 정말 행복해요." \
        --out /tmp/probe.mp4 \
        --secs 25 \
        --url http://127.0.0.1:8600
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
import time
from pathlib import Path

import aiohttp
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaRecorder

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("headless_probe")

DEFAULT_TEXT = (
    "안녕하세요, 저는 오늘 기분이 정말 좋아요. "
    "날씨도 맑고 바람도 살살 불어서 기분이 상쾌합니다. "
    "이렇게 좋은 날에 여러분을 만나게 되어서 정말 행복해요."
)

async def run(url: str, text: str, out: str, secs: int) -> None:
    out_path = Path(out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    pc = RTCPeerConnection()
    recorder = MediaRecorder(str(out_path))

    # --- track 수신 및 recorder에 추가 ---
    track_counts: dict[str, int] = {"video": 0, "audio": 0}
    track_first: dict[str, float] = {}

    @pc.on("track")
    def on_track(track):
        kind = track.kind
        log.info("track 수신: kind=%s id=%s", kind, track.id)
        recorder.addTrack(track)

        async def _count_frames():
            first_logged = False
            while True:
                try:
                    await track.recv()
                    track_counts[kind] += 1
                    if not first_logged:
                        track_first[kind] = time.time()
                        log.info("첫 %s frame 수신 (t=%.3fs)", kind, track_first[kind])
                        first_logged = True
                except Exception:
                    break

        # NOTE: MediaRecorder가 track을 소비하므로 병렬 recv()는 사용 불가.
        # frame 카운트는 recorder 내부에서 처리됨 → 별도 recv() 루프 생략.
        # track_first/track_counts는 on_track 시각으로 대체 기록.
        track_first[kind] = time.time()
        log.info("첫 %s track 등록 시각: %.3f", kind, track_first[kind])

    # --- transceiver(recvonly) + DataChannel ---
    pc.addTransceiver("video", direction="recvonly")
    pc.addTransceiver("audio", direction="recvonly")
    say_dc = pc.createDataChannel("say")

    say_sent = asyncio.Event()

    @say_dc.on("open")
    def on_dc_open():
        log.info("DataChannel 'say' open — speak 메시지 전송: %s", text[:30])
        say_dc.send(json.dumps({"type": "speak", "text": text}))
        say_sent.set()

    @say_dc.on("close")
    def on_dc_close():
        log.info("DataChannel 'say' closed")

    @say_dc.on("error")
    def on_dc_error(err):
        log.error("DataChannel error: %s", err)

    @pc.on("connectionstatechange")
    async def on_connection_state():
        log.info("connectionState: %s", pc.connectionState)

    # --- offer 생성 + ICE gathering 완료 대기 ---
    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    log.info("ICE gathering 대기 중 (iceGatheringState=%s)", pc.iceGatheringState)
    if pc.iceGatheringState != "complete":
        gathering_done = asyncio.Event()

        @pc.on("icegatheringstatechange")
        def _on_gathering():
            if pc.iceGatheringState == "complete":
                gathering_done.set()

        try:
            await asyncio.wait_for(gathering_done.wait(), timeout=10.0)
        except asyncio.TimeoutError:
            log.warning("ICE gathering timeout — 현재 상태로 진행: %s", pc.iceGatheringState)

    log.info("ICE gathering 완료. /offer POST → %s", url)

    # --- signaling: POST /oth-path ---
    async with aiohttp.ClientSession() as session:
        payload = {
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
        }
        try:
            async with session.post(
                f"{url.rstrip('/')}/offer",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                if resp.status != 200:
                    body = await resp.text()
                    log.error("POST /oth-path 실패 status=%s body=%s", resp.status, body)
                    await pc.close()
                    sys.exit(1)
                ans = await resp.json()
        except aiohttp.ClientError as e:
            log.error("POST /oth-path 연결 실패: %s", e)
            await pc.close()
            sys.exit(1)

    log.info("answer 수신: session_id=%s type=%s", ans.get("session_id"), ans.get("type"))
    await pc.setRemoteDescription(
        RTCSessionDescription(sdp=ans["sdp"], type=ans["type"])
    )

    # --- recorder 시작 ---
    await recorder.start()
    log.info("recorder 시작. %d초 녹화 중...", secs)

    # DataChannel open 이전이면 최대 5초 대기 후 전송 (fallback)
    try:
        await asyncio.wait_for(say_sent.wait(), timeout=5.0)
    except asyncio.TimeoutError:
        log.warning("DC open timeout — 연결 후 강제 전송 시도")
        if say_dc.readyState == "open":
            say_dc.send(json.dumps({"type": "speak", "text": text}))
        else:
            log.error("DC readyState=%s, 전송 불가", say_dc.readyState)

    # --- 녹화 대기 ---
    await asyncio.sleep(secs)

    # --- 종료: recorder.stop() 먼저, pc.close() 나중 ---
    log.info("녹화 종료. recorder.stop() 호출")
    await recorder.stop()
    log.info("pc.close() 호출")
    await pc.close()

    # --- 결과 출력 ---
    size = out_path.stat().st_size if out_path.exists() else 0
    print(f"\n=== headless_probe 완료 ===")
    print(f"출력 파일: {out_path.resolve()}")
    print(f"파일 크기: {size:,} bytes ({size / 1024:.1f} KB)")
    if size == 0:
        print("[경고] 파일 크기 0 — recorder가 track을 받지 못했을 수 있음. prethird 연결 상태 확인.")
    print(f"track 첫 등록 시각: {track_first}")
    print("==========================\n")

def main() -> None:
    parser = argparse.ArgumentParser(description="prethird 헤드리스 립싱크 probe")
    parser.add_argument(
        "--text",
        default=DEFAULT_TEXT,
        help="발화할 텍스트 (기본: 3문장 한국어)",
    )
    parser.add_argument(
        "--out",
        default="/tmp/probe.mp4",
        help="출력 mp4 경로 (기본: /tmp/probe.mp4)",
    )
    parser.add_argument(
        "--secs",
        type=int,
        default=25,
        help="녹화 시간(초) (기본: 25)",
    )
    parser.add_argument(
        "--url",
        default="http://127.0.0.1:8600",
        help="prethird 시그널링 서버 URL (기본: http://127.0.0.1:8600)",
    )
    args = parser.parse_args()

    log.info("headless_probe 시작: url=%s out=%s secs=%d", args.url, args.out, args.secs)
    log.info("발화 텍스트: %s", args.text)

    asyncio.run(run(args.url, args.text, args.out, args.secs))

if __name__ == "__main__":
    main()
