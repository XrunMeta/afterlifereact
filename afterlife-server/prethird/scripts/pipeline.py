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

# [T-120 e2e] 계측 로그(`[seg]`/`[turn]`)를 /data 영구 파일로 tee (additive).
#   기존 동작 무변경 — 로깅만 추가. env `PRETHIRD_E2E_METRICS=0` 으로 비활성.
#   파일 경로: PRETHIRD_METRICS_PATH (기본 /data/afterlife/metrics/e2e/prethird_seg.log)
_E2E_METRICS_PATH = os.environ.get(
    "PRETHIRD_METRICS_PATH", "/data/afterlife/metrics/e2e/prethird_seg.log"
)
if os.environ.get("PRETHIRD_E2E_METRICS", "1") not in ("0", "false", ""):
    try:
        os.makedirs(os.path.dirname(_E2E_METRICS_PATH), exist_ok=True)
        _mh = logging.FileHandler(_E2E_METRICS_PATH)
        _mh.setLevel(logging.INFO)
        _mh.setFormatter(logging.Formatter("%(asctime)s %(message)s"))
        # `[seg]`/`[turn]` 계측 라인만 파일로 — 다른 INFO 로그는 제외.
        _mh.addFilter(
            lambda r: r.getMessage().startswith("[seg]")
            or r.getMessage().startswith("[turn]")
        )
        log.addHandler(_mh)
        if log.level == logging.NOTSET or log.level > logging.INFO:
            log.setLevel(logging.INFO)
        log.info("[turn] metrics-file-init path=%s", _E2E_METRICS_PATH)
    except Exception as _exc:  # 파일핸들러 실패가 발화를 막지 않게 흡수
        log.warning("[T-120] metrics file handler init failed: %s", _exc)

_RENDER_MODES = {"partial", "batch"}


def _stage(on_stage, name: str, detail: dict | None = None) -> None:
    """[T-258] 발화 파이프라인 단계 신호 1건 발신 (계측 전용, additive).

    on_stage: callable(stage_name: str, detail: dict|None) — 호출부(signaling)가
      dc 로 `{"type":"stage","seq":...,"stage":...,"tMs":...,"detail":...}` 를 보낸다.
      None 이면 완전 no-op(회귀 0).

    계약 3가지 — 어기면 발화가 죽는다:
      1) **동기·논블로킹** — 여기서 await 하지 않는다. _infer_stage 의
         "_fire_hook~push 사이 await 없음(원자성)" 계약을 깨면 안 되기 때문.
      2) **예외 흡수** — 신호 전송 실패는 log.warning 만 남기고 파이프라인 진행.
      3) **detail 은 이미 계산된 값만** — 여기서 오디오 재계산 같은 무거운 산출 금지.
    """
    if on_stage is None:
        return
    try:
        on_stage(name, detail)
    except Exception as exc:  # 계측 실패가 발화를 막지 않게 흡수
        log.warning("[stage] %s emit failed: %s", name, exc)


def _resolve_render_mode() -> str:
    """[T-113] host env PRETHIRD_RENDER_MODE → {"partial","batch"} 화이트리스트.
    미설정/기본은 "partial". 화이트리스트 외 값은 "partial" 폴백 + log.warning
    (회귀 방지 — 잘못된 값이 조용히 batch 로 새는 것을 막는다).
    ⚠️ T-111 FIFTH_RENDER_MODE(fifth 렌더서버 env)와는 별개 — 혼동 금지."""
    raw = os.environ.get("PRETHIRD_RENDER_MODE", "partial")
    if raw not in _RENDER_MODES:
        log.warning(
            "PRETHIRD_RENDER_MODE=%r 은 유효값이 아님({'partial','batch'} 외) — partial 폴백",
            raw,
        )
        return "partial"
    return raw


GREETING_PROMPT = (
    "방금 통화가 연결됐고, 상대(사용자)는 아직 아무 말도 하지 않았어. "
    "네가 전화를 받은 입장에서, 너의 페르소나와 상대와의 관계에 맞춰 "
    "짧고 자연스럽게 한 문장으로 먼저 인사를 건네. 인사말만 말해."
)

# [T-067] 얼굴 인식 이벤트에 대한 선제 발화 프롬프트 (react()).
REACT_PROMPT_KNOWN = (
    "방금 화면에 '{name}'님이 새로 나타났어. 하던 이야기를 잠깐 멈추고, "
    "너의 페르소나와 '{name}'님과의 관계에 맞춰 이름을 부르며 반갑게 "
    "한두 문장으로 맞이해. 예: '{name}님, 오셨군요!' 맞이하는 말만 말해."
)
# 히즈키 결정(2026-07-05): 리액션 문구는 고정하지 않고 클론 페르소나에 맡겨 그때그때
# 자연스럽게 변주한다. 단 "상대의 이름을 묻는다"는 목적은 프롬프트로 명확히 고정
# (이름 답변이 즉석등록(enroll_suggest) 프리필의 입력이 되므로 생략 불가).
REACT_PROMPT_UNKNOWN = (
    "방금 화면에 처음 보는 분이 나타났어. 너의 페르소나(말투·성격·관계 정서)에 맞게 "
    "다정하게 맞이하되, **반드시 상대의 이름(성함)이 무엇인지 명확하게 물어봐**. "
    "심문하듯 캐묻지 말고 한두 문장으로. 질문만 말해."
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

    SentenceBuffer 파라미터(min_len/force_flush/first_min_len)는 env(PRETHIRD_SENTENCE_*)로
    주입한다 — SentenceBuffer.from_env() 참조(T-120 B 세그먼트 병합 튜닝, 미설정 시 회귀 0).
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
        # SentenceBuffer 파라미터는 env(PRETHIRD_SENTENCE_*)로 주입 → 세그먼트 병합 런타임 튜닝
        # (T-120 B: 과분절 해소, first_min_len 으로 첫 응답 지연 방지). 미설정 시 회귀 0.
        self._sb_factory = lambda: SentenceBuffer.from_env()
        self._resample = _resample_int16
        self._balance = _balance_pcm_to_video
        self._edge_fade = _apply_edge_fade
        self._normalize = _normalize_peak
        self._fade_ms = float(os.environ.get("PRETHIRD_AUDIO_FADE_MS", "8"))
        self._norm_on = os.environ.get("PRETHIRD_AUDIO_NORM", "1") not in ("0", "false", "")
        # [T-258] _last_emit_end 제거 — 유일 사용처였던 _emit_sentence(死코드) 동반 삭제.
        self._render_mode = _resolve_render_mode()  # [T-113] partial(기본)|batch 분기용

    # ------------------------------------------------------------------
    # 퍼블릭 API
    # ------------------------------------------------------------------

    def update_persona(self, messages: list) -> None:
        """[T-067 Task 12] persona_messages 교체 — 다음 턴(say/speak/react/greet)부터 반영.
        진행 중인 발화에는 영향 없음(각 호출 시점에 self.persona_messages를 읽어 조립)."""
        self.persona_messages = list(messages)

    async def say(
        self, user_text: str, turn=None, on_first_audio=None, on_response_ready=None,
        on_sentence=None, on_stage=None,
    ) -> None:
        """user_text 1턴을 처리해 video/audio 트랙에 적재하고 signal_end 호출.
        turn: recorder Turn 핸들(없으면 NULL_TURN) — LLM 토큰·TTS wav 누적.
        on_response_ready: 첫 infer 완료 후·첫 push 직전 1회 호출 (F7 filler 즉시컷).
        on_sentence: [T-151, 라운드2] 문장 1개의 첫 프레임 push 직전(재생 시작
          근사) 1회 호출(텍스트 인자) — 클론 발화 자막(speech_text dc 발신)용,
          additive. (기존: tts_worker dequeue 직후 호출이라 재생보다 수 초
          선행 — 실기 피드백으로 push 단계로 이동)
        on_stage: [T-258] 단계 신호 콜백 callable(stage, detail) — batch 경로에서
          llm_done/tts_start/tts_done/render_start/render_done/stream_start/
          stream_end 를, partial 경로에서는 stream_start/stream_end 만 발신한다.
          계측 전용·additive(None 이면 no-op). _stage() 헬퍼 docstring 참조."""
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

        await self._run_pipeline(
            produce, turn, on_first_audio, on_response_ready,
            on_sentence=on_sentence, on_stage=on_stage,
        )

    async def speak(
        self, text: str, turn=None, on_first_audio=None, on_response_ready=None,
        on_sentence=None, on_stage=None,
    ) -> None:
        """LLM 우회: 입력 텍스트를 그대로 발화(TTS+musetalk). 쉼표로 끊지 않고
        문장 종결부호(.!?…\\n)로만 분할. 한 문장이면 통째 1회.
        on_response_ready: 첫 infer 완료 후·첫 push 직전 1회 호출 (F7 filler 즉시컷).
        on_sentence: [T-151] 클론 발화 자막용 문장별 콜백(say() 참조).
        on_stage: [T-258] 단계 신호 콜백(say() 참조, additive)."""
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

        await self._run_pipeline(
            produce, turn, on_first_audio, on_response_ready,
            on_sentence=on_sentence, on_stage=on_stage,
        )

    async def greet(
        self, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None,
        on_stage=None,
    ) -> None:
        """통화 연결 직후 클론이 먼저 건네는 인사. LLM이 페르소나 기반 1문장 생성.
        say()와 동일 파이프라인이되 user 입력 대신 GREETING_PROMPT 지시를 준다.
        on_response_ready: 첫 infer 완료 후·첫 push 직전 1회 호출 (F7 filler 즉시컷, greet는 보통 None).
        on_sentence: [T-151] 클론 발화 자막용 문장별 콜백(say() 참조).
        on_stage: [T-258] 단계 신호 콜백 — greet 는 force_partial 경로라
          stream_start/stream_end 2건만 나간다(say() 참조)."""
        await self._system_utterance(
            GREETING_PROMPT, "greet", turn=turn,
            on_first_audio=on_first_audio, on_response_ready=on_response_ready,
            on_sentence=on_sentence, on_stage=on_stage,
        )

    async def react(
        self, kind: str, display_name: str | None = None, turn=None, on_first_audio=None,
        on_stage=None,
    ) -> None:
        """[T-067] 얼굴 인식 이벤트에 대한 선제 발화(끼어들기). greet()와 동일 골격(_system_utterance 공유).
        kind: "known"(아는 얼굴 — display_name 필수) | "unknown"(모르는 얼굴/multi_face).
        쿨다운·토글 판단은 호출부(signaling._handle_face_event)의 책임 — 여기선 발화만 수행."""
        prompt = (
            REACT_PROMPT_KNOWN.format(name=display_name)
            if kind == "known" else REACT_PROMPT_UNKNOWN
        )
        await self._system_utterance(
            prompt, "react", turn=turn, on_first_audio=on_first_audio, on_stage=on_stage,
        )

    # ------------------------------------------------------------------
    # 내부: greet()/react() 공용 — 시스템 지시 프롬프트 1개 발화
    # ------------------------------------------------------------------

    async def _system_utterance(
        self, prompt: str, label: str, turn=None, on_first_audio=None, on_response_ready=None,
        on_sentence=None, on_stage=None,
    ) -> None:
        """persona_messages + 시스템 지시(prompt) 1개를 LLM→TTS→infer→push 파이프라인으로 발화.
        greet()·react() 공용 헬퍼 — user 텍스트 대신 지시문을 주는 것만 다르다.
        label: 로그 메시지 구분용("greet"|"react").

        [실통화 디버그] force_partial=True 로 항상 partial 경로 강제 — 시스템
        선제발화(greet/react)는 한 문장 인사/맞이말이라 batch(전체 렌더 후
        재생)를 타면 TTFF 가 늘어나 프론트 GREET_TIMEOUT(7s) 을 넘기고
        dialing 화면이 고착된다(실통화 확인). say()/speak()(사용자 응답)는
        이 헬퍼를 거치지 않으므로 batch 그대로 유지된다."""
        turn = turn if turn is not None else NULL_TURN
        if self.clone_locked and not self.se_path:
            log.warning("clone voice 미준비 — %s skip (폴백 없음)", label)
            return
        messages = self.persona_messages + [{"role": "user", "content": prompt}]

        async def produce(q: asyncio.Queue):
            sb = self._sb_factory()
            async for tok in self.chat_fn(messages):
                turn.append_token(tok)
                for s in sb.push(tok):
                    await q.put(s)
            for s in sb.flush():
                await q.put(s)
            await q.put(None)

        await self._run_pipeline(
            produce, turn, on_first_audio, on_response_ready, force_partial=True,
            on_sentence=on_sentence, on_stage=on_stage,
        )

    # ------------------------------------------------------------------
    # 내부: 문장 1개 처리 (스테이지 분리)
    # ------------------------------------------------------------------

    async def _tts_stage(self, sentence: str):
        """문장 → TTS wav bytes + 48kHz int16 PCM. (GPU0: qwen3 TTS)"""
        wav_bytes = await self.say_fn(sentence, self.se_path)
        pcm, sr, _ = self.decode_wav_fn(wav_bytes)
        pcm48 = self._resample(pcm, sr, 48000)
        return wav_bytes, pcm48

    async def _infer_stage(
        self, wav_bytes: bytes, pcm48: np.ndarray, turn=None, on_before_push=None,
        render_mode: str | None = None, on_stage=None,
    ) -> None:
        """wav → musetalk infer(executor) → frames 일괄 push + balance audio. (GPU1)
        turn: recorder Turn — PRETHIRD_RECORD_MP4=1 시 frames 누적.
        on_before_push: infer 완료 후·첫 push 직전 1회 호출(F7 filler 즉시컷).
          렌더가 도는 수 초 동안 필러가 계속 순환해야 하므로 이 시점이어야 한다
          (infer '직전' 컷은 렌더 시간만큼 idle 갭 유발 — T-088 라운드4 실통화 실측).
          이 지점~push 사이 await 없음 → stop→flush→응답push 원자성 유지.
        render_mode: [T-113] batch 경로에서만 명시 전달("batch"). partial(기존 호출부)은
          항상 기본값 None 이라 infer_fn 호출이 기존과 100% 동일(positional-only,
          kwarg 미부여)하게 유지된다 — partial 무변경 보장.
        on_stage: [T-258] 단계 신호 콜백 — **batch 경로에서만 전달**한다.
          render_done(프레임 수) / stream_start(push 직전) / stream_end(push 직후,
          큐 잔량 ms). partial 은 세그먼트마다 이 함수를 타므로 신호가 N배로
          쏟아지는 것을 막기 위해 전달하지 않는다(기본 None → 완전 no-op)."""
        turn = turn if turn is not None else NULL_TURN
        loop = asyncio.get_event_loop()
        frames_buf: list[np.ndarray] = []
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(wav_bytes)
            wav_path = f.name

        def on_frame(arr: np.ndarray) -> None:
            frames_buf.append(arr)

        def _fire_hook():
            if on_before_push is not None:
                try:
                    on_before_push()
                except Exception as exc:
                    log.warning("on_before_push callback failed: %s", exc)

        def _invoke_infer(wp, cb):
            if render_mode is not None:
                return self.infer_fn(wp, cb, render_mode=render_mode)
            return self.infer_fn(wp, cb)

        try:
            try:
                await loop.run_in_executor(None, _invoke_infer, wav_path, on_frame)
            except BaseException:
                # [el BLOCKER] 렌더 예외(렌더서버 다운/타임아웃 등)에도 즉시컷 훅은
                # 반드시 1회 발동 — 스킵되면 FillerPlayer 정지 경로가 사라져 필러가
                # 세션 종료까지 무한 순환(영구 좀비). 훅 발동 후 예외는 기존대로 전파.
                _fire_hook()
                raise
            # [T-258] 렌더 반환 직후 = render_done. frames_buf 는 on_frame 이
            # 렌더 도중 동기 append 하므로 이 시점에 이미 확정(추가 계산 0).
            _stage(on_stage, "render_done", {"frames": len(frames_buf)})
            # 성공 경로: frames=0(추론 실패)이어도 호출 — 응답 '오디오' push 전에
            # 필러 오디오("음...")를 반드시 끊어야 응답 음성과 겹치지 않는다.
            # 이 지점~push 사이 await 없음 → stop→flush→응답push 원자성 유지.
            # (_stage 는 동기·논블로킹이라 이 원자성을 깨지 않는다 — _stage docstring)
            _fire_hook()
            _stage(on_stage, "stream_start")
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
            _push_res = self.at.push_pcm_int16(pcm_bal)
            # [T-258] push 완료 직후 = stream_end. queued_ms 는 push_pcm_int16 이
            # 이미 반환하는 큐 잔량(48kHz 샘플)을 나누기만 한다 — 재계산 없음.
            # 반환값이 dict 가 아닌 트랙 구현(테스트 fake 등)이면 detail 생략.
            if on_stage is not None:
                _q = _push_res.get("queued") if isinstance(_push_res, dict) else None
                _stage(
                    on_stage, "stream_end",
                    {"queued_ms": int(_q / 48)} if isinstance(_q, (int, float)) else None,
                )
            turn.append_frames(frames_buf, pcm48, fps=25)
        finally:
            try:
                os.unlink(wav_path)
            except OSError:
                pass

    # [T-258] `_emit_sentence`(문장 1개 직렬 처리 + `[seg]` 로그) 제거.
    #   근거: scripts/ 전체·tests/ 전체에서 호출부가 0건이었다(레거시 잔재 —
    #   실행 경로는 _run_pipeline_partial 의 tts_worker/infer_worker 오버랩,
    #   batch 는 _run_batch). 그래서 `[seg]` 라인은 프로덕션 로그·메트릭 파일에
    #   단 한 줄도 찍히지 않았다. 배선하려면 오버랩 파이프라인을 직렬 처리로
    #   되돌려야 해 "기존 동작 무변경" 원칙에 정면으로 위배되므로 삭제를 택했다.
    #   대체 계측 = 새 `stage` 신호(llm_done/tts_*/render_*/stream_*)와 기존
    #   `[turn]` 로그. 메트릭 FileHandler 의 `[seg]` 필터는 그대로 둔다
    #   (tests/test_pipeline_timing.py 가 직접 log.info("[seg] ...") 로 검증).

    # ------------------------------------------------------------------
    # 내부: 오버랩 파이프라인
    # ------------------------------------------------------------------

    async def _run_pipeline(
        self, produce, turn=None, on_first_audio=None, on_response_ready=None,
        force_partial: bool = False, on_sentence=None, on_stage=None,
    ) -> None:
        """[T-113] render_mode 분기 진입점(스캐폴드). partial(기본)은 기존 오버랩
        파이프라인(_run_pipeline_partial, 완전 무변경)을 그대로 호출한다.
        self._render_mode 는 __init__ 시점에 _resolve_render_mode() 로 1회 확정된 값.

        force_partial: [실통화 디버그] True 면 render_mode 설정과 무관하게 항상
          partial 경로를 탄다. greet()·react() 같은 시스템 선제발화(한 문장 인사)
          는 batch(전체 답변 단일 렌더) 를 타면 TTFF 가 6~8초로 늘어나
          프론트 GREET_TIMEOUT(7s) 을 넘겨 dialing 화면이 고착되는 실통화
          회귀가 확인됨 — greet/react 는 _system_utterance 가 이 플래그로
          강제 partial 배선. say()/speak()(사용자 응답, batch 대상)는
          force_partial 을 전달하지 않아(기본 False) 절대 영향받지 않는다."""
        # 리드 버퍼(pre-roll): 사용자 응답(say/speak)만 무장 — 문장 사이 갭을 버퍼로
        # 흡수한다. greet/react(force_partial=True, 단문·세그먼트 갭 없음)는 제외해
        # TTFF 회귀(GREET_TIMEOUT 고착)를 방지. batch 경로엔 무해(일괄 push→즉시 해제).
        # PRETHIRD_PREROLL_FRAMES=0(기본)이면 begin_response 자체가 no-op(회귀 0).
        if not force_partial:
            self.vt.begin_response()
        if self._render_mode == "batch" and not force_partial:
            await self._run_batch(
                produce, turn, on_first_audio, on_response_ready,
                on_sentence=on_sentence, on_stage=on_stage,
            )
        else:
            await self._run_pipeline_partial(
                produce, turn, on_first_audio, on_response_ready,
                on_sentence=on_sentence, on_stage=on_stage,
            )

    async def _run_batch(
        self, produce, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None,
        on_stage=None,
    ) -> None:
        """[T-113] batch 렌더 모드(A1) — 답변(턴) 전체를 문장 분할 없이 하나로
        모아 TTS 정확히 1회 → infer 정확히 1회(render_mode="batch") → 완성
        프레임/오디오 push. 문장이 N개여도 단일 모션이어야 하는 게 핵심 계약.

        produce(sentence_q) 는 say()/speak()/_system_utterance() 공용 클로저로,
        내부적으로 chat_fn(LLM 토큰 스트림)을 SentenceBuffer 로 문장 단위 분할해
        sentence_q 에 넣는다(partial과 동일 재사용 — 클로저 자체는 무변경).
        batch 는 그 문장들을 소비하되 문장별로 TTS/infer 하지 않고, 스트림이
        끝날 때까지 전부 모아 이어붙인 뒤(누적 순서 보존) 그제서야 TTS 1회를
        태운다 — partial 경로(tts_worker/infer_worker/_run_pipeline_partial)는
        전혀 호출하지 않는다.

        [T-113 Task6 — spec §6] 이 메서드가 다루는 실패 도메인은 둘로 나뉜다:
        - produce/collect(LLM 토큰 스트림) 실패: 기존과 동일하게 태스크 취소 후
          재전파한다(호출부 signaling.py 의 except Exception 이 idle 로 복구).
        - TTS/렌더(infer) 실패: **여기서 직접 삼킨다** — log.error 후 예외
          미전파, 프레임/오디오 push 없이 정상 반환(partial 자동 폴백 없음,
          해당 턴은 idle 로 남는다 — signaling.py finally 의
          sess.set_state("idle") 과 별개로, 이 계약 자체가 pipeline 레벨에서
          보장돼야 함). filler 정지 훅(on_response_ready)은 TTS 단계 실패처럼
          _infer_stage 진입 '전' 실패에서는 그 내부 _fire_hook 이 못 불리므로
          여기서 방어적으로 1회 더 호출한다(FillerPlayer.stop()/track.flush()
          는 멱등이라 이미 불렸어도 중복 호출 안전 — T-088 좀비 패턴 방지).

        [T-258] on_stage 단계 신호(계측 전용, additive). batch 는 전 단계를 발신한다:
          llm_done(collect 반환 직후) → tts_start → tts_done → render_start
          → render_done → stream_start → stream_end.
          단계 신호는 "실제로 도달한 단계"만 보고한다 — 빈 응답이면 llm_done 까지,
          TTS/렌더 실패면 그 직전 단계까지만 나가고 이후 신호는 없다(턴 종료의
          authoritative 신호는 기존 speech_end 로 유지)."""
        log.info("[T-113] batch 모드 진입 — 답변 전체 단일 렌더")
        turn = turn if turn is not None else NULL_TURN
        sentence_q: asyncio.Queue = asyncio.Queue()
        parts: list[str] = []
        hook_fired = {"v": False}

        def _guarded_hook() -> None:
            """[실통화 디버그] 첫(유일) infer 완료 후·첫 push 직전(_infer_stage
            on_before_push) 호출 — on_response_ready(filler 정지)뿐 아니라
            on_first_audio(dc speech_start → RN dialing 화면 해제 신호)도
            여기서 함께 발동해야 한다. partial 은 "첫 오디오 프레임 push 직후"
            시점에 on_first_audio 를 부르는데, batch 는 렌더 완료 후 이 시점이
            그와 동일한 "첫 오디오 송출 시점"이다 — _run_batch 말미에서 부르면
            렌더 완료를 넘어 다음 턴까지 지연돼 dialing 화면이 고착된다(실통화
            확인: 목소리는 나오는데 화면 그대로). [T-151 라운드2] on_sentence
            (자막) 순차 발신도 여기서 함께 수행 — 아래 본문 참조."""
            hook_fired["v"] = True
            if on_response_ready is not None:
                on_response_ready()
            if on_first_audio is not None:
                try:
                    on_first_audio()
                except Exception as exc:  # 콜백 실패가 발화를 막지 않게 흡수
                    log.warning("on_first_audio callback failed: %s", exc)
            # [T-151 라운드2] batch는 TTS/렌더가 답변 전체 단위로 1회만 돌아
            # push 시점에 문장 경계가 존재하지 않는다(단일 세그먼트) — 절충으로
            # 전체 push 시작(이 훅=_infer_stage on_before_push, 재생 시작
            # 근사) 시점에 수집된 문장을 순서대로 한꺼번에 발신한다. dequeue
            # 직후(렌더 수 초 전)보다는 실제 재생 시작에 훨씬 근접한다.
            if on_sentence is not None:
                for part in parts:
                    try:
                        on_sentence(part)
                    except Exception as exc:
                        log.warning("on_sentence callback failed: %s", exc)

        async def collect():
            while True:
                item = await sentence_q.get()
                if item is None:
                    break
                parts.append(item)

        tasks = [
            asyncio.ensure_future(produce(sentence_q)),
            asyncio.ensure_future(collect()),
        ]
        try:
            try:
                await asyncio.gather(*tasks)
            except BaseException:
                for t in tasks:
                    t.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
                raise

            full_text = "".join(parts)
            # [T-258] collect() 반환 직후 = llm_done. batch 지연의 대부분이 여기까지의
            # 구간(LLM 토큰 전량 수집)이라 클라가 가장 먼저 알아야 하는 신호다.
            # join 은 마이크로초 단위 — 신호 발신이 지연을 만들지 않는다.
            _stage(on_stage, "llm_done", {"chars": len(full_text)})
            if not full_text.strip():
                # [sion MAJOR 2] 빈 응답도 filler 정지 훅을 반드시 1회 발동해야
                # FillerPlayer 가 세션 종료까지 순환하는 좀비 패턴을 막는다.
                # 실패 except 블록의 기존 방어 패턴을 그대로 재사용(hook_fired 가드).
                if not hook_fired["v"] and on_response_ready is not None:
                    try:
                        on_response_ready()
                    except Exception as exc:
                        log.warning("on_response_ready callback failed: %s", exc)
                return

            try:
                log.info("[T-113] batch full_text %d chars → TTS 1회", len(full_text))
                _stage(on_stage, "tts_start")
                wav_bytes, pcm48 = await self._tts_stage(full_text)
                # [T-258] tts_done — audio_ms 는 _tts_stage 가 이미 만든 48kHz mono
                # int16 PCM 의 길이(size/48)로 O(1) 산출. 디코드/재계산 없음.
                # 산출 불가(ndarray 아님 등)면 detail 자체를 생략한다.
                if on_stage is not None:
                    _sz = getattr(pcm48, "size", None)
                    _stage(
                        on_stage, "tts_done",
                        {"audio_ms": int(_sz / 48)} if isinstance(_sz, int) else None,
                    )
                turn.append_wav(wav_bytes)
                _stage(on_stage, "render_start")
                await self._infer_stage(
                    wav_bytes, pcm48, turn,
                    on_before_push=_guarded_hook, render_mode="batch",
                    on_stage=on_stage,
                )
                log.info("[T-113] batch render 완료(단일 모션 push)")
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                # [Task 6] batch 렌더/TTS 실패 — 크래시 없이 idle 복귀(예외 미전파).
                log.error("batch render/TTS failed: %s", exc)
                if not hook_fired["v"] and on_response_ready is not None:
                    try:
                        on_response_ready()
                    except Exception as exc2:  # 콜백 실패가 실패처리 자체를 막지 않게 흡수
                        log.warning("on_response_ready callback failed: %s", exc2)
                return
        finally:
            self.vt.signal_end()
            self.at.signal_end()

    async def _run_pipeline_partial(
        self, produce, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None,
        on_stage=None,
    ) -> None:
        """produce(sentence_q): 문장을 sentence_q 에 put 하고 끝에 None.
        TTS 워커(GPU0)와 infer 워커(GPU1)를 wav_q 로 연결해 오버랩 실행.
        turn: recorder Turn — TTS wav 누적(Phase 2 answer.wav).
        on_first_audio: 첫 오디오 프레임 push 직후 1회 동기 호출(예외 흡수).
        on_response_ready: 첫 infer 완료 후·첫 push 직전 1회 호출 — F7 filler 즉시컷.
          이벤트루프 스레드(infer_worker 코루틴)에서 호출됨 → flush() 직접 호출 OK.
          (executor 스레드 경유 불필요 — 라운드2 R-3/R-4 교훈 적용 확인).
        on_sentence: [T-151, 라운드2] 문장 세그먼트의 첫 프레임 push 직전
          (_infer_stage on_before_push, 재생 시작 근사) 1회 호출(텍스트 인자)
          — 클론 발화 자막(speech_text dc 발신)용, additive. 첫 세그먼트는
          on_response_ready(F7 필러 즉시컷)와 순서 합성(response_ready 먼저).
        on_stage: [T-258] 단계 신호 — partial 은 세그먼트 단위라 단계 경계가 batch 와
          달라서(문장마다 llm/tts/render 가 반복) 신호를 남발하지 않는다.
          **stream_start(첫 세그먼트 첫 push 직전) / stream_end(전 세그먼트 push
          완료 후, finally) 2건만** 발신한다. _infer_stage 에는 on_stage 를 전달하지
          않는다(전달하면 세그먼트마다 render_*/stream_* 가 N배로 쏟아진다).
        예외 시 모든 워커를 취소하고 signal_end 를 보장한다(좀비/오염 방지)."""
        turn = turn if turn is not None else NULL_TURN
        sentence_q: asyncio.Queue = asyncio.Queue()
        wav_q: asyncio.Queue = asyncio.Queue(maxsize=2)
        fired = {"v": False}
        # [T-258] partial 의 stream_start 는 첫 세그먼트에서 1회만. stream_end 는
        # start 가 나간 턴에서만 발신(push 가 한 번도 없었던 실패 턴에 종료만 나가는
        # 모순 방지 — 턴 종료의 authoritative 신호는 기존 speech_end 다).
        stage_streaming = {"v": False}
        # [T-120] 턴계측: _t_turn=턴 시작(say 진입) 기준시각.
        #   first_sent_ms: 첫 문장이 tts_worker 에 dequeue 된 시점.
        #   first_audio_ms: 첫 세그먼트 render+오디오 push 완료 시각.
        _t_turn = time.perf_counter()
        _m = {"first_sent_ms": None, "first_audio_ms": None, "n_seg": 0, "last_end": None}

        async def tts_worker():
            while True:
                s = await sentence_q.get()
                if s is None:
                    await wav_q.put(None)
                    break
                if _m["first_sent_ms"] is None:
                    _m["first_sent_ms"] = int((time.perf_counter() - _t_turn) * 1000)
                wav_bytes, pcm48 = await self._tts_stage(s)
                turn.append_wav(wav_bytes)
                _m["n_seg"] += 1
                # [T-151 라운드2] on_sentence는 여기서 더 이상 발신하지 않는다
                # (dequeue 직후 = TTS/렌더 수 초 전, 실기 피드백: 자막이 너무
                # 일찍 뜬다). 문장 텍스트를 wav_q 에 동승시켜 infer_worker의
                # push 직전 훅(_infer_stage on_before_push)에서 발신한다.
                await wav_q.put((s, wav_bytes, pcm48))

        async def infer_worker():
            _first_infer = True
            while True:
                item = await wav_q.get()
                if item is None:
                    break
                s, wav_bytes, pcm48 = item

                def _make_hook(sentence_text: str, fire_response_ready: bool):
                    """[T-151 라운드2] 세그먼트별 on_before_push 훅 — 첫 프레임
                    push 직전(재생 시작 근사)에 on_sentence(자막)를 발신한다.
                    첫 세그먼트는 기존 F7 즉시컷(on_response_ready)과 순서
                    합성: response_ready 먼저, 그 다음 on_sentence. 각 콜백은
                    개별 try/except — 한쪽 실패가 다른 쪽 발신을 막지 않는다."""
                    def _hook() -> None:
                        # [T-258] 첫 세그먼트의 첫 push 직전 = partial 의 stream_start.
                        # (여기가 batch 의 stream_start 와 같은 "실제 송출 시작" 지점)
                        if not stage_streaming["v"]:
                            stage_streaming["v"] = True
                            _stage(on_stage, "stream_start")
                        if fire_response_ready and on_response_ready is not None:
                            try:
                                on_response_ready()
                            except Exception as exc:
                                log.warning("on_response_ready callback failed: %s", exc)
                        if on_sentence is not None:
                            try:
                                on_sentence(sentence_text)
                            except Exception as exc:
                                log.warning("on_sentence callback failed: %s", exc)
                    return _hook

                # [F7-fix] 즉시컷은 '첫 infer 완료 후·첫 push 직전'(_infer_stage 내부) —
                # 렌더(수 초) 동안 필러가 순환하도록 여기서 미리 자르지 않는다
                # (과거 infer 직전 컷 = 렌더 시간만큼 idle 갭, T-088 라운드4 실측).
                # 호출은 이벤트루프 스레드(코루틴) → call_soon_threadsafe 불필요.
                _hook = _make_hook(s, _first_infer)
                _first_infer = False
                await self._infer_stage(wav_bytes, pcm48, turn, on_before_push=_hook)
                if _m["first_audio_ms"] is None:
                    _m["first_audio_ms"] = int((time.perf_counter() - _t_turn) * 1000)
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
            # [T-120] 턴 요약 1줄 — 체감 첫 응답(first_audio_ms)이 핵심 지표.
            log.info(
                "[turn] first_sent_ms=%s first_audio_ms=%s n_seg=%d",
                _m["first_sent_ms"], _m["first_audio_ms"], _m["n_seg"],
            )
            # [T-258] 전 세그먼트 push 완료 → stream_end. queued_ms 는 트랙이 이미
            # 들고 있는 잔량(48kHz 샘플) 조회 1회(O(1)) — 재계산 없음.
            if on_stage is not None and stage_streaming["v"]:
                _qms = None
                try:
                    _qds = getattr(self.at, "queue_depth_samples", None)
                    _rem = _qds() if _qds is not None else None
                    if isinstance(_rem, (int, float)) and _rem >= 0:
                        _qms = int(_rem / 48)
                except Exception:  # 잔량 조회 실패는 무시(신호는 detail 없이 발신)
                    _qms = None
                _stage(on_stage, "stream_end", {"queued_ms": _qms} if _qms is not None else None)
            self.vt.signal_end()
            self.at.signal_end()
