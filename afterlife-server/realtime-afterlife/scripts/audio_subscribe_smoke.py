"""publisher → audio track subscribe smoke (회차 029-D-2c-after-2-fix1).

publisher 의 /subscribe HTTP endpoint 를 통해 publisher 가 publish 중인
audio (그리고 video) track 을 받아서 5초간 수신한 frame 수와 PCM samples
통계를 출력. 음성 RTP 가 실제로 흘러나오는지 검증용.

flow:
  1. publisher /healthz 로 publishing 확인
  2. publisher /subscribe POST 로 offer SDP 받기
  3. local pc 에서 setRemoteDescription(offer) → createAnswer → setLocalDescription
  4. publisher /subscribe/renegotiate 로 answer 송신
  5. on('track') 으로 audio frame 수신 카운트 (옵션: wav dump)

Usage:
    python scripts/audio_subscribe_smoke.py [--duration 5] [--dump /tmp/sub.wav]

Env:
    PUBLISHER_URL       (default: http://127.0.0.1:8400)
    DUMP_WAV            (default: 비활성)
"""
from __future__ import annotations

import argparse
import asyncio
import os
import time
import wave
from typing import List, Optional

import aiohttp
import numpy as np
from aiortc import RTCPeerConnection, RTCSessionDescription

async def _http_get_json(url: str) -> dict:
    async with aiohttp.ClientSession() as s:
        async with s.get(url) as r:
            return await r.json(content_type=None)

async def _http_post_json(url: str, payload: Optional[dict] = None) -> dict:
    async with aiohttp.ClientSession() as s:
        async with s.post(url, json=payload or {}) as r:
            txt = await r.text()
            if r.status >= 300:
                raise SystemExit(f"POST {url} failed HTTP {r.status} body={txt[:300]}")
            return await r.json(content_type=None)

async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--duration", type=float, default=5.0)
    parser.add_argument("--dump", type=str, default=os.environ.get("DUMP_WAV", ""))
    parser.add_argument(
        "--publisher", type=str, default=os.environ.get("PUBLISHER_URL", "http://127.0.0.1:8400")
    )
    args = parser.parse_args()

    pub = args.publisher.rstrip("/")
    h = await _http_get_json(f"{pub}/healthz")
    print(f"healthz pre: state={h.get('state')} audio_enabled={h.get('audio_enabled')} "
          f"recv_count={h.get('audio_recv_count')} real={h.get('audio_frames_real')} "
          f"silence={h.get('audio_frames_silence')} pushed_in={h.get('audio_samples_pushed_in')} "
          f"yielded_out={h.get('audio_samples_yielded_out')}")
    if h.get("state") != "publishing":
        raise SystemExit(f"publisher not publishing: {h}")

    # 1) publisher /subscribe → offer
    sub = await _http_post_json(f"{pub}/subscribe")
    sub_sid = sub["subscriber_session_id"]
    offer_sdp = sub["offer_sdp"]
    print(f"got offer sdp_len={len(offer_sdp)} m_lines="
          f"{sum(1 for ln in offer_sdp.splitlines() if ln.startswith('m='))}")

    # 2) local pc 에서 answer 생성
    pc = RTCPeerConnection()

    audio_frames: List = []
    video_frames = 0
    audio_done = asyncio.Event()

    @pc.on("track")
    def _on_track(track):
        nonlocal video_frames
        kind = track.kind
        print(f"on_track kind={kind} id={track.id}")

        async def _consume() -> None:
            nonlocal video_frames
            try:
                t_end = time.time() + args.duration + 0.5
                while time.time() < t_end:
                    frame = await track.recv()
                    if kind == "audio":
                        audio_frames.append(frame)
                    else:
                        video_frames += 1
            except Exception as e:  # noqa: BLE001
                print(f"recv err kind={kind}: {e}")
            finally:
                if kind == "audio":
                    audio_done.set()

        asyncio.create_task(_consume())

    await pc.setRemoteDescription(RTCSessionDescription(sdp=offer_sdp, type="offer"))
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    # 3) renegotiate 로 answer 전달
    await _http_post_json(
        f"{pub}/subscribe/renegotiate",
        {"subscriber_session_id": sub_sid, "answer_sdp": pc.localDescription.sdp},
    )
    print("renegotiate ok, recv frames…")

    # 4) duration 동안 수신
    try:
        await asyncio.wait_for(audio_done.wait(), timeout=args.duration + 5.0)
    except asyncio.TimeoutError:
        print("audio recv timeout (no frames or partial)")

    # 통계
    n_audio = len(audio_frames)
    total_samples = 0
    nonzero_samples = 0
    pcm_chunks: List[np.ndarray] = []
    sr = None
    layout = None
    fmt = None
    for f in audio_frames:
        try:
            arr = f.to_ndarray()
            total_samples += arr.size
            nonzero_samples += int(np.count_nonzero(arr))
            pcm_chunks.append(arr.reshape(-1).astype(np.int16, copy=False))
            if sr is None:
                sr = f.sample_rate
                layout = str(f.layout)
                fmt = str(f.format)
        except Exception as e:  # noqa: BLE001
            print(f"frame parse err: {e}")

    print(f"audio frames={n_audio} total_samples={total_samples} "
          f"nonzero={nonzero_samples} sr={sr} layout={layout} fmt={fmt}")
    print(f"video frames={video_frames}")

    # post healthz 비교
    h2 = await _http_get_json(f"{pub}/healthz")
    print(f"healthz post: recv_count={h2.get('audio_recv_count')} "
          f"real={h2.get('audio_frames_real')} silence={h2.get('audio_frames_silence')} "
          f"pushed_in={h2.get('audio_samples_pushed_in')} "
          f"yielded_out={h2.get('audio_samples_yielded_out')}")

    # wav dump (옵션)
    if args.dump and pcm_chunks:
        try:
            allpcm = np.concatenate(pcm_chunks)
            with wave.open(args.dump, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(sr or 48000)
                wf.writeframes(allpcm.tobytes())
            print(f"dumped wav -> {args.dump} samples={allpcm.size}")
        except Exception as e:  # noqa: BLE001
            print(f"dump err: {e}")

    await pc.close()

if __name__ == "__main__":
    asyncio.run(main())
