"""문장 앞 무음 상한.

견본에 머뭇거림("음...")·긴 쉼이 있으면 CosyVoice 가 그 버릇을 따라 문장 앞에 0.2~1.2초 무음을
만든다(2026-10-26 쿄카 새 견본 실측). 앞부분의 조용한 구간(-40dB 미만, 작은 숨소리 포함)이
상한보다 길면 상한만 남기고 자른다. 뚜렷한 소리("어" 같은 앞소리)는 건드리지 않는다.
"""
from __future__ import annotations

import numpy as np

def cap_lead_silence(audio: np.ndarray, sr: int, max_ms: int, thresh_db: float = -40.0,
                     frame_ms: int = 10) -> np.ndarray:
    if max_ms <= 0 or len(audio) == 0:
        return audio
    hop = max(1, int(sr * frame_ms / 1000))
    thresh = 10 ** (thresh_db / 20)
    first = None
    for k in range(0, len(audio), hop):
        if np.sqrt(np.mean(np.square(audio[k:k + hop], dtype=np.float64))) >= thresh:
            first = k
            break
    if first is None:  # 전부 조용함 — 무음 응답은 그대로 둔다
        return audio
    keep = int(sr * max_ms / 1000)
    if first <= keep:
        return audio
    return audio[first - keep:]

def longest_inner_silence(audio: np.ndarray, sr: int, thresh_db: float = -40.0,
                          frame_ms: int = 10) -> float:
    """첫 소리와 마지막 소리 사이에서 가장 긴 조용한 구간(초). 앞뒤 무음은 세지 않는다.

    CosyVoice 가 드물게 단어 중간에서 끊고 0.7초쯤 쉬었다가 잇는다("말 이어가." → "마…리오가",
    AFL-1059). 길이 검사로는 안 걸려서 따로 잰다.
    """
    hop = max(1, int(sr * frame_ms / 1000))
    n = len(audio) 
    if n == 0:
        return 0.0
    frames = audio[: n * hop].reshape(n, hop).astype(np.float64)
    voiced = np.sqrt(np.mean(np.square(frames), axis=1)) >= 10 ** (thresh_db / 20)
    idx = np.flatnonzero(voiced)
    if len(idx) < 2:
        return 0.0
    best = run = 0
    for v in voiced[idx[0]: idx[-1] + 1]:
        run = 0 if v else run + 1
        best = max(best, run)
    return best * frame_ms / 1000
