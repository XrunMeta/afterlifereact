#!/usr/bin/env bash
# =============================================================================
# fifth적용 2차 배포 — 클론 정면사진 source + 무음 idle 모션
#   대상: 가비아(afterlife-gabia, 121.254.172.32)
#   - fifth 렌더서버(컨테이너 fifth_poc_flp, GPU1): face_source.py / fifth_render_server.py
#   - prethird(호스트): signaling.py / session.py / server.py / idle_prebake.py / media_tracks.py
#   - api(CF Workers): 별도 — 맨 아래 Part D 안내 참고(wrangler)
#
# 사용:
#   ./deploy-fifth-apply2.sh            # 실제 배포(확인 프롬프트 있음)
#   DRY_RUN=1 ./deploy-fifth-apply2.sh  # 무엇을 할지 출력만(원격 변경 없음)
#
# 안전장치: 원격 덮어쓰기 전 타임스탬프 백업. sudo(prethird restart)는 이 스크립트가
#   실행하지 않고 마지막에 "히즈키가 직접 실행할 명령"으로 출력만 한다(가비아 sudo 하드블록).
# =============================================================================
set -euo pipefail

# ---- 설정(필요 시 수정) -----------------------------------------------------
GABIA="${GABIA:-afterlife-gabia}"                  # ssh 별칭
CONTAINER="${CONTAINER:-fifth_poc_flp}"            # fifth 렌더 컨테이너
CONTAINER_DIR="${CONTAINER_DIR:-/root/FasterLivePortrait}"  # 컨테이너 내 fifth scripts 루트
PRETHIRD_DIR="${PRETHIRD_DIR:-/home/afterlife/afterlife-server/prethird/scripts}"
STAGE="${STAGE:-/tmp/fifth-deploy2}"               # 가비아 호스트 staging
TS="$(date +%Y%m%d-%H%M%S)"

# 렌더서버 기동 env(MW 프리셋 — 메모리 체크포인트와 동일 + idle prebake)
RENDER_ENV='LD_LIBRARY_PATH=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib \
FIFTH_CFG_YAML=configs/trt_infer.yaml \
FIFTH_LIP_OPEN=0.24 FIFTH_CFG_SCALE=2.0 FIFTH_BLINK=1 FIFTH_HEAD_SMOOTH=3.5'

# 워크트리 루트(이 스크립트 위치 기준 = afterlife-server)
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIFTH_SRC="$HERE/fifth/scripts"
PRETHIRD_SRC="$HERE/prethird/scripts"

FIFTH_FILES=(face_source.py fifth_render_server.py)
PRETHIRD_FILES=(signaling.py session.py server.py idle_prebake.py media_tracks.py)

DRY_RUN="${DRY_RUN:-0}"
run() { echo "+ $*"; [ "$DRY_RUN" = "1" ] || "$@"; }
rrun() { echo "+ ssh $GABIA \"$*\""; [ "$DRY_RUN" = "1" ] || ssh "$GABIA" "$*"; }

echo "============================================================"
echo " fifth적용 2차 배포  (DRY_RUN=$DRY_RUN, TS=$TS)"
echo "   gabia=$GABIA container=$CONTAINER"
echo "============================================================"

# ---- 0. 로컬 파일 존재 확인 -------------------------------------------------
for f in "${FIFTH_FILES[@]}"; do [ -f "$FIFTH_SRC/$f" ] || { echo "‼ 없음: $FIFTH_SRC/$f"; exit 1; }; done
for f in "${PRETHIRD_FILES[@]}"; do [ -f "$PRETHIRD_SRC/$f" ] || { echo "‼ 없음: $PRETHIRD_SRC/$f"; exit 1; }; done
echo "✔ 로컬 변경 파일 확인 완료"

if [ "$DRY_RUN" != "1" ] && [ "${YES:-0}" != "1" ]; then
  read -r -p "위 설정으로 가비아에 배포합니다. 계속? [y/N] " ans
  [ "$ans" = "y" ] || { echo "중단."; exit 0; }
fi

# ---- 1. staging 디렉토리 + scp ---------------------------------------------
rrun "mkdir -p $STAGE/fifth $STAGE/prethird"
for f in "${FIFTH_FILES[@]}"; do
  echo "+ scp fifth/$f"; [ "$DRY_RUN" = "1" ] || scp "$FIFTH_SRC/$f" "$GABIA:$STAGE/fifth/$f"
done
for f in "${PRETHIRD_FILES[@]}"; do
  echo "+ scp prethird/$f"; [ "$DRY_RUN" = "1" ] || scp "$PRETHIRD_SRC/$f" "$GABIA:$STAGE/prethird/$f"
done

# ---- 2. fifth 렌더서버 파일 → 컨테이너 (백업 후 docker cp) -------------------
echo "--- [2] fifth → 컨테이너 $CONTAINER:$CONTAINER_DIR ---"
for f in "${FIFTH_FILES[@]}"; do
  rrun "docker exec $CONTAINER bash -lc 'cp -a $CONTAINER_DIR/$f $CONTAINER_DIR/$f.bak-$TS 2>/dev/null || true'"
  rrun "docker cp $STAGE/fifth/$f $CONTAINER:$CONTAINER_DIR/$f"
done

# ---- 3. prethird 파일 → 호스트 (백업 후 복사) -------------------------------
echo "--- [3] prethird → 호스트 $PRETHIRD_DIR ---"
for f in "${PRETHIRD_FILES[@]}"; do
  rrun "cp -a $PRETHIRD_DIR/$f $PRETHIRD_DIR/$f.bak-$TS 2>/dev/null || true"
  rrun "cp $STAGE/prethird/$f $PRETHIRD_DIR/$f"
done

# ---- 4. fifth 렌더서버 재기동 (컨테이너 내부) -------------------------------
echo "--- [4] fifth 렌더서버 재기동 (:8810) ---"
# 기존 프로세스 종료 → MW env로 백그라운드 재기동 → health 대기
rrun "docker exec $CONTAINER bash -lc 'pkill -f fifth_render_server.py || true; sleep 2'"
rrun "docker exec -d $CONTAINER bash -lc 'cd $CONTAINER_DIR && $RENDER_ENV nohup python fifth_render_server.py > /tmp/fifth_render_server.log 2>&1 &'"
echo "+ (health 확인) 컨테이너 bridge IP로 /health 200 대기 — 아래 명령으로 수동 확인:"
echo "    ssh $GABIA \"docker exec $CONTAINER bash -lc 'sleep 3; curl -sS -o /dev/null -w \\\"render /health=%{http_code}\\\\n\\\" http://127.0.0.1:8810/health'\""

# ---- 5. prethird 재기동 (sudo — 히즈키 직접) --------------------------------
cat <<EOF

============================================================
 ✅ 파일 배포 + fifth 렌더서버 재기동 트리거 완료.
 ⚠️  남은 단계는 sudo가 필요 — 히즈키가 직접 실행하세요(가비아 셸):

   # (a) prethird fifth 모드 drop-in 확인(이미 있으면 생략)
   cat /etc/systemd/system/afterlife-prethird.service.d/fifth.conf
   #   → PRETHIRD_RENDERER=fifth / FIFTH_RENDER_URL=http://203.0.113.30:8810
   #     TMPDIR=/home/afterlife/afterlife-server/.fifth-tmp
   #     (선택) FIFTH_IDLE_PREBAKE=1  FIFTH_IDLE_SEC=6

   # (b) 재기동
   sudo systemctl restart afterlife-prethird
   sudo systemctl status afterlife-prethird --no-pager | head -20
   journalctl -u afterlife-prethird -n 40 --no-pager

============================================================
 📋 검증 체크리스트 (RN 실통화):
   1) 정면사진 클론(예: gominju, idle_video 잡 done 보유)으로 통화
      → 발화 입싱크가 '정면 얼굴'(확대·변형 없음)
   2) 무발화 시 idle = 무음 모션(머리/눈깜빡, 입 다묾) — prethird 로그 '[idle] fifth prebake 주입: frames=N'
   3) faceUrl 없는 클론 → 영상(idle mp4) 폴백, 무회귀
   4) PRETHIRD_RENDERER=musetalk 로 토글 → 기존 musetalk 정상(사진 안 탐)
   * offer 로그 'face=True/False'로 faceUrl 다운로드 여부 확인
============================================================
EOF

cat <<'EOF'
 🌐 Part D — api(CF Workers) 배포 (별도, afterlifeapi 디렉토리에서):
   cd <repo>/afterlifeapi
   # 0077 마이그(out_url 인덱스) 적용
   npx wrangler d1 migrations apply <DB_NAME> --env preview
   # 워커 배포(CI 자동배포면 생략 가능)
   npx wrangler deploy --env preview
   #   → bundle.assets.faceUrl 노출 확인. 실클론 bundle에 idle_video done 잡 있어야 채워짐.
EOF

echo "완료: 위 (b) sudo 재기동 + 검증 진행하세요."
