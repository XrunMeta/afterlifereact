"""무음 구간에서 입을 다물게 한다 (MuseTalk Whisper 특징 치환).

MuseTalk 는 답변 오디오 전체(문장 끝 tail silence 포함)를 프레임마다 입모양으로 만든다.
무음의 Whisper 특징도 입을 오물거리게 만들어, 말이 끝났는데 입이 계속 움직였다.

프레임별로 "말하는 중인지"를 진폭 히스테리시스로 판정하고, 무음 프레임의 특징을
"입을 실제로 닫은 프레임들에서 뽑은 기준 특징"으로 섞는다. idle 프레임으로 갈아끼우지 않으므로
입 질감이 튀지 않는다(구세대 테스트 서버 musetalk_server.py MUSE_VAD_MODE=feature 이식).

환경변수
  PRETHIRD_SILENT_MOUTH=1           켜기(기본 끔)
  PRETHIRD_SILENT_MOUTH_REF         기준 특징 .pt (기본 prethird/assets/closed_mouth_pad2.pt)

기준 특징 모양은 렌더러의 audio padding 에 묶인다. 지금 padding 2+2 → (2×5 시점 × 5 층, 384) = (50,384).
옛 closed_mouth.pt 는 padding 1+1 시절 (30,384) 라 매 턴 "모양 불일치 — 건너뜀" 이었다(2026-10-26).
closed_mouth_pad2.pt 는 그 층별 평균을 10 시점으로 복제한 것이다. padding 을 바꾸면 이 파일도 다시 만든다.
  PRETHIRD_SILENT_MOUTH_LO/HI       무음/말 진폭 문턱 (기본 0.015 / 0.05)
  PRETHIRD_SILENT_MOUTH_START/END   말 시작/끝 판정에 필요한 연속 프레임 (기본 2 / 3)
  PRETHIRD_SILENT_MOUTH_MINSIL      이보다 짧은 무음은 말로 본다(음소 사이) (기본 5)
  PRETHIRD_SILENT_MOUTH_FADE        전환 이완 프레임 (기본 2)
"""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np

_DEFAULT_REF = str(Path(__file__).resolve().parents[1] / "assets" / "closed_mouth_pad2.pt")
_ref_cache: dict = {}

def enabled() -> bool:
    return os.environ.get("PRETHIRD_SILENT_MOUTH", "0") == "1"

def _env_f(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except ValueError:
        return default

def speech_alpha(amp: np.ndarray, lo: float = 0.015, hi: float = 0.05, start: int = 2,
                 end: int = 3, min_sil: int = 5, fade: int = 2) -> np.ndarray:
    """프레임별 최대 진폭 → 말하기 가중치(1=말, 0=무음, 전환부 코사인 이완)."""
    n = len(amp)
    spk = np.zeros(n, dtype=bool)
    state, run = False, 0
    for k in range(n):
        if state:
            run = run + 1 if amp[k] < lo else 0
            if run >= end:
                state, run = False, 0
        else:
            run = run + 1 if amp[k] > hi else 0
            if run >= start:
                state, run = True, 0
        spk[k] = state

    # 짧은 무음(음소 사이 공백)은 말로 되돌린다. 처음·끝 무음은 건드리지 않는다.
    k = 0
    while k < n:
        if spk[k]:
            k += 1
            continue
        j = k
        while j < n and not spk[j]:
            j += 1
        if 0 < k and j < n and (j - k) < min_sil:
            spk[k:j] = True
        k = j

    al = spk.astype(np.float32)
    out = al.copy()
    for k in range(1, n):
        if al[k] != al[k - 1]:
            a0, a1 = max(0, k - fade 
            if a1 - a0 > 1:
                w = 0.5 - 0.5 * np.cos(np.pi * np.linspace(0.0, 1.0, a1 - a0))
                out[a0:a1] = al[a0] * (1 - w) + al[a1 - 1] * w
    return np.clip(out, 0.0, 1.0)

def frame_amplitudes(y: np.ndarray, sr: int, fps: float, n_frames: int) -> np.ndarray:
    hop = max(1, int(sr / fps))
    amp = np.zeros(n_frames, dtype=np.float32)
    for k in range(n_frames):
        a, b = k * hop, min(len(y), (k + 1) * hop)
        if b > a:
            amp[k] = float(np.abs(y[a:b]).max())
    return amp

def apply(whisper_chunks, audio_path: str, fps: float):
    """whisper_chunks(torch [N, ...]) 의 무음 프레임을 입 다문 기준 특징으로 섞어 반환.

    끔·실패·모양 불일치면 원본을 그대로 돌려준다(통화를 막지 않는다).
    """
    if not enabled():
        return whisper_chunks
    try:
        import librosa
        import torch

        ref_path = os.environ.get("PRETHIRD_SILENT_MOUTH_REF", _DEFAULT_REF)
        ref = _ref_cache.get(ref_path)
        if ref is None:
            ref = torch.load(ref_path, weights_only=False)
            _ref_cache[ref_path] = ref
        if tuple(ref.shape) != tuple(whisper_chunks.shape[1:]):
            print(f"[silent_mouth] 기준 특징 모양 불일치 {tuple(ref.shape)} vs {tuple(whisper_chunks.shape[1:])} — 건너뜀")
            return whisper_chunks

        n = len(whisper_chunks)
        y, sr = librosa.load(audio_path, sr=16000, mono=True)
        al = speech_alpha(
            frame_amplitudes(y, sr, fps, n),
            lo=_env_f("PRETHIRD_SILENT_MOUTH_LO", 0.015),
            hi=_env_f("PRETHIRD_SILENT_MOUTH_HI", 0.05),
            start=max(1, int(_env_f("PRETHIRD_SILENT_MOUTH_START", 2))),
            end=max(1, int(_env_f("PRETHIRD_SILENT_MOUTH_END", 3))),
            min_sil=max(1, int(_env_f("PRETHIRD_SILENT_MOUTH_MINSIL", 5))),
            fade=max(1, int(_env_f("PRETHIRD_SILENT_MOUTH_FADE", 2))),
        )
        a = torch.tensor(al, dtype=whisper_chunks.dtype, device=whisper_chunks.device)
        a = a.view(-1, *([1] * (whisper_chunks.dim() - 1)))
        ref = ref.to(device=whisper_chunks.device, dtype=whisper_chunks.dtype)
        print(f"[silent_mouth] 무음 {int((al < 0.5).sum())}/{n} 프레임 입 다묾")
        return whisper_chunks * a + ref.unsqueeze(0) * (1.0 - a)
    except Exception as exc:  # 통화는 계속 — 입 다물기만 포기
        print(f"[silent_mouth] 실패, 원본 사용: {exc}")
        return whisper_chunks
