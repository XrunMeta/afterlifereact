#!/usr/bin/env bash
# afterlife 가비아 서버 풀스택 정지 (역순)
#
# 순서: publisher (transient) → testbed → musetalk → tts → ollama
# 참고: ~/.claude/projects/-Volumes-exDN-devExdn-afterlife/memory/project_afterlife_server_startup.md
#
# 사용: ./_remote_stack_down.sh
# 비고: publisher-tmp 는 transient → stop 시 unit 정의도 함께 사라짐. 재기동은 stack_up.sh.
#       nginx 는 건드리지 않음 (502 응답 상태로 남음).

set -euo pipefail

SSH_HOST="${AFTERLIFE_SSH:-afterlife-gabia}"

step() { printf '\n\033[1;36m[%s]\033[0m %s\n' "$(date +%H:%M:%S)" "$*"; }

step "stop afterlife-publisher-tmp afterlife-testbed afterlife-musetalk afterlife-musetalk-b afterlife-tts ollama-afterlife"
ssh "$SSH_HOST" 'sudo systemctl stop afterlife-publisher-tmp afterlife-testbed afterlife-musetalk afterlife-musetalk-b afterlife-tts ollama-afterlife 2>&1 || true
  sudo systemctl reset-failed afterlife-musetalk-b 2>/dev/null || true'

step "상태 확인"
ssh "$SSH_HOST" '
  for svc in ollama-afterlife afterlife-tts afterlife-musetalk afterlife-musetalk-b afterlife-testbed afterlife-publisher-tmp; do
    printf "%-30s %s\n" "$svc" "$(systemctl is-active "$svc" 2>&1)"
  done
  echo "---"
  echo "LISTEN ports (8100/8200/8300/8301/8400/11435):"
  ss -ltn | grep -E ":8[1234]00|:8301|:11435" || echo "  (none — 정상 정지)"
'

printf '\n\033[1;32m[DONE]\033[0m 정지 완료. 재기동: ./_remote_stack_up.sh\n'
