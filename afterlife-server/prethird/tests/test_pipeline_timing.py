import asyncio
import importlib, logging, os, pathlib, sys

import numpy as np
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


class _FakeVideoTrack:
    def __init__(self):
        self.frames = []

    def push_ndarray(self, arr):
        self.frames.append(arr)

    def signal_end(self):
        return 0

    def begin_response(self):
        # [T-113 리드버퍼] _run_pipeline 진입부에서 무조건 호출됨(PRETHIRD_PREROLL_FRAMES=0
        # 기본이면 실 트랙에서도 no-op) — 이 스텁 fixture 에도 동일 인터페이스 필요.
        return None


class _FakeAudioTrack:
    def __init__(self):
        self.pcm = []

    def push_pcm_int16(self, pcm):
        self.pcm.append(pcm)

    def signal_end(self):
        return 0


async def test_run_pipeline_partial_emits_turn_summary(tmp_path, monkeypatch, caplog):
    """_run_pipeline_partial 이 턴 종료 시 [turn] 요약을 1회 로깅한다.

    render_mode 는 미설정(기본 partial) → DialoguePipeline.say() 가
    _run_pipeline → _run_pipeline_partial 을 타도록 실제 1턴을 구동해
    (tests/test_pipeline_batch.py 의 produce/infer_fn 주입 패턴 재사용)
    caplog 에서 [turn] 요약 라인을 검증한다(스텁 아님 — 실 파이프라인 구동)."""
    metrics = tmp_path / "seg.log"
    monkeypatch.setenv("PRETHIRD_E2E_METRICS", "1")
    monkeypatch.setenv("PRETHIRD_METRICS_PATH", str(metrics))
    monkeypatch.delenv("PRETHIRD_RENDER_MODE", raising=False)
    import scripts.pipeline as pl
    importlib.reload(pl)
    caplog.set_level(logging.INFO, logger=pl.log.name)

    async def chat_fn(messages):
        # SentenceBuffer(min_len=4) 병합 회피 — 각 문장이 단독으로 min_len 이상.
        for tok in ["첫 문장이다. ", "둘째 문장도 있다. "]:
            yield tok

    async def say_fn(text, se_path=None):
        return b"WAVfake"

    def decode_wav_fn(b):
        return np.zeros(960, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame, **k):
        on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 1

    vt, at = _FakeVideoTrack(), _FakeAudioTrack()
    p = pl.DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=chat_fn, say_fn=say_fn,
        decode_wav_fn=decode_wav_fn, infer_fn=infer_fn,
    )
    assert p._render_mode == "partial", "이 테스트는 _run_pipeline_partial 경로를 구동해야 함"

    await p.say("아무 말")

    turn_lines = [r.getMessage() for r in caplog.records if r.getMessage().startswith("[turn]")]
    assert any("first_audio_ms" in m for m in turn_lines), "[turn] 요약 미출력"
    assert len(vt.frames) == 2, f"문장 2개(partial)면 infer 2회 → 프레임 2개(실제: {len(vt.frames)})"
