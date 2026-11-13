#!/usr/bin/env bash
# t067_sface_prep.sh — OpenCV Zoo SFace (face_recognition_sface_2021dec.onnx)
#   → TFLite 변환 → onnx/tflite 패리티 검증 → afterlifeRN/assets/models/sface_2021dec.tflite 복사
#
# InsightFace w600k_mbf(비상업·연구용 전용) 라이선스 리스크 해소를 위한 교체 모델.
# SFace 라이선스: Apache 2.0 (상업 사용 자유).
#
# ⚠️ 입력 전처리가 w600k_mbf와 다르다. 반드시 t067_sface_parity.py 로 검증한 공식을 그대로 앱에 쓸 것:
#   - 입력: 112×112×3 aligned face, BGR, float32, **0..255 raw 픽셀값** (평균 차감·스케일 없음)
#   - 출력: 128d 벡터 (모델 바깥에서 L2 정규화 — OpenCV FaceRecognizerSF.feature 동작과 동일)
#
# 실행 환경: python3.10~3.12 (mac 호스트 / 가비아 / WSL — Windows 기본 python은 피할 것).
#   onnx2tf는 TF 의존이라 venv 격리. macOS 기본 python3가 3.13+이면 tensorflow 미지원 → python@3.11 권장.
#
# 참고: t067_model_prep.sh(w600k_mbf용)와 .t067-model 디렉토리를 공유하지 않도록
#   별도 작업 디렉토리(.t067-sface)로 격리 — 두 모델이 서로의 의존성·캐시를 덮어쓰지 않게.
set -euo pipefail
cd "$(dirname "$0")"

PYBIN=""
for cand in python3.11 python3.12 python3.10 /opt/homebrew/bin/python3.11 python3; do
  if command -v "$cand" >/dev/null 2>&1; then
    PYBIN="$cand"
    break
  fi
done
echo "using python: $PYBIN ($($PYBIN --version 2>&1))"

WORK=.t067-sface && mkdir -p "$WORK" && cd "$WORK"
[ -d venv ] || "$PYBIN" -m venv venv
. venv/bin/activate
pip -q install --upgrade pip
# onnx2tf 1.28.x 실행에 필요한 전체 의존성(freeze 시 누락되는 보조 패키지 포함).
# onnx_graphsurgeon 은 PyPI 기본 인덱스에 없어 NVIDIA 인덱스 필요.
pip -q install onnx onnxruntime onnx2tf onnxsim tensorflow tf_keras ai-edge-litert \
  psutil sng4onnx sne4onnx simple_onnx_processing_tools numpy pillow
pip -q install onnx_graphsurgeon --extra-index-url https://pypi.ngc.nvidia.com

# OpenCV Zoo SFace 공식 ONNX. 커밋 핀(2021dec)으로 재현성 확보.
ONNX_URL="https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
[ -f sface_2021dec.onnx ] || curl -L -o sface_2021dec.onnx "$ONNX_URL"

# onnx2tf가 변환 정확도 자체검증용으로 내려받는 고정 URL 캘리브레이션 npy가
# (2026-07 기준) onnx2tf GitHub releases에서 삭제되어 404 → 동일 shape 더미로 로컬 선(先)생성해 우회.
# (실제 패리티는 이 파일과 무관하게 t067_sface_parity.py 가 별도로 검증한다.)
CALIB_NPY=calibration_image_sample_data_20x128x128x3_float32.npy
[ -f "$CALIB_NPY" ] || python3 -c "
import numpy as np
rng = np.random.default_rng(0)
np.save('$CALIB_NPY', rng.random((20,128,128,3), dtype=np.float32))
"

# -b 1: 배치를 정적 1로 고정 (t067_model_prep.sh와 동일 우회 — onnx2tf 1.28.8 BatchNormalization 이슈).
# -kat input: SFace ONNX 원본은 입력이 NCHW [1,3,112,112]. onnx2tf는 기본적으로 NHWC로 축을 전치하는데
#   "input" 이름을 명시해 전치 추적을 명시화(변환 로그에서 전치 지점을 확인하기 위함, 실동작엔 영향 없음).
rm -rf tflite_out
onnx2tf -i sface_2021dec.onnx -o tflite_out -b 1

TFLITE=$(ls tflite_out/*float32.tflite | head -1)
python3 ../t067_sface_parity.py sface_2021dec.onnx "$TFLITE"
mkdir -p ../../../afterlifeRN/assets/models
cp "$TFLITE" ../../../afterlifeRN/assets/models/sface_2021dec.tflite
echo "OK: afterlifeRN/assets/models/sface_2021dec.tflite"
echo ""
echo "다음 단계:"
echo "  - afterlifeRN 앱 코드가 이 파일을 require 하도록 전환되어 있는지 확인"
echo "  - RN dev build 재빌드 (fast-tflite 네이티브 모듈이라 Metro reload 로 반영 안 됨):"
echo "      cd afterlifeRN && npx expo run:android  # or run:ios"
echo "  - Phase 3 서버 Vectorize 인덱스 afl-face-128 생성 (preview + production):"
echo "      cd afterlifeapi"
echo "      wrangler vectorize create afl-face-128 --dimensions=128 --metric=cosine"
echo "      wrangler vectorize create afl-face-128 --dimensions=128 --metric=cosine --env preview"
