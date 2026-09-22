#!/usr/bin/env python3
"""CosyVoice2 증류 코퍼스(LJSpeech 형식) -> MB-iSTFT-VITS 학습 입력.

가비아 `/data/afterlife/tts-finetune/` 에서 돌린다.

두 가지를 맞춘다.
  1. **샘플레이트** — 코퍼스는 24kHz(CosyVoice2 출력), 베이스 체크포인트는 44.1kHz 학습본이다.
     베이스에 맞춰 업샘플링한다. 24kHz 원본이라 12kHz 이상 대역은 비어 있지만,
     사람 음성의 주요 대역은 그 아래라 화자 적응에는 충분하다.
     반대로 config 를 24kHz 로 낮추면 hop/mel 규격이 베이스와 어긋나 파인튜닝이 망가진다.
  2. **텍스트** — config 가 `cleaned_text: True` 라 filelist 에는 이미 자모로 분해된 문자열이 들어가야 한다.

`cleaners.korean_cleaners` 는 호출마다 `G2p()` 를 새로 만든다(423문장이면 못 기다린다).
여기서는 인스턴스를 하나만 만들어 같은 파이프라인을 직접 돈다.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--code", required=True)
    p.add_argument("--corpus", required=True, help="metadata.csv 와 wav/ 가 있는 폴더")
    p.add_argument("--out", required=True, help="출력 폴더")
    p.add_argument("--target-sr", type=int, default=44100)
    p.add_argument("--val", type=int, default=8, help="검증셋 개수")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    sys.path.insert(0, args.code)

    import librosa
    from g2pk2 import G2p
    from text.korean import divide_hangul, fix_g2pk2_error, latin_to_hangul

    g2p = G2p()  # 한 번만 만든다

    def clean(text: str) -> str:
        text = latin_to_hangul(text)
        text = g2p(text)
        text = divide_hangul(text)
        text = fix_g2pk2_error(text)
        # 자모로 끝나면 마침표를 붙인다(원본 cleaner 와 동일).
        return re.sub(r"([ㄱ-ㅣ])$", r"\1.", text)

    corpus = Path(args.corpus)
    out = Path(args.out)
    wav_out = out / "wav"
    wav_out.mkdir(parents=True, exist_ok=True)

    rows = []
    skipped = 0
    for line in (corpus / "metadata.csv").read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        parts = line.split("|")
        if len(parts) < 2:
            skipped += 1
            continue
        stem, text = parts[0], parts[1]
        src = corpus / "wav" / f"{stem}.wav"
        if not src.is_file():
            skipped += 1
            continue
        rows.append((stem, text, src))

    print(f"코퍼스 {len(rows)}건 (건너뜀 {skipped})")

    total_sec = 0.0
    listed = []
    for i, (stem, text, src) in enumerate(rows):
        audio, sr = sf.read(str(src), dtype="float32")
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        if sr != args.target_sr:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=args.target_sr, res_type="soxr_hq")

        # 클리핑 방지 — 리샘플링은 피크를 살짝 올릴 수 있다.
        peak = float(np.abs(audio).max())
        if peak > 0.99:
            audio = audio * (0.99 / peak)

        dst = wav_out / f"{stem}.wav"
        sf.write(str(dst), audio, args.target_sr, subtype="PCM_16")
        total_sec += len(audio) / args.target_sr

        listed.append(f"{dst}|{clean(text)}")
        if (i + 1) % 50 == 0:
            print(f"  {i + 1}/{len(rows)} …", flush=True)

    # 검증셋은 뒤에서 잘라낸다(생성 순서가 곧 주제 순서라 앞을 자르면 편향된다).
    val = listed[-args.val:]
    train = listed[: -args.val]

    (out / "train.txt.cleaned").write_text("\n".join(train) + "\n", encoding="utf-8")
    (out / "val.txt.cleaned").write_text("\n".join(val) + "\n", encoding="utf-8")

    print(f"train {len(train)} · val {len(val)} · 총 {total_sec / 60:.1f}분 @ {args.target_sr}Hz")
    print("샘플:", listed[0][:120])


if __name__ == "__main__":
    main()
