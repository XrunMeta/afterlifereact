#!/usr/bin/env bash
# _remote_icl_phase2_deploy.sh — ICL 트랙 Phase2 가비아 배포 (root 로 실행: sudo bash 이 파일)
#
# ① prethird PRETHIRD_TTS_SE_PATH 폴백 제거 (drop-in override → 빈값 → None)
# ② STT 8202 faster-whisper 정식 systemd 유닛 영구등록 (CPU int8, medium)
#
# 전제: /tmp/zz-sepath-clear.conf, /tmp/afterlife-stt.service 가 미리 업로드돼 있어야 함.
# 멱등: 재실행해도 install 덮어쓰기 + restart/enable 만 반복.
set -euo pipefail

PRETHIRD_DROPIN_DIR=/etc/systemd/system/afterlife-prethird.service.d
STT_UNIT=/etc/systemd/system/afterlife-stt.service

echo "==> [0] 전제 파일 확인"
test -f /tmp/zz-sepath-clear.conf || { echo "FATAL: /tmp/zz-sepath-clear.conf 없음"; exit 1; }
test -f /tmp/afterlife-stt.service || { echo "FATAL: /tmp/afterlife-stt.service 없음"; exit 1; }

echo "==> [1] prethird SE_PATH 폴백 제거 drop-in 설치"
install -d -m755 "$PRETHIRD_DROPIN_DIR"
install -m644 -o root -g root /tmp/zz-sepath-clear.conf "$PRETHIRD_DROPIN_DIR/zz-sepath-clear.conf"

echo "==> [2] STT 8202 정식 유닛 설치"
install -m644 -o root -g root /tmp/afterlife-stt.service "$STT_UNIT"

echo "==> [3] daemon-reload"
systemctl daemon-reload

echo "==> [4] prethird 재기동 (SE_PATH override 반영)"
systemctl restart afterlife-prethird

echo "==> [5] STT 영구 등록 + 즉시 기동"
systemctl enable --now afterlife-stt

echo "==> [6] 안정화 대기"
sleep 4

echo ""
echo "================ 검증 ================"
echo "--- prethird SE_PATH (PRETHIRD_TTS_SE_PATH= 빈값이면 OK) ---"
pid=$(systemctl show -p MainPID --value afterlife-prethird) || true
tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep -E 'PRETHIRD_TTS_SE_PATH|PRETHIRD_TTS_URL' || echo "(environ 읽기 실패)"
echo ""
echo "--- STT 상태 ---"
systemctl is-active afterlife-stt || true
systemctl is-enabled afterlife-stt || true
curl -s --max-time 5 http://127.0.0.1:8202/healthz || echo "(STT healthz 실패)"
echo ""
echo "--- prethird healthz ---"
curl -s --max-time 5 http://127.0.0.1:8600/healthz || echo "(prethird healthz 실패)"
echo ""
echo "================ 완료 ================"
