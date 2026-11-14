#!/bin/bash
# AFL-1094 2단계 — 운영 3경로를 MediaPipe 설정으로 전환 (라이브 변경).
#   1. fifth 렌더   : afterlife-fifth-render.service + drop-in lab-tuner.conf 의 FIFTH_CFG_YAML → configs/trt_infer_mp.yaml
#   2. 미소 클립    : afterlife-emote-render.service 의 EMOTE_RENDER_CFG → configs/trt_infer_exp_soft_mp.yaml
#   3. 감정 굽기    : 컨테이너 /root/emote-poc/afl1064/src-v2/build_driving_motion.py 의 FLP_CFG → configs/trt_infer_mp.yaml
#   4. daemon-reload → fifth-render·emote-render 재시작 → 확인 → docker commit fifth_poc_flp:afl1094-b
# 통화 기본 렌더러(musetalk)·prethird 는 재시작하지 않는다. 감정 굽기가 돌고 있으면 멈춘다.
# 되돌리기: rollback_phase_b.sh <TS>  (TS 는 실행 끝에 출력)
# 기본은 dry-run. 실제 적용은 --apply.
set -e
APPLY=0; [ "$1" = "--apply" ] && APPLY=1
echo "mode: $([ $APPLY = 1 ] && echo APPLY || echo dry-run)"
ssh afterlife-gabia "APPLY=$APPLY bash -s" <<'REMOTE'
set -e
C=fifth_poc_flp
SD=/etc/systemd/system
FIFTH=$SD/afterlife-fifth-render.service
DROP=$SD/afterlife-fifth-render.service.d/lab-tuner.conf
EMOTE=$SD/afterlife-emote-render.service
BDM=/root/emote-poc/afl1064/src-v2/build_driving_motion.py
TS=$(date +%Y%m%d-%H%M%S)

# 사전 확인
docker exec $C sh -c "test -f /root/FasterLivePortrait/configs/trt_infer_mp.yaml && test -f /root/FasterLivePortrait/configs/trt_infer_exp_soft_mp.yaml" \
  || { echo "1단계 설정 없음 — apply_phase_a.sh 먼저"; exit 1; }
if pgrep -f bake_clone_emo >/dev/null; then echo "감정 굽기 진행 중 — 끝난 뒤 다시 실행"; pgrep -af bake_clone_emo; exit 1; fi
echo "현재값:"
grep -ho "FIFTH_CFG_YAML=[^ ]*" $FIFTH $DROP | sed 's/^/  /'
grep -h "EMOTE_RENDER_CFG" $EMOTE | sed 's/^/  /'
docker exec $C grep -n '^FLP_CFG' $BDM | sed 's/^/  /'

if [ "$APPLY" != 1 ]; then
  echo "[dry-run] 바꿀 값:"
  echo "  FIFTH_CFG_YAML=configs/trt_infer_mp.yaml (서비스 파일·drop-in)"
  echo "  EMOTE_RENDER_CFG=configs/trt_infer_exp_soft_mp.yaml"
  echo "  FLP_CFG = \"configs/trt_infer_mp.yaml\" (build_driving_motion.py)"
  echo "  재시작: afterlife-fifth-render · afterlife-emote-render"
  exit 0
fi

# 백업
sudo cp -p $FIFTH  $FIFTH.bak-afl1094-$TS
cp -p $DROP        /tmp/lab-tuner.conf.bak-afl1094-$TS
sudo cp -p $DROP   $SD/afterlife-fifth-render.service.d/.lab-tuner.conf.bak-afl1094-$TS
sudo cp -p $EMOTE  $EMOTE.bak-afl1094-$TS
docker exec $C cp -p $BDM $BDM.bak-afl1094-$TS

# 변경
sudo sed -i 's#FIFTH_CFG_YAML=configs/trt_infer\.yaml#FIFTH_CFG_YAML=configs/trt_infer_mp.yaml#' $FIFTH
sed -i 's#FIFTH_CFG_YAML=configs/trt_infer\.yaml#FIFTH_CFG_YAML=configs/trt_infer_mp.yaml#' $DROP
sudo sed -i 's#^Environment=EMOTE_RENDER_CFG=.*#Environment=EMOTE_RENDER_CFG=configs/trt_infer_exp_soft_mp.yaml#' $EMOTE
docker exec $C sed -i 's#^FLP_CFG = "configs/trt_infer\.yaml"#FLP_CFG = "configs/trt_infer_mp.yaml"#' $BDM

sudo systemctl daemon-reload
sudo systemctl restart afterlife-fifth-render afterlife-emote-render
sleep 20

echo "바뀐 값:"
systemctl show afterlife-fifth-render -p ExecStart | grep -o "FIFTH_CFG_YAML=[^ ]*" | sed 's/^/  /'
systemctl show afterlife-emote-render -p Environment | tr ' ' '\n' | grep EMOTE_RENDER_CFG | sed 's/^/  /'
docker exec $C grep -n '^FLP_CFG' $BDM | sed 's/^/  /'
echo "상태: fifth-render=$(systemctl is-active afterlife-fifth-render) emote-render=$(systemctl is-active afterlife-emote-render) prethird=$(systemctl is-active afterlife-prethird)"
echo "fifth 로그:"; journalctl -q -u afterlife-fifth-render --since "-1 min" --no-pager | grep -E "cfg=|ERROR|Traceback|ready|listening" | tail -5
docker commit -m "AFL-1094 phase B: build_driving_motion FLP_CFG → trt_infer_mp.yaml" $C fifth_poc_flp:afl1094-b >/dev/null
echo "snapshot: fifth_poc_flp:afl1094-b"
echo "TS=$TS  (되돌리기: rollback_phase_b.sh $TS)"
REMOTE
