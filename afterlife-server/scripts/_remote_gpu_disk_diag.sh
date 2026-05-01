#!/usr/bin/env bash
# _remote_gpu_disk_diag.sh — 가비아에서 root 로 실행
# GPU 1 가려진 원인 + sdc 빈 디스크 상태 진단
set +e

echo "===== /proc/driver/nvidia/gpus/ ====="
ls /proc/driver/nvidia/gpus/ 2>/dev/null

echo ""
echo "===== nvidia-smi -i 0 ====="
nvidia-smi -i 0 --query-gpu=index,name,memory.total --format=csv 2>&1 | head -3

echo ""
echo "===== nvidia-smi -i 1 ====="
nvidia-smi -i 1 --query-gpu=index,name,memory.total --format=csv 2>&1 | head -3

echo ""
echo "===== nvidia-smi -q (헤더만) ====="
nvidia-smi -q 2>&1 | head -30

echo ""
echo "===== /proc/driver/nvidia/gpus/*/information ====="
for d in /proc/driver/nvidia/gpus/*/; do
  echo "--- $d ---"
  cat "${d}information" 2>/dev/null | head -15
done

echo ""
echo "===== env CUDA / NVIDIA (현재 셸) ====="
env | grep -iE "cuda|nvidia"

echo ""
echo "===== /etc/environment ====="
cat /etc/environment | grep -iE "cuda|nvidia|visible"

echo ""
echo "===== systemwide CUDA_VISIBLE_DEVICES grep ====="
grep -r CUDA_VISIBLE_DEVICES /etc/ 2>/dev/null | head -10

echo ""
echo "===== ollama unit env ====="
grep -E "CUDA|VISIBLE|NVIDIA" /etc/systemd/system/ollama.service /etc/systemd/system/ollama.service.d/*.conf 2>/dev/null

echo ""
echo "===== dmesg nvidia/gpu (recent 30) ====="
dmesg -T 2>/dev/null | grep -iE "nvidia|gpu" | tail -30

echo ""
echo "===== nvidia-bug-report.log? (요약) ====="
ls -la /var/log/nvidia* 2>/dev/null
journalctl -u nvidia-persistenced --no-pager 2>/dev/null | tail -10

echo ""
echo "===== sdc disk state ====="
lsblk -no NAME,SIZE,TYPE,STATE,MODEL /dev/sdc 2>&1
echo "---"
cat /proc/partitions | grep sdc
echo "---"
dmesg -T 2>/dev/null | grep -iE "sdc" | tail -10
echo "---"
which smartctl >/dev/null 2>&1 && smartctl -i /dev/sdc 2>&1 | head -20 || echo "(smartctl not installed)"

echo ""
echo "===== DONE ====="
