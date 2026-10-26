"""견본 후보 시험 합성·점수 (AFL-1059).

폭주는 대본보다 개별 견본에 좌우된다(2026-10-26 측정: 같은 대본도 목소리마다 0~8회).
후보 견본마다 짧은 질문을 1차 생성 그대로 받아 늘어진 만큼을 점수로 매기고 가장 낮은 것을 쓴다.
"""
import io
import json
import sys
import urllib.error
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import config  # noqa: E402
import make_prompt_ref as mpr  # noqa: E402

BASE, PER = config.RAMBLE_BASE_SEC, config.RAMBLE_PER_CHAR_SEC

def _wav_bytes(sec: float, sr: int = 24000) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, np.zeros(int(sr * sec), dtype=np.float32), sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()

def test_시험문장_고정():
    assert mpr.PROBE_SENTENCES == [
        "너는 뭐 먹었어?", "뭐 하고 있었어?", "무슨 일 있어?", "돌아왔네.", "잘 들려?", "밥은 먹었어?",
    ]

def test_점수_정상길이는_0():
    assert mpr.probe_score([1.0], ["너는 뭐 먹었어?"]) == 0.0

def test_점수_늘어진만큼():
    s = "너는 뭐 먹었어?"
    assert mpr.probe_score([7.2], [s]) == pytest.approx(7.2 - (BASE + len(s) * PER))

def test_고르기_최저점():
    assert mpr.pick_best([3.0, 0.5, 0.5]) == 1

def test_고르기_동점은_앞():
    assert mpr.pick_best([0.0, 0.0]) == 0

def test_고르기_None_건너뜀():
    assert mpr.pick_best([None, 2.0]) == 1

def test_고르기_전부None은_0():
    assert mpr.pick_best([None, None]) == 0

def test_시험합성_오류면_None(monkeypatch):
    def boom(req, timeout=None):
        raise urllib.error.HTTPError(req.full_url, 503, "down", {}, None)
    monkeypatch.setattr(mpr.urllib.request, "urlopen", boom)
    assert mpr.probe_durations("zz-probe-x-0", mpr.PROBE_SENTENCES, "http://t") is None

def test_시험합성_요청본문(monkeypatch):
    seen = []

    class _Resp:
        def __init__(self, body):
            self._b = body

        def read(self):
            return self._b

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    def fake(req, timeout=None):
        seen.append((req.full_url, json.loads(req.data.decode())))
        return _Resp(_wav_bytes(1.0))

    monkeypatch.setattr(mpr.urllib.request, "urlopen", fake)
    out = mpr.probe_durations("zz-probe-x-0", mpr.PROBE_SENTENCES, "http://t")
    assert out == pytest.approx([1.0] * 6)
    assert seen[0] == ("http://t/tts/kr",
                       {"text": "너는 뭐 먹었어?", "clone_id": "zz-probe-x-0", "ramble_retries": 0})
