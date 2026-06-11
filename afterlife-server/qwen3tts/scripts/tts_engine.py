# afterlife-server/qwen3tts/scripts/tts_engine.py
from __future__ import annotations
import dataclasses
import hashlib
import io
import logging
import os
import soundfile as sf
import config
from clone_ref import extract_ref_clip

log = logging.getLogger("qwen3tts.engine")


@dataclasses.dataclass
class _PromptEntry:
    """clone_id 별 캐시 엔트리.

    캐시 정책 (sion MAJOR1 + el R-1 트레이드오프):
    - 빠른 hit: stat(µs) + ref_sha 만으로 결정 → wav 재해시 0.
    - 느린 miss: size 또는 mtime_ns 불일치 시에만 wav_sha256(전체 읽기).
    - 극단 케이스: size·mtime 동일하지만 내용만 다름(rsync --times / 원자배치
      mtime 보존 패턴)은 빠른 hit가 stale을 반환할 수 있음(el R-1 지적).
      단, voice.wav 교체는 lazy fetch os.replace = mtime 갱신을 동반하므로
      운영상 이 케이스는 거의 발생하지 않음. 합성 지연(통화당 수십 문장) 절감이
      stale 위험보다 크다고 판단 → stat+ref_sha 빠른 패스를 채택.
    """
    wav_size: int
    wav_mtime_ns: int
    wav_sha: str
    ref_sha: str   # sha256(ref_text) or sha256("") when ref_text is None
    prompt: object


class Qwen3Engine:
    """Qwen3-TTS-1.7B-Base 클론 합성 래퍼.
    - model 주입 시 GPU 없이 로컬 테스트 가능(load 우회).
    - 클론 prompt 는 clone_id 키로 메모리 캐시(create_voice_clone_prompt 1회/클론)."""

    def __init__(self, model=None, clip_fn=None):
        self._model = model
        self._clip_fn = clip_fn or extract_ref_clip
        self._cache: dict[str, _PromptEntry] = {}   # clone_id → _PromptEntry

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
        """warmup 전용 클론으로 1문장 합성해 첫 호출 cold 흡수. 실패해도 서비스는 뜬다(로그만).
        합성 경로의 DEFAULT_CLONE 이 아닌 WARMUP_CLONE 을 사용한다."""
        try:
            from clone_ref import ref_audio_path
            clone = config.WARMUP_CLONE
            voice = ref_audio_path(clone)
            if clone and os.path.isfile(voice):
                self.synth("워밍업", clone_id=clone, voice_wav=voice)
                log.info("warmup ok (clone=%s)", clone)
        except Exception as e:  # noqa: BLE001
            log.warning("warmup skipped: %r", e)

    @staticmethod
    def _wav_sha256(voice_wav: str) -> str:
        """voice.wav 파일 내용 전체 SHA-256 hex digest. miss/불일치 시에만 호출."""
        with open(voice_wav, "rb") as f:
            data = f.read()
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def _ref_sha(ref_text: str | None) -> str:
        """ref_text(또는 빈 문자열)의 SHA-256 hex digest."""
        return hashlib.sha256((ref_text or "").encode()).hexdigest()

    def get_prompt(self, clone_id: str, voice_wav: str, ref_text: str | None = None):
        """2단계 캐시 조회.

        1단계 (빠른 hit, µs): stat size·mtime_ns + ref_sha 일치 → wav 재해시 없이 반환.
        2단계 (느린 miss): 불일치 시 wav_sha256 계산 후 엔트리 갱신.

        stale 케이스 (size·mtime 동일·내용만 다름)는 빠른 hit가 stale 반환 가능.
        운영상 voice.wav 교체는 lazy fetch os.replace = mtime 갱신을 동반하므로
        이 케이스는 비발생으로 취급 (el R-1 트레이드오프 근거).
        """
        st = os.stat(voice_wav)
        ref_sha = self._ref_sha(ref_text)
        entry = self._cache.get(clone_id)

        # 1단계: stat + ref_sha 빠른 hit
        if (
            entry is not None
            and entry.wav_size == st.st_size
            and entry.wav_mtime_ns == st.st_mtime_ns
            and entry.ref_sha == ref_sha
        ):
            return entry.prompt

        # 2단계: miss 또는 stat 불일치 → 전체 wav 해시로 정밀 확인
        wav_sha = self._wav_sha256(voice_wav)

        # wav 내용과 ref_sha 모두 일치하면 stat만 달랐던 것(mtime 부동 등) → 엔트리 stat 갱신
        if entry is not None and entry.wav_sha == wav_sha and entry.ref_sha == ref_sha:
            entry.wav_size = st.st_size
            entry.wav_mtime_ns = st.st_mtime_ns
            return entry.prompt

        # 실제 miss → prompt 빌드
        clip, sr = self._clip_fn(voice_wav)
        prompt = self._model.create_voice_clone_prompt(
            ref_audio=(clip, sr),
            ref_text=ref_text,
            x_vector_only_mode=(ref_text is None),
        )
        self._cache[clone_id] = _PromptEntry(
            wav_size=st.st_size,
            wav_mtime_ns=st.st_mtime_ns,
            wav_sha=wav_sha,
            ref_sha=ref_sha,
            prompt=prompt,
        )
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
