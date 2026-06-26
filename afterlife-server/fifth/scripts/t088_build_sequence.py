"""T-088 PoC: 무음 + 실응답을 단일 16kHz mono wav로 concat하는 시퀀스 빌더.

무음→발화 전환이 매끄러운지(fifth 단일 렌더 위상연속 상한) 측정하기 위한 입력 생성.
"""
import os
import json
import argparse
import subprocess

import numpy as np
import soundfile as sf

SR = 16000


def _to_16k_mono(src: str, dst: str) -> None:
    """실응답 wav를 16kHz mono PCM16으로 변환(ffmpeg). concat SR 일관성 확보."""
    subprocess.run(
        ["ffmpeg", "-y", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "wav", dst],
        check=True,
        capture_output=True,
    )


def build_sequence(speech_wavs, pattern, silence_sec, out_wav, out_meta, tmpdir):
    if not speech_wavs:
        raise ValueError("speech_wavs is empty")
    os.makedirs(tmpdir, exist_ok=True)

    chunks = []
    segments = []
    t = 0.0
    speech_i = 0

    for kind in pattern:
        if kind == "silence":
            n = int(round(silence_sec * SR))
            chunks.append(np.zeros(n, dtype=np.float32))
            dur = n / SR
            segments.append({"kind": "silence", "start": t, "end": t + dur, "src": None})
            t += dur
        elif kind == "speech":
            src = speech_wavs[speech_i % len(speech_wavs)]
            speech_i += 1
            conv = os.path.join(tmpdir, f"sp_{speech_i}.wav")
            _to_16k_mono(src, conv)
            y, sr = sf.read(conv, dtype="float32")
            if y.ndim > 1:
                y = y.mean(axis=1)
            y = y.astype(np.float32)
            dur = len(y) / SR
            chunks.append(y)
            segments.append({"kind": "speech", "start": t, "end": t + dur, "src": src})
            t += dur
        else:
            raise ValueError(f"unknown pattern kind: {kind!r}")

    out = np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)
    sf.write(out_wav, out, SR, subtype="PCM_16")

    meta = {"sr": SR, "duration": len(out) / SR, "segments": segments}
    with open(out_meta, "w") as f:
        json.dump(meta, f, indent=2)

    return {"out_wav": out_wav, "out_meta": out_meta, "duration": meta["duration"], "segments": segments}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--speech", nargs="+", required=True, help="실응답 wav 경로(들)")
    ap.add_argument("--pattern", nargs="+", default=["silence", "speech", "silence", "speech"],
                    help="silence|speech 순서")
    ap.add_argument("--silence-sec", type=float, default=10.0)
    ap.add_argument("--out-wav", default="/tmp/t088/seq.wav")
    ap.add_argument("--out-meta", default="/tmp/t088/seq.meta.json")
    ap.add_argument("--tmpdir", default="/tmp/t088/build")
    args = ap.parse_args()
    os.makedirs(os.path.dirname(args.out_wav), exist_ok=True)
    res = build_sequence(args.speech, args.pattern, args.silence_sec,
                         args.out_wav, args.out_meta, args.tmpdir)
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
