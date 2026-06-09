"""MuseTalkInproc.infer GPU 추론 직렬화(threading.Lock) 단위 테스트.

근거(회귀 진단):
  다중클론 동시통화 시 여러 세션이 공유 musetalk 모델(self._models)로 동시
  GPU 진입 → CUDA illegal memory access → 컨텍스트 오염(sticky) → 이후 모든
  infer 가 frames=0 → 입싱크 프레임 미생성, idle 영상만 송출(v_real=0).
  qwen3tts server.py 의 _SYNTH_LOCK(threading.Lock) 직렬화 패턴과 동일하게
  run_inference 호출을 직렬화해 재발을 막는다.

infer 는 pipeline 에서 run_in_executor(별 스레드)로 호출되므로 asyncio.Lock 이
아닌 threading.Lock 이 정확한 도구다.
"""
from __future__ import annotations

import sys
import types
import pathlib
import threading
import time
from unittest.mock import MagicMock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

DEFAULT_VIDEO = "/ref/halbae.mp4"


def _make_loaded_mt():
    import musetalk_inproc  # noqa: PLC0415

    mt = musetalk_inproc.MuseTalkInproc(DEFAULT_VIDEO)
    mt._loaded = True
    mt._models = object()
    mt._args = types.SimpleNamespace(
        video_path=DEFAULT_VIDEO,
        audio_path="",
        bbox_shift=0,
        inference_config="",
        result_dir="/tmp/prethird_test",
        skip_mp4_output=True,
        gpu_id=0,
    )
    return mt


def test_infer_serializes_concurrent_run_inference(tmp_path):
    """두 스레드가 동시에 infer() 를 호출해도 run_inference 는 겹쳐 실행되지
    않아야 한다(최대 동시 진입=1). Lock 누락 시 max_concurrent=2 로 실패."""
    import musetalk_inproc  # noqa: PLC0415

    counter = {"now": 0, "max": 0}
    guard = threading.Lock()  # 테스트 측 카운터 보호(피검 대상 아님)

    def fake_run(args, models, frame_callback=None, timing_out=None):
        with guard:
            counter["now"] += 1
            counter["max"] = max(counter["max"], counter["now"])
        time.sleep(0.05)  # 직렬화 누락 시 두 호출이 겹칠 시간 확보
        with guard:
            counter["now"] -= 1
        return None

    mock_lib = MagicMock()
    mock_lib.run_inference = fake_run
    sys.modules["inference_lib"] = mock_lib

    orig = (
        musetalk_inproc.CONFIG_DIR,
        musetalk_inproc.PRETHIRD_OUTPUTS,
        musetalk_inproc.RESULT_DIR,
    )
    musetalk_inproc.CONFIG_DIR = tmp_path
    musetalk_inproc.PRETHIRD_OUTPUTS = tmp_path
    musetalk_inproc.RESULT_DIR = tmp_path / "v15"
    (tmp_path / "v15").mkdir(parents=True, exist_ok=True)

    # 단일 인스턴스 공유(실서버와 동일 — 모델 1회 로드 공유)
    mt = _make_loaded_mt()

    def worker():
        mt.infer("/x.wav", lambda a: None)

    try:
        threads = [threading.Thread(target=worker) for _ in range(2)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
    finally:
        sys.modules.pop("inference_lib", None)
        (
            musetalk_inproc.CONFIG_DIR,
            musetalk_inproc.PRETHIRD_OUTPUTS,
            musetalk_inproc.RESULT_DIR,
        ) = orig

    assert counter["max"] == 1, (
        f"run_inference 동시 진입 감지: max={counter['max']} (직렬화 누락). "
        "MuseTalkInproc.infer 는 GPU 추론을 threading.Lock 으로 직렬화해야 함."
    )
