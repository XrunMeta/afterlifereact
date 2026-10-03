"""TTS 클라이언트 단위 테스트.

aioresponses 0.7.8 이 aiohttp 3.14 의 ClientResponse(stream_writer=...) 변경과
호환되지 않아 unittest.mock.AsyncMock + patch 로 대체.
검증 의도는 동일: body 반환 / se_path·speed 포함 여부.
"""
import pytest
import sys
import pathlib
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import tts_client  # noqa: E402


def _make_mock_resp(body: bytes, status: int = 200):
    """aiohttp ClientResponse 모의 객체 생성."""
    resp = AsyncMock()
    resp.status = status
    resp.read = AsyncMock(return_value=body)
    resp.raise_for_status = MagicMock()  # 200 이므로 raise 없음
    # async context manager 지원
    resp.__aenter__ = AsyncMock(return_value=resp)
    resp.__aexit__ = AsyncMock(return_value=False)
    return resp


def _make_mock_session(resp):
    """aiohttp ClientSession 모의 객체 생성."""
    sess = MagicMock()
    sess.post = MagicMock(return_value=resp)
    sess.__aenter__ = AsyncMock(return_value=sess)
    sess.__aexit__ = AsyncMock(return_value=False)
    return sess


@pytest.mark.asyncio
async def test_say_returns_wav_bytes():
    fake_wav = b"RIFF....WAVEfake"
    resp = _make_mock_resp(fake_wav)
    sess = _make_mock_session(resp)

    with patch("aiohttp.ClientSession", return_value=sess):
        out = await tts_client.say("안녕")

    assert out == fake_wav


@pytest.mark.asyncio
async def test_say_includes_se_path_when_set():
    captured = {}

    resp = _make_mock_resp(b"WAV")
    sess = MagicMock()

    def fake_post(url, **kwargs):
        captured.update(kwargs.get("json") or {})
        return resp

    sess.post = fake_post
    sess.__aenter__ = AsyncMock(return_value=sess)
    sess.__aexit__ = AsyncMock(return_value=False)

    with patch("aiohttp.ClientSession", return_value=sess):
        await tts_client.say("안녕", se_path="reference_voices/halbae/se.pth")

    assert captured.get("se_path") == "reference_voices/halbae/se.pth"
    assert captured.get("speed") == 1.0


def _capture_session_timeout():
    """ClientSession(...) 에 넘어간 timeout 을 잡아 둔다."""
    captured = {}
    resp = _make_mock_resp(b"WAV")
    sess = _make_mock_session(resp)

    def fake_session(*args, **kwargs):
        captured["timeout"] = kwargs.get("timeout")
        return sess

    return captured, fake_session


@pytest.mark.asyncio
async def test_say_timeout_defaults_to_60s(monkeypatch):
    # 2026-10-03 실통화: qwen3tts 가 한 문장을 끝내지 못하자 aiohttp 기본값(300s)
    # 만큼 대답이 멈췄다. 한 문장 합성은 60초를 넘기지 않는다.
    monkeypatch.delenv("PRETHIRD_TTS_TIMEOUT_S", raising=False)
    captured, fake_session = _capture_session_timeout()
    with patch("aiohttp.ClientSession", side_effect=fake_session):
        await tts_client.say("안녕")
    assert captured["timeout"].total == 60.0


@pytest.mark.asyncio
async def test_say_timeout_env_override(monkeypatch):
    monkeypatch.setenv("PRETHIRD_TTS_TIMEOUT_S", "15")
    captured, fake_session = _capture_session_timeout()
    with patch("aiohttp.ClientSession", side_effect=fake_session):
        await tts_client.say("안녕")
    assert captured["timeout"].total == 15.0


@pytest.mark.asyncio
async def test_say_timeout_bad_env_falls_back(monkeypatch):
    monkeypatch.setenv("PRETHIRD_TTS_TIMEOUT_S", "abc")
    captured, fake_session = _capture_session_timeout()
    with patch("aiohttp.ClientSession", side_effect=fake_session):
        await tts_client.say("안녕")
    assert captured["timeout"].total == 60.0
