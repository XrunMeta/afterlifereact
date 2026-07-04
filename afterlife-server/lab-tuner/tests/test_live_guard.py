import pytest
from live_guard import LiveGuard, LiveBusyError

def test_is_busy_true_when_sessions():
    g = LiveGuard("http://x/healthz", fetch_fn=lambda url: {"sessions": 2})
    assert g.active_sessions() == 2
    assert g.is_busy() is True

def test_assert_free_raises_when_busy():
    g = LiveGuard("http://x/healthz", fetch_fn=lambda url: {"sessions": 1})
    with pytest.raises(LiveBusyError):
        g.assert_free()

def test_free_when_zero():
    g = LiveGuard("http://x/healthz", fetch_fn=lambda url: {"sessions": 0})
    assert g.is_busy() is False
    g.assert_free()   # raise 없음

def test_fetch_failure_treated_free_with_warning():
    def boom(url): raise ConnectionError("down")
    g = LiveGuard("http://x/healthz", fetch_fn=boom)
    assert g.active_sessions() == 0   # 실패=0(경고), 튜닝 차단하지 않음
