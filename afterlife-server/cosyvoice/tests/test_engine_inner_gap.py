"""문장 안 정적 가드 (AFL-1059).

CosyVoice 가 드물게 단어 중간에서 끊고 쉬었다가 잇는다("말 이어가." → "마…(0.72초)…리오가",
2026-10-27 11:32 실통화 preset-9519). 길이(폭주) 검사는 통과해서 그대로 나갔고, 입 모양도
그 소리를 따라 멈췄다 움직여 "영상이 멈춘다" 로 보였다. 문장 안 정적이 상한을 넘으면
폭주처럼 다시 합성한다.
"""
import io
import sys
import threading
import types
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import config  # noqa: E402
import cosy_engine  # noqa: E402

SR = 24000


def _tone(sec):
    t = np.arange(int(SR * sec)) / SR
    return (0.3 * np.sin(2 * np.pi * 220 * t)).astype(np.float32)


def _gap(sec):
    return np.zeros(int(SR * sec), dtype=np.float32)


GAPPY = np.concatenate([_tone(0.3), _gap(0.72), _tone(0.6)])
CLEAN = np.concatenate([_tone(0.3), _gap(0.1), _tone(0.6)])
GAPPY2 = np.concatenate([_tone(0.3), _gap(0.6), _tone(0.6)])


class _T:
    def __init__(self, a):
        self.a = a

    def squeeze(self, _):
        return self

    def cpu(self):
        return self

    def numpy(self):
        return self.a


def _engine(monkeypatch, outputs):
    fake_torch = types.SimpleNamespace(
        manual_seed=lambda s: None,
        cuda=types.SimpleNamespace(is_available=lambda: False),
        concat=lambda chunks, dim=1: chunks[0],
    )
    monkeypatch.setitem(sys.modules, "torch", fake_torch)
    eng = cosy_engine.CosyEngine.__new__(cosy_engine.CosyEngine)
    eng.sr = SR
    eng._synth_lock = threading.Lock()
    eng._ensure_prompt = lambda *a: None
    calls = []

    def infer(*a, **k):
        calls.append(1)
        return iter([{"tts_speech": _T(outputs[min(len(calls) - 1, len(outputs) - 1)])}])
    eng.model = types.SimpleNamespace(inference_zero_shot=infer)
    monkeypatch.setattr(config, "SAMPLING_TOP_K", 0)
    monkeypatch.setattr(config, "LEAD_SILENCE_MAX_MS", 0)
    monkeypatch.setattr(config, "RAMBLE_BASE_SEC", 0.9)
    monkeypatch.setattr(config, "RAMBLE_PER_CHAR_SEC", 0.28)
    monkeypatch.setattr(config, "RAMBLE_RETRIES", 2)
    return eng, calls


def _dur(wav):
    a, sr = sf.read(io.BytesIO(wav))
    return len(a) / sr


def test_문장안_정적이_상한을_넘으면_다시_합성(monkeypatch):
    eng, calls = _engine(monkeypatch, [GAPPY, CLEAN])
    monkeypatch.setattr(config, "INNER_GAP_MAX_SEC", 0.5)
    out = eng.synth("말 이어가.", "c", "v.wav", "t")
    assert len(calls) == 2
    assert abs(_dur(out) - len(CLEAN) / SR) < 0.01


def test_상한_0이면_끔(monkeypatch):
    eng, calls = _engine(monkeypatch, [GAPPY, CLEAN])
    monkeypatch.setattr(config, "INNER_GAP_MAX_SEC", 0.0)
    out = eng.synth("말 이어가.", "c", "v.wav", "t")
    assert len(calls) == 1
    assert abs(_dur(out) - len(GAPPY) / SR) < 0.01


def test_전부_넘으면_정적이_가장_짧은_것(monkeypatch):
    eng, calls = _engine(monkeypatch, [GAPPY, GAPPY2, GAPPY])
    monkeypatch.setattr(config, "INNER_GAP_MAX_SEC", 0.5)
    out = eng.synth("말 이어가.", "c", "v.wav", "t")
    assert len(calls) == 3
    assert abs(_dur(out) - len(GAPPY2) / SR) < 0.01


def test_문장_중간_문장부호가_있으면_더_긴_쉼을_허용(monkeypatch):
    # 쉼표 자리의 쉼은 자연스럽다 — 프리셋도 0.6~0.75초 쉰다(2026-10-27 스캔 352건).
    eng, calls = _engine(monkeypatch, [GAPPY, CLEAN])
    monkeypatch.setattr(config, "INNER_GAP_MAX_SEC", 0.7)
    monkeypatch.setattr(config, "INNER_GAP_PUNCT_MAX_SEC", 1.0)
    eng.synth("아니, 나는 박하나야.", "c", "v.wav", "t")
    assert len(calls) == 1


def test_기본값은_0점7_과_1점0():
    assert config.INNER_GAP_MAX_SEC == 0.7
    assert config.INNER_GAP_PUNCT_MAX_SEC == 1.0
    assert cosy_engine.inner_gap_limit("말 이어가.") == 0.7
    assert cosy_engine.inner_gap_limit("아니, 나는 박하나야.") == 1.0
    assert cosy_engine.inner_gap_limit("그래. 알겠어.") == 1.0
