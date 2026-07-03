"""filler_player.py — T-088 F6: FillerPlayer (asyncio 코루틴 기반 필러 재생기).

prebake filler mp4 리스트를 받아 랜덤 연속 재생.
배선(F7)·flush·응답 push는 호출측 담당 — FillerPlayer는 재생 루프/캐시만.

⚠ sync_event 상호작용 주석 (spec §4.C R-2):
    filler frame이 recv()에서 소비되면 _sync_event.set()(첫 real frame gate).
    현재 코드는 turn별 sync 리셋이 없어 무해(filler가 열어둔 gate를 응답이 그대로 사용).
    향후 "turn별 sync 리셋" 도입 시, filler→응답 전환에서 gate 재닫힘 오류 가능.
    그 기능 추가 시 filler를 sync 리셋 대상에서 제외할 것.
"""
from __future__ import annotations

import asyncio
import logging
import os
import random
from typing import Callable, Optional

import numpy as np

log = logging.getLogger("prethird.filler_player")

_VIDEO_FPS: int = 25
_AUDIO_SR: int = 48000

FILLER_LOOKAHEAD_SEC: float = float(os.environ.get("FILLER_LOOKAHEAD_SEC", "1.0"))


# ── 디코드 함수 (default) ──────────────────────────────────────────────────


def _decode_mp4_default(path: str) -> tuple[list[np.ndarray], np.ndarray]:
    """mp4 → (rgb24 프레임 리스트[원본 크기 보존], 48k mono int16 pcm 1D ndarray).

    실패 시 ([], zeros(0, int16)) 반환 — 호출측(FillerPlayer)이 스킵 처리.
    ⚠ 프레임 크기는 원본 그대로 유지한다 — fifth /render 는 paste-back 으로
    소스 사진 비율(예: 576×1024 세로)을 보존하며, 통화의 idle/speaking 프레임도
    같은 소스라 크기가 동일하다. 과거 512×512 강제 resize 가 필러만 찌그러진
    정사각으로 송출시킨 버그(T-088 라운드4)의 재발 금지.
    """
    try:
        import av

        video_frames: list[np.ndarray] = []
        pcm_chunks: list[np.ndarray] = []

        resampler = av.AudioResampler(
            format="s16",
            layout="mono",
            rate=_AUDIO_SR,
        )

        container = av.open(path)
        try:
            for packet in container.demux():
                if packet.stream.type == "video":
                    for frame in packet.decode():
                        # 원본 크기 보존 — resize 금지 (docstring 참조)
                        arr: np.ndarray = frame.to_ndarray(format="rgb24")
                        video_frames.append(arr)

                elif packet.stream.type == "audio":
                    for frame in packet.decode():
                        for rf in resampler.resample(frame):
                            chunk: np.ndarray = rf.to_ndarray()
                            if chunk.ndim > 1:
                                chunk = chunk[0]  # 첫 채널(mono)
                            pcm_chunks.append(chunk.astype(np.int16))

            # resampler flush
            for rf in resampler.resample(None):
                chunk = rf.to_ndarray()
                if chunk.ndim > 1:
                    chunk = chunk[0]
                pcm_chunks.append(chunk.astype(np.int16))

        finally:
            container.close()

        if not video_frames:
            log.warning("[filler] 비디오 프레임 없음: %s", path)
            return [], np.zeros(0, dtype=np.int16)

        pcm = (
            np.concatenate(pcm_chunks).astype(np.int16)
            if pcm_chunks
            else np.zeros(0, dtype=np.int16)
        )
        log.debug(
            "[filler] decode OK: %s  frames=%d  pcm=%d samples",
            path, len(video_frames), pcm.size,
        )
        return video_frames, pcm

    except Exception as exc:
        log.warning("[filler] decode 실패: %s — %s", path, exc)
        return [], np.zeros(0, dtype=np.int16)


# ── FillerPlayer ──────────────────────────────────────────────────────────


class FillerPlayer:
    """T-088 F6: prebake filler mp4 랜덤 연속 재생기.

    Parameters
    ----------
    paths : list[str]
        필러 mp4 로컬 파일 경로 리스트. 빈 리스트면 start() 무동작(idle 폴백).
    video_track :
        push_ndarray(rgb_arr) 인터페이스 (AvatarVideoTrack).
    audio_track :
        push_pcm_int16(pcm) 인터페이스 (AvatarAudioTrack).
    lookahead_sec : float, optional
        다음 필러 push 시작 선행 시간(초). 기본값=FILLER_LOOKAHEAD_SEC(env 1.0).
    decode_fn : callable, optional
        (path: str) -> (frames, pcm). 테스트 mock 주입용. 기본=_decode_mp4_default.
    _sleep_fn : callable, optional
        asyncio.sleep 대체 hook (테스트 제어용). 기본=asyncio.sleep.

    Notes
    -----
    - push는 반드시 이벤트루프 스레드(코루틴 내)에서 실행 (spec R-1).
    - flush + 응답 push는 F7 호출측 담당 (역할 분리).
    - stop()은 task cancel만. 멱등.
    - close()/cleanup(): 캐시 해제 (F7 세션 cleanup에서 호출).
    """

    def __init__(
        self,
        paths: list[str],
        video_track,
        audio_track,
        lookahead_sec: Optional[float] = None,
        decode_fn: Optional[Callable[[str], tuple[list[np.ndarray], np.ndarray]]] = None,
        _sleep_fn: Optional[Callable] = None,
    ) -> None:
        self._paths: list[str] = list(paths)
        self._vt = video_track
        self._at = audio_track
        self._lookahead: float = max(
            0.0,
            lookahead_sec if lookahead_sec is not None else FILLER_LOOKAHEAD_SEC,
        )
        self._decode_fn: Callable = decode_fn or _decode_mp4_default
        self._sleep_fn: Callable = _sleep_fn or asyncio.sleep

        # 단순 dict 캐시(세션 3개 규모, eviction 없음): path → (frames, pcm) | None(디코드 실패)
        self._cache: dict[str, Optional[tuple[list[np.ndarray], np.ndarray]]] = {}

        # 재생 asyncio.Task
        self._task: Optional[asyncio.Task] = None

        # 직전 재생 index (랜덤 중복 방지)
        self._last_idx: int = -1

    # ── 디코드 / 캐시 ─────────────────────────────────────────────────────

    def _get_decoded(
        self, path: str
    ) -> Optional[tuple[list[np.ndarray], np.ndarray]]:
        """lazy 디코드 + 단순 dict 캐시.

        반환: (frames, pcm) 또는 None(디코드 실패/예외 — 호출측이 스킵).
        decode_fn이 예외를 throw해도 루프 crash 없이 스킵(None 캐시).
        """
        if path in self._cache:
            return self._cache[path]

        try:
            frames, pcm = self._decode_fn(path)
        except Exception as exc:
            log.warning("[filler] decode_fn 예외 — 스킵: %s — %s", path, exc)
            self._cache[path] = None
            return None

        if not frames:
            log.warning("[filler] 디코드 실패/빈 프레임 — 스킵: %s", path)
            self._cache[path] = None
            return None

        self._cache[path] = (frames, pcm)
        return frames, pcm

    # ── 랜덤 선택 ─────────────────────────────────────────────────────────

    def _pick_next_idx(self) -> int:
        """랜덤 필러 index 선택.

        - paths 0개 → -1(무효)
        - paths 1개 → 항상 0
        - paths 2개 이상 → 직전(_last_idx)과 다른 index 우선(없으면 전체에서 선택)
        """
        n = len(self._paths)
        if n == 0:
            return -1
        if n == 1:
            return 0
        candidates = [i for i in range(n) if i != self._last_idx]
        if not candidates:
            candidates = list(range(n))
        return random.choice(candidates)

    # ── 재생 루프 ─────────────────────────────────────────────────────────

    async def _play_loop(self) -> None:
        """asyncio 코루틴: 랜덤 필러 무한 연속 재생.

        - 디코드 실패 필러 스킵, 연속 실패가 paths 수를 초과하면 루프 종료(idle 폴백).
        - asyncio.CancelledError: stop() / 즉시컷(F7) 시 정상 종료 경로 — 반드시 재발생.
        - push는 코루틴 내(이벤트루프 스레드) → thread-safe (spec R-1).
        """
        log.info(
            "[filler] 재생 루프 시작 (paths=%d, lookahead=%.2fs)",
            len(self._paths), self._lookahead,
        )
        n = len(self._paths)
        consecutive_failures = 0

        try:
            while True:
                idx = self._pick_next_idx()
                if idx < 0:
                    # paths 없음(방어 — start()에서 걸러지지만 안전장치)
                    break

                path = self._paths[idx]
                decoded = self._get_decoded(path)

                if decoded is None:
                    # 디코드 실패: _last_idx 갱신 후 다음 시도
                    self._last_idx = idx
                    consecutive_failures += 1
                    if consecutive_failures >= n:
                        log.warning("[filler] 모든 필러 디코드 실패 — 루프 종료(idle 폴백)")
                        break
                    continue

                # 성공 — 카운터 리셋, index 갱신
                consecutive_failures = 0
                self._last_idx = idx
                frames, pcm = decoded

                # 재생 시간 계산 (25fps 기준)
                filler_dur_sec: float = len(frames) / float(_VIDEO_FPS)
                sleep_dur: float = max(0.0, filler_dur_sec - self._lookahead)

                log.debug(
                    "[filler] push idx=%d  frames=%d  pcm=%d  dur=%.2fs  sleep=%.2fs",
                    idx, len(frames), pcm.size, filler_dur_sec, sleep_dur,
                )

                # 비디오 frames push (speaking 경로와 동일 — push_ndarray)
                for arr in frames:
                    self._vt.push_ndarray(arr)

                # 오디오 pcm push (48k mono int16)
                if pcm.size > 0:
                    self._at.push_pcm_int16(pcm)

                # LOOKAHEAD 전에 깨어나 다음 필러를 연속으로 push
                # (큐 언더런 방지 + overflow 방지 — spec §4.C I-1)
                await self._sleep_fn(sleep_dur)

        except asyncio.CancelledError:
            # stop() 또는 F7 즉시컷으로 인한 정상 취소
            log.info("[filler] 재생 루프 취소 (stop 호출 또는 즉시컷)")
            raise  # asyncio 계약: CancelledError 반드시 재발생
        except Exception as e:
            log.exception("[filler] 루프 비정상 종료: %s", e)

    # ── public API ────────────────────────────────────────────────────────

    def start(self) -> None:
        """재생 시작.

        paths 없거나 이미 실행 중이면 무동작(fail-safe).
        asyncio.ensure_future → 이벤트루프 스레드 전제(F7 배선측 책임).
        """
        if not self._paths:
            log.info("[filler] paths 없음 — start() 무동작(idle 폴백)")
            return
        if self._task is not None and not self._task.done():
            log.debug("[filler] 이미 실행 중 — start() 무동작")
            return
        self._task = asyncio.ensure_future(self._play_loop())
        log.info("[filler] task 생성 완료")

    def stop(self) -> None:
        """재생 중단. 멱등(이미 stop이면 무해).

        즉시 컷(flush + 응답 push)은 F7 호출측이 담당한다 — 역할 분리.
        """
        if self._task is None or self._task.done():
            log.debug("[filler] stop() — task 없거나 이미 완료(무동작)")
            return
        self._task.cancel()
        log.info("[filler] task 취소 요청")

    def close(self) -> None:
        """디코드 캐시 해제. 세션 cleanup에서 호출(F7).

        stop()도 함께 호출해 좀비 task 방지.
        """
        self.stop()
        self._cache.clear()
        log.info("[filler] 캐시 해제 완료")

    # F7 cleanup 인터페이스 통일 — 별칭
    cleanup = close
