"""구동 동작(FLP pkl) 보정 — AFL-1064 감정·무감정 구동영상.

FLP(run.py)가 구동영상에서 뽑은 동작 pkl 을 클론 사진에 그대로 쓰면 세 가지 문제가 있다(2026-10-29~30 실측).
1. 고개 움직임이 크면 paste-back 경계에서 머리 윗부분이 번진다 → 고개(회전·이동)만 0.7배.
2. FLP 가 프레임마다 따로 추정해 동작이 떨린다(구동영상은 방향 뒤집힘 5%, pkl 은 26~32%)
   → 시간 방향 가우시안 σ=2. 떨림 0.52→0.14px.
3. 끝 자세가 처음과 달라 반복·턴 전환에서 튄다 → 마지막 24프레임을 0번 프레임(중립) 동작값으로 수렴.
   끝↔처음 PSNR 22→41dB.

correct() 가 세 단계를 순서대로 적용하고 pkl 에 afl_correction 표시를 붙인다.
클론 렌더는 require_corrected() 로 표시를 검사해, 보정 안 한 pkl 을 거부한다.
FLP 렌더에 쓰이는 값 = R·t·exp·scale. torch 없이 테스트할 수 있게 numpy 만 쓴다.
"""
from __future__ import annotations

import copy

import numpy as np

# 바꾸면 version 을 올린다 — 옛 보정 pkl 은 다시 만들어야 한다.
CORRECTION = {"version": 1, "head_scale": 0.7, "smooth_sigma": 2.0, "ease_frames": 24}

_HEAD_KEYS = ("pitch", "yaw", "roll", "t")
_RENDER_KEYS = ("pitch", "yaw", "roll", "t", "exp", "scale")


def rotation_matrix(pitch, yaw, roll) -> np.ndarray:
    """FLP src/utils/utils.py get_rotation_matrix 와 같은 수식(입력 단위 = 도, 출력 (bs,3,3))."""
    x, y, z = (np.asarray(a, np.float64).reshape(-1, 1) / 180 * np.pi for a in (pitch, yaw, roll))
    bs = x.shape[0]
    one, zero = np.ones([bs, 1]), np.zeros([bs, 1])
    rot_x = np.concatenate([one, zero, zero, zero, np.cos(x), -np.sin(x), zero, np.sin(x), np.cos(x)], axis=1)
    rot_y = np.concatenate([np.cos(y), zero, np.sin(y), zero, one, zero, -np.sin(y), zero, np.cos(y)], axis=1)
    rot_z = np.concatenate([np.cos(z), -np.sin(z), zero, np.sin(z), np.cos(z), zero, zero, zero, one], axis=1)
    rot = rot_z.reshape(bs, 3, 3) @ rot_y.reshape(bs, 3, 3) @ rot_x.reshape(bs, 3, 3)
    return np.transpose(rot, (0, 2, 1)).astype(np.float32)


def _with_rotation(x: dict) -> dict:
    x["R"] = rotation_matrix(x["pitch"], x["yaw"], x["roll"])
    return x


def scale_head(motion: list[dict], k: float) -> list[dict]:
    """고개 회전·이동만 0번 프레임 기준 변화량을 k 배로. 표정(exp)은 그대로."""
    m0 = motion[0]
    out = []
    for x in motion:
        x = copy.deepcopy(x)
        for key in _HEAD_KEYS:
            x[key] = (m0[key] + (x[key] - m0[key]) * k).astype(m0[key].dtype)
        out.append(_with_rotation(x))
    return out


def smooth(motion: list[dict], sigma: float) -> list[dict]:
    """렌더 값(R·t·exp·scale)을 시간 방향 가우시안으로. 양 끝은 반사 패딩."""
    r = int(3 * sigma)
    kernel = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    kernel /= kernel.sum()
    T = len(motion)
    out = [copy.deepcopy(x) for x in motion]
    for key in _RENDER_KEYS:
        arr = np.stack([x[key] for x in motion])
        flat = arr.reshape(T, -1).astype(np.float64)
        idx = np.abs(np.arange(-r, T + r))  # 반사 패딩 인덱스(0 기준 대칭)
        idx = np.where(idx >= T, 2 * (T - 1) - idx, idx)
        padded = flat[idx]
        sm = np.stack([np.convolve(padded[:, j], kernel, mode="valid") for j in range(flat.shape[1])], axis=1)
        sm = sm.reshape(arr.shape).astype(arr.dtype)
        for i in range(T):
            out[i][key] = sm[i]
    return [_with_rotation(x) for x in out]


def ease_to_neutral(motion: list[dict], n: int) -> list[dict]:
    """마지막 n 프레임을 0번 프레임 동작값으로 smoothstep 수렴. 마지막 프레임 = 0번 프레임."""
    m0 = motion[0]
    T = len(motion)
    out = []
    for i, x in enumerate(motion):
        x = copy.deepcopy(x)
        k = i - (T - n)
        if k >= 0:
            u = (k + 1) / n
            w = u * u * (3 - 2 * u)
            for key in _RENDER_KEYS:
                x[key] = ((1 - w) * x[key] + w * m0[key]).astype(m0[key].dtype)
            x = _with_rotation(x)
        out.append(x)
    return out


def correct(pkl: dict, params: dict = CORRECTION) -> dict:
    """FLP pkl 에 세 보정을 순서대로 적용하고 afl_correction 표시를 붙인다."""
    if "afl_correction" in pkl:
        raise ValueError(f"이미 보정된 pkl 이다: {pkl['afl_correction']}")
    m = scale_head(pkl["motion"], params["head_scale"])
    m = smooth(m, params["smooth_sigma"])
    m = ease_to_neutral(m, params["ease_frames"])
    out = dict(pkl)
    out["motion"] = m
    out["afl_correction"] = dict(params)
    return out


def require_corrected(pkl: dict) -> None:
    """클론 렌더 직전 검사. 표시가 없거나 현재 CORRECTION 과 다르면 ValueError."""
    got = pkl.get("afl_correction")
    if got != CORRECTION:
        raise ValueError(
            f"보정 안 된(또는 옛 버전) 구동 pkl 이다: {got!r} — build_driving_motion.py 로 다시 만들 것 (기대값 {CORRECTION})"
        )


def reversal_ratio(motion: list[dict], key: str = "pitch") -> float:
    """움직임 방향이 프레임마다 뒤집히는 비율 — 떨림 지표(샘플 확인용)."""
    a = np.array([float(np.ravel(x[key])[0]) for x in motion])
    v = np.diff(a)
    return float(np.mean(v[1:] * v[:-1] < 0)) if len(v) > 1 else 0.0
