"""tests/test_queue_drop_log.py — [T-258] 큐 상한 도달 드롭 로그.

배경: push_ndarray/push_pcm_int16 의 반환 `dropped` 는 호출부(pipeline)에서
전부 무시돼 왔다. 오디오 버퍼 상한은 600×960샘플 = 576,000샘플 = **정확히
12.0초**이고, 초과분은 *오래된 쪽(=답변 앞부분)*부터 잘린다. 실통화에서
speech_end 의 remaining_ms 가 12000 으로 관측된 것이 이 상한에 닿은 값이다.

이 스위트가 고정하는 것: 드롭이 실제로 일어나면 **몇 샘플/몇 ms(프레임/초)가
잘렸는지 log.warning 으로 남는다**. 상한값·드롭 정책 자체는 무변경(히즈키 판단).
"""
import logging
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from media_tracks import AvatarAudioTrack, AvatarVideoTrack  # noqa: E402


def _frame():
    return np.zeros((8, 8, 3), dtype=np.uint8)


def test_video_queue_drop_is_logged(caplog):
    t = AvatarVideoTrack(queue_max=2)
    with caplog.at_level(logging.WARNING, logger="prethird.tracks"):
        for _ in range(4):
            res = t.push_ndarray(_frame())
    # 드롭 동작 자체는 기존과 동일(반환 계약 유지)
    assert res["dropped"] is True
    msgs = [r.getMessage() for r in caplog.records if "[queue-drop]" in r.getMessage()]
    assert msgs, "드롭이 발생했는데 로그가 없다"
    assert "video" in msgs[0]
    assert "qmax=2" in msgs[0]
    # 누적 카운터가 실제 드롭 수를 따라간다(2회 초과 push → 2프레임 폐기)
    assert t._drop_total == 2


def test_video_burst_drop_is_flushed_at_turn_end(caplog):
    """[리뷰 Important 1 재현] 360칸 큐에 660프레임을 한 번에 push 하면
    실제로 300프레임이 폐기되지만, 주기 스로틀(1s) 때문에 로그에는 첫 1프레임만
    찍히고 나머지 299 는 _drop_pending 에 갇힌다. 턴 경계(signal_end)에서
    반드시 배출돼야 "이 턴에 총 몇 프레임/몇 초가 잘렸나"를 알 수 있다."""
    t = AvatarVideoTrack(queue_max=360)
    with caplog.at_level(logging.WARNING, logger="prethird.tracks"):
        for _ in range(660):
            t.push_ndarray(_frame())
        burst_msgs = [r.getMessage() for r in caplog.records if "[queue-drop]" in r.getMessage()]
        # 버스트 중에는 스로틀 때문에 1줄만 나온다(기존 동작 — 스팸 방지)
        assert len(burst_msgs) == 1
        assert t._drop_total == 300
        assert t._drop_pending == 299          # 갇혀 있던 잔량

        t.signal_end()                          # 턴 경계 → 강제 배출

    msgs = [r.getMessage() for r in caplog.records if "[queue-drop]" in r.getMessage()]
    assert len(msgs) == 2, "턴 경계에서 잔량이 배출되지 않았다"
    assert "[turn-end]" in msgs[1]
    assert "299프레임" in msgs[1]               # 갇혔던 분량이 그대로
    assert "누적 300프레임" in msgs[1]          # 이 턴 총 유실량
    assert "11.96s" in msgs[1] or "≈11.9" in msgs[1]  # 299/25 ≈ 11.96초
    assert t._drop_pending == 0


def test_video_pending_flushed_at_turn_begin(caplog):
    """직전 턴의 잔량이 남아 있으면 다음 턴 시작(begin_response)에서도 배출된다.
    (PRETHIRD_PREROLL_FRAMES=0 기본이어도 실행돼야 함 — if 밖에 배치)"""
    t = AvatarVideoTrack(queue_max=4)
    with caplog.at_level(logging.WARNING, logger="prethird.tracks"):
        for _ in range(10):
            t.push_ndarray(_frame())
        assert t._drop_pending > 0
        t.begin_response()
    msgs = [r.getMessage() for r in caplog.records if "[queue-drop]" in r.getMessage()]
    assert any("[turn-begin]" in m for m in msgs)
    assert t._drop_pending == 0


def test_flush_is_silent_when_nothing_pending(caplog):
    """잔량 0 이면 턴 경계에서 아무 로그도 남기지 않는다(무소음 — 정상 턴 오염 금지)."""
    t = AvatarVideoTrack(queue_max=8)
    a = AvatarAudioTrack(queue_max=10)
    with caplog.at_level(logging.WARNING, logger="prethird.tracks"):
        t.push_ndarray(_frame())
        a.push_pcm_int16(np.zeros(960, dtype=np.int16))
        t.begin_response()
        t.signal_end()
        a.signal_end()
    assert [r for r in caplog.records if "[queue-drop]" in r.getMessage()] == []


def test_audio_burst_drop_is_flushed_at_turn_end(caplog):
    """오디오도 동일 — partial 다세그먼트 턴에서 push 가 연달아 일어나면
    두 번째 이후 드롭이 스로틀에 갇힌다. signal_end 에서 총량이 나와야 한다."""
    a = AvatarAudioTrack(queue_max=1)               # 상한 960샘플 = 20ms
    with caplog.at_level(logging.WARNING, logger="prethird.tracks"):
        a.push_pcm_int16(np.ones(2400, dtype=np.int16))   # overflow 1440 (즉시 로그)
        a.push_pcm_int16(np.ones(2400, dtype=np.int16))   # overflow 2400 (스로틀에 갇힘)
        assert a._drop_pending_samples == 2400
        a.signal_end()

    msgs = [r.getMessage() for r in caplog.records if "[queue-drop]" in r.getMessage()]
    assert len(msgs) == 2
    assert "[turn-end]" in msgs[1]
    assert "2400샘플(50ms)" in msgs[1]
    assert "누적 3840샘플/80ms" in msgs[1]      # 이 턴 총 유실량 = 1440+2400
    assert a._drop_pending_samples == 0
    assert a._drop_total_samples == 3840


def test_video_no_drop_no_log(caplog):
    t = AvatarVideoTrack(queue_max=8)
    with caplog.at_level(logging.WARNING, logger="prethird.tracks"):
        for _ in range(3):
            t.push_ndarray(_frame())
    assert [r for r in caplog.records if "[queue-drop]" in r.getMessage()] == []
    assert t._drop_total == 0


def test_audio_buffer_overflow_is_logged_with_ms(caplog):
    """상한 1프레임(=960샘플=20ms)에 2400샘플(50ms) push → 1440샘플(30ms) 유실."""
    a = AvatarAudioTrack(queue_max=1)   # 960 샘플 = 20ms
    with caplog.at_level(logging.WARNING, logger="prethird.tracks"):
        res = a.push_pcm_int16(np.ones(2400, dtype=np.int16))
    assert res["dropped"] is True
    assert res["queued"] == 960                     # 상한까지만 남는다(정책 무변경)
    msgs = [r.getMessage() for r in caplog.records if "[queue-drop]" in r.getMessage()]
    assert msgs, "오디오 드롭이 발생했는데 로그가 없다"
    assert "audio" in msgs[0]
    assert "1440샘플(30ms)" in msgs[0]              # 몇 샘플/몇 ms 잘렸는지 명시
    assert a._drop_total_samples == 1440


def test_audio_keeps_newest_samples():
    """드롭 정책 회귀 가드 — 잘리는 쪽은 '오래된 앞부분'이다(로그만 추가했다)."""
    a = AvatarAudioTrack(queue_max=1)
    pcm = np.arange(2400, dtype=np.int16)
    a.push_pcm_int16(pcm)
    assert a._buffer.size == 960
    assert int(a._buffer[0]) == 1440                # 앞 1440샘플이 사라졌다
    assert int(a._buffer[-1]) == 2399


def test_audio_no_drop_no_log(caplog):
    a = AvatarAudioTrack(queue_max=10)
    with caplog.at_level(logging.WARNING, logger="prethird.tracks"):
        a.push_pcm_int16(np.zeros(960, dtype=np.int16))
    assert [r for r in caplog.records if "[queue-drop]" in r.getMessage()] == []
    assert a._drop_total_samples == 0
