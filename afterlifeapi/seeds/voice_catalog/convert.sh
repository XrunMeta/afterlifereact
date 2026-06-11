#!/usr/bin/env bash
# docs/voices 9종 → seeds/voice_catalog/out/{slug}.mp3 (192k mono 44.1k)
set -euo pipefail
SRC="/Volumes/exDN/devExdn/afterlife/docs/voices"
OUT="$(dirname "$0")/out"
mkdir -p "$OUT"

declare -A MAP=(
  ["영지.mp3"]=yeongji ["미주.mp3"]=miju ["연화스님.mp3"]=yeonhwa
  ["상준.m4a"]=sangjun ["철수.wav"]=cheolsu ["호철.wav"]=hocheol
  ["원미.wav"]=wonmi ["청이.wav"]=cheongi ["금이.wav"]=geumi
)
for f in "${!MAP[@]}"; do
  slug="${MAP[$f]}"
  echo "  $f → $slug.mp3"
  ffmpeg -y -i "$SRC/$f" -ac 1 -ar 44100 -b:a 192k "$OUT/$slug.mp3" </dev/null
done
echo "변환 완료: $(ls "$OUT" | wc -l) 개"
