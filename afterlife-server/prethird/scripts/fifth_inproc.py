"""fifth in-process 래퍼 — prethird 입싱크를 musetalk 대신 fifth 로 구동.

MuseTalkInproc 와 동일 계약: load() 1회, infer(wav, on_frame, video_path) -> int.
fifth 렌더 코어(fifth/scripts)를 sys.path 로 import 한다.

다중클론 정합 설계:
  - _sources_cache: dict[str, prepared_sources] — video_path별 소스 보관.
  - load()가 기본 클론(self.video_path) prewarm → TTFF 흡수.
  - infer()마다 해당 video_path 캐시 조회·miss 시 _prepare → _sources_cache에 저장.
  - _infer_lock: GPU 직렬화(musetalk _infer_lock 과 동일 패턴).
  - self._sources 단일 필드 없음 — 다중클론 얼굴 누수 원천 차단.

사전조건:
  - FifthConfig.from_env()는 load() 호출 시점의 환경변수를 읽으므로
    FIFTH_* env 는 load() 이전에 모두 세팅돼 있어야 한다.
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
        # video_path → prepared sources 캐시 (다중클론 정합 — 단일 _sources 필드 제거)
        self._sources_cache: dict = {}
        self._loaded = False
        # GPU 추론 직렬화 Lock — musetalk _infer_lock 과 동일 패턴.
        # 다중클론 동시통화 시 GPU 직렬화로 CUDA 컨텍스트 오염 방지.
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

    def _clone_key(self, video_path: str) -> str:
        """video_path 에서 캐시 키(클론 식별 문자열)를 도출한다.

        우선순위:
          1. self.clone_id가 있고 video_path == self.video_path 면 str(self.clone_id).
          2. 아니면 부모 디렉토리명 — prethird 자산 관례
             VIDEO_REF_ROOT/{clone_id}/{clone_id}-idle-25fps.mp4 에서 clone_id 추출.
          3. 부모 디렉토리명이 비어있으면 파일 stem.
        """
        if self.clone_id is not None and video_path == self.video_path:
            return str(self.clone_id)
        parent_name = Path(video_path).parent.name
        if parent_name:
            return parent_name
        return Path(video_path).stem

    def _prepare(self, eng, clone_key: str, video_path: str):
        """video_path 에서 open/closed 소스를 추출·준비한다.

        Note: Task5(컨테이너 통합)에서 flp_engine.detect_landmarks 추가 예정.
        """
        # Task5에서 flp_engine.detect_landmarks 추가 예정.
        # 미구현 상태로 load()/infer() 진입 시 AttributeError 대신 명확한 메시지 제공.
        # GPU import 이전에 guard — 모듈 없는 환경에서도 NotImplementedError가 우선 발생.
        if not hasattr(eng, "detect_landmarks"):
            raise NotImplementedError(
                "FifthFLPEngine.detect_landmarks 미구현 — Task5(컨테이너 통합)에서 보강 예정")

        if FIFTH_SCRIPTS_DIR not in sys.path:
            sys.path.insert(0, FIFTH_SCRIPTS_DIR)
        from face_source import make_extract_fn, load_or_extract_sources  # type: ignore
        from fifth_render import prepare_sources  # type: ignore

        def detect_lmk(bgr):
            return eng.detect_landmarks(bgr)

        extract_fn = make_extract_fn(detect_lmk)
        # face_source.load_or_extract_sources는 clone_id를 str(clone_id)로만 사용.
        # 문자열 키 전달 안전 (int 강제 변환 제거).
        selection = load_or_extract_sources(
            video_path=video_path, cache_root=self.cache_root,
            clone_id=clone_key,
            extract_fn=extract_fn)
        return prepare_sources(eng, selection)

    def _stream(self, eng, jp, cfg, sources, wav, on_frame, blink_enabled):
        if FIFTH_SCRIPTS_DIR not in sys.path:
            sys.path.insert(0, FIFTH_SCRIPTS_DIR)
        from fifth_render import stream_wav_frames  # type: ignore
        return stream_wav_frames(eng, jp, cfg, sources, wav, on_frame,
                                 blink_enabled=blink_enabled)

    def _load_config(self):
        """FifthConfig.from_env() 를 호출해 cfg 반환. 테스트에서 오버라이드 가능.

        FifthConfig.from_env()는 load() 호출 시점의 환경변수를 읽으므로
        FIFTH_* env 는 load() 이전에 모두 세팅돼 있어야 한다.
        """
        if FIFTH_SCRIPTS_DIR not in sys.path:
            sys.path.insert(0, FIFTH_SCRIPTS_DIR)
        from config import FifthConfig  # type: ignore
        return FifthConfig.from_env()

    def load(self) -> None:
        """엔진 + JoyVASA(warmup) + 기본 클론 소스 prewarm을 startup 1회 수행.

        멱등성 보장: 두 번 호출해도 GPU 재init 없음.
        기본 클론(self.video_path) prewarm으로 첫 infer TTFF를 흡수한다.
        self.video_path가 비어있거나 파일이 없으면 prewarm 스킵.
        """
        if self._loaded:
            return
        self._cfg = self._load_config()
        self._eng = self._build_engine()
        self._jp = self._build_jp()
        # 기본 클론 prewarm (TTFF 흡수) — video_path 유효할 때만
        if self.video_path and Path(self.video_path).exists():
            key = self._clone_key(self.video_path)
            self._sources_cache[self.video_path] = self._prepare(
                self._eng, key, self.video_path)
        self._loaded = True

    def infer(self, wav_path: str, on_frame: Callable,
              video_path: str | None = None) -> int:
        """wav → 프레임 생성마다 on_frame(rgb) 호출. 반환: 프레임 수.

        video_path별 sources 캐시:
          - 같은 클론 연속 문장: _sources_cache hit → GPU load_source 클론당 1회.
          - 다른 클론: _prepare 후 _sources_cache에 저장.
          - _infer_lock: GPU 직렬화(동시통화 CUDA 오염 방지).

        Args:
            wav_path: 추론할 wav 파일 경로.
            on_frame: RGB ndarray 콜백. AvatarVideoTrack.push_ndarray 와 호환.
            video_path: 이 호출에서만 사용할 클론 영상 경로. 생략 시 self.video_path.

        Returns:
            총 프레임 수.

        Raises:
            RuntimeError: load() 미호출.
        """
        if not self._loaded:
            raise RuntimeError("FifthInproc.load() 를 먼저 호출하세요.")
        vp = video_path if video_path is not None else self.video_path
        if vp not in self._sources_cache:
            key = self._clone_key(vp)
            self._sources_cache[vp] = self._prepare(self._eng, key, vp)
        sources = self._sources_cache[vp]
        blink = os.environ.get("FIFTH_BLINK", "1") == "1"
        with self._infer_lock:
            return self._stream(self._eng, self._jp, self._cfg, sources,
                                wav_path, on_frame, blink)
