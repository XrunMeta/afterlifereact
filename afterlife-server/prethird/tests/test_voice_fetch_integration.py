"""tests/test_voice_fetch_integration.py — 실 ffmpeg denoise 경로 검증.

단위테스트(test_voice_fetch.py)는 명령 '조립'만 검증한다. 이 파일은 실제 ffmpeg를
호출해 ①denoise 필터 수용 ②잘못된 필터 폴백 ③짧은 클립 크기 가드를 검증.
ffmpeg 미설치 환경(일부 CI)에서는 자동 skip.
"""
import asyncio
import os
import pathlib
import shutil
import sys

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import voice_fetch

pytestmark = pytest.mark.skipif(
    shutil.which("ffmpeg") is None, reason="실 ffmpeg 필요(미설치 시 skip)"
)


async def _make_src(path, dur=1.0):
    """lavfi sine으로 짧은 테스트 음원 생성."""
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", f"sine=frequency=440:duration={dur}", "-ac", "1", str(path),
        stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
    )
    await proc.communicate()
    assert os.path.isfile(path)


async def test_denoise_on_real_ffmpeg(tmp_path, monkeypatch):
    """denoise on + 정상 음원 → voice.wav 생성, 크기 가드 통과."""
    monkeypatch.setenv("PRETHIRD_VOICE_DENOISE", "1")
    src = tmp_path / "in.wav"
    await _make_src(src)
    dest = tmp_path / "out.wav.part"
    await voice_fetch._ffmpeg_to_wav(str(src), str(dest))
    assert os.path.getsize(dest) >= voice_fetch._MIN_WAV_BYTES


async def test_bad_filter_falls_back(tmp_path, monkeypatch):
    """override 필터가 잘못돼 rc≠0 → denoise 없이 폴백으로 voice.wav 생성."""
    monkeypatch.setenv("PRETHIRD_VOICE_DENOISE", "1")
    monkeypatch.setenv("PRETHIRD_VOICE_DENOISE_AF", "afftdnXXX=bogus")
    src = tmp_path / "in.wav"
    await _make_src(src)
    dest = tmp_path / "out.wav.part"
    await voice_fetch._ffmpeg_to_wav(str(src), str(dest))  # 폴백으로 성공
    assert os.path.getsize(dest) >= voice_fetch._MIN_WAV_BYTES


async def test_short_clip_denoise(tmp_path, monkeypatch):
    """짧은(0.3s) 클립 + denoise → 크기 가드 통과(언더플로우 없음)."""
    monkeypatch.setenv("PRETHIRD_VOICE_DENOISE", "1")
    src = tmp_path / "in.wav"
    await _make_src(src, dur=0.3)
    dest = tmp_path / "out.wav.part"
    await voice_fetch._ffmpeg_to_wav(str(src), str(dest))
    assert os.path.getsize(dest) >= voice_fetch._MIN_WAV_BYTES
