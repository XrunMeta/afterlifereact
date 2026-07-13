#!/usr/bin/env bash
# CosyVoice2 PoC 설치 (가비아, conda py3.10 격리) — T-120 cosyvoice
# 전제: repo 는 이미 /home/afterlife/cosyvoice-poc/repo 에 recursive clone 되어 있음.
# 실행: ssh afterlife-gabia "bash -s" < _remote_install.sh   (또는 scp 후 nohup)
# GPU: 적재/추론은 GPU1(여유 40GB) 사용 예정 — 설치는 GPU 무관.
set -uo pipefail

CONDA=/home/afterlife/miniconda3
POC=/home/afterlife/cosyvoice-poc
ENV=cosyvoice-poc
LOG="$POC/install.log"
mkdir -p "$POC"
exec > >(tee -a "$LOG") 2>&1
echo "==================================================================="
echo "==== [$(date '+%F %T')] CosyVoice2 install start ===="

source "$CONDA/etc/profile.d/conda.sh"

# 1) conda env (py3.10 — requirements.txt 핀이 3.10 타깃)
if ! conda env list | grep -q "^${ENV} \|/${ENV}\$"; then
  echo "[1/5] conda create -n ${ENV} python=3.10"
  conda create -n "$ENV" -y python=3.10
else
  echo "[1/5] conda env ${ENV} 이미 존재 — 재사용"
fi
conda activate "$ENV"
python --version

cd "$POC/repo"

# 2) requirements 트리밍: 추론에 불필요/빌드취약 항목 제외.
#    - deepspeed(학습전용)·tensorrt(선택 가속)
#    - openai-whisper(평가용 ASR·legacy setup.py가 pkg_resources 요구 → 최신 setuptools 빌드격리에서 실패)
#    wetext==0.0.4 사용이라 pynini/OpenFst 불필요. 나머지 핀은 유지.
grep -vE "^deepspeed|^tensorrt|^openai-whisper" requirements.txt > /tmp/cv2_req.txt
echo "[2/5] 제외 항목:"
grep -E "^deepspeed|^tensorrt|^openai-whisper" requirements.txt || true

# 3) pip 코어 설치. setuptools<81 로 고정(pkg_resources 제거 회피), 빌드격리 끄고 legacy setup.py 대비.
echo "[3/5] pip install (torch 2.3.1 cu121 + deps)"
python -m pip install -U pip wheel "setuptools<81"
python -m pip install -r /tmp/cv2_req.txt

echo "[3/5] torch/cuda 확인:"
python -c "import torch; print('torch', torch.__version__, 'cuda_avail', torch.cuda.is_available(), 'ndev', torch.cuda.device_count())"

# 3b) openai-whisper: frontend.py 가 최상위 import(미사용이라도 필요). 빌드격리 끄면 env setuptools<81(pkg_resources 존재)로 빌드 성공.
echo "[3b] openai-whisper (--no-build-isolation)"
python -m pip install "openai-whisper==20231117" --no-build-isolation

# 4) weights: CosyVoice2-0.5B — HF 경로(가비아→ModelScope 중국CDN 55kB/s라 별도 스크립트 _remote_weights_hf.sh 사용).
echo "[4/5] weight download → _remote_weights_hf.sh 참조 (HF, hf-xet 가속 ~45s)"
bash "$POC/_remote_weights_hf.sh" || echo "WARN: weight 스크립트 실패 — 수동 확인"

# 5) smoke: 라이브러리 import (Matcha-TTS 서브모듈 경로 포함)
echo "[5/5] import smoke"
export PYTHONPATH="$POC/repo:$POC/repo/third_party/Matcha-TTS:${PYTHONPATH:-}"
python - <<'PY'
try:
    from cosyvoice.cli.cosyvoice import CosyVoice2
    print('IMPORT OK: CosyVoice2')
except Exception as e:
    import traceback; traceback.print_exc()
    print('IMPORT FAIL:', e)
PY

echo "==== [$(date '+%F %T')] install DONE ===="
