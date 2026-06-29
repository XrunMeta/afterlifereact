import os
import json
import subprocess
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


# ── 게이트 보강 테스트 (el R-1 / sion Critical+Important) ───────────────────


def test_output_pcm16_mono_contract(tmp_path):
    """출력 wav가 PCM_16 subtype, 1채널인지 계약 검증."""
    speech = str(tmp_path / "speech.wav")
    _make_tone(speech, 0.3)
    out_wav = str(tmp_path / "seq.wav")
    out_meta = str(tmp_path / "seq.meta.json")

    build_sequence(
        speech_wavs=[speech],
        pattern=["speech"],
        silence_sec=0.0,
        out_wav=out_wav,
        out_meta=out_meta,
        tmpdir=str(tmp_path),
    )

    info = sf.info(out_wav)
    assert info.subtype == "PCM_16", f"subtype={info.subtype}"
    assert info.channels == 1, f"channels={info.channels}"


def test_empty_speech_wavs_raises(tmp_path):
    """speech_wavs=[] 호출 → ValueError."""
    with pytest.raises(ValueError):
        build_sequence(
            speech_wavs=[],
            pattern=["speech"],
            silence_sec=1.0,
            out_wav=str(tmp_path / "out.wav"),
            out_meta=str(tmp_path / "out.meta.json"),
            tmpdir=str(tmp_path),
        )


def test_empty_pattern_produces_zero_duration(tmp_path):
    """pattern=[] → duration==0.0, segments==[], 0-length wav 유효 기록."""
    speech = str(tmp_path / "speech.wav")
    _make_tone(speech, 0.3)
    out_wav = str(tmp_path / "seq.wav")
    out_meta = str(tmp_path / "seq.meta.json")

    res = build_sequence(
        speech_wavs=[speech],
        pattern=[],
        silence_sec=1.0,
        out_wav=out_wav,
        out_meta=out_meta,
        tmpdir=str(tmp_path),
    )

    assert res["duration"] == 0.0
    assert res["segments"] == []
    y, sr = sf.read(out_wav, dtype="float32")
    assert len(y) == 0, f"expected 0 samples, got {len(y)}"


def test_unknown_pattern_kind_raises(tmp_path):
    """pattern=['typo'] → ValueError 'unknown pattern kind'."""
    speech = str(tmp_path / "speech.wav")
    _make_tone(speech, 0.2)

    with pytest.raises(ValueError, match="unknown pattern kind"):
        build_sequence(
            speech_wavs=[speech],
            pattern=["typo"],
            silence_sec=1.0,
            out_wav=str(tmp_path / "out.wav"),
            out_meta=str(tmp_path / "out.meta.json"),
            tmpdir=str(tmp_path),
        )


def test_resample_44100_to_16k_accuracy(tmp_path):
    """44100Hz 0.5s wav → build_sequence → 메타 speech 길이 ≈0.5s, 출력 SR==16000."""
    speech = str(tmp_path / "tone44k.wav")
    sr_src = 44100
    dur_src = 0.5
    t = np.linspace(0, dur_src, int(dur_src * sr_src), endpoint=False)
    y = (0.2 * np.sin(2 * np.pi * 440.0 * t)).astype(np.float32)
    sf.write(speech, y, sr_src, subtype="PCM_16")

    out_wav = str(tmp_path / "seq.wav")
    out_meta = str(tmp_path / "seq.meta.json")

    res = build_sequence(
        speech_wavs=[speech],
        pattern=["speech"],
        silence_sec=0.0,
        out_wav=out_wav,
        out_meta=out_meta,
        tmpdir=str(tmp_path),
    )

    seg = next(s for s in res["segments"] if s["kind"] == "speech")
    seg_dur = seg["end"] - seg["start"]
    assert abs(seg_dur - dur_src) < (4 / SR), f"seg_dur={seg_dur}"  # ±4프레임

    out_y, out_sr = sf.read(out_wav, dtype="float32")
    assert out_sr == SR, f"out_sr={out_sr}"
    # 샘플수 ≈ 0.5 * 16000 = 8000 (±4프레임)
    assert abs(len(out_y) - int(dur_src * SR)) <= 4, f"samples={len(out_y)}"


def test_ffmpeg_failure_propagates(tmp_path):
    """존재하지 않는 speech 경로 → CalledProcessError 전파."""
    with pytest.raises(subprocess.CalledProcessError):
        build_sequence(
            speech_wavs=[str(tmp_path / "nonexistent.wav")],
            pattern=["speech"],
            silence_sec=0.0,
            out_wav=str(tmp_path / "out.wav"),
            out_meta=str(tmp_path / "out.meta.json"),
            tmpdir=str(tmp_path),
        )
