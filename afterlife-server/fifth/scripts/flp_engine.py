"""
FifthFLPEngine — FasterLivePortrait lip retargeting 래퍼.

주의: FasterLivePortrait repo 루트(/root/FasterLivePortrait)에서 import 가능해야 함.
PoC 검증본: /data/afterlife/fifth-poc/FasterLivePortrait/t068_tune.py 기반 모듈화.
"""
import copy

from omegaconf import OmegaConf


class FifthFLPEngine:
    """FasterLivePortrait lip retargeting 엔진 래퍼.

    load_source()로 사진 1장 base 준비, render()로 c_d_lip 구동 프레임 생성.

    Args:
        cfg_yaml: FasterLivePortrait configs yaml 경로 (예: configs/trt_infer.yaml).
        joyvasa_cfg_scale: JoyVASA motion cfg_scale (기본 2.8, PoC 검증값).
    """

    def __init__(self, cfg_yaml: str, joyvasa_cfg_scale: float = 2.8):
        cfg = OmegaConf.load(cfg_yaml)
        # PoC t068_tune.py 검증 파라미터 고정
        cfg.infer_params.flag_normalize_lip = False
        cfg.infer_params.flag_lip_retargeting = True
        cfg.infer_params.flag_eye_retargeting = False
        cfg.infer_params.driving_multiplier = 1.0
        cfg.infer_params.animation_region = "all"
        cfg.infer_params.flag_stitching = True
        cfg.infer_params.flag_relative_motion = True

        from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline

        self._cfg = cfg
        self._joyvasa_cfg_scale = joyvasa_cfg_scale
        self.pipe = FasterLivePortraitPipeline(cfg=cfg)
        self.src_img = None
        self.src_info = None

    def load_source(self, src_path: str) -> None:
        """소스 이미지(사진 1장) 로드 및 얼굴 검출 준비.

        Args:
            src_path: 소스 이미지 절대 경로 (JPEG/PNG).

        Raises:
            AssertionError: 얼굴 검출 실패 시.
        """
        assert self.pipe.prepare_source(src_path, realtime=True), (
            f"face detect fail: {src_path}"
        )
        self.src_img = self.pipe.src_imgs[0]
        self.src_info = self.pipe.src_infos[0]

    def render(self, joy_motion, c_eyes, c_d_lip: float, first_frame: bool = False):
        """c_d_lip 값으로 입 벌림을 구동해 RGB 프레임 반환.

        Args:
            joy_motion: JoyVASA 헤드/눈 motion dict (pipeline motion_sequence 원소).
            c_eyes: JoyVASA c_eyes 값 (없으면 None).
            c_d_lip: 입 벌림 float (0.0=닫힘, 0.8~=최대).
            first_frame: 첫 프레임 여부 (FLP 내부 상태 초기화).

        Returns:
            np.ndarray (H, W, 3) RGB 프레임, 실패 시 None.
        """
        m = copy.deepcopy(joy_motion)
        frame_info = [m, c_eyes, [float(c_d_lip)]]
        result = self.pipe.run_with_pkl(
            frame_info, self.src_img, self.src_info, first_frame=first_frame
        )
        return result[0] if result else None
