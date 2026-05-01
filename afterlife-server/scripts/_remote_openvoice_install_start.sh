#!/usr/bin/env bash
# _remote_openvoice_install_start.sh — 회차 026
# afterlife user 의 격리 환경에 miniconda + OpenVoice v2 + MeloTTS + checkpoints 설치
# 백그라운드로 시작, 진행은 별도 status 스크립트로 폴링
set +e

LOG=/home/afterlife/afterlife-server/openvoice-afterlife/install.log
PID_FILE=/home/afterlife/afterlife-server/openvoice-afterlife/install.pid

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
  echo "[skip] install already running pid=$(cat $PID_FILE)"
  exit 0
fi

# afterlife user 로 백그라운드 실행
sudo -u afterlife -H bash -lc '
INSTALL_LOG=/home/afterlife/afterlife-server/openvoice-afterlife/install.log
PID_FILE=/home/afterlife/afterlife-server/openvoice-afterlife/install.pid

cat > /tmp/openvoice-install-runner.sh <<"EOF"
#!/usr/bin/env bash
set -e
LOG=/home/afterlife/afterlife-server/openvoice-afterlife/install.log
exec >> "$LOG" 2>&1

echo "[$(date -Iseconds)] === START ==="
cd /home/afterlife
BASE=/home/afterlife/afterlife-server/openvoice-afterlife

###############################################
# 1) Miniconda 설치 (없으면)
###############################################
if [[ ! -d /home/afterlife/miniconda3 ]]; then
  echo "[$(date -Iseconds)] [1] Miniconda 다운로드"
  cd /tmp
  wget -q https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh
  bash miniconda.sh -b -p /home/afterlife/miniconda3
  rm miniconda.sh
  /home/afterlife/miniconda3/bin/conda init bash
fi
source /home/afterlife/miniconda3/etc/profile.d/conda.sh
echo "conda: $(conda --version)"

# Anaconda TOS 회피 — TOS accept (이미 동의 완료, idempotent)
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main 2>/dev/null || true
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r 2>/dev/null || true

###############################################
# 2) openvoice conda env (Python 3.10, conda-forge, pip 포함)
###############################################
if ! conda env list | grep -q "^openvoice "; then
  echo "[$(date -Iseconds)] [2] conda create openvoice python=3.10 + pip (channel: conda-forge)"
  conda create -y -n openvoice -c conda-forge python=3.10 pip
fi
conda activate openvoice
echo "python: $(python --version)"

# 기존 env 인 경우 pip 누락 보강
python -m pip --version 2>/dev/null || conda install -n openvoice -y -c conda-forge pip

# av (PyAV) + ffmpeg 은 conda-forge 의 pre-built wheel 사용 — Cython 3.x 빌드 트랩 회피
echo "[$(date -Iseconds)] [2b] conda install av + ffmpeg (pre-built)"
conda install -n openvoice -y -c conda-forge av ffmpeg

###############################################
# 3) OpenVoice + MeloTTS clone
###############################################
cd $BASE
if [[ ! -d source ]]; then
  echo "[$(date -Iseconds)] [3a] git clone OpenVoice"
  git clone --depth 1 https://github.com/myshell-ai/OpenVoice.git source
fi
if [[ ! -d melotts ]]; then
  echo "[$(date -Iseconds)] [3b] git clone MeloTTS"
  git clone --depth 1 https://github.com/myshell-ai/MeloTTS.git melotts
fi

###############################################
# 4) pip install (OpenVoice + MeloTTS + 한국어 dependencies)
###############################################
# 4-pre) build deps 최신화 + av binary wheel 강제 (Cython 3.x 빌드 트랩 회피)
echo "[$(date -Iseconds)] [4-pre] build deps + av binary wheel"
python -m pip install --upgrade --quiet pip setuptools wheel
python -m pip install --quiet "cython<3" || true
python -m pip install --quiet --only-binary=:all: av || python -m pip install --quiet av==12.3.0

echo "[$(date -Iseconds)] [4a] pip install OpenVoice (--no-build-isolation)"
cd $BASE/source
python -m pip install --quiet --no-build-isolation -e .

echo "[$(date -Iseconds)] [4b] pip install MeloTTS (--no-build-isolation)"
cd $BASE/melotts
python -m pip install --quiet --no-build-isolation -e .
python -m unidic download

###############################################
# 5) checkpoints_v2 (OpenVoice Tone Color Converter)
###############################################
cd $BASE
if [[ ! -d checkpoints_v2 ]]; then
  echo "[$(date -Iseconds)] [5] checkpoints_v2 다운로드"
  wget -q https://myshell-public-repo-host.s3.amazonaws.com/openvoice/checkpoints_v2_0417.zip
  unzip -q checkpoints_v2_0417.zip
  rm checkpoints_v2_0417.zip
fi
ls $BASE/checkpoints_v2/ 2>/dev/null | head -10

###############################################
# 6) 디스크 사용 + 환경 정보
###############################################
echo "[$(date -Iseconds)] [6] 설치 완료, 사용량 측정"
du -sh /home/afterlife/miniconda3 $BASE
df -h /home

echo "[$(date -Iseconds)] === DONE ==="
EOF
chmod +x /tmp/openvoice-install-runner.sh

: > "$INSTALL_LOG"
nohup setsid bash /tmp/openvoice-install-runner.sh >> "$INSTALL_LOG" 2>&1 &
echo $! > "$PID_FILE"
'

sleep 1
echo "[started] pid=$(cat $PID_FILE)"
echo "[log] $LOG"
ls -la "$LOG" "$PID_FILE" 2>/dev/null
