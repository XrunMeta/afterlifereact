#!/usr/bin/env bash
# _remote_records_deploy.sh — prethird 대화 기록(records) 배포 (root: sudo bash)
#
# 기능: 통화 턴 input/answer/meta(+wav/mp4)를 /data/records/<clone_id>/ 에 시간순 기록.
#       응답누락 진단(records_report.py: input 있고 answer 없음 = prethird 실패 / input 자체 없음 = RN 미도착).
#
# 멱등: 재실행 가능.
#
# 사전(스크립트 밖, 배포자):
#   G=afterlife-gabia; S=afterlife-server/prethird/scripts
#   scp $S/recorder.py $S/records_report.py $S/signaling.py $S/pipeline.py $S/session.py \
#       $G:/home/afterlife/afterlife-server/prethird/scripts/
#   scp afterlife-server/prethird/deploy/afterlife-prethird.service $G:/tmp/
#   scp afterlife-server/scripts/_remote_records_deploy.sh $G:/tmp/
#   # (선택) mp4 기록 쓸 거면: ssh $G '/home/afterlife/miniconda3/envs/musetalk/bin/pip install imageio imageio-ffmpeg'
set -euo pipefail

test -f /tmp/afterlife-prethird.service || { echo "FATAL: /tmp/afterlife-prethird.service 없음"; exit 1; }

echo "==> [1] /data/records 생성(afterlife 소유, 0700 — PII 보호)"
install -d -m700 -o afterlife -g afterlife /data
install -d -m700 -o afterlife -g afterlife /data/records

echo "==> [2] 갱신 unit 설치(records env + ReadWritePaths=/data)"
install -m644 -o root -g root /tmp/afterlife-prethird.service /etc/systemd/system/afterlife-prethird.service

echo "==> [3] daemon-reload + restart"
systemctl daemon-reload
systemctl restart afterlife-prethird
sleep 10  # musetalk in-proc 로드 ~6.5s + 여유

echo ""
echo "================ 검증 ================"
echo -n "prethird healthz: "; curl -s --max-time 8 http://127.0.0.1:8600/healthz; echo

echo -n "records 쓰기 확인(afterlife): "
sudo -u afterlife touch /data/records/.deploy-probe && echo "OK (probe 생성)" && rm -f /data/records/.deploy-probe || echo "FAIL"

echo -n "records 디렉토리 권한(0700 기대): "
stat -c '%a %U:%G' /data/records

echo "umask 실측(afterlife) — 0600 파일 권한 보장 확인:"
sudo -u afterlife bash -c 'umask; t=$(mktemp /data/records/.umask-probe.XXXX); python3 -c "import os,sys; print(\"probe perm:\", oct(os.stat(sys.argv[1]).st_mode & 0o777))" "$t"; rm -f "$t"' 2>/dev/null || echo "  (python3 미존재 — recorder는 os.open 0o600 명시라 umask 무관)"

echo -n "실효 env(records): "
pid=$(systemctl show -p MainPID --value afterlife-prethird)
tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null \
  | grep -E 'PRETHIRD_RECORDS_ROOT|PRETHIRD_RECORD_MP4' | tr '\n' ' '; echo

echo "================ 완료 ================"
echo ""
echo "실통화 후 진단:"
echo "  python3 /home/afterlife/afterlife-server/prethird/scripts/records_report.py /data/records <clone_id>"
echo "  → 첫턴 무응답이면 'input 있고 meta 없음'=미응답(RN 미도착) vs 'answer_chars=0'=처리실패 판정"
