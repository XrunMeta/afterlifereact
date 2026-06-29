"""test_filler_player.py — T-088 F6: FillerPlayer 단위 테스트.

DoD 검증 항목:
  1. 랜덤 선택 (직전≠, 1개뿐이면 그거)
  2. 소진 연속 타이밍 (sleep = dur - LOOKAHEAD)
  3. stop() task cancel / 멱등
  4. 필러 0개 → start() 무동작
  5. 디코드 실패 → 무동작/스킵
  6. 디코드 정규화 (mock으로 512×512 ndarray, 48k int16 검증)
  7. push가 올바른 트랙 메서드 호출
  8. close() 캐시 해제
"""
from __future__ import annotations

import asyncio
import sys
import pathlib

import numpy as np
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from filler_player import FillerPlayer, _VIDEO_FPS  # noqa: E402


# ── 공통 픽스처 ──────────────────────────────────────────────────────────


class _FakeVideoTrack:
    def __init__(self):
        self.pushed: list[np.ndarray] = []

    def push_ndarray(self, arr: np.ndarray) -> dict:
        self.pushed.append(arr)
        return {"queued": len(self.pushed), "dropped": False}


class _FakeAudioTrack:
    def __init__(self):
        self.pushed: list[np.ndarray] = []

    def push_pcm_int16(self, pcm: np.ndarray) -> dict:
        self.pushed.append(pcm)
        return {"queued": pcm.size, "dropped": False}


def _make_decode_fn(n_frames: int = 10, pcm_samples: int = 4800, frame_size: int = 512):
    """성공 decode_fn mock: n_frames개 frame_size×frame_size rgb24 + int16 pcm."""
    def _decode(path: str):
        frames = [
            np.full((frame_size, frame_size, 3), i % 128, dtype=np.uint8)
            for i in range(n_frames)
        ]
        pcm = np.arange(pcm_samples, dtype=np.int16)
        return frames, pcm
    return _decode


def _make_fail_decode_fn():
    """항상 실패(빈 frames) 반환하는 decode_fn mock."""
    def _decode(path: str):
        return [], np.zeros(0, dtype=np.int16)
    return _decode


def _make_throw_decode_fn():
    """항상 예외를 throw하는 decode_fn mock (av.open 실패 시뮬)."""
    def _decode(path: str):
        raise RuntimeError(f"av.open 실패: {path}")
    return _decode


def _make_zero_frames_decode_fn():
    """frames 0개(빈 리스트)를 반환하는 decode_fn — 스킵 대상."""
    def _decode(path: str):
        return [], np.zeros(0, dtype=np.int16)
    return _decode


def _make_player(
    paths=None,
    n_frames=10,
    pcm_samples=4800,
    lookahead=0.0,
    decode_fn=None,
    sleep_fn=None,
):
    vt = _FakeVideoTrack()
    at = _FakeAudioTrack()
    # paths=None이면 기본값 사용, paths=[]이면 빈 리스트 그대로 전달
    effective_paths = ["a.mp4"] if paths is None else paths
    fp = FillerPlayer(
        effective_paths,
        vt, at,
        lookahead_sec=lookahead,
        decode_fn=decode_fn or _make_decode_fn(n_frames=n_frames, pcm_samples=pcm_samples),
        _sleep_fn=sleep_fn or asyncio.sleep,
    )
    return fp, vt, at


# ═══════════════════════════════════════════════════════════════════════
# 1. 필러 0개 → start() 무동작
# ═══════════════════════════════════════════════════════════════════════


def test_zero_paths_start_noop():
    """paths=[] → start() 무동작, _task 없음."""
    fp, vt, at = _make_player(paths=[])
    fp.start()
    assert fp._task is None, "paths 없으면 task 생성되면 안 됨"
    assert vt.pushed == [], "push 없어야 함"
    assert at.pushed == [], "push 없어야 함"


def test_zero_paths_stop_noop():
    """paths=[] → stop() 멱등, 예외 없음."""
    fp, _, _ = _make_player(paths=[])
    fp.stop()
    fp.stop()  # 재호출도 예외 없음


# ═══════════════════════════════════════════════════════════════════════
# 2. 랜덤 선택
# ═══════════════════════════════════════════════════════════════════════


def test_pick_next_idx_single_path():
    """paths 1개 → 항상 index 0."""
    fp, _, _ = _make_player(paths=["a.mp4"])
    for _ in range(10):
        assert fp._pick_next_idx() == 0, "1개뿐이면 항상 0"


def test_pick_next_idx_no_repeat_with_multiple_paths():
    """paths 3개 → 연속 호출 시 직전 index 중복 없음."""
    fp, _, _ = _make_player(paths=["a.mp4", "b.mp4", "c.mp4"])
    last = fp._pick_next_idx()
    fp._last_idx = last
    for _ in range(30):
        idx = fp._pick_next_idx()
        assert idx != fp._last_idx, (
            f"직전 idx={fp._last_idx}와 같은 idx={idx} 선택됨"
        )
        fp._last_idx = idx


def test_pick_next_idx_two_paths_alternates():
    """paths 2개 → 매번 반드시 다른 index."""
    fp, _, _ = _make_player(paths=["a.mp4", "b.mp4"])
    fp._last_idx = 0
    for _ in range(10):
        idx = fp._pick_next_idx()
        assert idx != fp._last_idx
        fp._last_idx = idx


def test_pick_next_idx_zero_paths_returns_minus_one():
    """paths=[] → -1 반환."""
    fp, _, _ = _make_player(paths=[])
    assert fp._pick_next_idx() == -1


# ═══════════════════════════════════════════════════════════════════════
# 3. 디코드 / 캐시
# ═══════════════════════════════════════════════════════════════════════


def test_lazy_decode_called_once():
    """같은 path 두 번 요청 → decode_fn 1회만 호출(LRU)."""
    call_count = [0]

    def counting_decode(path: str):
        call_count[0] += 1
        return [np.zeros((8, 8, 3), dtype=np.uint8)], np.zeros(100, dtype=np.int16)

    fp, _, _ = _make_player(paths=["x.mp4"], decode_fn=counting_decode)
    fp._get_decoded("x.mp4")
    fp._get_decoded("x.mp4")
    assert call_count[0] == 1, f"decode_fn 1회 기대, 실제: {call_count[0]}"


def test_decode_success_cached():
    """decode 성공 시 캐시에 결과 저장, 프레임 수 일치."""
    fp, _, _ = _make_player(paths=["ok.mp4"], n_frames=7)
    result = fp._get_decoded("ok.mp4")
    assert result is not None
    frames, pcm = result
    assert len(frames) == 7
    assert "ok.mp4" in fp._cache
    assert fp._cache["ok.mp4"] is not None


def test_decode_failure_returns_none_and_cached_none():
    """decode 실패(빈 frames) → None 반환, 캐시에 None 기록."""
    fp, _, _ = _make_player(paths=["fail.mp4"], decode_fn=_make_fail_decode_fn())
    result = fp._get_decoded("fail.mp4")
    assert result is None, "디코드 실패 → None"
    assert "fail.mp4" in fp._cache
    assert fp._cache["fail.mp4"] is None, "캐시에 None 저장"


def test_decode_normalizes_512x512():
    """decode_fn이 반환한 프레임이 512×512×3 rgb24 형식인지 검증."""
    fp, _, _ = _make_player(paths=["norm.mp4"], n_frames=3)
    result = fp._get_decoded("norm.mp4")
    assert result is not None
    frames, _ = result
    for arr in frames:
        assert arr.shape == (512, 512, 3), f"shape 기대 (512,512,3), 실제 {arr.shape}"
        assert arr.dtype == np.uint8


def test_decode_normalizes_48k_int16():
    """decode_fn이 반환한 pcm이 int16 dtype인지 검증."""
    fp, _, _ = _make_player(paths=["pcm.mp4"], pcm_samples=9600)
    result = fp._get_decoded("pcm.mp4")
    assert result is not None
    _, pcm = result
    assert pcm.dtype == np.int16, f"pcm dtype 기대 int16, 실제 {pcm.dtype}"
    assert pcm.ndim == 1, "pcm은 1D여야 함"
    assert pcm.size == 9600


# ═══════════════════════════════════════════════════════════════════════
# 4. push가 올바른 트랙 메서드 호출 (asyncio 재생 루프)
# ═══════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_play_loop_pushes_video_and_audio():
    """재생 루프 1회 → video_track.push_ndarray, audio_track.push_pcm_int16 호출."""
    n_frames = 5
    loop_count = [0]

    async def fake_sleep(dur: float) -> None:
        loop_count[0] += 1
        if loop_count[0] >= 2:
            raise asyncio.CancelledError()

    fp, vt, at = _make_player(
        paths=["a.mp4"],
        n_frames=n_frames,
        pcm_samples=480,
        lookahead=0.5,
        sleep_fn=fake_sleep,
    )

    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    finally:
        if not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    # 적어도 1회 루프 완료 → n_frames 이상 push
    assert len(vt.pushed) >= n_frames, (
        f"video push 기대 {n_frames}+, 실제 {len(vt.pushed)}"
    )
    assert len(at.pushed) >= 1, "audio pcm push 기대 1+"


@pytest.mark.asyncio
async def test_play_loop_sleep_duration():
    """sleep duration = filler_dur(frames/25) - lookahead."""
    n_frames = 25   # 1초 @ 25fps
    lookahead = 0.5
    expected_sleep = n_frames / _VIDEO_FPS - lookahead  # 0.5s

    slept: list[float] = []

    async def fake_sleep(dur: float) -> None:
        slept.append(dur)
        raise asyncio.CancelledError()  # 첫 sleep 후 종료

    fp, _, _ = _make_player(
        paths=["a.mp4"],
        n_frames=n_frames,
        lookahead=lookahead,
        sleep_fn=fake_sleep,
    )

    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    finally:
        if not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    assert slept, "sleep이 1회 이상 호출되어야 함"
    assert abs(slept[0] - expected_sleep) < 1e-9, (
        f"sleep duration 기대 {expected_sleep}, 실제 {slept[0]}"
    )


@pytest.mark.asyncio
async def test_play_loop_sleep_zero_when_lookahead_exceeds_dur():
    """lookahead >= filler_dur → sleep(0) 이상(음수 없음)."""
    n_frames = 5   # 0.2초
    lookahead = 9999.0  # 과도하게 큰 lookahead

    slept: list[float] = []

    async def fake_sleep(dur: float) -> None:
        slept.append(dur)
        raise asyncio.CancelledError()

    fp, _, _ = _make_player(
        paths=["a.mp4"],
        n_frames=n_frames,
        lookahead=lookahead,
        sleep_fn=fake_sleep,
    )
    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    finally:
        if not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    assert slept, "sleep 호출 필요"
    assert slept[0] >= 0.0, f"sleep 음수 금지, 실제: {slept[0]}"


# ═══════════════════════════════════════════════════════════════════════
# 5. stop() task cancel / 멱등
# ═══════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_stop_cancels_task():
    """start() 후 stop() → task가 취소됨(done + cancelled)."""
    blocked = asyncio.Event()

    async def blocking_sleep(dur: float) -> None:
        await blocked.wait()  # 무한 대기 — stop()이 취소해야

    fp, _, _ = _make_player(paths=["a.mp4"], sleep_fn=blocking_sleep)
    fp.start()
    assert fp._task is not None, "task 생성 기대"
    assert not fp._task.done()

    # 이벤트루프가 코루틴을 한 step 실행하도록 양보
    await asyncio.sleep(0)
    await asyncio.sleep(0)

    fp.stop()
    await asyncio.sleep(0)  # cancel 처리

    assert fp._task.done(), "stop() 후 task가 done이어야 함"
    assert fp._task.cancelled(), "stop() 후 task가 cancelled여야 함"


@pytest.mark.asyncio
async def test_stop_idempotent_no_exception():
    """stop() 여러 번 호출 — 예외 없음, 멱등."""
    fp, _, _ = _make_player(paths=["a.mp4"])

    # task 없는 상태에서 stop
    fp.stop()
    fp.stop()

    # task 있는 상태에서 stop 두 번
    fp.start()
    await asyncio.sleep(0)
    fp.stop()
    fp.stop()  # 두 번째 stop — 예외 없음

    if fp._task is not None:
        try:
            await fp._task
        except asyncio.CancelledError:
            pass


@pytest.mark.asyncio
async def test_start_idempotent_no_double_task():
    """이미 실행 중인 상태에서 start() 재호출 → 새 task 생성 안 함."""
    blocked = asyncio.Event()

    async def blocking_sleep(dur: float) -> None:
        await blocked.wait()

    fp, _, _ = _make_player(paths=["a.mp4"], sleep_fn=blocking_sleep)
    fp.start()
    await asyncio.sleep(0)
    first_task = fp._task

    fp.start()  # 재호출
    assert fp._task is first_task, "이미 실행 중이면 task 교체 금지"

    # 정리
    fp.stop()
    blocked.set()
    if fp._task:
        try:
            await fp._task
        except asyncio.CancelledError:
            pass


# ═══════════════════════════════════════════════════════════════════════
# 6. 디코드 실패 → 루프 종료(무동작/스킵)
# ═══════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_all_decode_fail_loop_exits():
    """모든 필러 decode 실패 → 루프가 자연 종료(CancelledError 없이)."""
    fp, vt, at = _make_player(
        paths=["f1.mp4", "f2.mp4"],
        decode_fn=_make_fail_decode_fn(),
    )

    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(task, timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pytest.fail("decode 전부 실패 시 루프는 자연 종료되어야 함")

    assert task.done() and not task.cancelled(), "루프 자연 종료 기대"
    assert vt.pushed == [], "push 없어야 함"
    assert at.pushed == [], "push 없어야 함"


@pytest.mark.asyncio
async def test_partial_decode_fail_skips_bad_plays_valid():
    """일부 decode 실패 → 실패 스킵, 성공 필러 재생."""
    call_log: list[str] = []

    def selective_decode(path: str):
        call_log.append(path)
        if "bad" in path:
            return [], np.zeros(0, dtype=np.int16)
        return [np.zeros((8, 8, 3), dtype=np.uint8)], np.zeros(48, dtype=np.int16)

    loop_count = [0]

    async def fake_sleep(dur: float) -> None:
        loop_count[0] += 1
        if loop_count[0] >= 2:
            raise asyncio.CancelledError()

    fp, vt, at = _make_player(
        paths=["bad.mp4", "good.mp4"],
        decode_fn=selective_decode,
        sleep_fn=fake_sleep,
    )

    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    finally:
        if not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    # good.mp4는 push되어야 함
    assert len(vt.pushed) >= 1, "성공 필러는 push되어야 함"
    assert "good.mp4" in call_log, "good.mp4decode 시도 기대"


# ═══════════════════════════════════════════════════════════════════════
# 7. close() 캐시 해제
# ═══════════════════════════════════════════════════════════════════════


def test_close_clears_cache():
    """close() 후 _cache가 비어야 함."""
    fp, _, _ = _make_player(paths=["a.mp4", "b.mp4"])
    # 수동 캐시 주입
    dummy = ([np.zeros((8, 8, 3), dtype=np.uint8)], np.zeros(10, dtype=np.int16))
    fp._cache["a.mp4"] = dummy
    fp._cache["b.mp4"] = dummy
    assert len(fp._cache) == 2

    fp.close()
    assert len(fp._cache) == 0, "close() 후 캐시 비어야 함"


def test_cleanup_alias_clears_cache():
    """cleanup()은 close()의 별칭."""
    fp, _, _ = _make_player(paths=["a.mp4"])
    dummy = ([np.zeros((8, 8, 3), dtype=np.uint8)], np.zeros(10, dtype=np.int16))
    fp._cache["a.mp4"] = dummy
    fp.cleanup()
    assert len(fp._cache) == 0


@pytest.mark.asyncio
async def test_close_stops_running_task():
    """close() → 실행 중 task도 cancel됨."""
    blocked = asyncio.Event()

    async def blocking_sleep(dur: float) -> None:
        await blocked.wait()

    fp, _, _ = _make_player(paths=["a.mp4"], sleep_fn=blocking_sleep)
    fp.start()
    await asyncio.sleep(0)
    assert fp._task is not None and not fp._task.done()

    fp.close()
    await asyncio.sleep(0)

    assert fp._task.done(), "close() 후 task가 done이어야 함"
    assert len(fp._cache) == 0, "close() 후 캐시 비어야 함"
    blocked.set()  # 정리


# ═══════════════════════════════════════════════════════════════════════
# 8. 소진 연속 재생 (랜덤 교체)
# ═══════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_continuous_play_alternates_indexes():
    """3개 paths → 연속 재생 시 _last_idx가 매 sleep마다 직전과 다른 값.

    LRU 캐시로 decode_fn 재호출 없으므로 sleep_fn 시점의 fp._last_idx를 추적.
    """
    paths = ["a.mp4", "b.mp4", "c.mp4"]
    # FillerPlayer 참조를 담을 컨테이너 (클로저가 start() 이후 fp를 읽기 위함)
    fp_ref: list = []
    played_indexes: list[int] = []

    async def tracking_sleep(dur: float) -> None:
        # sleep 직전 _last_idx = 방금 재생한 index
        if fp_ref:
            played_indexes.append(fp_ref[0]._last_idx)
        if len(played_indexes) >= 4:
            raise asyncio.CancelledError()

    fp, _, _ = _make_player(
        paths=paths,
        n_frames=5,
        decode_fn=_make_decode_fn(n_frames=5),
        sleep_fn=tracking_sleep,
    )
    fp_ref.append(fp)

    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=3.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    finally:
        if not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    # 4회 이상 재생 → 연속 같은 index 없어야 함 (paths >= 2)
    assert len(played_indexes) >= 2, f"재생 기록 부족: {played_indexes}"
    for i in range(1, len(played_indexes)):
        assert played_indexes[i] != played_indexes[i - 1], (
            f"연속 중복 index: {played_indexes}"
        )


# ═══════════════════════════════════════════════════════════════════════
# 9. flush는 FillerPlayer가 직접 호출하지 않음 (역할 분리)
# ═══════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_stop_does_not_call_flush():
    """stop() 시 video/audio track의 flush를 직접 호출하지 않는다.

    flush는 F7 호출측 책임 (spec §4.C, plan F6).
    """
    flush_called = [False]

    class _TrackWithFlush(_FakeVideoTrack):
        def flush(self):
            flush_called[0] = True
            return 0

    blocked = asyncio.Event()

    async def blocking_sleep(dur: float) -> None:
        await blocked.wait()

    vt = _TrackWithFlush()
    at = _FakeAudioTrack()
    fp = FillerPlayer(
        ["a.mp4"], vt, at,
        lookahead_sec=0.0,
        decode_fn=_make_decode_fn(),
        _sleep_fn=blocking_sleep,
    )
    fp.start()
    await asyncio.sleep(0)

    fp.stop()
    await asyncio.sleep(0)

    assert not flush_called[0], "stop()이 flush를 직접 호출하면 안 됨 (F7 책임)"
    blocked.set()
    if fp._task:
        try:
            await fp._task
        except asyncio.CancelledError:
            pass


# ═══════════════════════════════════════════════════════════════════════
# 10. 보강: decode_fn throw → 스킵·루프 계속 (el R-2 + sion #2)
# ═══════════════════════════════════════════════════════════════════════


def test_decode_fn_throw_returns_none_cached():
    """decode_fn이 예외 throw → _get_decoded가 None 반환, 캐시에 None 기록."""
    fp, _, _ = _make_player(paths=["err.mp4"], decode_fn=_make_throw_decode_fn())
    result = fp._get_decoded("err.mp4")
    assert result is None, "throw → None 반환 기대"
    assert fp._cache.get("err.mp4") is None, "캐시에 None 기록 기대"


def test_decode_fn_throw_cached_not_called_again():
    """decode_fn throw 후 같은 path 재요청 → decode_fn 재호출 없음(캐시 hit)."""
    call_count = [0]

    def throwing_once(path: str):
        call_count[0] += 1
        raise ValueError("디코드 실패")

    fp, _, _ = _make_player(paths=["err.mp4"], decode_fn=throwing_once)
    fp._get_decoded("err.mp4")
    fp._get_decoded("err.mp4")  # 두 번째: 캐시 hit
    assert call_count[0] == 1, "throw 후 캐시된 None → decode_fn 재호출 없어야 함"


@pytest.mark.asyncio
async def test_decode_fn_throw_skip_loop_continues():
    """decode_fn throw → 해당 필러 스킵, 다른 필러 재생 (루프 계속)."""
    call_log: list[str] = []

    def selective_throw(path: str):
        call_log.append(path)
        if "bad" in path:
            raise RuntimeError("av.open 실패")
        return [np.zeros((512, 512, 3), dtype=np.uint8)], np.zeros(48, dtype=np.int16)

    loop_count = [0]

    async def fake_sleep(dur: float) -> None:
        loop_count[0] += 1
        if loop_count[0] >= 2:
            raise asyncio.CancelledError()

    fp, vt, _ = _make_player(
        paths=["bad.mp4", "good.mp4"],
        decode_fn=selective_throw,
        sleep_fn=fake_sleep,
    )

    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    finally:
        if not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    assert len(vt.pushed) >= 1, "good.mp4는 push되어야 함"
    assert "good.mp4" in call_log, "good.mp4 decode 시도 기대"


@pytest.mark.asyncio
async def test_all_decode_fn_throw_loop_exits():
    """모든 decode_fn이 throw → 루프가 자연 종료."""
    fp, vt, at = _make_player(
        paths=["e1.mp4", "e2.mp4"],
        decode_fn=_make_throw_decode_fn(),
    )

    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(task, timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pytest.fail("전부 throw 시 루프는 자연 종료되어야 함")

    assert task.done() and not task.cancelled(), "루프 자연 종료 기대"
    assert vt.pushed == [], "push 없어야 함"
    assert at.pushed == [], "push 없어야 함"


# ═══════════════════════════════════════════════════════════════════════
# 11. 보강: 0프레임 필러 스킵 (sion #4)
# ═══════════════════════════════════════════════════════════════════════


def test_zero_frames_returns_none():
    """decode_fn이 frames=0개 반환 → _get_decoded None, 캐시 None."""
    fp, _, _ = _make_player(paths=["empty.mp4"], decode_fn=_make_zero_frames_decode_fn())
    result = fp._get_decoded("empty.mp4")
    assert result is None, "0프레임 → None 기대"
    assert fp._cache.get("empty.mp4") is None


@pytest.mark.asyncio
async def test_zero_frames_skip_no_push():
    """frames=0개 필러 → push 없이 스킵, 전부 0프레임이면 루프 자연 종료."""
    fp, vt, at = _make_player(
        paths=["z1.mp4", "z2.mp4"],
        decode_fn=_make_zero_frames_decode_fn(),
    )

    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(task, timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pytest.fail("0프레임 전부 실패 시 루프는 자연 종료되어야 함")

    assert task.done() and not task.cancelled()
    assert vt.pushed == [], "0프레임 → push 없어야 함"
    assert at.pushed == [], "push 없어야 함"


# ═══════════════════════════════════════════════════════════════════════
# 12. 보강: push 인자 dtype/shape 검증 (sion #4)
# ═══════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_push_video_dtype_shape():
    """video push 인자가 (512,512,3) uint8 ndarray인지 검증."""
    pushed_arrs: list[np.ndarray] = []

    class _CheckingVideoTrack:
        def push_ndarray(self, arr: np.ndarray) -> dict:
            pushed_arrs.append(arr)
            return {"queued": 1, "dropped": False}

    slept = [0]

    async def fake_sleep(dur: float) -> None:
        slept[0] += 1
        raise asyncio.CancelledError()

    vt = _CheckingVideoTrack()
    at = _FakeAudioTrack()
    fp = FillerPlayer(
        ["a.mp4"], vt, at,
        lookahead_sec=0.0,
        decode_fn=_make_decode_fn(n_frames=3, frame_size=512),
        _sleep_fn=fake_sleep,
    )

    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    finally:
        if not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    assert pushed_arrs, "video push 있어야 함"
    for arr in pushed_arrs:
        assert arr.shape == (512, 512, 3), f"shape 기대 (512,512,3), 실제 {arr.shape}"
        assert arr.dtype == np.uint8, f"dtype 기대 uint8, 실제 {arr.dtype}"


@pytest.mark.asyncio
async def test_push_audio_dtype_1d():
    """audio push 인자가 int16 1D ndarray인지 검증."""
    pushed_pcms: list[np.ndarray] = []

    class _CheckingAudioTrack:
        def push_pcm_int16(self, pcm: np.ndarray) -> dict:
            pushed_pcms.append(pcm)
            return {"queued": pcm.size, "dropped": False}

    async def fake_sleep(dur: float) -> None:
        raise asyncio.CancelledError()

    vt = _FakeVideoTrack()
    at = _CheckingAudioTrack()
    fp = FillerPlayer(
        ["a.mp4"], vt, at,
        lookahead_sec=0.0,
        decode_fn=_make_decode_fn(n_frames=3, pcm_samples=4800),
        _sleep_fn=fake_sleep,
    )

    task = asyncio.ensure_future(fp._play_loop())
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    finally:
        if not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    assert pushed_pcms, "audio push 있어야 함"
    for pcm in pushed_pcms:
        assert pcm.dtype == np.int16, f"dtype 기대 int16, 실제 {pcm.dtype}"
        assert pcm.ndim == 1, f"1D 기대, 실제 ndim={pcm.ndim}"


# ═══════════════════════════════════════════════════════════════════════
# 13. 보강: 비-CancelledError 예외 루프 로깅 (el R-2)
# ═══════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_noncancelled_exception_logged_not_silent(caplog):
    """_play_loop 내에서 비-CancelledError 예외 발생 시 log.exception 기록 후 정상 종료.

    루프가 silent하게 죽지 않고, 로그에 에러가 남아야 함.
    """
    import logging

    call_count = [0]

    async def exploding_sleep(dur: float) -> None:
        call_count[0] += 1
        if call_count[0] >= 1:
            raise RuntimeError("테스트: 루프 내 비정상 예외")

    fp, _, _ = _make_player(paths=["a.mp4"], sleep_fn=exploding_sleep)

    with caplog.at_level(logging.ERROR, logger="prethird.filler_player"):
        task = asyncio.ensure_future(fp._play_loop())
        try:
            await asyncio.wait_for(task, timeout=2.0)
        except (asyncio.CancelledError, asyncio.TimeoutError):
            pytest.fail("비-CancelledError → 루프 자연 종료 기대")

    assert task.done() and not task.cancelled(), "루프가 종료되어야 함"
    # 에러 로그에 "비정상 종료" 메시지가 남아야 함
    assert any("비정상 종료" in r.message for r in caplog.records), (
        f"비정상 종료 로그 누락. 실제 로그: {[r.message for r in caplog.records]}"
    )
