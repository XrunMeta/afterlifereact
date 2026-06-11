#!/usr/bin/env bash
# _remote_prebuild_deploy.sh — prethird 음성 선빌드(/prebuild) 배포 (root: sudo bash)
#
# 새 코드(stt_client.py·prebuild.py·signaling.py)는 scp 로 이미 반영(아래 사전단계).
# 이 스크립트: 갱신 unit(prebuild env) install + PREBUILD_SECRET drop-in + restart + 검증.
# 멱등: 재실행 가능.
#
# 사전(스크립트 밖, 배포자):
#   G=afterlife-gabia; S=afterlife-server/prethird/scripts
#   scp $S/stt_client.py $S/prebuild.py $S/signaling.py $G:/home/afterlife/afterlife-server/prethird/scripts/
#   scp afterlife-server/prethird/deploy/afterlife-prethird.service $G:/tmp/
#   openssl rand -hex 32 | ssh $G 'cat > /tmp/prebuild-secret'   # api 와 동일 값 공유 필수
#   scp afterlife-server/scripts/_remote_prebuild_deploy.sh $G:/tmp/
set -euo pipefail

test -f /tmp/afterlife-prethird.service || { echo "FATAL: /tmp/afterlife-prethird.service 없음"; exit 1; }
test -s /tmp/prebuild-secret || { echo "FATAL: /tmp/prebuild-secret 없음(openssl rand -hex 32)"; exit 1; }

echo "==> [1] 갱신 unit 설치(prebuild env 포함)"
install -m644 -o root -g root /tmp/afterlife-prethird.service /etc/systemd/system/afterlife-prethird.service

echo "==> [2] PREBUILD_SECRET drop-in (git 미추적, 600)"
SECRET=$(cat /tmp/prebuild-secret)
D=/etc/systemd/system/afterlife-prethird.service.d
install -d -m755 "$D"
printf '[Service]\nEnvironment=PREBUILD_SECRET=%s\n' "$SECRET" > "$D/prebuild-secret.conf"
chmod 600 "$D/prebuild-secret.conf"

echo "==> [3] daemon-reload + restart"
systemctl daemon-reload
systemctl restart afterlife-prethird
sleep 10  # musetalk in-proc 로드 ~6.5s + 여유

echo ""
echo "================ 검증 ================"
echo -n "prethird healthz: "; curl -s --max-time 8 http://127.0.0.1:8600/healthz; echo
echo -n "/prebuild 무인증 거부(401 기대): "
curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 -X POST http://127.0.0.1:8600/prebuild \
  -H "Content-Type: application/json" -d '{"cloneId":"_smoke","voiceRawUrl":"x"}'
echo -n "실효 env(SECRET 마스킹): "
pid=$(systemctl show -p MainPID --value afterlife-prethird)
tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null \
  | grep -E 'PREBUILD_SECRET|PRETHIRD_STT_URL|PREBUILD_MAX_CONCURRENCY|PRETHIRD_ASSET_HOST_ALLOWLIST' \
  | sed 's/PREBUILD_SECRET=.*/PREBUILD_SECRET=***/' | tr '\n' ' '; echo
echo "================ 완료 ================"

shred -u /tmp/prebuild-secret 2>/dev/null || rm -f /tmp/prebuild-secret
