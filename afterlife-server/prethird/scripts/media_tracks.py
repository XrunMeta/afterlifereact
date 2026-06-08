from __future__ import annotations
import asyncio, os, time
from fractions import Fraction
from typing import Optional
import numpy as np
from aiortc.mediastreams import AudioStreamTrack, VideoStreamTrack
from av import AudioFrame, VideoFrame
import logging
from idle import _dummy_rgb_frame, _select_idle_frame
from config import (QUEUE_MAX_DEFAULT, AUDIO_QUEUE_MAX_DEFAULT, AUDIO_OUTPUT_SR,
                    AUDIO_OUTPUT_CHANNELS, AUDIO_FRAME_MS, VIDEO_CLOCK_RATE,
                    VIDEO_PTS_INCREMENT, VIDEO_TIME_BASE)
log = logging.getLogger("prethird.tracks")

class AvatarVideoTrack(VideoStreamTrack):
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
            try:
                # 짧은 timeout 으로 폴링 — 비면 idle/last/dummy fallback
                arr = await asyncio.wait_for(self.queue.get(), timeout=0.02)
                self._last_frame = arr
                self._last_real_ts = time.time()  # 029-H: 마지막 대화 frame 시각 (wall clock — __init__/_select 와 단위 일관)
                self.frames_real += 1  # 029-avsync-measure
                # 회차 029-D-3c-sync: 첫 real frame 도착 시 audio gate open
                if self._sync_event is not None and not self._sync_event.is_set():
                    self._sync_event.set()
            except asyncio.TimeoutError:
                # 029-H: 큐 빈 지 grace 경과 + idle_frames 있으면 idle loop(시간 기반 25fps), 아니면 hold
                _now = time.time()
                _was_idle = self._idle_t0 > 0
                arr, self._idle_t0 = _select_idle_frame(
                    _now, self._last_real_ts,
                    self._idle_grace, self._idle_frames, self._idle_t0, self._last_frame,
                )
                if self._idle_t0 > 0 and not _was_idle:  # idle 진입 시 1회 로그
                    log.info("[029-H] idle 진입 (gap=%.1fs, frames=%d)", _now - self._last_real_ts, len(self._idle_frames))
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

class AvatarAudioTrack(AudioStreamTrack):
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
        self.frame_samples = sample_rate * AUDIO_FRAME_MS 
        # 회차 029-D-3c-sync: video first real frame 전엔 silence (buffer 보존)
        self._video_sync_event = video_sync_event
        # PCM int16 buffer (1D mono). queue 는 chunk 단위로 frame buffer 에 합쳐짐.
        self._buffer = np.zeros(0, dtype=np.int16)
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

        prethird: audio push는 이벤트 루프 스레드 단일 접근
        (파이프라인이 run_in_executor await 이후 호출). lock 불필요.
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
        return int(self._buffer.size 

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
