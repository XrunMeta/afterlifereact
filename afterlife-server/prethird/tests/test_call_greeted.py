"""tests/test_call_greeted.py — T-167 과금 시작점 통보.

과금은 prethird 가 신뢰 경계다. 클론 인사(greet)의 첫 오디오 송출 시점에
서버에 통보해 과금 시작을 확정하고 데드라인(maxEndAt)을 받아온다.
학습 토글(PRETHIRD_LEARN_ENABLED)과 무관해야 한다 — 토글이 꺼져도 과금은 돌아야 한다.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import pytest  # noqa: E402
import call_lifecycle as cl  # noqa: E402

@pytest.fixture(autouse=True)
def _env(monkeypatch):
    monkeypatch.setenv("LEARN_SECRET", "s3cret")
    monkeypatch.delenv("PRETHIRD_LEARN_ENABLED", raising=False)

async def test_returns_deadline_from_server(monkeypatch):
    captured = {}

    async def fake_post(url, headers, body):
        captured["url"] = url
        captured["headers"] = headers
        return {"ok": True, "allowedSec": 600, "maxEndAt": 1790000600000}

    monkeypatch.setattr(cl, "_post_json", fake_post)

    result = await cl.call_greeted("https://oth-path.test", "aabbccddeeff")

    assert result == {"allowedSec": 600, "maxEndAt": 1790000600000}
    assert captured["url"] == "https://oth-path.test/oth-path"
    assert captured["headers"]["Authorization"] == "Bearer s3cret"

async def test_learn_flag_does_not_gate_billing(monkeypatch):
    """학습 토글이 꺼져 있어도 과금 시작 통보는 나가야 한다."""
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "0")

    async def fake_post(url, headers, body):
        return {"ok": True, "allowedSec": 300, "maxEndAt": 1790000300000}

    monkeypatch.setattr(cl, "_post_json", fake_post)

    result = await cl.call_greeted("https://oth-path.test", "aabbccddeeff")
    assert result is not None
    assert result["allowedSec"] == 300

async def test_rejects_malformed_session_id(monkeypatch):
    async def fake_post(url, headers, body):
        raise AssertionError("should not be called")

    monkeypatch.setattr(cl, "_post_json", fake_post)

    assert await cl.call_greeted("https://oth-path.test", "../etc/passwd") is None
    assert await cl.call_greeted("https://oth-path.test", "TOOLONGSESSION") is None

async def test_network_failure_returns_none(monkeypatch):
    async def fake_post(url, headers, body):
        raise RuntimeError("boom")

    monkeypatch.setattr(cl, "_post_json", fake_post)

    assert await cl.call_greeted("https://oth-path.test", "aabbccddeeff") is None

async def test_missing_secret_returns_none(monkeypatch):
    monkeypatch.delenv("LEARN_SECRET", raising=False)

    async def fake_post(url, headers, body):
        raise AssertionError("should not be called")

    monkeypatch.setattr(cl, "_post_json", fake_post)

    assert await cl.call_greeted("https://oth-path.test", "aabbccddeeff") is None

async def test_missing_api_base_returns_none(monkeypatch):
    async def fake_post(url, headers, body):
        raise AssertionError("should not be called")

    monkeypatch.setattr(cl, "_post_json", fake_post)

    assert await cl.call_greeted(None, "aabbccddeeff") is None
    assert await cl.call_greeted("https://oth-path.test", None) is None

async def test_partial_response_coerces_to_zero(monkeypatch):
    """서버가 필드를 빠뜨리면 0 — fail-closed. 무제한으로 해석하지 않는다."""
    async def fake_post(url, headers, body):
        return {"ok": True}

    monkeypatch.setattr(cl, "_post_json", fake_post)

    assert await cl.call_greeted("https://oth-path.test", "aabbccddeeff") == {
        "allowedSec": 0, "maxEndAt": 0,
    }
