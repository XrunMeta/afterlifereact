#!/bin/bash
# AFL-1094 3-1단계 — 감정 구동 동작 pkl 을 MediaPipe 설정으로 새로 만든다 (추가만, 운영 무변경).
#   출력: 컨테이너 /root/emote-poc/afl1064/v3mp/  (운영이 읽는 v2/ 는 건드리지 않음)
#   1. 감정 4종: KB AFL-1064 6-5절 v2 규칙 그대로 (크롭 680:680:300:0, 보정 version 2)
#        agreement ← loop_v2_happy2 · disagreement · warm_calm · serious
#   2. 무감정: neutral_v5_phone — 크롭 기록이 없어 후보 두 개로 만들고 기존 v2_neutral.pkl 에 가까운 쪽 채택
#   3. 감정 4종 길이 버전 2~9초 (build_length_versions.py)
#   4. 기존 v2/ 와 비교표 출력 (프레임 수·고개 폭·표정 차이)
# 기본은 dry-run. 실제 실행은 --apply. GPU 를 수 분 쓴다(fifth 컨테이너, 통화 렌더러 MuseTalk 와 별개).
set -e
APPLY=0; [ "$1" = "--apply" ] && APPLY=1
echo "mode: $([ $APPLY = 1 ] && echo APPLY || echo dry-run)"
ssh afterlife-gabia "APPLY=$APPLY bash -s" <<'REMOTE'
set -e
C=fifth_poc_flp
LD=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib:/usr/local/nvidia/lib64
S2=/root/emote-poc/afl1064/src-v2
SRC=/root/emote-poc/v2-9194
OLD=/root/emote-poc/afl1064/v2
NEW=/root/emote-poc/afl1064/v3mp
PY=/root/miniconda3/bin/python

docker exec $C grep -q 'trt_infer_mp.yaml' $S2/build_driving_motion.py || { echo "build_driving_motion 이 MediaPipe 설정이 아님 — 2단계 먼저"; exit 1; }
for f in loop_v2_happy2 loop_v2_disagreement loop_v2_warm_calm loop_v2_serious neutral_v5_phone; do
  docker exec $C test -f $SRC/$f.mp4 || { echo "원본 없음: $SRC/$f.mp4"; exit 1; }
done
echo "원본 영상 5개 확인"
if [ "$APPLY" != 1 ]; then
  echo "[dry-run] $NEW 에 v2_{agreement,disagreement,warm_calm,serious,neutral}.pkl + 길이 버전 32개 생성 예정"
  exit 0
fi

docker exec $C mkdir -p $NEW
build() {  # <원본> <출력이름> <크롭>
  echo "  만드는 중: $2 (crop $3)"
  docker exec -e LD_LIBRARY_PATH=$LD -w $S2 $C $PY $S2/build_driving_motion.py \
    --video $SRC/$1.mp4 --out $NEW/$2.pkl --crop $3 2>&1 | grep -vi objc | tail -2 | sed 's/^/    /'
}
build loop_v2_happy2       v2_agreement    680:680:300:0
build loop_v2_disagreement v2_disagreement 680:680:300:0
build loop_v2_warm_calm    v2_warm_calm    680:680:300:0
build loop_v2_serious      v2_serious      680:680:300:0
build neutral_v5_phone     _neutral_c560   560:560:280:0
build neutral_v5_phone     _neutral_c680   680:680:300:0

docker exec -i $C $PY - <<'PY'
import pickle, shutil, numpy as np
OLD = "/root/emote-poc/afl1064/v2/"; NEW = "/root/emote-poc/afl1064/v3mp/"
def load(p): return pickle.load(open(p, "rb"))
def arr(m, k): return np.array([np.squeeze(x[k]) for x in m["motion"]], dtype=float)
def diff(a, b):
    n = min(len(a["motion"]), len(b["motion"]))
    a = {"motion": a["motion"][:n]}; b = {"motion": b["motion"][:n]}
    return float(np.mean([np.abs(arr(a, k) - arr(b, k)).mean() for k in ("exp", "scale", "t", "pitch", "yaw", "roll")]))
old = load(OLD + "v2_neutral.pkl")
cand = {c: diff(load(f"{NEW}_neutral_{c}.pkl"), old) for c in ("c560", "c680")}
best = min(cand, key=cand.get)
print("무감정 크롭 후보 차이:", {k: round(v, 4) for k, v in cand.items()}, "→ 채택", best)
shutil.copy(f"{NEW}_neutral_{best}.pkl", NEW + "v2_neutral.pkl")
print(f"{'pkl':<18}{'프레임 old/new':>16}{'고개폭 old (p/y/r)':>24}{'고개폭 new (p/y/r)':>24}{'평균 차이':>10}")
for n in ("v2_neutral", "v2_agreement", "v2_disagreement", "v2_warm_calm", "v2_serious"):
    a, b = load(OLD + n + ".pkl"), load(NEW + n + ".pkl")
    rng = lambda m: "/".join(f"{np.ptp(arr(m, k)):.1f}" for k in ("pitch", "yaw", "roll"))
    print(f"{n:<18}{len(a['motion']):>8}/{len(b['motion']):<7}{rng(a):>24}{rng(b):>24}{diff(a, b):>10.4f}",
          "보정", b.get("afl_correction", {}).get("version"))
PY

for n in agreement disagreement warm_calm serious; do
  docker exec -w $S2 $C $PY $S2/build_length_versions.py --pkl $NEW/v2_$n.pkl --secs 2,3,4,5,6,7,8,9 2>&1 | tail -1 | sed 's/^/  /'
done
echo "v3mp pkl 수: $(docker exec $C sh -c "ls $NEW/v2_*.pkl | wc -l") (기대 37 = 기본 5 + 길이 32)"
REMOTE
