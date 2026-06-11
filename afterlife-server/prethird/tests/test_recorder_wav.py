import io
import os
import sys
import wave

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from recorder import make_recorder


def _make_wav(n_frames: int, sr: int = 16000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(b"\x00\x01" * n_frames)
    return buf.getvalue()


def test_finalize_concatenates_wav_chunks(tmp_path):
    rec = make_recorder(9051, "sX", root=str(tmp_path))
    turn = rec.begin_turn("say", "여보세요", seq=1)
    turn.append_token("응답")
    turn.append_wav(_make_wav(100))
    turn.append_wav(_make_wav(150))
    turn.finalize(se_present=True)
    clone_dir = tmp_path / "9051"
    wavs = [p for p in clone_dir.iterdir() if p.name.endswith("-answer.wav")]
    assert len(wavs) == 1
    with wave.open(str(wavs[0]), "rb") as w:
        assert w.getnchannels() == 1
        assert w.getframerate() == 16000
        assert w.getnframes() == 250  # 100 + 150 합본


def test_no_wav_when_no_chunks(tmp_path):
    # wav 청크 없으면 answer.wav 미생성(텍스트만)
    rec = make_recorder(9051, "sX", root=str(tmp_path))
    turn = rec.begin_turn("say", "hi", seq=1)
    turn.append_token("응답")
    turn.finalize(se_present=True)
    clone_dir = tmp_path / "9051"
    assert not any(p.name.endswith("-answer.wav") for p in clone_dir.iterdir())


def test_wav_survives_corrupt_chunk(tmp_path):
    # 깨진 청크가 섞여도 통화 차단 없이 finalize 반환(예외 흡수)
    rec = make_recorder(9051, "sX", root=str(tmp_path))
    turn = rec.begin_turn("say", "hi", seq=1)
    turn.append_token("응답")
    turn.append_wav(b"NOT_A_WAV")  # 깨진 청크
    turn.finalize(se_present=True)  # 예외 없이 반환해야 함


# ── MAJOR 5: 첫 청크 깨짐 fallback — 정상 청크로 wav 생성 ─────────────────────

def test_wav_first_chunk_corrupt_uses_next(tmp_path):
    rec = make_recorder(9051, "sX", root=str(tmp_path))
    turn = rec.begin_turn("say", "hi", seq=1)
    turn.append_token("응답")
    turn.append_wav(b"BROKEN")          # 첫 청크 깨짐
    turn.append_wav(_make_wav(120))     # 정상 청크
    turn.finalize(se_present=True)
    clone_dir = tmp_path / "9051"
    wavs = [p for p in clone_dir.iterdir() if p.name.endswith("-answer.wav")]
    assert len(wavs) == 1  # 정상 청크로 생성
    import wave as _w
    with _w.open(str(wavs[0]), "rb") as w:
        assert w.getnframes() == 120
