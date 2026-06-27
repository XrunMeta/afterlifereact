"""continuation render 회귀 테스트 — Task 1 Step 6.

불변식 검증:
- phase_token=None(미전달) 시 기존 stateless 렌더와 100% 동일 경로.
- 반환 tuple[int, PhaseToken]: tok.first_frame=False, tok.frame_offset==n.
- first_frame=(i==0 and tok.first_frame) 호출 시퀀스 = 레거시와 동일(phase_token=None 시).

실행법:
  cd /Volumes/exDN/devExdn/afl-fifth-continuation/afterlife-server/fifth
  PYTHONPATH=$PWD/scripts /Volumes/exDN/devExdn/afl-fifth/afterlife-server/fifth/.venv/bin/python \
    -m pytest scripts/tests/test_continuation_render.py -v
"""
from __future__ import annotations

import math
import numpy as np
import soundfile as sf
import pytest

from config import FifthConfig
from phase_token import PhaseToken
from fifth_render import stream_wav_frames


# ---------------------------------------------------------------------------
# Fake 객체 (호출 기록 포함)
# ---------------------------------------------------------------------------

class _RecordingEngine:
    """eng.render 호출마다 인자(first_frame 포함)를 calls 에 기록."""
    def __init__(self):
        self.calls: list[dict] = []

    def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
        self.calls.append({"first_frame": first_frame, "c_d_lip": c_d_lip})
        return np.full((512, 512, 3), 128, dtype=np.uint8)


class _FakeJP:
    def __init__(self, n):
        self.n = n

    def gen_motion_sequence(self, wav_path):
        motion = [
            {
                "R": np.eye(3)[None].astype(np.float32),
                "t": np.zeros((1, 3), np.float32),
                "exp": np.zeros((1, 21, 3), np.float32),
            }
            for _ in range(self.n)
        ]
        return {"motion": motion, "c_eyes_lst": [], "n_frames": self.n}


def _write_wav(tmp_path, dur=0.5, sr=16000):
    p = tmp_path / "s.wav"
    samples = int(sr * dur)
    y = (0.3 * np.sin(2 * np.pi * 200 * np.linspace(0, dur, samples))).astype(np.float32)
    sf.write(str(p), y, sr)
    return str(p)


def _write_silent_wav(tmp_path, dur=0.5, sr=16000, name="silent.wav"):
    p = tmp_path / name
    samples = int(sr * dur)
    sf.write(str(p), np.zeros(samples, dtype=np.float32), sr)
    return str(p)


def _env_len(dur: float, sr: int, fps: float) -> int:
    return math.ceil(int(sr * dur) / (sr / fps))


def _make_sources():
    return {
        "mode": "single",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
    }


# ---------------------------------------------------------------------------
# 핵심 회귀 불변식 테스트
# ---------------------------------------------------------------------------

def test_token_none_returns_tuple_with_frame_count(tmp_path):
    """phase_token=None 시 반환이 tuple[int, PhaseToken]이고 n>0."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _RecordingEngine()

    frames = []
    n, tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, _make_sources(), wav,
        on_frame=frames.append,
        blink_enabled=False,
    )
    assert n > 0, "프레임이 1개 이상 생성돼야 함"
    assert isinstance(tok, PhaseToken), "끝 토큰은 PhaseToken 이어야 함"


def test_token_none_end_tok_first_frame_false(tmp_path):
    """phase_token=None 시 끝 토큰 first_frame=False."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _RecordingEngine()

    n, tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, _make_sources(), wav,
        on_frame=lambda f: None,
        blink_enabled=False,
    )
    assert tok.first_frame is False


def test_token_none_frame_offset_equals_n(tmp_path):
    """phase_token=None 시 끝 토큰 frame_offset == 프레임 수 n."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _RecordingEngine()

    n, tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, _make_sources(), wav,
        on_frame=lambda f: None,
        blink_enabled=False,
    )
    assert tok.frame_offset == n, (
        f"frame_offset={tok.frame_offset} != n={n}"
    )


def test_token_none_first_frame_call_sequence_is_legacy(tmp_path):
    """phase_token=None 시 first_frame=(i==0) 레거시 시퀀스와 동일.

    레거시: 첫 번째 render 호출만 first_frame=True, 나머지 False.
    phase_token=None → tok=PhaseToken(first_frame=True) → i==0 and True = True (첫 호출).
    """
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _RecordingEngine()

    n, tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, _make_sources(), wav,
        on_frame=lambda f: None,
        blink_enabled=False,
    )

    assert n > 1, "이 테스트는 2프레임 이상 필요"
    # 첫 호출만 first_frame=True, 나머지는 False — 레거시와 동일
    assert eng.calls[0]["first_frame"] is True, (
        f"첫 render 호출 first_frame={eng.calls[0]['first_frame']} — True 여야 함"
    )
    for call in eng.calls[1:]:
        assert call["first_frame"] is False, (
            f"후속 render 호출 first_frame={call['first_frame']} — False 여야 함"
        )


def test_frame_offset_accumulates_across_chunks(tmp_path):
    """두 번째 청크 호출 시 frame_offset 이 첫 청크 끝에서 이어진다."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _RecordingEngine()
    sources = _make_sources()

    n1, tok1 = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=lambda f: None,
        blink_enabled=False,
    )
    assert tok1.frame_offset == n1

    n2, tok2 = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=lambda f: None,
        blink_enabled=False,
        phase_token=tok1,
    )
    assert tok2.frame_offset == n1 + n2, (
        f"tok2.frame_offset={tok2.frame_offset} != n1+n2={n1+n2}"
    )


def test_empty_wav_returns_zero_and_valid_token(tmp_path):
    """0샘플 wav → (0, PhaseToken(first_frame=False)) 반환."""
    p = tmp_path / "empty.wav"
    sf.write(str(p), np.zeros(0, dtype=np.float32), 16000)
    cfg = FifthConfig.from_env()
    eng = _RecordingEngine()

    n, tok = stream_wav_frames(
        eng, _FakeJP(12), cfg, _make_sources(), str(p),
        on_frame=lambda f: None,
        blink_enabled=False,
    )
    assert n == 0
    assert isinstance(tok, PhaseToken)
    assert tok.first_frame is False
    assert eng.calls == []


def test_phase_token_explicit_default_is_identical_to_none(tmp_path):
    """phase_token=PhaseToken() 명시 전달 == phase_token=None 과 동일 결과."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    sources = _make_sources()

    frames_none = []
    eng_none = _RecordingEngine()
    n_none, tok_none = stream_wav_frames(
        eng_none, _FakeJP(nj), cfg, sources, wav,
        on_frame=frames_none.append,
        blink_enabled=False,
        phase_token=None,
    )

    frames_default = []
    eng_default = _RecordingEngine()
    n_default, tok_default = stream_wav_frames(
        eng_default, _FakeJP(nj), cfg, sources, wav,
        on_frame=frames_default.append,
        blink_enabled=False,
        phase_token=PhaseToken(),
    )

    assert n_none == n_default, "프레임 수 동일"
    assert tok_none == tok_default, "끝 토큰 동일"
    # first_frame 호출 시퀀스 동일
    assert eng_none.calls == eng_default.calls, "render 호출 인자 시퀀스 동일"
