import os
import json
import numpy as np
import soundfile as sf
import pytest

from t088_build_sequence import build_sequence

SR = 16000


def _make_tone(path, seconds, sr=SR, freq=220.0):
    t = np.linspace(0, seconds, int(seconds * sr), endpoint=False)
    y = (0.2 * np.sin(2 * np.pi * freq * t)).astype(np.float32)
    sf.write(path, y, sr, subtype="PCM_16")


def test_build_sequence_silence_speech_silence(tmp_path):
    speech = str(tmp_path / "speech.wav")
    _make_tone(speech, 0.5)  # 0.5s 발화 대용
    out_wav = str(tmp_path / "seq.wav")
    out_meta = str(tmp_path / "seq.meta.json")

    res = build_sequence(
        speech_wavs=[speech],
        pattern=["silence", "speech", "silence"],
        silence_sec=1.0,
        out_wav=out_wav,
        out_meta=out_meta,
        tmpdir=str(tmp_path),
    )

    # 총 길이 = 1.0 + 0.5 + 1.0 = 2.5s (±1프레임 허용)
    assert abs(res["duration"] - 2.5) < 0.05
    # 출력 wav 실측
    y, sr = sf.read(out_wav, dtype="float32")
    assert sr == SR
    assert y.ndim == 1  # mono
    assert abs(len(y) / sr - 2.5) < 0.05
    # 첫 1초는 무음(거의 0)
    assert np.max(np.abs(y[: int(0.9 * SR)])) < 1e-3
    # 발화 구간(1.0~1.5s)은 신호 존재
    seg = y[int(1.05 * SR) : int(1.45 * SR)]
    assert np.max(np.abs(seg)) > 0.05

    # 메타 구간 검증
    meta = json.loads(open(out_meta).read())
    kinds = [s["kind"] for s in meta["segments"]]
    assert kinds == ["silence", "speech", "silence"]
    assert abs(meta["segments"][1]["start"] - 1.0) < 0.05
    assert abs(meta["segments"][1]["end"] - 1.5) < 0.05


def test_speech_index_cycles_when_fewer_wavs_than_speech_slots(tmp_path):
    speech = str(tmp_path / "s.wav")
    _make_tone(speech, 0.3)
    out_wav = str(tmp_path / "seq.wav")
    out_meta = str(tmp_path / "seq.meta.json")
    res = build_sequence(
        speech_wavs=[speech],
        pattern=["speech", "silence", "speech"],
        silence_sec=0.5,
        out_wav=out_wav,
        out_meta=out_meta,
        tmpdir=str(tmp_path),
    )
    speech_segs = [s for s in res["segments"] if s["kind"] == "speech"]
    assert len(speech_segs) == 2
    assert all(s["src"] == speech for s in speech_segs)
