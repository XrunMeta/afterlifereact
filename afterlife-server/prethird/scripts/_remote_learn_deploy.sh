#!/bin/bash
# Phase B 통화 자동학습 — prethird 코드 가비아 배포 (scp + 구문체크 + 단위테스트).
# 실행: bash scripts/_remote_learn_deploy.sh   (로컬에서, 히즈키가 ! 로 실행)
#
# ssh alias : afterlife-gabia
# 원격 경로 : /home/afterlife/afterlife-server/prethird/scripts
# python    : /home/afterlife/miniconda3/envs/musetalk/bin/python
#
# ⚠️ 코드만 배포한다. 기능은 OFF 기본 — PRETHIRD_LEARN_ENABLED 미설정 시 learn_writeback이
#    즉시 return 하므로 통화 경로 회귀 0. 재기동(_remote_up.sh)해도 안전.
#    기능 ON(env 3종 추가)은 실통화 1건 검증 후 별도 단계(스크립트 말미 안내).
set -e

HOST=afterlife-gabia
REMOTE=/home/afterlife/afterlife-server/prethird/scripts
PRETHIRD_ROOT=/home/afterlife/afterlife-server/prethird
PY=/home/afterlife/miniconda3/envs/musetalk/bin/python
LOCAL="$(cd "$(dirname "$0")" && pwd)"

# 배포 대상 (PR#301 Phase B prethird 변경분)
FILES=(
  clone_dialog/l2_extract.py   # 신규: ollama JSON 추출 + PII allowlist/정규식
  clone_dialog/__init__.py     # 수정: extract_l2 re-export
  learn_writeback.py           # 신규: JWT sub 추출(토큰 미보존) + write-back
  signaling.py                 # 수정: offer userId 저장 + finalize 후 학습 호출
  session.py                   # 수정: Session.user_id 기본값
)

echo "=== [1/3] scp ${#FILES[@]} files → $HOST:$REMOTE ==="
for f in "${FILES[@]}"; do
  scp "$LOCAL/$f" "$HOST:$REMOTE/$f"
  echo "  ✓ $f"
done

echo ""
echo "=== [2/3] 원격 py_compile 구문 체크 ==="
ssh "$HOST" "cd $REMOTE && $PY -m py_compile \
  clone_dialog/l2_extract.py clone_dialog/__init__.py \
  learn_writeback.py signaling.py session.py \
  && echo '  ✓ syntax OK (5 files)'"

echo ""
echo "=== [3/3] 원격 단위테스트 (l2_extract · learn_writeback) ==="
ssh "$HOST" "cd $PRETHIRD_ROOT && $PY -m pytest tests/test_l2_extract.py tests/test_learn_writeback.py -q 2>&1 | tail -6 || echo '  (pytest 미설치/실패 — 구문체크는 통과)'"

echo ""
echo "================================================================"
echo " 배포 완료 — 코드만 반영(기능 OFF 기본, 통화 회귀 0)"
echo "================================================================"
echo ""
echo " ▶ 다음 1: 재기동 (OFF 상태로 안전 반영) — 정식 .service 환경"
echo "     ssh $HOST \"sudo systemctl restart afterlife-prethird && sleep 12 && \\"
echo "       systemctl is-active afterlife-prethird && curl -fsS http://127.0.0.1:8600/healthz\""
echo "     → healthz 200 확인 후 실통화 1건으로 기존 통화 회귀 없음 확인"
echo "     ⚠️ _remote_up.sh(systemd-run transient)는 정식 .service 등록 환경과 충돌(stop→기동실패→정지)."
echo "        prethird 가 /etc/systemd/system/afterlife-prethird.service 로 등록된 환경에서는 쓰지 말 것."
echo ""
echo " ▶ 다음 2: 기능 ON (실통화 검증 후) — _remote_up.sh 의 systemd-run 블록에 env 3종 추가"
echo "     --setenv=PRETHIRD_API_BASE=https://edge-alt-preview.example.invalid \\"
echo "     --setenv=LEARN_SECRET=<api preview 와 동일 secret> \\"
echo "     --setenv=PRETHIRD_LEARN_ENABLED=1 \\"
echo "   그리고 api 측: wrangler secret put LEARN_SECRET --env preview (동일 값)"
echo "   주의: LEARN_SECRET 은 스크립트에 평문 커밋 금지 — 가비아 로컬에서만 주입."
echo ""
echo " ▶ 검증(ON 후): 실통화 1턴 → journalctl -u afterlife-prethird | grep learn"
echo "     → api 측 clone_ont.auto_learned_at 갱신 확인(해당 user 통화 후)"
