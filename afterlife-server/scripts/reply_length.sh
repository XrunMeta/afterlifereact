#!/usr/bin/env bash
# 통화 응답 길이 토글 — 가비아 presecond testbed(8101)의 .env 를 수정하고 재시작한다.
# 자주 스위치하는 용도. 로컬에서 ssh 로 원격 적용.
#
# 사용법:
#   bash afterlife-server/scripts/reply_length.sh short [글자수]   # 짧은 모드(한 문장, 기본 30자)
#   bash afterlife-server/scripts/reply_length.sh long             # 평소 모드(1~3문장)
#   bash afterlife-server/scripts/reply_length.sh status           # 현재 설정/서비스 상태
#
# 동작: .env 에 REPLY_SHORT_MODE / REPLY_MAX_CHARS 를 쓰고 testbed 재시작.
#   - 주 제어: prompt.js 길이 규칙(한 문장 N자 이내)
#   - 안전망: server.js 가 num_predict 상한으로 LLM 폭주 차단
# 환경변수로 대상 변경 가능: GABIA_SSH / PRESECOND_ENV / PRESECOND_SVC
set -euo pipefail

GABIA="${GABIA_SSH:-afterlife-gabia}"
ENVFILE="${PRESECOND_ENV:-/home/afterlife/afterlife-server-presecond/testbed/.env}"
SVC="${PRESECOND_SVC:-afterlife-testbed-presecond}"

cmd="${1:-status}"

apply_env() {
  # $1=REPLY_SHORT_MODE 값(0/1), $2=REPLY_MAX_CHARS 값(기본 30; long 시엔 무시되지만 기록은 유지)
  local mode="$1" chars="${2:-30}"
  ssh "$GABIA" "bash -s" <<EOF
set -e
f='$ENVFILE'
[ -f "\$f" ] || { echo "ENV 파일 없음: \$f" >&2; exit 1; }
# 기존 키 제거 후 재기록(중복 방지)
sed -i '/^REPLY_SHORT_MODE=/d;/^REPLY_MAX_CHARS=/d' "\$f"
printf 'REPLY_SHORT_MODE=%s\n' '$mode' >> "\$f"
printf 'REPLY_MAX_CHARS=%s\n' '$chars' >> "\$f"
sudo systemctl restart $SVC
sleep 2
systemctl is-active $SVC
EOF
}

case "$cmd" in
  short)
    chars="${2:-30}"
    echo "[reply_length] SHORT 모드 ON — 한 문장 약 ${chars}자 (대상 $SVC)…"
    apply_env 1 "$chars"
    echo "[reply_length] 완료. 새 통화부터 짧게 응답합니다."
    ;;
  long)
    echo "[reply_length] LONG 모드(평소 1~3문장) 복원 (대상 $SVC)…"
    apply_env 0
    echo "[reply_length] 완료."
    ;;
  status)
    ssh "$GABIA" "bash -s" <<EOF
echo "== $ENVFILE 의 응답길이 설정 =="
grep -E '^REPLY_(SHORT_MODE|MAX_CHARS)=' '$ENVFILE' 2>/dev/null || echo '(미설정 — 평소 1~3문장 모드)'
echo "== 서비스 =="
systemctl is-active $SVC
EOF
    ;;
  *)
    echo "사용법: $0 {short [글자수] | long | status}" >&2
    exit 2
    ;;
esac
