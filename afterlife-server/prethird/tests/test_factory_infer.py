"""
server.py _build_pipeline_factory — infer_fn 클로저가 sess.video_path를
mt.infer에 video_path로 전달하는지 단위 검증.

DialoguePipeline·MuseTalkInproc 실제 로드 없이,
factory 함수를 직접 재현해 클로저 동작만 확인한다.
"""
from __future__ import annotations

import sys
import pathlib
import types
from unittest.mock import MagicMock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))


def _make_mock_mt():
    """mt.infer 호출 인자를 캡처하는 가짜 MuseTalkInproc."""
    calls: list[dict] = []

    class FakeMt:
        def infer(self, wav, cb, video_path=None):
            calls.append({"wav": wav, "cb": cb, "video_path": video_path})

    return FakeMt(), calls


def _make_fake_sess(video_path=None):
    """최소 세션 네임스페이스."""
    sess = types.SimpleNamespace()
    sess.video_path = video_path
    return sess


# ── 클로저 패턴 재현 ──────────────────────────────────────────────────
def _build_infer_fn(mt, sess):
    """server.py factory 내부 클로저와 동일한 패턴."""
    _vp = getattr(sess, "video_path", None)

    def _infer_fn(wav, cb, _vp=_vp):
        return mt.infer(wav, cb, video_path=_vp)

    return _infer_fn


# ── 테스트 ────────────────────────────────────────────────────────────

def test_factory_infer_fn_passes_video_path_when_set():
    """sess.video_path가 설정돼 있으면 mt.infer에 video_path로 전달."""
    mt, calls = _make_mock_mt()
    sess = _make_fake_sess(video_path="/video-ref/9043/9043-idle-25fps.mp4")
    infer_fn = _build_infer_fn(mt, sess)
    infer_fn("/tmp/test.wav", lambda f: None)
    assert len(calls) == 1
    assert calls[0]["video_path"] == "/video-ref/9043/9043-idle-25fps.mp4"


def test_factory_infer_fn_passes_none_when_no_video_path():
    """sess.video_path = None이면 mt.infer에 video_path=None 전달 (halbae 기본)."""
    mt, calls = _make_mock_mt()
    sess = _make_fake_sess(video_path=None)
    infer_fn = _build_infer_fn(mt, sess)
    infer_fn("/tmp/test.wav", lambda f: None)
    assert len(calls) == 1
    assert calls[0]["video_path"] is None


def test_factory_infer_fn_captures_path_at_build_time():
    """클로저는 factory 호출 시점의 video_path를 캡처 (나중에 sess 변경해도 영향 없음)."""
    mt, calls = _make_mock_mt()
    sess = _make_fake_sess(video_path="/video-ref/1111/1111-idle-25fps.mp4")
    infer_fn = _build_infer_fn(mt, sess)
    # factory 이후 sess.video_path 변경 — 클로저는 캡처값 유지
    sess.video_path = "/video-ref/9999/9999-idle-25fps.mp4"
    infer_fn("/tmp/test.wav", lambda f: None)
    assert calls[0]["video_path"] == "/video-ref/1111/1111-idle-25fps.mp4"
