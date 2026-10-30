"""구동영상 → 보정된 구동 동작 pkl (AFL-1064). fifth_poc_flp 컨테이너 안에서 실행한다.

  python build_driving_motion.py --video loop02_disagreement.mp4 --out disagreement.pkl [--crop 560:560:280:0]

1. 얼굴 중심 크롭(FLP 설정 flag_crop_driving_video=False 라 원본 그대로면 얼굴이 작다)
2. FLP run.py 로 동작 추출(소스 = 크롭 영상 첫 프레임, 동작만 쓰고 렌더 결과는 버린다)
3. driving_motion.correct — 고개 0.7배 → σ=2 스무딩 → 끝 24프레임 중립 수렴 + 보정 표시
4. 상의용 지표 출력(떨림·끝↔처음 차이). 렌더 샘플은 render_emotion_clip.py 로 만들어 함께 확인한다.

LD_LIBRARY_PATH 에 TensorRT lib 가 있어야 한다(fifth_render_server 와 같은 env).
"""
from __future__ import annotations

import argparse
import pickle
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from driving_motion import CORRECTION, correct, reversal_ratio  # noqa: E402

FLP_ROOT = Path("/root/FasterLivePortrait")
FLP_CFG = "configs/trt_infer.yaml"


def run_flp(src_image: Path, driving: Path) -> Path:
    """FLP run.py 실행 후 새로 생긴 results/<ts>/ 디렉터리를 돌려준다."""
    before = set((FLP_ROOT / "results").glob("*/"))
    subprocess.run(
        [sys.executable, "run.py", "--src_image", str(src_image), "--dri_video", str(driving),
         "--cfg", FLP_CFG, "--paste_back"],
        cwd=FLP_ROOT, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    new = sorted(set((FLP_ROOT / "results").glob("*/")) - before)
    if not new:
        raise RuntimeError("FLP 결과 디렉터리가 생기지 않았다")
    return new[-1]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--crop", default="560:560:280:0", help="ffmpeg crop w:h:x:y (얼굴 중심, 고개 숙인 프레임까지 들어오게)")
    args = ap.parse_args()

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        crop = tmp / f"{args.video.stem}.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(args.video),
                        "-vf", f"crop={args.crop},scale=512:512", "-c:v", "libx264", "-crf", "16",
                        "-pix_fmt", "yuv420p", "-an", str(crop)], check=True)
        first = tmp / "first.png"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(crop), "-frames:v", "1", str(first)], check=True)
        res = run_flp(first, crop)
        raw = pickle.load(open(res / f"{crop.name}.pkl", "rb"))

    out = correct(raw)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    pickle.dump(out, open(args.out, "wb"))

    m0, m1 = raw["motion"], out["motion"]
    end_gap = max(float(np.abs(m1[-1][k] - m1[0][k]).max()) for k in ("pitch", "yaw", "roll"))
    print(f"[build_driving_motion] {args.video.name} → {args.out} ({len(m1)}프레임 · {raw['output_fps']}fps)")
    print(f"  보정 = {CORRECTION}")
    for key in ("pitch", "yaw", "roll"):
        print(f"  {key} 방향 뒤집힘(떨림) {reversal_ratio(m0, key) * 100:.0f}% → {reversal_ratio(m1, key) * 100:.0f}%")
    print(f"  끝↔처음 고개 각도 차이 {end_gap:.4f}도 (0 이면 중립 복귀)")


if __name__ == "__main__":
    main()
