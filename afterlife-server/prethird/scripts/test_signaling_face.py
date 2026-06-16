"""TDD: signaling._fetch_face 단위 테스트."""
import asyncio
import signaling

def test_fetch_face_downloads_and_returns_path(tmp_path, monkeypatch):
    monkeypatch.setattr(signaling, "VIDEO_REF_ROOT", str(tmp_path))
    calls = {}

    async def fake_fetch(url, dest):
        calls["args"] = (url, dest)

    out = asyncio.run(signaling._fetch_face(
        {"faceUrl": "https://r2/face.jpg"}, "9056", fake_fetch))
    assert out == f"{tmp_path}/9056/9056-face.jpg"
    assert calls["args"][0] == "https://r2/face.jpg"

def test_fetch_face_none_when_no_url():
    out = asyncio.run(signaling._fetch_face({}, "9056", None))
    assert out is None

def test_fetch_face_none_on_fetch_error(tmp_path, monkeypatch):
    monkeypatch.setattr(signaling, "VIDEO_REF_ROOT", str(tmp_path))

    async def boom(url, dest):
        raise RuntimeError("net")

    out = asyncio.run(signaling._fetch_face(
        {"faceUrl": "https://r2/face.jpg"}, "9056", boom))
    assert out is None
