#!/usr/bin/env bash
# sface_model_prep.sh — OpenCV SFace int8bq ONNX → tflite → RN assets
# 상업 가능(Apache-2.0). InsightFace w600k_mbf 대체.
set -euo pipefail
cd "$(dirname "$0")"

PYBIN=""
for cand in python3.11 python3.12 python3.10 python3; do
  if command -v "$cand" >/dev/null 2>&1; then
    PYBIN="$cand"
    break
  fi
done
echo "using python: $PYBIN ($($PYBIN --version 2>&1))"

WORK=.sface-model && mkdir -p "$WORK" && cd "$WORK"
[ -d venv ] || "$PYBIN" -m venv venv
# shellcheck disable=SC1091
. venv/bin/activate
pip -q install --upgrade pip
pip -q install onnx onnxruntime onnx2tf onnxsim tensorflow tf_keras ai-edge-litert \
  psutil sng4onnx sne4onnx simple_onnx_processing_tools numpy pillow
pip -q install onnx_graphsurgeon --extra-index-url https://pypi.ngc.nvidia.com

# int8bq 는 onnx2tf DequantizeLinear 오류 → FP32 원본 변환 후 float16 산출물 사용
ONNX=sface_fp32.onnx
[ -f "$ONNX" ] || curl -L -o "$ONNX" \
  https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx

CALIB_NPY=calibration_image_sample_data_20x128x128x3_float32.npy
[ -f "$CALIB_NPY" ] || python -c "
import numpy as np
rng = np.random.default_rng(0)
np.save('$CALIB_NPY', rng.random((20,128,128,3), dtype=np.float32))
"

rm -rf tflite_out
onnx2tf -i "$ONNX" -o tflite_out -b 1
TFLITE=$(ls tflite_out/*float16.tflite tflite_out/*float32.tflite 2>/dev/null | head -1)
test -n "$TFLITE"
mkdir -p ../../../afterlifeRN/assets/models
cp "$TFLITE" ../../../afterlifeRN/assets/models/sface.tflite
echo "OK: afterlifeRN/assets/models/sface.tflite ($TFLITE)"
