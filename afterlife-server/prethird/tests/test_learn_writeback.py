import sys, pathlib, base64, json
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import learn_writeback as lw  # noqa: E402

def _jwt(sub):
    # 서명 없는 가짜 JWT(payload만 검증). header.payload.sig
    payload = base64.urlsafe_b64encode(json.dumps({"sub": sub}).encode()).decode().rstrip("=")
    return f"h.{payload}.s"

def test_user_id_from_token():
    assert lw.user_id_from_token(_jwt(8201)) == 8201
    assert lw.user_id_from_token(_jwt("8202")) == 8202  # 문자열 sub도 int 변환
    assert lw.user_id_from_token("garbage") is None
    assert lw.user_id_from_token(None) is None
    assert lw.user_id_from_token(_jwt(0)) is None        # 비양수 거부

async def test_writeback_skips_when_disabled(monkeypatch):
    monkeypatch.delenv("PRETHIRD_LEARN_ENABLED", raising=False)
    called = {"extract": 0}
    async def _fake_extract(*a, **k):
        called["extract"] += 1
        return {"relation": "x"}
    monkeypatch.setattr(lw, "extract_l2", _fake_extract)
    await lw.learn_writeback(9201, 8201, "sid", "안녕", "응답")
    assert called["extract"] == 0  # 비활성이면 추출조차 안 함

async def test_writeback_skips_when_no_user(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")
    called = {"extract": 0}
    async def _fake_extract(*a, **k):
        called["extract"] += 1
        return {"relation": "x"}
    monkeypatch.setattr(lw, "extract_l2", _fake_extract)
    await lw.learn_writeback(9201, None, "sid", "안녕", "응답")  # user_id None
    assert called["extract"] == 0

async def test_writeback_skips_empty_extract(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")
    posted = {"n": 0}
    async def _fake_extract(*a, **k):
        return {}
    async def _fake_post(*a, **k):
        posted["n"] += 1
    monkeypatch.setattr(lw, "extract_l2", _fake_extract)
    monkeypatch.setattr(lw, "_post_learn", _fake_post)
    await lw.learn_writeback(9201, 8201, "sid", "안녕", "응답")
    assert posted["n"] == 0  # 추출 비면 POST 안 함

async def test_writeback_swallows_exceptions(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")
    async def _boom(*a, **k):
        raise RuntimeError("network")
    monkeypatch.setattr(lw, "extract_l2", _boom)
    # 예외를 흡수해야 함(통화 무영향) — raise 되면 테스트 실패
    await lw.learn_writeback(9201, 8201, "sid", "안녕", "응답")
