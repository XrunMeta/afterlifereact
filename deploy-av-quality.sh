#!/usr/bin/env bash
# deploy-av-quality.sh — prethird AV 품질 quick wins 로컬→가비아 배포 런처.
# 실행:  bash deploy-av-quality.sh
set -euo pipefail
WT=/Volumes/exDN/devExdn/afterlife/.claude/worktrees/prethird-cd-sync
G=afterlife-gabia
S=afterlife-server/prethird/scripts
cd "$WT"

echo "==> [1/3] 변경 scripts scp (sentence_buffer/audio_utils/pipeline/idle/media_tracks)"
scp "$S/sentence_buffer.py" "$S/audio_utils.py" "$S/pipeline.py" \
    "$S/idle.py" "$S/media_tracks.py" \
    "$G:/home/afterlife/afterlife-server/prethird/scripts/"

echo "==> [2/3] 테스트 scp (가비아 회귀용)"
scp afterlife-server/prethird/tests/test_audio_utils.py \
    afterlife-server/prethird/tests/test_sentence_buffer.py \
    afterlife-server/prethird/tests/test_idle.py \
    afterlife-server/prethird/tests/test_media_tracks.py \
    afterlife-server/prethird/tests/test_pipeline.py \
    "$G:/home/afterlife/afterlife-server/prethird/tests/"

echo "==> [3/3] unit + 원격 배포(sudo)"
scp afterlife-server/prethird/deploy/afterlife-prethird.service "$G:/tmp/"
scp afterlife-server/scripts/_remote_av_quality_deploy.sh "$G:/tmp/"
ssh -t "$G" 'sudo bash /tmp/_remote_av_quality_deploy.sh'

echo ""
echo "✅ 배포 완료. 실통화 1건 후:"
echo "   ssh $G 'python3 /home/afterlife/afterlife-server/prethird/scripts/records_report.py /data/records <clone_id>'"
