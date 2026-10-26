"""문장 앞 무음 상한 — 견본에 머뭇거림이 있으면 CosyVoice 가 문장 앞에 0.2~1.2초 무음을 만든다
(2026-10-26 쿄카 새 견본 실측). 앞 무음을 상한까지만 남기고 잘라 첫 소리가 늦지 않게 한다."""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from lead_trim import cap_lead_silence  # noqa: E402

SR = 24000


def _tone(sec: float, amp: float = 0.3) -> np.ndarray:
    t = np.arange(int(SR * sec)) / SR
    return (amp * np.sin(2 * np.pi * 220 * t)).astype(np.float32)


def _quiet(sec: float, amp: float = 0.0) -> np.ndarray:
    rng = np.random.default_rng(0)
    return (amp * rng.standard_normal(int(SR * sec))).astype(np.float32)


def test_긴_앞무음은_상한까지만_남긴다():
    audio = np.concatenate([_quiet(1.0), _tone(0.5)])
    out = cap_lead_silence(audio, SR, max_ms=300)
    assert abs(len(out) / SR - 0.8) < 0.02
    assert np.array_equal(out[-len(_tone(0.5)):], _tone(0.5))


def test_상한보다_짧은_앞무음은_그대로():
    audio = np.concatenate([_quiet(0.2), _tone(0.5)])
    assert np.array_equal(cap_lead_silence(audio, SR, max_ms=300), audio)


def test_작은_숨소리는_무음으로_본다():
    # -40dB 아래 숨소리(-46dB 안팎)는 앞 무음에 포함해 같이 줄인다.
    audio = np.concatenate([_quiet(0.8, amp=0.005), _tone(0.5)])
    out = cap_lead_silence(audio, SR, max_ms=300)
    assert abs(len(out) / SR - 0.8) < 0.02


def test_첫소리가_뚜렷하면_건드리지_않는다():
    audio = np.concatenate([_tone(0.1), _quiet(0.8), _tone(0.5)])
    assert np.array_equal(cap_lead_silence(audio, SR, max_ms=300), audio)


def test_0이면_끈다():
    audio = np.concatenate([_quiet(1.0), _tone(0.5)])
    assert np.array_equal(cap_lead_silence(audio, SR, max_ms=0), audio)


def test_전부_무음이면_그대로():
    audio = _quiet(0.5)
    assert np.array_equal(cap_lead_silence(audio, SR, max_ms=300), audio)
