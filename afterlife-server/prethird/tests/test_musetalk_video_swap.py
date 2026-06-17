"""
MuseTalkInproc.infer(video_path=...) 교체 지원 단위 테스트.

계약:
  - infer(wav, cb, video_path="/ref/9043/9043-idle.mp4") → args.video_path == 해당 경로
  - infer(wav, cb)                                       → args.video_path == self.video_path(기본)
  - yaml cfg_data["task_0"]["video_path"] 도 동일하게 반영
  - 모델 재로드 없음 (self._models 공유)

주의: inference_lib 은 infer() 내부에서 local import 된다.
sys.modules["inference_lib"] 에 mock 을 주입해 패치한다.
"""
from __future__ import annotations

import sys
import types
import pathlib
from unittest.mock import MagicMock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

DEFAULT_VIDEO = "/ref/halbae.mp4"
OVERRIDE_VIDEO = "/ref/9043/9043-idle.mp4"


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


def _inject_fake_inference_lib(fake_run_inference):
    """sys.modules 에 inference_lib mock 을 주입하고, 클린업 함수를 반환."""
    mock_lib = MagicMock()
    mock_lib.run_inference = fake_run_inference
    sys.modules["inference_lib"] = mock_lib

    def cleanup():
        sys.modules.pop("inference_lib", None)

    return cleanup


# -------------------------------------------------------------------------
# args.video_path 교체 검증
# -------------------------------------------------------------------------

def test_infer_uses_override_video(tmp_path):
    """video_path 인자 전달 시 args.video_path 가 해당 경로로 바뀌어야 한다."""
    import musetalk_inproc  # noqa: PLC0415

    mt = _make_loaded_mt()
    captured: dict = {}

    def fake_run(args, models, frame_callback=None, timing_out=None):
        captured["video_path"] = args.video_path
        return None

    cleanup = _inject_fake_inference_lib(fake_run)
    # CONFIG_DIR / RESULT_DIR 을 tmp_path 로 교체해 디스크 IO 허용
    orig_config = musetalk_inproc.CONFIG_DIR
    orig_outputs = musetalk_inproc.PRETHIRD_OUTPUTS
    orig_result = musetalk_inproc.RESULT_DIR
    musetalk_inproc.CONFIG_DIR = tmp_path
    musetalk_inproc.PRETHIRD_OUTPUTS = tmp_path
    musetalk_inproc.RESULT_DIR = tmp_path / "v15"
    (tmp_path / "v15").mkdir(parents=True, exist_ok=True)
    try:
        mt.infer("/x.wav", lambda a: None, video_path=OVERRIDE_VIDEO)
    finally:
        cleanup()
        musetalk_inproc.CONFIG_DIR = orig_config
        musetalk_inproc.PRETHIRD_OUTPUTS = orig_outputs
        musetalk_inproc.RESULT_DIR = orig_result

    assert captured["video_path"] == OVERRIDE_VIDEO, (
        f"Expected {OVERRIDE_VIDEO!r}, got {captured.get('video_path')!r}"
    )


def test_infer_default_video_when_none(tmp_path):
    """video_path 생략 시 self.video_path(기본) 를 사용해야 한다."""
    import musetalk_inproc  # noqa: PLC0415

    mt = _make_loaded_mt()
    captured: dict = {}

    def fake_run(args, models, frame_callback=None, timing_out=None):
        captured["video_path"] = args.video_path
        return None

    cleanup = _inject_fake_inference_lib(fake_run)
    orig_config = musetalk_inproc.CONFIG_DIR
    orig_outputs = musetalk_inproc.PRETHIRD_OUTPUTS
    orig_result = musetalk_inproc.RESULT_DIR
    musetalk_inproc.CONFIG_DIR = tmp_path
    musetalk_inproc.PRETHIRD_OUTPUTS = tmp_path
    musetalk_inproc.RESULT_DIR = tmp_path / "v15"
    (tmp_path / "v15").mkdir(parents=True, exist_ok=True)
    try:
        mt.infer("/x.wav", lambda a: None)
    finally:
        cleanup()
        musetalk_inproc.CONFIG_DIR = orig_config
        musetalk_inproc.PRETHIRD_OUTPUTS = orig_outputs
        musetalk_inproc.RESULT_DIR = orig_result

    assert captured["video_path"] == DEFAULT_VIDEO, (
        f"Expected {DEFAULT_VIDEO!r}, got {captured.get('video_path')!r}"
    )


# -------------------------------------------------------------------------
# yaml cfg_data 교체 검증
# -------------------------------------------------------------------------

def test_infer_yaml_uses_override_video(tmp_path):
    """video_path 인자 전달 시 per-call yaml 의 task_0.video_path 도 교체돼야 한다."""
    import musetalk_inproc  # noqa: PLC0415
    import yaml  # noqa: PLC0415

    mt = _make_loaded_mt()
    yaml_contents: list[dict] = []

    def fake_run(args, models, frame_callback=None, timing_out=None):
        try:
            data = yaml.safe_load(pathlib.Path(args.inference_config).read_text())
            yaml_contents.append(data)
        except Exception:
            pass
        return None

    cleanup = _inject_fake_inference_lib(fake_run)
    orig_config = musetalk_inproc.CONFIG_DIR
    orig_outputs = musetalk_inproc.PRETHIRD_OUTPUTS
    orig_result = musetalk_inproc.RESULT_DIR
    musetalk_inproc.CONFIG_DIR = tmp_path
    musetalk_inproc.PRETHIRD_OUTPUTS = tmp_path
    musetalk_inproc.RESULT_DIR = tmp_path / "v15"
    (tmp_path / "v15").mkdir(parents=True, exist_ok=True)
    try:
        mt.infer("/x.wav", lambda a: None, video_path=OVERRIDE_VIDEO)
    finally:
        cleanup()
        musetalk_inproc.CONFIG_DIR = orig_config
        musetalk_inproc.PRETHIRD_OUTPUTS = orig_outputs
        musetalk_inproc.RESULT_DIR = orig_result

    assert yaml_contents, "yaml 파일이 생성되지 않았음"
    assert yaml_contents[0]["task_0"]["video_path"] == OVERRIDE_VIDEO


def test_infer_yaml_default_video(tmp_path):
    """video_path 생략 시 yaml 도 self.video_path 유지."""
    import musetalk_inproc  # noqa: PLC0415
    import yaml  # noqa: PLC0415

    mt = _make_loaded_mt()
    yaml_contents: list[dict] = []

    def fake_run(args, models, frame_callback=None, timing_out=None):
        try:
            data = yaml.safe_load(pathlib.Path(args.inference_config).read_text())
            yaml_contents.append(data)
        except Exception:
            pass
        return None

    cleanup = _inject_fake_inference_lib(fake_run)
    orig_config = musetalk_inproc.CONFIG_DIR
    orig_outputs = musetalk_inproc.PRETHIRD_OUTPUTS
    orig_result = musetalk_inproc.RESULT_DIR
    musetalk_inproc.CONFIG_DIR = tmp_path
    musetalk_inproc.PRETHIRD_OUTPUTS = tmp_path
    musetalk_inproc.RESULT_DIR = tmp_path / "v15"
    (tmp_path / "v15").mkdir(parents=True, exist_ok=True)
    try:
        mt.infer("/x.wav", lambda a: None)
    finally:
        cleanup()
        musetalk_inproc.CONFIG_DIR = orig_config
        musetalk_inproc.PRETHIRD_OUTPUTS = orig_outputs
        musetalk_inproc.RESULT_DIR = orig_result

    assert yaml_contents
    assert yaml_contents[0]["task_0"]["video_path"] == DEFAULT_VIDEO


# -------------------------------------------------------------------------
# self._args.video_path 불변 검증 (el R-1: per-call copy)
# -------------------------------------------------------------------------

def test_infer_does_not_mutate_self_args(tmp_path):
    """infer() 후 self._args.video_path가 원본(DEFAULT_VIDEO)을 유지해야 한다.
    args copy 패턴 구현 후 통과해야 할 테스트.
    """
    import musetalk_inproc  # noqa: PLC0415

    mt = _make_loaded_mt()
    original_video = mt._args.video_path  # DEFAULT_VIDEO

    def fake_run(args, models, frame_callback=None, timing_out=None):
        return None

    cleanup = _inject_fake_inference_lib(fake_run)
    orig_config = musetalk_inproc.CONFIG_DIR
    orig_outputs = musetalk_inproc.PRETHIRD_OUTPUTS
    orig_result = musetalk_inproc.RESULT_DIR
    musetalk_inproc.CONFIG_DIR = tmp_path
    musetalk_inproc.PRETHIRD_OUTPUTS = tmp_path
    musetalk_inproc.RESULT_DIR = tmp_path / "v15"
    (tmp_path / "v15").mkdir(parents=True, exist_ok=True)
    try:
        mt.infer("/x.wav", lambda a: None, video_path=OVERRIDE_VIDEO)
    finally:
        cleanup()
        musetalk_inproc.CONFIG_DIR = orig_config
        musetalk_inproc.PRETHIRD_OUTPUTS = orig_outputs
        musetalk_inproc.RESULT_DIR = orig_result

    assert mt._args.video_path == original_video, (
        f"self._args.video_path가 변경됐음: "
        f"기대={original_video!r}, 실제={mt._args.video_path!r}"
    )


def test_infer_does_not_mutate_self_args_audio(tmp_path):
    """infer() 후 self._args.audio_path도 원본('') 유지."""
    import musetalk_inproc  # noqa: PLC0415

    mt = _make_loaded_mt()
    original_audio = mt._args.audio_path  # ""

    def fake_run(args, models, frame_callback=None, timing_out=None):
        return None

    cleanup = _inject_fake_inference_lib(fake_run)
    orig_config = musetalk_inproc.CONFIG_DIR
    orig_outputs = musetalk_inproc.PRETHIRD_OUTPUTS
    orig_result = musetalk_inproc.RESULT_DIR
    musetalk_inproc.CONFIG_DIR = tmp_path
    musetalk_inproc.PRETHIRD_OUTPUTS = tmp_path
    musetalk_inproc.RESULT_DIR = tmp_path / "v15"
    (tmp_path / "v15").mkdir(parents=True, exist_ok=True)
    try:
        mt.infer("/new_audio.wav", lambda a: None)
    finally:
        cleanup()
        musetalk_inproc.CONFIG_DIR = orig_config
        musetalk_inproc.PRETHIRD_OUTPUTS = orig_outputs
        musetalk_inproc.RESULT_DIR = orig_result

    assert mt._args.audio_path == original_audio, (
        f"self._args.audio_path가 변경됐음: "
        f"기대={original_audio!r}, 실제={mt._args.audio_path!r}"
    )


# -------------------------------------------------------------------------
# 모델 재로드 없음 검증
# -------------------------------------------------------------------------

def test_infer_does_not_reload_models(tmp_path):
    """video_path 가 달라져도 self._models 객체가 교체되지 않아야 한다."""
    import musetalk_inproc  # noqa: PLC0415

    mt = _make_loaded_mt()
    original_models = mt._models

    def fake_run(args, models, frame_callback=None, timing_out=None):
        return None

    cleanup = _inject_fake_inference_lib(fake_run)
    orig_config = musetalk_inproc.CONFIG_DIR
    orig_outputs = musetalk_inproc.PRETHIRD_OUTPUTS
    orig_result = musetalk_inproc.RESULT_DIR
    musetalk_inproc.CONFIG_DIR = tmp_path
    musetalk_inproc.PRETHIRD_OUTPUTS = tmp_path
    musetalk_inproc.RESULT_DIR = tmp_path / "v15"
    (tmp_path / "v15").mkdir(parents=True, exist_ok=True)
    try:
        mt.infer("/x.wav", lambda a: None, video_path=OVERRIDE_VIDEO)
    finally:
        cleanup()
        musetalk_inproc.CONFIG_DIR = orig_config
        musetalk_inproc.PRETHIRD_OUTPUTS = orig_outputs
        musetalk_inproc.RESULT_DIR = orig_result

    assert mt._models is original_models, "infer 호출 시 모델이 재로드됐음 (금지)"
