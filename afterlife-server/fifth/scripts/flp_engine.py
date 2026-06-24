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

v5 변경 (B2 landmark affine 정렬):
  - align_source_to_ref(mode="affine") 추가: crop box 재크롭(B1) 대신 얼굴 landmark
    similarity transform으로 closed_src를 open_src 얼굴 위치/크기/구도에 정밀 정렬.
  - 정렬 포인트: 양 눈 중심 + 코끝 3점 (입 landmark 제외 — 입은 구동 대상).
    cv2.estimateAffinePartial2D (similarity: 회전+스케일+이동, 4DOF) 사용.
  - 효과: B1의 "crop box 재크롭"보다 정밀 — 눈·코 기준 scale·rotation·position 일치.
    closed_src 얼굴 작아보임 + 구도 차이 해결. 잔여 jitter 추가 감소 기대.
  - align_source_to_ref()에 mode 파라미터 추가: "crop"(B1, 기본), "affine"(B2).
  - 회귀 안전: mode="crop" 경로 무변경. render_offline.py --align-mode 옵션으로 선택.
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
        # FIFTH_BLINK=1(기본) 시 눈 깜빡임 주입 위해 True 로 설정.
        # False 이면 c_eyes 값이 _run() 분기에서 완전 무시됨.
        # True + flag_relative_motion=False 조합: JoyVASA 머리/표정 유지 + 눈 재타겟팅 동시 작동.
        _blink_enabled = os.environ.get("FIFTH_BLINK", "1") == "1"
        cfg.infer_params.flag_eye_retargeting = _blink_enabled
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
            f"driving_multiplier={_driving_multiplier}  flag_eye_retargeting={_blink_enabled}",
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

    # ------------------------------------------------------------------
    # 내부 헬퍼: landmark에서 눈·코 안정 포인트 추출
    # ------------------------------------------------------------------
    @staticmethod
    def _stable_lmk_pts(lmk: np.ndarray) -> np.ndarray:
        """landmark 배열에서 입 제외 안정 포인트(눈 중심 2점 + 코끝 1점) 추출.

        FasterLivePortrait source_lmk 실측 계약 (203점, gominju 실측 2026-06-15):
          - 0~23: 좌눈(이미지 기준 x 작은 쪽) 윤곽 → 평균 = 좌눈 중심
          - 24~47: 우눈(이미지 기준 x 큰 쪽) 윤곽 → 평균 = 우눈 중심
          - 48~107: 입 윤곽 (완전 제외 — 구동 대상)
          - 108~144: 얼굴 윤곽선 (외곽)
          - 145~184: 눈썹
          - 185~202: 코·코 주변 / 201 ≈ 코끝 (y≈464)

        3점 similarity: 좌눈 중심, 우눈 중심, 코끝 (입 완전 제외).

        Returns:
            (3, 2) float32 — [left_eye_center, right_eye_center, nose_tip]
        """
        n = lmk.shape[0]
        if n >= 203:
            # FLP 203점 실측 인덱스
            left_eye = lmk[0:24].mean(axis=0).astype(np.float32)   # 좌눈 윤곽 평균
            right_eye = lmk[24:48].mean(axis=0).astype(np.float32)  # 우눈 윤곽 평균
            nose = lmk[201].astype(np.float32)                       # 코끝 (실측 y≈464)
        elif n >= 106:
            # 106점 서브셋 — 눈 대략 0~35(좌눈), 36~71(우눈), 코: 80~86
            left_eye = lmk[0:18].mean(axis=0).astype(np.float32)
            right_eye = lmk[36:54].mean(axis=0).astype(np.float32)
            nose = lmk[86].astype(np.float32) if n > 86 else lmk[n 
        else:
            # 최소 5점 (dlib 5-point: 0=좌눈, 1=좌눈, 2=우눈, 3=우눈, 4=코)
            left_eye = ((lmk[0] + lmk[1]) / 2).astype(np.float32)
            right_eye = ((lmk[2] + lmk[3]) / 2).astype(np.float32)
            nose = lmk[4].astype(np.float32) if n > 4 else lmk[n - 1].astype(np.float32)
        return np.stack([left_eye, right_eye, nose], axis=0)  # (3,2)

    def align_source_to_ref(self, target_s: dict, ref_s: dict, mode: str = "crop") -> dict:
        """target source를 ref source 기준으로 정렬.

        B1 (mode="crop"): ref_s 의 crop box(M_o2c)로 target_s 이미지를 강제 재크롭.
        B2 (mode="affine"): ref_s 얼굴 landmark(눈·코 3점)에 target_s를 similarity
          transform으로 정렬 → 얼굴 크기·구도를 open_src 기준으로 정밀 일치.
          입 landmark는 구동 대상이므로 완전 제외.

        B2 상세:
          1. ref_s lmk (crop 좌표) → 눈 중심·코끝 3점 추출.
          2. target_s lmk (crop 좌표) → 동일 3점 추출.
          3. cv2.estimateAffinePartial2D (similarity: 스케일·회전·이동)로 변환 추정.
          4. target 재크롭 이미지(B1 방식)에 추가로 해당 similarity warp 적용.
             → ref 기준 눈·코 포인트와 target이 픽셀 정밀 정렬.
          5. motion_extractor 재계산 + src_info 재조립.

        Args:
            target_s: align 대상 source dict (load_source 반환값, 보통 closed_s).
            ref_s:    기준 source dict (load_source 반환값, 보통 open_s).
            mode:     "crop" (B1, 기본) | "affine" (B2 landmark similarity).

        Returns:
            새 source dict: 정렬된 src_img + 재계산된 src_info.
            실패 시 target_s 원본 반환 + 경고 출력.
        """
        import torch

        try:
            # -------------------------------------------------------
            # 공통 준비: ref M_c2o / M_o2c
            # -------------------------------------------------------
            ref_info = ref_s["src_info"][0]
            M_c2o_tensor = ref_info[-1]  # torch.Tensor (3,3)
            M_c2o_np = M_c2o_tensor.cpu().numpy()
            M_o2c_np = np.linalg.inv(M_c2o_np)

            tgt_img_rgb = target_s["src_img"]  # (H,W,3)
            dsize = self._cfg.crop_params.src_dsize  # 보통 512

            # -------------------------------------------------------
            # Step 1: B1과 동일하게 ref M_o2c로 target 재크롭
            # -------------------------------------------------------
            M_o2c_2x3 = M_o2c_np[:2, :]
            img_crop_b1 = cv2.warpAffine(
                tgt_img_rgb,
                M_o2c_2x3,
                (dsize, dsize),
                flags=cv2.INTER_LINEAR,
                borderMode=cv2.BORDER_CONSTANT,
                borderValue=(0, 0, 0),
            )

            # -------------------------------------------------------
            # Step 2 (B2 전용): lmk 기반 similarity warp 추가 적용
            # -------------------------------------------------------
            if mode == "affine":
                # ref lmk (crop 좌표계)
                ref_lmk_crop = ref_info[1]  # (N,2)
                # target lmk (crop 좌표계) → ref M_o2c 공간으로 변환
                tgt_info = target_s["src_info"][0]
                tgt_lmk_crop = tgt_info[1]  # (N,2) target의 자기 crop 좌표
                M_tgt_c2o = tgt_info[-1].cpu().numpy()
                ones = np.ones((tgt_lmk_crop.shape[0], 1))
                lmk_h = np.hstack([tgt_lmk_crop, ones])
                lmk_tgt_orig = (M_tgt_c2o @ lmk_h.T).T[:, :2]  # (N,2) 원본
                # 원본 → ref crop 좌표계
                ones2 = np.ones((lmk_tgt_orig.shape[0], 1))
                lmk_tgt_ref_crop = (M_o2c_np @ np.hstack([lmk_tgt_orig, ones2]).T).T[:, :2]

                # 안정 포인트 추출 (3점: 좌눈·우눈·코끝, 입 제외)
                pts_ref = self._stable_lmk_pts(ref_lmk_crop)    # (3,2) dst
                pts_tgt = self._stable_lmk_pts(lmk_tgt_ref_crop)  # (3,2) src

                # similarity transform 추정 (4DOF: 스케일·회전·이동)
                M_sim, inliers = cv2.estimateAffinePartial2D(
                    pts_tgt.reshape(-1, 1, 2).astype(np.float32),
                    pts_ref.reshape(-1, 1, 2).astype(np.float32),
                    method=cv2.LMEDS,
                )
                if M_sim is None:
                    # 추정 실패 → RANSAC fallback
                    M_sim, _ = cv2.estimateAffinePartial2D(
                        pts_tgt.reshape(-1, 1, 2).astype(np.float32),
                        pts_ref.reshape(-1, 1, 2).astype(np.float32),
                        method=cv2.RANSAC,
                        ransacReprojThreshold=4.0,
                    )

                if M_sim is not None:
                    # similarity warp 적용: B1 재크롭 이미지에 추가 정렬
                    img_crop_b2 = cv2.warpAffine(
                        img_crop_b1,
                        M_sim,
                        (dsize, dsize),
                        flags=cv2.INTER_LINEAR,
                        borderMode=cv2.BORDER_REFLECT_101,
                    )
                    # sim 스케일 로그
                    sim_scale = np.sqrt(M_sim[0, 0] ** 2 + M_sim[0, 1] ** 2)
                    sim_angle = np.degrees(np.arctan2(M_sim[1, 0], M_sim[0, 0]))
                    print(
                        f"[align_source_to_ref/B2] sim_scale={sim_scale:.4f}  "
                        f"sim_angle={sim_angle:.2f}deg  "
                        f"tx={M_sim[0,2]:.1f} ty={M_sim[1,2]:.1f}",
                        flush=True,
                    )
                    img_crop_aligned = img_crop_b2

                    # lmk도 similarity로 변환 (ref 공간 정렬)
                    ones3 = np.ones((lmk_tgt_ref_crop.shape[0], 1))
                    M_sim_3x3 = np.vstack([M_sim, [0, 0, 1]])
                    lmk_aligned = (M_sim_3x3 @ np.hstack([lmk_tgt_ref_crop, ones3]).T).T[:, :2]
                else:
                    print(
                        "[align_source_to_ref/B2] similarity 추정 실패 → B1 crop 결과 사용",
                        flush=True,
                    )
                    img_crop_aligned = img_crop_b1
                    lmk_aligned = lmk_tgt_ref_crop
            else:
                # B1: crop만
                img_crop_aligned = img_crop_b1
                tgt_info = target_s["src_info"][0]
                tgt_lmk_crop = tgt_info[1]
                M_tgt_c2o = tgt_info[-1].cpu().numpy()
                ones = np.ones((tgt_lmk_crop.shape[0], 1))
                lmk_h = np.hstack([tgt_lmk_crop, ones])
                lmk_tgt_orig = (M_tgt_c2o @ lmk_h.T).T[:, :2]
                ones2 = np.ones((lmk_tgt_orig.shape[0], 1))
                lmk_aligned = (M_o2c_np @ np.hstack([lmk_tgt_orig, ones2]).T).T[:, :2]

            # -------------------------------------------------------
            # Step 3: motion_extractor 재계산
            # -------------------------------------------------------
            img_crop_256 = cv2.resize(img_crop_aligned, (256, 256), interpolation=cv2.INTER_AREA)

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

            lip_delta = None
            flag_lip_zero = False

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

            # src_info 재조립
            new_src_info_face = [
                copy.deepcopy(x_s_info),
                lmk_aligned.copy(),
                R_s.copy(),
                f_s.copy(),
                x_s.copy(),
                x_c_s.copy(),
                lip_delta,
                flag_lip_zero,
                mask_ori_float,
                M_c2o_tensor_new,
            ]

            # lip_close_ratio 재계산
            lip_close_ratio = target_s["lip_close_ratio"]
            try:
                from src.utils.utils import calc_lip_close_ratio
                lip_close_ratio = float(calc_lip_close_ratio(lmk_aligned[None])[0, 0])
            except Exception as e:
                print(f"[align_source_to_ref] lip_close_ratio 재계산 실패({e}), 원본값 유지", flush=True)

            print(
                f"[align_source_to_ref/{mode.upper()}] DONE  "
                f"ref_M_c2o_s={np.linalg.norm(M_c2o_np[0,:2]):.4f}  "
                f"lip_close_ratio={lip_close_ratio:.4f}",
                flush=True,
            )

            return {
                "src_img": tgt_img_rgb,
                "src_info": [new_src_info_face],
                "lip_close_ratio": lip_close_ratio,
            }

        except Exception as e:
            import traceback
            print(f"[align_source_to_ref] 실패({e}), target_s 원본 반환 (jitter 제거 미적용)", flush=True)
            traceback.print_exc()
            return target_s

    def detect_landmarks(self, bgr: np.ndarray):
        """단일 BGR 프레임 → FLP 203점 landmark (원본 이미지 좌표) | None.

        face_source.make_extract_fn 의 detect_lmk 로 주입된다(영상 프레임별 입벌림 스코어용).
        FLP prepare_source 내부 경로와 동일: face_analysis → landmark.predict.

        Returns:
            (203, 2) float32 landmark, 얼굴 미검출 시 None.
        """
        faces = self.pipe.model_dict["face_analysis"].predict(bgr)
        if faces is None or len(faces) == 0:
            return None
        lmk = faces[0]
        img_rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        lmk = self.pipe.model_dict["landmark"].predict(img_rgb, lmk)
        return lmk

    @staticmethod
    def build_mouth_mask(
        lmk: np.ndarray,
        img_size: int = 512,
        dilate_px: int = 28,
        feather_sigma: int = 22,
    ) -> np.ndarray:
        """입 landmark(48~107) 기반 입 영역 마스크 생성.

        FLP 203점 landmark(crop 좌표계) 중 48~107번이 입 윤곽.
        convexHull → fillPoly → dilate → GaussianBlur(feather) → [0,1] float32 마스크.

        Args:
            lmk:          (N,2) float32 — crop 좌표계 landmark (보통 512x512 공간).
            img_size:     출력 마스크 크기 (기본 512).
            dilate_px:    입 hull 바깥 dilate 픽셀 (입꼬리·치아 충분히 커버).
            feather_sigma: GaussianBlur sigma — 경계 feather 부드러움.

        Returns:
            (img_size, img_size, 1) float32 [0,1] — 입 영역 1, 나머지 0.
        """
        mask = np.zeros((img_size, img_size), dtype=np.float32)

        n = lmk.shape[0]
        if n >= 107:
            mouth_pts = lmk[48:107].copy()
        elif n >= 49:
            # 최소 서브셋 — 전체 하단 절반 근사
            mouth_pts = lmk[48:].copy()
        else:
            # 너무 적으면 고정 타원 폴백
            cx, cy = img_size 
            cv2.ellipse(mask, (cx, cy), (int(img_size * 0.22), int(img_size * 0.10)), 0, 0, 360, 1.0, -1)
            ksize = feather_sigma * 6 + 1 if (feather_sigma * 6 + 1) % 2 == 1 else feather_sigma * 6 + 2
            mask = cv2.GaussianBlur(mask, (ksize, ksize), feather_sigma)
            return mask[:, :, np.newaxis]

        pts_int = np.round(mouth_pts).astype(np.int32)
        hull = cv2.convexHull(pts_int.reshape(-1, 1, 2))
        cv2.fillConvexPoly(mask, hull.reshape(-1, 2), 1.0)

        # dilate — 입꼬리·치아 영역 충분히 포함
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilate_px * 2 + 1, dilate_px * 2 + 1))
        mask = cv2.dilate(mask, kernel)

        # GaussianBlur feather — 경계 부드럽게 (sigma 충분히)
        ksize = feather_sigma * 6 + 1
        if ksize % 2 == 0:
            ksize += 1
        mask = cv2.GaussianBlur(mask, (ksize, ksize), feather_sigma)
        mask = np.clip(mask, 0.0, 1.0)

        return mask[:, :, np.newaxis]  # (H,W,1)

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
        if result is None:
            return None
        # FIFTH_PASTEBACK_OUTPUT=1(기본): paste-back된 원본 비율 프레임(result[1]) 반환
        #   → 입력 정규화 비율(세로 1:2/9:16) 유지. 통화 영상이 정사각 crop이 아닌 원본 비율로 송출됨.
        # =0: 기존 crop 정사각(512x512, result[0]) 반환(회귀).
        # ⚠️ result[1] paste-back은 컨테이너 FLP pipeline(faster_live_portrait_pipeline.py)의
        #   realtime 가드 제거가 선행되어야 유효(배포 스크립트 _deploy_pasteback_patch.sh 참조).
        if os.environ.get("FIFTH_PASTEBACK_OUTPUT", "1") == "1":
            return result[1]
        return result[0]
