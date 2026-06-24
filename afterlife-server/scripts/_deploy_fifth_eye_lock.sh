#!/bin/bash
# _deploy_fifth_eye_lock.sh — fifth idle 눈 source-lock 배포(T-077 이식). 가비아에서 실행.
#
# ① 컨테이너 FLP pipeline 백업(.bak-eyelock, 1회) ② 멱등 패치(_patch_fifth_eye_lock.py)
# ③ fifth_render_server 재기동(FIFTH_EYE_SOURCE_LOCK env 포함) ④ health 확인
#
# env 토글: FIFTH_EYE_SOURCE_LOCK=1 FIFTH_EYE_TARGET_SCALE=0.8 (idle/발화 공통, 눈만 source 실측으로 고정).
# 멱등: 패치는 marker 체크로 1회만, 재실행 안전. 재기동 명령의 나머지 env 는 현재 운영값(calm4b/9:16) 보존.
#
# ⚠️ fifth_render_server 기동이 수동(전용 systemd 없음) — 이 스크립트가 사실상 기동 정본.
#    컨테이너 재생성 시 패치 유실 → docker commit 별도 권장(README 참조).
set -e

CONTAINER=fifth_poc_flp
FLP=/root/FasterLivePortrait/src/pipelines/faster_live_portrait_pipeline.py
RENDER_URL=${FIFTH_RENDER_URL:-http://203.0.113.30:8810}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TMP="/tmp/_flp_eyelock_$$.py"

echo "=== 1) 컨테이너 → 호스트 + 백업 ==="
docker cp "$CONTAINER:$FLP" "$TMP"
docker exec "$CONTAINER" sh -c "[ -f $FLP.bak-eyelock ] || cp $FLP $FLP.bak-eyelock && echo backup-ok"

echo "=== 2) 멱등 패치 ==="
python3 "$SCRIPT_DIR/_patch_fifth_eye_lock.py" "$TMP"

echo "=== 3) 호스트 → 컨테이너 ==="
docker cp "$TMP" "$CONTAINER:$FLP"
rm -f "$TMP"

echo "=== 4) fifth_render_server 재기동 (FIFTH_EYE_SOURCE_LOCK=1) ==="
docker exec "$CONTAINER" pkill -f fifth_render_server.py 2>/dev/null || true
sleep 3
docker exec -d "$CONTAINER" bash -lc "cd /root/FasterLivePortrait && \
  LD_LIBRARY_PATH=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib \
  FIFTH_CFG_YAML=configs/trt_infer.yaml FIFTH_LIP_OPEN=0.24 FIFTH_CFG_SCALE=2.0 \
  FIFTH_BLINK=1 FIFTH_HEAD_SMOOTH=3.5 FIFTH_RENDER_TIMING=1 \
  FIFTH_INPUT_NORMALIZE=1 FIFTH_PASTEBACK_OUTPUT=1 \
  FIFTH_EYE_SOURCE_LOCK=1 FIFTH_EYE_TARGET_SCALE=0.8 \
  nohup /root/miniconda3/bin/python fifth_render_server.py > /tmp/fifth_render_server.log 2>&1 &"

echo "=== 5) health 대기 ==="
ok=0
for i in $(seq 1 40); do
  sleep 3
  if curl -sf "$RENDER_URL/health" >/dev/null 2>&1; then echo "health OK (~$((i*3))s)"; ok=1; break; fi
done
docker exec "$CONTAINER" tail -5 /tmp/fifth_render_server.log
if [ "$ok" != 1 ]; then
  echo "ERROR: health FAIL (~120s) — fifth_render_server 기동 실패. 위 로그 확인 후 수동 복구(.bak-eyelock 복원)." >&2
  exit 1
fi
echo "=== done ==="
