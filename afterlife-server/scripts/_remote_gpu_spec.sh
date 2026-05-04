#!/usr/bin/env bash
# _remote_gpu_spec.sh — GPU 0/1 사양 + 현재 상태 확인
set +e

echo "===== lspci NVIDIA ====="
lspci -nn | grep -i nvidia

echo ""
echo "===== nvidia-smi -L ====="
nvidia-smi -L 2>&1

echo ""
echo "===== nvidia-smi (full table) ====="
nvidia-smi 2>&1 | head -25

echo ""
echo "===== GPU 0 detail ====="
nvidia-smi -i 0 --query-gpu=index,name,uuid,pci.bus_id,memory.total,memory.used,memory.free,driver_version,vbios_version,power.draw,power.limit,temperature.gpu --format=csv 2>&1

echo ""
echo "===== GPU 1 detail ====="
nvidia-smi -i 1 --query-gpu=index,name,uuid,pci.bus_id,memory.total,memory.used,memory.free,driver_version,vbios_version,power.draw,power.limit,temperature.gpu --format=csv 2>&1

echo ""
echo "===== /proc/driver/nvidia/gpus/* ====="
for d in /proc/driver/nvidia/gpus/*/; do
  echo "--- $d ---"
  cat "${d}information" 2>/dev/null | head -10
done

echo ""
echo "===== dmesg GPU recent ====="
dmesg -T 2>/dev/null | grep -iE "nvidia|nvrm|gsp" | tail -15

echo ""
echo "===== DONE ====="
