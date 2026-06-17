"""idle prebake TDD — red → green 순서.

Step 1: 실패 테스트 작성 (idle_prebake 모듈·set_idle_frames 미정의 상태).
Step 6: 전체 통과 확인.
"""
from __future__ import annotations

import asyncio
import wave
from pathlib import Path

import numpy as np
import pytest

import idle_prebake


# ---------------------------------------------------------------------------
# make_silent_wav
# ---------------------------------------------------------------------------

def test_make_silent_wav_writes_valid_wav(tmp_path):
    p = idle_prebake.make_silent_wav(str(tmp_path / "sil.wav"), seconds=2, sr=16000)
    assert Path(p).is_file()
    with wave.open(p, "rb") as w:
        assert w.getframerate() == 16000
        assert w.getnframes() == 2 * 16000
        assert w.getnchannels() == 1


# ---------------------------------------------------------------------------
# run_prebake
# ---------------------------------------------------------------------------

def test_prebake_collects_frames_and_injects(tmp_path):
    frames_pushed = {}

    class FakeTrack:
        def set_idle_frames(self, frames):
            frames_pushed["n"] = len(frames)

    class FakeRenderer:
        def infer(self, wav, on_frame, video_path=None):
            for _ in range(3):
                on_frame(np.zeros((8, 8, 3), dtype=np.uint8))
            return 3

    idle_prebake.run_prebake(
        FakeRenderer(), str(tmp_path / "face.jpg"), FakeTrack(),
        wav_dir=str(tmp_path), seconds=1,
    )
    assert frames_pushed["n"] == 3


def test_prebake_no_inject_on_zero_frames(tmp_path):
    class FakeTrack:
        def __init__(self):
            self.called = False

        def set_idle_frames(self, frames):
            self.called = True

    class ZeroRenderer:
        def infer(self, wav, on_frame, video_path=None):
            return 0

    t = FakeTrack()
    idle_prebake.run_prebake(
        ZeroRenderer(), str(tmp_path / "f.jpg"), t,
        wav_dir=str(tmp_path), seconds=1,
    )
    assert t.called is False


def test_prebake_swallows_render_error(tmp_path):
    class FakeTrack:
        def __init__(self):
            self.called = False

        def set_idle_frames(self, frames):
            self.called = True

    class BoomRenderer:
        def infer(self, wav, on_frame, video_path=None):
            raise RuntimeError("gpu")

    t = FakeTrack()
    n = idle_prebake.run_prebake(
        BoomRenderer(), str(tmp_path / "f.jpg"), t,
        wav_dir=str(tmp_path), seconds=1,
    )
    assert n == 0 and t.called is False


# ---------------------------------------------------------------------------
# AvatarVideoTrack.set_idle_frames
# ---------------------------------------------------------------------------

def test_set_idle_frames_replaces_buffer():
    from media_tracks import AvatarVideoTrack

    vt = AvatarVideoTrack(sync_event=asyncio.Event())
    frames = [np.zeros((8, 8, 3), dtype=np.uint8) for _ in range(4)]
    vt.set_idle_frames(frames)
    assert len(vt._idle_frames) == 4


def test_set_idle_frames_ignores_empty():
    from media_tracks import AvatarVideoTrack

    vt = AvatarVideoTrack(sync_event=asyncio.Event())
    before = len(vt._idle_frames)
    vt.set_idle_frames([])
    assert len(vt._idle_frames) == before


# ---------------------------------------------------------------------------
# sion P0: 입력 가드 테스트
# ---------------------------------------------------------------------------

def test_make_silent_wav_rejects_nonpositive(tmp_path):
    with pytest.raises(ValueError):
        idle_prebake.make_silent_wav(str(tmp_path / "x.wav"), seconds=0, sr=16000)
    with pytest.raises(ValueError):
        idle_prebake.make_silent_wav(str(tmp_path / "y.wav"), seconds=2, sr=0)


def test_run_prebake_bad_env_falls_back(tmp_path, monkeypatch):
    monkeypatch.setenv("FIFTH_IDLE_SEC", "abc")

    class FakeTrack:
        def set_idle_frames(self, frames):
            pass

    class FakeRenderer:
        def infer(self, wav, on_frame, video_path=None):
            on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
            return 1

    # 크래시 없이 동작(기본 6초로 폴백)
    n = idle_prebake.run_prebake(
        FakeRenderer(), str(tmp_path / "f.jpg"), FakeTrack(),
        wav_dir=str(tmp_path),
    )
    assert n == 1
