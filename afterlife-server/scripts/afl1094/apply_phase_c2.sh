#!/bin/bash
# AFL-1094 3-2단계 — 라이브 교체 + 다시 굽기 (라이브 변경).
#   1. 백업: 운영 pkl(v2/) · 클론 3개 감정 세트(video-ref/<c>/emo) · 미소 캐시(emote-bank)
#   2. pkl 교체: v3mp/v2_*.pkl(MediaPipe) → v2/
#   3. 미소 캐시 비우기: emote-bank 를 백업 이름으로 옮기고 빈 폴더 생성 → 요청 때 MediaPipe 로 새로 만듦
#   4. 감정 세트 다시 굽기 (백그라운드, 9236 → 9232 → 9194 순서) — 로그 /tmp/afl1094-rebake.log
#      굽는 동안 해당 클론은 감정 영상 없이 통화(표시 비운 순간부터), 끝나면 다시 켜짐
# prethird 재시작은 하지 않는다 — 굽기가 끝난 뒤 따로 (bake 스크립트 주석: 메모리 캐시가 옛 영상을 들고 있을 수 있음)
# 되돌리기: rollback_phase_c2.sh <TS>
# 기본은 dry-run. 실제 실행은 --apply.
set -e
APPLY=0; [ "$1" = "--apply" ] && APPLY=1
echo "mode: $([ $APPLY = 1 ] && echo APPLY || echo dry-run)"
ssh afterlife-gabia "APPLY=$APPLY bash -s" <<'REMOTE'
set -e
C=fifth_poc_flp
V2=/root/emote-poc/afl1064/v2
NEW=/root/emote-poc/afl1064/v3mp
REF=/home/afterlife/afterlife-server/prethird/video-ref
BANK=/data/afterlife/emote-bank
BAKE=/home/afterlife/afterlife-server/fifth/scripts/bake_clone_emo.sh
CLONES="9236 9232 9194"
TS=$(date +%Y%m%d-%H%M%S)

n=$(docker exec $C sh -c "ls $NEW/v2_*.pkl | wc -l"); [ "$n" = 37 ] || { echo "v3mp pkl $n 개 (37 아님) — 3-1단계 먼저"; exit 1; }
if pgrep -f bake_clone_emo >/dev/null; then echo "감정 굽기 진행 중 — 끝난 뒤 다시"; pgrep -af bake_clone_emo; exit 1; fi
for c in $CLONES; do [ -f $REF/$c/$c-face.jpg ] || { echo "얼굴 사진 없음: $c"; exit 1; }; done
echo "확인: v3mp 37개 · 굽기 없음 · 얼굴 사진 3개"
echo "미소 캐시: $(ls $BANK | wc -l) 클론 · $(du -sh $BANK | cut -f1)"
for c in $CLONES; do echo "  $c 감정 세트: $(ls $REF/$c/emo/*.mp4 | wc -l) 클립 · ready $(wc -l < $REF/$c/emo/ready.txt) 줄"; done
if [ "$APPLY" != 1 ]; then
  echo "[dry-run] 백업 → pkl 교체 → 미소 캐시 비우기 → 백그라운드 다시 굽기($CLONES)"
  exit 0
fi

# 1. 백업
docker exec $C cp -a $V2 $V2.bak-afl1094-$TS
for c in $CLONES; do cp -a $REF/$c/emo $REF/$c/emo.bak-afl1094-$TS; done
mv $BANK $BANK.bak-afl1094-$TS && mkdir -p $BANK && chmod --reference=$BANK.bak-afl1094-$TS $BANK
echo "백업 완료 (TS=$TS)"

# 2. pkl 교체
docker exec $C sh -c "cp -f $NEW/v2_*.pkl $V2/"
echo "pkl 교체: $(docker exec $C sh -c "ls $V2/v2_*.pkl | wc -l") 개"

# 3. 미소 캐시는 위에서 비움
echo "미소 캐시 비움 → $(ls $BANK | wc -l) 클론"

# 4. 다시 굽기 (백그라운드)
nohup bash -c "for c in $CLONES; do echo \"=== \$c 시작 \$(date '+%F %T')\"; EMO_REBAKE=1 EMO_LEN_SECS='2 3 4 5 6 7 8 9' bash $BAKE \$c; echo \"=== \$c 끝 rc=\$? \$(date '+%F %T')\"; done; echo ALL_DONE" \
  > /tmp/afl1094-rebake.log 2>&1 &
echo "다시 굽기 시작 pid=$! · 로그 /tmp/afl1094-rebake.log (클론당 15~20분 예상)"
echo "TS=$TS  (되돌리기: rollback_phase_c2.sh $TS)"
REMOTE
