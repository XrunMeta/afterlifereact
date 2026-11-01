"""AFL-1071 렌더 얼굴 기준 자동 재시도 — 가짜 S3FD 모듈을 sys.modules 에 심어 GPU 없이 시험."""
import importlib
import threading
import types

import numpy as np
import pytest

import face_threshold

PH = (0.0, 0.0, 0.0, 0.0)  # MuseTalk coord_placeholder 와 같은 모양
PREFIXES = ("face_detection.", "musetalk.utils.face_detection.")
SFD = "detection.sfd.sfd_detector"


def _orig_detect(self, images):
    return "ORIG"


def _install_fake(monkeypatch, prefix, boxes=None):
    """prefix 아래 sfd_detector·detect·bbox 가짜 모듈을 심고 SFDDetector 클래스를 돌려준다."""
    cls = type("SFDDetector", (), {"detect_from_batch": _orig_detect})
    m_det = types.ModuleType(prefix + SFD)
    m_det.SFDDetector = cls
    m_bd = types.ModuleType(prefix + "detection.sfd.detect")
    # boxes: (박스 수, 배치, 5) — 마지막 열이 점수
    m_bd.batch_detect = lambda net, images, device=None: boxes
    m_bbox = types.ModuleType(prefix + "detection.sfd.bbox")
    m_bbox.nms = lambda dets, thr: list(range(dets.shape[0]))  # 전부 유지
    monkeypatch.setitem(__import__("sys").modules, prefix + SFD, m_det)
    monkeypatch.setitem(__import__("sys").modules, prefix + "detection.sfd.detect", m_bd)
    monkeypatch.setitem(__import__("sys").modules, prefix + "detection.sfd.bbox", m_bbox)
    return cls


@pytest.fixture
def fakes(monkeypatch):
    return [_install_fake(monkeypatch, p) for p in PREFIXES]


@pytest.fixture(autouse=True)
def _default_thr(monkeypatch):
    monkeypatch.setattr(face_threshold, "RENDER_SCORE_FALLBACK", 0.2)


def test_constants():
    assert face_threshold.RENDER_SCORE_DEFAULT == 0.5


def test_no_fallback_when_any_face(fakes):
    first = ([PH, (1, 2, 3, 4), PH], ["f0", "f1", "f2"])
    calls = []

    def get_fn(imgs, shift):
        calls.append((imgs, shift))
        return first

    out = face_threshold.landmarks_with_fallback(get_fn, ["a", "b", "c"], 0, PH)
    assert out is first
    assert calls == [(["a", "b", "c"], 0)]
    for cls in fakes:
        assert cls.detect_from_batch is _orig_detect


def test_fallback_when_all_placeholder(fakes, capsys):
    first = ([PH, PH], ["f0", "f1"])
    second = ([PH, (5, 6, 7, 8)], ["g0", "g1"])
    seen = []

    def get_fn(imgs, shift):
        seen.append([cls.detect_from_batch is not _orig_detect for cls in fakes])
        return first if len(seen) == 1 else second

    out = face_threshold.landmarks_with_fallback(get_fn, ["a", "b"], 3, PH)
    assert out is second
    assert seen == [[False, False], [True, True]]
    for cls in fakes:
        assert cls.detect_from_batch is _orig_detect
    assert "[face-thr] fallback 0.2 hit=1/2" in capsys.readouterr().out


def test_patch_restored_after_exception(fakes):
    n = []

    def get_fn(imgs, shift):
        n.append(1)
        if len(n) == 2:
            raise RuntimeError("boom")
        return ([PH], ["f0"])

    with pytest.raises(RuntimeError, match="boom"):
        face_threshold.landmarks_with_fallback(get_fn, ["a"], 0, PH)
    for cls in fakes:
        assert cls.detect_from_batch is _orig_detect


def test_fallback_disabled_by_env_zero(monkeypatch, fakes):
    monkeypatch.setenv("MUSETALK_FACE_FALLBACK_THR", "0")
    mod = importlib.reload(face_threshold)
    try:
        assert mod.RENDER_SCORE_FALLBACK == 0.0
        first = ([PH, PH], ["f0", "f1"])
        calls = []

        def get_fn(imgs, shift):
            calls.append(1)
            return first

        assert mod.landmarks_with_fallback(get_fn, ["a", "b"], 0, PH) is first
        assert len(calls) == 1
    finally:
        monkeypatch.delenv("MUSETALK_FACE_FALLBACK_THR")
        importlib.reload(face_threshold)


def test_env_bad_value_uses_default(monkeypatch):
    monkeypatch.setenv("MUSETALK_FACE_FALLBACK_THR", "abc")
    try:
        assert importlib.reload(face_threshold).RENDER_SCORE_FALLBACK == 0.2
    finally:
        monkeypatch.delenv("MUSETALK_FACE_FALLBACK_THR")
        importlib.reload(face_threshold)


def test_no_retry_when_no_module_patched(capsys):
    # 가짜 모듈 없음 → 패치 0개 → 재시도 없이 첫 결과 + 경고 한 줄
    import sys

    for p in PREFIXES:
        assert sys.modules.get(p + SFD) is None
    first = ([PH], ["f0"])
    calls = []

    def get_fn(imgs, shift):
        calls.append(1)
        return first

    assert face_threshold.landmarks_with_fallback(get_fn, ["a"], 0, PH) is first
    assert len(calls) == 1
    assert "[face-thr]" in capsys.readouterr().out


def test_only_one_path_present_still_retries(monkeypatch):
    cls = _install_fake(monkeypatch, "face_detection.")
    first = ([PH], ["f0"])
    second = ([(1, 1, 2, 2)], ["g0"])
    seen = []

    def get_fn(imgs, shift):
        seen.append(cls.detect_from_batch is not _orig_detect)
        return first if len(seen) == 1 else second

    assert face_threshold.landmarks_with_fallback(get_fn, ["a"], 0, PH) is second
    assert seen == [False, True]
    assert cls.detect_from_batch is _orig_detect


def test_empty_frames_no_retry(fakes):
    first = ([], [])
    calls = []

    def get_fn(imgs, shift):
        calls.append(1)
        return first

    assert face_threshold.landmarks_with_fallback(get_fn, [], 0, PH) is first
    assert len(calls) == 1


def _scores_boxes(scores):
    # (박스 수, 배치 1, 5)
    b = np.zeros((len(scores), 1, 5), dtype=np.float32)
    b[:, 0, 4] = scores
    return b


def test_patched_filter_uses_threshold(monkeypatch):
    boxes = _scores_boxes([0.6, 0.3, 0.1])
    cls = _install_fake(monkeypatch, "face_detection.", boxes=boxes)
    det = cls()
    det.face_detector, det.device = object(), "cpu"
    with face_threshold.lowered_threshold(0.2):
        out = cls.detect_from_batch(det, None)
    assert len(out) == 1
    assert sorted(round(float(x[-1]), 2) for x in out[0]) == [0.3, 0.6]
    with face_threshold.lowered_threshold(0.5):
        out = cls.detect_from_batch(det, None)
    assert [round(float(x[-1]), 2) for x in out[0]] == [0.6]
    assert cls.detect_from_batch is _orig_detect


def test_other_thread_gets_original_during_patch(fakes):
    cls = fakes[0]
    det = cls()
    got = []
    with face_threshold.lowered_threshold(0.2):
        t = threading.Thread(target=lambda: got.append(cls.detect_from_batch(det, None)))
        t.start()
        t.join()
    assert got == ["ORIG"]
