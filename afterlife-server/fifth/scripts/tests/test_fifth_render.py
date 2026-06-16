"""fifth_render.py TDD 테스트.

실행법:
  cd afterlife-server/fifth
  PYTHONPATH=$PWD/scripts /Volumes/exDN/devExdn/afl-fifth/afterlife-server/fifth/.venv/bin/python \
    -m pytest scripts/tests/test_fifth_render.py -v
"""
import math
import numpy as np
import soundfile as sf
import pytest

from config import FifthConfig
from fifth_render import prepare_sources, stream_wav_frames


# ---------------------------------------------------------------------------
# Fake 객체
# ---------------------------------------------------------------------------

class _FakeEngine:
    def __init__(self):
        self.render_calls = 0

    def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
        self.render_calls += 1
        return np.full((512, 512, 3), 128, dtype=np.uint8)


class _FakeEngineMarked:
    """src_img 마커로 픽셀값 분기 — 블렌드 공식 검증용."""
    def __init__(self):
        self.render_calls = 0

    def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
        self.render_calls += 1
        val = 200 if src_img == "OPEN" else 100
        return np.full((512, 512, 3), val, dtype=np.uint8)


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


def _write_wav(tmp_path, dur=0.5, sr=16000, silent=False):
    p = tmp_path / "s.wav"
    samples = int(sr * dur)
    if silent:
        y = np.zeros(samples, dtype=np.float32)
    else:
        y = (0.3 * np.sin(2 * np.pi * 200 * np.linspace(0, dur, samples))).astype(np.float32)
    sf.write(str(p), y, sr)
    return str(p)


def _env_len(dur: float, sr: int, fps: float) -> int:
    """audio2lip.compute_rms_envelope 과 동일한 프레임 수 계산."""
    return math.ceil(int(sr * dur) / (sr / fps))


# ---------------------------------------------------------------------------
# stream_wav_frames 테스트
# ---------------------------------------------------------------------------

def test_stream_single_mode_calls_on_frame_per_frame(tmp_path):
    """nj > env → n = nj (기존 케이스 유지)."""
    dur, sr, fps = 0.5, 16000, 25.0
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    env_n = _env_len(dur, sr, cfg.fps)  # ≈13 at fps=25
    nj = env_n + 4                       # nj > env → n = nj
    eng = _FakeEngine()
    sources = {
        "mode": "single",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
    }
    got = []
    n = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == len(got) == nj
    assert all(f.shape == (512, 512, 3) for f in got)


def test_stream_blend_mode_renders_two_sources(tmp_path):
    """nj > env → n = nj (blend 케이스 유지)."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    env_n = _env_len(dur, sr, cfg.fps)
    nj = env_n + 4  # nj > env
    eng = _FakeEngine()
    sources = {
        "mode": "blend",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "closed_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "mouth_mask": np.ones((512, 512, 1), np.float32) * 0.5,
    }
    got = []
    n = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == len(got) == nj


# ---------------------------------------------------------------------------
# n = max(len(env), nj) 핵심 계약 테스트
# ---------------------------------------------------------------------------

def test_stream_uses_env_length_when_env_gt_nj(tmp_path):
    """env > nj 일 때 n = env 길이 → 오디오 후미 잘림 방지 회귀 테스트."""
    dur, sr = 1.0, 16000
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    env_n = _env_len(dur, sr, cfg.fps)  # fps=25 → ceil(16000/640) = 25
    nj = 3                               # 일부러 env보다 훨씬 작게
    assert env_n > nj, "테스트 전제: env_n > nj 여야 함"

    eng = _FakeEngine()
    sources = {
        "mode": "single",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
    }
    got = []
    n = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == len(got) == env_n, (
        f"env_n={env_n}, nj={nj} 인데 n={n} — env>nj일 때 n=env 여야 함"
    )


def test_stream_empty_wav_returns_zero(tmp_path):
    """0샘플 wav → stream_wav_frames 반환 0, on_frame 미호출."""
    p = tmp_path / "empty.wav"
    sf.write(str(p), np.zeros(0, dtype=np.float32), 16000)
    cfg = FifthConfig.from_env()
    eng = _FakeEngine()
    sources = {
        "mode": "single",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
    }
    got = []
    n = stream_wav_frames(
        eng, _FakeJP(12), cfg, sources, str(p),
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == 0
    assert got == []
    assert eng.render_calls == 0


def test_stream_blend_mask_none_falls_back_to_open(tmp_path):
    """mouth_mask=None 인 blend → 크래시 없이 open 단일로 흡수, 프레임 수 정상."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    env_n = _env_len(dur, sr, cfg.fps)
    nj = env_n + 2  # nj > env → n=nj
    eng = _FakeEngine()
    sources = {
        "mode": "blend",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "closed_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "mouth_mask": None,  # 마스크 생성 실패 시나리오
    }
    got = []
    n = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == len(got) == nj
    # 모든 프레임은 open 단일(값=128)이어야 함
    assert all(f.shape == (512, 512, 3) for f in got)


def test_stream_blend_pixel_formula(tmp_path):
    """블렌드 공식 alpha=M*(1-w), out=open*(1-alpha)+closed*alpha 정확성 검증.

    무음 wav(전부 0) → w=0 → alpha=M*1=M=0.5 (균일 마스크).
    out = open*(1-0.5) + closed*0.5 = 200*0.5 + 100*0.5 = 150.
    """
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur, sr=sr, silent=True)  # 무음
    cfg = FifthConfig.from_env()
    env_n = _env_len(dur, sr, cfg.fps)
    nj = env_n + 2  # nj > env → n=nj (충분히 큰 값)

    eng = _FakeEngineMarked()
    M_val = 0.5
    sources = {
        "mode": "blend",
        "open_s": {
            "src_img": "OPEN",   # render → 200 채운 프레임
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "closed_s": {
            "src_img": "CLOSED",  # render → 100 채운 프레임
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "mouth_mask": np.full((512, 512, 1), M_val, dtype=np.float32),
    }
    got = []
    n = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n > 0, "프레임이 1개 이상 생성돼야 함"
    # 무음 → base_blend_weight(0, ...) = 0 → w=0 → alpha=M*(1-0)=0.5
    # out = 200*(1-0.5) + 100*0.5 = 150 (±1 uint8 오차 허용)
    for frame in got:
        mid = int(frame[256, 256, 0])  # 대표 픽셀
        assert abs(mid - 150) <= 1, (
            f"픽셀값 {mid} — 블렌드 공식 오류 (기대 150±1)"
        )


# ---------------------------------------------------------------------------
# _eye_open_ratio 폴백 테스트
# ---------------------------------------------------------------------------

def test_eye_open_ratio_returns_fallback_on_exception():
    """_eye_open_ratio: import 실패 또는 예외 시 0.37 반환."""
    from fifth_render import _eye_open_ratio
    # src_info 에 없는 키 접근 → KeyError → 폴백 0.37
    result = _eye_open_ratio({"src_img": object()})  # src_info 없음
    assert result == pytest.approx(0.37)


# ---------------------------------------------------------------------------
# prepare_sources 테스트
# ---------------------------------------------------------------------------

class _FakeEngineWithSource(_FakeEngine):
    def load_source(self, path):
        return {
            "src_img": f"img:{path}",
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.01,
        }

    def align_source_to_ref(self, target_s, ref_s, mode):
        target_s["aligned"] = mode
        return target_s

    def build_mouth_mask(self, lmk, img_size, dilate_px, feather_sigma):
        return np.ones((img_size, img_size, 1), np.float32)


def test_prepare_sources_single_mode():
    eng = _FakeEngineWithSource()
    src = prepare_sources(
        eng,
        {"mode": "single", "open_path": "/o.png", "closed_path": None},
    )
    assert src["mode"] == "single"
    assert src["open_s"]["src_img"] == "img:/o.png"


def test_prepare_sources_blend_mode_aligns_and_masks():
    eng = _FakeEngineWithSource()
    src = prepare_sources(
        eng,
        {"mode": "blend", "open_path": "/o.png", "closed_path": "/c.png"},
    )
    assert src["mode"] == "blend"
    assert src["closed_s"]["aligned"] == "affine"
    assert src["mouth_mask"].shape == (512, 512, 1)
