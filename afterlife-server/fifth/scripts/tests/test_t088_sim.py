"""t088_continuation_sim.py 순수 함수 단위 테스트.

HTTP/GPU/ffmpeg 의존 함수(_post_render_chunk, encode_mp4, run_sim)는
가비아 컨테이너에서만 동작하므로 테스트 제외.
순수 함수 4개만 로컬 검증:
  - make_silence_wav
  - parse_pattern
  - compute_chunk_timestamps
  - build_audio_track_array

실행법:
  cd /Volumes/exDN/devExdn/afl-fifth-continuation/afterlife-server/fifth
  PYTHONPATH=$PWD/scripts /Volumes/exDN/devExdn/afl-fifth/afterlife-server/fifth/.venv/bin/python \\
    -m pytest scripts/tests/test_t088_sim.py -v
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

from t088_continuation_sim import (
    build_audio_track_array,
    compute_chunk_timestamps,
    make_silence_wav,
    parse_pattern,
)


# ===========================================================================
# make_silence_wav
# ===========================================================================

class TestMakeSilenceWav:
    def test_creates_file(self, tmp_path: Path) -> None:
        """지정 경로에 wav 파일 생성."""
        out = str(tmp_path / "silence.wav")
        result = make_silence_wav(out, duration_sec=1.0)
        assert result == out
        assert Path(out).exists()

    def test_returns_out_path(self, tmp_path: Path) -> None:
        """반환값 = out_path."""
        out = str(tmp_path / "s.wav")
        assert make_silence_wav(out, 0.5) == out

    def test_default_sr_16000(self, tmp_path: Path) -> None:
        """기본 sr=16000, 1초 → 16000 샘플."""
        out = str(tmp_path / "s.wav")
        make_silence_wav(out, duration_sec=1.0)
        y, sr = sf.read(out, dtype="float32")
        assert sr == 16000
        assert abs(len(y) - 16000) <= 1, f"len={len(y)}"

    def test_all_zero_samples(self, tmp_path: Path) -> None:
        """wav 내용이 전부 0 (무음)."""
        out = str(tmp_path / "s.wav")
        make_silence_wav(out, duration_sec=0.5)
        y, _ = sf.read(out, dtype="float32")
        assert np.allclose(y, 0.0), "무음 wav에 비零 샘플"

    def test_custom_sr(self, tmp_path: Path) -> None:
        """sr=8000, 0.5초 → 4000 샘플."""
        out = str(tmp_path / "s8k.wav")
        make_silence_wav(out, duration_sec=0.5, sr=8000)
        y, sr = sf.read(out)
        assert sr == 8000
        assert abs(len(y) - 4000) <= 1

    def test_zero_duration(self, tmp_path: Path) -> None:
        """duration_sec=0 → 0 샘플 wav (유효한 파일)."""
        out = str(tmp_path / "zero.wav")
        make_silence_wav(out, duration_sec=0.0)
        assert Path(out).exists()
        y, _ = sf.read(out, dtype="float32")
        assert len(y) == 0

    def test_two_second(self, tmp_path: Path) -> None:
        """2초 → 32000 샘플."""
        out = str(tmp_path / "two.wav")
        make_silence_wav(out, duration_sec=2.0)
        y, sr = sf.read(out)
        assert sr == 16000
        assert abs(len(y) - 32000) <= 1


# ===========================================================================
# parse_pattern
# ===========================================================================

class TestParsePattern:
    def test_basic_four_chunks(self) -> None:
        """기본 4-청크 패턴: silence,speech,silence,speech."""
        chunks = parse_pattern("silence,speech,silence,speech", "/a.wav", "/s.wav")
        assert len(chunks) == 4
        assert chunks[0] == {"type": "silence", "wav": "/s.wav"}
        assert chunks[1] == {"type": "speech",  "wav": "/a.wav"}
        assert chunks[2] == {"type": "silence", "wav": "/s.wav"}
        assert chunks[3] == {"type": "speech",  "wav": "/a.wav"}

    def test_single_silence(self) -> None:
        """단일 silence 패턴."""
        chunks = parse_pattern("silence", "/a.wav", "/s.wav")
        assert chunks == [{"type": "silence", "wav": "/s.wav"}]

    def test_single_speech(self) -> None:
        """단일 speech 패턴."""
        chunks = parse_pattern("speech", "/a.wav", "/s.wav")
        assert chunks == [{"type": "speech", "wav": "/a.wav"}]

    def test_whitespace_stripped(self) -> None:
        """공백 포함 패턴 → 정상 파싱."""
        chunks = parse_pattern(" silence , speech ", "/a.wav", "/s.wav")
        assert len(chunks) == 2
        assert chunks[0]["type"] == "silence"
        assert chunks[1]["type"] == "speech"

    def test_case_insensitive(self) -> None:
        """대문자 패턴 → 소문자 처리."""
        chunks = parse_pattern("SILENCE,SPEECH", "/a.wav", "/s.wav")
        assert chunks[0]["type"] == "silence"
        assert chunks[1]["type"] == "speech"

    def test_invalid_token_raises(self) -> None:
        """알 수 없는 토큰 → ValueError."""
        with pytest.raises(ValueError, match="silence"):
            parse_pattern("silence,UNKNOWN,speech", "/a.wav", "/s.wav")

    def test_invalid_token_message_contains_token(self) -> None:
        """에러 메시지에 문제 토큰 포함."""
        with pytest.raises(ValueError, match="badtoken"):
            parse_pattern("badtoken", "/a.wav", "/s.wav")

    def test_answer_wav_assigned_to_speech(self) -> None:
        """speech 청크 wav = answer_wav."""
        chunks = parse_pattern("speech", "/answer.wav", "/silence.wav")
        assert chunks[0]["wav"] == "/answer.wav"

    def test_silence_wav_assigned_to_silence(self) -> None:
        """silence 청크 wav = silence_wav."""
        chunks = parse_pattern("silence", "/answer.wav", "/silence.wav")
        assert chunks[0]["wav"] == "/silence.wav"

    def test_speech_only_pattern(self) -> None:
        """speech,speech → 2개 모두 answer_wav."""
        chunks = parse_pattern("speech,speech", "/a.wav", "/s.wav")
        assert all(c["wav"] == "/a.wav" for c in chunks)

    def test_silence_only_pattern(self) -> None:
        """silence,silence → 2개 모두 silence_wav."""
        chunks = parse_pattern("silence,silence", "/a.wav", "/s.wav")
        assert all(c["wav"] == "/s.wav" for c in chunks)


# ===========================================================================
# compute_chunk_timestamps
# ===========================================================================

class TestComputeChunkTimestamps:
    def test_empty_returns_empty(self) -> None:
        """빈 frame_counts → []."""
        assert compute_chunk_timestamps([]) == []

    def test_single_chunk_25fps(self) -> None:
        """25프레임 @ 25fps → 0.0s ~ 1.0s."""
        ts = compute_chunk_timestamps([25], fps=25.0)
        assert len(ts) == 1
        assert ts[0]["chunk"] == 0
        assert abs(ts[0]["start_sec"] - 0.0) < 1e-3
        assert abs(ts[0]["end_sec"]   - 1.0) < 1e-3
        assert ts[0]["n_frames"] == 25

    def test_two_chunks_cumulative(self) -> None:
        """[25, 50] @ 25fps → 0~1s, 1~3s."""
        ts = compute_chunk_timestamps([25, 50], fps=25.0)
        assert len(ts) == 2
        assert abs(ts[0]["start_sec"] - 0.0) < 1e-3
        assert abs(ts[0]["end_sec"]   - 1.0) < 1e-3
        assert abs(ts[1]["start_sec"] - 1.0) < 1e-3
        assert abs(ts[1]["end_sec"]   - 3.0) < 1e-3

    def test_four_chunks_monotonic(self) -> None:
        """4개 청크 타임스탬프가 단조 증가."""
        ts = compute_chunk_timestamps([10, 20, 30, 40], fps=25.0)
        starts = [t["start_sec"] for t in ts]
        assert starts == sorted(starts), "start_sec 단조 증가 위반"
        ends = [t["end_sec"] for t in ts]
        assert ends == sorted(ends), "end_sec 단조 증가 위반"

    def test_chunk_index_correct(self) -> None:
        """chunk 필드가 0-based 순번."""
        ts = compute_chunk_timestamps([5, 5, 5])
        assert [t["chunk"] for t in ts] == [0, 1, 2]

    def test_n_frames_preserved(self) -> None:
        """n_frames 필드 = 입력값 보존."""
        frame_counts = [7, 13, 22]
        ts = compute_chunk_timestamps(frame_counts)
        assert [t["n_frames"] for t in ts] == frame_counts

    def test_zero_frames_chunk(self) -> None:
        """n_frames=0 청크 → start==end."""
        ts = compute_chunk_timestamps([0], fps=25.0)
        assert ts[0]["start_sec"] == ts[0]["end_sec"]

    def test_30fps(self) -> None:
        """30fps → 30프레임 = 1.0초."""
        ts = compute_chunk_timestamps([30], fps=30.0)
        assert abs(ts[0]["end_sec"] - 1.0) < 1e-3

    def test_start_sec_of_second_chunk_equals_end_sec_of_first(self) -> None:
        """청크 경계: chunk[n].end_sec == chunk[n+1].start_sec."""
        ts = compute_chunk_timestamps([12, 18, 25], fps=25.0)
        for i in range(len(ts) - 1):
            assert abs(ts[i]["end_sec"] - ts[i + 1]["start_sec"]) < 1e-6, (
                f"청크 {i} end={ts[i]['end_sec']} != 청크 {i+1} start={ts[i+1]['start_sec']}"
            )


# ===========================================================================
# build_audio_track_array
# ===========================================================================

class TestBuildAudioTrackArray:
    def _make_silence(self, tmp_path: Path, dur: float = 2.0, sr: int = 16000) -> str:
        p = str(tmp_path / f"silence_{dur}.wav")
        make_silence_wav(p, dur, sr)
        return p

    def _make_speech(
        self, tmp_path: Path, dur: float = 1.0, sr: int = 16000, amplitude: float = 0.5
    ) -> str:
        p = str(tmp_path / f"speech_{dur}.wav")
        n = int(dur * sr)
        sf.write(p, np.full(n, amplitude, dtype=np.float32), sr)
        return p

    def test_empty_chunks_returns_empty(self) -> None:
        """청크 없음 → 길이 0 배열."""
        arr = build_audio_track_array([], [], fps=25.0, sr=16000)
        assert len(arr) == 0

    def test_total_length_matches_frames(self, tmp_path: Path) -> None:
        """오디오 길이 = sum(n_frames / fps * sr)."""
        silence = self._make_silence(tmp_path, 2.0)
        speech  = self._make_speech(tmp_path, 1.0)
        chunks = [
            {"type": "silence", "wav": silence},
            {"type": "speech",  "wav": speech},
        ]
        frame_counts = [50, 25]  # 2초, 1초 @ 25fps
        fps, sr = 25.0, 16000
        arr = build_audio_track_array(chunks, frame_counts, fps=fps, sr=sr)
        expected = int(round(50 / fps * sr)) + int(round(25 / fps * sr))
        assert abs(len(arr) - expected) <= 2, f"길이 {len(arr)} != {expected}"

    def test_silence_chunk_is_all_zero(self, tmp_path: Path) -> None:
        """무음 청크 → 오디오 전부 0."""
        silence = self._make_silence(tmp_path, 1.0)
        chunks = [{"type": "silence", "wav": silence}]
        arr = build_audio_track_array(chunks, [25], fps=25.0, sr=16000)
        assert np.allclose(arr, 0.0), "무음 청크에 비零 샘플"

    def test_speech_chunk_not_zero(self, tmp_path: Path) -> None:
        """발화 청크 → 오디오가 0이 아님."""
        speech = self._make_speech(tmp_path, 1.0, amplitude=0.5)
        chunks = [{"type": "speech", "wav": speech}]
        arr = build_audio_track_array(chunks, [25], fps=25.0, sr=16000)
        assert np.any(arr != 0.0), "발화 청크가 전부 0"

    def test_clips_long_wav_to_frame_count(self, tmp_path: Path) -> None:
        """wav 가 타겟 길이보다 길면 자름."""
        long_wav = self._make_speech(tmp_path, 5.0)  # 5초 wav
        chunks = [{"type": "speech", "wav": long_wav}]
        frame_counts = [25]  # 1초분만 필요
        fps, sr = 25.0, 16000
        arr = build_audio_track_array(chunks, frame_counts, fps=fps, sr=sr)
        expected = int(round(25 / fps * sr))
        assert abs(len(arr) - expected) <= 2

    def test_pads_short_wav_to_frame_count(self, tmp_path: Path) -> None:
        """wav 가 타겟 길이보다 짧으면 zero-pad."""
        short_wav = self._make_speech(tmp_path, 0.2)  # 0.2초 wav
        chunks = [{"type": "speech", "wav": short_wav}]
        frame_counts = [50]  # 2초분 필요
        fps, sr = 25.0, 16000
        arr = build_audio_track_array(chunks, frame_counts, fps=fps, sr=sr)
        expected = int(round(50 / fps * sr))
        assert abs(len(arr) - expected) <= 2

    def test_zero_frame_count_produces_empty_segment(self, tmp_path: Path) -> None:
        """n_frames=0 청크 → 0 샘플 기여."""
        speech = self._make_speech(tmp_path, 1.0)
        chunks = [{"type": "speech", "wav": speech}]
        arr = build_audio_track_array(chunks, [0], fps=25.0, sr=16000)
        assert len(arr) == 0

    def test_stereo_wav_is_mixed_to_mono(self, tmp_path: Path) -> None:
        """스테레오 wav → 모노로 믹스."""
        p = str(tmp_path / "stereo.wav")
        sr = 16000
        data = np.ones((sr, 2), dtype=np.float32) * 0.3  # L=R=0.3
        sf.write(p, data, sr)
        chunks = [{"type": "speech", "wav": p}]
        arr = build_audio_track_array(chunks, [25], fps=25.0, sr=sr)
        # 모노로 믹스됐으면 1D
        assert arr.ndim == 1

    def test_multiple_chunks_concatenated(self, tmp_path: Path) -> None:
        """복수 청크가 순서대로 concat."""
        silence = self._make_silence(tmp_path, 2.0)
        speech  = self._make_speech(tmp_path, 1.0, amplitude=0.9)
        chunks = [
            {"type": "silence", "wav": silence},
            {"type": "speech",  "wav": speech},
            {"type": "silence", "wav": silence},
        ]
        fps, sr = 25.0, 16000
        frame_counts = [50, 25, 50]
        arr = build_audio_track_array(chunks, frame_counts, fps=fps, sr=sr)
        # 총 길이 = 125프레임분
        expected = int(round(125 / fps * sr))
        assert abs(len(arr) - expected) <= 3

        # 가운데 구간(발화)은 비-0, 앞뒤(무음)는 거의 0
        n0 = int(round(50 / fps * sr))  # silence 구간 샘플 수
        n1 = int(round(25 / fps * sr))  # speech 구간
        assert np.allclose(arr[:n0], 0.0), "앞 무음 구간에 비-0 샘플"
        # 발화 구간: amplitude 0.9이 있어야 함 (self확인용)
        assert np.any(arr[n0:n0 + n1] != 0.0), "발화 구간이 전부 0"
