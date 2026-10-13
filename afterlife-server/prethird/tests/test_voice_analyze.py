import io
import os
import pathlib
import sys
import urllib.error

import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

import voice_analyze as va
from voice_analyze import voice_analyze_handler


# --- _pick_end_reason (순수 쉼 판정) ---
def test_pick_end_too_short():
    # 발화 시작 2초, 총 10초 → 실질 8초 < 15 → too_short
    assert va._pick_end_reason(2.0, 10.0, [], [])[1] == "too_short"

def test_pick_end_ok_finds_pause_after_cut():
    # 발화 0초부터, 총 25초, 12초 지점에 쉼(끝 12.5) → lo=8,hi=30 범위 첫 쉼에서 ok
    end, reason = va._pick_end_reason(0.0, 25.0, [3.0, 12.0], [3.4, 12.5])
    assert reason == "ok"
    assert abs(end - 12.35) < 0.01  # 12.0 + min(0.35, 0.5)

def test_pick_end_no_pause_when_only_early_silence():
    # 20초 녹음인데 쉼이 lo(8초) 이전(3초)에만 → no_pause
    assert va._pick_end_reason(0.0, 20.0, [3.0], [3.4])[1] == "no_pause"


# --- classify (전체 판정, 순서) ---
def test_classify_too_short_by_duration():
    assert va.classify(10.0, 0.0, [], [], "가나다라마바사") == {"ok": False, "reason": "TOO_SHORT"}

def test_classify_no_voice_when_stt_none():
    # 길이 충분하지만 STT 가 전사 실패(None) → NO_VOICE (쉼 판정보다 우선)
    assert va.classify(20.0, 0.0, [], [], None) == {"ok": False, "reason": "NO_VOICE"}

def test_classify_no_voice_when_density_low():
    # 20초에 글자 10자 → 10/min(20,10)=1.0 < 3.5 → NO_VOICE
    assert va.classify(20.0, 0.0, [10.0], [10.4], "열글자짜리텍스트야") == {"ok": False, "reason": "NO_VOICE"}

def test_classify_no_pause_when_voice_ok_but_no_pause():
    # 20초, 충분한 글자(80자/10=8.0 ok), 쉼은 앞 3초뿐 → NO_PAUSE
    text = "가" * 80
    assert va.classify(20.0, 0.0, [3.0], [3.4], text) == {"ok": False, "reason": "NO_PAUSE"}

def test_classify_ok():
    text = "가" * 80
    assert va.classify(25.0, 0.0, [12.0], [12.5], text) == {"ok": True}

def test_classify_density_uses_10s_cap():
    # dur=25 이지만 40자 → 40/min(25,10)=4.0 >= 3.5 → 길이캡 10 으로 나눠야 통과(쉼 ok)
    text = "가" * 40
    assert va.classify(25.0, 0.0, [12.0], [12.5], text) == {"ok": True}


def test_classify_too_short_when_late_speech_start():
    # duration 16(>=15) 통과, 텍스트 충분(NO_VOICE 아님), 그러나 발화 시작 3초 → 실질 13초 < 15 → TOO_SHORT
    assert va.classify(16.0, 3.0, [], [], "가" * 80) == {"ok": False, "reason": "TOO_SHORT"}


def test_pick_end_no_pause_when_silence_beyond_max():
    # 40초, 쉼이 35초(= lo8..hi30 범위 밖) → no_pause
    assert va._pick_end_reason(0.0, 40.0, [35.0], [35.4])[1] == "no_pause"


def test_constants_match_make_prompt_ref_spec():
    # make_prompt_ref 와 어긋나면 라이브 트림과 판정이 달라진다 — 값 고정.
    assert va.RECORD_MIN_SEC == 15.0
    assert va.CUT_AFTER_SEC == 8.0
    assert va.MAX_PROMPT_SEC == 30.0
    assert va.SILENCE_DB == "-40dB"
    assert va.SILENCE_MIN == 0.2
    assert va.STT_DURATION_CAP_SEC == 10.0


# --- /voice-analyze 핸들러 ---



def _make_test_app():
    app = web.Application()
    app.router.add_post("/voice-analyze", voice_analyze_handler)
    return app


@pytest.fixture
def _secret(monkeypatch):
    monkeypatch.setenv("PREBUILD_SECRET", "test-secret")


@pytest.mark.asyncio
async def test_handler_401_without_bearer(_secret):
    app = _make_test_app()
    async with TestClient(TestServer(app)) as client:
        resp = await client.post("/voice-analyze", json={"voiceRawUrl": "http://x/y"})
        assert resp.status == 401


@pytest.mark.asyncio
async def test_handler_400_without_url(_secret):
    app = _make_test_app()
    async with TestClient(TestServer(app)) as client:
        resp = await client.post(
            "/voice-analyze", headers={"Authorization": "Bearer test-secret"}, json={},
        )
        assert resp.status == 400


@pytest.mark.asyncio
async def test_handler_returns_verdict(monkeypatch, _secret):
    async def _fake_analyze(url):
        return {"ok": False, "reason": "TOO_SHORT"}

    monkeypatch.setattr(va, "analyze", _fake_analyze)
    app = _make_test_app()
    async with TestClient(TestServer(app)) as client:
        resp = await client.post(
            "/voice-analyze",
            headers={"Authorization": "Bearer test-secret"},
            json={"voiceRawUrl": "http://x/y"},
        )
        assert resp.status == 200
        assert await resp.json() == {"ok": False, "reason": "TOO_SHORT"}


@pytest.mark.asyncio
async def test_handler_500_on_analyze_error(monkeypatch, _secret):
    async def _boom(url):
        raise RuntimeError("ffmpeg failed")

    monkeypatch.setattr(va, "analyze", _boom)
    app = _make_test_app()
    async with TestClient(TestServer(app)) as client:
        resp = await client.post(
            "/voice-analyze",
            headers={"Authorization": "Bearer test-secret"},
            json={"voiceRawUrl": "http://x/y"},
        )
        assert resp.status == 500


# --- _speech_start ---
def test_speech_start_leading_silence():
    assert va._speech_start([0.0], [1.2]) == 1.2
    assert va._speech_start([0.29], [0.9]) == 0.9


def test_speech_start_no_leading_silence():
    assert va._speech_start([0.3], [0.9]) == 0.0
    assert va._speech_start([], []) == 0.0
    assert va._speech_start([0.0], []) == 0.0


# --- analyze 정리 ---
@pytest.mark.asyncio
async def test_analyze_cleans_tmpdir_on_error(monkeypatch):
    import tempfile
    captured = {}
    real = tempfile.mkdtemp

    def _spy(*a, **k):
        captured["d"] = real(*a, **k)
        return captured["d"]

    async def _boom(url, dest):
        open(dest, "w").write("x")
        raise RuntimeError("fetch failed")

    monkeypatch.setattr(tempfile, "mkdtemp", _spy)
    monkeypatch.setattr(va.voice_fetch, "fetch_to", _boom)
    with pytest.raises(RuntimeError):
        await va.analyze("http://x/y")
    assert "d" in captured and not os.path.exists(captured["d"])


# --- _transcribe 분기 ---
def test_transcribe_422_returns_none(monkeypatch):
    def _raise(req, timeout=None):
        raise urllib.error.HTTPError("u", 422, "unprocessable", {}, io.BytesIO(b""))
    monkeypatch.setattr(va.urllib.request, "urlopen", _raise)
    assert va._transcribe("/tmp/x.wav") is None


def test_transcribe_5xx_propagates(monkeypatch):
    def _raise(req, timeout=None):
        raise urllib.error.HTTPError("u", 503, "down", {}, io.BytesIO(b""))
    monkeypatch.setattr(va.urllib.request, "urlopen", _raise)
    with pytest.raises(urllib.error.HTTPError):
        va._transcribe("/tmp/x.wav")


def test_transcribe_urlerror_propagates(monkeypatch):
    def _raise(req, timeout=None):
        raise urllib.error.URLError("refused")
    monkeypatch.setattr(va.urllib.request, "urlopen", _raise)
    with pytest.raises(urllib.error.URLError):
        va._transcribe("/tmp/x.wav")
