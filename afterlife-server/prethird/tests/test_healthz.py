import pytest
from aiohttp.test_utils import TestClient, TestServer
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from signaling import make_app  # noqa: E402

@pytest.mark.asyncio
async def test_healthz_ok():
    app = make_app()
    async with TestClient(TestServer(app)) as client:
        resp = await client.get("/healthz")
        assert resp.status == 200
        body = await resp.json()
        assert body["ok"] is True
        assert body["service"] == "prethird"
        assert body["sessions"] == 0
