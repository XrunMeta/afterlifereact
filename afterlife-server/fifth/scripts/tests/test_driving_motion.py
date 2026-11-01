"""구동 동작(pkl) 보정 — AFL-1064. 얼굴 크기 고정 → 고개 0.7배 → 갸웃 상한 → 0.7배 → σ=2 스무딩 → 끝 1초 중립 수렴, 보정 표시 없는 pkl 은 렌더 거부."""
import copy

import numpy as np
import pytest

from driving_motion import (
    CORRECTION,
    correct,
    cap_roll,
    ease_to_neutral,
    fix_face_size,
    require_corrected,
    rotation_matrix,
    scale_head,
    smooth,
)


def _motion(T=60, seed=0):
    """FLP pkl 의 motion 리스트 모양. pitch/yaw/roll (1,1) · t (1,3) · exp (1,21,3) · scale (1,1)."""
    rng = np.random.default_rng(seed)
    base = np.linspace(0, 20, T)
    out = []
    for i in range(T):
        x = {
            "pitch": np.array([[10.0 + base[i] + rng.normal(0, 1.5)]], np.float32),
            "yaw": np.array([[-2.0 + rng.normal(0, 1.5)]], np.float32),
            "roll": np.array([[5.0 + rng.normal(0, 1.0)]], np.float32),
            "t": np.array([[0.01 * i, 0.0, 0.0]], np.float32),
            "exp": rng.normal(0, 0.01, (1, 21, 3)).astype(np.float32),
            "scale": np.array([[1.0]], np.float32),
            "kp": np.zeros((1, 21, 3), np.float32),
        }
        x["R"] = rotation_matrix(x["pitch"], x["yaw"], x["roll"])
        out.append(x)
    return out


def _pkl(T=60):
    m = _motion(T)
    return {"n_frames": T, "output_fps": 24, "motion": m, "c_eyes_lst": [0] * T, "c_lip_lst": [0] * T}


def _reversals(m, key="pitch"):
    a = np.array([float(np.ravel(x[key])[0]) for x in m])
    v = np.diff(a)
    return float(np.mean(v[1:] * v[:-1] < 0))


def test_회전행렬_0도는_단위행렬():
    z = np.zeros((1, 1), np.float32)
    assert np.allclose(rotation_matrix(z, z, z), np.eye(3)[None])


def test_회전행렬은_직교():
    R = rotation_matrix(np.array([[12.0]]), np.array([[-7.0]]), np.array([[3.0]]))
    assert np.allclose(R[0] @ R[0].T, np.eye(3), atol=1e-6)


def test_고개만_줄이고_표정은_그대로():
    m = _motion()
    out = scale_head(m, 0.7)
    for a, b in zip(m, out):
        for key in ("pitch", "yaw", "roll", "t"):
            assert np.allclose(b[key] - m[0][key], (a[key] - m[0][key]) * 0.7, atol=1e-5)
        assert np.array_equal(a["exp"], b["exp"])
        assert np.allclose(b["R"], rotation_matrix(b["pitch"], b["yaw"], b["roll"]))
    assert np.allclose(out[0]["pitch"], m[0]["pitch"])


def test_스무딩은_떨림을_줄이고_길이는_같다():
    m = _motion()
    out = smooth(m, 2.0)
    assert len(out) == len(m)
    assert _reversals(out) < _reversals(m) / 2
    assert out[0]["exp"].shape == m[0]["exp"].shape


def test_끝은_0번_프레임_자세로_돌아오고_앞부분은_그대로():
    m = _motion()
    out = ease_to_neutral(m, 24)
    for key in ("pitch", "yaw", "roll", "t", "exp", "scale"):
        assert np.allclose(out[-1][key], m[0][key], atol=1e-6)
    for i in range(len(m) - 24):
        assert np.array_equal(out[i]["pitch"], m[i]["pitch"])


def test_원본을_건드리지_않는다():
    m = _motion()
    keep = copy.deepcopy(m)
    scale_head(m, 0.7); smooth(m, 2.0); ease_to_neutral(m, 24)
    for a, b in zip(m, keep):
        assert np.array_equal(a["pitch"], b["pitch"])


def test_correct_는_표시를_붙이고_끝이_처음과_같다():
    d = correct(_pkl())
    assert d["afl_correction"] == CORRECTION
    m = d["motion"]
    assert np.allclose(m[-1]["pitch"], m[0]["pitch"], atol=1e-6)
    require_corrected(d)  # 통과


def test_보정_안_한_pkl_은_렌더_거부():
    with pytest.raises(ValueError):
        require_corrected(_pkl())


def test_다른_버전_보정도_거부():
    d = correct(_pkl())
    d["afl_correction"] = dict(d["afl_correction"], version=0)
    with pytest.raises(ValueError):
        require_corrected(d)


def test_두번_보정하지_않는다():
    d = correct(_pkl())
    with pytest.raises(ValueError):
        correct(d)


def test_얼굴_크기는_0번_프레임_값으로_고정():
    m = _motion()
    for i, x in enumerate(m):
        x["scale"] = np.array([[1.15 + 0.003 * i]], np.float32)  # 인물이 카메라로 다가옴
    f = fix_face_size(m)
    assert all(np.allclose(x["scale"], 1.15) for x in f)
    assert np.allclose(f[10]["exp"], m[10]["exp"]) and np.allclose(f[10]["pitch"], m[10]["pitch"])
    assert np.isclose(float(np.squeeze(m[10]["scale"])), 1.18)  # 원본은 그대로


def test_correct_는_얼굴_크기를_고정한다():
    p = _pkl()
    for i, x in enumerate(p["motion"]):
        x["scale"] = np.array([[1.15 * (1 + 0.17 * np.sin(i / 10))]], np.float32)
    d = correct(p)
    s = np.array([float(np.squeeze(x["scale"])) for x in d["motion"]])
    assert np.ptp(s) < 1e-6 and np.isclose(s[0], 1.15)
    assert d["afl_correction"]["face_size"] == "fixed"


def _rolls(m):
    return np.array([float(np.ravel(x["roll"])[0]) for x in m])


def test_갸웃이_상한을_넘으면_폭을_상한으로_줄인다():
    m = _motion()
    for i, x in enumerate(m):
        x["roll"] = np.array([[5.0 + 29.0 * np.sin(i / 8) ** 2]], np.float32)
    c = cap_roll(m, 10.0)
    assert np.isclose(np.ptp(_rolls(c)), 10.0, atol=1e-3)
    assert np.isclose(_rolls(c)[0], _rolls(m)[0])  # 0번 프레임 기준
    assert np.allclose(c[10]["pitch"], m[10]["pitch"]) and np.allclose(c[10]["yaw"], m[10]["yaw"])
    assert np.allclose(c[10]["R"], rotation_matrix(c[10]["pitch"], c[10]["yaw"], c[10]["roll"]))


def test_갸웃이_상한_안이면_그대로():
    m = _motion()  # roll 잡음 폭 몇 도
    assert np.ptp(_rolls(m)) < 10
    assert np.allclose(_rolls(cap_roll(m, 10.0)), _rolls(m))


def test_correct_후_갸웃_폭은_상한_이하():
    p = _pkl()
    for i, x in enumerate(p["motion"]):
        x["roll"] = np.array([[40.0 * np.sin(i / 6) ** 2]], np.float32)
    d = correct(p)
    assert np.ptp(_rolls(d["motion"])) <= CORRECTION["roll_cap_deg"] + 1e-3
