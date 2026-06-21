#!/usr/bin/env bash
# T-078: fifth 통화 영상 세로 출력 — 컨테이너 FLP pipeline realtime paste-back 가드 제거
#
# 배경: flp_engine.render 가 FIFTH_PASTEBACK_OUTPUT=1 시 result[1](paste-back된 원본 비율
#   프레임)을 반환하도록 수정했으나(레포 반영), result[1]이 실제로 paste-back 되려면
#   FLP 내부 pipeline _run 의 paste_back_pytorch 호출이 realtime 경로에서도 실행돼야 한다.
#   기본 FLP 는 `if not realtime and ...` 가드로 실시간에서 paste-back 을 건너뛰어
#   정지 원본만 남기고 render 는 crop 정사각(out_crop)을 내보낸다 → 통화 영상이 정사각.
#
# 이 스크립트는 그 realtime 가드를 제거한다(멱등·백업·syntax 검증).
# FLP 내부 코드(src/pipelines/)는 afterlife 레포 밖이라 배포 스크립트로 관리한다.
# mask_ori_float / M 은 prepare_source(realtime 무관)에서 src_info 에 저장되어
# _run 이 언팩하므로, paste_back 활성화 시 추가 준비 없이 동작한다(검증됨).
set -euo pipefail

C=${FIFTH_CONTAINER:-fifth_poc_flp}
F=/root/FasterLivePortrait/src/pipelines/faster_live_portrait_pipeline.py

PATCHED_LINE='if self.cfg.infer_params.flag_pasteback and self.cfg.infer_params.flag_do_crop and self.cfg.infer_params.flag_stitching:'
GUARDED_LINE='if not realtime and self.cfg.infer_params.flag_pasteback and self.cfg.infer_params.flag_do_crop and self.cfg.infer_params.flag_stitching:'

# 멱등: 이미 패치됐으면(paste_back 조건에서 'not realtime' 제거됨) skip
if ! docker exec "$C" grep -qF "$GUARDED_LINE" "$F"; then
  echo "이미 패치됨(또는 가드 없음) — skip"
  exit 0
fi

# 백업
BAK="${F}.bak-pasteback-$(date +%Y%m%d-%H%M%S)"
docker exec "$C" cp "$F" "$BAK"
echo "백업: $BAK"

# realtime 가드 제거 — paste_back_pytorch 호출 조건 라인만(콜론으로 끝나는 한 줄).
#   (line ~332 mask 재준비 가드는 src_info 언팩 경로라 패치 불필요)
docker exec "$C" sed -i "s|$GUARDED_LINE|$PATCHED_LINE|" "$F"

# syntax 검증
docker exec "$C" bash -lc "cd /root/FasterLivePortrait && /root/miniconda3/bin/python -c 'import ast; ast.parse(open(\"src/pipelines/faster_live_portrait_pipeline.py\").read()); print(\"SYNTAX_OK\")'"
echo "패치 완료 — fifth_render_server 재기동 필요(FIFTH_PASTEBACK_OUTPUT=1)"
