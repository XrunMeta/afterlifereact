#!/usr/bin/env python3
"""AFL-1071 배포 전 점검 — 기준 0.5 로 얼굴을 한 장도 못 찾는 기존 클론 찾기 (읽기 전용).

클론별 렌더 영상(`<root>/<id>/<id>-idle-25fps.mp4`, 없으면 `<root>/<id>/emo/<id>-emo-neutral.mp4`)에서
프레임을 최대 25장 고르게 뽑아 S3FD 최고 점수를 구하고, 기준 0.5 / 0.2 를 넘은 장수를 센다
(MuseTalk 과 같이 `점수 > 기준`). 표준출력만 쓰고 파일은 쓰지 않는다.

가비아 실행(통화 세션 0 일 때, GPU 를 쓴다):
  cd /home/afterlife/afterlife-server/prethird/scripts && \
  PRETHIRD_VIDEO_REF_ROOT=... python _audit_face_zero.py \
    --refs-root /home/afterlife/afterlife-server/prethird/video-ref --limit 20
(MuseTalk 소스는 MUSETALK_ROOT/source 에서 찾는다. prethird venv 의 python 을 쓸 것.)

종료 코드: 0 = 0.5 로 얼굴 0장인 클론 없음, 1 = 있음(목록 출력).
"""
import argparse
import os
import sys
import time

MAX_FRAMES = 25
THR_RENDER = 0.5   # MuseTalk 기본 기준
THR_RETRY = 0.2    # face_threshold 재시도 기준


def summarize(rows: list) -> list:
    """rows: [{clone, video, scores:[프레임별 최고 점수]}] → 클론별 집계 dict 리스트(입력 순서 유지).

    hit_05/hit_02 = 점수 > 기준 인 프레임 수. zero = 0.5 로 0장(읽을 프레임이 있을 때만).
    rescued = zero 이면서 0.2 로는 1장 이상(재시도가 살리는 클론). error = 프레임을 못 읽음.
    """
    out = []
    for r in rows:
        scores = list(r.get("scores") or [])
        n = len(scores)
        h5 = sum(1 for s in scores if s > THR_RENDER)
        h2 = sum(1 for s in scores if s > THR_RETRY)
        zero = n > 0 and h5 == 0
        out.append({
            "clone": str(r["clone"]), "video": r.get("video", ""), "n": n,
            "hit_05": h5, "hit_02": h2, "zero": zero,
            "rescued": zero and h2 > 0, "error": n == 0,
        })
    return out


def find_video(root: str, clone_id: str):
    for p in (
        os.path.join(root, clone_id, f"{clone_id}-idle-25fps.mp4"),
        os.path.join(root, clone_id, "emo", f"{clone_id}-emo-neutral.mp4"),
    ):
        if os.path.isfile(p):
            return p
    return None


def sample_frames(path: str, k: int = MAX_FRAMES) -> list:
    """영상에서 균등 간격으로 최대 k 장(BGR). 못 열면 빈 리스트."""
    import cv2

    cap = cv2.VideoCapture(path)
    try:
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        if total <= 0:
            return []
        idxs = sorted({int(i * total / min(k, total)) for i in range(min(k, total))})
        frames = []
        for i in idxs:
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ok, f = cap.read()
            if ok and f is not None:
                frames.append(f)
        return frames
    finally:
        cap.release()


def _print_table(res: list) -> None:
    print(f"{'clone':<10}{'frames':>7}{'>0.5':>6}{'>0.2':>6}  verdict")
    for r in res:
        v = "ERROR(영상 못 읽음)" if r["error"] else ("ZERO-rescued@0.2" if r["rescued"] else ("ZERO-NOT-rescued" if r["zero"] else "ok"))
        print(f"{r['clone']:<10}{r['n']:>7}{r['hit_05']:>6}{r['hit_02']:>6}  {v}")
    zeros = [r["clone"] for r in res if r["zero"]]
    print(f"\n0.5 로 얼굴 0장 클론 ({len(zeros)}): {', '.join(zeros) if zeros else '없음'}")
    print("  그중 0.2 로 살아나는 클론: " + (", ".join(r["clone"] for r in res if r["rescued"]) or "없음"))
    print("  그중 0.2 로도 0장: " + (", ".join(r["clone"] for r in res if r["zero"] and not r["rescued"]) or "없음"))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--refs-root", required=True, help="video-ref 루트 (클론 id 디렉터리들이 있는 곳)")
    ap.add_argument("--limit", type=int, default=0, help="점검할 클론 수 상한(0=전부, id 오름차순)")
    ap.add_argument("--pause", type=float, default=0.5, help="클론 사이 쉬는 초(GPU 점유 완화)")
    a = ap.parse_args(argv)

    import face_check  # 늦은 import — summarize 시험은 cv2/torch 없이 돈다

    ids = sorted(
        (d for d in os.listdir(a.refs_root) if os.path.isdir(os.path.join(a.refs_root, d))),
        key=lambda s: (not s.isdigit(), int(s) if s.isdigit() else 0, s),
    )
    rows = []
    for cid in ids:
        if a.limit and len(rows) >= a.limit:
            break
        vp = find_video(a.refs_root, cid)
        if vp is None:
            continue
        scores = [face_check.max_face_score(f) for f in sample_frames(vp)]
        rows.append({"clone": cid, "video": os.path.basename(vp), "scores": scores})
        time.sleep(max(0.0, a.pause))
    res = summarize(rows)
    _print_table(res)
    return 1 if any(r["zero"] for r in res) else 0


if __name__ == "__main__":
    sys.exit(main())
