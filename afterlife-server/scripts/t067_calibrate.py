#!/usr/bin/env python3
"""t067_calibrate.py — same/diff cosine 분포로 얼굴 매칭 임계값 산출 (T-067 Task 8, Step 3).

입력: fixtures/t067-faces/<identity>/shot_0..5.jpg (t067_make_fixtures.py 산출).
전처리: 각 샷에서 얼굴 crop(cv2 Haar cascade bbox, 미검출시 중앙크롭 폴백) → 112x112 리사이즈(비정렬
        squash, 종횡비 무시) → t067_model_parity.embed_onnx 와 동일 임베딩(onnx w600k_mbf, 512d L2정규화).
스윕: threshold 0.30~0.95 step 0.01 → FAR(diff가 통과)=0 인 것 중 TAR(same 통과) 최대인 t 선택.
출력: t067_calibration.json + (--print-upsert 지정 시) app_config UPSERT 명령 출력.
가드: same_p5 < diff_p95 (분포 겹침) 이면 경고 + diff_p95+0.03 보수 임계값 제시(unknown 편향 원칙).

⚠️ **crop 한계 — 이 threshold를 그대로 운영 반영 금지 (리뷰 지적사항)**:
  - Haar cascade bbox → margin 크롭 → 112x112 "squash" resize는 종횡비를 무시한 단순 리사이즈다.
    ArcFace/w600k_mbf 계열 모델이 학습 시 기대하는 전처리는 5-포인트 랜드마크(양눈·코·입양끝)
    기반 유사변환(affine) 정렬 crop — 본 스크립트는 그 정렬을 하지 않아 판별력이 저하된다
    (diff_p95가 이론상보다 높게, same이 낮게 나올 요인).
  - 픽스처의 same쌍은 "동일 사진의 idle 렌더 변형"이라 서로 다른 카메라/조명/각도로 찍힌
    실사용 same쌍보다 비현실적으로 유사도가 높다 — 여기서 산출된 threshold는 same쌍 유사도를
    과대추정하고, 위 비정렬 crop 효과와 겹쳐 diff_p95도 밀어올린다.
  - 결론: 본 산출값은 "모델·전처리 체인이 정상 동작한다"는 검증(same≫diff, 분리 확인)에는
    유효하지만, **운영 임계값으로는 Task 16(Phase 2, 실카메라·실사용자 얼굴) 재캘리브 전까지
    사용 금지**. t067_calibration.json에 operational=false로 명시.

실행: python3 t067_calibrate.py <fixtures_dir> [--onnx <path>] [--out <json>] [--print-upsert]
  (기본 onnx: scripts/.t067-model/w600k_mbf.onnx — t067_model_prep.sh 산출물)
  (의존: scripts/t067_requirements.txt 참조 — opencv-python-headless는 반드시 4.10.0.84 고정
   (5.x는 cv2.CascadeClassifier 결손 확인됨). scripts/.t067-model/venv 에 설치돼 있으면
   그 python 으로 실행 권장: scripts/.t067-model/venv/bin/python3 t067_calibrate.py fixtures/t067-faces/)
  (--print-upsert 미지정 시 app_config UPSERT 명령은 출력하지 않고 운영 반영 금지 경고만 표시)
"""
from __future__ import annotations

import argparse
import glob
import itertools
import json
import os
import sys
import tempfile

import numpy as np

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _HERE)
from t067_model_parity import embed_onnx  # noqa: E402

DEFAULT_ONNX = os.path.join(_HERE, ".t067-model", "w600k_mbf.onnx")
# 브리프 초안 스윕범위(0.30~0.60)는 가정치 — 실측 결과 diff_p95가 그 상한을 넘어서는
# 모집단이 관측돼(우리 렌더 픽스처 특성상 cos 전체값대가 높음) 0.95까지 확장.
# 실제 산출 threshold는 zero-FAR 지점을 데이터로 찾으므로 범위 확장 자체는 결과에 영향 없음.
THRESH_LO, THRESH_HI, THRESH_STEP = 0.30, 0.95, 0.01
MARGIN = 0.35  # 얼굴 bbox 주변 여유 비율 (crop 시 눈/턱 잘림 방지)


def detect_and_crop_face(img_bgr, cascade) -> "np.ndarray":
    """cv2 Haar cascade 로 최대 얼굴 bbox 검출 → margin 포함 크롭.
    미검출 시 중앙 정사각형 크롭으로 폴백(경고 출력)."""
    import cv2

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    h, w = img_bgr.shape[:2]
    if len(faces) == 0:
        # 폴백: 중앙 정사각형 크롭 (렌더 소스가 인물 중심 구도이므로 안전한 근사)
        side = min(h, w)
        y0 = (h - side) // 2
        x0 = (w - side) // 2
        return img_bgr[y0 : y0 + side, x0 : x0 + side], False

    # 가장 큰 얼굴 선택
    fx, fy, fw, fh = max(faces, key=lambda f: f[2] * f[3])
    mx = int(fw * MARGIN)
    my = int(fh * MARGIN)
    x0 = max(0, fx - mx)
    y0 = max(0, fy - my)
    x1 = min(w, fx + fw + mx)
    y1 = min(h, fy + fh + my)
    return img_bgr[y0:y1, x0:x1], True


def embed_shot(img_path: str, onnx_path: str, cascade) -> "np.ndarray | None":
    import cv2

    img_bgr = cv2.imread(img_path)
    if img_bgr is None:
        print(f"  WARN: 이미지 로드 실패 — {img_path}", file=sys.stderr)
        return None
    crop_bgr, detected = detect_and_crop_face(img_bgr, cascade)
    if not detected:
        print(f"  WARN: 얼굴 미검출, 중앙크롭 폴백 — {img_path}", file=sys.stderr)
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tf:
        cv2.imwrite(tf.name, crop_bgr)
        tmp_path = tf.name
    try:
        return embed_onnx(tmp_path, onnx_path)
    finally:
        os.unlink(tmp_path)


def load_embeddings(fixtures_dir: str, onnx_path: str) -> dict[str, list[np.ndarray]]:
    import cv2

    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    cascade = cv2.CascadeClassifier(cascade_path)
    if cascade.empty():
        raise RuntimeError(f"Haar cascade 로드 실패: {cascade_path}")

    embeddings: dict[str, list[np.ndarray]] = {}
    identity_dirs = sorted(
        d for d in glob.glob(os.path.join(fixtures_dir, "*")) if os.path.isdir(d)
    )
    for d in identity_dirs:
        identity = os.path.basename(d)
        shots = sorted(glob.glob(os.path.join(d, "shot_*.jpg")))
        if not shots:
            continue
        vecs = []
        for shot in shots:
            v = embed_shot(shot, onnx_path, cascade)
            if v is not None:
                vecs.append(v)
        if len(vecs) < 2:
            print(f"  WARN: {identity} 유효 임베딩 {len(vecs)}개 뿐 — same-pair 산출 불가, 스킵", file=sys.stderr)
            continue
        embeddings[identity] = vecs
        print(f"  {identity}: {len(vecs)}개 임베딩")
    return embeddings


def pair_cosines(embeddings: dict[str, list[np.ndarray]]):
    same, diff = [], []
    identities = list(embeddings.keys())
    for identity, vecs in embeddings.items():
        for a, b in itertools.combinations(range(len(vecs)), 2):
            same.append(float(np.dot(vecs[a], vecs[b])))
    for i1, i2 in itertools.combinations(identities, 2):
        for va in embeddings[i1]:
            for vb in embeddings[i2]:
                diff.append(float(np.dot(va, vb)))
    return same, diff


def sweep_threshold(same: list[float], diff: list[float]):
    same_arr, diff_arr = np.array(same), np.array(diff)
    best = None  # (t, tar, far)
    t = THRESH_LO
    candidates = []
    while t <= THRESH_HI + 1e-9:
        tar = float(np.mean(same_arr >= t)) if len(same_arr) else 0.0
        far = float(np.mean(diff_arr >= t)) if len(diff_arr) else 0.0
        candidates.append((round(t, 2), tar, far))
        t += THRESH_STEP
    zero_far = [c for c in candidates if c[2] == 0.0]
    if zero_far:
        best = max(zero_far, key=lambda c: c[1])
    else:
        # FAR=0 인 t 가 없으면(분포 겹침 심함) FAR 최소인 것 중 TAR 최대
        min_far = min(c[2] for c in candidates)
        near_zero = [c for c in candidates if c[2] == min_far]
        best = max(near_zero, key=lambda c: c[1])
    return best, candidates


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fixtures_dir")
    ap.add_argument("--onnx", default=DEFAULT_ONNX)
    ap.add_argument("--out", default=os.path.join(_HERE, "t067_calibration.json"))
    ap.add_argument(
        "--db-name",
        default="afterlife-db-preview",
        help="app_config UPSERT 명령 출력용 D1 DB 이름 (기본: preview)",
    )
    ap.add_argument(
        "--print-upsert",
        action="store_true",
        help="app_config UPSERT 명령을 출력한다(운영 반영 의도 명시적 선택). "
        "미지정 시 경고문만 출력하고 명령은 숨김 — Task 16 재캘리브 전 실수 반영 방지.",
    )
    args = ap.parse_args()

    if not os.path.isfile(args.onnx):
        print(f"FATAL: onnx 모델 없음: {args.onnx} — t067_model_prep.sh 먼저 실행", file=sys.stderr)
        sys.exit(1)

    print(f"[t067-calibrate] fixtures={args.fixtures_dir} onnx={args.onnx}")
    embeddings = load_embeddings(args.fixtures_dir, args.onnx)
    n_identities = len(embeddings)
    if n_identities < 4:
        print(f"BLOCKED: 유효 인물 수 부족 (n={n_identities}, need>=4)", file=sys.stderr)
        sys.exit(1)

    same, diff = pair_cosines(embeddings)
    print(f"[t067-calibrate] same-pairs={len(same)} diff-pairs={len(diff)}")

    same_arr, diff_arr = np.array(same), np.array(diff)
    same_mean = float(np.mean(same_arr))
    same_p5 = float(np.percentile(same_arr, 5))
    diff_mean = float(np.mean(diff_arr))
    diff_p95 = float(np.percentile(diff_arr, 95))

    (best_t, best_tar, best_far), candidates = sweep_threshold(same, diff)

    overlap = same_p5 < diff_p95
    conservative_t = None
    threshold = best_t
    if overlap:
        conservative_t = round(diff_p95 + 0.03, 4)
        threshold = max(best_t, conservative_t)
        print(
            f"WARN: 분포 겹침(same_p5={same_p5:.4f} < diff_p95={diff_p95:.4f}) "
            f"— 보수 임계값 {conservative_t:.4f} 적용 권고",
            file=sys.stderr,
        )

    result = {
        "threshold": round(threshold, 4),
        "swept_best_threshold": best_t,
        "swept_best_tar": best_tar,
        "swept_best_far": best_far,
        "same_mean": round(same_mean, 4),
        "same_p5": round(same_p5, 4),
        "diff_mean": round(diff_mean, 4),
        "diff_p95": round(diff_p95, 4),
        "n_same": len(same),
        "n_diff": len(diff),
        "n_identities": n_identities,
        "overlap_warning": overlap,
        "conservative_threshold": conservative_t,
        "operational": False,
        "warning": (
            "모델체인 검증용 잠정값 — same쌍이 동일사진 idle-렌더 변형이고 crop이 비정렬 "
            "squash resize라 실사용 대비 same 유사도 과대추정/diff_p95 상승 가능. "
            "Task 16 실카메라 재캘리브 전 운영 적용 금지."
        ),
    }

    with open(args.out, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print("")
    print(f"threshold={result['threshold']:.2f} (FAR={best_far:.2%}, TAR={best_tar:.2%}) "
          f"[sweep best t={best_t:.2f}]")
    print(f"same_mean={same_mean:.4f} same_p5={same_p5:.4f}")
    print(f"diff_mean={diff_mean:.4f} diff_p95={diff_p95:.4f}")
    print(f"-> {args.out}")
    print("")
    print(f"⚠️  {result['warning']}")
    if args.print_upsert:
        print("")
        print("app_config 적용 명령 (--print-upsert 지정됨 — Task 16 재캘리브 완료 후에만 실행할 것):")
        print(
            f"""wrangler d1 execute {args.db_name} --remote --command "INSERT INTO app_config(key,value) """
            f"""VALUES('face.match_threshold','{result['threshold']:.2f}') """
            f"""ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=unixepoch()" """
            f"""--env preview"""
        )
    else:
        print("(app_config UPSERT 명령은 --print-upsert 지정 시에만 출력됨 — 운영 반영 의도 명시적 선택 필요)")


if __name__ == "__main__":
    main()
