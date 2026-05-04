"""aiortc publisher → CF Realtime SFU.

회차 029-D-2a — control HTTP server (aiohttp) 로
/publish/start /publish/stop /healthz 노출.

회차 029-D-2b — /subscribe 추가 (브라우저 클라이언트가 publisher 트랙 구독).

회차 029-D-2c — frame queue 모드 (MuseTalk → publisher push):
  StreamableVideoTrack 가 dummy 또는 queue 모드로 동작.
  POST /oth-path bytes → 큐에 적재 (JPEG 80% quality 권장)
  POST /oth-path stream 종료 (큐 flush)
  /publish/start body: {mode: "dummy"|"queue"} (default "dummy")

회차 029-D-2c-after-2 — audio track 추가 (RTP sync 자동):
  StreamableAudioTrack 가 video 와 같은 PeerConnection 에 add 됨.
  POST /oth-path raw PCM s16le 또는 wav (X-Sample-Rate, X-Channels)
  POST /oth-path 큐 flush (silence 시작 신호)
  /publish/start body: {video: bool, audio: bool} (default 둘 다 true)
  큐 비면 silence frame yield → 끊김 없음.

Endpoints:
  POST /oth-path         → {sessionId, trackName, state: "publishing", mode}
  POST /oth-path          → {state: "stopped"}
  POST /oth-path             → {subscriber_session_id, offer_sdp, tracks,
                                requires_renegotiation}
  POST /oth-path → {ok: true}
  POST /oth-path            → {queued: N, dropped: bool}  (raw JPEG/RGB body)
  POST /oth-path        → {flushed: N}
  POST /oth-path            → {queued: N, dropped: bool}  (PCM s16le or wav)
  POST /oth-path        → {flushed: N}
  GET /oth-path               → {state, sessionId, trackName, uptime_s, mode,
                                queue_depth, audio_queue_depth, audio_enabled}

Env:
  CF_REALTIME_APP_ID       (required)
  CF_REALTIME_APP_TOKEN    (required)
  CF_REALTIME_BASE         (default: https://rtc.live.cloudflare.com/v1)
  PUBLISHER_BIND           (default: 127.0.0.1)
  PUBLISHER_PORT           (default: 8400)
  PUBLISHER_TRACK_NAME     (default: video1)
  PUBLISHER_AUDIO_TRACK_NAME (default: audio1)
  PUBLISHER_QUEUE_MAX      (default: 60)
  PUBLISHER_AUDIO_QUEUE_MAX (default: 200)

Run:
    set -a && . /home/afterlife/.env.vars && set +a
    python scripts/publisher.py
"""
from __future__ import annotations

import asyncio
import colorsys
import logging
import os
import struct
import sys
import time
import wave
from fractions import Fraction
from pathlib import Path
from typing import Optional

import io

import numpy as np
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaStreamError
from aiortc.mediastreams import AudioStreamTrack, VideoStreamTrack
from av import AudioFrame, VideoFrame
from av.audio.resampler import AudioResampler
from PIL import Image

# scripts/utils import 경로 보정
sys.path.insert(0, str(Path(__file__).resolve().parent))
from utils.cf_client import CFRealtimeClient, CFRealtimeError  # noqa: E402

logging.basicConfig(
    level=os.environ.get("PUBLISHER_LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger("publisher")

WIDTH = 640
HEIGHT = 480
FPS = 30
QUEUE_MAX_DEFAULT = 60
AUDIO_QUEUE_MAX_DEFAULT = 200

# WebRTC 권장: Opus 48kHz mono. aiortc 가 자동 인코딩.
# 내부 frame 단위는 20ms (Opus 표준) → 48000 / 50 = 960 samples / frame.
AUDIO_OUTPUT_SR = 48000
AUDIO_OUTPUT_CHANNELS = 1
AUDIO_FRAME_MS = 20
AUDIO_FRAME_SAMPLES = AUDIO_OUTPUT_SR * AUDIO_FRAME_MS // 1000  # 960


def _dummy_rgb_frame(elapsed: float) -> np.ndarray:
    """단색 frame, 12초 주기 색 회전."""
    h = (elapsed / 12.0) % 1.0
    r, g, b = colorsys.hsv_to_rgb(h, 0.7, 0.9)
    arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    arr[:, :, 0] = int(r * 255)
    arr[:, :, 1] = int(g * 255)
    arr[:, :, 2] = int(b * 255)
    return arr


class StreamableVideoTrack(VideoStreamTrack):
    """모드 토글 가능한 video track.

    mode="dummy": HSV 회전 단색 frame (회차 D-2a/2b 호환)
    mode="queue": 외부 큐(asyncio.Queue) 에서 ndarray 꺼내 yield.
                 큐 비어있으면 last_frame hold (없으면 dummy fallback).
    """

    kind = "video"

    def __init__(self, queue_max: int = QUEUE_MAX_DEFAULT):
        super().__init__()
        self._start = time.time()
        self.mode = "dummy"
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=queue_max)
        self._last_frame: Optional[np.ndarray] = None
        self._stream_ended = False

    def set_mode(self, mode: str) -> None:
        if mode not in ("dummy", "queue"):
            raise ValueError(f"invalid mode: {mode}")
        self.mode = mode
        self._stream_ended = False

    def push_ndarray(self, arr: np.ndarray) -> dict:
        """외부에서 frame 적재. 큐 가득 차면 oldest drop."""
        dropped = False
        if self.queue.full():
            try:
                self.queue.get_nowait()
                dropped = True
            except asyncio.QueueEmpty:
                pass
        try:
            self.queue.put_nowait(arr)
        except asyncio.QueueFull:
            dropped = True
        return {"queued": self.queue.qsize(), "dropped": dropped}

    def signal_end(self) -> int:
        """stream 끝 신호 — 남은 큐 size 반환. 큐 비면 last_frame hold."""
        self._stream_ended = True
        return self.queue.qsize()

    def queue_depth(self) -> int:
        return self.queue.qsize()

    async def recv(self) -> VideoFrame:
        pts, time_base = await self.next_timestamp()
        arr: Optional[np.ndarray] = None

        if self.mode == "queue":
            try:
                # 짧은 timeout 으로 폴링 — 비면 last/dummy fallback
                arr = await asyncio.wait_for(self.queue.get(), timeout=0.02)
                self._last_frame = arr
            except asyncio.TimeoutError:
                arr = self._last_frame  # hold
        # dummy 모드 또는 queue 모드에서 last 도 없을 때
        if arr is None:
            arr = _dummy_rgb_frame(time.time() - self._start)

        # 안전 — 차원 검증
        if arr.ndim != 3 or arr.shape[2] != 3:
            arr = _dummy_rgb_frame(time.time() - self._start)

        frame = VideoFrame.from_ndarray(arr, format="rgb24")
        frame.pts = pts
        frame.time_base = time_base
        return frame


# 후방 호환 alias (기존 코드/테스트가 import 하는 경우)
DummyVideoTrack = StreamableVideoTrack


class StreamableAudioTrack(AudioStreamTrack):
    """외부에서 PCM (s16le) 큐에 push 하면 20ms frame 단위로 yield.

    내부 처리:
      - push 측에서 임의 sample_rate 의 PCM 을 받아 48kHz mono 로 resample
      - 48kHz mono PCM 을 long buffer 에 누적 (numpy int16)
      - recv() 가 buffer 에서 960 samples (20ms) 씩 잘라 av.AudioFrame 으로 yield
      - buffer 부족 시 silence frame
      - kind 는 부모 클래스 (AudioStreamTrack) 가 "audio" 로 세팅
    """

    def __init__(
        self,
        queue_max: int = AUDIO_QUEUE_MAX_DEFAULT,
        sample_rate: int = AUDIO_OUTPUT_SR,
        channels: int = AUDIO_OUTPUT_CHANNELS,
    ):
        super().__init__()
        self.sample_rate = sample_rate
        self.channels = channels
        self.frame_samples = sample_rate * AUDIO_FRAME_MS // 1000
        # PCM int16 buffer (1D mono). queue 는 chunk 단위로 frame buffer 에 합쳐짐.
        self._buffer = np.zeros(0, dtype=np.int16)
        self._buffer_lock = asyncio.Lock()
        # 큐는 backpressure 카운팅 용 (buffer length 기반 max)
        self._queue_max_samples = queue_max * self.frame_samples
        self._stream_ended = False
        # 누적 push 카운트 (관찰용)
        self._pushed_samples = 0
        # AudioStreamTrack 은 next_timestamp 가 없어 직접 관리.
        # pts 는 sample 카운트 누적, time_base = 1/sample_rate.
        self._pts = 0
        self._time_base = Fraction(1, sample_rate)
        self._frame_period = AUDIO_FRAME_MS / 1000.0  # 0.02s
        self._next_send_at: Optional[float] = None
        # 진단 카운터 (회차 029-D-2c-after-2-fix1)
        self.recv_count = 0
        self.frames_yielded_real = 0
        self.frames_yielded_silence = 0
        self.samples_yielded_out = 0

    def push_pcm_int16(self, pcm: np.ndarray) -> dict:
        """48kHz mono int16 PCM 1D ndarray 를 buffer 에 append.
        backpressure 가 max 를 넘으면 oldest 를 drop.
        """
        if pcm.size == 0:
            return {"queued": int(self._buffer.size), "dropped": False}
        if pcm.ndim != 1:
            pcm = pcm.reshape(-1)
        dropped = False
        # 비동기 lock 안에서 mutate 해야 안전. 이 함수는 sync 라 lock-free 로
        # numpy concatenate 를 atomic 으로 수행 (CPython GIL 보호).
        new_buf = np.concatenate([self._buffer, pcm.astype(np.int16, copy=False)])
        if new_buf.size > self._queue_max_samples:
            overflow = new_buf.size - self._queue_max_samples
            new_buf = new_buf[overflow:]
            dropped = True
        self._buffer = new_buf
        self._pushed_samples += int(pcm.size)
        return {"queued": int(self._buffer.size), "dropped": dropped}

    def signal_end(self) -> int:
        self._stream_ended = True
        return int(self._buffer.size)

    def queue_depth(self) -> int:
        # frame 단위로 환산
        return int(self._buffer.size // max(self.frame_samples, 1))

    def queue_depth_samples(self) -> int:
        return int(self._buffer.size)

    async def recv(self) -> AudioFrame:
        # AudioStreamTrack 은 next_timestamp 가 없어 직접 pacing + pts 관리.
        # 20ms 주기로 1 frame 보내기.
        loop = asyncio.get_event_loop()
        now = loop.time()
        if self._next_send_at is None:
            self._next_send_at = now
        delay = self._next_send_at - now
        if delay > 0:
            await asyncio.sleep(delay)
        self._next_send_at += self._frame_period

        self.recv_count += 1

        n = self.frame_samples
        is_real = False
        if self._buffer.size >= n:
            chunk = self._buffer[:n]
            self._buffer = self._buffer[n:]
            is_real = True
        else:
            # silence (또는 잔여 + pad)
            if self._buffer.size > 0:
                head = self._buffer
                pad = np.zeros(n - head.size, dtype=np.int16)
                chunk = np.concatenate([head, pad])
                self._buffer = np.zeros(0, dtype=np.int16)
                is_real = True  # 부분 real
            else:
                chunk = np.zeros(n, dtype=np.int16)
                is_real = False

        # mono int16 → AudioFrame.
        # PyAV 는 mono 일 때 format='s16' 사용. (channels, samples) 형태.
        # aiortc 의 Opus 인코더는 sample_rate 48000, 1ch, s16 expects.
        arr2d = np.ascontiguousarray(chunk.reshape(1, -1), dtype=np.int16)
        frame = AudioFrame.from_ndarray(arr2d, format="s16", layout="mono")
        frame.sample_rate = self.sample_rate
        frame.pts = self._pts
        frame.time_base = self._time_base
        self._pts += n

        if is_real:
            self.frames_yielded_real += 1
        else:
            self.frames_yielded_silence += 1
        self.samples_yielded_out += n
        return frame


def _decode_wav(body: bytes) -> tuple[np.ndarray, int, int]:
    """wav bytes → (int16 mono ndarray, sample_rate, channels).

    multi-channel 은 mono 로 mix.
    PCM 이외 codec 은 ValueError.
    """
    with wave.open(io.BytesIO(body), "rb") as wf:
        sr = wf.getframerate()
        ch = wf.getnchannels()
        sw = wf.getsampwidth()
        nframes = wf.getnframes()
        raw = wf.readframes(nframes)
    if sw == 2:
        arr = np.frombuffer(raw, dtype=np.int16)
    elif sw == 1:
        # u8 → s16
        u8 = np.frombuffer(raw, dtype=np.uint8).astype(np.int16)
        arr = ((u8 - 128) * 256).astype(np.int16)
    elif sw == 4:
        # int32 → int16 (downscale)
        i32 = np.frombuffer(raw, dtype=np.int32)
        arr = (i32 >> 16).astype(np.int16)
    else:
        raise ValueError(f"unsupported_wav_sampwidth: {sw}")
    if ch > 1:
        arr = arr.reshape(-1, ch).mean(axis=1).astype(np.int16)
    return arr, sr, 1


def _resample_int16(
    pcm: np.ndarray, src_sr: int, dst_sr: int = AUDIO_OUTPUT_SR
) -> np.ndarray:
    """linear interpolation resample (가벼운 의존성). mono 만 처리.

    av.audio.resampler.AudioResampler 도 사용 가능하지만, AudioFrame 변환 왕복이
    오버헤드라 PCM int16 mono 한정 빠른 linear resampler 를 직접 구현.
    품질이 부족하면 향후 av.AudioResampler 로 교체.
    """
    if src_sr == dst_sr or pcm.size == 0:
        return pcm.astype(np.int16, copy=False)
    src_n = pcm.size
    dst_n = int(round(src_n * dst_sr / src_sr))
    if dst_n <= 0:
        return np.zeros(0, dtype=np.int16)
    # 위치 인덱스 (dst frame 의 src 좌표)
    x_src = np.arange(src_n, dtype=np.float64)
    x_dst = np.linspace(0, src_n - 1, num=dst_n, dtype=np.float64)
    y = np.interp(x_dst, x_src, pcm.astype(np.float64))
    return np.clip(y, -32768.0, 32767.0).astype(np.int16)


class PublisherState:
    def __init__(self):
        self.state: str = "idle"
        self.session_id: Optional[str] = None
        self.track_name: Optional[str] = None
        self.audio_track_name: Optional[str] = None
        self.pc: Optional[RTCPeerConnection] = None
        self.track: Optional[StreamableVideoTrack] = None
        self.audio_track: Optional[StreamableAudioTrack] = None
        self.mode: str = "dummy"
        self.audio_enabled: bool = False
        self.video_enabled: bool = True
        self.video_mid: Optional[str] = None
        self.audio_mid: Optional[str] = None
        self.started_at: float = time.time()
        self.lock = asyncio.Lock()

    def snapshot(self) -> dict:
        depth = self.track.queue_depth() if self.track is not None else 0
        a_depth = (
            self.audio_track.queue_depth() if self.audio_track is not None else 0
        )
        a_samples = (
            self.audio_track.queue_depth_samples() if self.audio_track is not None else 0
        )
        # 진단 카운터 (회차 029-D-2c-after-2-fix1)
        a_diag: dict = {}
        if self.audio_track is not None:
            at = self.audio_track
            a_diag = {
                "audio_recv_count": int(getattr(at, "recv_count", 0)),
                "audio_frames_real": int(getattr(at, "frames_yielded_real", 0)),
                "audio_frames_silence": int(getattr(at, "frames_yielded_silence", 0)),
                "audio_samples_pushed_in": int(getattr(at, "_pushed_samples", 0)),
                "audio_samples_yielded_out": int(getattr(at, "samples_yielded_out", 0)),
            }
        # transceiver direction (sendonly 인지 검증)
        a_direction: Optional[str] = None
        v_direction: Optional[str] = None
        if self.pc is not None:
            try:
                for t in self.pc.getTransceivers():
                    kind = getattr(t.sender.track, "kind", None) if t.sender else None
                    if kind == "audio":
                        a_direction = getattr(t, "direction", None) or getattr(
                            t, "_direction", None
                        )
                    elif kind == "video":
                        v_direction = getattr(t, "direction", None) or getattr(
                            t, "_direction", None
                        )
            except Exception:  # noqa: BLE001
                pass
        return {
            "state": self.state,
            "sessionId": self.session_id,
            "trackName": self.track_name,
            "audioTrackName": self.audio_track_name,
            "uptime_s": round(time.time() - self.started_at, 2),
            "mode": self.mode,
            "queue_depth": depth,
            "audio_queue_depth": a_depth,
            "audio_queue_samples": a_samples,
            "audio_enabled": self.audio_enabled,
            "video_enabled": self.video_enabled,
            "video_mid": self.video_mid,
            "audio_mid": self.audio_mid,
            "video_direction": v_direction,
            "audio_direction": a_direction,
            **a_diag,
        }


def _env(name: str, default: Optional[str] = None, required: bool = False) -> str:
    v = os.environ.get(name, default)
    if required and not v:
        raise SystemExit(f"missing env {name}")
    return v or ""


async def _start_publish(
    state: PublisherState,
    client: CFRealtimeClient,
    track_name: str,
    audio_track_name: str,
    mode: str = "dummy",
    queue_max: int = QUEUE_MAX_DEFAULT,
    audio_queue_max: int = AUDIO_QUEUE_MAX_DEFAULT,
    video: bool = True,
    audio: bool = True,
) -> dict:
    if state.state != "idle":
        return {"error": f"state={state.state}; stop first", "state": state.state}

    if mode not in ("dummy", "queue"):
        return {"error": f"invalid mode: {mode}", "state": state.state}

    if not video and not audio:
        return {"error": "at_least_one_of_video_or_audio_required"}

    # 1) CF 세션 생성
    sid = await client.create_session()
    log.info("cf sessions/new ok sid_prefix=%s len=%d", sid[:8], len(sid))

    # 2) PeerConnection + streamable track(s) + offer
    pc = RTCPeerConnection()
    v_track: Optional[StreamableVideoTrack] = None
    a_track: Optional[StreamableAudioTrack] = None
    if video:
        v_track = StreamableVideoTrack(queue_max=queue_max)
        v_track.set_mode(mode)
        pc.addTrack(v_track)
    if audio:
        a_track = StreamableAudioTrack(queue_max=audio_queue_max)
        pc.addTrack(a_track)

    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    offer_sdp = pc.localDescription.sdp

    # 3) transceiver mid 매핑 (track.kind 로 매칭)
    transceivers = pc.getTransceivers()
    video_mid: Optional[str] = None
    audio_mid: Optional[str] = None
    for t in transceivers:
        kind = getattr(t.sender.track, "kind", None) if t.sender else None
        if t.mid is None:
            continue
        if kind == "video" and video_mid is None:
            video_mid = t.mid
        elif kind == "audio" and audio_mid is None:
            audio_mid = t.mid
    log.info(
        "offer created sdp_len=%d m_lines=%d video_mid=%s audio_mid=%s",
        len(offer_sdp),
        sum(1 for ln in offer_sdp.splitlines() if ln.startswith("m=")),
        video_mid, audio_mid,
    )

    # 4) tracks/new — multi-track payload
    tracks_payload = []
    if video and video_mid is not None:
        tracks_payload.append(
            {"location": "local", "trackName": track_name, "mid": video_mid}
        )
    if audio and audio_mid is not None:
        tracks_payload.append(
            {"location": "local", "trackName": audio_track_name, "mid": audio_mid}
        )
    try:
        ans = await client.tracks_new_multi(sid, offer_sdp, tracks_payload)
    except CFRealtimeError:
        await pc.close()
        raise
    answer_sdp = ans["answer_sdp"]
    log.info(
        "cf tracks/new ok answer_sdp_len=%d tracks=%d",
        len(answer_sdp), len(ans.get("tracks", [])),
    )

    # 5) setRemoteDescription
    await pc.setRemoteDescription(
        RTCSessionDescription(sdp=answer_sdp, type="answer")
    )

    state.pc = pc
    state.track = v_track
    state.audio_track = a_track
    state.session_id = sid
    state.track_name = track_name if video else None
    state.audio_track_name = audio_track_name if audio else None
    state.mode = mode
    state.video_enabled = video
    state.audio_enabled = audio
    state.video_mid = video_mid
    state.audio_mid = audio_mid
    state.state = "publishing"
    return {
        "sessionId": sid,
        "trackName": state.track_name,
        "audioTrackName": state.audio_track_name,
        "state": "publishing",
        "mode": mode,
        "video": video,
        "audio": audio,
    }


async def _stop_publish(state: PublisherState) -> dict:
    if state.pc is not None:
        try:
            await state.pc.close()
        except Exception as e:  # noqa: BLE001
            log.warning("pc close err: %s", e)
    state.pc = None
    state.track = None
    state.audio_track = None
    state.session_id = None
    state.track_name = None
    state.audio_track_name = None
    state.mode = "dummy"
    state.video_enabled = True
    state.audio_enabled = False
    state.video_mid = None
    state.audio_mid = None
    # 회차 029-D-2c-after-2-fix1: stop 후 바로 다시 start 가능하게 idle 로 복귀.
    # ("stopped" 면 publish/start 가 거부됨 — 운영자가 publisher 재시작해야 했음)
    state.state = "idle"
    return {"state": "stopped"}


def make_app() -> web.Application:
    state = PublisherState()
    base = _env("CF_REALTIME_BASE", "https://rtc.live.cloudflare.com/v1")
    app_id = _env("CF_REALTIME_APP_ID", required=True)
    # 토큰: 회차 029-D-0 PoC 는 CF_REALTIME_APP_SECRET 사용,
    # 회차 029-D-2a 명세는 CF_REALTIME_APP_TOKEN — 둘 다 허용 (TOKEN 우선)
    token = os.environ.get("CF_REALTIME_APP_TOKEN") or os.environ.get(
        "CF_REALTIME_APP_SECRET", ""
    )
    if not token:
        raise SystemExit("missing env CF_REALTIME_APP_TOKEN (or CF_REALTIME_APP_SECRET)")
    default_track_name = _env("PUBLISHER_TRACK_NAME", "video1")
    default_audio_track_name = _env("PUBLISHER_AUDIO_TRACK_NAME", "audio1")
    queue_max = int(_env("PUBLISHER_QUEUE_MAX", str(QUEUE_MAX_DEFAULT)))
    audio_queue_max = int(
        _env("PUBLISHER_AUDIO_QUEUE_MAX", str(AUDIO_QUEUE_MAX_DEFAULT))
    )
    client = CFRealtimeClient(base=base, app_id=app_id, token=token)

    async def healthz(_request: web.Request) -> web.Response:
        return web.json_response(state.snapshot())

    async def publish_start(request: web.Request) -> web.Response:
        # body optional. {mode: "dummy"|"queue", video: bool, audio: bool}
        # 회차 029-D-2c-after-2: video/audio default 둘 다 true.
        # 이전 호출자 (mode 만 보내던) 호환.
        mode = "dummy"
        video = True
        audio = True
        if request.can_read_body:
            try:
                raw = await request.read()
                if raw:
                    import json as _json
                    body = _json.loads(raw)
                    m = (body or {}).get("mode")
                    if isinstance(m, str):
                        mode = m
                    if isinstance((body or {}).get("video"), bool):
                        video = body["video"]
                    if isinstance((body or {}).get("audio"), bool):
                        audio = body["audio"]
            except Exception as e:  # noqa: BLE001
                log.warning("publish/start body parse skipped: %s", e)
        async with state.lock:
            try:
                result = await _start_publish(
                    state,
                    client,
                    default_track_name,
                    default_audio_track_name,
                    mode=mode,
                    queue_max=queue_max,
                    audio_queue_max=audio_queue_max,
                    video=video,
                    audio=audio,
                )
            except CFRealtimeError as e:
                log.error("publish/start cf err: %s", e)
                return web.json_response(
                    {"error": "cf_realtime_error", "detail": str(e)[:300]},
                    status=502,
                )
            except Exception as e:  # noqa: BLE001
                log.exception("publish/start unexpected err")
                return web.json_response(
                    {"error": "internal", "detail": repr(e)[:300]},
                    status=500,
                )
        if "error" in result:
            return web.json_response(result, status=409)
        return web.json_response(result)

    async def push_frame(request: web.Request) -> web.Response:
        """raw bytes body → ndarray → 큐 적재.

        headers:
          Content-Type: image/jpeg | image/raw
          X-Width, X-Height (raw only, default 640x480)
          X-Frame-Format: jpeg | rgb24 | bgr24 (default jpeg)
        """
        if state.state != "publishing" or state.track is None:
            return web.json_response(
                {"error": "publisher_not_publishing", "state": state.state},
                status=409,
            )
        if state.mode != "queue":
            return web.json_response(
                {"error": "publisher_not_in_queue_mode", "mode": state.mode},
                status=409,
            )
        body = await request.read()
        if not body:
            return web.json_response({"error": "empty_body"}, status=400)
        fmt = request.headers.get("X-Frame-Format", "").lower()
        ctype = (request.headers.get("Content-Type") or "").lower()
        if not fmt:
            fmt = "jpeg" if "jpeg" in ctype or "jpg" in ctype else (
                "rgb24" if "raw" in ctype else "jpeg"
            )
        def _decode() -> np.ndarray:
            if fmt == "jpeg":
                img = Image.open(io.BytesIO(body)).convert("RGB")
                return np.asarray(img, dtype=np.uint8)
            if fmt == "rgb24":
                w = int(request.headers.get("X-Width", str(WIDTH)))
                h = int(request.headers.get("X-Height", str(HEIGHT)))
                return np.frombuffer(body, dtype=np.uint8).reshape((h, w, 3))
            if fmt == "bgr24":
                w = int(request.headers.get("X-Width", str(WIDTH)))
                h = int(request.headers.get("X-Height", str(HEIGHT)))
                bgr = np.frombuffer(body, dtype=np.uint8).reshape((h, w, 3))
                return bgr[:, :, ::-1].copy()
            raise ValueError(f"unsupported_format: {fmt}")

        try:
            arr = await asyncio.to_thread(_decode)
        except ValueError as e:
            return web.json_response({"error": str(e)}, status=400)
        except Exception as e:  # noqa: BLE001
            log.warning("push_frame decode err: %s", e)
            return web.json_response(
                {"error": "decode_failed", "detail": repr(e)[:200]}, status=400
            )

        info = state.track.push_ndarray(arr)
        return web.json_response(info)

    async def push_frame_end(_request: web.Request) -> web.Response:
        if state.track is None:
            return web.json_response({"flushed": 0, "note": "no_track"})
        depth = state.track.signal_end()
        return web.json_response({"flushed": depth})

    async def push_audio(request: web.Request) -> web.Response:
        """raw PCM (s16le) 또는 wav body → 48kHz mono int16 으로 resample → 큐 적재.

        headers:
          Content-Type: audio/wav | application/octet-stream | audio/raw
          X-Audio-Format: wav | pcm_s16le (default: Content-Type 으로 추론)
          X-Sample-Rate: int (PCM 일 때, default 24000 — OpenVoice/MeloTTS spec)
          X-Channels: int (PCM 일 때, default 1)
        """
        if state.state != "publishing" or state.audio_track is None:
            return web.json_response(
                {
                    "error": "publisher_not_publishing_or_audio_off",
                    "state": state.state,
                    "audio_enabled": state.audio_enabled,
                },
                status=409,
            )
        body = await request.read()
        if not body:
            return web.json_response({"error": "empty_body"}, status=400)
        fmt = (request.headers.get("X-Audio-Format") or "").lower()
        ctype = (request.headers.get("Content-Type") or "").lower()
        if not fmt:
            if "wav" in ctype:
                fmt = "wav"
            else:
                # body 가 RIFF 헤더로 시작하면 wav
                if len(body) >= 12 and body[:4] == b"RIFF" and body[8:12] == b"WAVE":
                    fmt = "wav"
                else:
                    fmt = "pcm_s16le"
        try:
            if fmt == "wav":
                arr, src_sr, _ch = await asyncio.to_thread(_decode_wav, body)
            elif fmt == "pcm_s16le":
                src_sr = int(
                    request.headers.get("X-Sample-Rate", "24000")
                )
                src_ch = int(request.headers.get("X-Channels", "1"))
                pcm = np.frombuffer(body, dtype=np.int16)
                if src_ch > 1:
                    pcm = pcm.reshape(-1, src_ch).mean(axis=1).astype(np.int16)
                arr = pcm
            else:
                return web.json_response(
                    {"error": f"unsupported_audio_format: {fmt}"}, status=400
                )
        except ValueError as e:
            return web.json_response({"error": str(e)}, status=400)
        except Exception as e:  # noqa: BLE001
            log.warning("push_audio decode err: %s", e)
            return web.json_response(
                {"error": "decode_failed", "detail": repr(e)[:200]}, status=400
            )

        # resample → 48kHz mono int16
        try:
            resampled = await asyncio.to_thread(
                _resample_int16, arr, src_sr, AUDIO_OUTPUT_SR
            )
        except Exception as e:  # noqa: BLE001
            log.warning("push_audio resample err: %s", e)
            return web.json_response(
                {"error": "resample_failed", "detail": repr(e)[:200]}, status=400
            )

        info = state.audio_track.push_pcm_int16(resampled)
        return web.json_response(
            {
                **info,
                "src_sr": src_sr,
                "out_sr": AUDIO_OUTPUT_SR,
                "samples_pushed": int(resampled.size),
            }
        )

    async def push_audio_end(_request: web.Request) -> web.Response:
        if state.audio_track is None:
            return web.json_response({"flushed": 0, "note": "no_audio_track"})
        depth = state.audio_track.signal_end()
        return web.json_response({"flushed": depth})

    async def publish_stop(_request: web.Request) -> web.Response:
        async with state.lock:
            result = await _stop_publish(state)
        return web.json_response(result)

    async def subscribe(_request: web.Request) -> web.Response:
        """CF subscriber pull (1단계) — body 없이 호출.

        흐름 (CF Realtime 표준):
          1. 클라이언트가 POST /oth-path (body 없음)
          2. publisher 가 CF subscriber session 생성 + tracks/new(remote) 로
             offer SDP 회수
          3. 응답: {subscriber_session_id, offer_sdp, tracks}
          4. 클라이언트는 그 offer 로 setRemoteDescription, createAnswer,
             setLocalDescription, 그리고 POST /oth-path 로 answer 송신
        """
        if state.state != "publishing" or not state.session_id:
            return web.json_response(
                {"error": "publisher_not_ready", "state": state.state},
                status=409,
            )
        publisher_sid = state.session_id
        track_names: list[str] = []
        if state.video_enabled and state.track_name:
            track_names.append(state.track_name)
        if state.audio_enabled and state.audio_track_name:
            track_names.append(state.audio_track_name)
        if not track_names:
            track_names = [default_track_name]
        try:
            sub_sid = await client.create_session()
            log.info(
                "subscribe pull sub_sid_prefix=%s pub_sid_prefix=%s tracks=%s",
                sub_sid[:8], publisher_sid[:8], track_names,
            )
            res = await client.tracks_new_remote_pull_multi(
                sub_sid, publisher_sid, track_names=track_names,
            )
        except CFRealtimeError as e:
            log.error("subscribe cf err: %s", e)
            return web.json_response(
                {"error": "cf_realtime_error", "detail": str(e)[:300]},
                status=502,
            )
        except Exception as e:  # noqa: BLE001
            log.exception("subscribe unexpected err")
            return web.json_response(
                {"error": "internal", "detail": repr(e)[:300]}, status=500
            )
        log.info(
            "subscribe pull ok offer_sdp_len=%d tracks=%d renego=%s",
            len(res["offer_sdp"]),
            len(res.get("tracks", [])),
            res.get("requires_renegotiation"),
        )
        return web.json_response(
            {
                "subscriber_session_id": sub_sid,
                "offer_sdp": res["offer_sdp"],
                "tracks": res.get("tracks", []),
                "requires_renegotiation": res.get("requires_renegotiation", True),
            }
        )

    async def subscribe_renegotiate(request: web.Request) -> web.Response:
        """CF subscriber pull (2단계) — 클라이언트 answer SDP 전달."""
        try:
            body = await request.json()
        except Exception as e:  # noqa: BLE001
            return web.json_response(
                {"error": "bad_json", "detail": repr(e)[:200]}, status=400
            )
        sub_sid = (body or {}).get("subscriber_session_id")
        answer_sdp = (body or {}).get("answer_sdp")
        if not sub_sid or not isinstance(sub_sid, str):
            return web.json_response(
                {"error": "missing_subscriber_session_id"}, status=400
            )
        if not answer_sdp or not isinstance(answer_sdp, str):
            return web.json_response(
                {"error": "missing_answer_sdp"}, status=400
            )
        try:
            res = await client.renegotiate(sub_sid, answer_sdp)
        except CFRealtimeError as e:
            log.error("renegotiate cf err: %s", e)
            return web.json_response(
                {"error": "cf_realtime_error", "detail": str(e)[:300]},
                status=502,
            )
        except Exception as e:  # noqa: BLE001
            log.exception("renegotiate unexpected err")
            return web.json_response(
                {"error": "internal", "detail": repr(e)[:300]}, status=500
            )
        log.info(
            "subscribe renegotiate ok sub_sid_prefix=%s answer_sdp_len=%d",
            sub_sid[:8], len(answer_sdp),
        )
        return web.json_response({"ok": True, "raw": res})

    @web.middleware
    async def cors_middleware(request: web.Request, handler):
        # OPTIONS preflight: 핸들러 없이도 200 반환
        if request.method == "OPTIONS":
            resp = web.Response(status=204)
        else:
            try:
                resp = await handler(request)
            except web.HTTPException as e:
                resp = e
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resp.headers["Access-Control-Max-Age"] = "600"
        return resp

    app = web.Application(middlewares=[cors_middleware], client_max_size=8 * 1024 * 1024)
    app.router.add_get("/healthz", healthz)
    app.router.add_post("/publish/start", publish_start)
    app.router.add_post("/publish/stop", publish_stop)
    app.router.add_post("/subscribe", subscribe)
    app.router.add_post("/subscribe/renegotiate", subscribe_renegotiate)
    app.router.add_post("/push_frame", push_frame)
    app.router.add_post("/push_frame_end", push_frame_end)
    app.router.add_post("/push_audio", push_audio)
    app.router.add_post("/push_audio_end", push_audio_end)
    # OPTIONS preflight 라우트 — middleware 가 응답 헤더 채움
    app.router.add_route("OPTIONS", "/subscribe", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/subscribe/renegotiate", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/publish/start", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/publish/stop", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/push_frame", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/push_frame_end", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/push_audio", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/push_audio_end", lambda r: web.Response(status=204))

    async def _on_cleanup(_app: web.Application) -> None:
        if state.pc is not None:
            try:
                await state.pc.close()
            except Exception:  # noqa: BLE001
                pass

    app.on_cleanup.append(_on_cleanup)
    app["_state"] = state
    return app


def main() -> None:
    bind = _env("PUBLISHER_BIND", "127.0.0.1")
    port = int(_env("PUBLISHER_PORT", "8400"))
    app = make_app()
    log.info("publisher starting on http://%s:%d", bind, port)
    web.run_app(app, host=bind, port=port, print=None)


if __name__ == "__main__":
    main()
