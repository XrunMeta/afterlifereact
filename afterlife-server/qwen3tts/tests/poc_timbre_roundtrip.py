"""
timbre 디스크 직렬화 PoC — Qwen3-TTS-1.7B-Base
============================================================
목적: create_voice_clone_prompt() 반환 객체를 torch.save/load 한 뒤
      양쪽으로 합성한 wav 가 같은 음색인지 검증한다.
      timbre 직렬화는 Qwen3 공식 미보장이므로 이 PoC 로 먼저 확인한다.

실행법 (가비아 GPU 서버에서):
    CUDA_VISIBLE_DEVICES=0 python tests/poc_timbre_roundtrip.py

    # 다른 클론으로 시험하려면:
    QWEN3TTS_POC_CLONE=gomin CUDA_VISIBLE_DEVICES=0 python tests/poc_timbre_roundtrip.py

주의:
    - 로컬(GPU/qwen_tts 없음) 에서는 ImportError. 가비아에서만 실행할 것.
    - voice.wav 는 REF_ROOT/<clone>/voice.wav 경로에 있어야 한다.
    - numpy 상관계수(corr) 가 > 0.95 이면 음색 동일 판정.
"""
from __future__ import annotations
import os, sys, pathlib, time
import numpy as np

# scripts/ 에 있는 모듈 임포트
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

import config
from clone_ref import ref_audio_path, extract_ref_clip


def load_ref_text(clone_id: str, ref_root: str | None = None) -> str | None:
    """ref_text.txt 를 읽어 strip() 반환. 파일 없거나 내용이 빈 문자열이면 None."""
    root = ref_root if ref_root is not None else config.REF_ROOT
    path = os.path.join(root, clone_id, "ref_text.txt")
    if not os.path.isfile(path):
        return None
    try:
        text = open(path, encoding="utf-8").read().strip()
    except OSError:
        return None
    return text if text else None

# ── 설정 ────────────────────────────────────────────────────────────────────
CLONE_ID   = os.environ.get("QWEN3TTS_POC_CLONE", "halbae")
SAVE_PATH  = "/tmp/poc.timbre.pt"
TEST_TEXT  = "안녕하세요. 이것은 timbre 직렬화 검증 테스트입니다."
LANGUAGE   = config.LANGUAGE


def load_model():
    import torch
    from qwen_tts import Qwen3TTSModel
    print(f"[PoC] 모델 로드: {config.MODEL_NAME} on {config.DEVICE}")
    model = Qwen3TTSModel.from_pretrained(
        config.MODEL_NAME,
        device_map=config.DEVICE,
        dtype=torch.bfloat16,
        attn_implementation=config.ATTN_IMPL,
    )
    return model


def synth_wav(model, prompt, text: str) -> np.ndarray:
    wavs, sr = model.generate_voice_clone(
        text=text, language=LANGUAGE, voice_clone_prompt=prompt,
    )
    return np.array(wavs[0]), sr


def run_roundtrip(model, ref_audio, ref_text, label: str):
    import torch
    print(f"\n{'='*60}")
    print(f"[PoC] {label}")
    print(f"  x_vector_only_mode = {ref_text is None}")
    print(f"  ref_text = {repr(ref_text[:30]) if ref_text else None}")

    # 1) prompt 생성
    t0 = time.time()
    prompt_orig = model.create_voice_clone_prompt(
        ref_audio=ref_audio,
        ref_text=ref_text,
        x_vector_only_mode=(ref_text is None),
    )
    print(f"  create_voice_clone_prompt elapsed: {(time.time()-t0)*1000:.0f}ms")

    # 2) prompt 타입 정보 출력
    print(f"  type(prompt) = {type(prompt_orig)}")
    print(f"  dir(prompt)  = {[k for k in dir(prompt_orig) if not k.startswith('__')]}")
    try:
        print(f"  prompt.__dict__ keys = {list(prompt_orig.__dict__.keys())}")
    except AttributeError:
        print("  (no __dict__)")

    # 3) 저장 & 로드
    print(f"  torch.save → {SAVE_PATH}")
    torch.save(prompt_orig, SAVE_PATH)
    prompt_loaded = torch.load(SAVE_PATH, weights_only=False)
    print(f"  torch.load  OK. type={type(prompt_loaded)}")

    # 4) 양쪽으로 합성
    wav_orig,   sr = synth_wav(model, prompt_orig,   TEST_TEXT)
    wav_loaded, _  = synth_wav(model, prompt_loaded, TEST_TEXT)
    print(f"  wav_orig   bytes={wav_orig.nbytes},  len={len(wav_orig)}")
    print(f"  wav_loaded bytes={wav_loaded.nbytes}, len={len(wav_loaded)}")

    # 5) 상관계수로 음색 동일성 판정
    min_len = min(len(wav_orig), len(wav_loaded))
    if min_len > 0:
        corr = float(np.corrcoef(wav_orig[:min_len], wav_loaded[:min_len])[0, 1])
        verdict = "PASS (>0.95)" if corr > 0.95 else "FAIL (<0.95)"
        print(f"  numpy corr = {corr:.4f}  → {verdict}")
    else:
        print("  (wav 길이 0 — 합성 실패)")

    # 6) 선택: wav 저장
    out_orig   = f"/tmp/poc_{label.replace(' ','_')}_orig.wav"
    out_loaded = f"/tmp/poc_{label.replace(' ','_')}_loaded.wav"
    import soundfile as sf
    sf.write(out_orig,   wav_orig,   sr, format="WAV", subtype="PCM_16")
    sf.write(out_loaded, wav_loaded, sr, format="WAV", subtype="PCM_16")
    print(f"  saved: {out_orig}")
    print(f"  saved: {out_loaded}")


def main():
    voice_wav = ref_audio_path(CLONE_ID)
    if not os.path.isfile(voice_wav):
        print(f"[PoC] ERROR: voice.wav 없음: {voice_wav}")
        sys.exit(1)

    print(f"[PoC] clone={CLONE_ID}  voice_wav={voice_wav}")
    ref_audio = extract_ref_clip(voice_wav)  # (clip_ndarray, sr)
    ref_text  = load_ref_text(CLONE_ID)

    model = load_model()

    # ICL 모드 (ref_text 있는 경우)
    if ref_text:
        run_roundtrip(model, ref_audio, ref_text, label="ICL mode (ref_text)")
    else:
        print(f"\n[PoC] ref_text.txt 없음 — ICL 라운드트립 스킵")

    # x_vector_only 모드 (ref_text=None)
    run_roundtrip(model, ref_audio, None, label="x_vector_only mode")

    print("\n[PoC] 완료.")


if __name__ == "__main__":
    main()
