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
from recorder import NULL_TURN

log = logging.getLogger("prethird.pipeline")

GREETING_PROMPT = (
    "방금 통화가 연결됐고, 상대(사용자)는 아직 아무 말도 하지 않았어. "
    "네가 전화를 받은 입장에서, 너의 페르소나와 상대와의 관계에 맞춰 "
    "짧고 자연스럽게 한 문장으로 먼저 인사를 건네. 인사말만 말해."
)


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
        clone_locked: bool = False,
        min_len: int = 4,
        force_flush: int = 30,
    ) -> None:
        from sentence_buffer import SentenceBuffer
        from audio_utils import (
            _resample_int16, _balance_pcm_to_video,
            _apply_edge_fade, _normalize_peak,
        )

        self.vt = video_track
        self.at = audio_track
        self.chat_fn = chat_fn
        self.say_fn = say_fn
        self.decode_wav_fn = decode_wav_fn
        self.infer_fn = infer_fn
        self.persona_messages = persona_messages or []
        self.se_path = se_path
        self.clone_locked = clone_locked
        self._sb_factory = lambda: SentenceBuffer(min_len, force_flush)
        self._resample = _resample_int16
        self._balance = _balance_pcm_to_video
        self._edge_fade = _apply_edge_fade
        self._normalize = _normalize_peak
        self._fade_ms = float(os.environ.get("PRETHIRD_AUDIO_FADE_MS", "8"))
        self._norm_on = os.environ.get("PRETHIRD_AUDIO_NORM", "1") not in ("0", "false", "")
        self._last_emit_end: float | None = None  # [seg] 직전 _emit_sentence 종료 시각

    # ------------------------------------------------------------------
    # 퍼블릭 API
    # ------------------------------------------------------------------

    async def say(self, user_text: str, turn=None, on_first_audio=None, on_response_ready=None) -> None:
        """user_text 1턴을 처리해 video/audio 트랙에 적재하고 signal_end 호출.
        turn: recorder Turn 핸들(없으면 NULL_TURN) — LLM 토큰·TTS wav 누적.
        on_response_ready: 첫 infer 직전 1회 호출 (F7 filler 즉시컷 트리거용)."""
        turn = turn if turn is not None else NULL_TURN
        if self.clone_locked and not self.se_path:
            log.warning("clone voice 미준비 — 발화 skip (폴백 없음)")
            return
        messages = self.persona_messages + [{"role": "user", "content": user_text}]

        async def produce(q: asyncio.Queue):
            sb = self._sb_factory()
            async for tok in self.chat_fn(messages):
                turn.append_token(tok)
                for s in sb.push(tok):
                    await q.put(s)
            for s in sb.flush():
                await q.put(s)
            await q.put(None)

        await self._run_pipeline(produce, turn, on_first_audio, on_response_ready)

    async def speak(self, text: str, turn=None, on_first_audio=None, on_response_ready=None) -> None:
        """LLM 우회: 입력 텍스트를 그대로 발화(TTS+musetalk). 쉼표로 끊지 않고
        문장 종결부호(.!?…\\n)로만 분할. 한 문장이면 통째 1회.
        on_response_ready: 첫 infer 직전 1회 호출 (F7 filler 즉시컷 트리거용)."""
        turn = turn if turn is not None else NULL_TURN
        if self.clone_locked and not self.se_path:
            log.warning("clone voice 미준비 — speak skip (폴백 없음)")
            return
        import re
        parts = [p.strip() for p in re.split(r'(?<=[.!?…])\s+|\n+', text) if p.strip()]
        if not parts:
            parts = [text]
        # speak은 LLM 우회 — answer 텍스트는 입력 그대로
        turn.append_token(text)

        async def produce(q: asyncio.Queue):
            for s in parts:
                await q.put(s)
            await q.put(None)

        await self._run_pipeline(produce, turn, on_first_audio, on_response_ready)

    async def greet(self, turn=None, on_first_audio=None, on_response_ready=None) -> None:
        """통화 연결 직후 클론이 먼저 건네는 인사. LLM이 페르소나 기반 1문장 생성.
        say()와 동일 파이프라인이되 user 입력 대신 GREETING_PROMPT 지시를 준다.
        on_response_ready: 첫 infer 직전 1회 호출 (F7 filler 즉시컷 트리거용, greet는 보통 None)."""
        turn = turn if turn is not None else NULL_TURN
        if self.clone_locked and not self.se_path:
            log.warning("clone voice 미준비 — greet skip (폴백 없음)")
            return
        messages = self.persona_messages + [{"role": "user", "content": GREETING_PROMPT}]

        async def produce(q: asyncio.Queue):
            sb = self._sb_factory()
            async for tok in self.chat_fn(messages):
                turn.append_token(tok)
                for s in sb.push(tok):
                    await q.put(s)
            for s in sb.flush():
                await q.put(s)
            await q.put(None)

        await self._run_pipeline(produce, turn, on_first_audio, on_response_ready)

    # ------------------------------------------------------------------
    # 내부: 문장 1개 처리 (스테이지 분리)
    # ------------------------------------------------------------------

    async def _tts_stage(self, sentence: str):
        """문장 → TTS wav bytes + 48kHz int16 PCM. (GPU0: qwen3 TTS)"""
        wav_bytes = await self.say_fn(sentence, self.se_path)
        pcm, sr, _ = self.decode_wav_fn(wav_bytes)
        pcm48 = self._resample(pcm, sr, 48000)
        return wav_bytes, pcm48

    async def _infer_stage(self, wav_bytes: bytes, pcm48: np.ndarray, turn=None) -> None:
        """wav → musetalk infer(executor) → frames 일괄 push + balance audio. (GPU1)
        turn: recorder Turn — PRETHIRD_RECORD_MP4=1 시 frames 누적."""
        turn = turn if turn is not None else NULL_TURN
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
                # musetalk frames=0 — 입싱크 영상 미생성(오디오만 송출, idle 폴백).
                # CUDA 오염/추론 실패 신호. 무음 실패 방지를 위해 명시 경고.
                log.warning(
                    "[infer] musetalk frames=0 — 입싱크 영상 미생성(오디오만 송출). "
                    "CUDA 오염/추론 실패 의심."
                )
                pcm_bal = pcm48
            # 후처리: loudness 정규화 → 경계 fade. 둘 다 길이 불변 → avsync 무영향.
            # env 토글로 가비아에서 코드 변경 없이 비활성 가능(회귀 안전장치).
            if self._norm_on:
                pcm_bal = self._normalize(pcm_bal)
            pcm_bal = self._edge_fade(pcm_bal, fade_ms=self._fade_ms)
            self.at.push_pcm_int16(pcm_bal)
            turn.append_frames(frames_buf, pcm48, fps=25)
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

    async def _run_pipeline(self, produce, turn=None, on_first_audio=None, on_response_ready=None) -> None:
        """produce(sentence_q): 문장을 sentence_q 에 put 하고 끝에 None.
        TTS 워커(GPU0)와 infer 워커(GPU1)를 wav_q 로 연결해 오버랩 실행.
        turn: recorder Turn — TTS wav 누적(Phase 2 answer.wav).
        on_first_audio: 첫 오디오 프레임 push 직후 1회 동기 호출(예외 흡수).
        on_response_ready: 첫 infer 직전 1회 호출 — F7 filler 즉시컷 트리거.
          이벤트루프 스레드(infer_worker 코루틴)에서 호출됨 → flush() 직접 호출 OK.
          (executor 스레드 경유 불필요 — 라운드2 R-3/R-4 교훈 적용 확인).
        예외 시 모든 워커를 취소하고 signal_end 를 보장한다(좀비/오염 방지)."""
        turn = turn if turn is not None else NULL_TURN
        sentence_q: asyncio.Queue = asyncio.Queue()
        wav_q: asyncio.Queue = asyncio.Queue(maxsize=2)
        fired = {"v": False}

        async def tts_worker():
            while True:
                s = await sentence_q.get()
                if s is None:
                    await wav_q.put(None)
                    break
                wav_bytes, pcm48 = await self._tts_stage(s)
                turn.append_wav(wav_bytes)
                await wav_q.put((wav_bytes, pcm48))

        async def infer_worker():
            _first_infer = True
            while True:
                item = await wav_q.get()
                if item is None:
                    break
                wav_bytes, pcm48 = item
                # [F7] 첫 infer 직전 1회: filler 즉시컷 트리거 (stop → flush → 응답 push 순서 보장).
                # 이 시점은 이벤트루프 스레드(코루틴) → call_soon_threadsafe 불필요.
                # flush 이후 _infer_stage가 완료되면 응답 frames가 큐에 적재됨.
                if _first_infer:
                    _first_infer = False
                    if on_response_ready is not None:
                        try:
                            on_response_ready()
                        except Exception as exc:
                            log.warning("on_response_ready callback failed: %s", exc)
                await self._infer_stage(wav_bytes, pcm48, turn)
                # 첫 오디오 프레임 송출 직후 1회 통지(연결 중 화면 종료·speech_start echo).
                if not fired["v"] and on_first_audio is not None:
                    fired["v"] = True
                    try:
                        on_first_audio()
                    except Exception as exc:  # 콜백 실패가 발화를 막지 않게 흡수
                        log.warning("on_first_audio callback failed: %s", exc)

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
