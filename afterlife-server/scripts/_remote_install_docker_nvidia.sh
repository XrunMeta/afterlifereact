#!/usr/bin/env bash
# T-068 fifth 세대 — 가비아 Docker + NVIDIA Container Toolkit 설치
# 대상: server172-32 (Ubuntu 24.04 noble, driver 560.28.03 / CUDA 12.6)
# 실행: ssh afterlife-gabia 'sudo bash ~/_remote_install_docker_nvidia.sh'
# 멱등: 이미 설치된 단계는 건너뜀. data-root=/data/docker (/ 디스크 84% 보호).
set -euo pipefail

log(){ echo -e "\n\033[1;36m[docker-install] $*\033[0m"; }

if [ "$(id -u)" -ne 0 ]; then echo "root(sudo)로 실행하세요."; exit 1; fi

# ── 0. 사전 확인 ───────────────────────────────────────────────
log "0. 환경 확인"
. /etc/os-release; echo "OS: $PRETTY_NAME ($VERSION_CODENAME)"
nvidia-smi --query-gpu=driver_version --format=csv,noheader | head -1 || { echo "nvidia driver 없음"; exit 1; }
df -h / /data | grep -vE tmpfs

# ── 1. Docker CE 공식 repo + 설치 ──────────────────────────────
if command -v docker >/dev/null 2>&1; then
  log "1. docker 이미 설치됨 ($(docker --version)) — skip"
else
  log "1. Docker CE 설치"
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# ── 2. data-root를 /data/docker 로 (/ 디스크 보호) ─────────────
log "2. data-root=/data/docker 설정"
mkdir -p /data/docker
if [ ! -f /etc/docker/daemon.json ]; then
  mkdir -p /etc/docker
  cat > /etc/docker/daemon.json <<'JSON'
{
  "data-root": "/data/docker"
}
JSON
  systemctl restart docker || true
else
  echo "daemon.json 이미 존재 — 수동 확인 필요(data-root 병합):"; cat /etc/docker/daemon.json
fi

# ── 3. NVIDIA Container Toolkit ────────────────────────────────
if command -v nvidia-ctk >/dev/null 2>&1; then
  log "3. nvidia-container-toolkit 이미 설치됨 — runtime 재설정만"
else
  log "3. NVIDIA Container Toolkit 설치"
  curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
    | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
  curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
    | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
    > /etc/apt/sources.list.d/nvidia-container-toolkit.list
  apt-get update -qq
  apt-get install -y -qq nvidia-container-toolkit
fi
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

# ── 4. afterlife 계정 docker 그룹(비root 실행용) ───────────────
log "4. afterlife 계정 docker 그룹 추가"
usermod -aG docker afterlife || true
echo "  (afterlife 재로그인 후 sudo 없이 docker 사용 가능)"

# ── 5. 검증 (가벼운 cuda base 이미지로 GPU passthrough 확인) ────
log "5. 검증: docker GPU passthrough"
docker --version
echo "data-root: $(docker info -f '{{.DockerRootDir}}' 2>/dev/null)"
echo ">> nvidia/cuda base 이미지로 nvidia-smi 테스트 (이미지 pull ~150MB)"
docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu24.04 nvidia-smi || {
  echo "!! GPU passthrough 실패 — toolkit/runtime 설정 확인 필요"; exit 1; }

log "완료 ✅  다음: FLP용 nvcr.io/nvidia/pytorch 이미지 pull (PoC-1, data-root=/data 확인 후)"
