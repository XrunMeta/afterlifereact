#!/usr/bin/env bash
# T-088 라운드4: 기존 클론 filler 재생성 (새 FILLER_TEXTS·볼륨 0.3·6초+ 반영)
#
# 절차(클론별):
#   1) 원격 D1(preview)에서 해당 클론의 filler 잡(id·callback_token·face src_file_id)
#      + voice 원본 file_id(clones.voice_se_url ↔ voice_clone 잡 out_url 조인) 조회
#   2) 잡 status 를 'failed' 로 되돌림 (filler-job-done claim 이 pending/running/failed
#      재시도를 허용하므로, done 잡은 이 전환을 거쳐야 재처리 가능)
#   3) 가비아 orchestrator(127.0.0.1:8100)에 원 job_id+callback_token 으로 재접수(202)
#   완료되면 콜백이 새 mp4 3개로 clones.filler_video_urls 를 덮어쓴다.
#
# ⚠ 옛 files 행·R2 mp4 3개는 고아로 남는다(클론당 3개, 정리는 후속 태스크).
# ⚠ 반드시 가비아 testbed 가 신규 assetJobRunner(새 상수) 로 재기동된 뒤 실행.
# 전제: 로컬 afterlifeapi 에서 wrangler 인증 OK · jq 설치 · ssh afterlife-gabia.
#
# 사용: bash _remote_filler_regen.sh <clone_id> [<clone_id> ...]
set -euo pipefail

REMOTE=afterlife-gabia
API_BASE="${API_BASE:-https://edge-alt-preview.example.invalid}"
# 스크립트 위치(prethird/scripts) → 레포 루트/afterlifeapi
API_DIR="$(cd "$(dirname "$0")/../../../afterlifeapi" && pwd)"

[ $# -ge 1 ] || { echo "사용: $0 <clone_id> [<clone_id> ...]"; exit 1; }

d1() {
  (cd "$API_DIR" && npx wrangler d1 execute afterlife-db-preview --env preview --remote --json --command "$1" 2>/dev/null)
}

for CLONE in "$@"; do
  [[ "$CLONE" =~ ^[0-9]+$ ]] || { echo "[$CLONE] 잘못된 clone_id — 스킵"; continue; }
  echo "── clone $CLONE ──"

  ROW=$(d1 "SELECT j.id job_id, j.callback_token tok, j.src_file_id face_fid, j.status st,
      (SELECT v.src_file_id FROM clone_asset_jobs v
        WHERE v.out_url=(SELECT voice_se_url FROM clones WHERE id=$CLONE)
          AND v.kind='voice_clone' AND v.status='done'
        ORDER BY v.created_at DESC LIMIT 1) voice_fid
    FROM clone_asset_jobs j WHERE j.kind='filler' AND j.clone_id=$CLONE
    ORDER BY j.created_at DESC LIMIT 1;" | jq -r '.[0].results[0] // empty')
  if [ -z "$ROW" ]; then echo "  filler 잡 없음 — 스킵"; continue; fi

  JOB=$(jq -r .job_id <<<"$ROW"); TOK=$(jq -r .tok <<<"$ROW")
  FACE=$(jq -r .face_fid <<<"$ROW"); VOICE=$(jq -r .voice_fid <<<"$ROW"); ST=$(jq -r .st <<<"$ROW")
  if [ "$VOICE" = "null" ] || [ "$FACE" = "null" ]; then echo "  face/voice 원본 없음 — 스킵"; continue; fi
  if [ "$ST" = "running" ]; then echo "  잡이 running(처리 중) — 스킵"; continue; fi

  # done/failed → failed (claim 재시도 경로 진입)
  d1 "UPDATE clone_asset_jobs SET status='failed', error='regen(T-088 r4)', updated_at=datetime('now')
      WHERE id='$JOB' AND status IN ('done','failed','pending');" >/dev/null
  echo "  잡 $JOB → failed (재시도 준비)"

  # 가비아 orchestrator 재접수 (시크릿은 서버 안에서만 읽음)
  CODE=$(ssh "$REMOTE" "SECRET=\$(grep '^ORCH_SECRET=' /home/afterlife/afterlife-server/testbed/.env | cut -d= -f2- | tr -d '\"');
    curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:8100/internal/asset-job \
      -H \"Authorization: Bearer \$SECRET\" -H 'Content-Type: application/json' \
      -d '{\"job_id\":\"$JOB\",\"kind\":\"filler\",\"face_url\":\"$API_BASE/api/files/$FACE\",\"clone_id\":\"$CLONE\",\"voice_raw_url\":\"$API_BASE/api/files/$VOICE\",\"callback_token\":\"$TOK\"}'")
  echo "  orchestrator 재접수: HTTP $CODE $([ "$CODE" = "202" ] && echo OK || echo '⚠ 확인 필요')"
done

echo
echo "직렬 큐 처리 대기 후 상태 확인:"
echo "  (afterlifeapi) npx wrangler d1 execute afterlife-db-preview --env preview --remote \\"
echo "    --command \"SELECT clone_id,status,updated_at FROM clone_asset_jobs WHERE kind='filler' ORDER BY updated_at DESC LIMIT 10;\""
