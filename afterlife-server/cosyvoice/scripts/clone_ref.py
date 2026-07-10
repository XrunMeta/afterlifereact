"""클론 참조 헬퍼 — qwen3tts/clone_ref.py 와 동일 규약(se_path·voice.wav·ref_text.txt). T-120."""
from __future__ import annotations
import os
import config


def parse_clone_id(se_path: str) -> str:
    """'reference_voices/<cloneId>/se.pth' -> '<cloneId>'. 마지막 디렉토리명 = cloneId."""
    parts = [p for p in se_path.replace("\\", "/").split("/") if p]
    if len(parts) < 2:
        raise ValueError(f"cannot parse clone_id from se_path: {se_path!r}")
    return parts[-2]


def ref_audio_path(clone_id: str, ref_root: str | None = None) -> str:
    """클론 reference 원본 wav. OpenVoice se.pth 와 같은 디렉토리의 voice.wav."""
    root = ref_root if ref_root is not None else config.REF_ROOT
    return os.path.join(root, clone_id, "voice.wav")


def ref_text_path(clone_id: str, ref_root: str | None = None) -> str:
    root = ref_root if ref_root is not None else config.REF_ROOT
    return os.path.join(root, clone_id, "ref_text.txt")


def load_ref_text(clone_id: str, ref_root: str | None = None) -> str | None:
    """ref_text.txt strip() 반환. 없거나 빈문자면 None (→ cross-lingual 폴백)."""
    path = ref_text_path(clone_id, ref_root)
    if not os.path.isfile(path):
        return None
    try:
        text = open(path, encoding="utf-8").read().strip()
    except OSError:
        return None
    return text if text else None
