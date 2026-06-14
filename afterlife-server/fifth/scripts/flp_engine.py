"""
FifthFLPEngine — FasterLivePortrait lip retargeting 래퍼.

주의: FasterLivePortrait repo 루트(/root/FasterLivePortrait)에서 import 가능해야 함.
PoC 검증본: /data/afterlife/fifth-poc/FasterLivePortrait/t068_tune.py 기반 모듈화.

v2 변경 (2장 base 블렌드 지원):
  - load_source() 가 source 상태를 dict로 반환하도록 변경 (self에도 저장 유지 — 하위호환).
  - render() 가 src_img/src_info 를 선택 인자로 받아 source를 주입 가능하게 변경.
  - 블렌드 모드에서 pipe 1개를 공유하며 closed/open source를 스왑 렌더 (VRAM 절약).
  - first_frame 은 source별로 독립 관리 (호출부 책임).
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
        # 기본 source 상태 (하위호환 — 단일 source 경로에서 사용)
        self.src_img = None
        self.src_info = None

    def load_source(self, src_path: str) -> dict:
        """소스 이미지(사진 1장) 로드 및 얼굴 검출 준비.

        source lmk에서 입 닫힘 baseline을 동적으로 실측해 반환한다.

        v2: dict 반환으로 변경. dict 키:
            - "src_img": FLP 소스 이미지 텐서
            - "src_info": FLP 소스 정보 튜플
            - "lip_close_ratio": float (실측 실패 시 0.0)

        하위호환: self.src_img / self.src_info 도 갱신 (단일 source 경로용).
        단일 source 경로에서는 반환값을 float로 사용하던 호출부가 있으므로
        render_offline.py 호출부도 함께 수정 (float(d["lip_close_ratio"]) 사용).

        PoC 패턴: t068_tune.py L46~L47 (calc_lip_close_ratio 호출 방식 동일)
        src_info[0][1]: 인덱스 1 = source_lmk (FLP prepare_source 계약, PoC 검증)

        Args:
            src_path: 소스 이미지 절대 경로 (JPEG/PNG).

        Returns:
            dict: {"src_img": ..., "src_info": ..., "lip_close_ratio": float}

        Raises:
            AssertionError: 얼굴 검출 실패 시.
        """
        assert self.pipe.prepare_source(src_path, realtime=True), (
            f"face detect fail: {src_path}"
        )
        src_img = self.pipe.src_imgs[0]
        src_info = self.pipe.src_infos[0]

        # 하위호환: self에도 저장
        self.src_img = src_img
        self.src_info = src_info

        # C-1 가드: src_info[0][1] 접근 전 계약 검증
        # 인덱스 1 = source_lmk (FLP prepare_source 계약, PoC t068_tune.py L46 검증)
        assert len(src_info[0]) > 1, "src_info lmk 인덱스 계약 위반"
        source_lmk = src_info[0][1]

        try:
            from src.utils.utils import calc_lip_close_ratio

            lip_close_ratio = float(calc_lip_close_ratio(source_lmk[None])[0, 0])
            print(f"[flp_engine] load_source({src_path!r}) dynamic lip_close_ratio={lip_close_ratio:.4f}", flush=True)
        except Exception as e:
            print(f"[flp_engine] calc_lip_close_ratio 실패({e}) → 0.0 반환 (호출부 폴백 처리)", flush=True)
            lip_close_ratio = 0.0

        return {
            "src_img": src_img,
            "src_info": src_info,
            "lip_close_ratio": lip_close_ratio,
        }

    def render(
        self,
        joy_motion,
        c_eyes,
        c_d_lip: float,
        first_frame: bool = False,
        src_img=None,
        src_info=None,
    ):
        """c_d_lip 값으로 입 벌림을 구동해 RGB 프레임 반환.

        v2: src_img / src_info 를 선택 인자로 받아 source를 주입 가능하게 변경.
        None이면 self.src_img / self.src_info (단일 source 경로 하위호환).

        Args:
            joy_motion: JoyVASA 헤드/눈 motion dict (pipeline motion_sequence 원소).
            c_eyes: JoyVASA c_eyes 값 (없으면 None).
            c_d_lip: 입 벌림 float (0.0=닫힘, 0.8~=최대).
            first_frame: 첫 프레임 여부 (FLP 내부 상태 초기화). source별로 독립 관리 필요.
            src_img: (선택) source 이미지 텐서. None이면 self.src_img 사용.
            src_info: (선택) source 정보 튜플. None이면 self.src_info 사용.

        Returns:
            np.ndarray (H, W, 3) RGB 프레임, 실패 시 None.
        """
        _src_img = src_img if src_img is not None else self.src_img
        _src_info = src_info if src_info is not None else self.src_info

        m = copy.deepcopy(joy_motion)
        frame_info = [m, c_eyes, [float(c_d_lip)]]
        result = self.pipe.run_with_pkl(
            frame_info, _src_img, _src_info, first_frame=first_frame
        )
        return result[0] if result else None
