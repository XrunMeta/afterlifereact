"""tests/test_greet_billing_start.py — T-167 greet 시점 과금 개시.

greet 의 첫 오디오 송출 = 과금 시작점.
강제 종료는 sess.pc.close() 로 한다 — Session 에는 close() 가 없고,
pc 종료가 connectionstatechange 훅을 태워 기존 정리 + call_end(정산)까지
그대로 흐르기 때문이다(별도 종료 경로를 새로 만들지 않는다).
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio  # noqa: E402
import json  # noqa: E402
import pytest  # noqa: E402
import signaling  # noqa: E402
from signaling import _start_credit_billing, _warn_offsets_from_env  # noqa: E402

class _FakeChannel:
    def __init__(self):
        self.sent = []
        self.readyState = "open"

    def send(self, payload):
        self.sent.append(json.loads(payload))

class _FakePC:
    def __init__(self):
        self.closed = False

    async def close(self):
        self.closed = True

class _FakeSession:
    def __init__(self):
        self.session_id = "aabbccddeeff"
        self.allowed_sec = 600
        self.credit_guard = None
        self.max_end_at_ms = 0
        self.pc = _FakePC()

@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    monkeypatch.delenv("PRETHIRD_CREDIT_WARN_SEC", raising=False)

async def test_greet_reports_and_starts_guard(monkeypatch):
    sess = _FakeSession()
    channel = _FakeChannel()

    async def fake_greeted(api_base, session_id):
        assert session_id == "aabbccddeeff"
        return {"allowedSec": 600, "maxEndAt": 1790000600000}

    monkeypatch.setattr(signaling, "call_greeted", fake_greeted)

    await _start_credit_billing(sess, channel, "https://oth-path.test")

    assert sess.max_end_at_ms == 1790000600000
    assert sess.credit_guard is not None
    sess.credit_guard.cancel()

async def test_warning_is_sent_over_datachannel(monkeypatch):
    sess = _FakeSession()
    channel = _FakeChannel()

    async def fake_greeted(api_base, session_id):
        return {"allowedSec": 600, "maxEndAt": 1790000600000}

    monkeypatch.setattr(signaling, "call_greeted", fake_greeted)

    await _start_credit_billing(sess, channel, "https://oth-path.test")

    # 가드 콜백을 직접 호출해 메시지 형식을 검증한다.
    sess.credit_guard._on_warn(180)
    assert channel.sent[-1] == {"type": "credit_warning", "remaining_sec": 180}
    sess.credit_guard.cancel()

async def test_exhausted_sends_event_and_closes_pc(monkeypatch):
    sess = _FakeSession()
    channel = _FakeChannel()

    async def fake_greeted(api_base, session_id):
        return {"allowedSec": 600, "maxEndAt": 1790000600000}

    monkeypatch.setattr(signaling, "call_greeted", fake_greeted)

    await _start_credit_billing(sess, channel, "https://oth-path.test")
    await sess.credit_guard._on_exhausted()

    assert channel.sent[-1] == {"type": "credit_exhausted"}
    assert sess.pc.closed is True
    sess.credit_guard.cancel()

async def test_exhausted_closes_pc_even_if_send_fails(monkeypatch):
    """데이터채널이 이미 죽어도 강제 종료는 반드시 일어나야 한다 —
    안 그러면 잔액 0으로 무한 통화가 된다."""
    sess = _FakeSession()

    class _DeadChannel:
        readyState = "open"

        def send(self, payload):
            raise RuntimeError("channel closed")

    async def fake_greeted(api_base, session_id):
        return {"allowedSec": 600, "maxEndAt": 1790000600000}

    monkeypatch.setattr(signaling, "call_greeted", fake_greeted)

    await _start_credit_billing(sess, _DeadChannel(), "https://oth-path.test")
    await sess.credit_guard._on_exhausted()

    assert sess.pc.closed is True
    sess.credit_guard.cancel()

async def test_server_failure_does_not_start_guard(monkeypatch):
    """통보가 실패하면 가드를 걸지 않는다 — 서버측 2층 방어가 받는다."""
    sess = _FakeSession()
    channel = _FakeChannel()

    async def fake_greeted(api_base, session_id):
        return None

    monkeypatch.setattr(signaling, "call_greeted", fake_greeted)

    await _start_credit_billing(sess, channel, "https://oth-path.test")
    assert sess.credit_guard is None

async def test_zero_deadline_does_not_start_guard(monkeypatch):
    """maxEndAt 이 0이면 데드라인 미상 — 즉시 끊지 않고 서버 수거에 맡긴다."""
    sess = _FakeSession()
    channel = _FakeChannel()

    async def fake_greeted(api_base, session_id):
        return {"allowedSec": 0, "maxEndAt": 0}

    monkeypatch.setattr(signaling, "call_greeted", fake_greeted)

    await _start_credit_billing(sess, channel, "https://oth-path.test")
    assert sess.credit_guard is None

async def test_idempotent_when_called_twice(monkeypatch):
    sess = _FakeSession()
    channel = _FakeChannel()
    calls = []

    async def fake_greeted(api_base, session_id):
        calls.append(session_id)
        return {"allowedSec": 600, "maxEndAt": 1790000600000}

    monkeypatch.setattr(signaling, "call_greeted", fake_greeted)

    await _start_credit_billing(sess, channel, "https://oth-path.test")
    await _start_credit_billing(sess, channel, "https://oth-path.test")

    assert len(calls) == 1
    sess.credit_guard.cancel()

async def test_concurrent_calls_report_once(monkeypatch):
    """greet 첫 오디오 콜백이 겹쳐 들어와도 /greeted 는 한 번만 나가야 한다 —
    두 번 나가면 서버가 과금 시작점을 두 번 잡는다."""
    sess = _FakeSession()
    channel = _FakeChannel()
    calls = []

    async def fake_greeted(api_base, session_id):
        calls.append(session_id)
        await asyncio.sleep(0.05)   # 네트워크 왕복 흉내
        return {"allowedSec": 600, "maxEndAt": 1790000600000}

    monkeypatch.setattr(signaling, "call_greeted", fake_greeted)

    await asyncio.gather(
        _start_credit_billing(sess, channel, "https://oth-path.test"),
        _start_credit_billing(sess, channel, "https://oth-path.test"),
    )

    assert len(calls) == 1
    sess.credit_guard.cancel()

def test_warn_offsets_default(monkeypatch):
    monkeypatch.delenv("PRETHIRD_CREDIT_WARN_SEC", raising=False)
    assert _warn_offsets_from_env() == (180.0, 60.0)

def test_warn_offsets_from_env(monkeypatch):
    monkeypatch.setenv("PRETHIRD_CREDIT_WARN_SEC", "60,300,120")
    assert _warn_offsets_from_env() == (300.0, 120.0, 60.0)

def test_warn_offsets_garbage_falls_back(monkeypatch):
    monkeypatch.setenv("PRETHIRD_CREDIT_WARN_SEC", "abc,60")
    assert _warn_offsets_from_env() == (180.0, 60.0)
