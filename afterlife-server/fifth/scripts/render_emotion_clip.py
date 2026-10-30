"""클론 사진 + 보정된 구동 pkl → 감정·무감정 클립 mp4 (AFL-1064). fifth_poc_flp 컨테이너 안에서 실행한다.

  python render_emotion_clip.py --pkl disagreement.pkl --src 9194-face.jpg --out 9194-disagreement.mp4

보정 표시(afl_correction)가 없거나 옛 버전인 pkl 은 거부한다 — build_driving_motion.py 로 만든 것만 받는다.
결과는 MuseTalk 입력 규격 25fps 로 맞춘다(프레임 수 유지, setpts).
"""
from __future__ import annotations

import argparse
import pickle
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_driving_motion import run_flp  # noqa: E402
from driving_motion import require_corrected  # noqa: E402

OUT_FPS = 25


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pkl", required=True, type=Path)
    ap.add_argument("--src", required=True, type=Path, help="클론 사진(512x1024, idle 과 같은 구도)")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    pkl = pickle.load(open(args.pkl, "rb"))
    require_corrected(pkl)
    fps = int(pkl["output_fps"])

    res = run_flp(args.src, args.pkl)
    org = next(res.glob("*-org.mp4"))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(org), "-vf", f"setpts={fps}/{OUT_FPS}*PTS",
                    "-r", str(OUT_FPS), "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-an",
                    str(args.out)], check=True)
    print(f"[render_emotion_clip] {args.src.name} × {args.pkl.name} → {args.out} ({len(pkl['motion'])}프레임 · {OUT_FPS}fps)")


if __name__ == "__main__":
    main()
