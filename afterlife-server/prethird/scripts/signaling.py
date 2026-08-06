from __future__ import annotations
import asyncio, os, re, time, pathlib, logging, json
from typing import Callable, Optional
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from session import SessionManager
from clone_dialog import fetch_bundle, bundle_to_messages
from asset_fetch import fetch_to
from voice_fetch import ensure_voice_wav
from prebuild import prebuild_handler
from recorder import make_recorder
from idle_policy import clone_mp4_enabled, filler_order_pre_speak
from json import dumps as _json_dumps
from call_lifecycle import call_greeted
from credit_guard import CreditGuard, DEFAULT_WARN_OFFSETS_SEC
from filler_cache import filler_cache_dest, prune_stale_fillers

REF_VOICES_ROOT = os.environ.get(
    "PRETHIRD_REF_VOICES_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)
VIDEO_REF_ROOT = os.environ.get(
    "PRETHIRD_VIDEO_REF_ROOT",
    "/home/afterlife/afterlife-server/prethird/video-ref",
)

_START = time.time()
log = logging.getLogger("prethird.signaling")
_AVSYNC_LOG = os.environ.get("PRETHIRD_AVSYNC_LOG", "1") == "1"


def _face_diag_on() -> bool:
    """[T-067 Task 6] face 정상경로 관찰 계측 토글. personId만 로그(실명 미포함).

    T-111: 개통 전 제거 대상(FACE_DIAG_LOG env·본 헬퍼·아래 face_diag log.info 5지점).
    """
    return os.environ.get("FACE_DIAG_LOG", "0") == "1"


def _speaker_identity_enabled() -> bool:
    """[T-135] 화자 identity/L2' 주입 게이트. 기본 on — 프로세스 시작 후에도 env 재평가
    (테스트 monkeypatch 호환, 기존 _FACE_REACT_ENABLED_KEY 관례와 동일)."""
    return os.environ.get(_SPEAKER_IDENTITY_ENABLED_KEY, "1") == "1"
# fail-closed 안전장치: clone_id 지정 통화에서 bundle 조회 실패 시 halbae 폴백 차단.
# "0" 이면 기존 폴백 동작 유지(롤백 안전장치).
_STRICT_CLONE_BUNDLE = os.environ.get("PRETHIRD_STRICT_CLONE_BUNDLE", "1") == "1"
# [F7] filler 토글: PRETHIRD_FILLER=1 일 때만 다운로드·FillerPlayer 활성.
# 기본 off → 기존 idle 정지 루프 100% 동일(회귀 0). 테스트에서 monkeypatch 가능.
_FILLER_ENABLED = os.environ.get("PRETHIRD_FILLER", "0") == "1"
# [T-067] face_event 선제 발화 토글: 기본 off — off면 face_event 수신해도 완전 무동작
# (기존 say/speak/greet 경로 바이트 단위 동일, 회귀 0). 프로세스 시작 후에도 env 재평가.
_FACE_REACT_ENABLED_KEY = "PRETHIRD_FACE_REACT_ENABLED"
# [T-135 v2] 화자 identity/L2' 주입 토글: 기본 "1"(on, dev/preview 전제) — FACE_REACT와
# 완전 독립. off면 current_speaker 설정/해제(face_event)·_maybe_swap_l2p 스케줄 전부
# 무동작(구 동작과 바이트 단위 동일). identity 소스는 face_event(생체검증) 단일 경로
# — say는 personId/speakerName을 읽지 않는다(v1 폐기). react(재인사 등 발화)는 여전히
# FACE_REACT 단독 게이트 — 두 게이트가 둘 다 off일 때만 기존(T-067 이전) 동작과 완전 동일.
_SPEAKER_IDENTITY_ENABLED_KEY = "PRETHIRD_SPEAKER_IDENTITY_ENABLED"
# 아는 얼굴(personId)=통화당 1회(영구), unknown/multi_face=이 초 동안 쿨다운.
REACT_COOLDOWN_S = float(os.environ.get("PRETHIRD_REACT_COOLDOWN_S", "60"))
# react가 다른 발화(say/speak/greet/react) 진행 중 도착하면 단일 pending 슬롯에 대기(latest-wins,
# 연쇄 큐 금지). 이 초를 넘겨 대기한 채로 드레인 시점이 오면 스테일 반응으로 간주해 드랍.
REACT_PENDING_WAIT_CAP_S = float(os.environ.get("PRETHIRD_REACT_PENDING_WAIT_S", "20"))
if not _STRICT_CLONE_BUNDLE:
    logging.getLogger("prethird.signaling").warning(
        "PRETHIRD_STRICT_CLONE_BUNDLE=0: 고인 신원 오표시 폴백 활성화 — 운영 배포 금지"
    )
# [T-167] 크레딧 강제 게이트. 기본 off — 트랙 A(서버)가 bundle 에 allowedSec 를
# 실어 보내기 전에 이 코드를 배포하면 allowedSec 가 항상 0 이라 전 통화가 거부된다.
# A 배포·검증 후 on 으로 올린다. 프로세스 시작 후에도 env 재평가(기존 게이트 관례).
_CREDIT_ENFORCED_KEY = "PRETHIRD_CREDIT_ENFORCED"


def _credit_enforced() -> bool:
    return os.environ.get(_CREDIT_ENFORCED_KEY, "0") == "1"


# [T-258] 발화 파이프라인 단계 신호(`{"type":"stage",...}`) 토글. 기본 on —
# 계측 전용 additive 메시지라 구 클라이언트는 무시한다. 문제가 생기면
# PRETHIRD_STAGE_SIGNAL=0 으로 코드 변경 없이 발신만 끊을 수 있다(회귀 0).
# 프로세스 시작 후에도 env 재평가(기존 게이트 관례, 테스트 monkeypatch 호환).
_STAGE_SIGNAL_ENABLED_KEY = "PRETHIRD_STAGE_SIGNAL"


def _stage_signal_enabled() -> bool:
    return os.environ.get(_STAGE_SIGNAL_ENABLED_KEY, "1") == "1"


# ─────────────────────────────────────────────────────────────────────────────
# ⚠️ [T-167 트랙 A 담당자에게] 이 파일은 과금의 신뢰 경계다.
#
# prethird 는 아래 두 가지를 서버에서 받아야 과금이 작동한다.
#   1) call bundle 응답의 `allowedSec` (정수, 초)  — 잔여 통화 가능 시간
#   2) POST /oth-path 응답의 `{allowedSec, maxEndAt}`
#      · `maxEndAt` = 절대 시각(epoch **ms**). prethird 는 이 값만 보고
#        카운트다운한다. greeted_at + allowedSec 을 로컬에서 재계산하지 않는다
#        (서버와 시계가 어긋나면 과금 구간과 종료 시점이 불일치한다).
#      · 인증 = `Authorization: Bearer <LEARN_SECRET>` (call_end 와 동일)
#
# 둘 중 하나라도 없으면 prethird 는 fail-closed 로 동작한다 —
# 통화는 되지만 강제 종료 타이머가 걸리지 않아 **무제한 통화**가 된다.
#
# 배포 순서(반드시 지킬 것):
#   ① 트랙 A 를 preview 에 먼저 올린다
#   ② prethird 를 올린다 (이 시점까지 PRETHIRD_CREDIT_ENFORCED 는 off)
#   ③ 실통화로 greeted/정산을 확인한 뒤 PRETHIRD_CREDIT_ENFORCED=1 로 올린다
# 순서를 뒤집어 ①보다 먼저 ③을 하면 allowedSec 부재로 전 통화가 402 거부된다.
#
# 통화기록·과금 분리 정책:
#   · call_sessions(통화기록)는 학습 여부와 무관하게 **항상** 남긴다.
#     call_start/call_end 의 PRETHIRD_LEARN_ENABLED 게이트를 제거한 이유다.
#   · 과금 제외(학습 통화 등)는 기록을 지우는 방식이 아니라 별도 플래그로 한다.
# ─────────────────────────────────────────────────────────────────────────────
if not _credit_enforced():
    logging.getLogger("prethird.signaling").warning(
        "[T-167] PRETHIRD_CREDIT_ENFORCED=0: 크레딧 잔액 검사 비활성 — 관찰만 한다. "
        "트랙 A(서버)의 allowedSec·/greeted 가 preview 에 반영되고 실통화 검증이 끝나면 "
        "1 로 올릴 것. 그때까지 잔액 0 계정도 통화가 가능하다."
    )


def _cancel_credit_guard(sess) -> None:
    """[T-167] 크레딧 가드 정리 — 남은 타이머가 종료 후 발화하지 않도록.
    가드가 없는 세션(통보 실패·greet 이전 종료)에서도 안전해야 한다."""
    guard = getattr(sess, "credit_guard", None)
    if guard is None:
        return
    try:
        guard.cancel()
    except Exception as e:
        log.warning("session %s credit guard cancel failed: %s", sess.session_id, e)
    sess.credit_guard = None


def _warn_offsets_from_env() -> tuple[float, ...]:
    """PRETHIRD_CREDIT_WARN_SEC='180,60' 형식. 파싱 실패 시 기본값."""
    raw = os.environ.get("PRETHIRD_CREDIT_WARN_SEC", "")
    if not raw.strip():
        return DEFAULT_WARN_OFFSETS_SEC
    try:
        return tuple(sorted((float(x) for x in raw.split(",") if x.strip()), reverse=True))
    except ValueError:
        return DEFAULT_WARN_OFFSETS_SEC


async def _start_credit_billing(sess, channel, api_base) -> None:
    """[T-167] 클론 인사 시작 = 과금 개시.

    서버에 greeted 를 알려 데드라인을 받고 카운트다운을 건다.
    통보 실패 시 가드를 걸지 않는다 — 서버측 max_end_at 수거(2층)가 받는다.

    강제 종료는 sess.pc.close() 로 한다. pc 종료가 connectionstatechange 훅을
    태워 기존 정리 경로 + call_end(정산)까지 그대로 흐른다 — 별도 종료 경로를
    새로 만들지 않는다.
    """
    if sess.credit_guard is not None or getattr(sess, "_credit_starting", False):
        return  # 이미 시작됐거나 시작 중(멱등) — 첫 오디오 콜백이 겹쳐도 1회만 통보
    sess._credit_starting = True
    try:
        info = await call_greeted(api_base, sess.session_id)
    finally:
        sess._credit_starting = False
    if not info or not info.get("maxEndAt"):
        log.warning(
            "[T-167] session %s greeted 통보 실패/maxEndAt 부재 — 로컬 강제종료 타이머 없음. "
            "트랙 A 의 POST /oth-path 가 {allowedSec, maxEndAt(epoch ms)} 를 "
            "반환해야 한다. 지금은 서버측 max_end_at 수거(2층)에만 의존한다.",
            sess.session_id,
        )
        return
    if sess.credit_guard is not None:
        return  # await 중 다른 경로가 먼저 붙였다

    sess.max_end_at_ms = info["maxEndAt"]

    def _send(payload: dict) -> None:
        if channel is not None and getattr(channel, "readyState", None) == "open":
            try:
                channel.send(_json_dumps(payload))
            except Exception as exc:
                log.warning("session %s credit event send failed: %s", sess.session_id, exc)

    def _on_warn(remaining_sec) -> None:
        _send({"type": "credit_warning", "remaining_sec": remaining_sec})

    async def _on_exhausted() -> None:
        # send 가 실패해도 종료는 반드시 수행한다 — 아니면 잔액 0으로 무한 통화가 된다.
        _send({"type": "credit_exhausted"})
        pc = getattr(sess, "pc", None)
        if pc is not None:
            # 하드 컷 — 발화 중이어도 유예를 주지 않는다.
            await pc.close()

    sess.credit_guard = CreditGuard(
        max_end_at_ms=sess.max_end_at_ms,
        on_warn=_on_warn,
        on_exhausted=_on_exhausted,
        warn_offsets_sec=_warn_offsets_from_env(),
    )
    sess.credit_guard.start()
    log.info("session %s 과금 개시 — %d초 허용", sess.session_id, info["allowedSec"])


def _extract_allowed_sec(bundle) -> int:
    """[T-167] bundle 에서 허용 통화 초를 뽑는다.

    fail-closed — 필드가 없거나 이상하면 0(통화 불가)으로 본다.
    무제한으로 열어두면 그게 과금 우회 구멍이 된다.
    소수는 내림 — 올림하면 과금하지 않은 시간을 주게 된다(10초 내림 규약과 같은 방향).
    """
    try:
        if not bundle:
            return 0
        raw = bundle.get("allowedSec")
        if raw is None:
            return 0
        return max(0, int(float(raw)))
    except (TypeError, ValueError):
        return 0


async def _fetch_face(assets: dict, clone_id, fetch_fn=fetch_to):
    """assets.faceUrl → {VIDEO_REF_ROOT}/{clone_id}/{clone_id}-face.jpg 다운로드.

    반환: 로컬 경로(성공) | None(url 없음/실패). 실패는 영상 폴백 위해 삼킨다.
    """
    face_url = assets.get("faceUrl")
    if not face_url or clone_id is None:
        return None
    dest = f"{VIDEO_REF_ROOT}/{clone_id}/{clone_id}-face.jpg"
    try:
        await fetch_fn(face_url, dest)
        return dest
    except Exception as exc:
        log.warning("faceUrl 다운로드 실패(영상 폴백): %s — %s", face_url, exc)
        return None


async def _avsync_monitor(sess, interval: float = 0.5) -> None:
    """0.5s 주기로 video/audio 송출 카운터를 로깅한다.
    세션 종료(cancelled) 시 조용히 종료.
    """
    t0 = asyncio.get_event_loop().time()
    vt = sess.video_track
    at = sess.audio_track
    try:
        while True:
            await asyncio.sleep(interval)
            elapsed = asyncio.get_event_loop().time() - t0
            v_real = getattr(vt, "frames_real", 0)
            vq = getattr(vt, "queue_depth", lambda: 0)()
            a_real = getattr(at, "frames_yielded_real", 0)
            samples_out = getattr(at, "samples_yielded_out", 0)
            _abuf = getattr(at, "queue_depth_samples", lambda: 0)()
            v_content = v_real / 25.0
            a_content = samples_out / 48000.0
            offset_ms = int((a_content - v_content) * 1000)
            abuf_ms = int(_abuf / 48)
            log.info(
                "[avsync] t=%.1f v_real=%d a_real=%d v_content=%.2f a_content=%.2f"
                " offset_ms=%d vq=%d abuf_ms=%d",
                elapsed, v_real, a_real, v_content, a_content, offset_ms, vq, abuf_ms,
            )
    except asyncio.CancelledError:
        pass

def _get_busy_lock(sess) -> asyncio.Lock:
    """세션 단위 발화 상호배제 락 — say/speak/greet/react 전부 이 락 안에서만 트랙에 push한다
    (동시 push로 인한 오디오/비디오 겹침 방지, 플랜 §6.2).

    실제 Session(session.py)은 생성자에서 미리 만들어두지만, 가벼운 테스트용 fake session
    객체엔 없을 수 있어 지연 생성 후 sess에 캐시한다(getattr/setattr 방어 패턴 — 기존
    filler_player 등과 동일 스타일. sess가 setattr을 거부해도 예외를 삼켜 회귀 0 유지)."""
    lock = getattr(sess, "busy_lock", None)
    if lock is None:
        lock = asyncio.Lock()
        try:
            sess.busy_lock = lock
        except Exception:
            pass
    return lock


async def _drain_pending_react(sess) -> None:
    """say/speak/greet(또는 react) 발화 종료 직후 호출 — 대기 중이던 pending react가
    있으면 이제 재생한다(플랜 §6.2 "발화 종료 후 재생"). 단일 슬롯이므로 최신 값 1개만 존재.
    대기 상한(REACT_PENDING_WAIT_CAP_S) 초과 시 스테일 반응으로 간주해 드랍+로그."""
    pending = getattr(sess, "pending_react", None)
    if pending is None:
        return
    sess.pending_react = None
    waited = time.monotonic() - pending["armed_at"]
    if waited > REACT_PENDING_WAIT_CAP_S:
        log.warning(
            "session %s pending react dropped(wait=%.1fs > cap=%.1fs): kind=%s",
            getattr(sess, "session_id", "?"), waited, REACT_PENDING_WAIT_CAP_S, pending["kind"],
        )
        return
    lock = _get_busy_lock(sess)
    async with lock:
        try:
            await sess.pipeline.react(pending["kind"], pending["name"])
        except asyncio.CancelledError:
            raise
        except Exception as e:
            log.warning("session %s pending react failed: %s", getattr(sess, "session_id", "?"), e)


def _summarize_l2p_fields(data: dict) -> str:
    """l2p `data` 필드(extract_l2 산출 구조: preference_personal/relation/memories_personal)를
    프롬프트 힌트용 한 줄로 요약. 빈 값은 생략, 전부 비면 "(없음)"."""
    parts = []
    rel = data.get("relation")
    if isinstance(rel, str) and rel.strip():
        parts.append(f"관계={rel.strip()}")
    pp = data.get("preference_personal")
    if isinstance(pp, dict) and pp:
        parts.append("선호=" + ", ".join(f"{k}:{v}" for k, v in pp.items()))
    mems = data.get("memories_personal")
    if isinstance(mems, list) and mems:
        parts.append("기억=" + "; ".join(str(m) for m in mems))
    return "; ".join(parts) if parts else "(없음)"


def _diag_summarize_l2p(l2p_data) -> dict:
    """[T-135] dev diag 로그 전용 l2p_data 요약 — memories_personal/preference_personal
    등 원문 값은 절대 포함하지 않고 존재여부/길이/키 목록만 남긴다(mizu MEDIUM1 PII 로그
    마스킹). relation은 자유서술 개인정보라 값 자체 대신 길이만 기록."""
    if not isinstance(l2p_data, dict):
        return {}
    out: dict = {}
    rel = l2p_data.get("relation")
    if isinstance(rel, str) and rel:
        out["relation_len"] = len(rel)
    pp = l2p_data.get("preference_personal")
    if isinstance(pp, dict) and pp:
        out["preference_personal_keys"] = sorted(pp.keys())
    mems = l2p_data.get("memories_personal")
    if isinstance(mems, list) and mems:
        out["memories_personal_count"] = len(mems)
    return out


_DISPLAY_NAME_CONTROL_RE = re.compile(
    "[\x00-\x1f\x7f​-‏‪-‮⁠-⁯﻿]"
)


def _sanitize_display_name(raw) -> Optional[str]:
    """[T-135] face_event displayName 검증 — afterlifeapi `assertValidDisplayName`
    (`afterlifeapi/src/lib/displayName.ts`)과 동등 기준(길이 1~30·제어문자·제로폭/bidi
    포맷문자 차단). 실시간 datachannel 메시지라 검증 실패로 이벤트 전체를 버리지 않고
    이름만 신뢰하지 않는다(None으로 강등 → build_l2p_hint가 이름 라인 생략). 프롬프트
    인젝션 완화(mizu HIGH1)."""
    if not isinstance(raw, str):
        return None
    trimmed = raw.strip()
    if not trimmed or len(trimmed) > 30:
        return None
    if _DISPLAY_NAME_CONTROL_RE.search(trimmed):
        return None
    return trimmed


def build_l2p_hint(name, l2p_data) -> str:
    """[T-116/T-135] 화자별 L2' 시스템 힌트 한 줄. 실통화(_maybe_swap_l2p)와 verify가 공유.
    l2p_data가 있으면 관계요약 포함, 없으면 이름만.
    [T-135] name이 falsy(None/공백)면 "현재 화면의 화자: {name}" 라인을 생략한다 — 화자가
    불확실(unknown_face/multi_face로 current_speaker 해제)한 상태에서 "화자: None" 같은
    오염된 힌트가 프롬프트에 들어가는 것을 방지. l2p_data만 있으면 관계기억 라인만,
    둘 다 없으면 빈 문자열(호출부가 힌트 자체를 스킵해야 함)."""
    if not name:
        if l2p_data:
            return f"이 사람과의 관계 기억: {_summarize_l2p_fields(l2p_data)}"
        return ""
    if l2p_data:
        return f"현재 화면의 화자: {name}. 이 사람과의 관계 기억: {_summarize_l2p_fields(l2p_data)}"
    return f"현재 화면의 화자: {name}"


async def _maybe_swap_l2p(sess, pid: int, name) -> None:
    """[T-067 Task 12] speaker_confirmed 화자(pid/name)에 맞춰 persona를 재조립.

    fire-and-forget — 호출부(_handle_face_event)가 `asyncio.ensure_future`로 스케줄하고
    react 발화를 전혀 기다리지 않는다(api 5s 타임아웃이 react 지연으로 번지지 않도록
    react는 이름만으로 즉시 나가고, L2' 반영은 다음 턴부터가 스펙). pid/name은 스케줄
    시점 closure-frozen 값(파일 내 react kind/react_name과 동일한 freeze 관례) — 함수
    내부에서 live `sess.current_speaker`를 다시 읽지 않는다.

    ①sess.base_persona_messages(세션 최초 persona 사본)가 없으면 지금 pipeline이 쓰던
    persona_messages를 최초 1회 백업 — 이후 스왑은 항상 이 base 위에만 덧붙인다(기존
    L2 베이스 절대 미변경, 스펙 D1). ②fetch_l2p로 화자별 L2' 조회 — 있으면
    관계요약 포함 시스템 힌트, 없으면(404/미설정/오류) 이름 힌트만. ③적용 직전
    `sess.current_speaker[0] == pid` 재확인 — 연속 교대로 이 fetch가 늦게 끝나 최신
    화자의 스왑을 덮어쓰지 않도록 stale이면 드랍. ④pipeline.update_persona로 교체
    (다음 턴부터 반영). 어떤 단계에서 실패해도(속성 부재·네트워크 오류) 예외를 삼켜
    통화 자체엔 영향 없다 — 스왑이 전부 스킵될 뿐."""
    try:
        pipeline = getattr(sess, "pipeline", None)
        if pipeline is None:
            return
        if getattr(sess, "base_persona_messages", None) is None:
            sess.base_persona_messages = list(getattr(pipeline, "persona_messages", None) or [])

        clone_id = getattr(sess, "clone_id", None)
        l2p_data = None
        if clone_id is not None and pid is not None:
            from l2p_client import fetch_l2p
            try:
                l2p_data = await fetch_l2p(clone_id, pid)
            except Exception as e:
                log.warning("session %s fetch_l2p failed person=%s: %s",
                            getattr(sess, "session_id", "?"), pid, e)
                l2p_data = None

        # stale 가드: fetch 도중 화자가 또 바뀌었으면(연속 교대) 늦게 끝난 이 결과는
        # 버린다 — 최신 화자의 스왑(이미 진행/완료)을 덮어쓰지 않는다.
        current = getattr(sess, "current_speaker", None)
        if current is None or current[0] != pid:
            return

        hint = build_l2p_hint(name, l2p_data)

        # [T-135] name이 sanitize 결과 None(공백/malformed 강등)이고 l2p_data도 없으면
        # hint == "" — 빈 system 메시지를 덧붙이지 않고 base만 재적용(이전 화자의 잔여
        # 힌트가 있었다면 정리, 새 오염 힌트는 추가하지 않음).
        new_messages = (
            sess.base_persona_messages + [{"role": "system", "content": hint}]
            if hint else list(sess.base_persona_messages)
        )
        update = getattr(pipeline, "update_persona", None)
        if callable(update):
            update(new_messages)
            if _face_diag_on():
                # [T-135] l2p_data 원문(memories_personal/preference_personal 값)은 절대
                # 로깅하지 않는다 — 요약(_diag_summarize_l2p: 키/길이/개수만)만 남긴다
                # (mizu MEDIUM1). hint 문자열의 실명(displayName)도 <name>으로 마스킹
                # (기존 face_diag 규약 — T-067 Task6 "personId만 로그, 실명 미포함").
                _hint_masked = hint.replace(str(name), "<name>") if name else hint
                log.info(
                    "face_diag l2p_swapped session=%s person=%s l2p_summary=%s hint=%s",
                    getattr(sess, "session_id", "?"), pid,
                    json.dumps(_diag_summarize_l2p(l2p_data), ensure_ascii=False),
                    _hint_masked,
                )
    except Exception as e:
        log.warning("session %s _maybe_swap_l2p failed: %s", getattr(sess, "session_id", "?"), e)


def _clear_current_speaker(sess, event: str) -> None:
    """[T-135 v2] 화자 확실성 게이팅 — `unknown_face`/`multi_face` 수신 시
    `sess.current_speaker`를 익명(None)으로 해제한다.

    이미 None이면 아무것도 하지 않는다(no-op, 중복 리셋 방지). None이 아니었다면:
    1) current_speaker=None으로 즉시 해제 — 이후 `_maybe_swap_l2p`의 stale 가드
       (`current is None or current[0] != pid`)가 늦게 도착하는 이전 화자의 스왑도
       자동 드랍한다(이중 방어). `learn_writeback` person 귀속도 이 시점부터 즉시
       익명(person_id=None)으로 보류된다(호출부가 매 turn `sess.current_speaker`를
       그때그때 읽으므로 별도 배선 불필요).
    2) base_persona_messages가 이미 백업돼 있으면(과거에 한 번이라도 스왑이 있었다는
       뜻) persona를 base로 동기 리셋 — 직전 화자의 이름/L2' 힌트가 다음 턴 프롬프트에
       잔류하는 것을 막는다(그렇지 않으면 "낯선 사람인데 이전 화자 이름으로 계속
       불림" 오염이 발생). base가 없으면(스왑이 한 번도 없었음) 리셋할 것도 없다.
    """
    if sess.current_speaker is None:
        return
    sess.current_speaker = None
    if _face_diag_on():
        log.info(
            "face_diag speaker session=%s event=%s cleared=1",
            getattr(sess, "session_id", "?"), event,
        )
    try:
        pipeline = getattr(sess, "pipeline", None)
        base = getattr(sess, "base_persona_messages", None)
        if pipeline is not None and base is not None:
            update = getattr(pipeline, "update_persona", None)
            if callable(update):
                update(list(base))
    except Exception as e:
        log.warning(
            "session %s _clear_current_speaker persona reset failed: %s",
            getattr(sess, "session_id", "?"), e,
        )


def _handle_face_event(sess, data: dict) -> None:
    """[T-067/T-135] datachannel face_event 메시지 처리.

    RN → `{"type":"face_event","event":"speaker_confirmed"|"unknown_face"|"multi_face",
    "personId":3,"displayName":"민지","seq":12}`.

    [T-135] 게이트 2개로 분리(관심사 분리, 서로 완전 독립):
    - `PRETHIRD_SPEAKER_IDENTITY_ENABLED`(기본 "1" on) — current_speaker 설정/해제 +
      `_maybe_swap_l2p`(L2'/이름 persona 주입) 스케줄만 관장.
    - `PRETHIRD_FACE_REACT_ENABLED`(기본 "0" off) — 얼굴 react 발화(재인사·"누구시죠" 등)
      + 쿨다운 기록 + pending_enroll 플래그만 관장(기존 T-067 동작 그대로).
    둘 다 off일 때만 완전 무동작(구 T-067 이전 동작과 바이트 단위 동일, 회귀 0).
    쿨다운: 아는 얼굴(personId)=통화당 1회(영구), unknown/multi_face=REACT_COOLDOWN_S(60s).
    다른 발화가 진행 중이면(busy_lock) 겹쳐 push하지 않고 단일 pending 슬롯에 대기시켜
    발화 종료 후 재생한다(_drain_pending_react, 플랜 §6.2).

    [T-135 v2] 화자 확실성 게이팅(오염 차단) — identity_on일 때 `unknown_face`/
    `multi_face` 수신 시 `sess.current_speaker`를 **None으로 해제**한다. 생체검증으로
    "누구인지 확실"할 때(speaker_confirmed)만 이름/L2' 주입·learn_writeback person
    귀속을 허용하고, 불확실해지면 즉시 익명으로 되돌아간다 — "낯선 사람을 이전
    화자로 오인해 그 사람 이름/기억을 계속 주입·학습"하는 사고를 차단한다.
    speaker_confirmed로 재확정될 때만 그 사람으로 복귀한다.

    Task 11(pending_enroll)은 이 함수 밖(say 처리부)에서 소비. Task 12(L2' 화자별
    persona 스왑)는 _maybe_swap_l2p — 화자가 바뀔 때(쿨다운과 무관) fire-and-forget으로
    스케줄되며 react(_run, 쿨다운 게이트 대상)와는 완전히 분리된 별도 태스크(§6.4).
    """
    if sess.pipeline is None:
        return
    identity_on = _speaker_identity_enabled()
    react_on = os.environ.get(_FACE_REACT_ENABLED_KEY, "0") == "1"
    if not identity_on and not react_on:
        return  # 둘 다 off — 완전 무동작(회귀 0)

    event = data.get("event")
    pid = data.get("personId")
    # [T-135] displayName 검증 — 길이/제어문자/제로폭 위반이면 None으로 강등(이벤트
    # 자체는 계속 처리, 이름만 신뢰하지 않음). 프롬프트 인젝션 완화(mizu HIGH1).
    name = _sanitize_display_name(data.get("displayName"))

    if _face_diag_on():
        log.info(
            "face_diag recv session=%s event=%s person=%s",
            getattr(sess, "session_id", "?"), event, pid,
        )

    pid_int = None
    if event == "speaker_confirmed":
        # pid 검증을 쿨다운 키 기록보다 먼저 — malformed 이벤트가 정상 personId의
        # 1회 기회를 소모하지 않도록 조기 무시(reacted_keys 터치 전에 return).
        if pid is None:
            return
        try:
            pid_int = int(pid)
        except (TypeError, ValueError):
            log.warning(
                "session %s face_event personId 형식 오류(무시, 쿨다운 미기록): %r",
                getattr(sess, "session_id", "?"), pid,
            )
            return

    # [T-135] identity/L2' 주입 — SPEAKER_IDENTITY 게이트 단독, react 게이트/쿨다운과 무관.
    # [T-067 Task 12 / 스펙 §6.4] 화자가 실제로 바뀌었으면(현재 sess.current_speaker와
    # 다른 personId) 매번 다시 트리거해야 persona가 최신 화자에 고착되지 않는다.
    # fire-and-forget(swap이 react를 절대 지연시키지 않음).
    if event == "speaker_confirmed" and identity_on:
        prev = sess.current_speaker
        if prev is None or prev[0] != pid_int:
            sess.current_speaker = (pid_int, name)
            if _face_diag_on():
                log.info(
                    "face_diag speaker session=%s person=%s swap_scheduled=1",
                    getattr(sess, "session_id", "?"), pid_int,
                )
            asyncio.ensure_future(_maybe_swap_l2p(sess, pid_int, name))
    elif event in ("unknown_face", "multi_face") and identity_on:
        # [T-135 v2] 화자 확실성 게이팅 — 낯선 얼굴/다중 얼굴이면 즉시 익명으로 해제.
        # speaker_confirmed로 재확정될 때까지 이름/L2' 주입·learn_writeback person
        # 귀속을 보류한다(_maybe_swap_l2p의 stale 가드가 current_speaker None을 보고
        # 이후 늦게 도착하는 이전 화자의 스왑도 자동 드랍 — 이중 방어).
        _clear_current_speaker(sess, event)

    if not react_on:
        return  # react(쿨다운·발화·pending_enroll)는 FACE_REACT 게이트 단독 — off면 여기서 종료

    key = str(pid_int) if event == "speaker_confirmed" else "unknown"
    now = time.monotonic()
    last = sess.reacted_keys.get(key)
    if last is not None and (key != "unknown" or now - last < REACT_COOLDOWN_S):
        if _face_diag_on():
            log.info(
                "face_diag cooldown session=%s person=%s suppressed=1",
                getattr(sess, "session_id", "?"), pid_int,
            )
        return  # 아는 얼굴=통화당 1회, unknown/multi_face=60s 쿨다운 (react만 억제)
    sess.reacted_keys[key] = now

    if event == "speaker_confirmed":
        kind, react_name = "known", name
    else:  # unknown_face | multi_face
        sess.pending_enroll = True  # Task 11 이 소비
        kind, react_name = "unknown", None

    if _face_diag_on():
        log.info(
            "face_diag react session=%s kind=%s person=%s",
            getattr(sess, "session_id", "?"), kind, pid_int,
        )

    lock = _get_busy_lock(sess)

    async def _run(kind=kind, react_name=react_name):
        try:
            if lock.locked():
                # 다른 발화 진행 중 — 단일 pending 슬롯에 최신 값으로 교체(연쇄 큐 금지),
                # 발화 종료 후 _drain_pending_react가 재생.
                sess.pending_react = {
                    "kind": kind, "name": react_name, "armed_at": time.monotonic(),
                }
                return
            async with lock:
                await sess.pipeline.react(kind, react_name)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            log.warning("session %s face_event(%s) react failed: %s", sess.session_id, event, e)

    asyncio.ensure_future(_run())


async def _send_enroll_suggest(sess, channel, text: str, person_id: Optional[int] = None) -> None:
    """[T-067 Task 11 + T-126 Task 8] 두 시나리오에서 호출된다:
    1) pending_enroll(신규 unknown_face) 상태에서 도착한 첫 say — person_id=None, 기존 4케이스
       계약(payload에 personId 키 자체가 없음)을 그대로 유지(회귀 0).
    2) current_speaker(이미 auto_biometric 등록된 무명 화자)가 말했을 때 — person_id=현재 화자
       personId. RN 은 personId 를 보고 새 person 을 만들지 않고 기존 person 의 이름만 PATCH 한다
       (T-126 스펙 §5, 신규등록 폭주 방지).

    fire-and-forget — say 본 흐름(pipeline.say 호출)을 전혀 지연·변경하지 않는다.
    이름 추출 실패(LLM 예외/타임아웃/파싱실패)해도 name=""로 enroll_suggest를 보낸다
    (카드 수동 입력 폴백 유지, 통화 자체엔 영향 없음).
    """
    from name_extract import extract_name
    try:
        name = await extract_name(text)
    except Exception as e:
        log.warning("session %s enroll name extract failed: %s",
                    getattr(sess, "session_id", "?"), e)
        name = ""
    if channel is not None and getattr(channel, "readyState", None) == "open":
        payload = {"type": "enroll_suggest", "name": name}
        if person_id is not None:
            payload["personId"] = person_id
        try:
            channel.send(json.dumps(payload))
        except Exception as exc:
            log.warning("session %s enroll_suggest send failed: %s",
                        getattr(sess, "session_id", "?"), exc)


def _make_dc_handler(sess, channel):
    """DataChannel 'message' 핸들러 클로저를 반환한다.

    say/speak 메시지 수신 시 pipeline을 통해 발화하고,
    완료(성공·실패 모두) 후 datachannel로 speech_end(seq) 신호를 보낸다.
    seq는 RN이 부여한 값을 그대로 echo — 서버는 해석하지 않는다.

    [T-258] 위 3종(speech_start/speech_text/speech_end)은 무변경. 추가로 발화
    파이프라인 단계 신호 `{"type":"stage","seq":..,"stage":..,"tMs":..}` 를
    같은 seq·같은 채널로 발신한다(_emit_stage) — 클라가 "텍스트 생성 완료 /
    음성 생성 중·완료 / 영상 생성·스트리밍 중 / 스트리밍 끝"을 실시간으로
    구분해 타이밍을 잡기 위한 계측 신호. PRETHIRD_STAGE_SIGNAL=0 으로 차단 가능.
    """
    import json as _json

    def _on_msg(msg):
        # [T-258] 턴 시작 기준시각 = dc 메시지 수신 시점. stage 신호의 tMs 는 전부
        # 이 기준의 경과 ms → 클라가 뺄셈만으로 단계별 소요를 알 수 있다.
        # monotonic(perf_counter) 사용 — wall clock 보정에 흔들리지 않는다.
        _t_dc = time.perf_counter()
        try:
            data = _json.loads(msg)
        except (ValueError, TypeError):
            return
        mtype = data.get("type")
        if mtype not in ("say", "speak", "greet", "face_event") or sess.pipeline is None:
            return
        if mtype == "face_event":
            _handle_face_event(sess, data)
            return
        # 프로세스 시작 후에도 env 토글 평가, 테스트 monkeypatch 호환
        if mtype == "greet" and os.environ.get("PRETHIRD_GREETING_ENABLED", "1") != "1":
            return  # 토글 off — 인사 무시(RN 타임아웃 폴백이 처리)
        text = data.get("text", "")
        if mtype in ("say", "speak") and not text:
            return  # say/speak 는 텍스트 필수. greet 는 텍스트 불필요.
        # [T-135 v2] say payload의 personId/speakerName은 더 이상 읽지 않는다(v1 폐기 —
        # 클라이언트가 자기주장하는 identity를 서버가 그대로 신뢰하는 경로는 IDOR 표면.
        # identity 소스는 face_event(생체검증) 단일 경로로 확정 — _handle_face_event만이
        # sess.current_speaker를 설정/해제한다). say는 원문 text만 소비(기존 그대로).
        # [T-067 Task 11] 즉석등록: pending_enroll 상태의 첫 say에서만 1회 발화(플래그를
        # 즉시 내려 재진입 차단) — fire-and-forget이라 say 본 흐름은 지연되지 않는다.
        if mtype == "say" and getattr(sess, "pending_enroll", False):
            sess.pending_enroll = False
            asyncio.ensure_future(_send_enroll_suggest(sess, channel, text))
        elif (
            mtype == "say"
            and getattr(sess, "current_speaker", None) is not None
            and not sess.current_speaker[1]
            and sess.current_speaker[0] not in getattr(sess, "name_extract_sent", set())
        ):
            # T-126 Task8 — 이미 auto_biometric 로 등록됐지만 아직 이름이 없는 화자가 말한 경우,
            # 이번 발화에서 이름을 뽑아 personId 와 함께 RN에 통보한다(1콜당 1회만 시도 —
            # name_extract_sent 로 중복 LLM 호출 방지). pending_enroll(신규 unknown)과는 상호
            # 배타적(elif) — 두 payload가 동시에 나가지 않는다.
            pid = sess.current_speaker[0]
            sess.name_extract_sent.add(pid)
            asyncio.ensure_future(_send_enroll_suggest(sess, channel, text, person_id=pid))
        seq = data.get("seq")   # RN이 부여(없으면 None), echo 전용
        sess.set_state("speaking")

        # 턴 기록 시작 — input.txt 즉시 기록. recorder 없으면 None.
        _rec = getattr(sess, "recorder", None)
        turn = _rec.begin_turn(mtype, text, seq) if _rec is not None else None

        def _emit_speech_start(seq=seq):
            # 첫 오디오 송출 시점 — "클론이 전화를 받았다" 신호(연결 중 화면 종료 트리거).
            if channel is not None and getattr(channel, "readyState", None) == "open":
                try:
                    channel.send(_json.dumps({"type": "speech_start", "seq": seq}))
                except Exception as exc:
                    log.warning("session %s speech_start send failed: %s",
                                sess.session_id, exc)
            # [T-167] greet 의 첫 오디오 = 과금 시작점(클론이 인사를 시작한 순간).
            # say/speak(사용자 발화 응답)에는 걸지 않는다 — 과금은 인사부터다.
            if mtype == "greet":
                asyncio.ensure_future(_start_credit_billing(
                    sess, channel, os.environ.get("PRETHIRD_API_BASE"),
                ))

        def _emit_stage(stage, detail=None, seq=seq, t0=_t_dc):
            """[T-258] 발화 파이프라인 단계 신호 1건 발신.

            payload: {"type":"stage","seq":<int|None>,"stage":<name>,
                      "tMs":<턴 시작(dc 수신) 기준 경과 ms>,"detail":{...}}
            - seq 는 speech_start/speech_end 와 **같은 값**(RN 이 부여, echo 전용).
            - additive — 기존 speech_start/speech_text/speech_end 는 그대로 나간다.
            - dc 가 닫혀 있으면 조용히 스킵, 전송 실패는 log.warning 후 진행.
              (pipeline._stage 가 한 겹 더 감싸므로 발화는 어떤 경우에도 안 죽는다)
            - 동기·논블로킹: channel.send 는 aiortc 동기 API — await 없음.
            """
            _t_ms = int((time.perf_counter() - t0) * 1000)
            # 서버측 타임라인 근거는 dc 상태와 무관하게 남긴다(무거운 계산 없음).
            log.info(
                "[stage] session=%s seq=%s stage=%s tMs=%d detail=%s",
                sess.session_id, seq, stage, _t_ms, detail,
            )
            if channel is None or getattr(channel, "readyState", None) != "open":
                return
            payload = {"type": "stage", "seq": seq, "stage": stage, "tMs": _t_ms}
            if detail:
                payload["detail"] = detail
            try:
                channel.send(_json.dumps(payload))
            except Exception as exc:
                log.warning("session %s stage(%s) send failed: %s",
                            sess.session_id, stage, exc)

        _stage_cb = _emit_stage if _stage_signal_enabled() else None

        def _emit_speech_text(text, seq=seq):
            # 문장 세그먼트 push 시작 → 클론 발화 자막(additive — 구 클라이언트는 무시).
            if channel is not None and getattr(channel, "readyState", None) == "open":
                try:
                    channel.send(_json.dumps({"type": "speech_text", "text": text, "seq": seq}))
                except Exception as exc:
                    log.warning("session %s speech_text send failed: %s",
                                sess.session_id, exc)

        async def _run(mode=mtype, text=text, seq=seq, turn=turn):
            _se_present = bool(getattr(sess, "se_path", None))
            _offer_t = getattr(sess, "offer_time", None)
            _t0 = time.time()

            # [F7] filler 배선: PRETHIRD_FILLER on + filler_player 있을 때만.
            # off 경로 → _filler=None → 이하 모든 filler 코드 무동작(회귀 0).
            _filler = getattr(sess, "filler_player", None) if _FILLER_ENABLED else None

            # 발화종료 gate: say/speak(사용자 발화) 수신 → FillerPlayer 시작.
            # greet는 클론 선인사 — 사용자 발화가 아니므로 filler 재생 불필요.
            # [T-111 Task10] PRETHIRD_FILLER_ORDER=off 면 순서 개입 자체를 무력화(회귀 0 —
            # 기본 pre_speak 은 filler_order_pre_speak()==True 로 기존 분기와 동일).
            if mode in ("say", "speak") and _filler is not None and filler_order_pre_speak():
                _filler.start()

            # 응답 즉시컷 hook: 첫 infer 완료 후·첫 push 직전에 filler stop → 큐/버퍼 flush (렌더 동안 필러 순환 유지).
            # pipeline infer_worker(이벤트루프 코루틴)에서 호출 → call_soon_threadsafe 불필요.
            # flush 이후 _infer_stage가 응답 frames를 큐에 push(순서: stop→flush→응답push).
            def _on_response_ready():
                if _filler is not None:
                    _filler.stop()
                    sess.video_track.flush()
                    sess.audio_track.flush()

            _response_hook = _on_response_ready if _filler is not None else None
            # [T-067 §6.2] say/speak/greet도 react와 같은 세션 busy_lock 안에서 트랙 push —
            # 무경합(단독 호출) 시엔 즉시 통과라 기존 동작과 바이트 단위 동일(회귀 0).
            _lock = _get_busy_lock(sess)

            try:
                async with _lock:
                    if mode == "speak":
                        await sess.pipeline.speak(
                            text, turn=turn,
                            on_first_audio=_emit_speech_start,
                            on_response_ready=_response_hook,
                            on_sentence=_emit_speech_text,
                            on_stage=_stage_cb,
                        )
                    elif mode == "greet":
                        # greet: 사용자 발화 없으므로 filler 미사용(on_response_ready=None)
                        await sess.pipeline.greet(
                            turn=turn, on_first_audio=_emit_speech_start,
                            on_sentence=_emit_speech_text,
                            on_stage=_stage_cb,
                        )
                    else:
                        await sess.pipeline.say(
                            text, turn=turn,
                            on_first_audio=_emit_speech_start,
                            on_response_ready=_response_hook,
                            on_sentence=_emit_speech_text,
                            on_stage=_stage_cb,
                        )
            except asyncio.CancelledError:
                log.warning("session %s %s cancelled", sess.session_id, mode)
                raise
            except Exception as e:
                log.warning("session %s %s failed: %s", sess.session_id, mode, e)
            finally:
                sess.set_state("idle")
                if turn is not None:
                    offer_ms = int((_t0 - _offer_t) * 1000) if _offer_t else None
                    try:
                        turn.finalize(
                            mode=mode, seq=seq, se_present=_se_present,
                            offer_to_say_ms=offer_ms,
                            turn_ms=int((time.time() - _t0) * 1000),
                        )
                    except Exception as exc:
                        log.warning("session %s finalize failed: %s", sess.session_id, exc)
                # Phase B 자동학습: say 턴만, fire-and-forget(통화 무영향)
                # [T-067 Task 12] current_speaker(화자 확정 상태) 있으면 화자별 L2'로 라우팅,
                # 없으면 기존 사용자별 L2 그대로(learn_writeback 내부 person_id 분기).
                if mode == "say":
                    from learn_writeback import learn_writeback
                    _clone_reply = "".join(getattr(turn, "_tokens", [])) if turn is not None else ""
                    _speaker = getattr(sess, "current_speaker", None)
                    _person_id = _speaker[0] if _speaker else None
                    asyncio.ensure_future(learn_writeback(
                        getattr(sess, "clone_id", None),
                        getattr(sess, "user_id", None),
                        getattr(sess, "session_id", None),
                        text, _clone_reply,
                        person_id=_person_id,
                    ))
                # 발화 push 완료 → 클라에 종료 신호(say/speak/greet 성공·실패 모두 전송).
                # sess.datachannel 재참조 금지 — stop()+start() 재연결로 채널이
                # 교체되면 엉뚱한 새 채널로 전송될 수 있다. 이 메시지를 받은
                # 클로저 인자 channel(캡처 시점 고정)로만 전송한다.
                if channel is not None and getattr(channel, "readyState", None) == "open":
                    try:
                        # [T-151 Task18] push 완료 시점의 미재생 잔량(48kHz 샘플)을
                        # ms로 환산해 동승 — RN이 speech_end 후 그만큼 대기하고
                        # 녹음을 재개하도록. 미가용(속성 없음/None/예외/음수)이면
                        # 필드 자체를 생략(additive, 구클라이언트 영향 없음).
                        _payload = {"type": "speech_end", "seq": seq}
                        try:
                            _at = getattr(sess, "audio_track", None)
                            _qds = getattr(_at, "queue_depth_samples", None)
                            _remaining = _qds() if _qds is not None else None
                            if isinstance(_remaining, (int, float)) and _remaining >= 0:
                                _payload["remaining_ms"] = int(_remaining / 48)
                        except Exception:
                            pass
                        channel.send(_json.dumps(_payload))
                    except Exception as exc:
                        log.warning(
                            "session %s speech_end send failed: %s",
                            sess.session_id, exc,
                        )
            # [T-067 §6.2] 이 발화 종료(성공/실패 모두, 취소 제외) → 대기 중이던 pending
            # react가 있으면 지금 재생. face_event 토글 off/미도착 시 pending은 항상
            # None이라 _drain_pending_react는 즉시 반환(회귀 0).
            await _drain_pending_react(sess)

        asyncio.ensure_future(_run())

    return _on_msg


def make_app(pipeline_factory: Optional[Callable] = None) -> web.Application:
    """aiohttp Application 생성.

    Parameters
    ----------
    pipeline_factory : callable(sess) -> DialoguePipeline | None
        세션별 DialoguePipeline 생성 콜러블.
        None 이면 시그널링/idle 전용 모드(테스트·PoC).
    """
    app = web.Application()
    mgr = SessionManager()
    app["mgr"] = mgr

    async def healthz(_req: web.Request) -> web.Response:
        return web.json_response({
            "ok": True, "service": "prethird",
            "uptime_s": round(time.time() - _START, 1),
            "sessions": mgr.count(),
        })

    async def offer(request: web.Request) -> web.Response:
        params = await request.json()
        sess = mgr.create()
        sess.offer_time = time.time()
        pc = RTCPeerConnection()
        sess.pc = pc
        try:
            pc.addTrack(sess.video_track)
            pc.addTrack(sess.audio_track)

            # bundle 조회: clone_id/access_token 있을 때만
            # clone_id는 정수만 수용 — 비정수/음수/None이면 None(경로주입 차단, mizu H-1)
            raw_cid = params.get("clone_id")
            clone_id = raw_cid if isinstance(raw_cid, int) and raw_cid > 0 else None
            sess.clone_id = clone_id
            sess.recorder = make_recorder(sess.clone_id, sess.session_id)
            if sess.clone_id is not None:
                access_token = params.get("access_token")
                try:
                    bundle = await fetch_bundle(
                        os.environ.get("PRETHIRD_API_BASE"), sess.clone_id, access_token
                    )
                    # bundle 성공(토큰 유효 입증) 후 userId 정수만 추출 — 토큰 자체는 보존 X(mizu H-2)
                    from learn_writeback import user_id_from_token
                    sess.user_id = user_id_from_token(access_token) if bundle else None
                    # Phase B: P2P 통화 call_sessions 기록(H-2 충족). access_token 유효 스코프 내,
                    # finally del 직전. call_start는 graceful(실패해도 통화 진행). bundle 성공+user_id 있을 때만.
                    if bundle and sess.user_id:
                        from call_lifecycle import call_start
                        # [T-167] 세션 종류 요청을 그대로 전달한다. 판정·강등은 서버가 한다.
                        _kind = params.get("session_kind")
                        await call_start(
                            os.environ.get("PRETHIRD_API_BASE"),
                            sess.clone_id, sess.session_id, access_token,
                            session_kind=_kind if isinstance(_kind, str) else None,
                        )
                finally:
                    del access_token  # 토큰 세션 저장 금지 (mizu H-2) — 예외 경로에서도 소멸 보장
                if bundle is None and _STRICT_CLONE_BUNDLE:
                    # fail-closed: clone_id 지정 통화에서 bundle 미조회 → 고인 신원 오표시 방지
                    log.warning(
                        "clone bundle 미조회 → fail-closed (통화 거부) clone=%s",
                        sess.clone_id,
                    )
                    await pc.close()
                    mgr.remove(sess.session_id)
                    return web.json_response(
                        {"error": "clone_bundle_unavailable", "clone_id": sess.clone_id},
                        status=424,
                    )
                if bundle:
                    # [T-167] 허용 통화 시간. fail-closed(부재=0)이지만 실제 거부는
                    # _credit_enforced() 게이트 뒤 — 트랙 A 배포 전에는 관찰만 한다.
                    sess.allowed_sec = _extract_allowed_sec(bundle)
                    if sess.allowed_sec <= 0:
                        if _credit_enforced():
                            log.warning(
                                "크레딧 잔액 없음 → 통화 거부 clone=%s session=%s",
                                sess.clone_id, sess.session_id,
                            )
                            await pc.close()
                            mgr.remove(sess.session_id)
                            return web.json_response(
                                {"error": "insufficient_credits", "clone_id": sess.clone_id},
                                status=402,
                            )
                        log.warning(
                            "[T-167] bundle 에 allowedSec 없음/0 — CREDIT_ENFORCED off라 "
                            "통화는 진행하지만 과금 상한이 없다. 트랙 A 가 bundle 응답에 "
                            "allowedSec(정수, 초)를 실어야 한다. clone=%s",
                            sess.clone_id,
                        )
                    sess.persona_messages = bundle_to_messages(bundle)
                    assets = bundle.get("assets") or {}
                    se_key = assets.get("voiceSeKey")
                    # voice.wav lazy fetch: voiceRawUrl(원본 음성) → reference_voices/{clone_id}/voice.wav
                    # qwen3tts(8201)는 se_path에서 parse한 clone_id로 이 voice.wav를 찾는다. 폴백 없음.
                    voice_raw_url = assets.get("voiceRawUrl")
                    if voice_raw_url and sess.clone_id is not None:
                        try:
                            await ensure_voice_wav(sess.clone_id, voice_raw_url, REF_VOICES_ROOT)
                            log.info("voice.wav fetch OK clone=%s", sess.clone_id)
                        except Exception as e:
                            log.warning(
                                "voice.wav fetch 실패 clone=%s: %s (음성 무응답 — 폴백 없음)",
                                sess.clone_id, e,
                            )
                    # 후보 디렉토리 결정: voiceSeKey 우선, 없으면 clone_id 경로
                    candidate_dir = None
                    if se_key:
                        candidate_dir = f"{REF_VOICES_ROOT}/{se_key}"
                    elif sess.clone_id is not None:
                        candidate_dir = f"{REF_VOICES_ROOT}/{sess.clone_id}"
                    # 디렉토리 존재 확인: se.pth(OpenVoice) 또는 voice.wav(qwen3tts) 중 하나라도 있으면 채택
                    # clone_ref.py 구조: ref_audio_path는 {root}/{clone_id}/voice.wav 사용
                    # → 디렉토리 존재를 기준으로 se_path 설정(없는 자산 경로 미설정)
                    if candidate_dir:
                        se_pth = os.path.join(candidate_dir, "se.pth")
                        voice_wav = os.path.join(candidate_dir, "voice.wav")
                        if os.path.isfile(se_pth) or os.path.isfile(voice_wav):
                            sess.se_path = se_pth
                        else:
                            log.info("se_path 후보 부재 → 기본 voice 사용 (dir=%s)", candidate_dir)
                    # faceUrl: 클론 정면사진 pull → sess.face_path (fifth source 우선)
                    sess.face_path = await _fetch_face(assets, clone_id)
                    # idleVideoUrl: R2에서 클론별 idle mp4 pull → sess.video_path
                    idle_url = assets.get("idleVideoUrl")
                    if idle_url and clone_id is not None:
                        dest = f"{VIDEO_REF_ROOT}/{clone_id}/{clone_id}-idle-25fps.mp4"
                        try:
                            await fetch_to(idle_url, dest)
                            sess.video_path = dest
                            # idle 영상도 per-clone으로 교체 (IDLE_SOURCE_MODE 게이트, 기본 auto=현행)
                            _applied = clone_mp4_enabled()
                            if _applied:
                                sess.video_track.set_idle_video(dest)
                                # clone idle mp4 적용 플래그 — server.py factory가 이걸 보고
                                # prebake를 스킵(좋은 clone mp4를 무음 prebake로 안 덮음).
                                # ⚠️ 이 대입은 pipeline_factory(sess) 호출(아래 offer 흐름)
                                #    이전에 반드시 완료돼야 한다 — idle mp4 pull을 asyncio
                                #    create_task 등 fire-and-forget으로 바꾸지 말 것(순서 무력화).
                                sess.idle_video_applied = True
                            log.info("idle video pull OK clone=%s dest=%s applied=%s", clone_id, dest, _applied)
                        except Exception as e:
                            log.warning("idle video pull 실패 clone=%s: %s", clone_id, e)
                            # halbae fallback — sess.video_path = None 유지

                    # [F7] filler: PRETHIRD_FILLER on + clone_id 있을 때만 다운로드 + FillerPlayer 구성.
                    # off면 이 블록 전체 skip → offer 처리 시간 회귀 0 (spec §4.B I-3).
                    if _FILLER_ENABLED and clone_id is not None:
                        filler_urls = assets.get("fillerVideoUrls") or []
                        if filler_urls:
                            _filler_root = f"{VIDEO_REF_ROOT}/{clone_id}"

                            async def _dl_filler(url, idx):
                                """단일 filler mp4 다운로드. dest에 file_id 포함(재생성 자동
                                캐시버스트) + 같은 idx의 stale 캐시 정리. 존재 시 skip(fetch_to).
                                실패는 None 반환(idle 폴백)."""
                                dest = filler_cache_dest(_filler_root, clone_id, idx, url)
                                prune_stale_fillers(_filler_root, clone_id, idx, dest)
                                try:
                                    await fetch_to(url, dest)
                                    return dest
                                except Exception as exc:
                                    log.warning(
                                        "filler[%d] 다운로드 실패(idle 폴백): %s — %s",
                                        idx, url, exc,
                                    )
                                    return None

                            # 병렬 다운로드 — 순차 누적 지연 방지 (spec §4.B R-3)
                            filler_results = await asyncio.gather(
                                *[_dl_filler(u, i) for i, u in enumerate(filler_urls)]
                            )
                            filler_paths = [p for p in filler_results if p is not None]

                            if filler_paths:
                                from filler_player import FillerPlayer
                                sess.filler_player = FillerPlayer(
                                    filler_paths, sess.video_track, sess.audio_track
                                )
                                log.info(
                                    "FillerPlayer 구성 clone=%s paths=%d", clone_id, len(filler_paths)
                                )
                            else:
                                log.info(
                                    "filler 다운로드 전부 실패 — FillerPlayer 미생성(idle 폴백) clone=%s",
                                    clone_id,
                                )
                        else:
                            log.debug(
                                "fillerVideoUrls 빈 배열 — FillerPlayer 미생성(idle 폴백) clone=%s",
                                clone_id,
                            )
            log.info(
                "offer session=%s clone_id=%s persona=%d se=%s video_path=%s face=%s",
                sess.session_id, sess.clone_id, len(sess.persona_messages),
                bool(sess.se_path), sess.video_path, bool(sess.face_path),
            )

            # pipeline factory가 있으면 세션에 주입
            if pipeline_factory is not None:
                sess.pipeline = pipeline_factory(sess)

            @pc.on("datachannel")
            def _on_dc(channel):
                sess.datachannel = channel
                _on_msg = _make_dc_handler(sess, channel)
                channel.on("message")(_on_msg)

            # [avsync] 모니터 task 핸들 (connected 시 시작, closed/failed 시 cancel)
            _avsync_task: list[asyncio.Task] = []  # list 로 감싸 클로저 재할당 가능

            @pc.on("connectionstatechange")
            async def _on_state():
                log.info("session %s pc state=%s", sess.session_id, pc.connectionState)
                if pc.connectionState == "connected":
                    if _AVSYNC_LOG and not _avsync_task:
                        task = asyncio.ensure_future(_avsync_monitor(sess))
                        _avsync_task.append(task)
                        log.info("session %s [avsync] monitor started", sess.session_id)
                if pc.connectionState in ("failed", "closed", "disconnected"):
                    if _avsync_task:
                        _avsync_task[0].cancel()
                        _avsync_task.clear()
                        log.info("session %s [avsync] monitor cancelled", sess.session_id)
                    # [F7] filler cleanup: stop + 캐시 해제 (좀비 asyncio task 방지).
                    # pc.close() 이전에 수행 — 세션 자원 정리 순서 일관성 유지.
                    _filler_cleanup = getattr(sess, "filler_player", None)
                    if _filler_cleanup is not None:
                        _filler_cleanup.close()
                        sess.filler_player = None
                        log.info("session %s FillerPlayer closed (cleanup)", sess.session_id)
                    # [T-167] 크레딧 가드 정리 — 남은 타이머가 종료 후 발화하면
                    # 이미 끊긴 통화를 또 끊으려 든다. pc.close() 이전에 수행.
                    _cancel_credit_guard(sess)
                    await pc.close()
                    # Phase B: 통화 종료 통보(best-effort). 여러 번 fire돼도 api가 멱등(ended_at IS NULL).
                    # sess 필드는 mgr.remove 전에 로컬 추출 — 세션 제거 후 참조(use-after-free) 방어.
                    _cid, _sid = sess.clone_id, sess.session_id
                    mgr.remove(sess.session_id)
                    from call_lifecycle import call_end
                    asyncio.ensure_future(call_end(
                        os.environ.get("PRETHIRD_API_BASE"), _cid, _sid,
                    ))

            await pc.setRemoteDescription(
                RTCSessionDescription(sdp=params["sdp"], type=params["type"]))
            answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
        except Exception:
            await pc.close()
            mgr.remove(sess.session_id)
            raise
        return web.json_response({
            "session_id": sess.session_id,
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
        })

    app.router.add_get("/healthz", healthz)
    app.router.add_post("/offer", offer)
    app.router.add_post("/prebuild", prebuild_handler)
    app.router.add_static("/static/", path=str(
        pathlib.Path(__file__).resolve().parents[1] / "static"))

    if os.environ.get("PRETHIRD_VERIFY_ENABLED") == "1":
        from chat_endpoint import register_verify_routes
        register_verify_routes(app)

    # T-117 학습하기 답변 해석 endpoint — Cloudflare Workers 만 호출 (X-Internal-Secret 방어).
    # 등록 flag 없이 항상 켬. auth 는 endpoint 내부에서 처리.
    from knowledge_interpret_endpoint import register_knowledge_interpret_routes
    register_knowledge_interpret_routes(app)
    from knowledge_followup_endpoint import register_knowledge_followup_routes
    register_knowledge_followup_routes(app)

    return app
