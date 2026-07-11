#!/usr/bin/env python3
"""CosyVoice2 한국어 품질·지연 A/B 벤치 (Phase 1 GO/NO-GO) — T-120 cosyvoice.

목적: 최신 통화 클론(기본 9075)의 참조음성으로 동일 한국어 문장을
  (A) CosyVoice2-0.5B (zero-shot ICL, GPU1)
  (B) 현행 Qwen3-TTS 어댑터(127.0.0.1:8201, 프로덕션 경로)
로 합성해 비교. 각 엔진의 TTFB/총합성/RTF 계측 + wav 저장(히즈키 청취용).

CosyVoice2는 스트리밍(stream=True)으로 첫 청크 지연(TTFB)을 직접 계측한다.
Qwen3-TTS는 blocking bytes 계약이라 총합성=TTFB(청크 없음), X-Synth-Ms 헤더 병기.

실행(가비아, cosyvoice-poc conda env):
  source /home/afterlife/miniconda3/etc/profile.d/conda.sh && conda activate cosyvoice-poc
  export PYTHONPATH=/home/afterlife/cosyvoice-poc/repo:/home/afterlife/cosyvoice-poc/repo/third_party/Matcha-TTS
  CUDA_VISIBLE_DEVICES=1 python bench_korean.py --clone 9075
"""
import argparse, json, time, io, wave, urllib.request, sys, os
from pathlib import Path

# ── 통화 맥락 한국어 테스트 문장 (자연성/받침/감정/숫자읽기 고루) ──
SENTENCES = [
    "여보세요, 잘 지냈어? 목소리 들으니까 정말 반갑다.",              # 인사·감정
    "요즘 밥은 잘 챙겨 먹고 다니는 거지? 끼니 거르지 말고.",          # 질문·받침
    "그때 우리 같이 갔던 바닷가 기억나? 노을이 참 예뻤잖아.",         # 회상·프로소디
    "걱정 마, 나는 여기서 항상 너를 지켜보고 있으니까.",             # 위로·장문
    "오늘 날짜가 칠월 십일이지? 벌써 시간이 이렇게 됐네.",           # 숫자·읽기정확도
]

POC = Path("/home/afterlife/cosyvoice-poc")
REF_ROOT = Path("/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices")
CV2_MODEL = POC / "pretrained_models" / "CosyVoice2-0.5B"

def wav_duration_from_bytes(b: bytes) -> float:
    with wave.open(io.BytesIO(b), "rb") as w:
        return w.getnframes() / float(w.getframerate())

def run_cosyvoice(clone: str, outdir: Path, ref_sec: float = 10.0) -> list:
    import torch, torchaudio
    from cosyvoice.cli.cosyvoice import CosyVoice2

    ref_dir = REF_ROOT / clone
    prompt_full = ref_dir / "voice.wav"
    ref_text = (ref_dir / "ref_text.txt").read_text(encoding="utf-8").strip()
    # ref_text 는 voice.wav 첫 10s 전사(ref_text.meta.json duration_sec=10) → 프롬프트도 첫 10s 트림해
    # prompt_wav↔prompt_text 정합 확보(qwen3tts REF_CLIP_MAX_SEC=10 와 동일 조건 → 공정 A/B).
    wav, sr_in = torchaudio.load(str(prompt_full))
    prompt_wav = outdir / f"prompt{int(ref_sec)}s_{clone}.wav"
    torchaudio.save(str(prompt_wav), wav[:, : int(ref_sec * sr_in)], sr_in)
    print(f"[CV2] prompt={prompt_wav} (첫 {ref_sec}s of {prompt_full}, {sr_in}Hz), ref_text={ref_text[:40]!r}")

    t0 = time.time()
    cosyvoice = CosyVoice2(str(CV2_MODEL), load_jit=False, load_trt=False, fp16=False)
    sr = cosyvoice.sample_rate
    print(f"[CV2] model loaded in {time.time()-t0:.1f}s, sample_rate={sr}")

    # 이 포크의 inference_zero_shot(tts_text, prompt_text, prompt_wav=PATH, ...) — prompt_wav 는 파일경로.
    pw = str(prompt_wav)
    # 워밍업(첫 호출 지연 제외): 실문장 1회
    for _ in cosyvoice.inference_zero_shot(SENTENCES[0], ref_text, pw, stream=False):
        break

    rows = []
    for i, text in enumerate(SENTENCES):
        chunks, ttfb, n = [], None, 0
        t_start = time.time()
        for out in cosyvoice.inference_zero_shot(text, ref_text, pw, stream=True):
            if ttfb is None:
                ttfb = time.time() - t_start
            chunks.append(out["tts_speech"])
            n += 1
        total = time.time() - t_start
        audio = torch.concat(chunks, dim=1)
        dur = audio.shape[1] / sr
        fp = outdir / f"cv2_{clone}_{i:02d}.wav"
        torchaudio.save(str(fp), audio, sr)
        rtf = total / dur if dur else 0
        rows.append(dict(engine="cosyvoice2", idx=i, text=text, ttfb_ms=round(ttfb*1000, 1),
                         total_ms=round(total*1000, 1), audio_s=round(dur, 2),
                         rtf=round(rtf, 3), chunks=n, wav=fp.name))
        print(f"[CV2] #{i} ttfb={ttfb*1000:.0f}ms total={total*1000:.0f}ms dur={dur:.2f}s rtf={rtf:.3f} chunks={n}")
    del cosyvoice
    torch.cuda.empty_cache()
    return rows

def run_qwen3(clone: str, outdir: Path) -> list:
    url = "http://127.0.0.1:8201/tts/kr"
    rows = []
    # 워밍업(prompt 캐시 빌드 지연 제외 — CV2 워밍업과 공정성 맞춤)
    try:
        wb = json.dumps({"text": "안녕하세요.", "clone_id": clone,
                         "se_path": f"reference_voices/{clone}/se.pth"}).encode()
        urllib.request.urlopen(urllib.request.Request(url, data=wb,
                               headers={"Content-Type": "application/json"}), timeout=120).read()
        print("[QWEN] warmup done")
    except Exception as e:
        print(f"[QWEN] warmup fail: {e}")
    for i, text in enumerate(SENTENCES):
        body = json.dumps({"text": text, "clone_id": clone,
                           "se_path": f"reference_voices/{clone}/se.pth"}).encode()
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
        t_start = time.time()
        try:
            resp = urllib.request.urlopen(req, timeout=120)
            wav = resp.read()
            total = time.time() - t_start
            synth_ms = resp.headers.get("X-Synth-Ms")
        except Exception as e:
            print(f"[QWEN] #{i} FAIL: {e}")
            rows.append(dict(engine="qwen3tts", idx=i, text=text, error=str(e)))
            continue
        dur = wav_duration_from_bytes(wav)
        fp = outdir / f"qwen_{clone}_{i:02d}.wav"
        fp.write_bytes(wav)
        rtf = total / dur if dur else 0
        rows.append(dict(engine="qwen3tts", idx=i, text=text, ttfb_ms=round(total*1000, 1),
                         total_ms=round(total*1000, 1), synth_ms=synth_ms, audio_s=round(dur, 2),
                         rtf=round(rtf, 3), wav=fp.name))
        print(f"[QWEN] #{i} total={total*1000:.0f}ms (synth_hdr={synth_ms}) dur={dur:.2f}s rtf={rtf:.3f}")
    return rows

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clone", default="9075")
    ap.add_argument("--out", default=str(POC / "bench_out"))
    ap.add_argument("--engines", default="cv2,qwen", help="쉼표구분: cv2,qwen")
    args = ap.parse_args()

    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    engines = args.engines.split(",")

    results = {"clone": args.clone, "sentences": SENTENCES, "rows": []}
    if "qwen" in engines:
        print("=== Qwen3-TTS (baseline, :8201) ===")
        results["rows"] += run_qwen3(args.clone, outdir)
    if "cv2" in engines:
        print("=== CosyVoice2-0.5B (GPU1) ===")
        results["rows"] += run_cosyvoice(args.clone, outdir)

    mp = outdir / f"metrics_{args.clone}.json"
    mp.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n=== metrics -> {mp} ===")
    # 요약표
    def agg(eng):
        r = [x for x in results["rows"] if x.get("engine") == eng and "rtf" in x]
        if not r: return None
        return (sum(x["ttfb_ms"] for x in r)/len(r), sum(x["rtf"] for x in r)/len(r))
    for eng in ("cosyvoice2", "qwen3tts"):
        a = agg(eng)
        if a: print(f"  {eng:12s} avg TTFB={a[0]:.0f}ms  avg RTF={a[1]:.3f}")

if __name__ == "__main__":
    main()
