# afterlife-server/qwen3tts/scripts/tts_engine.py
from __future__ import annotations
import io
import logging
import soundfile as sf
import config
from clone_ref import extract_ref_clip

log = logging.getLogger("qwen3tts.engine")


class Qwen3Engine:
    """Qwen3-TTS-1.7B-Base 클론 합성 래퍼.
    - model 주입 시 GPU 없이 로컬 테스트 가능(load 우회).
    - 클론 prompt 는 clone_id 키로 메모리 캐시(create_voice_clone_prompt 1회/클론)."""

    def __init__(self, model=None, clip_fn=None):
        self._model = model
        self._clip_fn = clip_fn or extract_ref_clip
        self._prompts: dict[tuple, object] = {}

    def load(self) -> None:
        if self._model is not None:
            return
        import torch
        from qwen_tts import Qwen3TTSModel
        self._model = Qwen3TTSModel.from_pretrained(
            config.MODEL_NAME,
            device_map=config.DEVICE,
            dtype=torch.bfloat16,
            attn_implementation=config.ATTN_IMPL,
        )
        log.info("model loaded: %s on %s", config.MODEL_NAME, config.DEVICE)

    def warmup(self) -> None:
        """기본 클론으로 1문장 합성해 첫 호출 cold 흡수. 실패해도 서비스는 뜬다(로그만)."""
        try:
            from clone_ref import ref_audio_path
            import os
            clone = config.DEFAULT_CLONE
            voice = ref_audio_path(clone)
            if clone and os.path.isfile(voice):
                self.synth("워밍업", clone_id=clone, voice_wav=voice)
                log.info("warmup ok (clone=%s)", clone)
        except Exception as e:  # noqa: BLE001
            log.warning("warmup skipped: %r", e)

    def get_prompt(self, clone_id: str, voice_wav: str, ref_text: str | None = None):
        key = (clone_id, ref_text is not None)
        if key in self._prompts:
            return self._prompts[key]
        clip, sr = self._clip_fn(voice_wav)
        prompt = self._model.create_voice_clone_prompt(
            ref_audio=(clip, sr),
            ref_text=ref_text,
            x_vector_only_mode=(ref_text is None),
        )
        self._prompts[key] = prompt
        return prompt

    def synth(self, text: str, clone_id: str, voice_wav: str,
              ref_text: str | None = None, speed: float = 1.0) -> bytes:
        prompt = self.get_prompt(clone_id, voice_wav, ref_text)
        wavs, sr = self._model.generate_voice_clone(
            text=text, language=config.LANGUAGE, voice_clone_prompt=prompt,
        )
        wav = wavs[0]
        buf = io.BytesIO()
        sf.write(buf, wav, sr, format="WAV", subtype="PCM_16")
        return buf.getvalue()
