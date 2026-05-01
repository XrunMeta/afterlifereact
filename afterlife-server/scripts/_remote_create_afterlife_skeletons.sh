#!/usr/bin/env bash
# _remote_create_afterlife_skeletons.sh — 회차 025 Phase 1
# legacy 와 완전 분리된 신규 모듈 디렉토리만 생성 (모델·venv 는 후속 회차에서)
set -e

BASE=/home/afterlife/afterlife-server
sudo -u afterlife -H bash -lc "
  mkdir -p $BASE/openvoice-afterlife/{models,scripts}
  mkdir -p $BASE/musetalk-afterlife/{models,scripts}
  mkdir -p $BASE/liveportrait-afterlife/{models,scripts}
  mkdir -p $BASE/mediasoup-afterlife/scripts
  mkdir -p $BASE/legacy-backup
  ls -la $BASE/
"

echo ""
echo "===== 격리 디렉토리 생성 결과 ====="
ls -la /home/afterlife/afterlife-server/

echo ""
echo "===== 디스크 ====="
df -h /home /data
