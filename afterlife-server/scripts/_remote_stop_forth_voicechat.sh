#!/usr/bin/env bash
# T-068 fifth 세대 — forth(preforth :8700) + voice-chat-mvp(:8500) 완전 정지 → GPU1 VRAM 회수
# 실행: ssh afterlife-gabia 'sudo bash ~/_remote_stop_forth_voicechat.sh'
# 안전: preview 코드 참조 0건·연결 0건 확인 후 작성(README §8.7). 디렉토리는 보존(정지만).
set -uo pipefail
log(){ echo -e "\n\033[1;36m[cleanup] $*\033[0m"; }
[ "$(id -u)" -eq 0 ] || { echo "sudo로 실행하세요."; exit 1; }

log "정지 전 상태"
echo "-- forth/voice-chat GPU 점유 --"
nvidia-smi --query-compute-apps=pid,used_memory,process_name --format=csv,noheader 2>/dev/null \
  | grep -E "preforth|voice-chat" || echo "  (해당 프로세스 nvidia-smi에 없음)"
echo "-- GPU1 여유(정지 전) --"
nvidia-smi --query-gpu=index,memory.free,memory.used --format=csv,noheader 2>/dev/null | sed -n '2p'

# ── 1. forth (preforth) transient 정지 ─────────────────────────
log "1. forth(preforth :8700) 정지"
systemctl stop afterlife-preforth.service 2>/dev/null || true
systemctl reset-failed afterlife-preforth.service 2>/dev/null || true
if systemctl is-active --quiet afterlife-preforth.service 2>/dev/null; then
  echo "  ⚠️ 아직 active — 수동 확인 필요"
else
  echo "  preforth: stopped ✅ (transient라 재부팅 시 자동 안 뜸)"
fi

# ── 2. voice-chat-mvp (afterlife2 user systemd) 정지+disable+linger off ──
log "2. voice-chat-mvp(:8500, afterlife2 uid 1002) 정지"
RUID=1002; RT=/run/user/$RUID
SVC=$(sudo -u afterlife2 XDG_RUNTIME_DIR=$RT systemctl --user list-units --type=service --all --plain --no-legend 2>/dev/null \
      | grep -iE "voice|chat" | awk '{print $1}' | head -1)
if [ -n "${SVC:-}" ]; then
  echo "  발견 user 서비스: $SVC"
  sudo -u afterlife2 XDG_RUNTIME_DIR=$RT systemctl --user stop "$SVC" 2>/dev/null || true
  sudo -u afterlife2 XDG_RUNTIME_DIR=$RT systemctl --user disable "$SVC" 2>/dev/null || true
  echo "  $SVC: stopped + disabled"
else
  echo "  user 서비스 못 찾음 → 프로세스 직접 종료"
  pkill -u afterlife2 -f "uvicorn app:app.*8500" 2>/dev/null || true
fi
# 재부팅 후 user 서비스 자동기동 방지
loginctl disable-linger afterlife2 2>/dev/null && echo "  linger: disabled (재부팅 후 자동기동 차단)" || true

sleep 3

# ── 3. 검증 ────────────────────────────────────────────────────
log "3. 정지 후 검증"
echo "-- :8700 / :8500 리스닝 --"
ss -tlnp 2>/dev/null | grep -E ":(8700|8500)" || echo "  :8700/:8500 리스닝 없음 ✅"
echo "-- forth/voice-chat GPU 점유 --"
nvidia-smi --query-compute-apps=pid,used_memory,process_name --format=csv,noheader 2>/dev/null \
  | grep -E "preforth|voice-chat" || echo "  forth/voice-chat GPU 점유 0 ✅"
echo "-- GPU1 여유(정지 후) --"
nvidia-smi --query-gpu=index,memory.free,memory.used --format=csv,noheader 2>/dev/null | sed -n '2p'

log "완료 ✅  (nginx /preforth/ location은 무해 잔존 — 호출자 없음. 원하면 별도 정리)"
echo "  preforth 디렉토리(1.3G)·voice-chat-mvp 디렉토리는 보존됨(코드 참고용)."
