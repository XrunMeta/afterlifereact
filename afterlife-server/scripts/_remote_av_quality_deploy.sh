#!/usr/bin/env bash
# _remote_av_quality_deploy.sh — prethird AV 품질 quick wins 배포 (root: sudo bash)
#
# 변경: sentence_buffer/audio_utils/pipeline/idle/media_tracks + unit(env 3종).
# 전부 env 토글이라 이상 시 unit 에서 =0 으로 즉시 비활성(회귀 안전).
#
# 사전(배포자, 스크립트 밖): deploy-av-quality.sh 가 scp 수행.
set -euo pipefail
S=/home/afterlife/afterlife-server/prethird/scripts
PY=/home/afterlife/miniconda3/envs/musetalk/bin/python

echo "==> [unit 설치] afterlife-prethird.service (AV 품질 env 3종)"
test -f /tmp/afterlife-prethird.service || { echo "FATAL: unit 없음"; exit 1; }
install -m644 -o root -g root /tmp/afterlife-prethird.service /etc/systemd/system/afterlife-prethird.service
systemctl daemon-reload
systemctl restart afterlife-prethird
sleep 10

echo ""
echo "================ 검증 ================"
echo -n "healthz: "; curl -s --max-time 8 http://127.0.0.1:8600/healthz; echo
echo -n "AV env: "
pid=$(systemctl show -p MainPID --value afterlife-prethird)
tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep -E "PRETHIRD_AUDIO_NORM|PRETHIRD_AUDIO_FADE_MS|PRETHIRD_IDLE_BLEND_FRAMES" || echo "(env 없음 — 확인!)"
echo ""
echo "==> [가비아 전체 회귀] 로컬 미검증분(media_tracks av + pipeline async) 포함"
cd /home/afterlife/afterlife-server/prethird
sudo -u afterlife "$PY" -m pytest tests/test_audio_utils.py tests/test_sentence_buffer.py \
    tests/test_idle.py tests/test_media_tracks.py tests/test_pipeline.py -q 2>&1 | tail -15
echo "================ 완료 ================"
echo "실통화 1건 → records_report.py /data/records <clone_id> 로 정상 확인."
echo "이상 시 토글 off: unit 에서 해당 env =0 후 restart (또는 drop-in)."
