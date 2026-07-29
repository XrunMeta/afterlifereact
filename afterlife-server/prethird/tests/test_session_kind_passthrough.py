"""tests/test_session_kind_passthrough.py — T-167 세션 종류 전달.

⚠️ prethird 는 판정하지 않는다. 전달만 한다.
자격 확인(내부 계정 여부·트레이닝 쿼터 잔여)은 전적으로 서버(A Task 21.5)의 몫이다.
prethird 가 판정하면 클라이언트 자칭이 그대로 통과해 무료 통화 구멍이 된다.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import json  # noqa: E402
import pytest  # noqa: E402
import call_lifecycle as cl  # noqa: E402

@pytest.fixture
def captured(monkeypatch):
    seen = {}

    async def _fake_post(url, headers, body):
        seen["url"] = url
        seen["body"] = body
        seen["payload"] = json.loads(body.decode("utf-8"))

    monkeypatch.setattr(cl, "_post", _fake_post)
    return seen

async def test_session_kind_is_forwarded(captured):
    await cl.call_start("http://x", 9201, "abcdef012345", "tok", session_kind="training")
    assert captured["payload"]["sessionKind"] == "training"
    assert captured["payload"]["sessionId"] == "abcdef012345"

async def test_absent_kind_is_omitted(captured):
    """미지정이면 필드를 보내지 않는다 — 서버 기본값(call)이 적용된다."""
    await cl.call_start("http://x", 9201, "abcdef012345", "tok")
    assert "sessionKind" not in captured["payload"]

async def test_empty_kind_is_omitted(captured):
    """빈 문자열도 미지정과 같게 다룬다 — 서버에 무의미한 값을 흘리지 않는다."""
    await cl.call_start("http://x", 9201, "abcdef012345", "tok", session_kind="")
    assert "sessionKind" not in captured["payload"]

async def test_unknown_kind_is_still_forwarded(captured):
    """prethird 는 검증하지 않는다 — 알 수 없는 값도 그대로 넘기고 서버가 강등 판정한다."""
    await cl.call_start("http://x", 9201, "abcdef012345", "tok", session_kind="free_forever")
    assert captured["payload"]["sessionKind"] == "free_forever"

async def test_kind_does_not_change_url_or_auth(captured):
    """종류는 payload 에만 실린다 — 경로·인증 방식은 그대로다."""
    await cl.call_start("http://x", 9201, "abcdef012345", "tok", session_kind="internal")
    assert captured["url"] == "http://x/oth-path"

async def test_backward_compatible_positional_call(captured):
    """기존 호출부(4인자)가 그대로 동작해야 한다 — 회귀 방지."""
    await cl.call_start("http://x", 9201, "abcdef012345", "tok")
    assert captured["payload"] == {"sessionId": "abcdef012345"}
