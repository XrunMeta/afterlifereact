import pytest, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from unittest.mock import AsyncMock, MagicMock, patch
import bundle_client

@pytest.mark.asyncio
async def test_fetch_bundle_ok():
    resp = MagicMock()
    resp.status = 200
    async def _json(): return {"personaBundle": {"x": 1}, "assets": {"voiceSeKey": "9043"}}
    resp.json = _json
    resp.__aenter__ = AsyncMock(return_value=resp)
    resp.__aexit__ = AsyncMock(return_value=False)

    sess = MagicMock()
    sess.get = MagicMock(return_value=resp)
    sess.__aenter__ = AsyncMock(return_value=sess)
    sess.__aexit__ = AsyncMock(return_value=False)

    with patch("aiohttp.ClientSession", return_value=sess):
        out = await bundle_client.fetch_bundle("http://oth-path", 9043, "tok")
    assert out["assets"]["voiceSeKey"] == "9043"
    # 경로 prefix는 /oth-path (RN /oth-path 과 동일 mount) — 누락 시 404 회귀
    called_url = sess.get.call_args[0][0]
    assert called_url == "http://oth-path"

@pytest.mark.asyncio
async def test_fetch_bundle_graceful_on_error():
    sess = MagicMock()
    sess.__aenter__ = AsyncMock(return_value=sess)
    sess.__aexit__ = AsyncMock(return_value=False)
    sess.get.side_effect = Exception("net")

    with patch("aiohttp.ClientSession", return_value=sess):
        out = await bundle_client.fetch_bundle("http://oth-path", 9043, "tok")
    assert out is None

@pytest.mark.asyncio
async def test_fetch_bundle_none_token():
    assert await bundle_client.fetch_bundle("http://oth-path", 9043, None) is None

@pytest.mark.asyncio
async def test_fetch_bundle_malformed_json():
    """status 200 + json() 예외 → None(graceful)."""
    resp = MagicMock()
    resp.status = 200
    async def _bad_json(): raise ValueError("malformed")
    resp.json = _bad_json
    resp.__aenter__ = AsyncMock(return_value=resp)
    resp.__aexit__ = AsyncMock(return_value=False)

    sess = MagicMock()
    sess.get = MagicMock(return_value=resp)
    sess.__aenter__ = AsyncMock(return_value=sess)
    sess.__aexit__ = AsyncMock(return_value=False)

    with patch("aiohttp.ClientSession", return_value=sess):
        out = await bundle_client.fetch_bundle("http://oth-path", 9043, "tok")
    assert out is None

@pytest.mark.asyncio
async def test_fetch_bundle_non200_returns_none():
    resp = MagicMock()
    resp.status = 401
    async def _json(): return {}
    resp.json = _json
    resp.__aenter__ = AsyncMock(return_value=resp)
    resp.__aexit__ = AsyncMock(return_value=False)

    sess = MagicMock()
    sess.get = MagicMock(return_value=resp)
    sess.__aenter__ = AsyncMock(return_value=sess)
    sess.__aexit__ = AsyncMock(return_value=False)

    with patch("aiohttp.ClientSession", return_value=sess):
        assert await bundle_client.fetch_bundle("http://oth-path", 9043, "tok") is None
