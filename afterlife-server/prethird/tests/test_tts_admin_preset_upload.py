"""POST /oth-path — 음색 프리셋 voice.wav 업로드 (T-voice-sync Task 1)."""
import os
import pathlib
import shutil
import sys

import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from tts_admin_endpoint import register_tts_admin_routes  # noqa: E402

ADMIN = {"X-Admin-Secret": "test-secret"}

# 최소 유효 WAV (16-bit mono 16kHz, 0 샘플 — 헤더만)
MIN_WAV = (
    b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00"
    b"\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00"
    b"\x02\x00\x10\x00data\x00\x00\x00\x00"
)


@pytest.fixture
async def client(monkeypatch, tmp_path):
    monkeypatch.setenv("LEARN_SECRET", "test-secret")
    monkeypatch.setenv("PRETHIRD_REF_VOICES_ROOT", str(tmp_path))
    app = web.Application()
    register_tts_admin_routes(app)
    async with TestClient(TestServer(app)) as c:
        yield c, tmp_path


async def test_unauthorized_without_secret(client):
    c, _ = client
    r = await c.post(
        "/oth-path",
        data={"se_key": "preset-abc", "file": MIN_WAV},
    )
    assert r.status == 401


async def test_unauthorized_with_wrong_secret(client):
    c, _ = client
    r = await c.post(
        "/oth-path",
        headers={"X-Admin-Secret": "nope"},
        data={"se_key": "preset-abc", "file": MIN_WAV},
    )
    assert r.status == 401


async def test_missing_se_key_returns_400(client):
    c, _ = client
    r = await c.post(
        "/oth-path",
        headers=ADMIN,
        data={"file": MIN_WAV},
    )
    assert r.status == 400


async def test_missing_file_returns_400(client):
    c, _ = client
    r = await c.post(
        "/oth-path",
        headers=ADMIN,
        data={"se_key": "preset-abc"},
    )
    assert r.status == 400


async def test_se_key_traversal_rejected(client):
    c, _ = client
    r = await c.post(
        "/oth-path",
        headers=ADMIN,
        data={"se_key": "../etc/passwd", "file": MIN_WAV},
    )
    assert r.status == 400


async def test_se_key_empty_rejected(client):
    c, _ = client
    r = await c.post(
        "/oth-path",
        headers=ADMIN,
        data={"se_key": "", "file": MIN_WAV},
    )
    assert r.status == 400


async def test_file_too_large_rejected(client):
    c, _ = client
    big = b"\x00" * (9 * 1024 * 1024)
    r = await c.post(
        "/oth-path",
        headers=ADMIN,
        data={"se_key": "preset-big", "file": big},
    )
    assert r.status == 400


@pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg not available")
async def test_wav_upload_success(client):
    c, root = client
    r = await c.post(
        "/oth-path",
        headers=ADMIN,
        data={"se_key": "preset-test1", "file": MIN_WAV},
    )
    assert r.status == 200, await r.text()
    body = await r.json()
    assert body["ok"] is True
    assert body["bytes"] > 0
    target = root / "preset-test1" / "voice.wav"
    assert target.is_file()
    assert target.stat().st_size > 0


async def test_wav_upload_success_mocked_ffmpeg(client, monkeypatch):
    """ffmpeg 없는 환경에서도 핸들러 플로우(검증·경로·원자 저장) 자체는 검증."""
    import subprocess
    c, root = client
    # ffmpeg 호출을 가짜로 — 입력을 그대로 출력 경로에 복사하는 더미.
    original_run = subprocess.run
    def fake_run(cmd, *args, **kwargs):
        # cmd: ["ffmpeg", "-y", "-i", in_path, "-ar", "16000", "-ac", "1", out_path]
        if cmd[:1] == ["ffmpeg"]:
            in_idx = cmd.index("-i") + 1
            out_path = cmd[-1]
            # 입력을 출력으로 복사 (변환은 생략, 파일 존재만 보장)
            with open(cmd[in_idx], "rb") as src, open(out_path, "wb") as dst:
                dst.write(src.read())
            class R: returncode = 0; stderr = b""; stdout = b""
            return R()
        return original_run(cmd, *args, **kwargs)
    monkeypatch.setattr(subprocess, "run", fake_run)
    r = await c.post(
        "/oth-path",
        headers=ADMIN,
        data={"se_key": "preset-test-mocked", "file": MIN_WAV},
    )
    assert r.status == 200, await r.text()
    target = root / "preset-test-mocked" / "voice.wav"
    assert target.is_file()


async def test_ffmpeg_failure_returns_500(client, monkeypatch):
    import subprocess
    c, _ = client
    def fake_run(cmd, *args, **kwargs):
        if cmd[:1] == ["ffmpeg"]:
            class R: returncode = 1; stderr = b"Invalid data"; stdout = b""
            return R()
        return subprocess.run(cmd, *args, **kwargs)
    monkeypatch.setattr(subprocess, "run", fake_run)
    r = await c.post(
        "/oth-path",
        headers=ADMIN,
        data={"se_key": "preset-bad", "file": MIN_WAV},
    )
    assert r.status == 500
    body = await r.json()
    assert "ffmpeg" in body.get("error", "").lower()
