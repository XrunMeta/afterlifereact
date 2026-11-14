#!/bin/bash
# AFL-1094 3-2단계 되돌리기 — pkl·감정 세트·미소 캐시를 백업(TS)으로 복원. 굽기가 돌고 있으면 멈추지 않고 중단 안내.
# 사용: rollback_phase_c2.sh <TS>   (복원 후 prethird 재시작은 따로)
set -e
TS="$1"; [ -n "$TS" ] || { echo "사용: $0 <TS>"; exit 1; }
ssh afterlife-gabia "TS=$TS bash -s" <<'REMOTE'
set -e
C=fifth_poc_flp
V2=/root/emote-poc/afl1064/v2
REF=/home/afterlife/afterlife-server/prethird/video-ref
BANK=/data/afterlife/emote-bank
if pgrep -f bake_clone_emo >/dev/null; then echo "굽기 진행 중 — 먼저 멈춘 뒤 다시 실행"; pgrep -af bake_clone_emo; exit 1; fi
docker exec $C sh -c "rm -rf $V2 && cp -a $V2.bak-afl1094-$TS $V2"
for c in 9236 9232 9194; do rm -rf $REF/$c/emo && cp -a $REF/$c/emo.bak-afl1094-$TS $REF/$c/emo; done
mv $BANK $BANK.mp-afl1094-$TS && cp -a $BANK.bak-afl1094-$TS $BANK
echo "복원 완료: pkl · 감정 세트 3개 · 미소 캐시 (MediaPipe 결과는 $BANK.mp-afl1094-$TS 에 보관)"
REMOTE
