#!/usr/bin/env bash
# t067_model_prep.sh — w600k_mbf onnx 다운로드 → tflite 변환 → 패리티 검증 → RN assets 복사
# 실행 환경: python3.10~3.12 (mac 호스트 또는 가비아). onnx2tf는 TF 의존이라 venv 격리.
# macOS 기본 python3가 3.13+ 인 경우 tensorflow 미지원 → python3.11 등 구버전 우선 사용.
#   (예: `brew install python@3.11` 로 확보)
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

WORK=.t067-model && mkdir -p "$WORK" && cd "$WORK"
[ -d venv ] || "$PYBIN" -m venv venv
. venv/bin/activate
pip -q install --upgrade pip
# onnx2tf 1.28.x 실행에 필요한 전체 의존성(freeze 시 누락되는 보조 패키지 포함).
# onnx_graphsurgeon 은 PyPI 기본 인덱스에 없어 NVIDIA 인덱스 필요.
pip -q install onnx onnxruntime onnx2tf onnxsim tensorflow tf_keras ai-edge-litert \
  psutil sng4onnx sne4onnx simple_onnx_processing_tools numpy pillow
pip -q install onnx_graphsurgeon --extra-index-url https://pypi.ngc.nvidia.com

# insightface buffalo_s 팩에서 w600k_mbf.onnx 추출 (mobilefacenet 인식 모델, 512d)
# 주의: buffalo_l 팩은 w600k_r50.onnx(ResNet50)만 포함 — w600k_mbf 는 buffalo_s/buffalo_sc 팩에 있음.
[ -f w600k_mbf.onnx ] || {
  curl -L -o buffalo_s.zip https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_s.zip
  unzip -o buffalo_s.zip w600k_mbf.onnx
}

# onnx2tf가 변환 정확도 자체검증용으로 내려받는 고정 URL 캘리브레이션 npy가
# (2026-07 기준) onnx2tf GitHub releases에서 삭제되어 404 → 동일 shape 더미로 로컬 선(先)생성해 우회.
# (실제 패리티는 이 파일과 무관하게 t067_model_parity.py 가 별도로 검증한다.)
CALIB_NPY=calibration_image_sample_data_20x128x128x3_float32.npy
[ -f "$CALIB_NPY" ] || python3 -c "
import numpy as np
rng = np.random.default_rng(0)
np.save('$CALIB_NPY', rng.random((20,128,128,3), dtype=np.float32))
"

# -b 1: 배치를 정적 1로 고정 (동적 배치 그대로면 onnx2tf 1.28.8에서 BatchNormalization
# 변환 중 np.prod(None * int) TypeError 발생 — 알려진 이슈, 정적 배치로 우회).
rm -rf tflite_out
onnx2tf -i w600k_mbf.onnx -o tflite_out -b 1
TFLITE=$(ls tflite_out/*float32.tflite | head -1)
python3 ../t067_model_parity.py w600k_mbf.onnx "$TFLITE"
mkdir -p ../../../afterlifeRN/assets/models
cp "$TFLITE" ../../../afterlifeRN/assets/models/w600k_mbf.tflite
echo "OK: afterlifeRN/assets/models/w600k_mbf.tflite"
