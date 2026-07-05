#!/usr/bin/env bash
# lab-tuner 파라미터 튜닝 웹 원커맨드 접근.
#   bash tune.sh         → SSH 터널(8700) 열고 브라우저 자동 오픈(로그인 프리필됨)
#   bash tune.sh stop    → 터널 종료
#   bash tune.sh status  → 터널/테스트베드 상태만 확인
#
# env override: LAB_HOST(기본 afterlife-gabia) · LAB_PORT(기본 8700)
set -euo pipefail

HOST="${LAB_HOST:-afterlife-gabia}"
PORT="${LAB_PORT:-8700}"
URL="http://localhost:${PORT}"

_tunnel_up() { lsof -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; }
_web_ok()    { curl -sf -m5 "${URL}/healthz" >/dev/null 2>&1; }

case "${1:-open}" in
  stop)
    # ControlMaster(mux) 사용 시 이 포워딩만 취소(마스터·다른 gabia 연결은 유지).
    if ssh -O cancel -L "${PORT}:127.0.0.1:${PORT}" "${HOST}" 2>/dev/null; then
      echo "[tune] 터널 종료됨 (:${PORT}, mux cancel)"
    # 일반 ssh -f -N 프로세스면 pkill 폴백.
    elif pkill -f "ssh.* -L ${PORT}:127.0.0.1:${PORT}" 2>/dev/null; then
      echo "[tune] 터널 종료됨 (:${PORT})"
    else
      echo "[tune] 열린 터널 없음 (또는 이미 종료됨)"
    fi
    exit 0
    ;;
  status)
    _tunnel_up && echo "[tune] 터널: 열림 (:${PORT})" || echo "[tune] 터널: 없음"
    _web_ok && echo "[tune] 테스트베드: OK (${URL})" || echo "[tune] 테스트베드: 응답 없음"
    exit 0
    ;;
  open|"")
    ;;
  *)
    echo "usage: tune.sh [open|stop|status]"; exit 2
    ;;
esac

# 1. 터널 확보
if _tunnel_up; then
  echo "[tune] 터널 이미 열림 (:${PORT})"
else
  echo "[tune] SSH 터널 여는 중: ${PORT} → ${HOST}"
  ssh -f -N -L "${PORT}:127.0.0.1:${PORT}" "${HOST}"
  for _ in $(seq 1 10); do _web_ok && break; sleep 1; done
fi

# 2. 테스트베드 헬스
if _web_ok; then
  echo "[tune] 테스트베드 준비됨 ✓"
else
  echo "[tune] ⚠️ 테스트베드 healthz 응답 없음 — 가비아 lab-tuner(:8700)가 떠있는지 확인하세요."
  echo "       재기동: bash \"$(dirname "$0")/_remote_lab_deploy.sh\""
fi

# 3. 브라우저 열기 (로그인 프리필됨 — 로그인 버튼만 누르면 됨)
echo "[tune] 브라우저 열기: ${URL}"
if command -v open >/dev/null 2>&1; then
  open "${URL}"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${URL}"
else
  echo "[tune] 브라우저를 수동으로 여세요: ${URL}"
fi

echo "[tune] 완료. 종료하려면: bash tune.sh stop"
