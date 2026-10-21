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
import io
import logging
import os
import re
import tempfile
import time
import wave
from typing import Callable

import numpy as np
from recorder import NULL_TURN
from clone_dialog.conversation_history import ConversationHistory


# T-806 (2026-09-22): TTS wav 앞뒤 무음 padding 헬퍼. 스펙 §6 "Speak 앞뒤 0.2s 무음"
#   요구사항 구현. Bridge 끝(입 다문 중립 포즈) → Speak 시작 (입 다문 상태) 자연 전환.
def _pad_silence(pcm: np.ndarray, sr: int, front_ms: int = 200, back_ms: int = 200) -> np.ndarray:
    """pcm(int16 1-D) 앞뒤에 무음 (zeros) 추가.
    stereo/multichannel 은 currently 이 파이프라인 미사용이라 1-D 만 다룬다."""
    if pcm.ndim != 1:
        return pcm
    n_front = int(sr * front_ms / 1000)
    n_back = int(sr * back_ms / 1000)
    silence_front = np.zeros(n_front, dtype=pcm.dtype)
    silence_back = np.zeros(n_back, dtype=pcm.dtype)
    return np.concatenate([silence_front, pcm, silence_back])


def _encode_wav_pcm(pcm: np.ndarray, sr: int) -> bytes:
    """int16 1-D pcm → 표준 WAV bytes (16-bit mono).
    MuseTalk infer_fn 은 wav_path 를 tempfile 로 소비 (pipeline.py L388 근처) 하므로
    padded pcm 을 다시 표준 WAV 로 인코딩해 넘긴다."""
    if pcm.dtype != np.int16:
        pcm = pcm.astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


# T-497: 이모지·기타 유니코드 심볼 strip — TTS(MeloTTS/OpenVoice) 가 이모지를 이상한
#   음소로 발음("이모치 하피" 왜곡 사고). LLM 이 프롬프트 규칙(_STRICT_TONE_ANCHOR §6)
#   을 어겨도 서버가 방어적으로 제거한다 (defense in depth).
_EMOJI_RE = re.compile(
    "[\U0001F600-\U0001F64F"   # emoticons
    "\U0001F300-\U0001F5FF"    # symbols & pictographs
    "\U0001F680-\U0001F6FF"    # transport & map
    "\U0001F700-\U0001F77F"
    "\U0001F780-\U0001F7FF"
    "\U0001F800-\U0001F8FF"
    "\U0001F900-\U0001F9FF"
    "\U0001FA00-\U0001FAFF"
    "☀-➿"             # misc symbols & dingbats (☺❤★ 등)
    "⌀-⏿"             # misc technical
    "\U0001F1E6-\U0001F1FF"    # regional indicator (국기)
    "︀-️"             # variation selectors
    "‍"                    # zero-width joiner (조합 이모지)
    "]+",
    flags=re.UNICODE,
)


def strip_emojis_for_tts(text: str) -> str:
    """이모지·심볼 + 마크다운 기호 제거 + 연속 공백 정규화. 순수 함수(테스트용).

    T-545B (2026-08-21): markdown 기호 (**, _, ` 등) 도 제거. wetext 정규화가
      이 기호들 있으면 tokenize 결과 empty → AssertionError → TTS 500.
    """
    if not text:
        return text
    cleaned = _EMOJI_RE.sub("", text)
    # 마크다운 기호 제거 — LLM 이 실수로 응답에 넣어도 TTS 안 깨지게.
    cleaned = re.sub(r"[*_`~]+", "", cleaned)
    # 여백 정리
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


# T-829 (2026-09-29): 응답 첫머리 감정 도입/추임새 제거 · 짧은 세그 hallucination + 지연 감소.
#   LLM 이 "아, 그렇구나." · "어, 지호야." · "음, 그러네." 같은 짧은 도입부 자주 뱉음.
#   이걸 첫 세그로 flush 하면 CosyVoice2 hallucination · 그리고 뒤 본문과 gap.
#   후처리로 첫머리 도입부 삭제 · LLM 프롬프트 규칙 11 우회 안 지킴 방어책.
#   env off: PRETHIRD_STRIP_LEAD_FILLER=0.
#
# (2026-10-02 실통화) 단어 경계가 없어 진짜 단어를 먹었다 — "응, 안양동이잖아." → "잖아."
#   ("안양동이" 를 호칭으로 오인), "아니, 나는…" → "니, 나는…"("아니" 의 "아"), "응, 그게…" →
#   "게…". 추임새·리액션 뒤에는 공백·부호·끝이, 호칭 뒤에는 부호가 와야만 지운다.
_LEAD_B = r"(?=[\s,.!?…]|$)"      # 추임새·리액션 뒤 경계
_LEAD_FILLER_RE = re.compile(
    r"^\s*"
    r"(어휴|어머|이런|어어|아아|응|어|아|음|와|헐)" + _LEAD_B +   # 추임새/감탄사
    r"[\,\.\!\?…\s]*"                                              # 구두점·공백
    r"(?:(?:그렇구나|그렇네|그러네|맞아|그래|정말|진짜|맞)" + _LEAD_B + r")?"   # "그렇구나" 등 리액션
    r"[\,\.\!\?…\s]*"
    r"(?:[가-힣]{1,4}(?:이야|야|아|이|씨)(?=[,.!?…]))?"           # 상대 이름 (지호야/민경아/윤정이) — 부호가 뒤따를 때만
    r"[\,\.\!\?…\s]*"
)


def strip_leading_filler(text: str) -> str:
    """[T-829] 첫머리 감정 도입/추임새/호칭 제거.
    - 응/어/아/음/와/헐/어휴/어머 등 추임새
    - 그렇구나/맞/그래/정말 등 짧은 리액션
    - [이름]야/아/이야 등 호칭
    - 뒤 본문이 없으면(전부 제거되면) 원본 반환(빈 응답 방지).
    env `PRETHIRD_STRIP_LEAD_FILLER=0` 로 off.
    """
    if not text:
        return text
    if os.environ.get("PRETHIRD_STRIP_LEAD_FILLER", "1") != "1":
        return text
    stripped = _LEAD_FILLER_RE.sub("", text, count=1).strip()
    # 완전히 지워졌으면 원본 유지 (LLM 응답이 짧아 도입부 하나뿐인 경우)
    if not stripped:
        return text
    return stripped


# _tts_stage_multi 와 같은 문장 경계 — 렌더 단위로 나눌 때도 같은 규칙을 쓴다.
_TTS_SENT_SPLIT_RE = re.compile(r'(?<=[.!?…])\s+|\n+')


def split_segment_for_render(text: str, min_chars: int) -> list[str]:
    """(2026-10-21) 세그먼트를 렌더 단위 문장으로 나눈다.

    sentence_buffer 가 짧은 문장을 한 세그먼트로 묶으면 _tts_stage_multi 가 문장별 TTS 를
    전부 끝낸 뒤 한꺼번에 렌더해 첫 소리가 둘째 문장 TTS 만큼 늦었다. 문장마다 렌더 큐에
    넣으면 첫 문장이 재생되는 동안 다음 문장 TTS 가 돈다.
    min_chars(기본 6자) 미만 조각("응."·"그래."·"그렇구나." 등)은 다음 조각에 붙인다(마지막이면 앞 조각에) — 너무 짧은
    렌더 조각이 생기지 않게. 붙인 조각은 _tts_stage_multi 가 다시 문장별 TTS 후 concat 한다.
    """
    parts = [p.strip() for p in _TTS_SENT_SPLIT_RE.split(text) if p.strip()]
    if len(parts) <= 1:
        return [text]
    out: list[str] = []
    carry = ""
    for p in parts:
        cur = f"{carry} {p}" if carry else p
        if len(cur) < min_chars:
            carry = cur
            continue
        out.append(cur)
        carry = ""
    if carry:
        if out:
            out[-1] = f"{out[-1]} {carry}"
        else:
            out.append(carry)
    return out


def _split_render_enabled() -> bool:
    """PRETHIRD_TTS_SPLIT_RENDER=0 이면 기존(세그먼트 통째 concat 후 렌더)."""
    return os.environ.get("PRETHIRD_TTS_SPLIT_RENDER", "1") == "1"


def _split_min_chars() -> int:
    return int(os.environ.get("PRETHIRD_TTS_SPLIT_MIN_CHARS", "6"))

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
    "방금 통화가 연결됐어. 아직 상대 얼굴을 확인하기 전이야 — 지금 화면에 누가 있는지 알 수 없어. "
    "그러니 절대 상대 이름을 부르지 마 (프롬프트에 이름이 있어도 이 시점엔 미확정). "
    "전화 받은 사람처럼 익명으로 짧게 한 문장 인사만 해. 예: '여보세요?', '네, 여보세요.', '네~', '어 왔어?'. "
    "이름·별명·호칭 (지호야, 언니, 오빠 등) 사용 금지. 얼굴 인식 후 별도 알림이 오면 그때 이름을 부르게 될 거야."
)

# AFL-926: 이 계정과 전에 통화한 적이 있을 때의 첫인사. 이름 금지 규칙은 GREETING_PROMPT 와
# 같다(얼굴 확인 전) — 다른 점은 "처음 받는 전화" 가 아니라 "아는 사람의 전화" 로 받는 것.
GREETING_PROMPT_WITH_PRIOR = (
    "방금 통화가 연결됐어. 이 상대와는 전에 통화한 적이 있어(위 '지난 통화 기록'). "
    "아직 얼굴을 확인하기 전이니 상대 이름·호칭은 절대 부르지 마. "
    "아는 사람 전화를 받은 것처럼 반갑게, **딱 한 문장, 20자 안팎**으로만 인사해. "
    "지난 통화 이야기를 꺼내려면 그 한 문장 안에 짧게 담아(예: '고추는 다 땄어?'). "
    "없는 얘기는 지어내지 마."
)

# AFL-926 (2026-10-02 실통화): 인사가 두 문장·10초 분량으로 나와 TTS 9s + 렌더 14s →
#   연결 화면 25s 안전망을 1초 차로 넘겼다. 인사 문장은 렌더 시간이 곧 연결 대기라
#   첫 문장만 쓰고 GREETING_MAX_CHARS 로 자른다(프롬프트만으로는 길이가 안 지켜진다).
GREETING_MAX_CHARS = 40
_SENTENCE_END_RE = re.compile(r"[.?!…~](?=\s|$)|\n")


def first_sentence(text: str, max_chars: int = GREETING_MAX_CHARS) -> str:
    """첫 문장(종결부호 포함)만. 그래도 길면 max_chars 안의 마지막 쉼표·공백에서 자른다."""
    t = (text or "").strip()
    m = _SENTENCE_END_RE.search(t)
    if m:
        t = t[: m.end()].strip()
    if len(t) <= max_chars:
        return t
    cut = t[:max_chars]
    for sep in (",", " "):
        i = cut.rfind(sep)
        if i >= max_chars // 2:
            return cut[:i].strip()
    return cut.strip()


def greeting_prompt(has_prior: bool) -> str:
    return GREETING_PROMPT_WITH_PRIOR if has_prior else GREETING_PROMPT


# [AFL-1003] 통화 중 전면광고 앞뒤 멘트. 고정 TTS 클립이 아니라 LLM 메시지에
# "곧 광고 나감 / 방금 광고 봤음" 사실을 system 으로 주입해 대화에 녹인다.
# (클론이 광고 인지가 없어 "광고 안 보여줘" 라고 단언하던 것을 덮는다.)
def ad_prenotice_system_message() -> dict:
    return {
        "role": "system",
        "content": (
            "[중요] 이 대답을 마치면 곧 짧은 광고가 나가. 이번 답변의 자연스러운 흐름 끝에 "
            "'아, 잠깐만 나 광고 하나 보고 올게' 같은 느낌으로 가볍게 알리고 말을 맺어. "
            "딱딱한 공지 말고 대화하듯 해. 광고를 거부하거나 '안 본다'고 하지 마. 짧게."
        ),
    }


def ad_returned_system_message() -> dict:
    return {
        "role": "system",
        "content": (
            "[중요] 사용자가 방금 짧은 광고를 다 보고 돌아왔어. 네가 먼저 '어 왔어? 광고 잘 봤어?' "
            "처럼 반갑게 말을 걸어서 끊겼던 대화를 자연스럽게 이어. 광고 봐줘서 고맙다는 뉘앙스는 "
            "가볍게 담아도 되지만, 선물이나 꽃 같은 보상 얘기는 하지 마. 짧고 자연스럽게."
        ),
    }


# [T-067] 얼굴 인식 이벤트에 대한 선제 발화 프롬프트 (react()).
REACT_PROMPT_KNOWN = (
    "방금 화면에 '{name}'님이 새로 나타났어. 하던 이야기를 잠깐 멈추고, "
    "너의 페르소나와 '{name}'님과의 관계에 맞춰 이름을 부르며 반갑게 "
    "한두 문장으로 맞이해. 예: '{name}님, 오셨군요!' 맞이하는 말만 말해."
)
# 히즈키 결정(2026-07-05): 리액션 문구는 고정하지 않고 클론 페르소나에 맡겨 그때그때
# 자연스럽게 변주한다. 단 "상대의 이름을 묻는다"는 목적은 프롬프트로 명확히 고정
# (이름 답변이 즉석등록(enroll_suggest) 프리필의 입력이 되므로 생략 불가).
# [Remember Me 2026-08-13] 이름을 **음성으로 묻지 않는다.**
#
# 예전 문구는 "반드시 상대의 이름(성함)을 물어봐" 였다. 그 답을 STT 가 받아 그대로
# 신원으로 굳히는 바람에 person 43 의 L2' 에 "이름이 카메라이다" 가 8건, persons 44 의
# display_name 에 "나는" 이 들어갔다. 이름은 이제 화면 왼쪽 [Remember Me!] 버튼으로만
# 받는다 — 이 프롬프트의 역할은 그 버튼을 눌러 달라고 안내하는 것뿐이다.
# (persona_prompt.py 의 미확정 화자 규칙과 같은 방향이다.)
REACT_PROMPT_UNKNOWN = (
    "방금 화면에 처음 보는 분이 나타났어. 너의 페르소나(말투·성격·관계 정서)에 맞게 "
    "다정하게 맞이하되, **이름을 말로 묻거나 등록·버튼·팝업 같은 UI 지시를 절대 말하지 마**. "
    "그냥 반갑고 짧게 한두 문장 인사만 해. 등록은 화면이 알아서 안내한다."
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
        self._last_emit_end: float | None = None  # [seg] 직전 _emit_sentence 종료 시각
        self._render_mode = _resolve_render_mode()  # [T-113] partial(기본)|batch 분기용

        # T-820 (2026-09-28): pre-render greeting during dialing (백그라운드 워밍업).
        #   목적: 사용자가 dialing 화면 보는 동안 서버가 greeting 을 LLM+TTS+MuseTalk
        #   까지 완료 후 캐시. 첫 say() 호출 시 22s → 0s 로 즉시 응답.
        #   초기값: not ready · not used. prerender_greeting() 이 채움.
        self._prerender_ready = False
        self._prerender_used = False
        self._prerender_text: str = ""
        self._prerender_wav_bytes: bytes | None = None
        self._prerender_frames: list = []
        self._prerender_pcm_bal = None

        # AFL-1003: 통화 광고 복귀 멘트 버퍼링. 광고 '시작'에 prepare_ad_return() 을 백그라운드로
        #   돌려 복귀 턴(LLM+TTS+MuseTalk)을 미리 렌더해 둔다. 광고 '종료' 신호(push_ad_return)에
        #   버퍼를 즉시 push → 종료 직후 바로 재생. 준비 전이면 실시간 say(ad_event="returned") 폴백.
        self._ad_return_ready = False
        self._ad_return_preparing = False
        self._ad_return_task = None
        self._ad_return_text: str = ""
        self._ad_return_wav_bytes: bytes | None = None
        self._ad_return_frames: list = []
        self._ad_return_pcm_bal = None

        # T-821 (2026-09-28): 대화 히스토리 배선. env PRETHIRD_HISTORY_TURNS=N 이면 최근 N턴을
        #   LLM messages 에 첨부 · 미설정 시 0 (기존 동작). say()/_system_utterance() 완료
        #   후 record() 로 assistant 응답을 누적. 이전엔 클래스만 있고 wiring 이 없어 매 턴이
        #   첫 턴처럼 취급되어 페르소나 규칙 A (초반 인사)가 반복 발동했다.
        self._history = ConversationHistory.from_env()
        # AFL-926: 이전 대화 로딩·인사 prerender 태스크. signaling 이 offer 직후 띄운다.
        #   발화 경로(say/greet/react)는 메시지 조립 전에 이전 대화 로딩을 잠깐 기다린다.
        # AFL-926: 앱이 Bridge 클립을 트는 통화인지(offer "bridge"). None = 모름(구 앱) → 기존처럼 대기.
        self.uses_bridge: bool | None = None
        self._prior_task: asyncio.Future | None = None
        # [2026-10-20 sungjius] 이 계정×클론 이전 대화 0건(load_prior 가 판정). 프롬프트 첫 대화 규칙용.
        self.first_meeting = False
        self._prerender_task: asyncio.Future | None = None

    # ------------------------------------------------------------------
    # 퍼블릭 API
    # ------------------------------------------------------------------

    def update_persona(self, messages: list) -> None:
        """[T-067 Task 12] persona_messages 교체 — 다음 턴(say/speak/react/greet)부터 반영.
        진행 중인 발화에는 영향 없음(각 호출 시점에 self.persona_messages를 읽어 조립)."""
        self.persona_messages = list(messages)

    async def _render_to_cache(self, wav_bytes: bytes, pcm48: np.ndarray) -> tuple[list, "np.ndarray"]:
        """T-820: MuseTalk infer 을 트랙에 push 안 하고 frames+pcm_bal 반환.
        _infer_stage 와 동일한 렌더링 로직이지만 tvt/at push 대신 결과만 리턴."""
        loop = asyncio.get_event_loop()
        frames_buf: list = []
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(wav_bytes)
            wav_path = f.name

        def on_frame(arr):
            frames_buf.append(arr)

        try:
            await loop.run_in_executor(None, self.infer_fn, wav_path, on_frame)
        finally:
            try:
                os.unlink(wav_path)
            except OSError:
                pass

        nframes = len(frames_buf)
        if nframes > 0:
            pcm_bal, _ = self._balance(pcm48, nframes)
        else:
            pcm_bal = pcm48
        if self._norm_on:
            pcm_bal = self._normalize(pcm_bal)
        pcm_bal = self._edge_fade(pcm_bal, fade_ms=self._fade_ms)
        return frames_buf, pcm_bal

    # ------------------------------------------------------------------
    # AFL-926: 이전 대화 (통화 간 이어붙이기)
    # ------------------------------------------------------------------

    async def load_prior(self, user_id, clone_id, call_id: str | None = None) -> None:
        """이 계정×클론의 이전 통화 턴을 받아 히스토리에 심는다. 실패해도 조용히 빈 채로.

        조회가 성공했는데 0건이면 first_meeting=True(첫 대화). 꺼져 있거나 실패하면 False 그대로.
        """
        from prior_conversation import fetch_prior
        turns = await fetch_prior(user_id, clone_id, exclude_call_id=call_id)
        if turns:
            self._history.seed_prior(turns)
        elif turns is not None:
            self.first_meeting = True

    async def _await_prior(self, timeout: float = 2.5) -> None:
        """이전 대화 로딩이 진행 중이면 잠깐 기다린다. 넘기면 없는 채로 진행(통화 우선)."""
        task = self._prior_task
        if task is None or task.done():
            return
        try:
            await asyncio.wait_for(asyncio.shield(task), timeout)
        except Exception as e:  # noqa: BLE001 — timeout 포함, 발화를 막지 않는다
            log.warning("[AFL-926/prior] 대기 생략: %s", type(e).__name__)

    async def _generate_greeting_text(self) -> str:
        """AFL-926 대안 B: 첫인사 문장을 LLM 으로 만든다(이전 대화 반영). 실패하면 ""."""
        await self._await_prior()
        messages = (
            self.persona_messages
            + self._history.messages()
            + [{"role": "user", "content": greeting_prompt(self._history.has_prior())}]
        )
        try:
            out: list[str] = []
            agen = self.chat_fn(messages)
            try:
                async for tok in agen:
                    out.append(str(tok))
                    # 첫 문장이 끝나면 더 받지 않는다 — 어차피 잘라 버릴 토큰이다.
                    if _SENTENCE_END_RE.search("".join(out).strip()):
                        break
            finally:
                aclose = getattr(agen, "aclose", None)
                if aclose is not None:
                    await aclose()
            return first_sentence("".join(out))
        except Exception as e:  # noqa: BLE001
            log.warning("[AFL-926/prerender] 인사 생성 실패: %s", e)
            return ""

    def cancel_background(self) -> None:
        """통화 종료 시 signaling teardown 이 부른다 — 남은 prior·prerender 태스크 취소."""
        for task in (self._prior_task, self._prerender_task, self._ad_return_task):
            if task is not None and not task.done():
                task.cancel()

    def start_prerender_greeting(self, text: str | None) -> None:
        """signaling 용: prerender 를 백그라운드로 띄우고 greet() 가 기다릴 수 있게 잡아 둔다."""
        self._prerender_task = asyncio.ensure_future(self.prerender_greeting(text))

    async def prerender_greeting(self, text: str | None = "안녕! 반가워.") -> None:
        """T-820 (2026-09-28): dialing 중 인사말 pre-render (백그라운드).

        signaling.py 의 offer 핸들러가 세션 setup 직후 asyncio.ensure_future 로 호출.
        TTS + MuseTalk 완료 후 cache 에 저장 → 인사 즉시 push.

        AFL-926: text=None 이면 고정 문구 대신 LLM 이 인사를 만든다(이전 대화 반영 —
        대안 B). 생성이 실패하면 env PRETHIRD_PRERENDER_TEXT(기본 "안녕! 반가워.")로 폴백.
        캐시는 greet() 가 먼저 쓴다(greet 꺼진 레거시 모드에서만 첫 say() 가 쓴다).

        clone 미준비면 skip. 이미 준비됐거나 사용됐으면 no-op."""
        if self._prerender_ready or self._prerender_used:
            return
        if self.clone_locked and not self.se_path:
            log.info("[T-820/prerender] clone voice 미준비 — skip")
            return
        import time as _time
        t0 = _time.perf_counter()
        try:
            if text is None:
                text = await self._generate_greeting_text() or os.environ.get(
                    "PRETHIRD_PRERENDER_TEXT", "안녕! 반가워.")
                log.info("[AFL-926/prerender] LLM 인사 '%s' prior=%s llm_ms=%d",
                         text[:40], self._history.has_prior(),
                         int((_time.perf_counter() - t0) * 1000))
                if self._prerender_used:
                    # 생성하는 사이 greet 가 기다리다 포기하고 직접 인사했다 — 버린다.
                    return
            wav_bytes, pcm48 = await self._tts_stage(text)
            if self._prerender_used:
                return                    # (el) 포기된 인사에 GPU 렌더를 쓰지 않는다
            frames, pcm_bal = await self._render_to_cache(wav_bytes, pcm48)
            if self._prerender_used:
                return
            self._prerender_text = text
            self._prerender_wav_bytes = wav_bytes
            self._prerender_frames = frames
            self._prerender_pcm_bal = pcm_bal
            self._prerender_ready = True
            log.info(
                "[T-820/prerender] cached '%s' frames=%d prep_ms=%d",
                text[:40], len(frames), int((_time.perf_counter() - t0) * 1000),
            )
        except Exception as e:
            log.warning("[T-820/prerender] failed: %s", e)

    async def prewarm(self, text: str = "웜") -> None:
        """[T-825] GPU/모델 warm-up: 짧은 텍스트로 TTS+MuseTalk 통과 · 결과 버림.

        Session offer 직후 signaling 이 백그라운드로 호출. 첫 실통화 turn 시
        whisper cold=1.9s → warm=0.03s · unet cudnn 캐시 활성 등 · Turn 1 지연 감소.

        T-820 (prerender_greeting) 과 결정적 차이 — 결과 (frames/wav) 를
        **캐시하지 않음** · self._prerender_* 안 건드림 · say() 캐시 hit 없음.
        따라서 사용자에게 두 답변 사고 발생 안 함 (T-820 실패 원인 회피).

        Clone 미준비면 skip."""
        if self.clone_locked and not self.se_path:
            log.info("[T-825/prewarm] clone voice 미준비 — skip")
            return
        import time as _time
        t0 = _time.perf_counter()
        try:
            wav_bytes, pcm48 = await self._tts_stage(text)
            # 렌더 후 결과 버림 · push 안 함
            frames, _ = await self._render_to_cache(wav_bytes, pcm48)
            log.info(
                "[T-825/prewarm] done text=%r frames=%d prep_ms=%d",
                text, len(frames), int((_time.perf_counter() - t0) * 1000),
            )
        except Exception as e:
            log.warning("[T-825/prewarm] failed: %s", e)

    async def _push_prerender(self, turn, on_first_audio, on_response_ready, on_sentence) -> None:
        """T-820 캐시(frames/wav)를 즉시 push 하고 히스토리에 남긴다. 1회용."""
        self._prerender_used = True
        log.info(
            "[T-820/prerender] cache hit · pushing '%s' (%d frames)",
            self._prerender_text[:40], len(self._prerender_frames),
        )
        try:
            if on_response_ready is not None:
                try:
                    on_response_ready()
                except Exception as e:
                    log.warning("on_response_ready callback failed: %s", e)
            if on_sentence is not None:
                try:
                    on_sentence(self._prerender_text)
                except Exception as e:
                    log.warning("on_sentence callback failed: %s", e)
            # AFL-926: greet 경로는 첫 오디오 = speech_start(다이얼링 해제)·과금 시작점.
            if on_first_audio is not None:
                try:
                    on_first_audio()
                except Exception as e:
                    log.warning("on_first_audio callback failed: %s", e)
            # recorder 반영 (answer.txt/wav/mp4 저장 시 사용).
            for tok in self._prerender_text:
                turn.append_token(tok)
            if self._prerender_wav_bytes is not None:
                turn.append_wav(self._prerender_wav_bytes)
            for arr in self._prerender_frames:
                self.vt.push_ndarray(arr)
            if self._prerender_pcm_bal is not None:
                self.at.push_pcm_int16(self._prerender_pcm_bal)
            turn.append_frames(self._prerender_frames, self._prerender_pcm_bal, fps=25)
        finally:
            self.vt.signal_end()
            self.at.signal_end()
        # T-821: prerender 인사도 history 에 남긴다 (다음 turn 에 클론이 또 인사하는 것 방지).
        #   user_text=None (prerender 는 시스템 발화 · greet 과 동일 취급).
        self._history.record(None, self._prerender_text)

    # ── AFL-1003: 광고 복귀 멘트 버퍼링 (prerender 패턴 재사용) ──────────────────────
    def start_prepare_ad_return(self) -> None:
        """signaling 용: 광고 '시작' 신호에 복귀 턴을 백그라운드로 미리 렌더."""
        if self._ad_return_ready or self._ad_return_preparing:
            return
        self._ad_return_task = asyncio.ensure_future(self.prepare_ad_return())

    async def prepare_ad_return(self) -> None:
        """광고 재생 중 호출 — 복귀 턴(클론 주도 "광고 잘 봤어?")을 LLM+TTS+MuseTalk 로 미리
        렌더해 버퍼에 담는다. push 는 안 한다(광고 종료 신호 때 push_ad_return 이 push).
        clone 미준비/이미 준비됨/준비 중이면 no-op."""
        if self._ad_return_ready or self._ad_return_preparing:
            return
        if self.clone_locked and not self.se_path:
            log.info("[AFL-1003/ad_return] clone voice 미준비 — skip")
            return
        self._ad_return_preparing = True
        import time as _time
        t0 = _time.perf_counter()
        try:
            await self._await_prior()
            messages = (
                self.persona_messages
                + self._history.messages()
                + [ad_returned_system_message()]
                + [{"role": "user", "content":
                    "(사용자가 광고를 다 보고 막 돌아왔다. 네가 먼저 자연스럽게 말을 걸어 대화를 이어.)"}]
            )
            out: list[str] = []
            agen = self.chat_fn(messages)
            try:
                async for tok in agen:
                    out.append(str(tok))
            finally:
                aclose = getattr(agen, "aclose", None)
                if aclose is not None:
                    await aclose()
            text = "".join(out).strip()
            if not text:
                log.warning("[AFL-1003/ad_return] 빈 응답 — 버퍼 skip")
                return
            wav_bytes, pcm48 = await self._tts_stage(text)
            frames, pcm_bal = await self._render_to_cache(wav_bytes, pcm48)
            self._ad_return_text = text
            self._ad_return_wav_bytes = wav_bytes
            self._ad_return_frames = frames
            self._ad_return_pcm_bal = pcm_bal
            self._ad_return_ready = True
            log.info("[AFL-1003/ad_return] prepared '%s' frames=%d prep_ms=%d",
                     text[:40], len(frames), int((_time.perf_counter() - t0) * 1000))
        except asyncio.CancelledError:
            raise
        except Exception as e:  # noqa: BLE001
            log.warning("[AFL-1003/ad_return] prepare failed: %s", e)
        finally:
            self._ad_return_preparing = False

    async def push_ad_return(
        self, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None,
        wait_ms: int = 8000,
    ) -> None:
        """광고 '종료' 신호에 호출 — 미리 렌더된 복귀 버퍼를 즉시 push. 아직 준비 중이면
        최대 wait_ms 기다렸다 push. 버퍼가 끝내 없으면 실시간 say(ad_event="returned") 폴백."""
        turn = turn if turn is not None else NULL_TURN
        if not self._ad_return_ready and self._ad_return_preparing and wait_ms > 0:
            waited = 0
            while self._ad_return_preparing and not self._ad_return_ready and waited < wait_ms:
                await asyncio.sleep(0.1)
                waited += 100
        if not self._ad_return_ready:
            log.info("[AFL-1003/ad_return] 버퍼 미준비 — 실시간 say 폴백")
            await self.say("", turn=turn, ad_event="returned", on_first_audio=on_first_audio,
                           on_response_ready=on_response_ready, on_sentence=on_sentence)
            return
        # 1회용 소비.
        self._ad_return_ready = False
        text = self._ad_return_text
        log.info("[AFL-1003/ad_return] push '%s' (%d frames)", text[:40], len(self._ad_return_frames))
        try:
            if on_response_ready is not None:
                try:
                    on_response_ready()
                except Exception as e:
                    log.warning("on_response_ready callback failed: %s", e)
            if on_sentence is not None:
                try:
                    on_sentence(text)
                except Exception as e:
                    log.warning("on_sentence callback failed: %s", e)
            if on_first_audio is not None:
                try:
                    on_first_audio()
                except Exception as e:
                    log.warning("on_first_audio callback failed: %s", e)
            for tok in text:
                turn.append_token(tok)
            if self._ad_return_wav_bytes is not None:
                turn.append_wav(self._ad_return_wav_bytes)
            for arr in self._ad_return_frames:
                self.vt.push_ndarray(arr)
            if self._ad_return_pcm_bal is not None:
                self.at.push_pcm_int16(self._ad_return_pcm_bal)
            turn.append_frames(self._ad_return_frames, self._ad_return_pcm_bal, fps=25)
        finally:
            self.vt.signal_end()
            self.at.signal_end()
        # 복귀는 클론 주도 턴 — user_text=None 으로 기록(가짜 유저턴 프롬프트 오염 방지).
        self._history.record(None, text)

    async def say(
        self, user_text: str, turn=None, on_first_audio=None, on_response_ready=None,
        on_sentence=None, on_reply_done=None, ad_event: str | None = None,
    ) -> None:
        """user_text 1턴을 처리해 video/audio 트랙에 적재하고 signal_end 호출.
        turn: recorder Turn 핸들(없으면 NULL_TURN) — LLM 토큰·TTS wav 누적.
        on_response_ready: 첫 infer 완료 후·첫 push 직전 1회 호출 (F7 filler 즉시컷).
        on_sentence: [T-151, 라운드2] 문장 1개의 첫 프레임 push 직전(재생 시작
          근사) 1회 호출(텍스트 인자) — 클론 발화 자막(speech_text dc 발신)용,
          additive. (기존: tts_worker dequeue 직후 호출이라 재생보다 수 초
          선행 — 실기 피드백으로 push 단계로 이동)"""
        turn = turn if turn is not None else NULL_TURN
        if self.clone_locked and not self.se_path:
            log.warning("clone voice 미준비 — 발화 skip (폴백 없음)")
            return

        # T-820 (2026-09-28): pre-render cache hit — 첫 say() 1회만 사용.
        #   dialing 중 prerender_greeting() 이 채운 캐시가 준비되어 있으면
        #   LLM+TTS+MuseTalk 전체 스킵하고 즉시 push. 나머지 turn 은 정상 흐름.
        # AFL-926: greet 가 켜져 있으면 캐시는 greet() 의 것이다. 여기서 쓰면 사용자의 첫
        #   말에 인사가 대답으로 나간다(2026-09-28 prerender-off 의 원인으로 추정).
        # AFL-1003: 광고 예고/복귀 턴은 캐시 인사로 빠지면 안 된다(ad_event 무시 방지). 운영은
        #   GREETING_ENABLED=0 이라 이 분기가 켜져 있어, 가드 없으면 복귀 턴이 캐시 인사를 소비한다.
        if (ad_event is None and self._prerender_ready and not self._prerender_used
                and os.environ.get("PRETHIRD_GREETING_ENABLED", "1") != "1"):
            await self._push_prerender(turn, None, on_response_ready, on_sentence)
            return

        await self._await_prior()
        # T-821: 이전 턴 messages 를 persona 뒤 · 현재 발화 앞에 삽입.
        #   미설정(0) 이면 messages() 가 [] → 회귀 0.
        if ad_event == "returned":
            # [AFL-1003] 광고 복귀 — 사용자 발화 없는 클론 주도 턴. 가짜 유저턴은 LLM 입력에만
            #   쓰고 history 에는 남기지 않는다(함수 끝 record 에서 user_text=None).
            messages = (
                self.persona_messages
                + self._history.messages()
                + [ad_returned_system_message()]
                + [{"role": "user", "content":
                    "(사용자가 광고를 다 보고 막 돌아왔다. 네가 먼저 자연스럽게 말을 걸어 대화를 이어.)"}]
            )
        else:
            messages = (
                self.persona_messages
                + self._history.messages()
                + [{"role": "user", "content": user_text}]
            )

        # [Remember Me 2026-08-13] 이름 부르기 힌트 — 딱 1회 소비하고 지운다.
        #
        # 얼굴이 잠깐 안 잡혔다가 같은 사람이 돌아온 경우다. 인사(react)를 걸면 "다시
        # 왔네" 가 매번 나가 대화가 끊긴다(히즈키 실측). 대신 이번 응답에서 이름을 한 번
        # 부르게 해 어색해진 구간을 자연스럽게 잇는다.
        # [T-566 2026-08-24] 매 턴 자동 화자 힌트 — self.current_speaker_name 이 세팅돼 있으면
        # LLM 이 상대 신원을 절대 놓치지 않도록 시스템 지시 1줄 첨부.
        # signaling.py 의 _maybe_swap_l2p 성공 시(speaker_confirmed) 세팅, _clear_current_speaker
        # 시 None. 얼굴 인식 결과가 프롬프트 재조립 이외의 실시간 사실로 매 응답 반영된다.
        _speaker_now = getattr(self, "current_speaker_name", None)
        if _speaker_now:
            messages = messages + [{
                "role": "system",
                "content": (
                    f"[중요] 지금 카메라 앞에 실제로 있는 사람은 '{_speaker_now}' 님이야. "
                    f"사용자가 '너 나 알아?' '내 얼굴 봤을 때 누군지 맞춰봐' 같이 신원을 묻거나 "
                    f"확인을 요청하면 '{_speaker_now}'라는 이름을 자연스럽게 말하며 알아본다고 답해줘. "
                    f"'기억이 잘 안 나' '누군지 모르겠다' 같은 회피성 답변 금지. "
                    # T-838 (2026-09-30): 얼굴 환각 방지 · 실제 볼 수 있는 건 이름 매칭 결과뿐 ·
                    #   외모·표정·기분·복장·날씨는 판단 못 함. "오늘따라 멋있어" "피곤해 보이네"
                    #   "얼굴이 좋아 보여" 같은 환각 표현 절대 금지.
                    f"⚠️ 단, 상대의 얼굴 상태·표정·기분·외모·복장(멋있다·피곤해 보인다·"
                    f"오늘따라 다르다·안색이 어떻다 등)은 **실제로 볼 수 없으니 절대 언급 X**. "
                    f"이건 신원 매칭 결과일 뿐 · 시각적 관찰 아님. 외모 판단은 환각."
                ),
            }]

        _hint = getattr(self, "name_mention_hint", None)
        if _hint:
            self.name_mention_hint = None
            messages = messages + [{
                "role": "system",
                "content": (
                    f"지금 대화 상대는 '{_hint}' 님이야. 이번 답변에서 그 이름을 한 번만 "
                    "자연스럽게 불러 줘. 다시 만났다는 인사나 확인하는 말은 하지 마 — "
                    "하던 대화를 그대로 이어가면서 이름만 섞으면 된다."
                ),
            }]

        # [AFL-1003] 광고 예고 — 인자(ad_event="pre") 또는 1회성 힌트. 소비 후 지운다.
        #   복귀(returned) 턴에는 붙이지 않는다(서로 모순).
        if ad_event != "returned" and (
            ad_event == "pre" or getattr(self, "ad_notice_hint", None) == "pre"
        ):
            self.ad_notice_hint = None
            messages = messages + [ad_prenotice_system_message()]

        # T-821: assistant 응답 로컬 누적 → _run_pipeline 종료 후 history.record().
        #   turn._tokens 를 재사용하지 않는 이유: turn 이 NULL_TURN 이면 실기록이
        #   없어 그 값에 기대면 히스토리도 빈다. 로컬 리스트로 대체.
        answer_tokens: list[str] = []

        async def produce(q: asyncio.Queue):
            sb = self._sb_factory()
            async for tok in self.chat_fn(messages):
                turn.append_token(tok)
                answer_tokens.append(str(tok))
                for s in sb.push(tok):
                    await q.put(s)
            # AFL-926: 응답 텍스트 확정 시점 통지(턴 기록용). 재생(Bridge·렌더·push)은 아직
            #   한참 남았지만 기록은 지금 해야 끊고 바로 다시 건 통화가 이 턴을 받아 온다.
            if on_reply_done is not None:
                try:
                    on_reply_done("".join(answer_tokens))
                except Exception as e:  # noqa: BLE001 — 기록 실패가 발화를 막으면 안 된다
                    log.warning("on_reply_done callback failed: %s", e)
            for s in sb.flush():
                await q.put(s)
            await q.put(None)

        await self._run_pipeline(produce, turn, on_first_audio, on_response_ready, on_sentence=on_sentence)
        # T-821: 발화 완료 · assistant_text 기록. 빈 응답이면 클래스 내부에서 skip.
        # [AFL-1003] 광고 복귀는 클론 주도 턴 — greet 관례대로 user_text=None 으로 기록.
        self._history.record(None if ad_event == "returned" else user_text,
                             "".join(answer_tokens))

    async def speak(
        self, text: str, turn=None, on_first_audio=None, on_response_ready=None,
        on_sentence=None,
    ) -> None:
        """LLM 우회: 입력 텍스트를 그대로 발화(TTS+musetalk). 쉼표로 끊지 않고
        문장 종결부호(.!?…\\n)로만 분할. 한 문장이면 통째 1회.
        on_response_ready: 첫 infer 완료 후·첫 push 직전 1회 호출 (F7 filler 즉시컷).
        on_sentence: [T-151] 클론 발화 자막용 문장별 콜백(say() 참조)."""
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

        await self._run_pipeline(produce, turn, on_first_audio, on_response_ready, on_sentence=on_sentence)

    async def greet(self, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None) -> None:
        """통화 연결 직후 클론이 먼저 건네는 인사. LLM이 페르소나 기반 1문장 생성.
        say()와 동일 파이프라인이되 user 입력 대신 GREETING_PROMPT 지시를 준다.
        on_response_ready: 첫 infer 완료 후·첫 push 직전 1회 호출 (F7 filler 즉시컷, greet는 보통 None).
        on_sentence: [T-151] 클론 발화 자막용 문장별 콜백(say() 참조).

        AFL-926 대안 B: 다이얼링 중 prerender 가 돌고 있으면 잠깐 기다렸다가(기본 6초)
        캐시된 인사를 즉시 내보낸다. 준비가 안 되면 기존대로 LLM 으로 바로 만든다."""
        turn_ = turn if turn is not None else NULL_TURN
        task = self._prerender_task
        if task is not None and not task.done() and not self._prerender_used:
            try:
                wait_s = float(os.environ.get("PRETHIRD_PRERENDER_WAIT_S", "6"))
            except ValueError:
                wait_s = 6.0
            try:
                await asyncio.wait_for(asyncio.shield(task), wait_s)
            except Exception as e:  # noqa: BLE001
                log.warning("[AFL-926/greet] prerender 대기 생략: %s", type(e).__name__)
                if not self._prerender_ready:
                    task.cancel()         # (el) 직접 인사와 GPU 를 다투지 않게 접는다
        if self._prerender_ready and not self._prerender_used:
            await self._push_prerender(turn_, on_first_audio, on_response_ready, on_sentence)
            return
        # 캐시 없이 직접 인사 — 뒤늦게 끝난 prerender 가 첫 say 로 새지 않게 막는다.
        self._prerender_used = True
        await self._await_prior()
        await self._system_utterance(
            greeting_prompt(self._history.has_prior()), "greet", turn=turn,
            on_first_audio=on_first_audio, on_response_ready=on_response_ready,
            on_sentence=on_sentence,
        )

    async def react(self, kind: str, display_name: str | None = None, turn=None, on_first_audio=None) -> None:
        """[T-067] 얼굴 인식 이벤트에 대한 선제 발화(끼어들기). greet()와 동일 골격(_system_utterance 공유).
        kind: "known"(아는 얼굴 — display_name 필수) | "unknown"(모르는 얼굴/multi_face).
        쿨다운·토글 판단은 호출부(signaling._handle_face_event)의 책임 — 여기선 발화만 수행."""
        prompt = (
            REACT_PROMPT_KNOWN.format(name=display_name)
            if kind == "known" else REACT_PROMPT_UNKNOWN
        )
        # AFL-926 (el): react 가 greet 보다 먼저 오면, react 맥락 없이 만든 캐시 인사가 뒤늦게
        #   나가지 않게 막는다(greet 는 직접 LLM 경로로 간다).
        self._prerender_used = True
        await self._system_utterance(prompt, "react", turn=turn, on_first_audio=on_first_audio)

    # ------------------------------------------------------------------
    # 내부: greet()/react() 공용 — 시스템 지시 프롬프트 1개 발화
    # ------------------------------------------------------------------

    async def _system_utterance(
        self, prompt: str, label: str, turn=None, on_first_audio=None, on_response_ready=None,
        on_sentence=None,
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
        await self._await_prior()
        # T-821: greet/react 는 시스템 지시라 user turn 아님 · 히스토리에는 persona
        #   context 도, 이전 턴도 그대로 활용. prompt 는 지시문이니 messages 에는
        #   포함하되 history.record 는 user_text=None 으로 남긴다 (다음 턴 프롬프트
        #   오염 방지 — ConversationHistory 주석 참조).
        messages = (
            self.persona_messages
            + self._history.messages()
            + [{"role": "user", "content": prompt}]
        )

        answer_tokens: list[str] = []

        async def produce(q: asyncio.Queue):
            sb = self._sb_factory()
            async for tok in self.chat_fn(messages):
                turn.append_token(tok)
                answer_tokens.append(str(tok))
                for s in sb.push(tok):
                    await q.put(s)
            for s in sb.flush():
                await q.put(s)
            await q.put(None)

        await self._run_pipeline(
            produce, turn, on_first_audio, on_response_ready, force_partial=True,
            on_sentence=on_sentence,
        )
        # T-821: greet/react 응답도 히스토리에 남긴다 (다음 턴에 재-인사 방지).
        self._history.record(None, "".join(answer_tokens))

    # ------------------------------------------------------------------
    # 내부: 문장 1개 처리 (스테이지 분리)
    # ------------------------------------------------------------------

    async def _tts_stage(self, sentence: str, strip_lead: bool = True):
        """문장 → TTS wav bytes + 48kHz int16 PCM. (GPU0: qwen3 TTS)

        T-497: 이모지 strip. LLM 이 프롬프트 규칙 어기고 이모지 뱉어도 여기서
        방어적으로 제거해 TTS 왜곡("이모치 하피") 방지. 원본 sentence 는 자막
        발신에서 이미 소비된 뒤라 여기서 sanitize 해도 UX 영향 없음.

        T-806 (2026-09-22): TTS 앞뒤에 각 200ms 무음 padding 추가 (스펙 §6).
          MuseTalk 이 wav 를 입 다문 상태로 시작·종료 → Bridge (입 다문 중립 포즈로
          끝남) 에서 Speak 로 넘어갈 때 표정 점프 없음.

        T-822 (2026-09-28): pad ms 를 env 로 노출.
          PRETHIRD_TTS_PAD_FRONT_MS · PRETHIRD_TTS_PAD_BACK_MS · 기본 200/200.
          Partial 모드에선 문장마다 padding 이 붙어 문장 사이 무음이 (back+front)
          만큼 이중으로 삽입된다 — 사용자 체감 "공백 길다". 값을 50/50 등으로
          낮추면 문장 사이 100ms 로 줄어들고 Bridge 이음매 padding 은 그대로 유지.
        """
        clean = strip_emojis_for_tts(sentence)
        # T-829 (2026-09-29): 첫머리 감정 도입/추임새 제거.
        #   strip_lead=False: 세그먼트를 문장별로 나눠 렌더할 때 둘째 문장부터(2026-10-21).
        if strip_lead:
            clean = strip_leading_filler(clean)
        # T-828 (2026-09-29): 종결 부호 없는 짧은 문장 (예: "고마워") 에 마침표 자동 추가.
        #   CosyVoice2/Qwen3-TTS 는 마침표 있으면 종결 하강 억양 유도 · 없으면 애매 종결.
        #   실통화 실측: "고마워" 끝음 상승 · "고마워." 끝음 하강. env 로 off 가능.
        if os.environ.get("PRETHIRD_TTS_AUTO_PERIOD", "1") == "1":
            if clean and not clean.rstrip().endswith(('.', '!', '?', '…', '。', '！', '？')):
                clean = clean.rstrip() + '.'
        wav_bytes = await self.say_fn(clean or sentence, self.se_path)
        pcm, sr, _ = self.decode_wav_fn(wav_bytes)
        # T-806/822 무음 padding — env 기본 200/200, 조정 가능.
        front = int(os.environ.get("PRETHIRD_TTS_PAD_FRONT_MS", "200"))
        back = int(os.environ.get("PRETHIRD_TTS_PAD_BACK_MS", "200"))
        pcm = _pad_silence(pcm, sr, front_ms=front, back_ms=back)
        wav_bytes = _encode_wav_pcm(pcm, sr)  # MuseTalk 은 wav_bytes 를 파일로 저장해 소비
        pcm48 = self._resample(pcm, sr, 48000)
        return wav_bytes, pcm48

    async def _tts_stage_multi(self, full_text: str, strip_lead: bool = True):
        """다중 문장 → 각 문장별 _tts_stage → pcm concat → 통합 wav + pcm48 반환.

        T-806 후속 (2026-09-22): Batch mode 로 답변 통째 TTS 하면 Qwen3-TTS 가
        문장 사이 pause 를 자연 처리하다가 filler/hallucination (클럽 노래 같은
        비-음성 소리) 를 생성하는 버그 회피. 마침표/느낌표/물음표 기준으로 분리해
        문장별로 TTS 호출하면 각 호출 앞뒤 200ms padding 이 문장 사이 400ms 무음
        구간으로 자연 삽입 → TTS 가 filler 낄 자리가 사라짐.

        단일 문장이면 기존 _tts_stage 그대로 위임 (backward compat).
        """
        sentences = [s.strip() for s in re.split(r'(?<=[.!?…])\s+|\n+', full_text) if s.strip()]
        if len(sentences) <= 1:
            return await self._tts_stage(full_text, strip_lead=strip_lead)
        pcm_native_parts: list[np.ndarray] = []
        pcm_48k_parts: list[np.ndarray] = []
        sr_native: int | None = None
        # T-822: env 로 pad ms 노출 (기본 200/200). _tts_stage 와 동일 값 사용.
        _pad_front = int(os.environ.get("PRETHIRD_TTS_PAD_FRONT_MS", "200"))
        _pad_back = int(os.environ.get("PRETHIRD_TTS_PAD_BACK_MS", "200"))
        # T-828: multi 분기도 auto-period 적용 (개별 세그 각각).
        # T-829: multi 분기 · 첫 세그(sentences[0])에만 lead-filler 제거 · 뒤 세그는 유지.
        _auto_period = os.environ.get("PRETHIRD_TTS_AUTO_PERIOD", "1") == "1"
        for _idx, sent in enumerate(sentences):
            clean = strip_emojis_for_tts(sent)
            if _idx == 0 and strip_lead:
                clean = strip_leading_filler(clean)
            if _auto_period and clean and not clean.rstrip().endswith(('.', '!', '?', '…', '。', '！', '？')):
                clean = clean.rstrip() + '.'
            wav_bytes_i = await self.say_fn(clean or sent, self.se_path)
            pcm_i, sr_i, _ = self.decode_wav_fn(wav_bytes_i)
            pcm_i = _pad_silence(pcm_i, sr_i, front_ms=_pad_front, back_ms=_pad_back)
            if sr_native is None:
                sr_native = sr_i
            elif sr_i != sr_native:
                # sr 이 문장 사이 다르면 concat 불가 — 안전 폴백: 통짜 TTS.
                log.warning(
                    "[T-806/tts-multi] sr mismatch (first=%d, cur=%d) — 통짜 TTS 로 폴백",
                    sr_native, sr_i,
                )
                return await self._tts_stage(full_text)
            pcm_native_parts.append(pcm_i)
            pcm_48k_parts.append(self._resample(pcm_i, sr_i, 48000))
        combined_native = np.concatenate(pcm_native_parts)
        combined_48k = np.concatenate(pcm_48k_parts)
        wav_bytes = _encode_wav_pcm(combined_native, sr_native)
        log.info(
            "[T-806/tts-multi] %d문장 concat 완료 (총 %d samples @ %dHz)",
            len(sentences), combined_native.shape[0], sr_native,
        )
        return wav_bytes, combined_48k

    async def _infer_stage(
        self, wav_bytes: bytes, pcm48: np.ndarray, turn=None, on_before_push=None,
        render_mode: str | None = None, min_push_at: float | None = None,
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
        min_push_at: [T-824] time.perf_counter() 기준 이 시각 전에는 push 하지 않고 대기.
          Bridge 재생 종료 시점까지 첫 세그 push 를 미뤄 오디오 겹침 방지.
          _fire_hook (F7 즉시컷) 은 render 완료 즉시 fire (필러 정지 timely) · 그 후 wait · push.
          None (기본) 이면 대기 없음 · 기존 동작."""
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
            # 성공 경로: frames=0(추론 실패)이어도 호출 — 응답 '오디오' push 전에
            # 필러 오디오("음...")를 반드시 끊어야 응답 음성과 겹치지 않는다.
            # 이 지점~push 사이 await 없음 → stop→flush→응답push 원자성 유지.
            _fire_hook()
            # T-824: min_push_at 지정 시 그 시각까지 대기 후 push
            #   (Bridge 재생 종료 시점 · 오디오 겹침 방지)
            if min_push_at is not None:
                wait_s = min_push_at - time.perf_counter()
                if wait_s > 0:
                    log.info(
                        "[T-824] delaying first push by %dms (Bridge 재생 종료 대기)",
                        int(wait_s * 1000),
                    )
                    await asyncio.sleep(wait_s)
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

    async def _run_pipeline(
        self, produce, turn=None, on_first_audio=None, on_response_ready=None,
        force_partial: bool = False, on_sentence=None,
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
            await self._run_batch(produce, turn, on_first_audio, on_response_ready, on_sentence=on_sentence)
        else:
            # Bridge 대기는 사용자 응답(say/speak)에만 — greet/react(force_partial)는 앱이 Bridge 를
            # 틀지 않으므로(onUserFinal 트리거) 기다리면 무음만 늘어난다(AFL-926 실측 첫인사 ~21초).
            await self._run_pipeline_partial(produce, turn, on_first_audio, on_response_ready,
                                             on_sentence=on_sentence,
                                             bridge_wait=(not force_partial) and self.uses_bridge is not False)

    async def _run_batch(
        self, produce, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None,
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
          는 멱등이라 이미 불렸어도 중복 호출 안전 — T-088 좀비 패턴 방지)."""
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
                # [2026-08-13 히즈키 의심 검증] "클론 대화 앞에 정체 모를 값이 읽힌다" —
                # LLM 원문(JSON·시그널 등)이 TTS 로 새는지 보려면 **글자 수가 아니라 원문**이
                # 필요하다. 길이만으로는 5자·11자가 정상 발화인지 잘린 조각인지 구분되지 않는다.
                # 기본은 꺼 둔다 — 통화 내용은 PII 다. 검증 중에만 env 로 켠다.
                if os.environ.get("PRETHIRD_TTS_TEXT_LOG", "0") == "1":
                    log.info("[T-113] TTS 입력 원문 ⟪%s⟫", full_text[:200])
                # T-806 후속: 문장별 TTS + concat (Qwen3-TTS 문장 사이 filler
                #   hallucination 회피). 단일 문장이면 내부에서 _tts_stage 로 위임.
                wav_bytes, pcm48 = await self._tts_stage_multi(full_text)
                turn.append_wav(wav_bytes)
                await self._infer_stage(
                    wav_bytes, pcm48, turn,
                    on_before_push=_guarded_hook, render_mode="batch",
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
        bridge_wait: bool = True,
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
        예외 시 모든 워커를 취소하고 signal_end 를 보장한다(좀비/오염 방지)."""
        turn = turn if turn is not None else NULL_TURN
        sentence_q: asyncio.Queue = asyncio.Queue()
        wav_q: asyncio.Queue = asyncio.Queue(maxsize=2)
        fired = {"v": False}
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
                # T-806 (2026-09-25): _tts_stage → _tts_stage_multi 로 교체.
                #   sentence_buffer 가 짧은 응답 을 안 나누고 뭉쳐 보내는 경우
                #   Qwen3-TTS 가 "안녕" 만 렌더 후 나머지 8s 를 filler
                #   hallucination (공사장 잡음) 로 채우는 문제 회피.
                #   _tts_stage_multi 내부에서 [.!?] 로 문장 split 후
                #   각 문장별 TTS + 200ms padding concat.
                #   단일 문장이면 _tts_stage 로 위임 (회귀 0).
                # 2026-10-21: 세그먼트 안 문장을 하나씩 렌더 큐로 보낸다(split_segment_for_render).
                #   concat 은 둘째 문장 TTS 가 끝나야 첫 문장 렌더가 시작돼 첫 소리가 늦었다
                #   (실측 21:08 턴 두 문장 TTS 6.2s 뒤 렌더 → 첫 소리 10.6s). 문장마다 렌더하면
                #   첫 문장이 재생되는 동안 둘째 문장 TTS 가 돈다. 문장별 TTS 호출·padding 은 동일.
                _parts = (
                    split_segment_for_render(s, _split_min_chars()) if _split_render_enabled() else [s]
                )
                for _pi, part in enumerate(_parts):
                    # 첫머리 추임새 제거는 세그먼트 첫 문장에만(_tts_stage_multi 와 같은 규칙).
                    wav_bytes, pcm48 = await self._tts_stage_multi(part, strip_lead=(_pi == 0))
                    turn.append_wav(wav_bytes)
                    _m["n_seg"] += 1
                    # [T-151 라운드2] on_sentence는 여기서 더 이상 발신하지 않는다
                    # (dequeue 직후 = TTS/렌더 수 초 전, 실기 피드백: 자막이 너무
                    # 일찍 뜬다). 문장 텍스트를 wav_q 에 동승시켜 infer_worker의
                    # push 직전 훅(_infer_stage on_before_push)에서 발신한다.
                    await wav_q.put((part, wav_bytes, pcm48))

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
                _is_first_seg = _first_infer
                _hook = _make_hook(s, _first_infer)
                _first_infer = False
                # T-824/830: 첫 세그 push 는 Bridge 재생 종료 시점 (grace + duration) 까지 미룸.
                #   T-830 (2026-09-29): 이전 조건 `elapsed >= grace_ms` 제거 · 항상 min_push_at 세팅.
                #   Reason: LLM 첫 문장 매우 빠른 turn 은 elapsed < grace 라 delay 발동 안 됨.
                #   Render 완료 시점이 grace 안에 들어와도 Bridge 는 앱에서 grace 후 이미 뜸 →
                #   서버 push 가 Bridge 재생 중 도착 · 오디오 겹침 발생. 항상 delay 로 통일.
                #   Render 완료가 이미 min_push_at 넘었으면 _infer_stage 내부에서 wait_s<=0 로 skip.
                _min_push_at = None
                if _is_first_seg and bridge_wait:
                    _grace_ms = int(os.environ.get("PRETHIRD_BRIDGE_GRACE_MS", "3000"))
                    _bridge_ms = int(os.environ.get("PRETHIRD_BRIDGE_DURATION_MS", "8000"))
                    # T-845 (2026-09-30): Bridge 종료 후 추가 대기(default 2000ms).
                    #   사용자 요구 — Bridge 재생 끝나고 TTS+MuseTalk push 사이 여유.
                    #   0 이면 종전 동작(즉시 push).
                    _post_bridge_ms = int(os.environ.get("PRETHIRD_POST_BRIDGE_DELAY_MS", "2000"))
                    _min_push_at = _t_turn + (_grace_ms + _bridge_ms + _post_bridge_ms) / 1000.0
                await self._infer_stage(
                    wav_bytes, pcm48, turn, on_before_push=_hook, min_push_at=_min_push_at,
                )
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
            self.vt.signal_end()
            self.at.signal_end()
