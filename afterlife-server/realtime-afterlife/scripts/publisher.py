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
import av
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

# 회차 029-D-3c-sync: video target fps. aiortc VideoStreamTrack default 는 30fps 라
# musetalk 이 만든 25fps frame 을 30fps 로 yield 하면 wallclock 가 0.83배로 줄어 audio 와
# sync 어긋남 (19.88s 영상이 16.57s 만에 끝남). 25fps 명시 pacing.
VIDEO_TARGET_FPS = 25
VIDEO_CLOCK_RATE = 90000
VIDEO_PTS_INCREMENT = VIDEO_CLOCK_RATE // VIDEO_TARGET_FPS  # 3600
VIDEO_TIME_BASE = Fraction(1, VIDEO_CLOCK_RATE)


def _dummy_rgb_frame(elapsed: float) -> np.ndarray:
    """단색 frame, 12초 주기 색 회전."""
    h = (elapsed / 12.0) % 1.0
    r, g, b = colorsys.hsv_to_rgb(h, 0.7, 0.9)
    arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    arr[:, :, 0] = int(r * 255)
    arr[:, :, 1] = int(g * 255)
    arr[:, :, 2] = int(b * 255)
    return arr


def _select_idle_frame(now, last_real_ts, grace, idle_frames, idle_t0, last_frame, fps=25):
    """029-H: 큐 빔(timeout) 시 송출 frame 결정 — 시간 기반(recv 빈도 무관 일정 25fps).
    grace 경과 + idle_frames 있으면 idle loop frame, 아니면 last_frame hold.
    반환: (frame, new_idle_t0). idle_t0=0 이면 첫 진입(now 로 고정), hold 시 0 리셋.
    """
    if idle_frames and (now - last_real_ts) >= grace:
        t0 = idle_t0 if idle_t0 > 0 else now
        idx = int((now - t0) * fps) % len(idle_frames)
        return idle_frames[idx], t0
    return last_frame, 0.0


def _load_idle_frames(path):
    """029-H: idle mp4 → rgb24 ndarray 리스트. 실패 시 빈 리스트(=hold fallback)."""
    try:
        import av
        out = []
        c = av.open(path)
        for fr in c.decode(video=0):
            out.append(fr.to_ndarray(format="rgb24"))
        c.close()
        return out
    except Exception as e:
        print(f"[029-H] idle load fail: {e}", flush=True)
        return []


class StreamableVideoTrack(VideoStreamTrack):
    """모드 토글 가능한 video track.

    mode="dummy": HSV 회전 단색 frame (회차 D-2a/2b 호환)
    mode="queue": 외부 큐(asyncio.Queue) 에서 ndarray 꺼내 yield.
                 큐 비어있으면 last_frame hold (없으면 dummy fallback).
    """

    kind = "video"

    def __init__(
        self,
        queue_max: int = QUEUE_MAX_DEFAULT,
        sync_event: Optional[asyncio.Event] = None,
    ):
        super().__init__()
        self._start = time.time()
        self.mode = "dummy"
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=queue_max)
        self._last_frame: Optional[np.ndarray] = None
        self._stream_ended = False
        # 회차 029-D-3c-sync: 첫 real frame 들어오면 set → audio gate open
        self._sync_event = sync_event
        # 029-avsync-measure: 실제 mp4 frame yield 카운트 (content-time 계측용)
        self.frames_real = 0
        # 029-H idle: 큐 빔 grace 후 사전 생성 idle mp4 loop (freeze 대체, 시간 기반 25fps)
        self._idle_frames = []
        self._idle_t0 = 0.0
        self._last_real_ts = time.time()
        self._idle_grace = float(os.environ.get("IDLE_GRACE_SEC", "0.5"))
        self._audio_track = None  # 029-avsync-fix: audio master content 추종(=_start_publish 주입)

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

    def _idle_or_hold(self):
        """029-avsync-fix: consume 할 real frame 이 없을 때 — gap 크면 idle loop, 작으면 last hold."""
        _now = time.time()
        _was_idle = self._idle_t0 > 0
        arr, self._idle_t0 = _select_idle_frame(
            _now, self._last_real_ts,
            self._idle_grace, self._idle_frames, self._idle_t0, self._last_frame,
        )
        if self._idle_t0 > 0 and not _was_idle:  # idle 진입 시 1회 로그
            log.info("[029-H] idle 진입 (gap=%.1fs, frames=%d)", _now - self._last_real_ts, len(self._idle_frames))
        return arr

    async def recv(self) -> VideoFrame:
        # 회차 029-D-3c-sync: 25fps 자체 pacing (super.next_timestamp 은 30fps default).
        loop_time = asyncio.get_event_loop().time()
        if not hasattr(self, "_t0_25"):
            self._t0_25 = loop_time
            self._pts_25 = 0
        else:
            self._pts_25 += VIDEO_PTS_INCREMENT
            wait = self._t0_25 + (self._pts_25 / VIDEO_CLOCK_RATE) - loop_time
            if wait > 0:
                await asyncio.sleep(wait)
        pts, time_base = self._pts_25, VIDEO_TIME_BASE
        arr: Optional[np.ndarray] = None

        if self.mode == "queue":
            # 029-avsync-fix: audio master. video 가 audio content(samples_real)를 추종.
            #  target=audio 가 재생한 content 의 video frame 수. behind>0 → 큐에서 그만큼
            #  consume(중간 frame drop=catch-up, 마지막만 표시). behind<=0 → consume 안 함
            #  (video 가 audio 를 앞서지 않게) → gap 크면 idle, 작으면 hold.
            audio = self._audio_track
            gate_open = self._sync_event is None or self._sync_event.is_set()
            if audio is not None and gate_open:
                target = int(audio.samples_real / audio.sample_rate * VIDEO_TARGET_FPS)
            else:
                target = self.frames_real + 1  # bootstrap(gate open 전) or audio 없음 → 1 frame
            behind = target - self.frames_real
            if behind > 0:
                try:
                    # 첫 frame 은 짧은 timeout get (큐 빔 → idle 감지)
                    arr = await asyncio.wait_for(self.queue.get(), timeout=0.02)
                    self._last_frame = arr
                    self._last_real_ts = time.time()
                    self.frames_real += 1
                    # 회차 029-D-3c-sync: 첫 real frame 도착 시 audio gate open
                    if self._sync_event is not None and not self._sync_event.is_set():
                        self._sync_event.set()
                    # catch-up: audio 보다 뒤처진 만큼 추가 consume(drop). 마지막만 표시.
                    while self.frames_real < target:
                        try:
                            arr = self.queue.get_nowait()
                        except asyncio.QueueEmpty:
                            break
                        self._last_frame = arr
                        self._last_real_ts = time.time()
                        self.frames_real += 1
                except asyncio.TimeoutError:
                    arr = self._idle_or_hold()
            else:
                # video 가 audio 를 따라잡음(앞섬) → consume 안 함(앞지르기 방지)
                arr = self._idle_or_hold()
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
        video_sync_event: Optional[asyncio.Event] = None,
    ):
        super().__init__()
        self.sample_rate = sample_rate
        self.channels = channels
        self.frame_samples = sample_rate * AUDIO_FRAME_MS // 1000
        # 회차 029-D-3c-sync: video first real frame 전엔 silence (buffer 보존)
        self._video_sync_event = video_sync_event
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
        self.samples_real = 0  # 029-avsync-fix: 실제 buffer 소비 sample(=재생된 audio content). video 가 추종.

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
        # 회차 029-D-3c-sync: video gate 닫혀있으면 buffer 소비 X (보존), silence yield
        gate_closed = (
            self._video_sync_event is not None
            and not self._video_sync_event.is_set()
        )
        if gate_closed:
            chunk = np.zeros(n, dtype=np.int16)
            is_real = False
        elif self._buffer.size >= n:
            chunk = self._buffer[:n]
            self._buffer = self._buffer[n:]
            is_real = True
            self.samples_real += n  # 029-avsync-fix
        else:
            # silence (또는 잔여 + pad)
            if self._buffer.size > 0:
                head = self._buffer
                pad = np.zeros(n - head.size, dtype=np.int16)
                chunk = np.concatenate([head, pad])
                self._buffer = np.zeros(0, dtype=np.int16)
                is_real = True  # 부분 real
                self.samples_real += int(head.size)  # 029-avsync-fix
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


def _balance_pcm_to_video(
    pcm: np.ndarray,
    video_frames: int,
    sr: int = AUDIO_OUTPUT_SR,
    fps: int = VIDEO_TARGET_FPS,
) -> tuple[np.ndarray, int]:
    """회차 029-D-3d-avsync-fix: 청크 audio 길이를 video 프레임 길이에 정확히 맞춤.

    근본원인: musetalk mux 가 audio(실제 TTS 길이) > video(nbf/25 양자화) 로 청크당
    ~9~30ms audio 초과분을 냄. audio 는 push_mp4 가 buffer 에 통째 burst 적재(잉여 누적),
    video 는 25fps just-in-time 페이싱(잉여 0)이라 청크 경계 starve 구간을 audio 잉여가
    메우며 content-time 이 앞서나감 → avsync offset(audio_ahead) 단조 누적.

    audio 를 video 프레임수(nbf)에 대응하는 정확한 sample 수로 맞추면(초과=tail trim,
    부족=silence pad) per-chunk a_content == v_content → audio 버퍼가 video 큐와 동시에
    비어 틈에 둘 다 정지(synced) → 누적 0. trim 분량은 sub-frame(≤40ms) tail.

    반환: (balanced_pcm, delta) delta>0=trim 한 sample 수, <0=pad 한 sample 수, 0=무변경.
    video_frames<=0 (메타 누락) 면 audio 손실 금지 위해 passthrough.
    """
    if video_frames <= 0 or pcm.size == 0:
        return pcm, 0
    target = video_frames * sr // fps
    cur = int(pcm.size)
    if cur > target:
        return pcm[:target], cur - target
    if cur < target:
        pad = np.zeros(target - cur, dtype=np.int16)
        return np.concatenate([pcm, pad]), cur - target
    return pcm, 0


class PublisherState:
    def __init__(self):
        self.state: str = "idle"
        self.session_id: Optional[str] = None
        self.track_name: Optional[str] = None
        self.audio_track_name: Optional[str] = None
        self.pc: Optional[RTCPeerConnection] = None
        self.track: Optional[StreamableVideoTrack] = None
        self.audio_track: Optional[StreamableAudioTrack] = None
        # 회차 029-D-3d-multi: push_mp4 순차 처리 큐 + worker (멀티 인스턴스 out-of-order 방지)
        self._mp4_queue: Optional["asyncio.Queue"] = None
        self._mp4_worker: Optional["asyncio.Task"] = None
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
    # 회차 029-D-3c-sync: queue 모드 + video/audio 둘 다 켜진 경우만 gate 활성.
    # video first real frame 도착 후에야 audio yield 시작 → wallclock sync.
    sync_event: Optional[asyncio.Event] = (
        asyncio.Event() if (mode == "queue" and video and audio) else None
    )
    if video:
        v_track = StreamableVideoTrack(queue_max=queue_max, sync_event=sync_event)
        v_track.set_mode(mode)
        # 029-H: idle mp4 디코드해 track 에 적재 (큐 빔 grace 후 loop). 실패 시 빈 리스트=hold fallback.
        idle_path = os.environ.get("IDLE_MP4_PATH", "")
        if idle_path and not v_track._idle_frames:
            v_track._idle_frames = _load_idle_frames(idle_path)
            log.info("[029-H] idle frames loaded: %d from %s", len(v_track._idle_frames), idle_path)
        pc.addTrack(v_track)
    if audio:
        a_track = StreamableAudioTrack(
            queue_max=audio_queue_max, video_sync_event=sync_event
        )
        if v_track is not None:  # 029-avsync-fix: video 가 audio content 추종
            v_track._audio_track = a_track
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

    # 029-avsync-measure: video/audio content-time 드리프트 주기 로깅.
    # v_content = 실제 yield 한 mp4 frame 수 / 25fps, a_content = real audio frame * 20ms.
    # offset>0 = audio 가 video 보다 content-time 앞섬(="음성이 영상보다 빠름").
    async def _avsync_monitor() -> None:
        loop = asyncio.get_event_loop()
        t0 = loop.time()
        while True:
            await asyncio.sleep(0.5)
            vt, at = state.track, state.audio_track
            if vt is None or at is None:
                continue
            v_real = getattr(vt, "frames_real", 0)
            a_real = getattr(at, "frames_yielded_real", 0)
            v_content = v_real / VIDEO_TARGET_FPS
            a_content = a_real * (AUDIO_FRAME_MS / 1000.0)
            log.info(
                "[avsync] wall=%.2f v_real=%d a_real=%d v_content=%.3f a_content=%.3f "
                "offset_ms=%+.0f(>0=audio_ahead) vq=%d abuf_ms=%d",
                loop.time() - t0, v_real, a_real, v_content, a_content,
                (a_content - v_content) * 1000.0, vt.queue.qsize(),
                int(at.queue_depth_samples() / at.sample_rate * 1000),
            )
    state._avsync_task = asyncio.create_task(_avsync_monitor())

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
    if state._mp4_worker is not None:
        state._mp4_worker.cancel()
    state._mp4_worker = None
    state._mp4_queue = None
    _avt = getattr(state, "_avsync_task", None)  # 029-avsync-measure
    if _avt is not None:
        _avt.cancel()
        state._avsync_task = None
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
        # 029-D-3c-sync-fix1: 메시지 종료 시 video gate 닫음 → 다음 메시지의
        # 새 video first frame 도착 전엔 audio buffer 보존 (multi-message sync).
        ev = getattr(state.audio_track, "_video_sync_event", None)
        if ev is not None:
            ev.clear()
        return web.json_response({"flushed": depth})

    async def _push_mp4_bg_impl(mp4_bytes: bytes, reset: bool) -> None:
        """회차 029-D-3d-multi: chunk mp4 를 demux → audio buffer + video queue 적재.

        reset=True  : 새 turn 첫 chunk — 기존 큐/버퍼 flush + sync gate 재설정
                      (이전 turn 송출 중이면 폐기, 새 응답 즉시).
        reset=False : append — 이전 chunk 에 이어 연속 송출. flush/sync clear 안 함
                      → video queue 가 이어 채워져 끊김 없이 연속 재생.

        흐름: PyAV audio decode→48kHz mono resample→push_pcm_int16,
              video decode→25fps pacing push_ndarray. video first frame→sync_event.set→
              audio gate open (RTCP-SR NTP anchor 일치 → WebRTC sync).
        _mp4_worker 가 순차 호출하므로 chunk 송출 순서 보장 (멀티 인스턴스 out-of-order 방지).
        """
        # reset 일 때만 기존 큐/버퍼 flush + gate close (append 는 이어붙임)
        if reset:
            if state.track is not None:
                try:
                    while not state.track.queue.empty():
                        state.track.queue.get_nowait()
                except Exception:  # noqa: BLE001
                    pass
                state.track._last_frame = None
            if state.audio_track is not None:
                async with state.audio_track._buffer_lock:
                    state.audio_track._buffer = np.zeros(0, dtype=np.int16)
            _ev_pre = (
                getattr(state.audio_track, "_video_sync_event", None)
                if state.audio_track else None
            )
            if _ev_pre is not None:
                _ev_pre.clear()

        container = None
        try:
            container = await asyncio.to_thread(
                lambda: av.open(io.BytesIO(mp4_bytes))
            )
            a_stream = container.streams.audio[0] if container.streams.audio else None
            # 029-D-3d-avsync-fix: video 프레임수(nbf) 선취득 → audio 길이 맞춤용.
            # moov 의 nb_frames 우선, 없으면 duration×fps 추정 (fallback).
            v_meta = (
                container.streams.video[0] if container.streams.video else None
            )
            nbf = 0
            if v_meta is not None:
                nbf = int(getattr(v_meta, "frames", 0) or 0)
                if nbf <= 0 and v_meta.duration and v_meta.time_base:
                    nbf = int(round(
                        float(v_meta.duration * v_meta.time_base) * VIDEO_TARGET_FPS
                    ))
            # 3) audio decode + resample + push_pcm_int16 (buffer 미리 채움)
            if a_stream is not None and state.audio_track is not None:
                def _decode_audio() -> np.ndarray:
                    resampler = AudioResampler(
                        format="s16", layout="mono", rate=AUDIO_OUTPUT_SR,
                    )
                    chunks: list[np.ndarray] = []
                    for frame in container.decode(a_stream):
                        for r in resampler.resample(frame):
                            arr = r.to_ndarray()
                            chunks.append(arr.flatten().astype(np.int16, copy=False))
                    for r in resampler.resample(None):  # flush
                        arr = r.to_ndarray()
                        chunks.append(arr.flatten().astype(np.int16, copy=False))
                    if not chunks:
                        return np.zeros(0, dtype=np.int16)
                    return np.concatenate(chunks)
                pcm = await asyncio.to_thread(_decode_audio)
                if pcm.size:
                    # 029-D-3d-avsync-fix: video 길이에 맞춰 trim/pad → offset 누적 차단
                    pcm, _bal = _balance_pcm_to_video(pcm, nbf)
                    state.audio_track.push_pcm_int16(pcm)
                    log.info(
                        "push_mp4 audio queued samples=%d (~%.2fs) nbf=%d balance=%+d",
                        pcm.size, pcm.size / AUDIO_OUTPUT_SR, nbf, _bal,
                    )
            # 4) video decode + 25fps wallclock pacing push.
            # audio decode 가 container 위치를 끝까지 옮겼으니 re-open (새 BytesIO).
            await asyncio.to_thread(container.close)
            container = await asyncio.to_thread(
                lambda: av.open(io.BytesIO(mp4_bytes))
            )
            v_stream = container.streams.video[0]
            target_fps = (
                float(v_stream.average_rate) if v_stream.average_rate else 25.0
            )
            frame_interval = 1.0 / target_fps
            loop = asyncio.get_event_loop()
            next_due = loop.time()
            pushed = 0
            for v_frame in container.decode(v_stream):
                try:
                    arr = await asyncio.to_thread(
                        lambda f=v_frame: f.to_ndarray(format="rgb24")
                    )
                except Exception as e:  # noqa: BLE001
                    log.warning("push_mp4 video decode err: %s", e)
                    continue
                now = loop.time()
                wait = next_due - now
                if wait > 0:
                    await asyncio.sleep(wait)
                if state.track is not None:
                    state.track.push_ndarray(arr)
                    pushed += 1
                next_due += frame_interval
            log.info("push_mp4 video pushed=%d fps=%.2f reset=%s", pushed, target_fps, reset)
            # append 연속 유지: signal_end / sync_event.clear 안 함. turn 종료 시 큐 소진 후
            # recv 가 last frame hold (다음 turn reset 이 새 gate 설정).
        except Exception as e:  # noqa: BLE001
            log.warning("push_mp4 bg failed: %s", e)
        finally:
            if container is not None:
                try:
                    await asyncio.to_thread(container.close)
                except Exception:
                    pass

    async def _mp4_worker() -> None:
        """state._mp4_queue 를 순차 소비 → chunk demux+송출 순서 보장."""
        while True:
            item = await state._mp4_queue.get()
            try:
                if item is None:
                    return
                mp4_bytes, reset = item
                await _push_mp4_bg_impl(mp4_bytes, reset)
            except Exception as e:  # noqa: BLE001
                log.warning("mp4 worker err: %s", e)
            finally:
                state._mp4_queue.task_done()

    async def push_mp4(request: web.Request) -> web.Response:
        """body: {"path": "/abs/to.mp4", "reset": bool} → 순차 큐 demux+push.

        reset(default True): 새 turn 첫 chunk(기존 폐기). False: append(연속 송출).
        멀티 인스턴스가 chunk 를 병렬 생성해도 server.js 가 idx 순서로 호출 +
        worker 순차 처리 → 송출 순서 보장.
        """
        if state.state != "publishing":
            return web.json_response(
                {"error": "publisher_not_publishing", "state": state.state}, status=409,
            )
        if state.mode != "queue":
            return web.json_response(
                {"error": "publisher_not_in_queue_mode", "mode": state.mode}, status=409,
            )
        try:
            body = await request.json()
        except Exception:
            return web.json_response({"error": "invalid_json"}, status=400)
        mp4_path = body.get("path") if isinstance(body, dict) else None
        reset = bool(body.get("reset", True)) if isinstance(body, dict) else True
        if not mp4_path or not Path(mp4_path).exists():
            return web.json_response(
                {"error": "mp4_not_found", "path": mp4_path}, status=400,
            )
        # mp4 즉시 read (musetalk 동일 파일명 덮어쓰기 race 회피)
        try:
            mp4_bytes = await asyncio.to_thread(lambda: Path(mp4_path).read_bytes())
        except Exception as e:  # noqa: BLE001
            return web.json_response({"error": "mp4_read_failed", "detail": str(e)}, status=500)
        # worker lazy 생성
        if state._mp4_queue is None:
            state._mp4_queue = asyncio.Queue()
            state._mp4_worker = asyncio.create_task(_mp4_worker())
        # reset 이면 큐의 이전 turn 잔여 chunk 폐기 (새 응답 즉시 우선)
        if reset:
            try:
                while True:
                    state._mp4_queue.get_nowait()
                    state._mp4_queue.task_done()
            except asyncio.QueueEmpty:
                pass
        await state._mp4_queue.put((mp4_bytes, reset))
        return web.json_response(
            {"queued": True, "path": mp4_path, "reset": reset, "qdepth": state._mp4_queue.qsize()}
        )

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
    app.router.add_post("/push_mp4", push_mp4)
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
