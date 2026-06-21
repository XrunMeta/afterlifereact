#!/usr/bin/env python3
# _patch_fifth_eye_lock.py <faster_live_portrait_pipeline.py>
#
# T-077 이식: fifth(FasterLivePortrait) idle 눈 source-lock 패치를 멱등 적용한다.
# - faster_live_portrait_pipeline.py 의 _run() stitching 직후에 retarget_eye 기반 눈 고정 블록 삽입.
# - env FIFTH_EYE_SOURCE_LOCK=1 일 때만 동작(기본 비활성 → 통화 회귀 0).
# - marker('FIFTH_EYE_SOURCE_LOCK') 이미 있으면 no-op(멱등). anchor 미발견이면 비정상 종료.
#
# FLP 내부 코드(레포밖)라 컨테이너 파일을 직접 패치한다. anchor 기반이라 FLP 버전 무관.
import sys

if len(sys.argv) < 2:
    print("usage: _patch_fifth_eye_lock.py <file>", file=sys.stderr)
    sys.exit(2)

path = sys.argv[1]
with open(path, "r") as f:
    src = f.read()

if "FIFTH_EYE_SOURCE_LOCK" in src:
    print("already patched (no-op)")
    sys.exit(0)

# anchor: flag_stitching 경로의 stitching 직후 ~ 다음 else (우리 경로: retargeting + stitching)
ANCHOR = (
    "                    if self.cfg.infer_params.flag_stitching:\n"
    "                        x_d_i_new = self.stitching(x_s, x_d_i_new)\n"
    "            else:\n"
)

BLOCK = (
    "                    if self.cfg.infer_params.flag_stitching:\n"
    "                        x_d_i_new = self.stitching(x_s, x_d_i_new)\n"
    "                    # --- T-077 이식: idle 눈 source-lock (env FIFTH_EYE_SOURCE_LOCK=1, 기본 비활성=통화 회귀 0).\n"
    "                    #     base 재구성이 키운 눈을 source 실측 eye-open×scale 로 retarget. T-077 LivePortrait 와 동일 로직. ---\n"
    "                    if os.environ.get('FIFTH_EYE_SOURCE_LOCK') == '1' and source_lmk is not None:\n"
    "                        try:\n"
    "                            _es = float(os.environ.get('FIFTH_EYE_TARGET_SCALE', '0.5'))\n"
    "                        except (TypeError, ValueError):\n"
    "                            _es = 0.5\n"
    "                        if not (_es > 0.0):\n"
    "                            _es = 0.5\n"
    "                        _csr = calc_eye_close_ratio(source_lmk[None])\n"
    "                        _m = float(_csr[0][:2].mean())\n"
    "                        if _m == _m:  # NaN guard (검출 불량 얼굴)\n"
    "                            _tgt = [[_m * _es]]\n"
    "                            _cet = self.calc_combined_eye_ratio(_tgt, source_lmk)\n"
    "                            x_d_i_new = x_d_i_new + self.retarget_eye(x_s, _cet).reshape(-1, x_s.shape[1], 3)\n"
    "            else:\n"
)

if ANCHOR not in src:
    print("ERROR: anchor not found — FLP 버전이 바뀌었을 수 있음. 수동 확인 필요.", file=sys.stderr)
    sys.exit(1)

src = src.replace(ANCHOR, BLOCK, 1)
with open(path, "w") as f:
    f.write(src)
print("patched")
