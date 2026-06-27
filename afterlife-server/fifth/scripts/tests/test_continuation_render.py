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
    """0샘플 wav → (0, PhaseToken) 반환. first_frame 은 입력 토큰을 패스스루한다.

    S3 의미론: 렌더 0회 청크는 위상을 진전시키지 않는다.
    phase_token=None → 기본 tok.first_frame=True → 패스스루 → end_tok.first_frame=True.
    """
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
    # S3 패스스루: phase_token=None → default first_frame=True → end_tok.first_frame=True
    assert tok.first_frame is True, (
        f"빈 wav end_tok.first_frame={tok.first_frame!r} — 입력 토큰(True) 패스스루 여야 함"
    )
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


# ---------------------------------------------------------------------------
# blend 경로 회귀 테스트 — phase_token=None 시 레거시와 동일
# ---------------------------------------------------------------------------

class _RecordingEngineBlend:
    """blend 경로용: open_src / closed_src 렌더를 src_img 마커로 구별해 기록."""

    def __init__(self):
        self.calls: list[dict] = []

    def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
        self.calls.append({"first_frame": first_frame, "src_img": src_img})
        # open(200) / closed(100) 마커 반환
        val = 200 if src_img == "OPEN" else 100
        return np.full((512, 512, 3), val, dtype=np.uint8)


def _make_blend_sources():
    return {
        "mode": "blend",
        "open_s": {
            "src_img": "OPEN",
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "closed_s": {
            "src_img": "CLOSED",
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "mouth_mask": np.ones((512, 512, 1), np.float32) * 0.5,
    }


def test_blend_token_none_open_first_is_true_on_first_render(tmp_path):
    """blend 경로 phase_token=None 시 open_src 첫 render 호출만 first_frame=True.

    레거시(_stream_blend): open_first=True, 루프 후 open_first=False.
    phase_token=None → tok=PhaseToken(first_frame=True) → open_first=True = 레거시와 동일.
    """
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _RecordingEngineBlend()

    n, tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, _make_blend_sources(), wav,
        on_frame=lambda f: None,
        blink_enabled=False,
    )

    assert n > 1, "이 테스트는 2프레임 이상 필요"
    assert tok.first_frame is False

    # open_src 호출만 추출 (src_img=="OPEN")
    open_calls = [c for c in eng.calls if c["src_img"] == "OPEN"]
    assert open_calls, "open_src render 호출이 없음"
    assert open_calls[0]["first_frame"] is True, (
        f"open_src 첫 render first_frame={open_calls[0]['first_frame']} — True 여야 함"
    )
    for call in open_calls[1:]:
        assert call["first_frame"] is False, (
            f"open_src 후속 render first_frame={call['first_frame']} — False 여야 함"
        )


def test_blend_token_none_closed_first_is_true_on_first_closed_render(tmp_path):
    """blend 경로 phase_token=None 시 closed_src 첫 render 호출만 first_frame=True.

    무음 wav(w=0) → 매 프레임 closed_src 도 렌더됨 → 첫 호출만 True.
    """
    dur, sr = 0.5, 16000
    wav = _write_silent_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _RecordingEngineBlend()

    n, tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, _make_blend_sources(), wav,
        on_frame=lambda f: None,
        blink_enabled=False,
    )

    assert n > 1, "이 테스트는 2프레임 이상 필요"

    closed_calls = [c for c in eng.calls if c["src_img"] == "CLOSED"]
    assert closed_calls, "closed_src render 호출이 없음 — 무음이므로 w=0, 매 프레임 렌더돼야 함"
    assert closed_calls[0]["first_frame"] is True, (
        f"closed_src 첫 render first_frame={closed_calls[0]['first_frame']} — True 여야 함"
    )
    for call in closed_calls[1:]:
        assert call["first_frame"] is False, (
            f"closed_src 후속 render first_frame={call['first_frame']} — False 여야 함"
        )


def test_blend_token_none_frame_offset_equals_n(tmp_path):
    """blend 경로 phase_token=None 시 끝 토큰 frame_offset == 프레임 수 n."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _RecordingEngineBlend()

    n, tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, _make_blend_sources(), wav,
        on_frame=lambda f: None,
        blink_enabled=False,
    )
    assert tok.frame_offset == n, f"frame_offset={tok.frame_offset} != n={n}"


# ---------------------------------------------------------------------------
# Task 2: blink 위상 캐리오버 테스트 — Step 1
# ---------------------------------------------------------------------------

def _blink_arr_to_float(seq: list) -> np.ndarray:
    """make_blink_sequence 반환(list of (1,1) ndarray) → 1-D float array."""
    return np.array([float(x[0, 0]) for x in seq], dtype=np.float64)


def test_blink_phase_offset_zero_is_legacy():
    """make_blink_sequence(phase_offset=0) == 기존 호출(인자 없음) — 회귀 불변식."""
    from render_offline import make_blink_sequence
    fps = 25.0
    eye_open = 0.37
    n = 80

    legacy = make_blink_sequence(n, fps, eye_open, 0.0, avg_interval_sec=1.2, blink_dur_frames=6)
    with_zero = make_blink_sequence(n, fps, eye_open, 0.0, avg_interval_sec=1.2, blink_dur_frames=6, phase_offset=0)

    legacy_arr = _blink_arr_to_float(legacy)
    with_zero_arr = _blink_arr_to_float(with_zero)
    assert np.allclose(legacy_arr, with_zero_arr, atol=1e-7), (
        "phase_offset=0 시 기존 동작과 동일해야 함"
    )


def test_blink_continuity_two_chunks_equals_whole():
    """통짜 50프레임 == concat(청크A 25프레임 phase_offset=0, 청크B 25프레임 phase_offset=25).

    avg_interval_sec=1.0(25fps → base_interval=25)으로 강제해 blink 발생 보장.
    """
    from render_offline import make_blink_sequence
    fps = 25.0
    eye_open = 0.37
    n_whole = 50
    n_half = 25

    # avg_interval_sec=1.0 → base_interval=25, 50프레임에서 blink≥1개 보장
    kwargs = dict(avg_interval_sec=1.0, blink_dur_frames=6)

    whole = make_blink_sequence(n_whole, fps, eye_open, 0.0, **kwargs)
    a = make_blink_sequence(n_half, fps, eye_open, 0.0, phase_offset=0, **kwargs)
    b = make_blink_sequence(n_half, fps, eye_open, 0.0, phase_offset=n_half, **kwargs)

    whole_arr = _blink_arr_to_float(whole)
    ab_arr = np.concatenate([_blink_arr_to_float(a), _blink_arr_to_float(b)])

    # blink 존재 확인 — 테스트가 무의미한 all-open 체크가 아님을 보장
    assert not np.all(whole_arr == eye_open), (
        "whole 에 blink 가 없음 — avg_interval_sec 너무 길거나 n_frames 부족"
    )

    assert np.allclose(ab_arr, whole_arr, atol=1e-4), (
        f"2청크 concat 이 통짜와 다름 — max_diff={np.max(np.abs(ab_arr - whole_arr)):.6f}"
    )


def test_blink_continuity_three_chunks_equals_whole():
    """3청크 concat 도 통짜와 동일 — phase_offset 연쇄 전달 검증."""
    from render_offline import make_blink_sequence
    fps = 25.0
    eye_open = 0.37
    n_each = 20
    kwargs = dict(avg_interval_sec=0.5, blink_dur_frames=4)

    whole = make_blink_sequence(n_each * 3, fps, eye_open, 0.0, **kwargs)
    a = make_blink_sequence(n_each, fps, eye_open, 0.0, phase_offset=0,        **kwargs)
    b = make_blink_sequence(n_each, fps, eye_open, 0.0, phase_offset=n_each,   **kwargs)
    c = make_blink_sequence(n_each, fps, eye_open, 0.0, phase_offset=2*n_each, **kwargs)

    whole_arr = _blink_arr_to_float(whole)
    abc_arr   = np.concatenate([_blink_arr_to_float(a), _blink_arr_to_float(b), _blink_arr_to_float(c)])

    assert np.allclose(abc_arr, whole_arr, atol=1e-4), (
        f"3청크 concat 이 통짜와 다름 — max_diff={np.max(np.abs(abc_arr - whole_arr)):.6f}"
    )


def test_blink_phase_accumulates_in_end_token(tmp_path):
    """stream_wav_frames 끝 토큰 blink_phase = tok.blink_phase + n."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _RecordingEngine()

    n1, tok1 = stream_wav_frames(
        eng, _FakeJP(nj), cfg, _make_sources(), wav,
        on_frame=lambda f: None,
        blink_enabled=False,
    )
    assert tok1.blink_phase == n1, (
        f"1청크 후 blink_phase={tok1.blink_phase} != n={n1}"
    )

    n2, tok2 = stream_wav_frames(
        eng, _FakeJP(nj), cfg, _make_sources(), wav,
        on_frame=lambda f: None,
        blink_enabled=False,
        phase_token=tok1,
    )
    assert tok2.blink_phase == n1 + n2, (
        f"2청크 후 blink_phase={tok2.blink_phase} != n1+n2={n1+n2}"
    )


# ---------------------------------------------------------------------------
# Task 3(S3): stitching 연속성 + 빈 wav 의미론 테스트
# ---------------------------------------------------------------------------

def test_second_chunk_first_render_uses_first_frame_false(tmp_path):
    """1청크 렌더 후 끝 토큰을 2청크에 전달하면 2청크 첫 eng.render 호출 first_frame=False.

    레거시 단독 호출은 first_frame=True 였으나, 2청크는 첫 프레임이더라도
    FLP stitching 연속을 위해 first_frame=False 로 호출돼야 한다.
    """
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _RecordingEngine()
    sources = _make_sources()

    # 1청크 렌더
    _, tok1 = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=lambda f: None, blink_enabled=False,
    )
    assert tok1.first_frame is False, "1청크 끝 토큰 first_frame 은 False 여야 함"

    # 2청크 — 끝 토큰 이어받기
    eng.calls.clear()
    stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=lambda f: None, blink_enabled=False,
        phase_token=tok1,
    )
    assert eng.calls, "2청크에서 render 호출이 없음"
    assert eng.calls[0]["first_frame"] is False, (
        f"2청크 첫 render first_frame={eng.calls[0]['first_frame']} — False 여야 함"
        " (레거시 단독 호출=True 와 구별됨)"
    )


def test_empty_wav_does_not_advance_phase(tmp_path):
    """빈 wav 청크는 끝 토큰의 first_frame/frame_offset/blink_phase 가 입력 토큰과 동일.

    프레임을 한 장도 내지 않은 청크는 위상을 진전시키지 않는다.
    """
    p = tmp_path / "empty_s3.wav"
    sf.write(str(p), np.zeros(0, dtype=np.float32), 16000)
    cfg = FifthConfig.from_env()
    eng = _RecordingEngine()

    # 임의 위상 토큰
    input_tok = PhaseToken(frame_offset=17, blink_phase=42, first_frame=True, head_last=None)

    n, end_tok = stream_wav_frames(
        eng, _FakeJP(12), cfg, _make_sources(), str(p),
        on_frame=lambda f: None, blink_enabled=False,
        phase_token=input_tok,
    )
    assert n == 0
    assert end_tok.first_frame == input_tok.first_frame, (
        f"first_frame 변경: {input_tok.first_frame!r} → {end_tok.first_frame!r}"
        " — 빈 wav 는 위상 불진전"
    )
    assert end_tok.frame_offset == input_tok.frame_offset, (
        f"frame_offset 진전: {input_tok.frame_offset} → {end_tok.frame_offset}"
    )
    assert end_tok.blink_phase == input_tok.blink_phase, (
        f"blink_phase 진전: {input_tok.blink_phase} → {end_tok.blink_phase}"
    )
    assert eng.calls == [], "빈 wav 시 render 호출이 없어야 함"


def test_empty_wav_then_real_chunk_first_frame_preserved(tmp_path):
    """tok.first_frame=True 상태에서 빈wav → 실wav 순서일 때 실wav 첫 렌더가 first_frame=True.

    빈 wav 가 first_frame 을 보존해야 후속 실wav 청크가 FLP stitching 초기화를 받는다.
    """
    empty_p = tmp_path / "empty_s3b.wav"
    sf.write(str(empty_p), np.zeros(0, dtype=np.float32), 16000)
    real_wav = _write_wav(tmp_path, dur=0.5)

    cfg = FifthConfig.from_env()
    nj = _env_len(0.5, 16000, cfg.fps) + 4
    eng = _RecordingEngine()
    sources = _make_sources()

    # 빈 wav (first_frame=True 상태)
    input_tok = PhaseToken(first_frame=True)
    n_empty, tok_after_empty = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, str(empty_p),
        on_frame=lambda f: None, blink_enabled=False,
        phase_token=input_tok,
    )
    assert n_empty == 0
    assert tok_after_empty.first_frame is True, (
        f"빈 wav 후 first_frame={tok_after_empty.first_frame!r} — True 여야 함(위상 불진전)"
    )

    # 실 wav — 이전 토큰 이어받기
    eng.calls.clear()
    stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, real_wav,
        on_frame=lambda f: None, blink_enabled=False,
        phase_token=tok_after_empty,
    )
    assert eng.calls, "실 wav render 호출이 없음"
    assert eng.calls[0]["first_frame"] is True, (
        f"빈wav → 실wav 첫 render first_frame={eng.calls[0]['first_frame']!r}"
        " — True 여야 함(stitching 초기화 보존)"
    )


def test_blend_empty_wav_does_not_advance_phase(tmp_path):
    """blend 경로: 빈 wav 청크는 위상(first_frame/frame_offset/blink_phase)을 진전시키지 않는다."""
    p = tmp_path / "empty_blend_s3.wav"
    sf.write(str(p), np.zeros(0, dtype=np.float32), 16000)
    cfg = FifthConfig.from_env()
    eng = _RecordingEngineBlend()

    input_tok = PhaseToken(frame_offset=10, blink_phase=20, first_frame=True, head_last=None)

    n, end_tok = stream_wav_frames(
        eng, _FakeJP(12), cfg, _make_blend_sources(), str(p),
        on_frame=lambda f: None, blink_enabled=False,
        phase_token=input_tok,
    )
    assert n == 0
    assert end_tok.first_frame == input_tok.first_frame, (
        f"blend 빈 wav first_frame 변경: {input_tok.first_frame!r} → {end_tok.first_frame!r}"
    )
    assert end_tok.frame_offset == input_tok.frame_offset
    assert end_tok.blink_phase == input_tok.blink_phase
    assert eng.calls == []


# ---------------------------------------------------------------------------
# CONCERN 보강: count==0 가드 통일 — wav 있으나 render 전부 None 경계
# ---------------------------------------------------------------------------

class _NullEngine:
    """render 가 항상 None 을 반환 — count==0 경계 시뮬."""
    def __init__(self):
        self.calls: list[dict] = []

    def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
        self.calls.append({"first_frame": first_frame})
        return None  # 항상 None


class _PartialNullEngine:
    """처음 skip_n 번만 None, 이후는 정상 프레임 반환."""
    def __init__(self, skip_n: int = 1):
        self.skip_n = skip_n
        self.calls: list[dict] = []

    def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
        self.calls.append({"first_frame": first_frame})
        if len(self.calls) <= self.skip_n:
            return None
        return np.full((512, 512, 3), 128, dtype=np.uint8)


def test_render_all_none_count_zero_does_not_advance_phase(tmp_path):
    """wav 있으나 eng.render 전부 None(count==0) → 끝 토큰이 입력 tok 과 동일(위상 불진전).

    CONCERN: len(y)==0 early-return 만 가드하고 정상 경로는 가드 없었던 버그.
    """
    wav = _write_wav(tmp_path, dur=0.5)
    cfg = FifthConfig.from_env()
    nj = _env_len(0.5, 16000, cfg.fps) + 4
    sources = _make_sources()

    input_tok = PhaseToken(frame_offset=7, blink_phase=13, first_frame=True, head_last=None)
    eng = _NullEngine()

    n, end_tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=lambda f: None, blink_enabled=False,
        phase_token=input_tok,
    )
    assert n == 0, "NullEngine 이므로 출력 프레임이 없어야 함"
    assert eng.calls, "render 호출은 있어야 함 (wav 있음)"
    assert end_tok.first_frame == input_tok.first_frame, (
        f"first_frame 변경: {input_tok.first_frame!r} → {end_tok.first_frame!r}"
        " — count==0 이면 위상 불진전"
    )
    assert end_tok.frame_offset == input_tok.frame_offset, (
        f"frame_offset 진전: {input_tok.frame_offset} → {end_tok.frame_offset}"
    )
    assert end_tok.blink_phase == input_tok.blink_phase, (
        f"blink_phase 진전: {input_tok.blink_phase} → {end_tok.blink_phase}"
    )


def test_render_partial_none_count_gt_zero_advances(tmp_path):
    """일부만 None(count>0) → blink_phase+=n, first_frame=False 진전 유지 (C-2 회귀 보호).

    count>0 이면 시간이 흘렀으므로 blink 타임라인(n 기준) 은 정상 누적해야 한다.
    """
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    sources = _make_sources()

    input_tok = PhaseToken(frame_offset=5, blink_phase=11, first_frame=True, head_last=None)
    # 첫 1번만 None, 이후 정상 → count >= 1
    eng = _PartialNullEngine(skip_n=1)

    n, end_tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=lambda f: None, blink_enabled=False,
        phase_token=input_tok,
    )
    assert n > 0, "partial None 이므로 count>0 여야 함"
    assert end_tok.first_frame is False, (
        f"count>0 이면 first_frame=False 여야 함, got {end_tok.first_frame!r}"
    )
    assert end_tok.frame_offset == input_tok.frame_offset + n, (
        f"frame_offset: {input_tok.frame_offset}+{n} 여야 함, got {end_tok.frame_offset}"
    )
    # C-2: blink_phase 는 n(타임라인 길이) 기준 누적
    assert end_tok.blink_phase > input_tok.blink_phase, (
        f"blink_phase 가 진전돼야 함: {input_tok.blink_phase} → {end_tok.blink_phase}"
    )


def test_blend_render_all_none_count_zero_does_not_advance_phase(tmp_path):
    """blend 경로: wav 있으나 render 전부 None(count==0) → 위상 불진전."""
    wav = _write_wav(tmp_path, dur=0.5)
    cfg = FifthConfig.from_env()
    nj = _env_len(0.5, 16000, cfg.fps) + 4
    sources = _make_blend_sources()

    input_tok = PhaseToken(frame_offset=3, blink_phase=8, first_frame=True, head_last=None)

    class _NullEngineBlend:
        def __init__(self):
            self.calls: list[dict] = []
        def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
            self.calls.append({"first_frame": first_frame, "src_img": src_img})
            return None

    eng = _NullEngineBlend()

    n, end_tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=lambda f: None, blink_enabled=False,
        phase_token=input_tok,
    )
    assert n == 0
    assert end_tok.first_frame == input_tok.first_frame, (
        f"blend count==0 first_frame 변경: {input_tok.first_frame!r} → {end_tok.first_frame!r}"
    )
    assert end_tok.frame_offset == input_tok.frame_offset
    assert end_tok.blink_phase == input_tok.blink_phase
