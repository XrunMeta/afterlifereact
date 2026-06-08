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

        async def produce(q: asyncio.Queue):
            sb = self._sb_factory()
            async for tok in self.chat_fn(messages):
                for s in sb.push(tok):
                    await q.put(s)
            for s in sb.flush():
                await q.put(s)
            await q.put(None)

        await self._run_pipeline(produce)

    async def speak(self, text: str) -> None:
        """LLM 우회: 입력 텍스트를 그대로 발화(TTS+musetalk). 쉼표로 끊지 않고
        문장 종결부호(.!?…\\n)로만 분할. 한 문장이면 통째 1회."""
        import re
        parts = [p.strip() for p in re.split(r'(?<=[.!?…])\s+|\n+', text) if p.strip()]
        if not parts:
            parts = [text]

        async def produce(q: asyncio.Queue):
            for s in parts:
                await q.put(s)
            await q.put(None)

        await self._run_pipeline(produce)

    # ------------------------------------------------------------------
    # 내부: 문장 1개 처리 (스테이지 분리)
    # ------------------------------------------------------------------

    async def _tts_stage(self, sentence: str):
        """문장 → TTS wav bytes + 48kHz int16 PCM. (GPU0: qwen3 TTS)"""
        wav_bytes = await self.say_fn(sentence, self.se_path)
        pcm, sr, _ = self.decode_wav_fn(wav_bytes)
        pcm48 = self._resample(pcm, sr, 48000)
        return wav_bytes, pcm48

    async def _infer_stage(self, wav_bytes: bytes, pcm48: np.ndarray) -> None:
        """wav → musetalk infer(executor) → frames 일괄 push + balance audio. (GPU1)"""
        loop = asyncio.get_event_loop()
        frames_buf: list[np.ndarray] = []
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(wav_bytes)
            wav_path = f.name

        def on_frame(arr: np.ndarray) -> None:
            frames_buf.append(arr)

        try:
            await loop.run_in_executor(None, self.infer_fn, wav_path, on_frame)
            for arr in frames_buf:
                self.vt.push_ndarray(arr)
            nframes = len(frames_buf)
            if nframes > 0:
                pcm_bal, _ = self._balance(pcm48, nframes)
            else:
                pcm_bal = pcm48
            self.at.push_pcm_int16(pcm_bal)
        finally:
            try:
                os.unlink(wav_path)
            except OSError:
                pass

    async def _emit_sentence(self, sentence: str) -> None:
        """문장 1개 직렬 처리(기존 호환). 파이프라인은 _run_pipeline 사용."""
        # [seg] 문장 간 공백 측정
        _t_start = time.perf_counter()
        since_prev_ms = int((_t_start - self._last_emit_end) * 1000) if self._last_emit_end is not None else 0

        _t0 = time.perf_counter()
        wav_bytes, pcm48 = await self._tts_stage(sentence)
        tts_ms = int((time.perf_counter() - _t0) * 1000)

        _t1 = time.perf_counter()
        await self._infer_stage(wav_bytes, pcm48)
        infer_ms = int((time.perf_counter() - _t1) * 1000)

        # [seg] 큐 수위 측정 (메서드 없으면 생략)
        vq = getattr(self.vt, "queue_depth", lambda: None)()
        _abuf_samples = getattr(self.at, "queue_depth_samples", lambda: None)()
        abuf_ms = int(_abuf_samples / 48) if _abuf_samples is not None else None

        # [seg] 1줄 로그
        if abuf_ms is not None:
            log.info(
                "[seg] tts_ms=%d infer_ms=%d since_prev_ms=%d vq=%s abuf_ms=%d",
                tts_ms, infer_ms, since_prev_ms, vq, abuf_ms,
            )
        else:
            log.info(
                "[seg] tts_ms=%d infer_ms=%d since_prev_ms=%d vq=%s",
                tts_ms, infer_ms, since_prev_ms, vq,
            )

        self._last_emit_end = time.perf_counter()

    # ------------------------------------------------------------------
    # 내부: 오버랩 파이프라인
    # ------------------------------------------------------------------

    async def _run_pipeline(self, produce) -> None:
        """produce(sentence_q): 문장을 sentence_q 에 put 하고 끝에 None.
        TTS 워커(GPU0)와 infer 워커(GPU1)를 wav_q 로 연결해 오버랩 실행.
        예외 시 모든 워커를 취소하고 signal_end 를 보장한다(좀비/오염 방지)."""
        sentence_q: asyncio.Queue = asyncio.Queue()
        wav_q: asyncio.Queue = asyncio.Queue(maxsize=2)

        async def tts_worker():
            while True:
                s = await sentence_q.get()
                if s is None:
                    await wav_q.put(None)
                    break
                wav_bytes, pcm48 = await self._tts_stage(s)
                await wav_q.put((wav_bytes, pcm48))

        async def infer_worker():
            while True:
                item = await wav_q.get()
                if item is None:
                    break
                wav_bytes, pcm48 = item
                await self._infer_stage(wav_bytes, pcm48)

        tasks = [
            asyncio.ensure_future(produce(sentence_q)),
            asyncio.ensure_future(tts_worker()),
            asyncio.ensure_future(infer_worker()),
        ]
        try:
            await asyncio.gather(*tasks)
        except BaseException:
            for t in tasks:
                t.cancel()
            # 취소 완료 대기(좀비 방지). 취소/2차 예외는 흡수.
            await asyncio.gather(*tasks, return_exceptions=True)
            raise
        finally:
            self.vt.signal_end()
            self.at.signal_end()
