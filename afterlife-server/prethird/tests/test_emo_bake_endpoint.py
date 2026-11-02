"""test_emo_bake_endpoint — AFL-1073 클론 생성 굽기·관리자 상태/다시 굽기 endpoint."""
import json
import os
import pathlib
import sys

import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import emo_bake  # noqa: E402
import emo_bake_endpoint as ep  # noqa: E402

ADMIN = {"Authorization": "Bearer learn"}
PREBUILD = {"Authorization": "Bearer pre"}

@pytest.fixture
def env(tmp_path, monkeypatch):
    monkeypatch.setenv("LEARN_SECRET", "learn")
    monkeypatch.setenv("PREBUILD_SECRET", "pre")
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(tmp_path / "no-config.json"))
    monkeypatch.delenv("PRETHIRD_EMO_VIDEO_AUTO", raising=False)
    monkeypatch.setattr(emo_bake, "_fails", {})
    monkeypatch.setattr(emo_bake, "_jobs", {})
    monkeypatch.setattr(emo_bake, "_last", {})
    monkeypatch.setattr(emo_bake, "_pending", set())
    calls = []
    monkeypatch.setattr(emo_bake, "enqueue", lambda root, c, rebake=False, on_create=False: calls.append((c, rebake, on_create)) or True)
    root = tmp_path / "video-ref"
    root.mkdir()
    return tmp_path, root, calls

def _config(tmp_path, monkeypatch, mode, clones=()):
    p = tmp_path / "cfg.json"
    p.write_text(json.dumps({"video": {"mode": mode, "clones": list(clones)}}))
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(p))

def _app(root, fetched):
    async def fake_fetch(url, dest):
        fetched.append((url, dest))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        open(dest, "wb").write(b"jpg")
        return dest

    app = web.Application()
    a, b, c = ep.make_handlers(str(root), fetch_fn=fake_fetch)
    app.router.add_post("/emo-bake", a)
    app.router.add_get("/oth-path", b)
    app.router.add_post("/oth-path", c)
    return app

@pytest.mark.asyncio
async def test_인증(env):
    _, root, _ = env
    async with TestClient(TestServer(_app(root, []))) as c:
        assert (await c.post("/emo-bake", json={"cloneId": "1", "faceUrl": "u"})).status == 401
        assert (await c.post("/emo-bake", json={"cloneId": "1", "faceUrl": "u"}, headers=ADMIN)).status == 401
        assert (await c.get("/oth-path", headers=PREBUILD)).status == 401
        assert (await c.post("/oth-path", json={"cloneId": "1"})).status == 401

@pytest.mark.asyncio
async def test_클론_생성_굽기_대상이면_얼굴_받고_대기열(env, monkeypatch):
    tmp_path, root, calls = env
    _config(tmp_path, monkeypatch, "all")
    fetched = []
    async with TestClient(TestServer(_app(root, fetched))) as c:
        r = await c.post("/emo-bake", json={"cloneId": "9400", "faceUrl": "https://oth-path"}, headers=PREBUILD)
        assert r.status == 202 and (await r.json())["accepted"]
        await ep._drain_tasks_for_test()
    assert fetched == [("https://oth-path", str(root / "9400" / "9400-face.jpg"))]
    assert calls == [("9400", False, True)]

@pytest.mark.asyncio
async def test_클론_생성_굽기_대상_아니면_안_받는다(env, monkeypatch):
    tmp_path, root, calls = env
    _config(tmp_path, monkeypatch, "some", ["9232"])
    fetched = []
    async with TestClient(TestServer(_app(root, fetched))) as c:
        r = await c.post("/emo-bake", json={"cloneId": "9400", "faceUrl": "https://oth-path"}, headers=PREBUILD)
        assert r.status == 200 and (await r.json()) == {"accepted": False, "reason": "not_target"}
        assert (await c.post("/emo-bake", json={"cloneId": "../x", "faceUrl": "u"}, headers=PREBUILD)).status == 400
        assert (await c.post("/emo-bake", json={"cloneId": "9400"}, headers=PREBUILD)).status == 400
    assert fetched == [] and calls == []

@pytest.mark.asyncio
async def test_다시_굽기(env, monkeypatch):
    tmp_path, root, calls = env
    async with TestClient(TestServer(_app(root, []))) as c:
        r = await c.post("/oth-path", json={"cloneId": "9232"}, headers=ADMIN)
        assert r.status == 202 and (await r.json())["accepted"]
        assert calls == [("9232", True, False)]
        monkeypatch.setattr(emo_bake, "enqueue", lambda *a, **k: False)
        r = await c.post("/oth-path", json={"cloneId": "9232"}, headers=ADMIN)
        assert r.status == 409 and (await r.json())["code"] == "NO_FACE"
        emo_bake._pending.add("9232")
        r = await c.post("/oth-path", json={"cloneId": "9232"}, headers=ADMIN)
        assert r.status == 409 and (await r.json())["code"] == "BUSY"
        assert (await c.post("/oth-path", json={"cloneId": "x"}, headers=ADMIN)).status == 400

@pytest.mark.asyncio
async def test_상태(env):
    _, root, _ = env
    (root / "9300").mkdir()
    (root / "9300" / "9300-face.jpg").write_bytes(b"x")
    async with TestClient(TestServer(_app(root, []))) as c:
        j = await (await c.get("/oth-path", headers=ADMIN)).json()
        assert j["clones"] == [] and j["video_setting"] is None
        j = await (await c.get("/oth-path?scope=all", headers=ADMIN)).json()
        assert [r["clone"] for r in j["clones"]] == ["9300"] and j["clones"][0]["state"] == "none"
        assert (await c.get("/oth-path?scope=x", headers=ADMIN)).status == 400

@pytest.mark.asyncio
async def test_생성_즉시_굽기가_켜지면_영상_설정_밖_클론도(env, monkeypatch):
    tmp_path, root, calls = env
    p = tmp_path / "cfg.json"
    p.write_text(json.dumps({"video": {"mode": "off", "clones": [], "bake_on_create": True}}))
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(p))
    async with TestClient(TestServer(_app(root, []))) as c:
        r = await c.post("/emo-bake", json={"cloneId": "9401", "faceUrl": "https://oth-path"}, headers=PREBUILD)
        assert r.status == 202
        await ep._drain_tasks_for_test()
        j = await (await c.get("/oth-path", headers=ADMIN)).json()
    assert calls == [("9401", False, True)]
    assert j["bake_on_create"] is True
