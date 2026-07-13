#!/usr/bin/env bash
# CosyVoice2-0.5B weight 다운로드 — HuggingFace 경로 (ModelScope 가비아→중국 CDN 55kB/s 우회).
# 추론 불필요 무거운 파일(flow.cache.pt·TRT estimator onnx·zip·asset) 제외.
# 실행: ssh afterlife-gabia "nohup bash /home/afterlife/cosyvoice-poc/_remote_weights_hf.sh > /home/afterlife/cosyvoice-poc/weights.log 2>&1 &"
set -uo pipefail
CONDA=/home/afterlife/miniconda3
POC=/home/afterlife/cosyvoice-poc
source "$CONDA/etc/profile.d/conda.sh"
conda activate cosyvoice-poc

echo "==== [$(date '+%F %T')] HF weight download start ===="
export HF_HUB_ENABLE_HF_TRANSFER=0   # hf-xet 사용(설치됨); hf_transfer 미설치라 0
cd "$POC"
python - <<'PY'
from huggingface_hub import snapshot_download
p = snapshot_download(
    'FunAudioLLM/CosyVoice2-0.5B',
    local_dir='/home/afterlife/cosyvoice-poc/pretrained_models/CosyVoice2-0.5B',
    ignore_patterns=[
        'flow.cache.pt',                 # ~430M JIT 캐시(load_jit=False면 불필요)
        '*.estimator.*.onnx',            # TRT estimator(load_trt=False면 불필요)
        '*.zip', 'asset/*', '*.png', '*.gif',
    ],
)
print('weights ->', p)
import os
for root,_,files in os.walk(p):
    for f in files:
        fp=os.path.join(root,f); print(f'  {os.path.getsize(fp)/1e6:8.1f}MB  {os.path.relpath(fp,p)}')
PY
echo "==== [$(date '+%F %T')] HF weight download DONE ===="
