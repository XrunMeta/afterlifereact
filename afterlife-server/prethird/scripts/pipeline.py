"""pipeline.py — DialoguePipeline: 텍스트 1턴 오케스트레이션.

흐름: user_text
  → chat_fn(messages) async-generator 토큰
  → SentenceBuffer 문장 단위 분할
  → say_fn(sentence) TTS wav bytes
  → decode_wav_fn(wav_bytes) → (pcm, sr, ch)
  → resample → 48 kHz int16
  → infer_fn(wav_path, on_frame) blocking (executor) → video frames push
  → _balance_pcm_to_video → audio track push

의존성 주입: LLM/TTS/decode/infer 모두 생성자 인자로 받음.
실서버에서는 실 함수, 테스트에서는 mock 주입.
"""
from __future__ import annotations

import asyncio
import logging
import os
import tempfile
import time
from typing import Callable

import numpy as np

log = logging.getLogger("prethird.pipeline")


class DialoguePipeline:
    """텍스트 1개 → LLM 문장스트림 → 문장별 TTS → musetalk 프레임 콜백 → 트랙 적재.

    Parameters
    ----------
    video_track : AvatarVideoTrack-like
        push_ndarray(rgb_arr) / signal_end() 인터페이스.
    audio_track : AvatarAudioTrack-like
        push_pcm_int16(pcm) / signal_end() 인터페이스.
    chat_fn : async generator (messages) → token str
    say_fn : async (text, se_path) → bytes (wav)
    decode_wav_fn : (bytes) → (int16 ndarray, sr, ch)
    infer_fn : (wav_path, on_frame) → int  ※blocking, run_in_executor 로 실행
    persona_messages : list[dict]  시스템 페르소나 메시지
    se_path : str | None  TTS 화자 임베딩 경로
    min_len : int  SentenceBuffer 최소 문장 길이
    force_flush : int  SentenceBuffer 강제 플러시 길이
    """

    def __init__(
        self,
        video_track,
        audio_track,
        chat_fn: Callable,
        say_fn: Callable,
        decode_wav_fn: Callable,
        infer_fn: Callable,
        persona_messages: list | None = None,
        se_path: str | None = None,
        min_len: int = 4,
        force_flush: int = 30,
    ) -> None:
        from sentence_buffer import SentenceBuffer
        from audio_utils import _resample_int16, _balance_pcm_to_video

        self.vt = video_track
        self.at = audio_track
        self.chat_fn = chat_fn
        self.say_fn = say_fn
        self.decode_wav_fn = decode_wav_fn
        self.infer_fn = infer_fn
        self.persona_messages = persona_messages or []
        self.se_path = se_path
        self._sb_factory = lambda: SentenceBuffer(min_len, force_flush)
        self._resample = _resample_int16
        self._balance = _balance_pcm_to_video
        self._last_emit_end: float | None = None  # [seg] 직전 _emit_sentence 종료 시각

    # ------------------------------------------------------------------
    # 퍼블릭 API
    # ------------------------------------------------------------------

    async def say(self, user_text: str) -> None:
        """user_text 1턴을 처리해 video/audio 트랙에 적재하고 signal_end 호출."""
        messages = self.persona_messages + [{"role": "user", "content": user_text}]
        sb = self._sb_factory()
        pending: list[str] = []

        async for tok in self.chat_fn(messages):
            pending += sb.push(tok)
            while pending:
                await self._emit_sentence(pending.pop(0))

        for s in sb.flush():
            await self._emit_sentence(s)

        self.vt.signal_end()
        self.at.signal_end()

    async def speak(self, text: str) -> None:
        """LLM 우회: 입력 텍스트를 그대로 발화(TTS+musetalk). 쉼표로 끊지 않고
        문장 종결부호(.!?…\\n)로만 분할. 한 문장이면 통째 1회."""
        import re
        parts = [p.strip() for p in re.split(r'(?<=[.!?…])\s+|\n+', text) if p.strip()]
        if not parts:
            parts = [text]
        for s in parts:
            await self._emit_sentence(s)
        self.vt.signal_end()
        self.at.signal_end()

    # ------------------------------------------------------------------
    # 내부: 문장 1개 처리
    # ------------------------------------------------------------------

    async def _emit_sentence(self, sentence: str) -> None:
        """문장 1개를 TTS → musetalk(executor) → 트랙 적재.
        C2: on_frame은 executor 스레드에서 list 에만 모으고(call_soon_threadsafe 제거 →
        이벤트루프 부하 차단), infer 완료(await 배리어) 후 메인 루프에서 frames 를 큐에
        일괄 push + balance 한 audio 를 동시에 push 한다 = 문장 단위 a/v 동기."""
        # [seg] 문장 간 공백 측정
        _t_start = time.perf_counter()
        since_prev_ms = int((_t_start - self._last_emit_end) * 1000) if self._last_emit_end is not None else 0

        # 1. TTS: wav bytes
        _t0 = time.perf_counter()
        wav_bytes = await self.say_fn(sentence, self.se_path)
        tts_ms = int((time.perf_counter() - _t0) * 1000)

        # 2. wav decode → resample to 48 kHz int16
        pcm, sr, _ = self.decode_wav_fn(wav_bytes)
        pcm48 = self._resample(pcm, sr, 48000)

        # 3. musetalk infer (blocking GPU → executor). frames 는 executor 스레드 로컬 list 에 모음.
        loop = asyncio.get_event_loop()
        frames_buf: list[np.ndarray] = []

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(wav_bytes)
            wav_path = f.name

        def on_frame(arr: np.ndarray) -> None:
            # executor 스레드에서만 호출. list.append 는 GIL atomic, 이벤트루프 미접근.
            frames_buf.append(arr)

        _t1 = time.perf_counter()
        await loop.run_in_executor(None, self.infer_fn, wav_path, on_frame)
        infer_ms = int((time.perf_counter() - _t1) * 1000)

        # 4. infer 완료 후 메인 루프에서 frames 일괄 push (문장 frames 완성본 → 송출 중 starve 없음)
        _t2 = time.perf_counter()
        for arr in frames_buf:
            self.vt.push_ndarray(arr)

        # 5. avsync: PCM 길이를 video 프레임 수에 맞춤 → audio 동시 push
        nframes = len(frames_buf)
        if nframes > 0:
            pcm_bal, _ = self._balance(pcm48, nframes)
        else:
            pcm_bal = pcm48
        self.at.push_pcm_int16(pcm_bal)
        push_ms = int((time.perf_counter() - _t2) * 1000)

        # [seg] 큐 수위 측정 (메서드 없으면 생략)
        vq = getattr(self.vt, "queue_depth", lambda: None)()
        _abuf_samples = getattr(self.at, "queue_depth_samples", lambda: None)()
        abuf_ms = int(_abuf_samples / 48) if _abuf_samples is not None else None

        # [seg] 1줄 로그
        if abuf_ms is not None:
            log.info(
                "[seg] tts_ms=%d infer_ms=%d frames=%d push_ms=%d vq=%s abuf_ms=%d since_prev_ms=%d",
                tts_ms, infer_ms, nframes, push_ms, vq, abuf_ms, since_prev_ms,
            )
        else:
            log.info(
                "[seg] tts_ms=%d infer_ms=%d frames=%d push_ms=%d vq=%s since_prev_ms=%d",
                tts_ms, infer_ms, nframes, push_ms, vq, since_prev_ms,
            )

        self._last_emit_end = time.perf_counter()

        # 6. temp wav 정리
        try:
            os.unlink(wav_path)
        except OSError:
            pass
