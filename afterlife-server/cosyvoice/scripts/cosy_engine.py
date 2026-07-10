"""CosyVoice2 합성 엔진 — 클론별 프롬프트 캐시(add_zero_shot_spk)로 TTFB 최소화. T-120 cosyvoice.

계약: synth(text, clone_id, voice_wav, ref_text, speed) -> wav bytes (24kHz mono PCM16).
캐시: 클론 최초 합성 시 voice.wav 앞 10s를 트림·저장하고 add_zero_shot_spk 로 프롬프트 특징
      (speech_feat/token/spk_embedding/prompt_text)을 spk2info[clone_id]에 1회 등록.
      이후 inference_zero_shot(text,'','',zero_shot_spk_id=clone_id)가 프롬프트 재처리 없이 재사용.
"""
from __future__ import annotations
import io, os, threading, logging
import numpy as np
import soundfile as sf
import config
from clone_ref import load_ref_text

log = logging.getLogger("cosyvoice")


class CosyEngine:
    def __init__(self):
        self.model = None
        self.sr = None
        self._registered: set[str] = set()   # 프롬프트 캐시된 clone_id
        self._reg_lock = threading.Lock()     # 클론 등록 직렬화
        self._synth_lock = threading.Lock()   # GPU 합성 직렬화(동시통화 음성 섞임 방지)
        os.makedirs(config.PROMPT_CACHE_DIR, exist_ok=True)

    def load(self):
        from cosyvoice.cli.cosyvoice import CosyVoice2
        self.model = CosyVoice2(config.MODEL_DIR, load_jit=False, load_trt=False, fp16=config.FP16)
        self.sr = self.model.sample_rate
        log.info("cosyvoice2 loaded: dir=%s sr=%s fp16=%s", config.MODEL_DIR, self.sr, config.FP16)

    def warmup(self):
        wc = config.WARMUP_CLONE
        if not wc:
            return
        vw = os.path.join(config.REF_ROOT, wc, "voice.wav")
        rt = load_ref_text(wc)
        if not os.path.isfile(vw):
            log.info("warmup skip: clone %s voice.wav 없음", wc)
            return
        try:
            self.synth("안녕하세요, 오늘도 좋은 하루 보내세요.", wc, vw, rt, config.DEFAULT_SPEED)
            log.info("warmup done: clone=%s", wc)
        except Exception as e:
            log.warning("warmup fail: %s", e)

    def _ensure_prompt(self, clone_id: str, voice_wav: str, ref_text: str | None):
        """클론 프롬프트 1회 등록(스레드세이프). 이미 등록됐으면 no-op."""
        if clone_id in self._registered:
            return
        with self._reg_lock:
            if clone_id in self._registered:
                return
            data, sr = sf.read(voice_wav, dtype="float32")
            if data.ndim > 1:
                data = data[:, 0]
            if data.size == 0:
                raise ValueError(f"empty voice.wav: {voice_wav!r}")
            data = data[: int(config.REF_CLIP_MAX_SEC * sr)]        # 앞 10s 트림(ref_text 정합)
            ppath = os.path.join(config.PROMPT_CACHE_DIR, f"{clone_id}_prompt.wav")
            sf.write(ppath, data, sr, format="WAV")
            # ref_text 없으면 빈문자(cross-lingual 유사) — 있으면 ICL 프롬프트 텍스트로 사용.
            self.model.add_zero_shot_spk(ref_text or "", ppath, clone_id)
            self._registered.add(clone_id)
            log.info("prompt cached: clone=%s (%.1fs, icl=%s)", clone_id, len(data) / sr, ref_text is not None)

    def synth(self, text: str, clone_id: str, voice_wav: str,
              ref_text: str | None, speed: float = 1.0) -> bytes:
        import torch
        self._ensure_prompt(clone_id, voice_wav, ref_text)
        chunks = []
        with self._synth_lock:
            for out in self.model.inference_zero_shot(
                text, "", "", zero_shot_spk_id=clone_id, stream=False, speed=speed
            ):
                chunks.append(out["tts_speech"])
        if not chunks:
            raise ValueError(f"no audio produced for clone '{clone_id}'")
        audio = torch.concat(chunks, dim=1).squeeze(0).cpu().numpy().astype(np.float32)  # [T]
        buf = io.BytesIO()
        sf.write(buf, audio, self.sr, format="WAV", subtype="PCM_16")
        return buf.getvalue()

    def synth_stream(self, text: str, clone_id: str, voice_wav: str,
                     ref_text: str | None, speed: float = 1.0):
        """청크 스트리밍 제너레이터 — 각 청크의 float32 [T] numpy 를 yield(24kHz).
        Phase 3(prethird 청크 소비)용. 현재 /tts/kr 계약은 whole-bytes 라 synth() 사용."""
        import torch
        self._ensure_prompt(clone_id, voice_wav, ref_text)
        with self._synth_lock:
            for out in self.model.inference_zero_shot(
                text, "", "", zero_shot_spk_id=clone_id, stream=True, speed=speed
            ):
                yield out["tts_speech"].squeeze(0).cpu().numpy().astype(np.float32)
