"""fifth_render.py TDD 테스트.

실행법:
  cd afterlife-server/fifth
  PYTHONPATH=$PWD/scripts /Volumes/exDN/devExdn/afl-fifth/afterlife-server/fifth/.venv/bin/python \
    -m pytest scripts/tests/test_fifth_render.py -v
"""
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
    y = (0.3 * np.sin(2 * np.pi * 200 * np.linspace(0, dur, int(sr * dur)))).astype(np.float32)
    sf.write(str(p), y, sr)
    return str(p)


# ---------------------------------------------------------------------------
# stream_wav_frames 테스트
# ---------------------------------------------------------------------------

def test_stream_single_mode_calls_on_frame_per_frame(tmp_path):
    wav = _write_wav(tmp_path)
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
        eng, _FakeJP(12), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == len(got) == 12
    assert all(f.shape == (512, 512, 3) for f in got)


def test_stream_blend_mode_renders_two_sources(tmp_path):
    wav = _write_wav(tmp_path)
    cfg = FifthConfig.from_env()
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
        eng, _FakeJP(8), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == len(got) == 8


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
