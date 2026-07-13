#!/bin/bash
# T-068: sweep raw mp4 → audio mux
# 컨테이너 내에서 실행: /root/FasterLivePortrait/t068_mux.sh
SWEEP_DIR="/root/FasterLivePortrait/gominju_out/sweep"
AUDIO="/root/FasterLivePortrait/gominju_speech.wav"
OUT_DIR="/root/FasterLivePortrait/gominju_out/sweep_muxed"

mkdir -p "$OUT_DIR"

for raw in "$SWEEP_DIR"/*_raw.mp4; do
    base=$(basename "$raw" _raw.mp4)
    out="$OUT_DIR/${base}_audio.mp4"
    echo "[MUX] $raw -> $out"
    ffmpeg -y -i "$raw" -i "$AUDIO" \
        -c:v libx264 -preset fast -crf 18 \
        -c:a aac -b:a 128k \
        -shortest "$out" 2>&1 | tail -3
    echo "  saved: $out"
done

echo "[DONE] mux 완료"
ls -lh "$OUT_DIR/"
