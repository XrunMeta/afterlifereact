#!/usr/bin/env bash
# inventory.sh — 가비아 서버 환경 덤프 (ssh 통해 실행)
# 비대화형 안전: sudo 는 -n 사용, 실패 시 일반 권한으로 폴백
#
# 사용:
#   ssh -o BatchMode=yes gabia 'bash -s' < scripts/inventory.sh

set +e

section() { echo ""; echo ""; echo "### $1 ###"; }

echo "=========================================="
echo "  AFTERLIFE GABIA SERVER INVENTORY"
echo "  $(date -Iseconds)"
echo "=========================================="

section "whoami / id"
whoami; id

section "hostname / uname"
hostname
uname -a

section "/etc/os-release"
cat /etc/os-release 2>/dev/null

section "lsb_release"
lsb_release -a 2>/dev/null || echo "(lsb_release not available)"

section "uptime / load"
uptime

section "cpu (lscpu | head -25)"
lscpu 2>/dev/null | head -25

section "memory (free -h)"
free -h

section "disk (df -h | head -20)"
df -h 2>/dev/null | head -20

section "block devices (lsblk)"
lsblk 2>/dev/null | head -30

section "user accounts root/ubuntu/afterlife"
getent passwd 2>/dev/null | grep -E "^(root|ubuntu|afterlife)" || true

section "groups for current user"
groups 2>/dev/null

section "sudo cached privilege check (-n)"
sudo -n true 2>&1 && echo "sudo NOPASSWD: yes" || echo "sudo NOPASSWD: no (password required)"

section "/home contents"
ls -la /home 2>/dev/null

section "/root/afterlife-server existence"
ls -la /root/afterlife-server 2>/dev/null || echo "(not present)"

section "/home/afterlife existence"
ls -la /home/afterlife 2>/dev/null || echo "(not present)"

section "GPU — nvidia-smi"
which nvidia-smi 2>/dev/null
nvidia-smi 2>&1 | head -40 || echo "(nvidia-smi unavailable)"

section "CUDA — nvcc --version"
which nvcc 2>/dev/null
nvcc --version 2>&1 || echo "(nvcc not in PATH)"

section "nvidia / cuda dpkg packages"
dpkg -l 2>/dev/null | grep -E "nvidia|cuda" | head -40 || true

section "python3 / node / docker / git"
which python3 2>/dev/null; python3 --version 2>&1
which pip3 2>/dev/null; pip3 --version 2>&1
which node 2>/dev/null; node --version 2>/dev/null
which npm 2>/dev/null; npm --version 2>/dev/null
which docker 2>/dev/null; docker --version 2>/dev/null
which git 2>/dev/null; git --version 2>/dev/null

section "conda envs (if any)"
which conda 2>/dev/null
ls /opt/conda/envs 2>/dev/null
ls ~/.conda/envs 2>/dev/null
ls /data/TESTING 2>/dev/null | grep -i env || true

section "nginx version + path"
which nginx 2>/dev/null
nginx -v 2>&1

section "nginx -T (full active config)"
sudo -n nginx -T 2>&1 | head -300 || nginx -T 2>&1 | head -300 || echo "(nginx -T failed)"

section "nginx sites-enabled / conf.d"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null
ls -la /etc/nginx/conf.d/ 2>/dev/null
ls /etc/nginx/ 2>/dev/null | head -30

section "systemd running services (top 40)"
systemctl list-units --type=service --state=running --no-pager 2>/dev/null | head -40

section "listening ports"
ss -tlnp 2>/dev/null | head -40 || netstat -tlnp 2>/dev/null | head -40

section "iptables (sudo -n)"
sudo -n iptables -L -n 2>&1 | head -40 || echo "(no sudo)"

section "/workspace/TESTING legacy snapshot"
ls /workspace/TESTING 2>/dev/null | head -30 || echo "(not present)"

section "/data/TESTING legacy snapshot"
ls /data/TESTING 2>/dev/null | head -30 || echo "(not present)"

section "ssl certs (snakeoil / others)"
ls -la /etc/ssl/certs/ssl-cert-snakeoil.pem 2>/dev/null
ls -la /etc/letsencrypt 2>/dev/null
ls /etc/nginx/*.conf 2>/dev/null | head -10

section "public IP (best effort)"
curl -s --max-time 5 ifconfig.me 2>/dev/null; echo
hostname -I 2>/dev/null

echo ""
echo "=========================================="
echo "  END OF INVENTORY"
echo "=========================================="
