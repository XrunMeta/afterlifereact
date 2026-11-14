#!/bin/bash
# AFL-1094 4단계 — InsightFace 모델(비상업 전용) 삭제 + 컨테이너 insightface 패키지 제거 (라이브 변경).
#   대상 모델
#     1. FLP 체크포인트 (호스트 /data/afterlife/fifth-poc/FasterLivePortrait = 컨테이너 /root/FasterLivePortrait, bind mount)
#        checkpoints/liveportrait_onnx/{retinaface_det_static,face_2dpose_106_static}.{onnx,trt}
#     2. 호스트 ~/.insightface (buffalo_l·buffalo_s, 881MB · 운영 코드 참조 0건)
#     3. 호스트 ~/afterlife-server/liveportrait-afterlife/source/pretrained_weights/insightface (원본 LivePortrait 실험 사본)
#   코드
#     4. FLP src/models/__init__.py 의 FaceAnalysisModel import 를 try/except 로 감쌈
#        (face_analysis_model.py 가 insightface 를 import → 패키지 제거 시 MediaPipe 경로까지 깨지는 것 방지)
#     5. 컨테이너 pip uninstall insightface
#   확인: fifth-render·emote-render 재시작 → health · MediaPipe 엔진 로드 · 남은 모델 파일 0
#   백업: 지우는 대신 /data/afterlife/bak-afl1094-insightface-<TS>/ 로 옮김 (되돌리기용 · 1주 뒤 삭제 예정)
#         + docker commit fifth_poc_flp:afl1094-pre-d (pip 상태 보존)
# 되돌리기: rollback_phase_d.sh <TS>
# 기본은 dry-run. 실제 적용은 --apply.
set -e
APPLY=0; [ "$1" = "--apply" ] && APPLY=1
echo "mode: $([ $APPLY = 1 ] && echo APPLY || echo dry-run)"
ssh afterlife-gabia "APPLY=$APPLY bash -s" <<'REMOTE'
set -e
C=fifth_poc_flp
FLPH=/data/afterlife/fifth-poc/FasterLivePortrait
CK=$FLPH/checkpoints/liveportrait_onnx
LPI=/home/afterlife/afterlife-server/liveportrait-afterlife/source/pretrained_weights/insightface
HI=/home/afterlife/.insightface
LD=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib
TS=$(date +%Y%m%d-%H%M%S)
BAK=/data/afterlife/bak-afl1094-insightface-$TS

# 사전 확인
if pgrep -f bake_clone_emo >/dev/null; then echo "감정 굽기 진행 중 — 끝난 뒤 다시"; exit 1; fi
for y in trt_infer_mp.yaml trt_infer_exp_soft_mp.yaml; do [ -f $FLPH/configs/$y ] || { echo "1단계 설정 없음: $y"; exit 1; }; done
systemctl show afterlife-fifth-render -p ExecStart | grep -q "trt_infer_mp.yaml" || { echo "fifth 렌더가 아직 MediaPipe 설정 아님 — 2단계 먼저"; exit 1; }
systemctl show afterlife-emote-render -p Environment | grep -q "trt_infer_exp_soft_mp.yaml" || { echo "미소 클립이 아직 MediaPipe 설정 아님"; exit 1; }
echo "지울 모델:"
ls -la $CK | grep -E "retinaface_det_static|face_2dpose_106_static" | awk '{print "  " $5 "  " $NF}'
echo "  ~/.insightface $(du -sh $HI 2>/dev/null | cut -f1)"
echo "  liveportrait-afterlife insightface $(du -sh $LPI 2>/dev/null | cut -f1)"
echo "패키지: $(docker exec $C /root/miniconda3/bin/pip show insightface 2>/dev/null | grep -E '^Version' || echo 없음)"
if [ "$APPLY" != 1 ]; then
  echo "[dry-run] 백업 폴더 $BAK 로 옮김 → __init__.py 패치 → pip uninstall → 재시작·확인 → docker commit"
  exit 0
fi

# 1. 백업 겸 이동 (앞서 권한 오류로 멈춘 빈 백업 폴더가 있으면 정리)
for d in /data/afterlife/bak-afl1094-insightface-*; do [ -d "$d" ] && [ -z "$(find "$d" -type f)" ] && rm -rf "$d"; done
docker commit -m "AFL-1094 before phase D" $C fifth_poc_flp:afl1094-pre-d >/dev/null
mkdir -p $BAK/flp-checkpoints $BAK/flp-src
sudo mv $CK/retinaface_det_static.* $CK/face_2dpose_106_static.* $BAK/flp-checkpoints/   # 체크포인트 폴더가 root 소유
cp -p $FLPH/src/models/__init__.py $BAK/flp-src/__init__.py
[ -d $HI ] && mv $HI $BAK/home-insightface
[ -d $LPI ] && mv $LPI $BAK/liveportrait-afterlife-insightface
echo "백업·이동 완료: $BAK ($(du -sh $BAK | cut -f1))"

# 2. __init__.py 패치 (insightface 없어도 import 되게)
python3 - "$FLPH/src/models/__init__.py" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
old = "from .face_analysis_model import FaceAnalysisModel\n"
new = ("try:  # AFL-1094: InsightFace(비상업 모델) 제거 — 패키지가 없으면 건너뜀\n"
       "    from .face_analysis_model import FaceAnalysisModel\n"
       "except ImportError:\n"
       "    pass\n")
if new in s:
    print("__init__.py 이미 패치됨")
elif old in s:
    open(p, "w").write(s.replace(old, new)); print("__init__.py 패치")
else:
    sys.exit("__init__.py 에서 FaceAnalysisModel import 줄을 못 찾음")
PY

# 3. 패키지 제거
docker exec $C /root/miniconda3/bin/pip uninstall -y insightface 2>&1 | tail -1

# 4. 확인
docker exec -e LD_LIBRARY_PATH=$LD -i $C /root/miniconda3/bin/python - <<'PY'
import sys, os
sys.path.insert(0, "/root/FasterLivePortrait"); os.chdir("/root/FasterLivePortrait")
from src import models
print("MediaPipeFaceModelFixed:", hasattr(models, "MediaPipeFaceModelFixed"), "| FaceAnalysisModel:", hasattr(models, "FaceAnalysisModel"))
try:
    import insightface; print("insightface 패키지: 남아 있음 (!)")
except ImportError:
    print("insightface 패키지: 없음")
PY
sudo systemctl restart afterlife-fifth-render afterlife-emote-render
sleep 20
echo "상태: fifth-render=$(systemctl is-active afterlife-fifth-render) emote-render=$(systemctl is-active afterlife-emote-render) prethird=$(systemctl is-active afterlife-prethird)"
echo "fifth health: $(curl -s -m5 203.0.113.30:8810/health)"
sudo journalctl -q -u afterlife-fifth-render --since "-1 min" --no-pager | grep -E "cfg=|기동|Error|Traceback" | tail -3 | sed 's/^/  /'
left=$(docker exec $C sh -c "find /root -iname '*retinaface_det*' -o -iname '*2dpose_106*' -o -iname '*det_10g*' -o -iname '*2d106det*' -o -iname 'buffalo*' -o -iname '*w600k*' 2>/dev/null | grep -v '/proc' | wc -l")
hleft=$(find -L /home/afterlife/afterlife-server /home/afterlife/.insightface /data/afterlife/fifth-poc -maxdepth 8 \( -iname '*det_10g*' -o -iname '*2d106det*' -o -iname 'buffalo*' -o -iname '*w600k*' -o -iname '*retinaface_det*' -o -iname '*2dpose_106*' \) 2>/dev/null | wc -l)
echo "남은 InsightFace 모델 파일: 컨테이너 $left · 호스트 $hleft"
docker commit -m "AFL-1094 phase D: insightface removed" $C fifth_poc_flp:afl1094-d >/dev/null
echo "snapshot: fifth_poc_flp:afl1094-d"
echo "TS=$TS  (되돌리기: rollback_phase_d.sh $TS · 백업 $BAK 은 1주 뒤 삭제)"
REMOTE
