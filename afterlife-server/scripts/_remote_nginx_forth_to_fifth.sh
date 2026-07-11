#!/usr/bin/env bash
# T-068 fifth — nginx 정리: forth(/preforth/ 8700) 제거 + fifth(/fifth/ 8800) 예약
# 실행: ssh afterlife-gabia 'sudo bash ~/_remote_nginx_forth_to_fifth.sh'
# 안전: 백업 → 치환 → nginx -t 검증 성공 시에만 reload. 실패 시 백업 복원.
set -euo pipefail
log(){ echo -e "\n\033[1;36m[nginx] $*\033[0m"; }
[ "$(id -u)" -eq 0 ] || { echo "sudo로 실행하세요."; exit 1; }

NGINX=/etc/nginx/sites-available/memorial.example.invalid
TS=$(date +%Y%m%d-%H%M%S)
BAK="${NGINX}.bak.${TS}"

log "0. 현재 preforth/fifth location"
grep -nE "preforth|/fifth/|8700|8800" "$NGINX" || echo "  (preforth 라인 없음 — 이미 정리됨?)"

log "1. 백업 → $BAK"
cp "$NGINX" "$BAK"

log "2. preforth(8700) → fifth(8800) 치환"
# (a) location 경로·포트·서비스명 명시 치환
sed -i 's#/preforth/#/fifth/#g; s#127\.0\.0\.1:8700#127.0.0.1:8800#g; s#afterlife-preforth#afterlife-fifth#g' "$NGINX"
# (b) forth 설명 주석(prethird 복제본…) → fifth 설명으로 갱신
sed -i 's#prethird(8600)의 독립 복제본.*#fifth 세대(FasterLivePortrait+서버STT, T-068). 서버(:8800) 미가동 시 502(호출자 0). prethird(8600) 대체 후보·A/B 병행.#' "$NGINX"
# (c) 잔존 'preforth' 단어 정리(주석 헤더 등) → fifth
sed -i 's#preforth#fifth#g' "$NGINX"

log "3. 치환 결과"
grep -nE "/fifth/|8800|# fifth" "$NGINX" || true

log "4. nginx -t 검증"
if nginx -t; then
  log "5. reload"
  systemctl reload nginx
  echo "  ✅ nginx reload 완료. /preforth/(8700) 제거 · /fifth/(8800) 예약."
  echo "  주의: fifth 서버(:8800) 미가동 상태 → /fifth/ 호출 시 502 (정상, 호출자 0)."
else
  log "❌ nginx -t 실패 → 백업 복원"
  cp "$BAK" "$NGINX"
  echo "  원복 완료. 변경 없음. 위 에러 확인 필요."
  exit 1
fi
