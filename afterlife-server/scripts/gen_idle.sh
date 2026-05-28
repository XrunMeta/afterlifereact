#!/usr/bin/env bash
# 029-H: halbae idle mp4 생성 — 무음 N초 wav → musetalk → 입 다문 idle 영상.
# 사용: scp gen_idle.sh afterlife-gabia:/tmp/ && ssh afterlife-gabia "bash /tmp/gen_idle.sh 10"
set -euo pipefail
SEC="${1:-10}"
MT_INPUT=/home/afterlife/afterlife-server/musetalk-afterlife/inputs
OUT_DIR=/home/afterlife/afterlife-server/musetalk-afterlife/outputs/v15
REF_DIR=/home/afterlife/afterlife-server/musetalk-afterlife/reference_videos/halbae
SILENT="$MT_INPUT/idle-silent.wav"

echo "[1] 무음 ${SEC}s wav 생성 (24kHz mono s16)"
mkdir -p "$MT_INPUT"
ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t "$SEC" -c:a pcm_s16le "$SILENT" 2>/dev/null
echo "  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SILENT")s"

echo "[2] musetalk /infer (output_id=idle)"
curl -fsS -X POST http://127.0.0.1:8300/infer -H 'Content-Type: application/json' \
  -d "{\"audio_path\":\"$SILENT\",\"output_id\":\"idle\"}" | head -c 400; echo

echo "[3] 생성된 idle mp4 후보"
ls -la "$OUT_DIR"/*idle*.mp4 2>/dev/null || echo "  (idle 패턴 mp4 없음 — musetalk 출력 네이밍 확인 필요)"
echo "[DONE] gen_idle — [3] 결과를 halbae-idle.mp4 로 cp 하면 완료"
echo "  예: cp <위 출력>.mp4 $REF_DIR/halbae-idle.mp4"
