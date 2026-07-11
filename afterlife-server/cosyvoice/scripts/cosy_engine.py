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
        if config.SAMPLING_TOP_K > 0:
            self._set_sampling(config.SAMPLING_TOP_K)
            log.info("sampling override: top_p=%s top_k=%s (fallback top_k=%s)",
                     config.SAMPLING_TOP_P, config.SAMPLING_TOP_K, config.RAMBLE_FALLBACK_TOP_K)
        log.info("cosyvoice2 loaded: dir=%s sr=%s fp16=%s", config.MODEL_DIR, self.sr, config.FP16)

    def _set_sampling(self, top_k: int):
        """LLM 샘플링 top_k 교체(폭주 저감). _synth_lock 내에서만 호출(레이스 방지)."""
        import functools
        from cosyvoice.utils.common import ras_sampling
        # CosyVoice2 래퍼는 실제 LLM을 self.model(CosyVoice2Model) 안에 둔다 → .model.model.llm
        self.model.model.llm.sampling = functools.partial(
            ras_sampling, top_p=config.SAMPLING_TOP_P, top_k=top_k, win_size=10, tau_r=0.1)

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
            # 프롬프트 끝 무음 패딩 → 하드컷 경계 아티팩트("똥" 선행 환청) 제거 + 과생성 완화.
            # 실측(5회): 뒤침묵 없으면 lead-RMS 1607(아티팩트), 있으면 16(클린). ref_text 는 길이불변.
            if config.PROMPT_TAIL_SILENCE_MS > 0:
                tail = np.zeros(int(config.PROMPT_TAIL_SILENCE_MS / 1000 * sr), dtype=data.dtype)
                data = np.concatenate([data, tail])
            ppath = os.path.join(config.PROMPT_CACHE_DIR, f"{clone_id}_prompt.wav")
            sf.write(ppath, data, sr, format="WAV")
            # ref_text 없으면 빈문자(cross-lingual 유사) — 있으면 ICL 프롬프트 텍스트로 사용.
            self.model.add_zero_shot_spk(ref_text or "", ppath, clone_id)
            self._registered.add(clone_id)
            log.info("prompt cached: clone=%s (%.1fs, icl=%s)", clone_id, len(data) / sr, ref_text is not None)

    def _synth_once(self, text: str, clone_id: str, speed: float, top_k: int | None = None):
        """1회 합성 → float32 [T] numpy (빈 텍스트면 None). GPU 직렬화.
        top_k 지정 시 이 합성만 해당 샘플링 사용(폭주 재합성 폴백용)·이후 기본값 복원."""
        import torch
        chunks = []
        with self._synth_lock:
            if top_k is not None and config.SAMPLING_TOP_K > 0:
                self._set_sampling(top_k)
            try:
                for out in self.model.inference_zero_shot(
                    text, "", "", zero_shot_spk_id=clone_id, stream=False, speed=speed
                ):
                    chunks.append(out["tts_speech"])
            finally:
                if top_k is not None and config.SAMPLING_TOP_K > 0:
                    self._set_sampling(config.SAMPLING_TOP_K)  # 기본(자연성) 복원
        if not chunks:
            return None
        return torch.concat(chunks, dim=1).squeeze(0).cpu().numpy().astype(np.float32)

    def synth(self, text: str, clone_id: str, voice_wav: str,
              ref_text: str | None, speed: float = 1.0) -> bytes:
        self._ensure_prompt(clone_id, voice_wav, ref_text)

        # 폭주(hallucination) 가드: CV2가 드물게 텍스트 대비 과생성해 의미없는 노이즈를 뱉음
        # (LLM max_token_text_ratio=20·top-k 샘플링 변동). 예상길이(문자수 기반) 크게 초과 시 재합성,
        # 모두 초과면 가장 짧은 결과 반환(최선). 정상은 1회로 통과(회귀·지연 무영향).
        expected_max = config.RAMBLE_BASE_SEC + len(text) * config.RAMBLE_PER_CHAR_SEC
        best = None
        for attempt in range(config.RAMBLE_RETRIES + 1):
            # 1차=기본 샘플링(자연성 top_k=5), 재합성=폴백 top_k(greedy 1, 폭주율↓).
            tk = None if attempt == 0 else config.RAMBLE_FALLBACK_TOP_K
            audio = self._synth_once(text, clone_id, speed, top_k=tk)
            if audio is None:
                # 정규화 후 빈 텍스트(문장부호·이모지) → 짧은 무음(스트리밍 무중단·503 방지).
                log.info("empty audio clone=%s text=%r → 무음 반환", clone_id, text[:40])
                return self._silence_wav(config.EMPTY_SILENCE_MS)
            dur = len(audio) / self.sr
            if dur <= expected_max:
                if attempt > 0:
                    log.info("ramble 회복: clone=%s dur=%.1fs (attempt=%d)", clone_id, dur, attempt)
                best = audio
                break
            log.warning("ramble 의심 clone=%s text=%r dur=%.1fs > max=%.1fs → 재합성(%d/%d)",
                        clone_id, text[:30], dur, expected_max, attempt + 1, config.RAMBLE_RETRIES)
            if best is None or len(audio) < len(best):
                best = audio  # 모두 초과 시 가장 짧은 것
        buf = io.BytesIO()
        sf.write(buf, best, self.sr, format="WAV", subtype="PCM_16")
        return buf.getvalue()

    def _silence_wav(self, ms: int) -> bytes:
        n = max(1, int(self.sr * ms / 1000))
        buf = io.BytesIO()
        sf.write(buf, np.zeros(n, dtype=np.float32), self.sr, format="WAV", subtype="PCM_16")
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
