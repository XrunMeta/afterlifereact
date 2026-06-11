#!/usr/bin/env bash
# _remote_stt_icl_fix_deploy.sh — STT ICL ref_text 누설수정 배포 (root: sudo bash 이 파일)
#
# 새 server.py(decode_audio 물리 cut) + config.py(STT_MAX_SEC=10) 는 scp 로 이미 반영됨.
# 이 스크립트는 unit(STT_MAX_SEC=10 명시) 갱신 + restart(코드 재로드)만 담당.
# 멱등: 재실행해도 install + restart 반복.
set -euo pipefail

test -f /tmp/afterlife-stt.service || { echo "FATAL: /tmp/afterlife-stt.service 없음"; exit 1; }

echo "==> [1] STT unit 갱신(STT_MAX_SEC=10)"
install -m644 -o root -g root /tmp/afterlife-stt.service /etc/systemd/system/afterlife-stt.service

echo "==> [2] daemon-reload + restart (새 코드 재로드)"
systemctl daemon-reload
systemctl restart afterlife-stt

echo "==> [3] 안정화 대기"
sleep 3

echo ""
echo "================ 검증 ================"
pid=$(systemctl show -p MainPID --value afterlife-stt) || true
echo -n "STT_MAX_SEC: "; tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep STT_MAX_SEC || echo "(env 미설정 → config 기본 10)"
echo -n "active: "; systemctl is-active afterlife-stt || true
echo -n "enabled: "; systemctl is-enabled afterlife-stt || true
echo -n "healthz(첫요청전 model:false 정상): "; curl -s --max-time 5 http://127.0.0.1:8202/healthz || echo "(healthz 실패)"
echo ""
echo "================ 완료 ================"
