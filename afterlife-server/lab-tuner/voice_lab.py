"""업로드 음성(참조 목소리)으로 TTS 를 테스트하기 위한 저장·정규화 모듈.

얼굴·페르소나는 선택한 클론 것을 그대로 쓰고 **목소리만** 교체한다.
source_lab.py(렌더 소스)의 음성판이며, 다른 점은 저장 위치 하나다.

경로 규약 (반드시 지킬 것)
--------------------------
TTS 어댑터(CosyVoice :8203 · qwen3tts :8201 · OpenVoice :8200)는 모두 같은 규약을
쓴다 — 요청 body 의 `se_path` 에서 **마지막에서 두 번째 경로 조각**을 clone_id 로
읽고(cosyvoice/scripts/clone_ref.py:parse_clone_id), 자기 REF_ROOT 아래
`<clone_id>/` 에서 음성 자산을 찾는다.

    <REF_ROOT>/<clone_id>/voice.wav        원본 참조 음성
    <REF_ROOT>/<clone_id>/ref_text.txt     그 음성의 전사
    <REF_ROOT>/<clone_id>/voice_prompt.wav  ┐ CosyVoice 전용 짧은 프롬프트 쌍
    <REF_ROOT>/<clone_id>/ref_prompt.txt    ┘ (있으면 이쪽이 우선)

그래서 랩도 **라이브와 같은 REF_ROOT 안에** 디렉터리를 만든다. 다른 곳에 두면
TTS 프로세스가 읽지 못해 400/404 가 난다(랩만 아는 경로여도 소용없다).

🔴 그 말은 이 모듈이 **라이브 클론 음성 자산과 같은 디렉터리에 쓴다**는 뜻이다.
그래서 두 겹으로 막는다.
  1. 랩이 만드는 id 는 반드시 `lab-` 접두를 단다. 실 클론 id 는 숫자 4자리라 겹치지
     않는다.
  2. 삭제·목록은 `lab-` 접두 **그리고** meta.json 의 `lab: true` 마커가 둘 다 있는
     디렉터리만 대상으로 한다. 하나라도 없으면 남의 자산으로 보고 손대지 않는다.

디렉터리는 업로드 1건당 1개다. TTS 는 clone_id 로 프롬프트를 캐시하므로
(CosyVoice add_zero_shot_spk · PROMPT_CACHE_DIR) 한 id 에 다른 음성을 덮어쓰면
재기동 전까지 옛 음색이 그대로 나온다.
"""
from __future__ import annotations

import json
import logging
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

log = logging.getLogger("lab-tuner.voice")

# 라이브 TTS 세 어댑터가 공유하는 참조 루트(cosyvoice/scripts/config.py:REF_ROOT).
DEFAULT_ROOT = "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices"

# 🔴 실 클론 id(숫자)와 절대 겹치지 않게 하는 접두. 이것이 삭제 사고의 1차 방어선이다.
ID_PREFIX = "lab-"

# ffmpeg 가 디코드할 수 있고 참조 음성으로 쓸 만한 컨테이너만.
AUDIO_EXTS = (".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg", ".opus", ".webm")

MAX_BYTES = int(os.environ.get("LAB_VOICE_MAX_MB", "50")) * 1024 * 1024

# 참조 음성 정규화 규격.
# mono: 참조는 화자 한 명이다. 스테레오면 어댑터마다 채널 처리가 달라 음색이 흔들린다.
# 24kHz: CosyVoice2 의 출력 sr 과 같다. 어댑터가 내부에서 16k(토크나이저)·24k(flow)로
#   다시 샘플링하므로 그보다 낮은 sr 로 저장하면 되돌릴 수 없는 손실만 남는다.
WAV_AR = int(os.environ.get("LAB_VOICE_AR", "24000"))

_FFMPEG = os.environ.get("LAB_FFMPEG", "ffmpeg")

# CosyVoice 전용 짧은 프롬프트 쌍 파일명 — clone_ref.PROMPT_WAV/PROMPT_TXT 와 같아야
# 한다. 다르면 어댑터가 쌍을 못 찾고 긴 voice.wav 로 폴백해 짧은 발화가 폭주한다.
PROMPT_WAV = "voice_prompt.wav"
PROMPT_TXT = "ref_prompt.txt"

# 프롬프트 쌍 생성기. 랩이 로직을 복제하지 않고 라이브 스크립트를 그대로 부른다
# (무음 트림·문장경계·꼬리무음 규칙이 실측으로 튜닝돼 있다 — 2026-08-13).
DEFAULT_MAKE_PROMPT_REF = (
    "/home/afterlife/afterlife-server/cosyvoice/scripts/make_prompt_ref.py")

STT_URL = os.environ.get("PRETHIRD_STT_URL", "http://127.0.0.1:8202")

# STT 가 clone_id 로 받아주는 문자 집합(stt-afterlife/scripts/clone_stt.py).
_STT_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


class VoiceError(ValueError):
    """업로드 거부(확장자·용량·변환 실패·보호된 디렉터리). 호출부가 4xx 로 바꾼다."""


def root() -> Path:
    return Path(os.environ.get("LAB_VOICE_ROOT", DEFAULT_ROOT))


def check_ext(name: str) -> str:
    """확장자 허용 검사. 통과하면 소문자 확장자를 돌려준다."""
    ext = Path(name).suffix.lower()
    if ext not in AUDIO_EXTS:
        raise VoiceError(
            f"허용하지 않는 확장자: {ext or '(없음)'} — 음성 {' '.join(AUDIO_EXTS)}")
    return ext


def make_id(now: float | None = None, exists=None) -> str:
    """업로드 id = lab-날짜시간(KST 서버 로컬). 같은 초 충돌 시 -2, -3 … 으로 회피."""
    if exists is None:
        _r = root()

        def exists(name):        # noqa: E306 — 지역 기본 구현
            return (_r / name).exists()
    base = ID_PREFIX + time.strftime("%Y%m%d-%H%M%S", time.localtime(now))
    if not exists(base):
        return base
    for n in range(2, 100):
        cand = f"{base}-{n}"
        if not exists(cand):
            return cand
    raise VoiceError(f"업로드 id 충돌 회피 실패: {base}")


def se_path_for(voice_id: str) -> str:
    """TTS body 에 실어 보낼 se_path.

    실제 파일(se.pth)은 없어도 된다 — 어댑터는 이 문자열에서 clone_id 만 뽑아 쓰고
    파일은 열지 않는다(OpenVoice 시절 규약의 잔재). 경로 모양을 라이브와 똑같이
    유지해야 parse_clone_id 가 같은 값을 뽑는다.
    """
    return f"reference_voices/{voice_id}/se.pth"


def build_wav_cmd(src: str, dest: str) -> list:
    """업로드 원본 → 참조 wav 정규화 ffmpeg 인자. 순수 함수(테스트가 직접 검증)."""
    return [
        _FFMPEG, "-y", "-loglevel", "error",
        "-i", src,
        "-vn",                                  # 영상 트랙이 섞여 와도 버린다
        "-ac", "1", "-ar", str(WAV_AR),
        "-c:a", "pcm_s16le",
        dest,
    ]


def build_wav(src: str, dest: str, *, run=None) -> str | None:
    """참조 wav 생성. 실패 시 None(호출부가 업로드를 되돌린다)."""
    run = run or subprocess.run
    try:
        res = run(build_wav_cmd(src, dest), capture_output=True, text=True, timeout=180)
    except Exception as exc:                    # ffmpeg 부재·타임아웃 등
        log.warning("참조 wav 변환 실패(%s): %s", type(exc).__name__, exc)
        return None
    if getattr(res, "returncode", 1) != 0 or not os.path.isfile(dest):
        log.warning("참조 wav 변환 실패(rc=%s): %s",
                    getattr(res, "returncode", "?"), (getattr(res, "stderr", "") or "")[:400])
        return None
    return dest


def stt_transcribe(voice_id: str, wav_path: str) -> str | None:
    """참조 음성을 STT(:8202)로 전사. 실패하면 None(호출부가 삼킨다).

    /transcribe_path 는 전사 결과를 out_clone_id 의 ref_text.txt 에도 **직접 쓴다**.
    랩 루트가 STT 의 REF_ROOT 와 같으면 그것이 곧 우리가 원하는 자리다. 다르면
    (개발·테스트) 저장은 빗나가지만 반환값으로 우리가 다시 쓰므로 결과는 같다.
    """
    import urllib.error
    import urllib.request

    payload = json.dumps({"wav_path": wav_path, "out_clone_id": voice_id}).encode()
    req = urllib.request.Request(
        f"{STT_URL}/transcribe_path", data=payload,
        headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # 422 = 전사가 비었거나 한글 비율 미달. 참조로 쓰기 나쁜 음성이라는 신호다.
        log.warning("[voice] STT 거부(%s): %s", exc.code, exc.read()[:200])
        return None
    except Exception as exc:                    # noqa: BLE001 — 어떤 실패든 fail-open
        log.warning("[voice] STT 실패: %s", exc)
        return None
    return (data.get("ref_text") or "").strip() or None


def make_prompt_pair(voice_id: str, *, run=None) -> bool:
    """짧은 프롬프트 쌍 생성. 생성기가 없거나 실패하면 False(voice.wav 폴백).

    라이브 make_prompt_ref.py 를 그대로 부른다. 그 스크립트는 config.REF_ROOT 를
    보므로 랩 루트를 env 로 주입해 같은 자리를 보게 한다.
    """
    run = run or subprocess.run
    script = os.environ.get("LAB_MAKE_PROMPT_REF", DEFAULT_MAKE_PROMPT_REF)
    if not os.path.isfile(script):
        log.warning("[voice] 프롬프트 쌍 생성기 없음(%s) — voice.wav 폴백", script)
        return False
    env = dict(os.environ, COSYVOICE_REF_ROOT=str(root()), PRETHIRD_STT_URL=STT_URL)
    try:
        res = run([sys.executable, script, voice_id], capture_output=True, text=True,
                  timeout=600, cwd=os.path.dirname(script), env=env)
    except Exception as exc:
        log.warning("[voice] 프롬프트 쌍 생성 실패(%s): %s", type(exc).__name__, exc)
        return False
    if getattr(res, "returncode", 1) != 0:
        log.warning("[voice] 프롬프트 쌍 생성 실패(rc=%s): %s",
                    getattr(res, "returncode", "?"), (getattr(res, "stdout", "") or "")[-400:])
        return False
    d = root() / voice_id
    return (d / PROMPT_WAV).is_file() and bool((d / PROMPT_TXT).read_text().strip()
                                               if (d / PROMPT_TXT).is_file() else "")


def save_bytes(data: bytes, filename: str, *, now: float | None = None,
               ref_text: str | None = None, run=None,
               transcribe=None, make_pair=None) -> dict:
    """업로드 바이트를 새 디렉터리에 저장하고 meta 를 기록한다.

    ref_text 를 주면 그것을 참조 문장으로 쓰고 STT 를 건너뛴다. 안 주면 전사한다.
    전사·프롬프트쌍은 실패해도 업로드를 살린다(폴백 경로로 합성은 된다).
    """
    if not data:
        raise VoiceError("빈 파일")
    if len(data) > MAX_BYTES:
        raise VoiceError(f"용량 초과: {len(data)/1048576:.1f}MB > {MAX_BYTES/1048576:.0f}MB")
    ext = check_ext(filename)
    transcribe = transcribe if transcribe is not None else stt_transcribe
    make_pair = make_pair if make_pair is not None else make_prompt_pair

    vid = make_id(now)
    if not _STT_ID_RE.match(vid):               # 방어: 규격 밖 id 는 STT 가 400 을 준다
        raise VoiceError(f"업로드 id 규격 위반: {vid!r}")
    d = root() / vid
    d.mkdir(parents=True, exist_ok=True)
    raw = d / f"upload{ext}"
    raw.write_bytes(data)

    wav = build_wav(str(raw), str(d / "voice.wav"), run=run)
    if wav is None:
        shutil.rmtree(d, ignore_errors=True)    # 쓸 수 없는 업로드는 남기지 않는다
        raise VoiceError(
            "참조 wav 로 변환하지 못했습니다 — 손상된 파일이거나 음성 트랙이 없습니다")

    text = (ref_text or "").strip() or None
    if text is None:
        try:
            text = transcribe(vid, wav)
        except Exception as exc:                # noqa: BLE001 — 전사 실패로 업로드를 막지 않는다
            log.warning("[voice] 전사 실패(계속 진행): %s", exc)
            text = None
    if text:
        (d / "ref_text.txt").write_text(text, encoding="utf-8")

    pair = False
    if text:
        # 프롬프트 쌍은 전사가 있어야 만들 수 있다(오디오와 텍스트는 짝으로 움직인다).
        try:
            pair = bool(make_pair(vid))
        except Exception as exc:                # noqa: BLE001
            log.warning("[voice] 프롬프트 쌍 생성 실패(계속 진행): %s", exc)
            pair = False

    meta = {
        "id": vid,
        "lab": True,                # 🔴 랩 소유 마커 — 삭제·목록이 이 값을 확인한다
        "orig_name": Path(filename).name,
        "bytes": len(data),
        "wav": wav,
        "ref_text": text,
        "prompt_pair": pair,        # 짧은 프롬프트 쌍 성사 여부(폭주 방지 지표)
        "se_path": se_path_for(vid),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now)),
    }
    (d / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    log.info("[voice-upload] id=%s bytes=%d ref_text=%s pair=%s",
             vid, len(data), bool(text), pair)
    return meta


def _valid_id(voice_id) -> str | None:
    """랩 업로드 id 로 쓸 수 있는 값만 통과. 아니면 None."""
    if not voice_id:
        return None
    vid = str(voice_id).strip()
    if not vid.startswith(ID_PREFIX) or "/" in vid or ".." in vid or "\\" in vid:
        return None
    return vid


def _read_meta(d: Path) -> dict | None:
    """랩이 만든 디렉터리의 meta 만 돌려준다. 마커가 없으면 남의 자산이다."""
    try:
        meta = json.loads((d / "meta.json").read_text())
    except Exception:
        return None
    if not isinstance(meta, dict) or meta.get("lab") is not True:
        return None
    return meta


def list_voices() -> list:
    """업로드 목록 — 최신 우선. 실 클론 디렉터리는 마커가 없어 자동으로 빠진다."""
    r = root()
    if not r.is_dir():
        return []
    out = []
    for d in sorted(r.iterdir(), key=lambda p: p.name, reverse=True):
        if not d.is_dir() or not d.name.startswith(ID_PREFIX):
            continue
        meta = _read_meta(d)
        if meta is None:
            continue
        meta["ok"] = os.path.isfile(meta.get("wav") or "")
        out.append(meta)
    return out


def resolve(voice_id: str | None) -> dict | None:
    """노브의 voice_source(id) → meta. 없거나 파일이 사라졌으면 None(fail-open).

    통화 경로에서 불린다 — 여기서 예외를 던지면 통화가 죽는다. 무조건 None 으로
    떨어뜨리고 경고만 남겨 클론 기본 목소리로 되돌아가게 한다.
    """
    if not voice_id:
        return None
    vid = _valid_id(voice_id)
    if vid is None:
        log.warning("[voice] 잘못된 id 무시: %r", voice_id)
        return None
    meta = _read_meta(root() / vid)
    if meta is None:
        log.warning("[voice] id 없음 → 클론 기본 목소리 사용: %s", vid)
        return None
    if not os.path.isfile(meta.get("wav") or ""):
        log.warning("[voice] 참조 음성 사라짐 → 클론 기본 목소리 사용: %s", meta.get("wav"))
        return None
    return meta


def delete(voice_id: str) -> bool:
    """업로드 디렉터리 삭제. 존재하지 않으면 False.

    🔴 랩이 만든 디렉터리(lab- 접두 + meta 마커)만 지운다. 저장 루트가 라이브
    reference_voices 라, 이 방어가 없으면 클론 음성 자산이 통째로 날아간다.
    """
    vid = _valid_id(voice_id)
    if vid is None:
        raise VoiceError(f"랩 업로드가 아닙니다(지울 수 없음): {voice_id!r}")
    d = root() / vid
    if not d.is_dir():
        return False
    if _read_meta(d) is None:
        raise VoiceError(f"랩이 만든 업로드가 아닙니다(지울 수 없음): {vid}")
    shutil.rmtree(d)
    log.info("[voice-delete] id=%s", vid)
    return True
