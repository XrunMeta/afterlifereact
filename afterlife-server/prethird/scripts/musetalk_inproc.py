"""
prethird — musetalk in-process 래퍼.

musetalk 모델을 prethird 프로세스에 자체 로드(포트 8300과 별개 인스턴스, GPU 공유).
infer(wav_path, on_frame): 프레임이 생성되는 즉시 on_frame(rgb_ndarray) 호출.

핵심 설계:
  - inference_lib.run_inference(frame_callback=...) 의 (idx, bgr) 콜백을 직접 사용.
  - combine_frame 은 BGR ndarray (inference_lib L364 bgr24). on_frame 은 RGB 기대.
  - BGR→RGB 변환: bgr[:, :, ::-1] + np.ascontiguousarray (VideoFrame.from_ndarray 연속 메모리 필요).
  - mp4 muxing/디스크 IO 없음 (skip_mp4_output=True 고정).
  - GPU 매핑: CUDA_VISIBLE_DEVICES=1 환경에서 gpu_id=0 이 물리 GPU1 에 매핑됨 (주석 참고).

import-time 에 torch/musetalk 를 로드하지 않는다. load()/infer() 내부에서 inference_lib 를
import 하므로, GPU 없는 환경(mac CI 등)에서도 모듈 자체는 import 가능하다.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Callable

# ===== 경로 상수 (환경변수 오버라이드 가능) =====
# 가비아 서버 기준 기본값. prethird 를 다른 위치에서 실행하면 아래 env 를 세팅하라.
#
#   MUSETALK_ROOT         — musetalk-afterlife 루트 (가비아: /home/afterlife/afterlife-server/musetalk-afterlife)
#   MUSETALK_SOURCE_DIR   — musetalk source/ CWD (inference_lib 이 가정하는 루트)
#                           가비아: /home/afterlife/afterlife-server/musetalk-afterlife/source
#   MUSETALK_MODELS_DIR   — models/ 디렉토리 (SOURCE_DIR 기준 상대 ./models/ 와 같아야 함)
#   PRETHIRD_MUSETALK_MODELS 로도 오버라이드 가능 (MUSETALK_MODELS_DIR 우선)
#                           가비아: /home/afterlife/afterlife-server/musetalk-afterlife/source/models
#   MUSETALK_CONFIG_DIR   — per-call yaml config 저장 경로
#   PRETHIRD_MUSETALK_OUTPUTS — prethird 전용 result_dir 루트
#                             ※ 8300(musetalk_server) OUTPUTS_DIR = musetalk-afterlife/outputs/ 와
#                               원천 분리 — 동시 추론 시 pkl 캐시(coord/latent/mask) 충돌 방지.
#                               기본값: /home/afterlife/afterlife-server/prethird/musetalk-outputs/
#                               8300 경로(musetalk-afterlife/outputs/)와 절대 겹치지 않는다.
#   MUSETALK_FFMPEG_PATH  — ffmpeg static binary 디렉토리
#   MUSETALK_BATCH_SIZE   — unet+vae batch 크기 (기본 16)
#   MUSETALK_GPU_ID       — CUDA_VISIBLE_DEVICES 내 인덱스 (기본 0 = 물리 GPU1 @ CUDA_VISIBLE_DEVICES=1)

_MUSETALK_ROOT = Path(os.environ.get(
    "MUSETALK_ROOT",
    "/home/afterlife/afterlife-server/musetalk-afterlife",
))
SOURCE_DIR = Path(os.environ.get("MUSETALK_SOURCE_DIR", str(_MUSETALK_ROOT / "source")))
MODELS_DIR = Path(os.environ.get(
    "MUSETALK_MODELS_DIR",
    os.environ.get("PRETHIRD_MUSETALK_MODELS", str(SOURCE_DIR / "models")),
))
CONFIG_DIR = Path(os.environ.get("MUSETALK_CONFIG_DIR", str(SOURCE_DIR / "configs/inference")))

# prethird 전용 출력 루트 — 8300 OUTPUTS_DIR(musetalk-afterlife/outputs/)과 원천 분리.
# inference_lib 은 result_dir/../ 에 coord/latent/mask pkl 을 기록한다.
# result_dir = PRETHIRD_OUTPUTS / "v15" 로 한 단계 안에 두면
# pkl 이 PRETHIRD_OUTPUTS/ 에 떨어져 8300 outputs/ 트리와 완전 분리된다.
_PRETHIRD_SERVER_DIR = Path("/home/afterlife/afterlife-server/prethird")
_DEFAULT_PRETHIRD_OUTPUTS = _PRETHIRD_SERVER_DIR / "musetalk-outputs"
PRETHIRD_OUTPUTS = Path(os.environ.get(
    "PRETHIRD_MUSETALK_OUTPUTS",
    str(_DEFAULT_PRETHIRD_OUTPUTS),
))
# result_dir 은 PRETHIRD_OUTPUTS/v15  → pkl 부모 = PRETHIRD_OUTPUTS (8300과 겹치지 않음)
RESULT_DIR = PRETHIRD_OUTPUTS / "v15"

FFMPEG_PATH = os.environ.get("MUSETALK_FFMPEG_PATH", "./ffmpeg-4.4-amd64-static/")


def _default_args(video_path: str) -> argparse.Namespace:
    """musetalk_server._default_args() 와 동일한 args Namespace 구성.

    musetalk_server 의 _default_args() 에서 사용하는 모든 필드를 누락 없이 포함:
      ffmpeg_path, gpu_id, vae_type, unet_config, unet_model_path, whisper_dir,
      inference_config, bbox_shift, result_dir, extra_margin, fps,
      audio_padding_length_left, audio_padding_length_right, batch_size,
      output_vid_name, use_saved_coord, saved_coord, use_float16,
      parsing_mode, left_cheek_width, right_cheek_width, version,
      skip_mp4_output, audio_path, video_path.
    """
    a = argparse.Namespace()

    # -- ffmpeg --
    a.ffmpeg_path = FFMPEG_PATH

    # -- GPU --
    # CUDA_VISIBLE_DEVICES=1 환경에서 gpu_id=0 은 물리 GPU1 에 매핑된다.
    # 8300(musetalk_server) 이 GPU0 을 점유하므로 prethird 는 GPU1 전용.
    a.gpu_id = int(os.environ.get("MUSETALK_GPU_ID", "0"))

    # -- 모델 경로 --
    a.vae_type = "sd-vae"
    a.unet_config = str(MODELS_DIR / "musetalkV15/musetalk.json")
    a.unet_model_path = str(MODELS_DIR / "musetalkV15/unet.pth")
    a.whisper_dir = str(MODELS_DIR / "whisper")

    # -- per-call 필드 (초기값, infer() 에서 덮어씀) --
    a.inference_config = ""
    a.bbox_shift = 0
    a.result_dir = str(RESULT_DIR)
    a.audio_path = ""
    a.video_path = video_path

    # -- 추론 파라미터 --
    a.extra_margin = 10
    a.fps = 25
    a.audio_padding_length_left = 2
    a.audio_padding_length_right = 2
    a.batch_size = int(os.environ.get("MUSETALK_BATCH_SIZE", "16"))
    a.output_vid_name = None

    # -- 좌표 캐시 (같은 video 반복 시 landmark 추출 ~13s 스킵) --
    a.use_saved_coord = os.environ.get("MUSETALK_USE_SAVED_COORD", "1") == "1"
    a.saved_coord = a.use_saved_coord

    # -- 정밀도 / 모델 버전 --
    a.use_float16 = True
    a.parsing_mode = "jaw"
    a.left_cheek_width = 90
    a.right_cheek_width = 90
    a.version = "v15"

    # -- mp4 출력 skip (prethird 는 frame_callback 으로 받으므로 디스크 IO 불필요) --
    a.skip_mp4_output = True

    return a


class MuseTalkInproc:
    """musetalk 모델을 prethird 프로세스에 자체 로드 (포트 8300과 별개 인스턴스, GPU 공유).

    사용 흐름:
        mt = MuseTalkInproc(video_path="/path/to/clone.mp4")
        mt.load()   # 모델 1회 적재 (~30s)
        n = mt.infer("/path/to/speech.wav", on_frame=video_track.push_ndarray)

    on_frame 은 rgb24 ndarray 를 받는다. AvatarVideoTrack.push_ndarray 는 논블로킹 큐
    적재라서 단순 동기 호출로 안전하다 (ThreadPoolExecutor 과설계 불필요).
    """

    def __init__(self, video_path: str) -> None:
        self.video_path = video_path
        self._args: argparse.Namespace | None = None
        self._models: object | None = None
        self._loaded = False

    # ------------------------------------------------------------------
    # load()
    # ------------------------------------------------------------------

    def load(self) -> None:
        """args 구성 + inference_lib.load_models(args) 로 모델 1회 적재.

        SOURCE_DIR 을 CWD 및 sys.path 에 추가해 inference_lib 의 상대 경로 가정
        (./models/, ./ffmpeg-4.4-amd64-static/, configs/inference/) 을 충족한다.
        """
        # CWD 강제 (inference_lib 이 SOURCE_DIR 기준 상대 경로 사용)
        os.chdir(SOURCE_DIR)
        if str(SOURCE_DIR) not in sys.path:
            sys.path.insert(0, str(SOURCE_DIR))
        if str(SOURCE_DIR / "scripts") not in sys.path:
            sys.path.insert(0, str(SOURCE_DIR / "scripts"))

        # prethird scripts/ 디렉토리의 inference_lib.py (복제본) 를 우선 사용
        _scripts_dir = str(Path(__file__).parent)
        if _scripts_dir not in sys.path:
            sys.path.insert(0, _scripts_dir)

        import inference_lib  # type: ignore  # noqa: PLC0415

        args = _default_args(self.video_path)

        # prethird 전용 출력 디렉토리 사전 생성 (8300 outputs/ 와 원천 분리)
        PRETHIRD_OUTPUTS.mkdir(parents=True, exist_ok=True)
        RESULT_DIR.mkdir(parents=True, exist_ok=True)

        print(f"[MuseTalkInproc] load_models start (gpu_id={args.gpu_id})", flush=True)
        t0 = time.time()
        self._models = inference_lib.load_models(args)
        self._args = args
        self._loaded = True
        elapsed_ms = int((time.time() - t0) * 1000)
        print(f"[MuseTalkInproc] load_models done in {elapsed_ms} ms", flush=True)

    # ------------------------------------------------------------------
    # infer()
    # ------------------------------------------------------------------

    def infer(
        self,
        wav_path: str,
        on_frame: Callable,
        video_path: str | None = None,
    ) -> int:
        """wav_path 음성 → frame 생성 즉시 on_frame(rgb_ndarray) 호출.

        Args:
            wav_path: 추론할 wav 파일 경로.
            on_frame: RGB ndarray 를 받는 콜백. AvatarVideoTrack.push_ndarray 와 호환.
            video_path: 이 호출에서만 사용할 클론 영상 경로. 생략 시 self.video_path(기본 halbae).
                        모델(self._models)은 재로드하지 않는다. 좌표 캐시는 video stem 별 자동.

        Returns:
            총 프레임 수 (frame_callback 호출 횟수).

        Raises:
            RuntimeError: load() 를 먼저 호출하지 않은 경우.
        """
        if not self._loaded or self._args is None or self._models is None:
            raise RuntimeError("MuseTalkInproc.load() 를 먼저 호출하세요.")

        import numpy as np  # noqa: PLC0415
        import inference_lib  # type: ignore  # noqa: PLC0415
        import yaml  # noqa: PLC0415

        wav_path_obj = Path(wav_path).resolve()
        # video_path 인자 우선, 생략 시 self.video_path(기본 halbae) 사용
        vp = video_path if video_path is not None else self.video_path
        video_path_obj = Path(vp).resolve()

        # per-call yaml config (musetalk_server.infer() 와 동일한 방식)
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        # PRETHIRD_OUTPUTS(pkl 부모) + RESULT_DIR(v15 하위) 모두 생성.
        # inference_lib 이 result_dir/../ 에 coord/latent/mask pkl 을 쓰므로
        # 부모(PRETHIRD_OUTPUTS)도 미리 확보한다.
        PRETHIRD_OUTPUTS.mkdir(parents=True, exist_ok=True)
        RESULT_DIR.mkdir(parents=True, exist_ok=True)

        safe_id = f"prethird_{int(time.time() * 1000)}"
        cfg_path = CONFIG_DIR / f"runtime_{safe_id}.yaml"
        cfg_data = {
            "task_0": {
                "video_path": str(video_path_obj),
                "audio_path": str(wav_path_obj),
                "bbox_shift": int(self._args.bbox_shift),
            }
        }
        cfg_path.write_text(yaml.safe_dump(cfg_data, allow_unicode=True), encoding="utf-8")

        # per-call args 업데이트
        self._args.audio_path = str(wav_path_obj)
        self._args.video_path = str(video_path_obj)
        self._args.inference_config = str(cfg_path)
        self._args.result_dir = str(RESULT_DIR)
        self._args.skip_mp4_output = True  # 디스크 IO 없음

        # 프레임 카운터
        _frame_count = [0]

        def _cb(idx: int, bgr) -> None:
            """inference_lib frame_callback 시그니처: (idx: int, combine_frame: BGR ndarray).
            BGR→RGB 변환 후 on_frame 호출.
            """
            # bgr[:, :, ::-1]: BGR → RGB (채널 순서 뒤집기)
            # np.ascontiguousarray: VideoFrame.from_ndarray 가 연속 메모리 배열 기대
            rgb = np.ascontiguousarray(bgr[:, :, ::-1])
            on_frame(rgb)
            _frame_count[0] += 1

        _timing: dict = {}
        try:
            inference_lib.run_inference(
                self._args,
                self._models,
                frame_callback=_cb,
                timing_out=_timing,
            )
        finally:
            # cfg 정리 (실패해도 시도)
            try:
                cfg_path.unlink(missing_ok=True)
            except Exception:
                pass

        print(
            f"[MuseTalkInproc] infer done frames={_frame_count[0]} "
            f"phase_ms={_timing}",
            flush=True,
        )
        return _frame_count[0]
