# afterlife-server/qwen3tts/scripts/clone_ref.py
from __future__ import annotations
import os
import numpy as np
import soundfile as sf
import config


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
    VAD(침묵 제거)는 후속 — 현재는 단순 head trim(위저드 녹음은 대본 1개라 충분히 김)."""
    sec = config.REF_CLIP_MAX_SEC if max_sec is None else max_sec
    data, sr = sf.read(voice_wav, dtype="float32")
    if data.ndim > 1:
        data = data[:, 0]
    max_samples = int(sec * sr)
    return data[:max_samples], sr
