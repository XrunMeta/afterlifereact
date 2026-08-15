"""업로드 소스 엔드포인트 — /sources · /source/upload · /source/delete."""
import pathlib
import types

import pytest
from aiohttp import FormData
from aiohttp.test_utils import TestClient, TestServer

import app as labapp
import source_lab
from artifact_store import ArtifactStore
from registry import KnobsRegistry


@pytest.fixture(autouse=True)
def _root(tmp_path, monkeypatch):
    monkeypatch.setenv("LAB_SOURCE_ROOT", str(tmp_path / "lab-sources"))
    # ffmpeg 를 실제로 부르지 않는다 — dest 만 만들어 주는 대역.
    def _ok(cmd, **kw):
        pathlib.Path(cmd[-1]).write_bytes(b"idle")
        return types.SimpleNamespace(returncode=0, stderr="")
    monkeypatch.setattr(source_lab.subprocess, "run", _ok)
    return tmp_path / "lab-sources"


def _form(name: str, data: bytes) -> FormData:
    """multipart 한 건. 필드 이름은 반드시 'file' — app.py 가 그 이름만 읽는다."""
    f = FormData()
    f.add_field("file", data, filename=name, content_type="application/octet-stream")
    return f


async def _client(tmp_path, registry=None):
    r = registry or KnobsRegistry()
    application = labapp.build_app(r, factory=None, store=ArtifactStore(str(tmp_path)))
    c = TestClient(TestServer(application))
    await c.start_server()
    return c, r


@pytest.mark.asyncio
async def test_sources_empty(tmp_path):
    c, _ = await _client(tmp_path)
    try:
        body = await (await c.get("/sources")).json()
        assert body["sources"] == []
        assert body["idle_spec"]["fps"] == source_lab.IDLE_FPS
        assert "lab-sources" in body["root"]
    finally:
        await c.close()


@pytest.mark.asyncio
async def test_upload_then_list_then_delete(tmp_path):
    c, r = await _client(tmp_path)
    try:
        resp = await c.post("/source/upload", data=_form("clip.mp4", b"\x00\x01\x02"))
        assert resp.status == 200
        meta = await resp.json()
        assert meta["kind"] == "video" and meta["idle"]

        listed = (await (await c.get("/sources")).json())["sources"]
        assert [s["id"] for s in listed] == [meta["id"]]

        # 노브가 이 소스를 가리키는 상태에서 지우면 노브도 함께 비워져야 한다
        # (유령 id 가 남으면 UI 가 "적용됨" 으로 보인다).
        r.update({"source": {"render_source": meta["id"]}})
        d = await (await c.post("/source/delete", json={"id": meta["id"]})).json()
        assert d["deleted"] is True
        assert r.get().source.render_source == ""
        assert (await (await c.get("/sources")).json())["sources"] == []
    finally:
        await c.close()


@pytest.mark.asyncio
async def test_upload_rejects_bad_extension(tmp_path, _root):
    c, _ = await _client(tmp_path)
    try:
        resp = await c.post("/source/upload", data=_form("x.txt", b"hi"))
        assert resp.status == 400
        assert "확장자" in (await resp.json())["error"]
        assert not _root.exists()      # 거부된 업로드는 디스크에 아무것도 남기지 않는다
    finally:
        await c.close()


@pytest.mark.asyncio
async def test_upload_rejects_oversize(tmp_path, monkeypatch):
    monkeypatch.setattr(source_lab, "MAX_BYTES", 8)
    c, _ = await _client(tmp_path)
    try:
        resp = await c.post("/source/upload", data=_form("a.mp4", b"0" * 64))
        assert resp.status == 413
    finally:
        await c.close()


@pytest.mark.asyncio
async def test_upload_requires_token_when_set(tmp_path, monkeypatch):
    monkeypatch.setenv("LAB_TUNER_TOKEN", "secret")
    c, _ = await _client(tmp_path)
    try:
        assert (await c.post("/source/upload", data=_form("a.mp4", b"x"))).status == 401
        assert (await c.get("/sources")).status == 401
        ok = await c.post("/source/upload", data=_form("a.mp4", b"x"),
                          headers={"X-Lab-Tuner-Token": "secret"})
        assert ok.status == 200
    finally:
        await c.close()
