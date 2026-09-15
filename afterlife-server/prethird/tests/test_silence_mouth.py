"""무음 구간 입 다물기 — 말하기 가중치 판정."""
import sys
import pathlib

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

import silence_mouth as sm  # noqa: E402


def _amp(pattern: str) -> np.ndarray:
    """'s' = 말(진폭 0.3), '.' = 무음(0.0)"""
    return np.array([0.3 if c == "s" else 0.0 for c in pattern], dtype=np.float32)


def test_말_끝난_뒤_꼬리_무음은_0():
    al = sm.speech_alpha(_amp("ssssssssss" + "." * 10))
    # 말 시작은 START(2) 프레임 연속 뒤에 확정되므로 앞 2프레임은 0.
    assert al[3:10].min() > 0.5
    assert al[-5:].max() == 0.0


def test_음소_사이_짧은_무음은_말로_유지():
    al = sm.speech_alpha(_amp("ssssss" + "..." + "ssssss"))
    assert al[6:9].min() > 0.5


def test_긴_문장_사이_무음은_입_다묾():
    al = sm.speech_alpha(_amp("ssssss" + "." * 12 + "ssssss"))
    assert al[10:16].max() == 0.0


def test_꺼져_있으면_원본_그대로(monkeypatch):
    monkeypatch.delenv("PRETHIRD_SILENT_MOUTH", raising=False)
    sentinel = object()
    assert sm.apply(sentinel, "/nonexistent.wav", 25) is sentinel


def test_프레임_진폭():
    y = np.concatenate([np.full(640, 0.5), np.zeros(640)]).astype(np.float32)
    amp = sm.frame_amplitudes(y, 16000, 25, 2)
    assert amp[0] == 0.5 and amp[1] == 0.0
