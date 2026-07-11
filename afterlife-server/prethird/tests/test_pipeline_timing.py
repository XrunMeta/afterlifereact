import importlib, logging, os, pathlib, sys

import pytest

# scripts/pipeline.py 내부의 top-level `from recorder import NULL_TURN` 등을
# 위해 scripts 디렉토리 자체도 sys.path 에 필요(기존 test_pipeline*.py 관례와 동일).
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))


@pytest.fixture(autouse=True)
def _clean_pipeline_metrics_handler():
    """logging.getLogger("prethird.pipeline") 는 프로세스 전역 싱글턴이라
    importlib.reload 를 반복하면 FileHandler 가 테스트 간 누적된다 —
    매 테스트 시작 전 제거해 격리한다(pipeline.py 동작 자체는 무영향)."""
    try:
        import scripts.pipeline as pl
        for h in list(pl.log.handlers):
            if isinstance(h, logging.FileHandler):
                pl.log.removeHandler(h)
                h.close()
    except ModuleNotFoundError:
        pass
    yield


def test_metrics_filehandler_attached_when_enabled(tmp_path, monkeypatch):
    """PRETHIRD_E2E_METRICS on 이면 [seg]/[turn] 만 파일로 tee 하는 FileHandler 가 붙는다."""
    metrics = tmp_path / "e2e" / "prethird_seg.log"
    monkeypatch.setenv("PRETHIRD_E2E_METRICS", "1")
    monkeypatch.setenv("PRETHIRD_METRICS_PATH", str(metrics))
    import scripts.pipeline as pl
    importlib.reload(pl)
    fhs = [h for h in pl.log.handlers if isinstance(h, logging.FileHandler)]
    assert fhs, "메트릭 FileHandler 미부착"
    pl.log.info("[seg] tts_ms=1 infer_ms=2 since_prev_ms=0 vq=0")
    pl.log.info("[turn] first_audio_ms=1500 n_seg=3")
    pl.log.info("일반 INFO 로그 — 파일에 남으면 안 됨")
    for h in fhs:
        h.flush()
    body = metrics.read_text()
    assert "[seg]" in body and "[turn]" in body
    assert "일반 INFO 로그" not in body


def test_metrics_disabled_when_env_zero(tmp_path, monkeypatch):
    """PRETHIRD_E2E_METRICS=0 이면 FileHandler 를 붙이지 않는다(회귀 안전)."""
    monkeypatch.setenv("PRETHIRD_E2E_METRICS", "0")
    monkeypatch.setenv("PRETHIRD_METRICS_PATH", str(tmp_path / "x.log"))
    import scripts.pipeline as pl
    importlib.reload(pl)
    assert not [h for h in pl.log.handlers if isinstance(h, logging.FileHandler)]
