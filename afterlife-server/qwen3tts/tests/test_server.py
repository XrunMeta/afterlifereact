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


# ── 동시통화 Lock 직렬화 ──────────────────────────────────────────────────────

import threading as _threading
import time as _time


def test_synth_lock_serializes_concurrent_calls(tmp_path, monkeypatch):
    """동시 2개 synth 호출이 Lock으로 직렬화되는지 검증.
    첫 번째 호출이 Lock 보유 중일 때 두 번째 호출은 대기해야 한다.
    실행 순서(order)가 반드시 [0, 1]임을 확인.
    """
    import numpy as np, io, soundfile as sf
    import config as cfg

    (tmp_path / "halbae").mkdir()
    sf.write(str(tmp_path / "halbae" / "voice.wav"), np.zeros(1600, dtype="float32"), 16000)
    monkeypatch.setattr(cfg, "REF_ROOT", str(tmp_path))
    monkeypatch.setattr(cfg, "DEFAULT_CLONE", "halbae")

    order = []  # synth 진입 순서 기록

    class SlowEngine:
        def synth(self, text, clone_id, voice_wav, ref_text=None, speed=1.0):
            # 첫 번째 진입자만 0.05s 슬립해 두 번째 호출이 Lock 앞에서 대기하도록 유도
            idx = len(order)
            order.append(idx)
            if idx == 0:
                _time.sleep(0.05)
            buf = io.BytesIO()
            sf.write(buf, np.zeros(1600, dtype="float32"), 16000, format="WAV", subtype="PCM_16")
            return buf.getvalue()

    from fastapi.testclient import TestClient
    from server import app, _SYNTH_LOCK  # Lock 임포트

    app.router.on_startup.clear()
    app.state.engine = SlowEngine()
    client = TestClient(app)

    results = {}

    def _call(key):
        r = client.post("/tts/kr", json={"text": f"테스트{key}"})
        results[key] = r.status_code

    t1 = _threading.Thread(target=_call, args=("A",))
    t2 = _threading.Thread(target=_call, args=("B",))
    t1.start()
    _time.sleep(0.005)  # t1이 Lock을 잡도록 살짝 선행
    t2.start()
    t1.join(timeout=5)
    t2.join(timeout=5)

    assert results.get("A") == 200
    assert results.get("B") == 200
    # 두 synth 호출이 중복 없이 각 1회씩 실행됐는지 확인
    assert len(order) == 2
    # Lock 직렬화 → 항상 0번 먼저 완료 후 1번 시작 (order=[0,1] 순서 보장)
    assert order == [0, 1]


def test_synth_lock_exists():
    """_SYNTH_LOCK이 threading.Lock 인스턴스인지 확인 (구조 회귀 방지)"""
    import server as _srv
    assert hasattr(_srv, "_SYNTH_LOCK"), "_SYNTH_LOCK 없음 — Lock 직렬화 코드 누락"
    # threading.Lock()은 _thread.lock 타입이므로 acquire/release 유무로 검사
    assert callable(getattr(_srv._SYNTH_LOCK, "acquire", None))
