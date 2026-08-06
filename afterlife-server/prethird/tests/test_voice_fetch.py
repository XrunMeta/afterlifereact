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
    # 임시파일(.src/.part) 정리 — voice.wav 와 진단용 원본(voice.raw)만 남음
    leftover = sorted(f for f in os.listdir(clone_dir) if f != "voice.wav")
    assert leftover == ["voice.raw"]

async def test_keeps_original_for_diagnosis(tmp_path):
    """변환 성공 시 원본을 voice.raw 로 보존한다.

    클론 9104 진단 때 원본이 없어 '업로드가 노이즈'인지 '변환이 깨뜨렸는지'를
    가릴 수 없었다. 원본은 API 에 있지만 조회에 사용자 토큰이 필요해 서버에서
    닿지 않는다 → 변환 시점에 사본을 남긴다.
    """
    async def fake_fetch(u, dst):
        with open(dst, "wb") as f:
            f.write(b"ORIGINAL-UPLOAD-BYTES")
        return dst

    async def fake_convert(s, dst):
        with open(dst, "wb") as f:
            f.write(b"RIFF" + b"\x00" * 2000)
        return dst

    await voice_fetch.ensure_voice_wav(
        "9104", "http://oth-path", str(tmp_path), _fetch=fake_fetch, _convert=fake_convert
    )
    raw = os.path.join(str(tmp_path), "9104", "voice.raw")
    assert os.path.isfile(raw)
    assert open(raw, "rb").read() == b"ORIGINAL-UPLOAD-BYTES"

async def test_original_kept_is_overwritten_not_accumulated(tmp_path):
    """원본은 클론당 1개만 유지 — 디스크 누적 방지(현재 사용률 85%)."""
    clone_dir = tmp_path / "9105"
    clone_dir.mkdir()
    (clone_dir / "voice.raw").write_bytes(b"OLD")

    async def fake_fetch(u, dst):
        with open(dst, "wb") as f:
            f.write(b"NEW-UPLOAD")
        return dst

    async def fake_convert(s, dst):
        with open(dst, "wb") as f:
            f.write(b"RIFF" + b"\x00" * 2000)
        return dst

    await voice_fetch.ensure_voice_wav(
        "9105", "http://oth-path", str(tmp_path), _fetch=fake_fetch, _convert=fake_convert
    )
    files = sorted(os.listdir(str(clone_dir)))
    assert files == ["voice.raw", "voice.wav"]
    assert (clone_dir / "voice.raw").read_bytes() == b"NEW-UPLOAD"

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

# --- denoise 필터 빌더 ---

def test_denoise_af_args_off_by_default():
    """env 미설정 → denoise 비활성 → 빈 리스트(기존 명령과 동일)."""
    assert voice_fetch._denoise_af_args(env={}) == []

def test_denoise_af_args_off_when_not_1():
    """PRETHIRD_VOICE_DENOISE 가 '1'이 아니면 비활성."""
    assert voice_fetch._denoise_af_args(env={"PRETHIRD_VOICE_DENOISE": "0"}) == []
    assert voice_fetch._denoise_af_args(env={"PRETHIRD_VOICE_DENOISE": "true"}) == []

def test_denoise_af_args_on_default_chain():
    """'1'이면 기본 보수 체인으로 ['-af', chain]."""
    out = voice_fetch._denoise_af_args(env={"PRETHIRD_VOICE_DENOISE": "1"})
    assert out == ["-af", "highpass=f=80,afftdn=nr=10:nf=-25:tn=1"]

def test_denoise_af_args_override():
    """PRETHIRD_VOICE_DENOISE_AF 로 필터 문자열 override(재배포 없이 튜닝)."""
    out = voice_fetch._denoise_af_args(
        env={"PRETHIRD_VOICE_DENOISE": "1", "PRETHIRD_VOICE_DENOISE_AF": "afftdn=nr=6"}
    )
    assert out == ["-af", "afftdn=nr=6"]

def test_denoise_af_args_override_blank_falls_back():
    """override가 빈 문자열이면 기본 체인으로 폴백(빈 -af 인자 방지)."""
    out = voice_fetch._denoise_af_args(
        env={"PRETHIRD_VOICE_DENOISE": "1", "PRETHIRD_VOICE_DENOISE_AF": ""}
    )
    assert out == ["-af", "highpass=f=80,afftdn=nr=10:nf=-25:tn=1"]

# --- ffmpeg 명령 조립 ---

def test_ffmpeg_cmd_off_matches_legacy():
    """토글 off(기본) → 기존 명령과 바이트 단위 동일(회귀 고정)."""
    cmd = voice_fetch._ffmpeg_cmd("/in.m4a", "/out.wav.part", env={})
    assert cmd == ["ffmpeg", "-y", "-i", "/in.m4a", "-ac", "1", "-f", "wav", "/out.wav.part"]

def test_ffmpeg_cmd_on_inserts_af_after_input():
    """토글 on → -af 가 -i 다음, -ac 앞에 삽입."""
    cmd = voice_fetch._ffmpeg_cmd(
        "/in.m4a", "/out.wav.part", env={"PRETHIRD_VOICE_DENOISE": "1"}
    )
    assert cmd == [
        "ffmpeg", "-y", "-i", "/in.m4a",
        "-af", "highpass=f=80,afftdn=nr=10:nf=-25:tn=1",
        "-ac", "1", "-f", "wav", "/out.wav.part",
    ]

def test_ffmpeg_cmd_override():
    """override 필터가 명령에 반영."""
    cmd = voice_fetch._ffmpeg_cmd(
        "/in.m4a", "/out.wav.part",
        env={"PRETHIRD_VOICE_DENOISE": "1", "PRETHIRD_VOICE_DENOISE_AF": "afftdn=nr=6"},
    )
    assert cmd == [
        "ffmpeg", "-y", "-i", "/in.m4a",
        "-af", "afftdn=nr=6",
        "-ac", "1", "-f", "wav", "/out.wav.part",
    ]
