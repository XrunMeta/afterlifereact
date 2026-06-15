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
        # 단일모드 폴백: open_score는 "선택된(가장 닫힌) 프레임의 스코어"이지
        # 영상 최대 스코어가 아님 — 소비자가 blend open_score와 혼동하지 말 것.
        return FrameSelection(
            open_idx=closed_idx, closed_idx=None,
            mode="single", open_score=open_score,
        )
    # Item 4a: 동일 스코어(argmax==argmin) → blend가 무의미, single 강등
    if open_idx == closed_idx:
        return FrameSelection(
            open_idx=open_idx, closed_idx=None,
            mode="single", open_score=open_score,
        )
    return FrameSelection(
        open_idx=open_idx, closed_idx=closed_idx,
        mode="blend", open_score=open_score,
    )


# ---------------------------------------------------------------------------
# Step 5~8: mouth_open_score
# ---------------------------------------------------------------------------

def mouth_open_score(mouth_pts: np.ndarray) -> float:
    """입 윤곽 점 배열로 입벌림 정도를 [0,~) 스코어로 계산.

    Args:
        mouth_pts: (N, 2) array-like. 입 윤곽 landmark 좌표들(x, y).
                   FLP 203점 기준 lmk[48:107], 또는 최소 2점 이상.
                   4점 dict → 배열로 변환해도 bbox 기준 동일 결과.

    Returns:
        bbox 기반 세로 gap(y_max-y_min) / 가로 width(x_max-x_min).
        가로폭 0이면 0.0. NaN/inf 점은 제외 후 계산, 유효 점 없으면 0.0.
        스케일 불변(얼굴 크기 무관)이라 프레임 간 비교에 안전.
    """
    pts = np.asarray(mouth_pts, dtype=np.float64)
    if pts.ndim == 1:
        pts = pts.reshape(-1, 2)
    # Item 1: NaN/inf 방어 — 각 점의 좌표가 모두 유한한 점만 사용
    finite_mask = np.isfinite(pts).all(axis=1)
    pts = pts[finite_mask]
    if len(pts) == 0:
        return 0.0
    x_min, y_min = pts[:, 0].min(), pts[:, 1].min()
    x_max, y_max = pts[:, 0].max(), pts[:, 1].max()
    width = x_max - x_min
    if width <= 1e-6:
        return 0.0
    gap = y_max - y_min
    return float(gap / width)


# ---------------------------------------------------------------------------
# Step 9~12: load_or_extract_sources
# ---------------------------------------------------------------------------

def load_or_extract_sources(
    video_path: str,
    cache_root: str,
    clone_id: int | str,
    extract_fn: Callable,
) -> dict:
    """clone_id 별 open/closed 소스를 캐시에서 로드하거나 추출 후 캐시한다.

    Args:
        video_path: 클론 idle 영상 경로(캐시 미스 시에만 사용).
        cache_root: 캐시 루트 디렉토리. 실제 캐시는 {cache_root}/{clone_id}/.
        clone_id: 클론 식별자. int 또는 str 모두 허용 — 내부에서 str(clone_id)로
            디렉토리를 생성하므로 문자열 키도 동작한다.
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
        # Item 2: 캐시 무결성 검사 — blend 모드인데 closed.png 없으면 손상 캐시 → 재추출
        mode_in_meta = meta.get("mode", "single")
        if mode_in_meta == "blend" and not closed_path.is_file():
            pass  # fall through to re-extract
        else:
            has_closed = mode_in_meta == "blend" and closed_path.is_file()
            return {
                "mode": mode_in_meta,
                "open_path": str(open_path),
                "closed_path": str(closed_path) if has_closed else None,
                "open_score": float(meta.get("open_score", 0.0)),
            }

    # Item 3: 캐시 미스 경로 — cv2 없으면 명확한 에러
    if cv2 is None:
        raise RuntimeError(
            "cv2 미설치 — 영상 추출은 cv2 필요(가비아 컨테이너에서 실행)"
        )

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

    def _extract(video_path: str):
        # Item 3: make_extract_fn 내부에서도 cv2 없으면 명확한 에러
        if cv2 is None:
            raise RuntimeError(
                "cv2 미설치 — 영상 추출은 cv2 필요(가비아 컨테이너에서 실행)"
            )
        cap = cv2.VideoCapture(video_path)
        frames, scores = [], []
        idx = 0
        while True:
            ok, bgr = cap.read()
            if not ok:
                break
            if idx % sample_stride == 0:
                lmk = detect_lmk(bgr)
                if lmk is not None:
                    n = len(lmk)
                    # FLP 203점 기준: 48~107이 입 윤곽 (build_mouth_mask 동일 규약)
                    if n >= 107:
                        mouth = lmk[48:107]
                    elif n >= 49:
                        mouth = lmk[48:]
                    else:
                        # 점이 너무 적으면 검출 불량으로 스킵
                        idx += 1
                        continue
                    frames.append(bgr)
                    scores.append(mouth_open_score(np.asarray(mouth, dtype=np.float32)))
            idx += 1
        cap.release()
        if not frames:
            # Item 5: 진단 메시지에 시도 프레임 수·검출 성공 수 포함
            raise RuntimeError(
                f"얼굴 검출 프레임 0개: {video_path} (시도 {idx} 프레임, 성공 0)"
            )
        sel = select_open_closed(np.array(scores, dtype=np.float32), open_threshold)
        open_bgr = frames[sel.open_idx]
        closed_bgr = frames[sel.closed_idx] if sel.closed_idx is not None else None
        return open_bgr, closed_bgr, sel

    return _extract
