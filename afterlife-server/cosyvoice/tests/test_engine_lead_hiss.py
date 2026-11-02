"""말 앞 잡음 가드 (AFL-1072 실통화).

2026-11-01 21:07 실통화 9194(쿄카 목소리) + 화남 은행 견본: "아니, 나는 대머리 아니야." 가 4.9초로 나왔고
앞 3초가 작고 거친 잡음이었다. 앞 무음 자르기(-40dB)에도, 폭주 상한(5.1초)에도 안 걸렸다.
잡음이 상한보다 길면 다시 합성하고, 끝까지 남으면 첫 말소리 앞에서 잘라낸다.
"""
import io
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import config  # noqa: E402
from lead_trim import lead_hiss  # noqa: E402
from test_engine_inner_gap import SR, _engine, _tone  # noqa: E402


def _hiss(sec, amp=0.012, seed=0):
    return (amp * np.random.default_rng(seed).standard_normal(int(SR * sec))).astype(np.float32)


def _quiet_voice(sec, amp=0.03):
    # 9075 처럼 원래 작게 말하는 목소리 — 조용하지만 영점교차가 적다(잡음 아님).
    t = np.arange(int(SR * sec)) / SR
    return (amp * np.sin(2 * np.pi * 150 * t)).astype(np.float32)


HISSY = np.concatenate([_hiss(2.5), _tone(1.2)])
CLEAN = _tone(1.2)


def _dur(wav):
    a, sr = sf.read(io.BytesIO(wav))
    return len(a) / sr


def test_잡음과_작은_말소리를_가른다():
    assert lead_hiss(HISSY, SR)[0] >= 2.0
    assert lead_hiss(CLEAN, SR)[0] == 0.0
    assert lead_hiss(np.concatenate([_quiet_voice(1.0), _tone(1.0)]), SR)[0] == 0.0
    # 전체가 작은 목소리여도(최대 크기 대비 말소리) 잡음으로 보지 않는다.
    assert lead_hiss(_quiet_voice(2.0), SR)[0] == 0.0
    assert lead_hiss(np.zeros(0, dtype=np.float32), SR) == (0.0, 0)


def test_말_앞_잡음이면_다시_합성(monkeypatch):
    eng, calls = _engine(monkeypatch, [HISSY, CLEAN])
    monkeypatch.setattr(config, "INNER_GAP_MAX_SEC", 0.0)
    monkeypatch.setattr(config, "LEAD_HISS_MAX_SEC", 0.5)
    out = eng.synth("아니, 나는 대머리 아니야.", "c", "v.wav", "t")
    assert len(calls) == 2
    assert abs(_dur(out) - len(CLEAN) / SR) < 0.01


def test_끝까지_잡음이면_첫_말소리_앞에서_잘라낸다(monkeypatch):
    eng, calls = _engine(monkeypatch, [HISSY, HISSY, HISSY])
    monkeypatch.setattr(config, "INNER_GAP_MAX_SEC", 0.0)
    monkeypatch.setattr(config, "LEAD_HISS_MAX_SEC", 0.5)
    out = eng.synth("아니, 나는 대머리 아니야.", "c", "v.wav", "t")
    assert len(calls) == 3
    assert abs(_dur(out) - (1.2 + 0.1)) < 0.11  # 말소리 + 앞 0.1초


def test_상한_0이면_끔(monkeypatch):
    eng, calls = _engine(monkeypatch, [HISSY, CLEAN])
    monkeypatch.setattr(config, "INNER_GAP_MAX_SEC", 0.0)
    monkeypatch.setattr(config, "LEAD_HISS_MAX_SEC", 0.0)
    out = eng.synth("아니, 나는 대머리 아니야.", "c", "v.wav", "t")
    assert len(calls) == 1
    assert abs(_dur(out) - len(HISSY) / SR) < 0.01


def test_기본값은_0점5():
    assert config.LEAD_HISS_MAX_SEC == 0.5
