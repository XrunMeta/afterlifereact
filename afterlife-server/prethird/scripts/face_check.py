"""AFL-1071 만화풍 사진 얼굴 검사 — 5변형 판정 + S3FD 어댑터 + /face-check 입구.

모듈 최상단은 cv2/numpy/aiohttp 만 import 한다(torch·face_detection 은 기본 S3FD 를
처음 쓸 때만 늦게 import). GPU 없이 set_detector 주입으로 시험 가능해야 한다.
가비아 실측: cd scripts && python -m face_check <image_path>
"""
import os

import cv2
import numpy as np

FACE_SCORE_MIN: float = float(os.environ.get("FACE_CHECK_SCORE_MIN", "0.2"))
PASS_MIN: int = int(os.environ.get("FACE_CHECK_PASS_MIN", "3"))

_ZOOM = 1.1     # 확대 배율 (가운데 잘라 원크기로)
_SHRINK = 0.9   # 축소 배율 (가장자리 복제 패딩)
_BRIGHT = 25    # 밝기 가산값


def _zoom_in(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    ch, cw = max(1, int(round(h / _ZOOM))), max(1, int(round(w / _ZOOM)))
    y0, x0 = (h - ch) // 2, (w - cw) // 2
    crop = img[y0:y0 + ch, x0:x0 + cw]
    return cv2.resize(crop, (w, h), interpolation=cv2.INTER_LINEAR)


def _zoom_out(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    nh, nw = max(1, int(round(h * _SHRINK))), max(1, int(round(w * _SHRINK)))
    small = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    top, left = (h - nh) // 2, (w - nw) // 2
    return cv2.copyMakeBorder(
        small, top, h - nh - top, left, w - nw - left, cv2.BORDER_REPLICATE
    )


def make_variants(img: np.ndarray) -> list:
    """BGR uint8 -> [원본, 반전, 확대, 축소, 밝기] (크기 모두 입력과 동일)."""
    return [
        img,
        np.ascontiguousarray(img[:, ::-1]),
        _zoom_in(img),
        _zoom_out(img),
        cv2.convertScaleAbs(img, alpha=1.0, beta=_BRIGHT),
    ]


def judge(scores: list, score_min: float = None, pass_min: int = None) -> dict:
    """변형별 최고 얼굴 점수 중 score_min 이상(경계 포함)이 pass_min 개 이상이면 통과."""
    score_min = FACE_SCORE_MIN if score_min is None else score_min
    pass_min = PASS_MIN if pass_min is None else pass_min
    hits = sum(1 for s in scores if s >= score_min)
    if hits >= pass_min:
        return {"ok": True}
    return {"ok": False, "reason": "NO_FACE"}


# ---------------------------------------------------------------------------
# Task 2: S3FD 어댑터 + /face-check HTTP 입구
# ---------------------------------------------------------------------------
import asyncio
import hmac
import logging
import sys
import threading
from typing import Callable, Optional

import aiohttp
from aiohttp import web

from asset_fetch import _validate_url

log = logging.getLogger("prethird.face_check")

MAX_BYTES: int = 10 * 1024 * 1024      # 다운로드 상한 10MB
FETCH_TIMEOUT_SEC: float = 10.0        # 다운로드 전체 시간 제한 10초
# 거대한 사진은 S3FD 가 GPU 메모리를 크게 쓰므로 긴 변을 이 값 이하로 줄인다(0 이면 끔).
MAX_SIDE: int = int(os.environ.get("FACE_CHECK_MAX_SIDE", "1280"))
_NMS_THR = 0.3  # MuseTalk SFDDetector.detect_from_batch 와 동일

_detector: Optional[Callable[[np.ndarray], float]] = None
_s3fd = None                # (face_detector_net, device, batch_detect, nms)
_s3fd_lock = threading.Lock()
_infer_lock = threading.Lock()  # 동시 /face-check 끼리 GPU 추론을 한 줄로 세운다


def set_detector(fn: Optional[Callable[[np.ndarray], float]]) -> None:
    """시험용 주입. None 이면 기본 S3FD 로 되돌린다."""
    global _detector
    _detector = fn


def _sfd_from_detector(det) -> tuple:
    """SFDDetector 인스턴스 → (net, device, batch_detect, nms). 같은 패키지 이름으로 import."""
    import importlib

    mod = type(det).__module__  # 예: "face_detection.detection.sfd.sfd_detector"
    suffix = "detection.sfd.sfd_detector"
    if not mod.endswith(suffix):
        raise RuntimeError(f"예상 밖 SFDDetector 모듈: {mod}")
    prefix = mod[: -len(suffix)]
    bd = importlib.import_module(prefix + "detection.sfd.detect").batch_detect
    nms = importlib.import_module(prefix + "detection.sfd.bbox").nms
    return det.face_detector, det.device, bd, nms


def _find_existing_detector():
    """in-proc MuseTalk 가 이미 만든 FaceAlignment(preprocessing.fa)의 SFDDetector."""
    for name in ("musetalk.utils.preprocessing", "preprocessing"):
        m = sys.modules.get(name)
        fa = getattr(m, "fa", None) if m is not None else None
        det = getattr(fa, "face_detector", None)
        if det is not None and hasattr(det, "face_detector") and hasattr(det, "device"):
            return det
    return None


def _ensure_musetalk_path() -> None:
    """MuseTalk source 와 musetalk/utils 를 sys.path 에 (in-proc 이 이미 했으면 무변경)."""
    root = os.environ.get("MUSETALK_ROOT", "/home/afterlife/afterlife-server/musetalk-afterlife")
    src = os.environ.get("MUSETALK_SOURCE_DIR", os.path.join(root, "source"))
    for p in (src, os.path.join(src, "musetalk", "utils")):
        if os.path.isdir(p) and p not in sys.path:
            sys.path.append(p)


def _load_s3fd() -> tuple:
    """기존 FaceAlignment 재사용, 없으면 face_detection 으로 새로 만든다(늦은 로드)."""
    det = _find_existing_detector()
    if det is None:
        _ensure_musetalk_path()
        import torch
        from face_detection import FaceAlignment, LandmarksType

        device = "cuda" if torch.cuda.is_available() else "cpu"
        fa = FaceAlignment(LandmarksType._2D, flip_input=False, device=device)
        det = fa.face_detector
        log.info("[face-check] S3FD 새로 로드 device=%s", device)
    else:
        log.info("[face-check] 기존 MuseTalk S3FD 재사용 module=%s", type(det).__module__)
    return _sfd_from_detector(det)


def _s3fd_score(img: np.ndarray) -> float:
    global _s3fd
    if _s3fd is None:
        with _s3fd_lock:
            if _s3fd is None:
                _s3fd = _load_s3fd()
    net, device, batch_detect, nms = _s3fd
    # MuseTalk get_detections_for_batch 와 같이 BGR→RGB 후 배치 1장.
    batch = np.ascontiguousarray(img[..., ::-1])[None, ...]
    with _infer_lock:
        b = batch_detect(net, batch.copy(), device=device)  # (N, B, 5) 점수 필터 없음
    boxes = b[:, 0, :]
    if len(boxes) == 0:
        return 0.0
    keep = nms(boxes, _NMS_THR)
    kept = boxes[keep]
    if len(kept) == 0:
        return 0.0
    return float(max(0.0, float(np.max(kept[:, -1]))))


def max_face_score(img: np.ndarray) -> float:
    """한 장의 최고 얼굴 점수(없으면 0.0). 주입된 detector 가 있으면 그것을 쓴다."""
    if _detector is not None:
        return float(_detector(img))
    return _s3fd_score(img)


def _limit_size(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    if MAX_SIDE <= 0 or max(h, w) <= MAX_SIDE:
        return img
    s = MAX_SIDE / float(max(h, w))
    return cv2.resize(img, (max(1, round(w * s)), max(1, round(h * s))), interpolation=cv2.INTER_AREA)


def _decode(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR) if arr.size else None
    if img is None:
        raise ValueError("이미지 디코드 실패")
    return img


def score_variants(img: np.ndarray) -> list:
    """5변형 각각의 최고 점수."""
    return [max_face_score(v) for v in make_variants(_limit_size(img))]


def _check_sync(data: bytes) -> tuple:
    scores = score_variants(_decode(data))
    return scores, judge(scores)


async def _download(url: str) -> bytes:
    """SSRF 검증 후 메모리로 받는다(10MB·10초·리다이렉트 금지)."""
    _validate_url(url)
    timeout = aiohttp.ClientTimeout(total=FETCH_TIMEOUT_SEC)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(url, allow_redirects=False) as resp:
            if resp.status in (301, 302, 303, 307, 308):
                raise ValueError(f"redirect 차단: HTTP {resp.status}")
            resp.raise_for_status()
            if resp.content_length is not None and resp.content_length > MAX_BYTES:
                raise ValueError(f"size_exceeded: content-length={resp.content_length}")
            buf = bytearray()
            async for chunk in resp.content.iter_chunked(64 * 1024):
                buf += chunk
                if len(buf) > MAX_BYTES:
                    raise ValueError(f"size_exceeded: >{MAX_BYTES}")
            return bytes(buf)


def _authorized(request: web.Request) -> bool:
    secret = os.environ.get("PREBUILD_SECRET", "")
    if not secret:
        return False
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return False
    return hmac.compare_digest(header[len("Bearer "):], secret)


_CHECK_FAILED = {"ok": False, "reason": "CHECK_FAILED"}


async def face_check_handler(request: web.Request) -> web.Response:
    """POST {imageUrl} → {"ok":true} | NO_FACE | CHECK_FAILED (모두 200)."""
    if not _authorized(request):
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
    image_url = body.get("imageUrl") if isinstance(body, dict) else None
    if not image_url or not isinstance(image_url, str):
        return web.json_response({"error": "imageUrl required"}, status=400)
    try:
        data = await _download(image_url)
        scores, verdict = await asyncio.get_running_loop().run_in_executor(
            None, _check_sync, data
        )
    except Exception as exc:  # noqa: BLE001 — 어떤 실패든 fail-closed
        log.warning("[face-check] failed: %s: %s", type(exc).__name__, exc)
        return web.json_response(_CHECK_FAILED, status=200)
    log.info("[face-check] scores=%s ok=%s", [round(s, 3) for s in scores], verdict.get("ok"))
    return web.json_response(verdict, status=200)


def _main(argv: list) -> int:
    """가비아 실측용: python -m face_check <image_path> → 5변형 점수·판정 출력."""
    if len(argv) != 1:
        print("usage: python -m face_check <image_path>", file=sys.stderr)
        return 2
    logging.basicConfig(level=logging.INFO)
    with open(argv[0], "rb") as f:
        data = f.read()
    img = _decode(data)
    names = ["원본", "반전", "확대", "축소", "밝기"]
    scores = score_variants(img)
    for n, s in zip(names, scores):
        print(f"{n}\t{s:.4f}")
    print(f"판정\t{judge(scores)}  (score_min={FACE_SCORE_MIN} pass_min={PASS_MIN})")
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
