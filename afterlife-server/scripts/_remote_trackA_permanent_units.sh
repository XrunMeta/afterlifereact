#!/usr/bin/env bash
# _remote_trackA_permanent_units.sh — Track A: qwen3tts·prethird transient → 영구 .service
# (root: sudo bash 이 파일)
#
# ⚠️ 통화 핵심 서비스 2개를 재시작한다(다운타임 수십초~1분, qwen3tts 모델 재로드).
#    통화 세션 없는 시점에 실행 권장.
# 전제: /tmp/afterlife-qwen3tts.service, /tmp/afterlife-prethird.service 업로드됨.
# 멱등: 재실행해도 stop→install→start 반복.
set -euo pipefail

test -f /tmp/afterlife-qwen3tts.service || { echo "FATAL: /tmp/afterlife-qwen3tts.service 없음"; exit 1; }
test -f /tmp/afterlife-prethird.service || { echo "FATAL: /tmp/afterlife-prethird.service 없음"; exit 1; }

echo "==> [0] 현재 통화 세션 확인(0 이어야 안전)"
curl -s --max-time 5 http://127.0.0.1:8600/healthz 2>/dev/null || echo "(prethird healthz 응답없음)"
echo ""

echo "==> [1] transient unit 정지(transient 는 stop 시 소멸)"
systemctl stop afterlife-prethird 2>/dev/null || true
systemctl stop afterlife-qwen3tts 2>/dev/null || true

echo "==> [2] 영구 unit 설치"
install -m644 -o root -g root /tmp/afterlife-qwen3tts.service /etc/systemd/system/afterlife-qwen3tts.service
install -m644 -o root -g root /tmp/afterlife-prethird.service /etc/systemd/system/afterlife-prethird.service

echo "==> [3] prethird drop-in 제거(영구 base 가 흡수 — el RISK-1)"
rm -rf /etc/systemd/system/afterlife-prethird.service.d
echo "    남은 drop-in: $(ls /etc/systemd/system/afterlife-prethird.service.d 2>/dev/null || echo '(없음)')"

echo "==> [4] daemon-reload + qwen3tts 먼저 기동(prethird 가 8201 의존)"
systemctl daemon-reload
systemctl enable --now afterlife-qwen3tts

echo "==> [5] qwen3tts 모델 로드 대기(최대 120s)"
ok=0
for i in $(seq 1 60); do
  if curl -sf --max-time 3 http://127.0.0.1:8201/healthz >/dev/null 2>&1; then ok=1; echo "    qwen3tts healthz OK (${i}회차)"; break; fi
  sleep 2
done
[ "$ok" = 1 ] || echo "    ⚠️ qwen3tts healthz 타임아웃 — 로그 확인 필요"

echo "==> [6] prethird 기동"
systemctl enable --now afterlife-prethird
echo "    prethird musetalk 로드 대기..."
for i in $(seq 1 30); do
  if curl -sf --max-time 3 http://127.0.0.1:8600/healthz >/dev/null 2>&1; then echo "    prethird healthz OK (${i}회차)"; break; fi
  sleep 2
done

echo ""
echo "================ 검증 ================"
for u in afterlife-qwen3tts afterlife-prethird; do
  echo -n "$u: Transient="; systemctl show -p Transient --value $u
  echo -n "  active="; systemctl is-active $u
  echo -n "  enabled="; systemctl is-enabled $u
done
echo -n "qwen3tts healthz: "; curl -s --max-time 5 http://127.0.0.1:8201/healthz; echo
echo -n "prethird healthz: "; curl -s --max-time 5 http://127.0.0.1:8600/healthz; echo
echo -n "prethird 실효 TTS_URL/SE_PATH: "; pid=$(systemctl show -p MainPID --value afterlife-prethird); tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep -E 'PRETHIRD_TTS_URL|PRETHIRD_TTS_SE_PATH|MUSETALK_BATCH_SIZE' | tr '\n' ' '; echo
echo "================ 완료 ================"
