# AFL-1096 A/B: BiSeNet(지금) vs MediaPipe 입싱크 마스크 비교. 읽기 전용(결과는 /tmp/afl1096-ab/ 에만 씀).
# 가비아 호스트 musetalk env 에서 실행. 실제 통화와 같은 get_image_prepare_material(jaw, cheek 90/90, extra_margin 10).
# MediaPipe 턱 아래 늘리기(chin_expand) 값을 여러 개 같이 비교한다.
import glob
import json
import os
import pickle
import sys

SRC = "/home/afterlife/afterlife-server/musetalk-afterlife/source"
REF = "/home/afterlife/afterlife-server/prethird/video-ref"
OUTS = "/data/character/cache/musetalk-outputs"
OUT = "/tmp/afl1096-ab"
sys.path.insert(0, SRC)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(SRC)

import cv2  # noqa: E402
import numpy as np  # noqa: E402

from musetalk.utils.blending import get_image_prepare_material  # noqa: E402
from musetalk.utils.face_parsing import FaceParsing  # noqa: E402
from mp_face_parsing import MediaPipeFaceParsing  # noqa: E402

N_SAMPLES = 6
EXTRA_MARGIN = 10
KS = [float(k) for k in os.environ.get("AB_KS", "0,0.06,0.10,0.14").split(",")]
os.makedirs(OUT, exist_ok=True)
fp_a = FaceParsing(left_cheek_width=90, right_cheek_width=90)
fp_bs = {k: MediaPipeFaceParsing(left_cheek_width=90, right_cheek_width=90, chin_expand=k) for k in KS}


def video_for(stem):
    c = stem.split("-")[0]
    for p in (f"{REF}/{c}/{stem}.mp4", f"{REF}/{c}/emo/{stem}.mp4"):
        if os.path.exists(p):
            return p
    return None


def overlay(frame, crop, ma, mb, label):
    xs, ys, xe, ye = [int(v) for v in crop]
    view = np.zeros((ma.shape[0], ma.shape[1], 3), dtype=np.uint8)  # crop 이 영상 밖으로 나가도 되게
    fx0, fy0 = max(xs, 0), max(ys, 0)
    fx1, fy1 = min(xe, frame.shape[1]), min(ye, frame.shape[0])
    if fx1 > fx0 and fy1 > fy0:
        view[fy0 - ys:fy1 - ys, fx0 - xs:fx1 - xs] = frame[fy0:fy1, fx0:fx1]
    view = np.ascontiguousarray(view)
    for m, col in ((ma, (0, 0, 255)), (mb, (0, 255, 0))):  # 빨강=BiSeNet, 초록=MediaPipe
        cs, _ = cv2.findContours((m > 127).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        cv2.drawContours(view, cs, -1, col, 2)
    view = cv2.resize(view, (320, int(320 * view.shape[0] / view.shape[1])))
    cv2.putText(view, label, (6, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    return view


stems = sorted({os.path.basename(p).split(".mask_")[0] for p in glob.glob(f"{OUTS}/*-idle-25fps.mask_jaw_*.pkl")})
stems += [f"{c}-emo-neutral" for c in ("9232", "9194", "9236")]
allrows = []
for stem in stems:
    vid, coord_pkl = video_for(stem), f"{OUTS}/{stem}.pkl"
    if not vid or not os.path.exists(coord_pkl):
        print(json.dumps({"stem": stem, "skip": "no video/coord"}), flush=True)
        continue
    coords = pickle.load(open(coord_pkl, "rb"))
    cap = cv2.VideoCapture(vid)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    picks = sorted({int(i * (min(n, len(coords)) - 1) / (N_SAMPLES - 1)) for i in range(N_SAMPLES)})
    acc = {k: {"iou": [], "ratio": []} for k in KS}
    fb0 = {k: fp.fallback_count for k, fp in fp_bs.items()}
    for j, fi in enumerate(picks):
        cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
        ok, frame = cap.read()
        x1, y1, x2, y2 = [int(v) for v in coords[fi]]
        if not ok or (x1, y1, x2, y2) == (0, 0, 0, 0) or x2 <= x1:
            continue
        y2 = min(y2 + EXTRA_MARGIN, frame.shape[0])
        ma, crop = get_image_prepare_material(frame, [x1, y1, x2, y2], fp=fp_a, mode="jaw")
        a = ma > 127
        for k, fp in fp_bs.items():
            mb, _ = get_image_prepare_material(frame, [x1, y1, x2, y2], fp=fp, mode="jaw")
            b = mb > 127
            union = np.logical_or(a, b).sum()
            acc[k]["iou"].append(np.logical_and(a, b).sum() / union if union else 1.0)
            acc[k]["ratio"].append(b.sum() / max(a.sum(), 1))
            if j == len(picks) // 2:
                cv2.imwrite(f"{OUT}/{stem}_k{k:.2f}.png", overlay(frame, crop, ma, mb, f"{stem.split('-')[0]} k={k:.2f}"))
    cap.release()
    r = {"stem": stem}
    for k in KS:
        if acc[k]["iou"]:
            r[f"iou_k{k:.2f}"] = round(float(np.mean(acc[k]["iou"])), 4)
            r[f"area_k{k:.2f}"] = round(float(np.mean(acc[k]["ratio"])), 3)
    r["mp_fallback"] = sum(fp_bs[k].fallback_count - fb0[k] for k in KS)
    allrows.append(r)
    print(json.dumps(r), flush=True)

summary = {"SUMMARY": True, "stems": len(allrows)}
for k in KS:
    v = [r[f"iou_k{k:.2f}"] for r in allrows if f"iou_k{k:.2f}" in r]
    if v:
        summary[f"k{k:.2f}"] = {"iou_mean": round(float(np.mean(v)), 4), "iou_min": round(float(np.min(v)), 4)}
summary["mp_fallback_total"] = sum(fp.fallback_count for fp in fp_bs.values())
print(json.dumps(summary), flush=True)
