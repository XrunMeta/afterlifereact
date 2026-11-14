#!/bin/bash
# AFL-1094 1단계 — 추가만 한다 (운영 설정·서비스·구운 클립 무변경).
#   1. 컨테이너 src/models 에 MediaPipeFaceModelFixed 추가 + __init__.py 에 import 한 줄 추가
#   2. 지금 쓰는 설정 2개의 MediaPipe 판 사본 생성 (face_analysis 블록만 교체, 나머지 값 동일)
#        configs/trt_infer.yaml          → configs/trt_infer_mp.yaml          (fifth 렌더·감정 굽기)
#        configs/trt_infer_exp_soft.yaml → configs/trt_infer_exp_soft_mp.yaml (미소 클립)
#   3. 새 설정으로 엔진이 뜨는지 + 얼굴 1장 확인
#   4. 컨테이너 스냅샷 docker commit (fifth_poc_flp:afl1094-a)
# 기본은 dry-run. 실제 적용은 --apply.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APPLY=0; [ "$1" = "--apply" ] && APPLY=1
echo "mode: $([ $APPLY = 1 ] && echo APPLY || echo dry-run)"
scp -q "$HERE/mediapipe_face_fixed.py" afterlife-gabia:/tmp/mediapipe_face_fixed.py
ssh afterlife-gabia "APPLY=$APPLY bash -s" <<'REMOTE'
set -e
C=fifth_poc_flp
FLP=/root/FasterLivePortrait
LD=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib
docker exec $C sh -c "test -f $FLP/configs/trt_infer.yaml && test -f $FLP/configs/trt_infer_exp_soft.yaml" || { echo "원본 설정 없음"; exit 1; }
if [ "$APPLY" != 1 ]; then
  echo "[dry-run] 할 일:"
  echo "  docker cp mediapipe_face_fixed.py -> $FLP/src/models/"
  echo "  __init__.py 에 'from .mediapipe_face_fixed import MediaPipeFaceModelFixed' 추가 (이미 있으면 건너뜀)"
  echo "  trt_infer_mp.yaml · trt_infer_exp_soft_mp.yaml 생성"
  echo "  엔진 로드·얼굴 1장 확인 → docker commit $C fifth_poc_flp:afl1094-a"
  exit 0
fi
docker cp /tmp/mediapipe_face_fixed.py $C:$FLP/src/models/mediapipe_face_fixed.py
docker exec $C sh -c "grep -q MediaPipeFaceModelFixed $FLP/src/models/__init__.py || echo 'from .mediapipe_face_fixed import MediaPipeFaceModelFixed' >> $FLP/src/models/__init__.py"
docker exec -i $C /root/miniconda3/bin/python - <<'PY'
from omegaconf import OmegaConf
base = "/root/FasterLivePortrait/configs/"
for src, dst in (("trt_infer.yaml", "trt_infer_mp.yaml"), ("trt_infer_exp_soft.yaml", "trt_infer_exp_soft_mp.yaml")):
    cfg = OmegaConf.load(base + src)
    n = 0
    for sect in ("models", "animal_models"):
        if sect in cfg and "face_analysis" in cfg[sect]:
            cfg[sect]["face_analysis"] = OmegaConf.create({"name": "MediaPipeFaceModelFixed", "predict_type": "mp"})
            n += 1
    OmegaConf.save(cfg, base + dst)
    print(f"{dst}: face_analysis 교체 {n}곳")
PY
docker exec -e LD_LIBRARY_PATH=$LD -i $C /root/miniconda3/bin/python - <<'PY'
import sys, os, glob
sys.path.insert(0, "/root/FasterLivePortrait"); os.chdir("/root/FasterLivePortrait")
import cv2
from omegaconf import OmegaConf
from src import models
for y in ("configs/trt_infer_mp.yaml", "configs/trt_infer_exp_soft_mp.yaml"):
    m = OmegaConf.load(y).models
    fa = getattr(models, m.face_analysis.name)(**m.face_analysis)
    lm = getattr(models, m.landmark.name)(**m.landmark)
    img = cv2.imread(sorted(glob.glob("/tmp/ab/*.jpg"))[0])
    faces = fa.predict(img)
    out = lm.predict(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), faces[0]) if faces else None
    print(y, "face_analysis =", type(fa).__name__, "| 203점 =", None if out is None else out.shape)
PY
docker commit -m "AFL-1094 phase A: MediaPipeFaceModelFixed + *_mp.yaml" $C fifth_poc_flp:afl1094-a >/dev/null
echo "snapshot: fifth_poc_flp:afl1094-a"
REMOTE
