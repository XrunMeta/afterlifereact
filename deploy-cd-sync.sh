#!/usr/bin/env bash
# deploy-cd-sync.sh — prethird clone_dialog 통일 로컬→가비아 배포 런처.
# 실행:  bash deploy-cd-sync.sh        (단계 a+b)
#        bash deploy-cd-sync.sh --purge (단계 c, 검증 후)
set -euo pipefail
WT=/Volumes/exDN/devExdn/afterlife/.claude/worktrees/prethird-cd-sync
G=afterlife-gabia
S=afterlife-server/prethird/scripts
cd "$WT"

if [ "${1:-}" = "--purge" ]; then
  echo "==> [단계 c] 직하 제거"
  scp afterlife-server/scripts/_remote_cd_sync_deploy.sh "$G:/tmp/"
  ssh -t "$G" 'sudo bash /tmp/_remote_cd_sync_deploy.sh --purge'
  exit 0
fi

echo "==> [1/3] clone_dialog 패키지 scp"
ssh "$G" 'mkdir -p /home/afterlife/afterlife-server/prethird/scripts/clone_dialog'
scp "$S/clone_dialog/__init__.py" "$S/clone_dialog/bundle_client.py" \
    "$S/clone_dialog/llm_client.py" "$S/clone_dialog/persona_prompt.py" \
    "$G:/home/afterlife/afterlife-server/prethird/scripts/clone_dialog/"

echo "==> [2/3] signaling/server 전환본 scp"
scp "$S/signaling.py" "$S/server.py" \
    "$G:/home/afterlife/afterlife-server/prethird/scripts/"

echo "==> [3/3] unit + 원격 배포(sudo)"
scp afterlife-server/prethird/deploy/afterlife-prethird.service "$G:/tmp/"
scp afterlife-server/scripts/_remote_cd_sync_deploy.sh "$G:/tmp/"
ssh -t "$G" 'sudo bash /tmp/_remote_cd_sync_deploy.sh'

echo ""
echo "✅ 단계 a+b 완료. 실통화 1건 후:"
echo "   ssh $G 'python3 /home/afterlife/afterlife-server/prethird/scripts/records_report.py /data/records <clone_id>'"
echo "   정상 확인되면 직하 제거:  bash deploy-cd-sync.sh --purge"
