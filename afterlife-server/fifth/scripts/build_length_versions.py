"""감정 구동 pkl → 길이 버전 pkl 들 (AFL-1064 6-4절). 전 클론 공용, 감정 클립마다 1회.

  python build_length_versions.py --pkl v2_disagreement.pkl [--secs 2,3,4,5,6,7,8,9] [--edge 15]
  → v2_disagreement_2s.pkl … v2_disagreement_9s.pkl (같은 폴더)

말이 클립보다 짧으면 중간 자세로 끝나 idle 로 툭 넘어간다 → 통화는 말 길이에 맞는 버전을 고른다.
각 버전 = 움직임 큰 구간을 잘라 앞뒤 0.6초를 중립과 이음(driving_motion.window). 프레임 수 = 초 × 25
(render_emotion_clip 이 25fps 로 맞추므로 버전 영상 길이가 그대로 초가 된다).
"""
from __future__ import annotations

import argparse
import pickle
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from driving_motion import window  # noqa: E402

FPS = 25


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pkl", required=True, type=Path)
    ap.add_argument("--secs", default="2,3,4,5,6,7,8,9")
    ap.add_argument("--edge", type=int, default=15)
    args = ap.parse_args()
    pkl = pickle.load(open(args.pkl, "rb"))
    for sec in (int(s) for s in args.secs.split(",") if s.strip()):
        if sec * FPS > len(pkl["motion"]):
            print(f"[build_length_versions] {sec}s 건너뜀 — 원본 {len(pkl['motion'])}프레임보다 길다")
            continue
        v = window(pkl, sec * FPS, args.edge)
        out = args.pkl.with_name(f"{args.pkl.stem}_{sec}s.pkl")
        pickle.dump(v, open(out, "wb"))
        print(f"[build_length_versions] {out.name} {v['afl_window']}")


if __name__ == "__main__":
    main()
