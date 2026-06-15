"""
FifthFLPEngine — FasterLivePortrait lip retargeting 래퍼.

주의: FasterLivePortrait repo 루트(/root/FasterLivePortrait)에서 import 가능해야 함.
PoC 검증본: /data/afterlife/fifth-poc/FasterLivePortrait/t068_tune.py 기반 모듈화.

v2 변경 (2장 base 블렌드 지원):
  - load_source() 가 source 상태를 dict로 반환하도록 변경 (self에도 저장 유지 — 하위호환).
  - render() 가 src_img/src_info 를 선택 인자로 받아 source를 주입 가능하게 변경.
  - 블렌드 모드에서 pipe 1개를 공유하며 closed/open source를 스왑 렌더 (VRAM 절약).
  - first_frame 은 source별로 독립 관리 (호출부 책임).

v3 변경 (JoyVASA 머리/표정 motion 복원):
  - flag_relative_motion=True + flag_lip_retargeting=True 조합의 버그 발견:
    FLP _run() 459행에서 flag_relative_motion=True 분기는 x_d_i_new를 x_s로 리셋 후
    lip_delta만 더해 JoyVASA motion(R, exp)이 완전히 버려짐 → 표정/머리 고정.
  - 수정: flag_relative_motion=False. 이 경로는 R_d_i(JoyVASA 절대 rotation)를 직접 사용
    + x_d_i_new에 lip_delta를 더함 → JoyVASA 머리/표정 + RMS 입싱크 동시 작동.
  - E1(cfg_scale=2.8, multiplier=1.0) 시각 검증: 머리 미세 자연 움직임 O, 표정 O, 입싱크 O.
  - E2(cfg_scale=3.5) 더 강한 머리/표정. FIFTH_CFG_SCALE 환경변수로 조절 가능.
  - E3(multiplier=1.5) 과함 → 기본 1.0 유지, FIFTH_DRIVING_MULTIPLIER 로 조절.

v4 변경 (블렌드 jitter 제거 — B1 방식):
  - align_source_to_ref() 추가: closed_src 를 open_src 의 crop box(M_o2c)로 강제 재크롭.
  - 두 source 가 동일한 공간 기준(픽셀 scale + translation)을 갖게 되어 블렌드 시
    얼굴 크기/위치 널뛰기(jitter) 제거.
  - 진단(diag_crop_align.py) 실측: closed M_c2o_s=0.8662 vs open=0.9340 (ratio=0.9274, 차이 7.3%)
    tx diff 18.5px · ty diff 16.2px → 블렌드 시 얼굴 크기/위치 달라짐 확인.
  - 해결: open_src M_o2c 로 closed_src 재크롭 → M_c2o 통일 → 크기/위치 일치.
"""
import copy
import os

import cv2
import numpy as np
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

        # --- motion 파라미터 (환경변수 오버라이드 가능) ---
        # FIFTH_CFG_SCALE: JoyVASA motion 강도. 2.8(기본, 미세 움직임) / 3.5(더 강한 표정).
        _cfg_scale = float(os.environ.get("FIFTH_CFG_SCALE", str(joyvasa_cfg_scale)))
        # FIFTH_DRIVING_MULTIPLIER: FLP driving 배율. 1.0 기본 (1.5 이상이면 과함).
        _driving_multiplier = float(os.environ.get("FIFTH_DRIVING_MULTIPLIER", "1.0"))

        cfg.infer_params.flag_normalize_lip = False
        cfg.infer_params.flag_lip_retargeting = True
        cfg.infer_params.flag_eye_retargeting = False
        cfg.infer_params.driving_multiplier = _driving_multiplier
        cfg.infer_params.animation_region = "all"
        cfg.infer_params.flag_stitching = True
        # v3 수정: False로 변경.
        # True 시 flag_lip_retargeting=True 분기에서 JoyVASA motion(R, exp, delta_new)이 버려지고
        # x_s + lip_delta 만 남아 머리/표정이 고정됨 (FLP _run() L459 버그).
        # False 시: R_d_i 절대 rotation + x_d_i_new(exp 포함)에 lip_delta 가산 → 정상 동작.
        cfg.infer_params.flag_relative_motion = False

        from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline

        self._cfg = cfg
        self._joyvasa_cfg_scale = _cfg_scale
        print(
            f"[flp_engine] flag_relative_motion=False  cfg_scale={_cfg_scale}  "
            f"driving_multiplier={_driving_multiplier}",
            flush=True,
        )
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

    def align_source_to_ref(self, target_s: dict, ref_s: dict) -> dict:
        """target source를 ref source의 crop box(M_o2c)로 강제 재크롭해 정렬.

        B1 방식 jitter 제거: 두 source가 독립적으로 prepare_source되면 각자
        landmark 기반 M_o2c(crop box)가 달라져 출력 얼굴 크기/위치가 다름.
        이를 ref_s 기준 M_o2c로 target_s 이미지를 재크롭해 src_info를 새로 구성.

        진단 실측 (gominju closed vs open):
          M_c2o scale ratio = 0.9274 (7.3% 차이), tx=18.5px, ty=16.2px
          → w 0↔1 전환 시 얼굴 7.3% 크기 도약 = 널뛰기 근본 원인

        Args:
            target_s: align 대상 source dict (load_source 반환값, 보통 closed_s).
            ref_s:    기준 source dict (load_source 반환값, 보통 open_s).

        Returns:
            새 source dict: ref 기준으로 재크롭된 src_img + 재계산된 src_info.
            실패(얼굴 검출 실패 포함) 시 target_s 원본 반환 + 경고 출력.
        """
        import torch

        try:
            # ref_s 의 M_c2o (crop→original) → invert → M_o2c (original→crop)
            # src_info 마지막 원소 = M tensor (torch)
            ref_info = ref_s["src_info"][0]
            M_c2o_tensor = ref_info[-1]  # torch.Tensor shape (3,3)
            M_c2o_np = M_c2o_tensor.cpu().numpy()
            M_o2c_np = np.linalg.inv(M_c2o_np)  # original→crop

            # target 원본 이미지 (RGB ndarray)
            tgt_img_rgb = target_s["src_img"]  # (H,W,3)

            # ref 기준 dsize 추출 (M_o2c scale로부터)
            # M_o2c[0,0] ≈ s (scale factor: pixel/crop_unit)
            # crop dsize 는 파이프 cfg에서 — 기본 512
            dsize = self._cfg.crop_params.src_dsize  # 보통 512

            # target 이미지에 ref M_o2c 적용 → 재크롭 (2x3 affine)
            M_o2c_2x3 = M_o2c_np[:2, :]
            img_crop = cv2.warpAffine(
                tgt_img_rgb,
                M_o2c_2x3,
                (dsize, dsize),
                flags=cv2.INTER_LINEAR,
                borderMode=cv2.BORDER_CONSTANT,
                borderValue=(0, 0, 0),
            )
            img_crop_256 = cv2.resize(img_crop, (256, 256), interpolation=cv2.INTER_AREA)

            # lmk 변환 (target의 정밀 lmk를 ref M_o2c 공간으로 변환)
            tgt_info = target_s["src_info"][0]
            src_lmk_orig = tgt_info[1]  # (N,2) crop 좌표계 lmk
            # target의 M_c2o로 crop→original로 역변환 후, ref M_o2c로 crop으로 변환
            M_tgt_c2o = tgt_info[-1].cpu().numpy()
            # lmk: crop 좌표계 → 원본 좌표계
            ones = np.ones((src_lmk_orig.shape[0], 1))
            lmk_h = np.hstack([src_lmk_orig, ones])  # (N,3)
            lmk_orig = (M_tgt_c2o @ lmk_h.T).T[:, :2]  # (N,2) 원본
            # 원본 → ref crop 좌표계
            lmk_ref_crop = (M_o2c_np @ np.hstack([lmk_orig, ones]).T).T[:, :2]  # (N,2)

            # motion_extractor로 재계산
            pitch, yaw, roll, t, exp, scale, kp = self.pipe.model_dict["motion_extractor"].predict(img_crop_256)
            from src.utils.utils import get_rotation_matrix, transform_keypoint
            x_s_info = {
                "pitch": pitch, "yaw": yaw, "roll": roll,
                "t": t, "exp": exp, "scale": scale, "kp": kp,
            }
            R_s = get_rotation_matrix(pitch, yaw, roll)
            f_s = self.pipe.model_dict["app_feat_extractor"].predict(img_crop_256)
            x_s = transform_keypoint(pitch, yaw, roll, t, exp, scale, kp)
            x_c_s = kp

            # stitching 사전 lip_delta (flag_normalize_lip=False 이므로 None)
            lip_delta = None
            flag_lip_zero = False

            # mask_ori_float — ref 기준 M_c2o 재사용
            device = M_c2o_tensor.device
            mask_ori_float = None
            if (self._cfg.infer_params.flag_pasteback
                    and self._cfg.infer_params.flag_do_crop
                    and self._cfg.infer_params.flag_stitching):
                from src.utils.crop import prepare_paste_back
                mask_ori_float_np = prepare_paste_back(
                    self.pipe.mask_crop,
                    M_c2o_np,
                    dsize=(tgt_img_rgb.shape[1], tgt_img_rgb.shape[0]),
                )
                mask_ori_float = torch.from_numpy(mask_ori_float_np).to(device)

            M_c2o_tensor_new = torch.from_numpy(M_c2o_np).to(device)

            # src_info 재조립 (prepare_source 계약과 동일한 순서)
            # [x_s_info, source_lmk, R_s, f_s, x_s, x_c_s, lip_delta, flag_lip_zero,
            #  mask_ori_float, M_c2o]
            new_src_info_face = [
                copy.deepcopy(x_s_info),
                lmk_ref_crop.copy(),
                R_s.copy(),
                f_s.copy(),
                x_s.copy(),
                x_c_s.copy(),
                lip_delta,
                flag_lip_zero,
                mask_ori_float,
                M_c2o_tensor_new,
            ]

            # lip_close_ratio 재계산 (새 lmk 기준)
            lip_close_ratio = target_s["lip_close_ratio"]  # 폴백: 원본값 유지
            try:
                from src.utils.utils import calc_lip_close_ratio
                lip_close_ratio = float(calc_lip_close_ratio(lmk_ref_crop[None])[0, 0])
            except Exception as e:
                print(f"[align_source_to_ref] lip_close_ratio 재계산 실패({e}), 원본값 유지", flush=True)

            print(
                f"[align_source_to_ref] DONE  "
                f"ref_M_c2o_s={np.linalg.norm(M_c2o_np[0,:2]):.4f}  "
                f"lip_close_ratio={lip_close_ratio:.4f}",
                flush=True,
            )

            return {
                "src_img": tgt_img_rgb,  # 원본 이미지 (M_o2c로 재크롭은 src_info에 반영)
                "src_info": [new_src_info_face],
                "lip_close_ratio": lip_close_ratio,
            }

        except Exception as e:
            import traceback
            print(f"[align_source_to_ref] 실패({e}), target_s 원본 반환 (jitter 제거 미적용)", flush=True)
            traceback.print_exc()
            return target_s

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
