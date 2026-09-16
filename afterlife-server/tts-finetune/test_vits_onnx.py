#!/usr/bin/env python3
"""export 한 VITS ONNX 가 실제로 한국어를 말하는지 확인한다.

두 가지를 따로 본다.
  1. ONNX Runtime 직접 추론 — export 자체가 맞았는가 (오디오가 나오는가)
  2. sherpa-onnx 로드 — 앱이 쓸 런타임이 이 모델을 받아들이는가

2가 막혀도 1이 되면 모델은 살아 있는 것이고, 런타임 경로만 바꾸면 된다.
"""
from __future__ import annotations

import argparse
import sys
import time
import wave
from pathlib import Path

import numpy as np


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--code", required=True)
    p.add_argument("--config", required=True)
    p.add_argument("--onnx", required=True)
    p.add_argument("--tokens", required=True)
    p.add_argument("--text", default="안녕하세요. 오늘 하루는 어땠어요?")
    p.add_argument("--out", default="onnx_probe.wav")
    return p.parse_args()


def write_wav(path: str, audio: np.ndarray, sample_rate: int) -> None:
    audio = np.clip(audio, -1.0, 1.0)
    pcm = (audio * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm.tobytes())


def main() -> None:
    args = parse_args()
    sys.path.insert(0, args.code)

    import commons
    import utils
    from text import text_to_sequence

    hps = utils.get_hparams_from_file(args.config)
    sample_rate = int(hps.data.sampling_rate)

    # ── 1. ONNX Runtime 직접 추론 ────────────────────────────────────────────
    import onnxruntime as ort

    session = ort.InferenceSession(args.onnx, providers=["CPUExecutionProvider"])
    print("입력:", [(i.name, i.shape) for i in session.get_inputs()])
    print("출력:", [(o.name, o.shape) for o in session.get_outputs()])
    meta = session.get_modelmeta().custom_metadata_map
    print("메타:", {k: meta[k] for k in sorted(meta)})

    sequence = text_to_sequence(args.text, hps.data.text_cleaners)
    if hps.data.add_blank:
        sequence = commons.intersperse(sequence, 0)
    x = np.array([sequence], dtype=np.int64)

    started = time.time()
    y = session.run(
        ["y"],
        {
            "x": x,
            "x_length": np.array([x.shape[1]], dtype=np.int64),
            "noise_scale": np.array([0.667], dtype=np.float32),
            "length_scale": np.array([1.0], dtype=np.float32),
            "noise_scale_w": np.array([0.8], dtype=np.float32),
        },
    )[0]
    elapsed = time.time() - started

    audio = y.squeeze()
    duration = len(audio) / sample_rate
    write_wav(args.out, audio, sample_rate)

    print()
    print(f"[ORT] 토큰 {x.shape[1]} → 오디오 {duration:.2f}s · {elapsed:.2f}s 소요 "
          f"· RTF {elapsed / max(duration, 1e-9):.3f}")
    print(f"[ORT] 진폭 min {audio.min():.3f} max {audio.max():.3f} RMS {np.sqrt((audio ** 2).mean()):.4f}")
    if duration < 0.3:
        print("⚠️ 오디오가 너무 짧다 — 그래프가 잘못 굳었을 가능성")
    if float(np.abs(audio).max()) < 0.01:
        print("⚠️ 사실상 무음 — export 가 틀렸다")
    print(f"[ORT] 저장: {args.out}")

    # ── 2. sherpa-onnx 로드 ──────────────────────────────────────────────────
    print()
    try:
        import sherpa_onnx

        config = sherpa_onnx.OfflineTtsConfig(
            model=sherpa_onnx.OfflineTtsModelConfig(
                vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                    model=args.onnx,
                    tokens=args.tokens,
                    lexicon="",
                    data_dir="",
                ),
                provider="cpu",
                num_threads=2,
            )
        )
        tts = sherpa_onnx.OfflineTts(config)
        print(f"[sherpa] 로드 성공 · sample_rate {tts.sample_rate} · speakers {tts.num_speakers}")

        # sherpa-onnx 는 tokens.txt 로 문자→id 를 만든다.
        # korean_cleaners 가 만드는 자모 문자열을 그대로 넣어야 한다.
        from text import _clean_text

        jamo = _clean_text(args.text, hps.data.text_cleaners)
        print(f"[sherpa] 자모 입력: {jamo!r}")

        started = time.time()
        result = tts.generate(jamo, sid=0, speed=1.0)
        elapsed = time.time() - started
        sherpa_audio = np.array(result.samples, dtype=np.float32)
        sherpa_dur = len(sherpa_audio) / result.sample_rate

        if sherpa_dur < 0.05:
            print("⚠️ [sherpa] 오디오가 비었다 — 토큰 매핑이 안 맞는다")
        else:
            out2 = str(Path(args.out).with_name("sherpa_" + Path(args.out).name))
            write_wav(out2, sherpa_audio, result.sample_rate)
            print(f"[sherpa] 오디오 {sherpa_dur:.2f}s · {elapsed:.2f}s · RTF {elapsed / sherpa_dur:.3f}")
            print(f"[sherpa] 저장: {out2}")
    except Exception as exc:  # noqa: BLE001
        print(f"[sherpa] 실패: {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    main()
