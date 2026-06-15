"""idle 영상 → fifth open(치아)/closed(다묾) 소스 프레임 추출.

prethird 통합용: 클론 idle 영상에서 입벌림 스코어가 가장 큰 프레임을 open,
가장 작은 프레임을 closed 로 고른다. 치아 보이는 프레임이 없으면(스코어 < 임계)
단일모드(가장 닫힌 1장)로 폴백한다. 결과는 clone_id 별 디스크 캐시.

GPU/landmark 검출에 직접 의존하지 않음 — 실제 검출은 호출자가 detect_lmk 함수로
주입(make_extract_fn). 그래서 순수 로직(스코어·선택·캐시)은 TDD로 로컬 검증 가능.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import numpy as np

try:
    import cv2
except ModuleNotFoundError:
    cv2 = None  # type: ignore[assignment]  # 테스트 환경 — mock으로 주입


@dataclass
class FrameSelection:
    open_idx: int            # open 소스로 쓸 프레임 인덱스
    closed_idx: int | None   # closed 소스 프레임 인덱스(단일모드면 None)
    mode: str                # "blend" | "single"
    open_score: float        # 선택된 open 프레임의 입벌림 스코어(로그/판정용)


# ---------------------------------------------------------------------------
# Step 1~4: select_open_closed
# ---------------------------------------------------------------------------

def select_open_closed(scores: np.ndarray, open_threshold: float) -> FrameSelection:
    """프레임별 입벌림 스코어 배열에서 open/closed 프레임을 고른다.

    Args:
        scores: (n,) float32. 클수록 입을 크게 벌린 프레임.
        open_threshold: open 으로 인정할 최소 입벌림 스코어. 최대 스코어가
            이 값 미만이면 치아 프레임이 없다고 보고 단일모드로 폴백한다.

    Returns:
        FrameSelection. mode="blend"면 open_idx/closed_idx 둘 다 유효,
        mode="single"이면 open_idx=가장 닫힌 프레임, closed_idx=None.
    """
    scores = np.asarray(scores, dtype=np.float32)
    if scores.size == 0:
        raise ValueError("빈 스코어 배열")
    open_idx = int(np.argmax(scores))
    closed_idx = int(np.argmin(scores))
    open_score = float(scores[open_idx])
    if open_score < open_threshold:
        return FrameSelection(
            open_idx=closed_idx, closed_idx=None,
            mode="single", open_score=open_score,
        )
    return FrameSelection(
        open_idx=open_idx, closed_idx=closed_idx,
        mode="blend", open_score=open_score,
    )


# ---------------------------------------------------------------------------
# Step 5~8: mouth_open_score
# ---------------------------------------------------------------------------

def mouth_open_score(pts: dict) -> float:
    """입 4점으로 입벌림 정도를 [0,~) 스코어로 계산.

    Args:
        pts: {"upper": (x,y), "lower": (x,y), "left": (x,y), "right": (x,y)}
             upper/lower = 윗입술/아랫입술 중앙, left/right = 입꼬리.

    Returns:
        세로 입벌림(아래-위 입술 거리) / 가로 입폭. 가로폭 0이면 0.0.
        스케일 불변(얼굴 크기 무관)이라 프레임 간 비교에 안전.
    """
    ux, uy = pts["upper"]
    lx, ly = pts["lower"]
    leftx, _ = pts["left"]
    rightx, _ = pts["right"]
    width = abs(rightx - leftx)
    if width <= 1e-6:
        return 0.0
    gap = abs(ly - uy)
    return float(gap / width)


# ---------------------------------------------------------------------------
# Step 9~12: load_or_extract_sources
# ---------------------------------------------------------------------------

def load_or_extract_sources(
    video_path: str,
    cache_root: str,
    clone_id: int,
    extract_fn: Callable,
) -> dict:
    """clone_id 별 open/closed 소스를 캐시에서 로드하거나 추출 후 캐시한다.

    Args:
        video_path: 클론 idle 영상 경로(캐시 미스 시에만 사용).
        cache_root: 캐시 루트 디렉토리. 실제 캐시는 {cache_root}/{clone_id}/.
        clone_id: 클론 식별자.
        extract_fn: video_path -> (open_bgr, closed_bgr|None, FrameSelection).
            GPU/landmark 검출에 의존하는 실제 추출(주입).

    Returns:
        {"mode", "open_path", "closed_path"|None, "open_score"}.
    """
    clone_dir = Path(cache_root) / str(clone_id)
    meta_path = clone_dir / "source_meta.json"
    open_path = clone_dir / "open.png"

    if meta_path.is_file() and open_path.is_file():
        meta = json.loads(meta_path.read_text())
        closed_path = clone_dir / "closed.png"
        has_closed = meta.get("mode") == "blend" and closed_path.is_file()
        return {
            "mode": meta.get("mode", "single"),
            "open_path": str(open_path),
            "closed_path": str(closed_path) if has_closed else None,
            "open_score": float(meta.get("open_score", 0.0)),
        }

    open_bgr, closed_bgr, sel = extract_fn(video_path)
    clone_dir.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(open_path), open_bgr)
    closed_path = clone_dir / "closed.png"
    if sel.mode == "blend" and closed_bgr is not None:
        cv2.imwrite(str(closed_path), closed_bgr)
    meta_path.write_text(json.dumps({
        "mode": sel.mode,
        "open_score": sel.open_score,
        "open_idx": sel.open_idx,
        "closed_idx": sel.closed_idx,
    }))
    return {
        "mode": sel.mode,
        "open_path": str(open_path),
        "closed_path": str(closed_path) if sel.mode == "blend" else None,
        "open_score": sel.open_score,
    }


# ---------------------------------------------------------------------------
# Step 13: make_extract_fn (GPU/landmark 의존 — 주입용, 테스트 없음)
# ---------------------------------------------------------------------------

def make_extract_fn(detect_lmk: Callable, open_threshold: float = 0.20,
                    sample_stride: int = 2) -> Callable:
    """실제 영상→프레임 추출 함수를 만든다(클로저).

    Args:
        detect_lmk: bgr_frame -> (N,2) landmark ndarray | None. GPU 검출(주입).
        open_threshold: select_open_closed 임계.
        sample_stride: 프레임 샘플링 간격(2=격프레임, 속도/정확도 절충).

    Returns:
        extract_fn(video_path) -> (open_bgr, closed_bgr|None, FrameSelection).
    """
    # FLP 106-landmark 입 4점 인덱스 (상/하 입술 중앙, 좌/우 입꼬리)
    # render_offline.py 469 입 영역 48~107 참조
    UPPER, LOWER, LEFT, RIGHT = 51, 57, 48, 54

    def _extract(video_path: str):
        cap = cv2.VideoCapture(video_path)
        frames, scores = [], []
        idx = 0
        while True:
            ok, bgr = cap.read()
            if not ok:
                break
            if idx % sample_stride == 0:
                lmk = detect_lmk(bgr)
                if lmk is not None and len(lmk) > RIGHT:
                    pts = {
                        "upper": tuple(lmk[UPPER]),
                        "lower": tuple(lmk[LOWER]),
                        "left": tuple(lmk[LEFT]),
                        "right": tuple(lmk[RIGHT]),
                    }
                    frames.append(bgr)
                    scores.append(mouth_open_score(pts))
            idx += 1
        cap.release()
        if not frames:
            raise RuntimeError(f"얼굴 검출 프레임 0개: {video_path}")
        sel = select_open_closed(np.array(scores, dtype=np.float32), open_threshold)
        open_bgr = frames[sel.open_idx]
        closed_bgr = frames[sel.closed_idx] if sel.closed_idx is not None else None
        return open_bgr, closed_bgr, sel

    return _extract
