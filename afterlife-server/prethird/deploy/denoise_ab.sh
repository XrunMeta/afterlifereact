#!/usr/bin/env bash
# 클론 reference voice.wav denoise A/B 토글 — 로컬에서 가비아로 ssh 실행.
#
# 사용:
#   ./denoise_ab.sh on  9058   # 9058 캐시삭제 + denoise ON + 재기동
#   ./denoise_ab.sh off        # denoise OFF(drop-in 제거) + 재기동
#   ./denoise_ab.sh status     # 현재 토글/파일/캐시 상태만 확인
#
# 전제: ssh 별칭 afterlife-gabia 설정됨. sudo 비번은 ssh -t 로 입력.
set -euo pipefail

HOST="${PRETHIRD_GABIA_HOST:-afterlife-gabia}"
PRETHIRD="/home/afterlife/afterlife-server/prethird"
DROPIN_DIR="/etc/systemd/system/afterlife-prethird.service.d"
DROPIN="$DROPIN_DIR/denoise.conf"
SVC="afterlife-prethird"

ACTION="${1:-status}"
CLONE="${2:-}"

case "$ACTION" in
  on)
    if [ -z "$CLONE" ]; then echo "clone_id 필요: ./denoise_ab.sh on 9058" >&2; exit 1; fi
    echo ">> [1/3] $CLONE voice.wav 캐시 삭제 (denoise 적용분 재생성 유도)"
    ssh "$HOST" "bash $PRETHIRD/scripts/_clear_voice_cache.sh $CLONE"

    echo ">> [2/3] denoise drop-in 배치 (PRETHIRD_VOICE_DENOISE=1)"
    ssh -t "$HOST" "sudo mkdir -p $DROPIN_DIR && sudo tee $DROPIN >/dev/null <<'EOF'
[Service]
Environment=PRETHIRD_VOICE_DENOISE=1
EOF"

    echo ">> [3/3] daemon-reload + restart"
    ssh -t "$HOST" "sudo systemctl daemon-reload && sudo systemctl restart $SVC"
    echo "== denoise ON 완료. $CLONE 로 실통화 후 A/B 청취하세요. =="
    ;;

  off)
    echo ">> denoise drop-in 제거 + 재기동"
    ssh -t "$HOST" "sudo rm -f $DROPIN && sudo systemctl daemon-reload && sudo systemctl restart $SVC"
    echo "== denoise OFF 완료(기본 상태로 복귀). 비교청취 시 대상 캐시 삭제 후 통화. =="
    ;;

  status)
    echo "== drop-in 파일 =="
    ssh "$HOST" "ls -l $DROPIN 2>/dev/null || echo '없음(=denoise OFF)'"
    echo "== 서비스 환경값 (PRETHIRD_VOICE_DENOISE) =="
    ssh "$HOST" "systemctl show $SVC -p Environment | tr ' ' '\n' | grep -i denoise || echo '미설정(=OFF)'"
    echo "== 서비스 상태 =="
    ssh "$HOST" "systemctl is-active $SVC"
    ;;

  *)
    echo "사용: $0 {on <clone_id>|off|status}" >&2; exit 1
    ;;
esac
