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
