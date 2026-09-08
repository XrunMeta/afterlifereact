from __future__ import annotations
import asyncio, os, time
from fractions import Fraction
from typing import Optional
import numpy as np
from aiortc.mediastreams import AudioStreamTrack, VideoStreamTrack
from av import AudioFrame, VideoFrame
import logging
from idle import _dummy_rgb_frame, _select_idle_frame, get_idle_frames, _blend_frames
from config import (QUEUE_MAX_DEFAULT, AUDIO_QUEUE_MAX_DEFAULT, AUDIO_OUTPUT_SR,
                    AUDIO_OUTPUT_CHANNELS, AUDIO_FRAME_MS, VIDEO_CLOCK_RATE,
                    VIDEO_PTS_INCREMENT, VIDEO_TIME_BASE, IDLE_MP4_PATH)
log = logging.getLogger("prethird.tracks")

# [T-258] 큐 상한 도달 드롭 로그의 집계 주기(초). 프레임/청크 단위로 호출되는
# push 경로라 매 건 로그는 스팸 → 이 주기로 묶어 1줄씩 남긴다. 0 이하면 매 건 로그.
#   ⚠️ 상한값(QUEUE_MAX_DEFAULT / AUDIO_QUEUE_MAX_DEFAULT)이나 드롭 정책(oldest
#   drop)은 **이 커밋에서 바꾸지 않았다** — 로그만 추가. 정책 변경은 히즈키 판단.
_DROP_LOG_SEC = float(os.environ.get("PRETHIRD_QUEUE_DROP_LOG_SEC", "1.0"))


def prebuffer_should_release(qsize: int, target: int, stream_ended: bool) -> bool:
    """리드 버퍼(pre-roll) 해제 판정 (순수).

    응답 시작 시 비디오 큐에 target 프레임이 쌓일 때까지 드레인을 보류해
    문장 사이 갭(LLM/TTS/렌더 지터)을 버퍼로 흡수한다. 다음 중 하나면 해제:
      - target<=0: 비활성(기존 동작, 회귀 0) → 항상 즉시 해제
      - qsize>=target: 목표만큼 버퍼링 완료
      - stream_ended: 짧은 응답이라 목표 미달이어도 스트림이 끝남(무한 대기 방지)
    """
    if target <= 0:
        return True
    return qsize >= target or stream_ended


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
        self._idle_frames = get_idle_frames(IDLE_MP4_PATH)
        self._idle_t0 = 0.0
        self._last_real_ts = time.time()
        self._idle_grace = float(os.environ.get("IDLE_GRACE_SEC", "0.5"))
        # 말이 끝난 뒤(_stream_ended)에 쓸 별도 grace. 문장 **중간** 갭은 길게 버텨
        # 끊김을 막고, 말이 **끝난** 지점에서는 빠르게 idle 로 디졸브하기 위함이다.
        # 미설정이면 _idle_grace 를 그대로 써 기존 동작과 완전히 같다(회귀 0).
        self._idle_grace_end = float(
            os.environ.get("PRETHIRD_IDLE_GRACE_END_SEC", self._idle_grace))
        # idle 진입(speak→idle) cross-dissolve. 0 이면 hard cut(기존 동작).
        self._idle_blend_n = int(os.environ.get("PRETHIRD_IDLE_BLEND_FRAMES", "5"))
        self._blend_from: Optional[np.ndarray] = None
        self._blend_i = 0
        # 리드 버퍼(pre-roll): 응답 시작 시 큐에 _prebuffer_target 프레임이 쌓일 때까지
        # 드레인 보류(idle 표시·audio gate 미개방) → 문장 사이 갭을 흡수. 0=비활성(회귀0).
        # begin_response()가 턴 시작마다 _prebuffering 을 재무장한다.
        self._prebuffer_target = int(os.environ.get("PRETHIRD_PREROLL_FRAMES", "0"))
        self._prebuffering = False
        # [T-258] 큐 상한 도달 드롭 계측(로그 전용, 드롭 정책 무변경).
        self._drop_total = 0        # 이 트랙 수명 동안 버린 총 프레임 수
        self._drop_pending = 0      # 아직 로그로 못 뱉은 누적분
        self._drop_log_ts = 0.0     # 마지막 드롭 로그 시각(0=아직 없음 → 첫 건 즉시 로그)

    def set_mode(self, mode: str) -> None:
        if mode not in ("dummy", "queue"):
            raise ValueError(f"invalid mode: {mode}")
        self.mode = mode
        self._stream_ended = False

    def set_idle_video(self, path: str) -> None:
        """통화별 idle 영상 교체. path별 dict 캐시에서 frames 로드(재로드 없음).
        path가 None/빈 문자열이면 기존 IDLE_MP4_PATH fallback(halbae)."""
        if path:
            self._idle_frames = get_idle_frames(path)
            log.info("[idle] per-clone idle 교체: path=%s frames=%d", path, len(self._idle_frames))
        else:
            self._idle_frames = get_idle_frames(IDLE_MP4_PATH)
            log.info("[idle] idle fallback(halbae): frames=%d", len(self._idle_frames))

    def set_idle_frames(self, frames) -> None:
        """idle 루프 버퍼를 메모리 프레임 리스트로 직접 교체(fifth prebake 주입).

        frames: list[np.ndarray] (rgb24). 빈 리스트면 무시(기존 idle 유지).
        # CPython GIL 하 list rebind 원자적(MT-safe). free-threaded 이식 시 Lock 검토.
        """
        if frames:
            self._idle_frames = frames
            log.info("[idle] fifth prebake 주입: frames=%d", len(frames))

    def _apply_idle_blend(self, idle_arr: np.ndarray, was_idle: bool) -> np.ndarray:
        """idle 진입 직후 _idle_blend_n 프레임 동안 직전 발화 프레임→idle 로 dissolve.
        was_idle=False(방금 진입)면 blend 시작점을 _last_frame 으로 잡는다."""
        if self._idle_blend_n <= 0:
            return idle_arr
        if not was_idle:
            self._blend_from = self._last_frame
            self._blend_i = 0
        if self._blend_from is None or self._blend_i >= self._idle_blend_n:
            return idle_arr
        alpha = (self._blend_i + 1) / float(self._idle_blend_n)
        self._blend_i += 1
        return _blend_frames(self._blend_from, idle_arr, alpha)

    def begin_response(self) -> None:
        """응답(턴) 시작 시 리드 버퍼 재무장. _prebuffer_target>0 이면 다음 recv 부터
        큐가 목표만큼 찰 때까지 드레인을 보류한다. target=0 이면 no-op(회귀 0).

        _stream_ended 도 리셋 — 직전 턴 signal_end(True)가 남아 새 턴 버퍼링을 즉시
        해제시키는 것을 막는다. 파이프라인이 첫 세그먼트 push 직전에 호출한다.

        [T-258] 턴 시작 경계이기도 하므로, 직전 턴에서 아직 못 뱉은 드롭 누적분을
        여기서 배출한다(로그 전용). _prebuffer_target==0(기본)이어도 실행돼야
        하므로 아래 if 밖에 둔다."""
        self._flush_drop_log("turn-begin")
        if self._prebuffer_target > 0:
            self._prebuffering = True
            self._stream_ended = False

    def _emit_drop_log(self, pending: int, boundary: str | None) -> None:
        """[T-258] 누적 폐기분 1줄 출력. boundary 가 있으면 턴 경계 배출임을 표시."""
        log.warning(
            "[queue-drop] video 큐 상한 도달%s — oldest %d프레임(≈%.2fs @25fps) 폐기 "
            "(누적 %d프레임/≈%.2fs, qmax=%d, qsize=%d). "
            "렌더 push 속도 > 송출(25fps) 소비 속도 — 발화 앞부분 영상 유실 의심.",
            f"[{boundary}]" if boundary else "",
            pending, pending / 25.0, self._drop_total, self._drop_total / 25.0,
            self.queue.maxsize, self.queue.qsize(),
        )

    def _note_drop(self, n: int = 1) -> None:
        """[T-258] 비디오 큐 상한 도달로 프레임을 버린 사실을 집계 로그로 남긴다.

        지금까지 push_ndarray 의 반환 `dropped` 는 **호출부에서 전부 무시**돼
        (pipeline._infer_stage 의 `self.vt.push_ndarray(arr)`) 프레임 유실이
        조용히 일어났다. 여기서 몇 프레임 = 몇 초가 잘렸는지 남긴다.
        프레임 단위 호출이라 매 건 warning 은 스팸 → _DROP_LOG_SEC 주기 집계.

        ⚠️ 주기 집계만 하면 **버스트가 통째로 삼켜진다**(리뷰 Important 1 재현:
        360칸 큐에 660프레임을 한 번에 push 하면 첫 1프레임만 찍히고 나머지
        299 가 _drop_pending 에 갇힘 — 다음 드롭이 1초 뒤에 와야 배출되는데
        턴이 그 전에 끝난다). 그래서 **턴 경계(begin_response/signal_end)에서
        _flush_drop_log() 로 잔량을 반드시 배출**한다. 그게 이 로그의 존재 이유
        ("한 턴에 총 몇 프레임/몇 초가 잘렸나")를 지키는 유일한 방법이다.
        ⚠️ 로그만 추가 — 드롭 정책(oldest drop)·상한값은 건드리지 않는다.
        """
        self._drop_total += n
        self._drop_pending += n
        now = time.time()
        if _DROP_LOG_SEC > 0 and (now - self._drop_log_ts) < _DROP_LOG_SEC:
            return
        self._drop_log_ts = now
        pending, self._drop_pending = self._drop_pending, 0
        self._emit_drop_log(pending, None)

    def _flush_drop_log(self, boundary: str) -> int:
        """[T-258] 턴 경계에서 아직 못 뱉은 폐기 누적분을 무조건 1줄로 배출한다.
        주기 스로틀(_DROP_LOG_SEC)을 무시한다 — 턴이 끝나면 그 턴의 총 유실량이
        반드시 로그에 남아야 하기 때문. 잔량 0 이면 아무것도 안 한다(무소음).
        반환: 이번에 배출한 프레임 수. 로그 전용 — 드롭 정책 무관."""
        pending, self._drop_pending = self._drop_pending, 0
        if pending <= 0:
            return 0
        self._drop_log_ts = time.time()
        self._emit_drop_log(pending, boundary)
        return pending

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
        if dropped:
            # [T-258] 계측만 — 반환값·드롭 동작은 기존과 동일.
            self._note_drop(1)
        return {"queued": self.queue.qsize(), "dropped": dropped}

    def signal_end(self) -> int:
        """stream 끝 신호 — 남은 큐 size 반환. 큐 비면 last_frame hold.

        [T-258] 턴 종료 경계 — 이 턴에서 폐기된 잔량을 여기서 반드시 배출한다
        (로그 전용, 반환값·기존 동작 무변경)."""
        self._stream_ended = True
        self._flush_drop_log("turn-end")
        return self.queue.qsize()

    def queue_depth(self) -> int:
        return self.queue.qsize()

    def flush(self) -> int:
        """큐에 남은 프레임을 모두 버린다 (즉시 컷 전용).

        반환값: 버린 프레임 수.

        ⚠ 호출 컨텍스트: **이벤트루프 스레드 전용**.
          executor(스레드풀) 스레드에서 직접 호출하면 asyncio.Queue 내부가
          thread-unsafe. 호출측(F7 즉시컷)이 executor에서 트리거할 경우
          반드시 `loop.call_soon_threadsafe(video_track.flush)` 로 감쌀 것
          (라운드2 R-3/R-4 교훈).

        idle/last_frame 상태를 건드리지 않는다 — flush 이후 recv()는
        기존 idle 루프 / _last_frame hold 폴백이 정상 동작함(응답 push가
        자연스럽게 이어짐).
        """
        dropped = 0
        while True:
            try:
                self.queue.get_nowait()
                dropped += 1
            except asyncio.QueueEmpty:
                break
        if dropped:
            log.debug("[flush] video 큐 %d 프레임 제거", dropped)
        return dropped

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
            # 리드 버퍼: 목표 프레임이 쌓이면 해제(이후 정상 드레인). 버퍼링 중엔 아래
            # try 에서 큐를 소비하지 않고 idle 폴백 경로를 재사용 → audio gate 미개방 유지
            # (오디오 버퍼도 gate 로 함께 대기 → 재생 시작 시 A/V 동기 보존).
            if self._prebuffering and prebuffer_should_release(
                self.queue.qsize(), self._prebuffer_target, self._stream_ended
            ):
                self._prebuffering = False
            try:
                if self._prebuffering:
                    # 버퍼링 중 — 큐 미소비, idle/hold 폴백(except 경로 재사용)
                    raise asyncio.TimeoutError
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
                    # 턴이 끝났으면 짧은 grace — 말 끝난 뒤 입 모양을 물고 있지 않게 한다.
                    (self._idle_grace_end if self._stream_ended else self._idle_grace),
                    self._idle_frames, self._idle_t0, self._last_frame,
                )
                if self._idle_t0 > 0:
                    if not _was_idle:
                        log.info("[029-H] idle 진입 (gap=%.1fs, frames=%d)", _now - self._last_real_ts, len(self._idle_frames))
                    arr = self._apply_idle_blend(arr, _was_idle)
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
        self.frame_samples = sample_rate * AUDIO_FRAME_MS // 1000
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
        # [T-258] 버퍼 상한 도달 드롭 계측(로그 전용, 드롭 정책 무변경).
        self._drop_total_samples = 0
        self._drop_pending_samples = 0
        self._drop_log_ts = 0.0

    def _emit_drop_log(self, pending: int, boundary: str | None) -> None:
        """[T-258] 누적 폐기 샘플 1줄 출력. boundary 가 있으면 턴 경계 배출임을 표시."""
        _per_ms = max(self.sample_rate // 1000, 1)  # 48kHz → 48샘플/ms
        log.warning(
            "[queue-drop] audio 버퍼 상한 도달%s — 오래된 %d샘플(%dms) 폐기 "
            "(누적 %d샘플/%dms, max=%d샘플/%dms, buffer=%d샘플/%dms). "
            "응답 앞부분 음성 유실 의심 — 상한 초과분이 잘린다.",
            f"[{boundary}]" if boundary else "",
            pending, pending // _per_ms,
            self._drop_total_samples, self._drop_total_samples // _per_ms,
            self._queue_max_samples, self._queue_max_samples // _per_ms,
            int(self._buffer.size), int(self._buffer.size) // _per_ms,
        )

    def _note_drop(self, n_samples: int) -> None:
        """[T-258] 오디오 버퍼 상한(=AUDIO_QUEUE_MAX_DEFAULT×frame_samples) 초과로
        **오래된 샘플(=답변의 앞부분)**을 버린 사실을 로그로 남긴다.

        지금까지 push_pcm_int16 의 반환 `dropped` 는 호출부(pipeline._infer_stage)
        에서 무시됐다 — 즉 12.0초(600×960샘플 @48kHz) 를 넘는 응답은 **앞부분이
        조용히 잘려나갔다**. speech_end 의 remaining_ms 가 딱 12000 으로 관측된
        것이 이 상한에 닿은 값이다. 이 로그가 그 유실을 처음으로 가시화한다.

        ⚠️ 주기 집계만으로는 partial 다세그먼트 턴의 버스트가 삼켜진다(리뷰
        Important 1) — 턴 경계 signal_end() 에서 _flush_drop_log() 로 잔량을
        반드시 배출한다. "이 턴에 총 몇 ms 가 잘렸나"가 이 로그의 존재 이유다.
        ⚠️ 로그만 추가 — 상한값·드롭 정책(오래된 것부터 버림)은 그대로 둔다.
        """
        self._drop_total_samples += n_samples
        self._drop_pending_samples += n_samples
        now = time.time()
        if _DROP_LOG_SEC > 0 and (now - self._drop_log_ts) < _DROP_LOG_SEC:
            return
        self._drop_log_ts = now
        pending, self._drop_pending_samples = self._drop_pending_samples, 0
        self._emit_drop_log(pending, None)

    def _flush_drop_log(self, boundary: str) -> int:
        """[T-258] 턴 경계에서 아직 못 뱉은 폐기 누적분(샘플)을 무조건 1줄로 배출.
        주기 스로틀을 무시한다. 잔량 0 이면 무소음. 반환: 배출한 샘플 수."""
        pending, self._drop_pending_samples = self._drop_pending_samples, 0
        if pending <= 0:
            return 0
        self._drop_log_ts = time.time()
        self._emit_drop_log(pending, boundary)
        return pending

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
        if dropped:
            # [T-258] 계측만 — 반환값·드롭 동작은 기존과 동일(_buffer 확정 후 호출해
            # 로그의 buffer 수치가 실제 잔량과 일치하게 한다).
            self._note_drop(int(overflow))
        return {"queued": int(self._buffer.size), "dropped": dropped}

    def signal_end(self) -> int:
        # [T-258] 턴 종료 경계 — 이 턴에서 폐기된 잔량을 반드시 배출(로그 전용,
        # 반환값·기존 동작 무변경).
        self._stream_ended = True
        self._flush_drop_log("turn-end")
        return int(self._buffer.size)

    def queue_depth(self) -> int:
        # frame 단위로 환산
        return int(self._buffer.size // max(self.frame_samples, 1))

    def queue_depth_samples(self) -> int:
        return int(self._buffer.size)

    def flush(self) -> int:
        """오디오 버퍼를 비운다 (즉시 컷 전용).

        반환값: 버린 샘플 수.

        ⚠ 호출 컨텍스트: **이벤트루프 스레드 전용**.
          executor(스레드풀) 스레드에서 직접 호출하면 numpy 버퍼 rebind가
          recv()와 동시 실행될 위험이 있다. 호출측(F7 즉시컷)이 executor에서
          트리거할 경우 반드시
          `loop.call_soon_threadsafe(audio_track.flush)` 로 감쌀 것
          (라운드2 R-3/R-4 교훈).

        flush 이후 recv()는 buffer 부족 → silence 폴백(기존 경로)으로
        정상 동작함. _pts·_next_send_at 등은 건드리지 않는다.
        """
        dropped = int(self._buffer.size)
        self._buffer = np.zeros(0, dtype=np.int16)
        if dropped:
            log.debug("[flush] audio 버퍼 %d 샘플 제거", dropped)
        return dropped

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
