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


# ─────────────────────────────────────────────────────────────────────────────
# [2026-08-13] CosyVoice 전용 짧은 프롬프트 쌍
#
# CosyVoice2 는 종료 토큰을 못 뽑으면 max_len(= 텍스트토큰 × max_token_text_ratio 20)
# 까지 생성한다. "안녕하세요"(4토큰)면 80토큰 ÷ 25Hz = 3.20초의 의미 없는 소리가 나온다.
# inference_zero_shot 이 직접 경고하듯("synthesis text too short than prompt text"),
# **프롬프트 텍스트가 길수록 짧은 발화가 무너진다**.
#
# 실측(clone 9128, "안녕하세요" 8회):
#   ref 70.1초 / ref_text 46자 →  1.76 2.28 2.24 2.08 2.04 2.00 2.20 2.20  (재합성 잦음)
#   ref  3.2초 / ref_text 13자 →  0.92 1.80 1.24 1.00 1.08 1.24 1.16 1.08  (재합성 1회)
#
# voice.wav 를 직접 자르지 않는 이유: qwen3tts·openvoice 가 같은 파일을 쓴다(동일 규약).
# CosyVoice 전용 쌍을 따로 두고, 있으면 그걸 쓴다.
#
# 🔴 오디오와 텍스트는 **반드시 짝으로** 움직여야 한다. 한쪽만 프롬프트로 가면
# "이 텍스트가 이 오디오"라는 ICL 전제가 깨져 폭주가 오히려 심해진다. 그래서 개별
# 접근자를 두지 않고 ref_pair() 하나로만 노출한다.
PROMPT_WAV = "voice_prompt.wav"
PROMPT_TXT = "ref_prompt.txt"


def prompt_pair_paths(clone_id: str, ref_root: str | None = None) -> tuple[str, str]:
    root = ref_root if ref_root is not None else config.REF_ROOT
    return (
        os.path.join(root, clone_id, PROMPT_WAV),
        os.path.join(root, clone_id, PROMPT_TXT),
    )


def ref_pair(clone_id: str, ref_root: str | None = None) -> tuple[str, str | None]:
    """(오디오 경로, 프롬프트 텍스트) 를 **짝으로** 반환.

    짧은 프롬프트 쌍(voice_prompt.wav + ref_prompt.txt)이 **둘 다** 있고 텍스트가
    비어 있지 않으면 그것을, 아니면 기존 voice.wav + ref_text.txt 로 폴백한다.
    폴백 경로의 동작은 종전과 완전히 동일하다(회귀 0).
    """
    wav, txt = prompt_pair_paths(clone_id, ref_root)
    if os.path.isfile(wav) and os.path.isfile(txt):
        try:
            text = open(txt, encoding="utf-8").read().strip()
        except OSError:
            text = ""
        if text:
            return wav, text
    return ref_audio_path(clone_id, ref_root), load_ref_text(clone_id, ref_root)


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
