#!/usr/bin/env python
"""ref_audit — 등록된 전체 클론의 ref voice.wav 품질 일괄 점검.

prethird 의 등록 게이트(scripts/ref_quality.py)는 **신규 등록**에만 걸린다.
이미 등록된 클론은 소급되지 않으므로, 오염된 ref 를 찾으려면 이 도구로 전수 스캔한다.

배경: 클론 9104 의 ref 가 목소리가 아닌 노이즈였는데 등록이 통과했고, CosyVoice ICL 이
"짧은 텍스트 = 긴 오디오"로 학습해 폭주(과생성) → 통화 지연·음성 붕괴로 이어졌다.

지표 3종 (2026-08-06 실측 분포, 58 클론):
  char/s : ref_text 문자수 / 전사 구간 초. 정상 4.1~8.5 / 오염 9104=1.90, 9074=3.20
           → 노이즈일수록 STT 가 글자를 못 뽑아 급락. 가장 민감한 단일 지표.
  low    : 0-300Hz 에너지 비중. 정상 8~26% / 9104=33%  (저주파 노이즈 지배)
  F0     : 피치 중앙값. 한국어 화자 대략 100~250Hz / 9104=95.7Hz (목소리 대역 이탈)
2개 이상 걸리면 🔴 — 실제 청취로 확인한 오염 클론이 이 조합에 잡혔다.

실행(가비아):
  /home/afterlife/miniconda3/envs/cosyvoice-poc/bin/python ref_audit.py
  REF_ROOT=/path/to/reference_voices python ref_audit.py   # 경로 override
"""
from __future__ import annotations

import glob
import json
import os

import numpy as np
import soundfile as sf

REF_ROOT = os.environ.get(
    "REF_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)
# 프롬프트로 실제 사용되는 구간만 본다(cosy_engine.REF_CLIP_MAX_SEC 와 동일 의미).
CLIP_SEC = float(os.environ.get("REF_AUDIT_CLIP_SEC", "10"))

MIN_DENSITY = float(os.environ.get("PREBUILD_REF_MIN_CHAR_PER_SEC", "3.5"))  # 게이트와 동일 기본값
MAX_LOW_RATIO = 0.30
F0_RANGE = (100.0, 260.0)


def f0_median(y: np.ndarray, sr: int, fmin: float = 50, fmax: float = 400) -> float:
    """autocorrelation 기반 피치 중앙값. 유성 프레임이 없으면 nan."""
    n, hop = int(sr * 0.04), int(sr * 0.02)
    lo, hi = int(sr / fmax), int(sr / fmin)
    vals = []
    for i in range(0, len(y) - n, hop):
        seg = y[i:i + n] - y[i:i + n].mean()
        if np.sqrt(np.mean(seg ** 2)) < 1e-3:
            continue
        ac = np.correlate(seg, seg, mode="full")[n - 1:]
        if ac[0] <= 0:
            continue
        band = (ac / ac[0])[lo:hi]
        if band.size and band.max() > 0.3:
            vals.append(sr / (int(np.argmax(band)) + lo))
    return float(np.median(vals)) if vals else float("nan")


def density(clone_dir: str) -> float:
    """ref_text 문자밀도(char/s). 메타가 없거나 duration 0 이면 nan."""
    try:
        with open(os.path.join(clone_dir, "ref_text.meta.json"), encoding="utf-8") as f:
            m = json.load(f)
        dur = float(m.get("duration_sec") or 0)
        chars = float(m.get("non_space_len") or 0)
        return chars / dur if dur > 0 else float("nan")
    except (OSError, ValueError, TypeError):
        return float("nan")


def audit_one(path: str) -> tuple:
    y, sr = sf.read(path, dtype="float32")
    if y.ndim > 1:
        y = y.mean(axis=1)
    seg = y[:int(CLIP_SEC * sr)]
    if seg.size < sr:  # 1초 미만은 분석 의미 없음
        return float("nan"), float("nan"), float("nan")
    spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
    freq = np.fft.rfftfreq(len(seg), 1 / sr)
    total = spec.sum()
    low = float(spec[freq < 300].sum() / total) if total > 0 else float("nan")
    return low, f0_median(seg, sr), float(np.sqrt(np.mean(seg ** 2)))


def main() -> None:
    rows = []
    for wav in sorted(glob.glob(os.path.join(REF_ROOT, "*", "voice.wav"))):
        clone_dir = os.path.dirname(wav)
        clone = os.path.basename(clone_dir)
        try:
            low, f0, rms = audit_one(wav)
        except Exception as e:                                    # 손상 파일도 목록엔 남긴다
            rows.append((float("nan"), clone, float("nan"), float("nan"), f"읽기 실패: {e}"))
            continue
        dens = density(clone_dir)
        flags = []
        if not np.isnan(dens) and dens < MIN_DENSITY:
            flags.append("밀도↓")
        if not np.isnan(low) and low > MAX_LOW_RATIO:
            flags.append("저주파↑")
        if not np.isnan(f0) and not (F0_RANGE[0] <= f0 <= F0_RANGE[1]):
            flags.append("F0이상")
        verdict = ("🔴 " if len(flags) >= 2 else "🟡 ") + "+".join(flags) if flags else "ok"
        rows.append((dens, clone, low, f0, verdict))

    rows.sort(key=lambda r: (np.isnan(r[0]), r[0]))
    print(f"REF_ROOT={REF_ROOT}  (앞 {CLIP_SEC:.0f}s 분석, 임계 char/s={MIN_DENSITY})")
    print(f"{'clone':<14}{'char/s':>8}{'low(0-300)':>12}{'F0':>9}   판정")
    print("-" * 62)
    bad = 0
    for dens, clone, low, f0, verdict in rows:
        if verdict.startswith("🔴"):
            bad += 1
        print(f"{clone:<14}{dens:8.2f}{low:11.0%}{f0:9.1f}   {verdict}")
    print("-" * 62)
    print(f"총 {len(rows)}개 / 🔴 {bad}개 — 🔴 는 ref 재등록 검토 대상")


if __name__ == "__main__":
    main()
