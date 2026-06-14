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

    def load_source(self, src_path: str) -> float:
        """소스 이미지(사진 1장) 로드 및 얼굴 검출 준비.

        source lmk에서 입 닫힘 baseline을 동적으로 실측해 반환한다.
        반환값은 c_d_lip lower bound(lip_closed)로 사용.
        고정값(0.0023) 대신 실제 소스 얼굴의 입 상태를 반영하므로
        c_d_lip 범위 과확장 → 치아 stretch 완화.

        PoC 패턴: t068_tune.py L46~L47 (calc_lip_close_ratio 호출 방식 동일)
        src_info[0][1]: 인덱스 1 = source_lmk (FLP prepare_source 계약, PoC 검증)

        Args:
            src_path: 소스 이미지 절대 경로 (JPEG/PNG).

        Returns:
            float: source lmk 기반 lip_close_ratio. 실측 실패 시 0.0 반환 (호출부에서 폴백 처리).

        Raises:
            AssertionError: 얼굴 검출 실패 시.
        """
        assert self.pipe.prepare_source(src_path, realtime=True), (
            f"face detect fail: {src_path}"
        )
        self.src_img = self.pipe.src_imgs[0]
        self.src_info = self.pipe.src_infos[0]

        # C-1 가드: src_info[0][1] 접근 전 계약 검증
        # 인덱스 1 = source_lmk (FLP prepare_source 계약, PoC t068_tune.py L46 검증)
        assert len(self.src_info[0]) > 1, "src_info lmk 인덱스 계약 위반"
        source_lmk = self.src_info[0][1]

        try:
            from src.utils.utils import calc_lip_close_ratio

            lip_close_ratio = float(calc_lip_close_ratio(source_lmk[None])[0, 0])
            print(f"[flp_engine] dynamic lip_close_ratio={lip_close_ratio:.4f}", flush=True)
            return lip_close_ratio
        except Exception as e:
            print(f"[flp_engine] calc_lip_close_ratio 실패({e}) → 0.0 반환 (호출부 폴백 처리)", flush=True)
            return 0.0

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
