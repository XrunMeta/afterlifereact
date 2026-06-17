import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import call_lifecycle as cl  # noqa: E402

async def test_call_start_skips_when_disabled(monkeypatch):
    monkeypatch.delenv("PRETHIRD_LEARN_ENABLED", raising=False)
    posted = {"n": 0}
    async def _fake_post(*a, **k):
        posted["n"] += 1
    monkeypatch.setattr(cl, "_post", _fake_post)
    await cl.call_start("http://x", 9201, "abcdef012345", "tok")
    assert posted["n"] == 0

async def test_call_start_skips_when_missing_args(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    posted = {"n": 0}
    async def _fake_post(*a, **k):
        posted["n"] += 1
    monkeypatch.setattr(cl, "_post", _fake_post)
    await cl.call_start("http://x", None, "abcdef012345", "tok")  # clone None
    await cl.call_start("http://x", 9201, "abcdef012345", None)   # token None
    assert posted["n"] == 0

async def test_call_start_posts_with_jwt(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    seen = {}
    async def _fake_post(url, headers, body):
        seen["url"] = url; seen["headers"] = headers; seen["body"] = body
    monkeypatch.setattr(cl, "_post", _fake_post)
    await cl.call_start("http://x", 9201, "abcdef012345", "jwttoken")
    assert seen["url"] == "http://x/oth-path"
    assert seen["headers"]["Authorization"] == "Bearer jwttoken"
    assert b'"sessionId"' in seen["body"] and b"abcdef012345" in seen["body"]

async def test_call_end_posts_with_secret(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "sek")
    seen = {}
    async def _fake_post(url, headers, body):
        seen["url"] = url; seen["headers"] = headers
    monkeypatch.setattr(cl, "_post", _fake_post)
    await cl.call_end("http://x", 9201, "abcdef012345")
    assert seen["url"] == "http://x/oth-path"
    assert seen["headers"]["Authorization"] == "Bearer sek"

async def test_call_end_skips_without_secret(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    monkeypatch.delenv("LEARN_SECRET", raising=False)
    posted = {"n": 0}
    async def _fake_post(*a, **k):
        posted["n"] += 1
    monkeypatch.setattr(cl, "_post", _fake_post)
    await cl.call_end("http://x", 9201, "abcdef012345")
    assert posted["n"] == 0

async def test_call_start_swallows_exceptions(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    async def _boom(*a, **k):
        raise RuntimeError("network down")
    monkeypatch.setattr(cl, "_post", _boom)
    # 예외가 전파되면 통화가 깨짐 — 반드시 흡수.
    await cl.call_start("http://x", 9201, "abcdef012345", "tok")

async def test_call_end_swallows_exceptions(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "sek")
    async def _boom(*a, **k):
        raise RuntimeError("network down")
    monkeypatch.setattr(cl, "_post", _boom)
    # except 블록(clone_id 참조 포함)이 NameError 없이 예외를 흡수해야 함.
    await cl.call_end("http://x", 9201, "abcdef012345")

async def test_call_end_skips_invalid_session_id(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "sek")
    posted = {"n": 0}
    async def _fake_post(*a, **k):
        posted["n"] += 1
    monkeypatch.setattr(cl, "_post", _fake_post)
    await cl.call_end("http://x", 9201, "../admin")  # path injection 시도 → skip
    assert posted["n"] == 0
