# afterlife-server/qwen3tts/scripts/clone_ref.py
from __future__ import annotations
import os
import numpy as np
import soundfile as sf
import config

# ---------------------------------------------------------------------------
# ICL ref_text 헬퍼
# 규약: <REF_ROOT>/<clone_id>/ref_text.txt (UTF-8 plain text)
# ---------------------------------------------------------------------------

def ref_text_path(clone_id: str, ref_root: str | None = None) -> str:
    """ref_text.txt 전체 경로 반환 (파일 존재 여부는 확인하지 않음)."""
    root = ref_root if ref_root is not None else config.REF_ROOT
    return os.path.join(root, clone_id, "ref_text.txt")


def load_ref_text(clone_id: str, ref_root: str | None = None) -> str | None:
    """ref_text.txt 를 읽어 strip() 반환. 파일 없거나 내용이 빈 문자열이면 None."""
    path = ref_text_path(clone_id, ref_root)
    if not os.path.isfile(path):
        return None
    try:
        text = open(path, encoding="utf-8").read().strip()
    except OSError:
        return None
    return text if text else None


def parse_clone_id(se_path: str) -> str:
    """'reference_voices/<cloneId>/se.pth' -> '<cloneId>'. 마지막 디렉토리명 = cloneId.
    파일명(se.pth)은 임의여도 무방. 디렉토리 컴포넌트가 없으면 ValueError."""
    parts = [p for p in se_path.replace("\\", "/").split("/") if p]
    if len(parts) < 2:
        raise ValueError(f"cannot parse clone_id from se_path: {se_path!r}")
    return parts[-2]


def ref_audio_path(clone_id: str, ref_root: str | None = None) -> str:
    """클론 reference 원본 wav 경로. OpenVoice se.pth 와 같은 디렉토리의 voice.wav."""
    root = ref_root if ref_root is not None else config.REF_ROOT
    return os.path.join(root, clone_id, "voice.wav")


def extract_ref_clip(voice_wav: str, max_sec: float | None = None):
    """voice.wav 앞부분 최대 max_sec 초를 mono float32 로 반환. (clip, sr).
    VAD(침묵 제거)는 후속 — 현재는 단순 head trim(위저드 녹음은 대본 1개라 충분히 김).

    손상/읽기 불가 wav 는 ValueError("corrupt/unreadable wav: <path>") 로 변환해
    상위 레이어(server.py)가 503 으로 명확 매핑할 수 있도록 한다.
    """
    sec = config.REF_CLIP_MAX_SEC if max_sec is None else max_sec

    # 크기 0 파일 — sf.read 호출 전 조기 방어 (sion MAJOR3)
    try:
        file_size = os.path.getsize(voice_wav)
    except OSError as exc:
        raise ValueError(f"corrupt/unreadable wav: {voice_wav!r}") from exc
    if file_size == 0:
        raise ValueError(f"corrupt/unreadable wav (size=0): {voice_wav!r}")

    try:
        data, sr = sf.read(voice_wav, dtype="float32")
    except Exception as exc:
        raise ValueError(f"corrupt/unreadable wav: {voice_wav!r}") from exc

    if data.ndim > 1:
        data = data[:, 0]
    if data.size == 0:
        raise ValueError(f"empty audio: {voice_wav!r}")
    max_samples = int(sec * sr)
    return data[:max_samples], sr
