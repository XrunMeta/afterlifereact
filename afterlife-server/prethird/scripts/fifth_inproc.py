"""fifth in-process 래퍼 — prethird 입싱크를 musetalk 대신 fifth 로 구동.

MuseTalkInproc 와 동일 계약: load() 1회, infer(wav, on_frame, video_path) -> int.
fifth 렌더 코어(fifth/scripts)를 sys.path 로 import 한다.
"""
from __future__ import annotations

import os
import sys
import threading
from pathlib import Path
from typing import Callable

FIFTH_SCRIPTS_DIR = os.environ.get(
    "FIFTH_SCRIPTS_DIR",
    str(Path(__file__).resolve().parents[2] / "fifth" / "scripts"),
)
FIFTH_SOURCE_CACHE = os.environ.get(
    "FIFTH_SOURCE_CACHE", "/home/afterlife/fifth_sources")
FIFTH_CFG_YAML = os.environ.get("FIFTH_CFG_YAML", "configs/trt_infer.yaml")


class FifthInproc:
    def __init__(self, video_path: str, clone_id: int | None = None,
                 cache_root: str = FIFTH_SOURCE_CACHE) -> None:
        self.video_path = video_path
        self.clone_id = clone_id
        self.cache_root = cache_root
        self._eng = None
        self._jp = None
        self._cfg = None
        self._sources = None
        self._loaded = False
        self._infer_lock = threading.Lock()

    def _build_engine(self):
        if FIFTH_SCRIPTS_DIR not in sys.path:
            sys.path.insert(0, FIFTH_SCRIPTS_DIR)
        from flp_engine import FifthFLPEngine  # type: ignore
        return FifthFLPEngine(FIFTH_CFG_YAML)

    def _build_jp(self):
        from omegaconf import OmegaConf  # type: ignore
        from src.pipelines.joyvasa_audio_to_motion_pipeline import JoyVASAAudio2MotionPipeline  # type: ignore
        jcfg = OmegaConf.load(FIFTH_CFG_YAML)
        cfg_scale = float(os.environ.get("FIFTH_CFG_SCALE", "2.0"))
        return JoyVASAAudio2MotionPipeline(
            motion_model_path=jcfg.joyvasa_models.motion_model_path,
            audio_model_path=jcfg.joyvasa_models.audio_model_path,
            motion_template_path=jcfg.joyvasa_models.motion_template_path,
            cfg_mode=jcfg.infer_params.cfg_mode,
            cfg_scale=cfg_scale,
        )

    def _prepare(self, eng, clone_id, video_path):
        if FIFTH_SCRIPTS_DIR not in sys.path:
            sys.path.insert(0, FIFTH_SCRIPTS_DIR)
        from face_source import make_extract_fn, load_or_extract_sources  # type: ignore
        from fifth_render import prepare_sources  # type: ignore

        def detect_lmk(bgr):
            return eng.detect_landmarks(bgr)

        extract_fn = make_extract_fn(detect_lmk)
        selection = load_or_extract_sources(
            video_path=video_path, cache_root=self.cache_root,
            clone_id=int(clone_id) if clone_id is not None else 0,
            extract_fn=extract_fn)
        return prepare_sources(eng, selection)

    def _stream(self, eng, jp, cfg, sources, wav, on_frame, blink_enabled):
        if FIFTH_SCRIPTS_DIR not in sys.path:
            sys.path.insert(0, FIFTH_SCRIPTS_DIR)
        from fifth_render import stream_wav_frames  # type: ignore
        return stream_wav_frames(eng, jp, cfg, sources, wav, on_frame,
                                 blink_enabled=blink_enabled)

    def _load_config(self):
        """FifthConfig.from_env() 를 호출해 cfg 반환. 테스트에서 오버라이드 가능."""
        if FIFTH_SCRIPTS_DIR not in sys.path:
            sys.path.insert(0, FIFTH_SCRIPTS_DIR)
        from config import FifthConfig  # type: ignore
        return FifthConfig.from_env()

    def load(self) -> None:
        """엔진 + JoyVASA(warmup) + 소스 준비를 startup 1회 수행."""
        self._cfg = self._load_config()
        self._eng = self._build_engine()
        self._jp = self._build_jp()
        self._sources = self._prepare(self._eng, self.clone_id, self.video_path)
        self._loaded = True

    def infer(self, wav_path: str, on_frame: Callable,
              video_path: str | None = None) -> int:
        """wav → 프레임 생성마다 on_frame(rgb) 호출. 반환: 프레임 수.

        video_path 인자는 musetalk 계약 호환용. fifth 는 소스를 load() 시점에
        clone_id 별로 준비/캐시하므로, 다른 video_path 가 오면 그때만 재준비한다.
        """
        if not self._loaded:
            raise RuntimeError("FifthInproc.load() 를 먼저 호출하세요.")
        sources = self._sources
        if video_path is not None and video_path != self.video_path:
            sources = self._prepare(self._eng, self.clone_id, video_path)
        blink = os.environ.get("FIFTH_BLINK", "1") == "1"
        with self._infer_lock:
            return self._stream(self._eng, self._jp, self._cfg, sources,
                                wav_path, on_frame, blink)
