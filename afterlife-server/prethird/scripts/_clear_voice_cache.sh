#!/usr/bin/env bash
# 클론 reference voice.wav 캐시 삭제 — denoise 토글 변경 후 재생성 유도.
# ensure_voice_wav는 캐시가 있으면 skip하므로, denoise 적용엔 캐시 삭제가 선행돼야 한다.
# 사용: _clear_voice_cache.sh [clone_id ...]   (인자 없으면 전체 voice.wav)
set -euo pipefail
REF_ROOT="${PRETHIRD_REF_ROOT:-/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices}"
if [ ! -d "$REF_ROOT" ]; then
  echo "REF_ROOT 없음: $REF_ROOT" >&2
  exit 1
fi
if [ "$#" -eq 0 ]; then
  echo "전체 voice.wav 삭제 @ $REF_ROOT"
  find "$REF_ROOT" -mindepth 2 -maxdepth 2 -name voice.wav -print -delete
else
  for cid in "$@"; do
    f="$REF_ROOT/$cid/voice.wav"
    if [ -f "$f" ]; then rm -v "$f"; else echo "없음(skip): $f"; fi
  done
fi
