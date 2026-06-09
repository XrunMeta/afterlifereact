"""tests/test_voice_fetch.py — voice.wav lazy fetch + 변환 TDD"""
import sys
import pathlib
import os
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import voice_fetch

async def test_skips_when_voice_wav_exists(tmp_path):
    """이미 voice.wav 있으면 fetch/convert 호출 없이 경로 반환."""
    d = tmp_path / "9001"
    d.mkdir()
    (d / "voice.wav").write_bytes(b"RIFFexisting")
    calls = []

    async def fake_fetch(u, dst):
        calls.append("fetch")
        return dst

    async def fake_convert(s, dst):
        calls.append("convert")
        return dst

    res = await voice_fetch.ensure_voice_wav(
        "9001", "http://oth-path", str(tmp_path), _fetch=fake_fetch, _convert=fake_convert
    )
    assert res == str(d / "voice.wav")
    assert calls == []

async def test_fetches_then_converts(tmp_path):
    """voice.wav 없으면 원본 fetch → ffmpeg 변환 → src 정리."""
    seen = {}

    async def fake_fetch(u, dst):
        seen["fetch_url"] = u
        with open(dst, "wb") as f:
            f.write(b"rawsrc")
        return dst

    async def fake_convert(s, dst):
        seen["convert_src"] = s
        with open(dst, "wb") as f:
            f.write(b"RIFF" + b"\x00" * 2000)  # 가드(_MIN_WAV_BYTES) 통과용 더미 wav
        return dst

    res = await voice_fetch.ensure_voice_wav(
        "9002", "http://oth-path", str(tmp_path), _fetch=fake_fetch, _convert=fake_convert
    )
    clone_dir = os.path.join(str(tmp_path), "9002")
    expected = os.path.join(clone_dir, "voice.wav")
    assert res == expected
    assert seen["fetch_url"] == "http://oth-path"
    # 변환물이 dest로 원자적 이동
    assert os.path.isfile(expected)
    assert os.path.getsize(expected) >= 1024  # 가드 통과한 유효 산출물
    # 임시파일(.src/.part) 전부 정리 — voice.wav만 남음
    leftover = [f for f in os.listdir(clone_dir) if f != "voice.wav"]
    assert leftover == []

async def test_cleans_src_on_convert_failure(tmp_path):
    """변환 실패 시 예외 전파 + 임시파일 정리 + voice.wav 미생성."""
    async def fake_fetch(u, dst):
        with open(dst, "wb") as f:
            f.write(b"rawsrc")
        return dst

    async def fake_convert(s, dst):
        raise RuntimeError("ffmpeg boom")

    with pytest.raises(RuntimeError):
        await voice_fetch.ensure_voice_wav(
            "9003", "http://oth-path", str(tmp_path), _fetch=fake_fetch, _convert=fake_convert
        )
    clone_dir = os.path.join(str(tmp_path), "9003")
    # 변환 실패 → voice.wav 미생성 + 임시파일(.src/.part) 전부 정리
    assert not os.path.exists(os.path.join(clone_dir, "voice.wav"))
    assert os.listdir(clone_dir) == []

async def test_rejects_empty_converted_wav(tmp_path):
    """변환이 rc=0이어도 빈/작은 wav면 거부 → dest 미생성 + 정리(재시도 가능)."""
    async def fake_fetch(u, dst):
        with open(dst, "wb") as f:
            f.write(b"rawsrc")
        return dst

    async def fake_convert(s, dst):
        with open(dst, "wb") as f:
            f.write(b"")  # 0바이트 산출
        return dst

    with pytest.raises(RuntimeError):
        await voice_fetch.ensure_voice_wav(
            "9004", "http://oth-path", str(tmp_path), _fetch=fake_fetch, _convert=fake_convert
        )
    clone_dir = os.path.join(str(tmp_path), "9004")
    assert not os.path.exists(os.path.join(clone_dir, "voice.wav"))
    assert os.listdir(clone_dir) == []
