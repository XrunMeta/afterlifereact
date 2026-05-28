#!/usr/bin/env python3
"""motion_profile.py — 영상의 영역별 움직임(frame-to-frame diff) 정량.

idle reference 선택용: 눈(blink)은 남기고 입/턱(talking) 모션은 최소인 reference 찾기.
halbae 프레임(1280×918) 기준 고정 ROI. mouth=립싱크 작업서 검증된 박스.
출력: 영상별 mouth_diff / eye_diff / overall_diff (mean abs frame-diff, 0~255 스케일).
"""
import sys
import numpy as np

# halbae 1280×918 기준 ROI (y0,y1,x0,x1)
MOUTH = (765, 875, 420, 570)   # 립싱크 작업 검증 박스
EYE = (470, 585, 315, 605)     # 양 눈 영역(분산 히트맵 기준 broad)


def diff_in(frames, roi):
    y0, y1, x0, x1 = roi
    sub = frames[:, y0:y1, x0:x1].astype(np.float32)
    return float(np.abs(np.diff(sub, axis=0)).mean())


def profile(path):
    import av
    c = av.open(path)
    fr = [f.to_ndarray(format="gray") for f in c.decode(video=0)]
    c.close()
    f = np.stack(fr)
    return dict(
        n=len(f), hw=list(f.shape[1:]),
        overall=round(float(np.abs(np.diff(f.astype(np.float32), axis=0)).mean()), 3),
        mouth=round(diff_in(f, MOUTH), 3),
        eye=round(diff_in(f, EYE), 3),
    )


def main():
    for p in sys.argv[1:]:
        r = profile(p)
        name = p.rsplit("/", 1)[-1]
        print(f"{name:34s} n={r['n']:3d} {r['hw']} | overall={r['overall']:6.3f} "
              f"mouth={r['mouth']:6.3f} eye={r['eye']:6.3f} eye/mouth={r['eye']/(r['mouth']+1e-6):.2f}")


if __name__ == "__main__":
    main()
