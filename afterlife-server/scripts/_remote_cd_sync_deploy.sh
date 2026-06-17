#!/usr/bin/env bash
# _remote_cd_sync_deploy.sh — prethird clone_dialog 통일 배포 (root: sudo bash)
#
# 단계 a+b: clone_dialog 패키지 + api_base unit + signaling/server 전환.
#   (직하 모듈은 그대로 둠 — clone_dialog import라 미참조, 무해. 제거는 --purge 단계 c.)
# 단계 c(--purge): 검증 OK 후 직하 중복 bundle_client/llm_client/persona_prompt 제거(.bak 이동).
#
# 사전(배포자, 스크립트 밖): deploy-cd-sync.sh 가 scp 수행.
set -euo pipefail
S=/home/afterlife/afterlife-server/prethird/scripts

if [ "${1:-}" = "--purge" ]; then
  echo "==> [단계 c] 직하 중복 모듈 제거(.bak 이동)"
  for f in bundle_client llm_client persona_prompt; do
    if [ -f "$S/$f.py" ]; then
      mv -v "$S/$f.py" "$S/$f.py.bak-cdsync"
    fi
  done
  systemctl restart afterlife-prethird
  sleep 10
  echo -n "healthz: "; curl -s --max-time 8 http://127.0.0.1:8600/healthz; echo
  echo "[단계 c 완료] 직하 제거 후 통화 재검증 필요."
  exit 0
fi

echo "==> [단계 a+b] clone_dialog 패키지 + unit(api_base) + signaling/server 전환"
test -f /tmp/afterlife-prethird.service || { echo "FATAL: unit 없음"; exit 1; }
test -d "$S/clone_dialog" || { echo "FATAL: clone_dialog 패키지 scp 안 됨"; exit 1; }

install -m644 -o root -g root /tmp/afterlife-prethird.service /etc/systemd/system/afterlife-prethird.service
systemctl daemon-reload
systemctl restart afterlife-prethird
sleep 10

echo ""
echo "================ 검증 ================"
echo -n "healthz: "; curl -s --max-time 8 http://127.0.0.1:8600/healthz; echo
echo -n "API_BASE env: "
pid=$(systemctl show -p MainPID --value afterlife-prethird)
tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep PRETHIRD_API_BASE || echo "(없음 — 확인!)"
echo -n "clone_dialog import 무결성: "
sudo -u afterlife /home/afterlife/miniconda3/envs/musetalk/bin/python -c "import sys; sys.path.insert(0,'$S'); import signaling; print('OK')" 2>&1 | tail -1
echo "================ 완료 ================"
echo "실통화 1건 → records_report.py /data/records <clone_id> 로 정상 확인 후, 직하 제거는: sudo bash $0 --purge"
