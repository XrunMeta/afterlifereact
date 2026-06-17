def base_blend_weight(rms_val, closed_thresh=0.1, open_thresh=0.4):
    """발화강도(rms_val 0~1) → 2장 base 블렌드 가중치. 0=입다문 base, 1=입벌림 base.
    closed_thresh 이하=0, open_thresh 이상=1, 사이는 선형 보간."""
    if rms_val <= closed_thresh:
        return 0.0
    if rms_val >= open_thresh:
        return 1.0
    return (rms_val - closed_thresh) / (open_thresh - closed_thresh)
