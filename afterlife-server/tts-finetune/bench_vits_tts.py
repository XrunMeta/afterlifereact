#!/usr/bin/env python3
"""AFL-737 서버 VITS 합성 속도 실측.

두 런타임을 같은 모델·같은 문장으로 잰다.
  sherpa  = sherpa-onnx (al-3dtest 방식)
  ort     = onnxruntime 직접 (T-705 지호 방식)
오디오는 저장하지 않는다(생체 파생 데이터).
"""
import statistics
import sys
import time

import numpy as np

CODE = "/data/afterlife/tts-finetune/code"
CONFIG = "/data/afterlife/tts-finetune/config_9053.json"
ONNX = "/data/afterlife/tts-serve/voices/9053/model.onnx"
TOKENS = "/data/afterlife/tts-serve/voices/9053/tokens.txt"

TEXTS = {
    "짧은(약3초)": "안녕하세요. 오늘 하루는 어땠어요?",
    "중간(약5초)": "오랜만에 목소리 들으니까 정말 반갑네요. 요즘 밥은 잘 챙겨 먹고 있어요?",
    "긴(약10초)": "오늘은 아침부터 비가 와서 조금 쌀쌀했죠. 그래도 창밖으로 비 내리는 소리를 들으니까 "
                  "옛날에 같이 산책하던 생각이 나더라고요. 다음에는 날 좋을 때 꼭 같이 걸어요.",
}
THREADS = [1, 2, 4, 8, 16]
REPEAT = 5

sys.path.insert(0, CODE)
import commons  # noqa: E402
import utils  # noqa: E402
from text import _clean_text, text_to_sequence  # noqa: E402

hps = utils.get_hparams_from_file(CONFIG)
SR = int(hps.data.sampling_rate)


def summarize(times):
    s = sorted(times)
    p95 = s[min(len(s) - 1, int(round(0.95 * (len(s) - 1))))]
    return statistics.median(s), p95


def bench_sherpa(threads, jamo_by_label):
    import sherpa_onnx

    t0 = time.perf_counter()
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=ONNX, tokens=TOKENS, lexicon="", data_dir=""),
            provider="cpu", num_threads=threads)))
    load = time.perf_counter() - t0
    rows = []
    first = True
    for label, jamo in jamo_by_label.items():
        t = time.perf_counter()
        r = tts.generate(jamo, sid=0, speed=1.0)
        cold = time.perf_counter() - t
        dur = len(r.samples) / r.sample_rate
        times = []
        for _ in range(REPEAT):
            t = time.perf_counter()
            tts.generate(jamo, sid=0, speed=1.0)
            times.append(time.perf_counter() - t)
        med, p95 = summarize(times)
        rows.append((label, dur, (load + cold) if first else None, med, p95))
        first = False
    return rows


def bench_ort(threads, seq_by_label):
    import onnxruntime as ort

    so = ort.SessionOptions()
    so.intra_op_num_threads = threads
    so.inter_op_num_threads = 1
    t0 = time.perf_counter()
    sess = ort.InferenceSession(ONNX, sess_options=so, providers=["CPUExecutionProvider"])
    load = time.perf_counter() - t0

    def run(seq):
        x = np.array([seq], dtype=np.int64)
        return sess.run(["y"], {
            "x": x, "x_length": np.array([x.shape[1]], dtype=np.int64),
            "noise_scale": np.array([0.667], dtype=np.float32),
            "length_scale": np.array([1.0], dtype=np.float32),
            "noise_scale_w": np.array([0.8], dtype=np.float32)})[0]

    rows = []
    first = True
    for label, seq in seq_by_label.items():
        t = time.perf_counter()
        y = run(seq)
        cold = time.perf_counter() - t
        dur = y.size / SR
        times = []
        for _ in range(REPEAT):
            t = time.perf_counter()
            run(seq)
            times.append(time.perf_counter() - t)
        med, p95 = summarize(times)
        rows.append((label, dur, (load + cold) if first else None, med, p95))
        first = False
    return rows


def main():
    # 전처리(g2pk2 Python) 시간 — 앱은 JS(hangul.ts / g2pk-js)라 참고치
    jamo_by_label, seq_by_label = {}, {}
    for label, text in TEXTS.items():
        t = time.perf_counter()
        jamo = _clean_text(text, hps.data.text_cleaners)
        g2p = time.perf_counter() - t
        seq = text_to_sequence(text, hps.data.text_cleaners)
        if hps.data.add_blank:
            seq = commons.intersperse(seq, 0)
        jamo_by_label[label], seq_by_label[label] = jamo, seq
        print(f"# 전처리 {label}: {g2p * 1000:.0f}ms (첫 호출은 사전 로드 포함)")

    print("runtime\tthreads\t문장\t오디오s\t첫합성(로드포함)s\tp50s\tp95s\tRTF(p50)")
    for runtime, fn, inp in (("sherpa", bench_sherpa, jamo_by_label), ("ort", bench_ort, seq_by_label)):
        for th in THREADS:
            for label, dur, cold, med, p95 in fn(th, inp):
                c = f"{cold:.3f}" if cold is not None else "-"
                print(f"{runtime}\t{th}\t{label}\t{dur:.2f}\t{c}\t{med:.3f}\t{p95:.3f}\t{med / dur:.3f}", flush=True)


if __name__ == "__main__":
    main()
