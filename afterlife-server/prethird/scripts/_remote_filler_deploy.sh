#!/usr/bin/env bash
# T-088 라운드3 대기영상(pre-speech filler) prebake 배포
#   대상: 가비아 orchestrator(testbed) + prethird. fifth 렌더서버(:8810)는
#         image source(face.jpg) 이미 지원(C 검증 2026-06-28)→배포 불요.
#   특징: 멱등(scp 덮어씀)·롤백 가능(.bak-filler-<TS> 백업)·회귀0(PRETHIRD_FILLER off 기본).
#   주의: systemd drop-in 설치·재기동은 sudo(하드블록)→히즈키 직접 `!` 실행(스크립트 끝 안내 출력).
#
#   사용: bash afterlife-server/prethird/scripts/_remote_filler_deploy.sh
#   롤백: bash afterlife-server/prethird/scripts/_remote_filler_deploy.sh --rollback <TS>
set -euo pipefail

REMOTE=afterlife-gabia
# 스크립트 위치(prethird/scripts) → afterlife-server 루트
LOCAL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TS="$(date +%Y%m%d-%H%M%S)"

ORCH_REMOTE=/home/afterlife/afterlife-server/testbed/orchestrator
PRETHIRD_REMOTE=/home/afterlife/afterlife-server/prethird/scripts
SHARED_TMP=/home/afterlife/afterlife-server/.fifth-tmp

PRETHIRD_FILES="filler_player.py signaling.py pipeline.py session.py media_tracks.py"
ORCH_FILES="assetJobRunner.js routes.js"

# ── 롤백 모드 ────────────────────────────────────────────────
if [[ "${1:-}" == "--rollback" ]]; then
  RTS="${2:?사용: --rollback <TS> (예: 20260628-1530)}"
  echo "[rollback] .bak-filler-$RTS → 운영 복원"
  ssh "$REMOTE" "set -e; \
    for f in $ORCH_FILES; do cp -p $ORCH_REMOTE/\$f.bak-filler-$RTS $ORCH_REMOTE/\$f; done; \
    for f in $PRETHIRD_FILES; do [ -f $PRETHIRD_REMOTE/\$f.bak-filler-$RTS ] && cp -p $PRETHIRD_REMOTE/\$f.bak-filler-$RTS $PRETHIRD_REMOTE/\$f || true; done"
  echo "[rollback] 코드 복원 완료. drop-in 제거+재기동은 히즈키 sudo:"
  echo "  sudo rm -f /etc/systemd/system/afterlife-testbed.service.d/filler.conf /etc/systemd/system/afterlife-prethird.service.d/filler.conf"
  echo "  sudo systemctl daemon-reload && sudo systemctl restart afterlife-testbed afterlife-prethird"
  exit 0
fi

# ── 1. 백업 ─────────────────────────────────────────────────
echo "[1/5] 백업 (.bak-filler-$TS)"
ssh "$REMOTE" "set -e; \
  for f in $ORCH_FILES; do [ -f $ORCH_REMOTE/\$f ] && cp -p $ORCH_REMOTE/\$f $ORCH_REMOTE/\$f.bak-filler-$TS || true; done; \
  for f in $PRETHIRD_FILES; do [ -f $PRETHIRD_REMOTE/\$f ] && cp -p $PRETHIRD_REMOTE/\$f $PRETHIRD_REMOTE/\$f.bak-filler-$TS || true; done"

# ── 2. orchestrator scp ─────────────────────────────────────
echo "[2/5] scp orchestrator → $ORCH_REMOTE"
for f in $ORCH_FILES; do
  scp -q "$LOCAL_ROOT/testbed/orchestrator/$f" "$REMOTE:$ORCH_REMOTE/$f"
done

# ── 3. prethird scp ─────────────────────────────────────────
echo "[3/5] scp prethird → $PRETHIRD_REMOTE"
for f in $PRETHIRD_FILES; do
  scp -q "$LOCAL_ROOT/prethird/scripts/$f" "$REMOTE:$PRETHIRD_REMOTE/$f"
done

# ── 4. 공유 tmp 디렉토리 + drop-in conf 준비(/tmp, sudo 불요) ──
echo "[4/5] 공유 tmp 보장 + drop-in conf → /tmp/filler-dropins"
ssh "$REMOTE" "set -e; mkdir -p $SHARED_TMP; mkdir -p /tmp/filler-dropins; \
cat > /tmp/filler-dropins/filler-orch.conf <<'CONF'
[Service]
# T-088 filler 생성: qwen3tts·fifth 렌더서버 URL + 공유볼륨 TMPDIR
# (orchestrator가 wav/jpeg를 공유볼륨에 둬야 fifth 컨테이너가 read)
Environment=QWEN_TTS_URL=http://127.0.0.1:8201
Environment=FIFTH_RENDER_URL=http://203.0.113.30:8810
Environment=TMPDIR=$SHARED_TMP
# ⚠️ ref_root(voice.wav 경로)는 3 프로세스가 독립 env(VOICE_REF_ROOT/
#    PRETHIRD_REF_VOICES_ROOT/QWEN3TTS_REF_ROOT)로 읽음. 셋 다 코드 기본값
#    =.../openvoice-afterlife/reference_voices 로 동일 → 여기서 재정의 안 함.
#    만약 재정의가 필요하면 반드시 3개를 동일값으로 함께 설정(el RISK).
CONF
cat > /tmp/filler-dropins/filler-prethird.conf <<'CONF'
[Service]
# T-088 filler 재생 토글(기본 off=회귀0, 1=활성)
Environment=PRETHIRD_FILLER=1
CONF
echo '  drop-in 준비됨: /tmp/filler-dropins/{filler-orch,filler-prethird}.conf'"

# ── 5. 배포 검증(코드 흔적 grep) ─────────────────────────────
echo "[5/5] 배포 검증"
ssh "$REMOTE" "set -e; \
  echo -n '  orchestrator filler 핸들러: '; grep -c \"kind === 'filler'\\|kind==='filler'\\|FILLER_TEXTS\" $ORCH_REMOTE/assetJobRunner.js || echo 0; \
  echo -n '  prethird FillerPlayer: '; [ -f $PRETHIRD_REMOTE/filler_player.py ] && echo OK || echo MISSING; \
  echo -n '  signaling PRETHIRD_FILLER: '; grep -c 'PRETHIRD_FILLER' $PRETHIRD_REMOTE/signaling.py || echo 0; \
  echo -n '  media_tracks flush: '; grep -c 'def flush' $PRETHIRD_REMOTE/media_tracks.py || echo 0"

cat <<NEXT

════════════════════════════════════════════════════════════════
 코드+drop-in(/tmp) 배포 완료. 아래 sudo는 히즈키 직접 \`!\` 실행:
════════════════════════════════════════════════════════════════
# orchestrator(testbed) drop-in:
sudo mkdir -p /etc/systemd/system/afterlife-testbed.service.d
sudo cp /tmp/filler-dropins/filler-orch.conf /etc/systemd/system/afterlife-testbed.service.d/filler.conf
# prethird drop-in:
sudo mkdir -p /etc/systemd/system/afterlife-prethird.service.d
sudo cp /tmp/filler-dropins/filler-prethird.conf /etc/systemd/system/afterlife-prethird.service.d/filler.conf
# 적용:
sudo systemctl daemon-reload
sudo systemctl restart afterlife-testbed afterlife-prethird

# 확인:
sudo systemctl status afterlife-testbed afterlife-prethird --no-pager | grep Active
ssh afterlife-gabia "systemctl show afterlife-prethird -p Environment | tr ' ' '\\n' | grep FILLER"

# 롤백(필요시): bash $(basename "$0") --rollback $TS  + 위 drop-in rm + 재기동
════════════════════════════════════════════════════════════════
NEXT
echo "백업 타임스탬프: $TS (롤백 시 사용)"
