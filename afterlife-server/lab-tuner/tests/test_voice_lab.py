"""업로드 음성 저장·참조쌍 생성 단위 테스트.

모킹은 최소로 — ffmpeg/STT/프롬프트쌍 생성기만 주입으로 대체하고 파일시스템은
실제 tmp_path 를 쓴다(test_source_lab.py 와 같은 원칙).

🔴 이 테스트가 지키는 가장 중요한 불변식: **랩이 실 클론 디렉터리를 건드리지 않는다.**
저장 루트가 라이브 reference_voices 와 같은 디렉터리라, 삭제·목록이 새면 클론 음성
자산이 날아간다.
"""
import json
import pathlib
import types

import pytest

import voice_lab


@pytest.fixture(autouse=True)
def _root(tmp_path, monkeypatch):
    monkeypatch.setenv("LAB_VOICE_ROOT", str(tmp_path / "reference_voices"))
    return tmp_path / "reference_voices"


def _ok(*a, **kw):
    """ffmpeg 성공 대역 — dest(마지막 인자 앞 -y 규약)를 실제로 만들어 준다."""
    cmd = a[0]
    dest = cmd[-1] if not cmd[-1].startswith("-") else cmd[-2]
    pathlib.Path(dest).write_bytes(b"RIFFfake")
    return types.SimpleNamespace(returncode=0, stderr="", stdout="")


def _fail(*a, **kw):
    return types.SimpleNamespace(returncode=1, stderr="boom", stdout="")


# --- 확장자 판정 -----------------------------------------------------------

@pytest.mark.parametrize("name", [
    "a.wav", "a.WAV", "a.mp3", "a.m4a", "a.aac", "a.flac", "a.ogg", "a.opus", "a.webm",
])
def test_check_ext_accepts_audio(name):
    assert voice_lab.check_ext(name) == pathlib.Path(name).suffix.lower()


@pytest.mark.parametrize("name", ["a.mp4", "a.jpg", "a.txt", "noext", ""])
def test_check_ext_rejects_non_audio(name):
    with pytest.raises(voice_lab.VoiceError):
        voice_lab.check_ext(name)


# --- id 규약 ---------------------------------------------------------------

def test_make_id_has_lab_prefix():
    """실 클론 id(숫자)와 절대 겹치지 않게 lab- 접두를 강제한다."""
    assert voice_lab.make_id(now=0, exists=lambda n: False).startswith(voice_lab.ID_PREFIX)


def test_make_id_avoids_collision():
    taken = {voice_lab.make_id(now=0, exists=lambda n: False)}
    second = voice_lab.make_id(now=0, exists=lambda n: n in taken)
    assert second not in taken and second.startswith(voice_lab.ID_PREFIX)


def test_make_id_matches_stt_clone_id_charset():
    """STT /transcribe_path 의 clone_id 정규식(^[A-Za-z0-9_-]{1,128}$)을 통과해야 한다.

    통과 못 하면 전사가 400 으로 떨어져 ref_text 가 비고, 프롬프트쌍도 못 만든다.
    """
    import re
    sid = voice_lab.make_id(now=0, exists=lambda n: False)
    assert re.match(r"^[A-Za-z0-9_-]{1,128}$", sid)


# --- se_path 규약 ----------------------------------------------------------

def test_se_path_for_follows_reference_voices_contract():
    """TTS 는 se_path 의 '마지막에서 두 번째' 경로 조각을 clone_id 로 읽는다
    (cosyvoice/scripts/clone_ref.py:parse_clone_id). 그 규약을 그대로 만족해야 한다."""
    se = voice_lab.se_path_for("lab-20260818-120000")
    assert se.replace("\\", "/").split("/")[-2] == "lab-20260818-120000"
    assert se.endswith("se.pth")


# --- 저장 ------------------------------------------------------------------

def test_save_bytes_writes_voice_wav_and_meta(_root, monkeypatch):
    monkeypatch.setattr(voice_lab.subprocess, "run", _ok)
    meta = voice_lab.save_bytes(b"AUDIO", "목소리.mp3", now=0, transcribe=lambda *a, **k: None,
                                make_pair=lambda *a, **k: False)
    d = _root / meta["id"]
    assert (d / "voice.wav").is_file()
    assert json.loads((d / "meta.json").read_text())["lab"] is True
    assert meta["orig_name"] == "목소리.mp3"


def test_save_bytes_rejects_empty():
    with pytest.raises(voice_lab.VoiceError):
        voice_lab.save_bytes(b"", "a.wav")


def test_save_bytes_rejects_oversize(monkeypatch):
    monkeypatch.setattr(voice_lab, "MAX_BYTES", 4)
    with pytest.raises(voice_lab.VoiceError):
        voice_lab.save_bytes(b"12345", "a.wav")


def test_save_bytes_cleans_up_when_conversion_fails(_root, monkeypatch):
    """wav 로 못 바꾼 업로드는 남기지 않는다 — 남으면 TTS 가 빈 디렉터리를 읽는다."""
    monkeypatch.setattr(voice_lab.subprocess, "run", _fail)
    with pytest.raises(voice_lab.VoiceError):
        voice_lab.save_bytes(b"AUDIO", "a.mp3", now=0)
    assert not any(_root.iterdir()) if _root.is_dir() else True


def test_build_wav_cmd_is_mono_pcm(_root):
    cmd = voice_lab.build_wav_cmd("/in.mp3", "/out.wav")
    assert "-ac" in cmd and cmd[cmd.index("-ac") + 1] == "1"
    assert "-c:a" in cmd and cmd[cmd.index("-c:a") + 1] == "pcm_s16le"
    assert cmd[-1] == "/out.wav"


def test_build_wav_cmd_keeps_source_sample_rate():
    """🔴 샘플레이트를 강제하지 않는다 — 리샘플은 되돌릴 수 없는 손실이다.

    2026-08-18 실측: 라이브 클론 참조 자산은 44.1kHz 다(9115 voice_prompt.wav).
    어댑터가 내부에서 16k(토크나이저)·24k(flow)로 알아서 다시 샘플링하므로,
    저장 시점에 24k 로 깎아 두면 그 손실만 남고 얻는 것이 없다.
    """
    assert "-ar" not in voice_lab.build_wav_cmd("/in.mp3", "/out.wav")


# --- 참조 텍스트 -----------------------------------------------------------

def test_save_bytes_uses_given_ref_text_without_stt(_root, monkeypatch):
    """사용자가 참조 문장을 직접 넣으면 STT 를 부르지 않는다(전사 실패로 막히지 않게)."""
    monkeypatch.setattr(voice_lab.subprocess, "run", _ok)
    called = []
    meta = voice_lab.save_bytes(
        b"AUDIO", "a.wav", now=0, ref_text="안녕하세요. 박영미입니다.",
        transcribe=lambda *a, **k: called.append(1),
        make_pair=lambda *a, **k: False)
    assert called == []
    assert (_root / meta["id"] / "ref_text.txt").read_text().strip() == "안녕하세요. 박영미입니다."
    assert meta["ref_text"] == "안녕하세요. 박영미입니다."


def test_save_bytes_falls_back_to_stt(_root, monkeypatch):
    monkeypatch.setattr(voice_lab.subprocess, "run", _ok)
    meta = voice_lab.save_bytes(b"AUDIO", "a.wav", now=0,
                                transcribe=lambda sid, wav: "전사된 문장입니다",
                                make_pair=lambda *a, **k: False)
    assert meta["ref_text"] == "전사된 문장입니다"


def test_save_bytes_survives_stt_failure(_root, monkeypatch):
    """전사가 죽어도 업로드는 살린다 — cross-lingual 폴백으로 합성은 된다."""
    monkeypatch.setattr(voice_lab.subprocess, "run", _ok)

    def boom(sid, wav):
        raise RuntimeError("stt down")

    meta = voice_lab.save_bytes(b"AUDIO", "a.wav", now=0, transcribe=boom,
                                make_pair=lambda *a, **k: False)
    assert meta["ref_text"] is None
    assert (_root / meta["id"] / "voice.wav").is_file()


# --- 프롬프트 쌍 -----------------------------------------------------------

def test_save_bytes_records_prompt_pair_result(_root, monkeypatch):
    """짧은 프롬프트 쌍이 있어야 CosyVoice 폭주가 잡힌다 — 성사 여부를 meta 에 남긴다."""
    monkeypatch.setattr(voice_lab.subprocess, "run", _ok)
    meta = voice_lab.save_bytes(b"AUDIO", "a.wav", now=0,
                                transcribe=lambda *a, **k: "문장",
                                make_pair=lambda sid: True)
    assert meta["prompt_pair"] is True


def test_save_bytes_survives_prompt_pair_failure(_root, monkeypatch):
    monkeypatch.setattr(voice_lab.subprocess, "run", _ok)

    def boom(sid):
        raise RuntimeError("no generator")

    meta = voice_lab.save_bytes(b"AUDIO", "a.wav", now=0,
                                transcribe=lambda *a, **k: "문장", make_pair=boom)
    assert meta["prompt_pair"] is False


# --- 목록·해석·삭제 --------------------------------------------------------

def _make(root, sid, *, lab=True, wav=True):
    d = root / sid
    d.mkdir(parents=True, exist_ok=True)
    if wav:
        (d / "voice.wav").write_bytes(b"RIFF")
    meta = {"id": sid, "lab": lab, "orig_name": "x.wav", "bytes": 4,
            "wav": str(d / "voice.wav")}
    (d / "meta.json").write_text(json.dumps(meta))
    return d


def test_list_voices_only_lab_uploads(_root):
    _make(_root, "lab-20260818-120000")
    (_root / "9104").mkdir(parents=True)          # 실 클론 — meta.json 이 없다
    (_root / "9104" / "voice.wav").write_bytes(b"REAL")
    ids = [v["id"] for v in voice_lab.list_voices()]
    assert ids == ["lab-20260818-120000"]


def test_resolve_returns_meta(_root):
    _make(_root, "lab-20260818-120000")
    assert voice_lab.resolve("lab-20260818-120000")["id"] == "lab-20260818-120000"


def test_resolve_fails_open_on_missing_wav(_root):
    d = _make(_root, "lab-20260818-120000")
    (d / "voice.wav").unlink()
    assert voice_lab.resolve("lab-20260818-120000") is None


@pytest.mark.parametrize("bad", ["", None, "../etc", "./x", "9104", "lab/x"])
def test_resolve_rejects_bad_id(_root, bad):
    """접두 없는 id(=실 클론)와 경로 조작은 통화 경로에서 조용히 무시한다."""
    assert voice_lab.resolve(bad) is None


def test_delete_removes_lab_upload(_root):
    _make(_root, "lab-20260818-120000")
    assert voice_lab.delete("lab-20260818-120000") is True
    assert not (_root / "lab-20260818-120000").exists()


def test_delete_refuses_real_clone_directory(_root):
    """🔴 실 클론 음성 자산은 어떤 경로로도 지워지면 안 된다."""
    (_root / "9104").mkdir(parents=True)
    (_root / "9104" / "voice.wav").write_bytes(b"REAL")
    with pytest.raises(voice_lab.VoiceError):
        voice_lab.delete("9104")
    assert (_root / "9104" / "voice.wav").is_file()


def test_delete_refuses_lab_prefixed_dir_without_marker(_root):
    """lab- 로 시작해도 랩이 만든 게 아니면(meta 마커 없음) 지우지 않는다."""
    d = _root / "lab-something"
    d.mkdir(parents=True)
    (d / "voice.wav").write_bytes(b"X")
    with pytest.raises(voice_lab.VoiceError):
        voice_lab.delete("lab-something")
    assert (d / "voice.wav").is_file()


def test_delete_missing_returns_false(_root):
    assert voice_lab.delete("lab-20260818-999999") is False
