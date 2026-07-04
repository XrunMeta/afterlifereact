import pytest
from aiohttp.test_utils import TestClient, TestServer
import app as labapp
from registry import KnobsRegistry
from artifact_store import ArtifactStore


@pytest.mark.asyncio
async def test_knobs_get_post(tmp_path):
    r = KnobsRegistry()
    store = ArtifactStore(str(tmp_path))
    application = labapp.build_app(r, factory=None, store=store)
    client = TestClient(TestServer(application))
    await client.start_server()
    try:
        resp = await client.get("/knobs")
        assert resp.status == 200
        data = await resp.json()
        assert data["tts"]["speed"] == 1.0

        resp = await client.post("/knobs", json={"tts": {"speed": 1.7}})
        assert resp.status == 200
        merged = await resp.json()
        assert merged["tts"]["speed"] == 1.7
        assert r.get().tts.speed == 1.7
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_healthz_present(tmp_path):
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    application = labapp.build_app(r, factory=None, store=store)
    client = TestClient(TestServer(application))
    await client.start_server()
    try:
        resp = await client.get("/healthz")   # make_app 제공
        assert resp.status == 200
    finally:
        await client.close()
