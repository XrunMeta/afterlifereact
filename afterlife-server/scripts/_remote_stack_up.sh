#!/usr/bin/env bash
# afterlife 가비아 서버 풀스택 기동
#
# 순서: core 4 (systemctl) → publisher (systemd-run transient) → publish/start mode=queue → 검증
# 참고: ~/.claude/projects/-Volumes-exDN-devExdn-afterlife/memory/project_afterlife_server_startup.md
#
# 사용: ./_remote_stack_up.sh
# 전제: ~/.ssh/config 에 Host afterlife-gabia alias 설정됨

set -euo pipefail

SSH_HOST="${AFTERLIFE_SSH:-afterlife-gabia}"
PUB_QUEUE_MAX="${PUBLISHER_AUDIO_QUEUE_MAX:-5000}"

step() { printf '\n\033[1;36m[%s]\033[0m %s\n' "$(date +%H:%M:%S)" "$*"; }
fail() { printf '\033[1;31m[FAIL]\033[0m %s\n' "$*" >&2; exit 1; }

step "1/4 core 4 서비스 시작 (ollama / tts / musetalk / testbed)"
ssh "$SSH_HOST" '
  sudo systemctl start ollama-afterlife afterlife-tts afterlife-musetalk afterlife-testbed
  sleep 2
  systemctl is-active ollama-afterlife afterlife-tts afterlife-musetalk afterlife-testbed
' || fail "core 4 중 inactive 가 있음 (위 출력 확인)"

step "2/4 publisher (systemd-run transient unit)"
ssh "$SSH_HOST" "
  sudo systemctl stop afterlife-publisher-tmp 2>/dev/null || true
  sudo systemctl reset-failed afterlife-publisher-tmp 2>/dev/null || true
  sudo systemd-run --unit=afterlife-publisher-tmp \\
    --uid=afterlife --gid=afterlife \\
    --setenv=HOME=/home/afterlife \\
    --setenv=PUBLISHER_AUDIO_QUEUE_MAX=${PUB_QUEUE_MAX} \\
    bash -lc 'set -a && . /home/afterlife/.env.vars && set +a && exec /home/afterlife/miniconda3/envs/realtime/bin/python /home/afterlife/afterlife-server/realtime-afterlife/scripts/publisher.py'
  sleep 3
  systemctl is-active afterlife-publisher-tmp
  ss -ltn | grep -q ':8400 ' || { echo 'publisher 8400 LISTEN 안 됨'; exit 1; }
" || fail "publisher transient unit 기동 실패"

step "3/4 publish/start mode=queue (idle → publishing)"
ssh "$SSH_HOST" "curl -fsS -X POST http://127.0.0.1:8400/publish/start \\
  -H 'Content-Type: application/json' \\
  -d '{\"mode\":\"queue\",\"video\":true,\"audio\":true}'" \
  || fail "publish/start 호출 실패"
echo

step "4/4 healthz 검증"
ssh "$SSH_HOST" "
  sleep 2
  curl -fsS http://127.0.0.1:8400/healthz
  echo
  echo '---'
  ss -ltn | grep -E ':8[1234]00|:11435' || true
" | tee /tmp/afterlife-healthz.txt

grep -q '"state": "publishing"' /tmp/afterlife-healthz.txt || fail "state != publishing"
grep -q '"video_direction": "sendrecv"' /tmp/afterlife-healthz.txt || fail "video_direction != sendrecv"
grep -q '"audio_direction": "sendrecv"' /tmp/afterlife-healthz.txt || fail "audio_direction != sendrecv"

printf '\n\033[1;32m[DONE]\033[0m 풀스택 OK — https://memorial.example.invalid/\n'
