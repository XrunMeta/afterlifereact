import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

def test_healthz_reports_engine_state():
    # 엔진 미로드 상태에서 healthz 함수를 직접 호출(GPU startup 미유발).
    from server import app, healthz
    app.state.engine = None
    body = healthz()
    assert body["ok"] is False
    assert body["service"] == "qwen3tts"
    assert body["model"].endswith("1.7B-Base")


import numpy as np, io, soundfile as sf
import config as cfg  # noqa: E402

class FakeEngine:
    def __init__(self): self.calls = []
    def synth(self, text, clone_id, voice_wav, ref_text=None, speed=1.0):
        self.calls.append({"text": text, "clone_id": clone_id, "voice_wav": voice_wav, "speed": speed})
        buf = io.BytesIO()
        sf.write(buf, np.zeros(1600, dtype="float32"), 16000, format="WAV", subtype="PCM_16")
        return buf.getvalue()

def _client_with_fake_engine(tmp_path, monkeypatch):
    # voice.wav 존재시키기
    (tmp_path / "halbae").mkdir()
    sf.write(str(tmp_path / "halbae" / "voice.wav"), np.zeros(1600, dtype="float32"), 16000)
    monkeypatch.setattr(cfg, "REF_ROOT", str(tmp_path))
    monkeypatch.setattr(cfg, "DEFAULT_CLONE", "halbae")
    from fastapi.testclient import TestClient
    from server import app
    app.router.on_startup.clear()  # GPU startup 스킵
    app.state.engine = FakeEngine()
    return TestClient(app), app.state.engine

def test_tts_kr_returns_wav_and_headers(tmp_path, monkeypatch):
    client, eng = _client_with_fake_engine(tmp_path, monkeypatch)
    resp = client.post("/tts/kr", json={"text": "안녕 할배", "speed": 1.0,
                                        "sdp_ratio": 0.5, "noise_scale": 0.6, "noise_scale_w": 1.0,
                                        "se_path": "reference_voices/halbae/se.pth"})
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/wav"
    assert int(resp.headers["x-synth-ms"]) >= 0
    assert resp.content[:4] == b"RIFF"
    assert eng.calls[0]["clone_id"] == "halbae"  # se_path → cloneId

def test_tts_kr_uses_default_clone_without_se_path(tmp_path, monkeypatch):
    client, eng = _client_with_fake_engine(tmp_path, monkeypatch)
    resp = client.post("/tts/kr", json={"text": "기본 클론"})
    assert resp.status_code == 200
    assert eng.calls[0]["clone_id"] == "halbae"  # DEFAULT_CLONE

def test_tts_kr_ignores_openvoice_params(tmp_path, monkeypatch):
    client, eng = _client_with_fake_engine(tmp_path, monkeypatch)
    resp = client.post("/tts/kr", json={"text": "x", "sdp_ratio": 0.9, "noise_scale": 0.1})
    assert resp.status_code == 200

def test_tts_kr_empty_text_400(tmp_path, monkeypatch):
    client, _ = _client_with_fake_engine(tmp_path, monkeypatch)
    resp = client.post("/tts/kr", json={"text": "   "})
    assert resp.status_code == 400

def test_tts_kr_missing_voice_503(tmp_path, monkeypatch):
    client, _ = _client_with_fake_engine(tmp_path, monkeypatch)
    resp = client.post("/tts/kr", json={"text": "x", "se_path": "reference_voices/nobody/se.pth"})
    assert resp.status_code == 503  # voice.wav 없음
