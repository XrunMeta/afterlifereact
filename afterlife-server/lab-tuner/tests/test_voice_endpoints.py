"""업로드 음성 엔드포인트 — /voices · /voice/upload · /voice/delete."""
import pathlib
import types

import pytest
from aiohttp import FormData
from aiohttp.test_utils import TestClient, TestServer

import app as labapp
import voice_lab
from artifact_store import ArtifactStore
from registry import KnobsRegistry

@pytest.fixture(autouse=True)
def _root(tmp_path, monkeypatch):
    monkeypatch.setenv("LAB_VOICE_ROOT", str(tmp_path / "reference_voices"))

    # ffmpeg 를 실제로 부르지 않는다 — dest 만 만들어 주는 대역.
    def _ok(cmd, **kw):
        pathlib.Path(cmd[-1]).write_bytes(b"RIFFfake")
        return types.SimpleNamespace(returncode=0, stderr="", stdout="")

    monkeypatch.setattr(voice_lab.subprocess, "run", _ok)
    # 전사·프롬프트쌍은 외부 서비스라 대역으로 막는다(엔드포인트 계약만 본다).
    monkeypatch.setattr(voice_lab, "stt_transcribe", lambda vid, wav: "전사 문장")
    monkeypatch.setattr(voice_lab, "make_prompt_pair", lambda vid, **kw: True)
    return tmp_path / "reference_voices"

def _form(name: str, data: bytes, ref_text: str | None = None) -> FormData:
    f = FormData()
    f.add_field("file", data, filename=name, content_type="application/octet-stream")
    if ref_text is not None:
        f.add_field("ref_text", ref_text)
    return f

async def _client(tmp_path, registry=None):
    r = registry or KnobsRegistry()
    application = labapp.build_app(r, factory=None, store=ArtifactStore(str(tmp_path)))
    c = TestClient(TestServer(application))
    await c.start_server()
    return c, r

@pytest.mark.asyncio
async def test_voices_empty(tmp_path):
    c, _ = await _client(tmp_path)
    try:
        body = await (await c.get("/voices")).json()
        assert body["voices"] == []
        assert body["max_mb"] == voice_lab.MAX_BYTES 
        assert "reference_voices" in body["root"]
    finally:
        await c.close()

@pytest.mark.asyncio
async def test_upload_then_list_then_delete(tmp_path):
    c, r = await _client(tmp_path)
    try:
        resp = await c.post("/voice/upload", data=_form("voice.mp3", b"\x00\x01\x02"))
        assert resp.status == 200
        meta = await resp.json()
        assert meta["id"].startswith(voice_lab.ID_PREFIX)
        assert meta["ref_text"] == "전사 문장" and meta["prompt_pair"] is True

        body = await (await c.get("/voices")).json()
        assert [v["id"] for v in body["voices"]] == [meta["id"]]

        r.update({"source": {"voice_source": meta["id"]}})
        d = await (await c.post("/voice/delete", json={"id": meta["id"]})).json()
        assert d["deleted"] is True
        # 지운 업로드를 노브가 계속 가리키면 UI 가 유령 id 를 보여준다.
        assert r.get().source.voice_source == ""
    finally:
        await c.close()

@pytest.mark.asyncio
async def test_upload_accepts_manual_ref_text(tmp_path, monkeypatch):
    """참조 문장을 직접 넣으면 STT 를 부르지 않는다."""
    called = []
    monkeypatch.setattr(voice_lab, "stt_transcribe",
                        lambda vid, wav: called.append(1) or "STT")
    c, _ = await _client(tmp_path)
    try:
        resp = await c.post("/voice/upload",
                            data=_form("v.wav", b"\x00", ref_text="직접 넣은 문장"))
        meta = await resp.json()
        assert meta["ref_text"] == "직접 넣은 문장"
        assert called == []
    finally:
        await c.close()

@pytest.mark.asyncio
async def test_upload_rejects_non_audio(tmp_path):
    c, _ = await _client(tmp_path)
    try:
        resp = await c.post("/voice/upload", data=_form("clip.mp4", b"\x00"))
        assert resp.status == 400
        assert "확장자" in (await resp.json())["error"]
    finally:
        await c.close()

@pytest.mark.asyncio
async def test_upload_rejects_oversize(tmp_path, monkeypatch):
    monkeypatch.setattr(voice_lab, "MAX_BYTES", 4)
    c, _ = await _client(tmp_path)
    try:
        resp = await c.post("/voice/upload", data=_form("v.wav", b"0123456789"))
        assert resp.status == 413
    finally:
        await c.close()

@pytest.mark.asyncio
async def test_delete_refuses_real_clone(tmp_path, _root):
    """🔴 엔드포인트로도 실 클론 음성 자산은 지워지지 않는다."""
    (_root / "9104").mkdir(parents=True)
    (_root / "9104" / "voice.wav").write_bytes(b"REAL")
    c, _ = await _client(tmp_path)
    try:
        resp = await c.post("/voice/delete", json={"id": "9104"})
        assert resp.status == 400
        assert (_root / "9104" / "voice.wav").is_file()
    finally:
        await c.close()

@pytest.mark.asyncio
async def test_upload_requires_token_when_configured(tmp_path, monkeypatch):
    """소스 업로드와 같은 인증을 탄다(외부 노출 경로라 토큰이 있어야 한다)."""
    monkeypatch.setenv("LAB_TUNER_TOKEN", "s3cret")
    c, _ = await _client(tmp_path)
    try:
        assert (await c.post("/voice/upload", data=_form("v.wav", b"\x00"))).status == 401
        assert (await c.get("/voices")).status == 401
        ok = await c.post("/voice/upload", data=_form("v.wav", b"\x00"),
                          headers={"X-Lab-Tuner-Token": "s3cret"})
        assert ok.status == 200
    finally:
        await c.close()
