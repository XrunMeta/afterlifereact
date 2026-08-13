from __future__ import annotations
import asyncio, os, re, time, pathlib, logging, json
from typing import Callable, Optional
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from session import SessionManager
from clone_dialog import fetch_bundle, bundle_to_messages
from clone_dialog.persona_prompt import sanitize_display_name as _persona_sanitize_display_name
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
# [T-252 Task 8] 상태 4(얼굴 미확정) 유지 수명(초). 기본 10초.
# 상수(REACT_COOLDOWN_S 관례) 대신 호출 시점 재평가(_speaker_identity_enabled 관례)를
# 택했다 — 이 값은 실패 시 "이름을 영영 못 부르는" 고착을 푸는 안전장치라, 운영 중
# 프로세스를 재시작하지 않고도 env 로 조정·비활성(0)할 수 있어야 하고, 테스트에서도
# monkeypatch.setenv 만으로 짧게 줄일 수 있어야 한다(모듈 reload 불필요).
_UNCONFIRMED_TTL_KEY = "PRETHIRD_UNCONFIRMED_TTL_S"
# [T-252 Task 9] 상태 4 복귀가 예외로 실패했을 때 타이머를 다시 걸어볼 최대 횟수.
# 1 = "한 번만 더". 0 이면 재시도 없음(구 동작 = 예외 시 고착 복귀).
_UNCONFIRMED_MAX_RETRY = 1


def _unconfirmed_ttl_s() -> float:
    """상태 4 를 유지할 최대 초. 0 이하면 타이머 비활성(= 무기한 상태 4).

    [2026-08-12 Remember Me] 기본값을 10 → 0(무기한)으로 뒤집었다. 미확정 모드의
    해제 조건은 **등록된 얼굴 인식 하나뿐**이다. 시간이 지났다고 상태 1(계정주 L2)로
    되돌아가면, 누구인지 모르는 상대에게 10초 뒤 자동으로 계정주의 기억이 열린다 —
    미확정 모드가 막으려던 바로 그 상황이다.

    타이머 코드는 그대로 남긴다. PRETHIRD_UNCONFIRMED_TTL_S 에 양수를 넣으면 예전
    자동 복귀 동작으로 되돌릴 수 있다(방향만 반대인 같은 롤백 스위치).

    파싱 실패는 기본값으로 되돌린다 — env 오타 하나로 동작이 조용히 바뀌지 않게."""
    try:
        return float(os.environ.get(_UNCONFIRMED_TTL_KEY, "0"))
    except ValueError:
        return 0.0
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
#   1. 트랙 A 를 preview 에 먼저 올린다
#   2. prethird 를 올린다 (이 시점까지 PRETHIRD_CREDIT_ENFORCED 는 off)
#   3. 실통화로 greeted/정산을 확인한 뒤 PRETHIRD_CREDIT_ENFORCED=1 로 올린다
# 순서를 뒤집어 1번보다 먼저 3번을 하면 allowedSec 부재로 전 통화가 402 거부된다.
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


# [T-135 / T-252 fix] face_event displayName 검증 — 정본은
# `clone_dialog/persona_prompt.py` 의 `sanitize_display_name` 하나뿐이다.
# 예전엔 같은 로직을 이 파일에 복제해 두고 "바이트 단위 동일" 을 사람이 지켰는데,
# 한쪽만 강화하면(mizu H-3 허용목록) 조용히 어긋난다 → import 로 통일했다.
# 실시간 datachannel 메시지라 검증 실패로 이벤트 전체를 버리지 않고 이름만
# 신뢰하지 않는다(None 으로 강등 → 재조립 시 상태 3 문안, 이름 호칭 억제).
_sanitize_display_name = _persona_sanitize_display_name


def _bump_speaker_epoch(sess) -> int:
    """[T-252 fix / el I-2] 화자 상태 세대를 1 올리고 새 값을 돌려준다.

    화자가 바뀌거나(speaker_confirmed) 해제될 때(unknown_face/multi_face) 호출한다.
    스왑을 스케줄한 쪽이 이 값을 closure 로 얼려 두고 적용 직전에 비교하면, 같은
    pid 안에서 순서가 뒤집힌 in-flight 스왑을 드랍할 수 있다."""
    epoch = getattr(sess, "speaker_epoch", 0) + 1
    sess.speaker_epoch = epoch
    return epoch


async def _maybe_swap_l2p(sess, pid: int, name, epoch: int | None = None) -> None:
    """[T-067 Task 12 / T-252] speaker_confirmed 화자(pid/name)에 맞춰 persona를 재조립.

    fire-and-forget — 호출부(_handle_face_event)가 `asyncio.ensure_future`로 스케줄하고
    react 발화를 전혀 기다리지 않는다(api 5s 타임아웃이 react 지연으로 번지지 않도록
    react는 이름만으로 즉시 나가고, L2' 반영은 다음 턴부터가 스펙). pid/name은 스케줄
    시점 closure-frozen 값(파일 내 react kind/react_name과 동일한 freeze 관례) — 함수
    내부에서 live `sess.current_speaker`를 다시 읽지 않는다.

    [T-252] base 뒤에 화자 힌트를 덧붙이던 방식을 버리고 매번 bundle 전체를 재조립한다
    — base 프롬프트에 "기본 상대는 지호" 선언이 있는 상태에서 힌트만 덧붙이면 "지금
    상대는 민수" 선언과 동시에 남아 모순이 된다. 1) sess.bundle이 없으면(재연결·offer
    실패 등) 재조립할 원본이 없으므로 스킵 — bundle_to_messages(None)은 []을 반환하는데
    그대로 update하면 페르소나(안전 규칙·성격·기억)가 통째로 사라진다. 2) fetch_l2p로
    화자별 L2' 조회 — 있으면 관계요약 포함, 없으면(404/미설정/오류) 이름만. 3) 적용
    직전 `sess.current_speaker[0] == pid` 재확인 — 연속 교대로 이 fetch가 늦게 끝나
    최신 화자의 스왑을 덮어쓰지 않도록 stale이면 드랍. 4) bundle_to_messages(sess.bundle,
    speaker=...)로 상대 선언을 포함한 프롬프트 전체를 재조립해 pipeline.update_persona로
    교체(다음 턴부터 반영). 어떤 단계에서 실패해도(속성 부재·네트워크 오류) 예외를
    삼켜 통화 자체엔 영향 없다 — 스왑이 전부 스킵될 뿐."""
    try:
        pipeline = getattr(sess, "pipeline", None)
        if pipeline is None:
            return
        bundle = getattr(sess, "bundle", None)
        if not bundle:
            # [T-252 fix / el I-4] 재조립할 원본이 없으면 프롬프트는 영원히 상대를
            # 계정주로 선언한 상태로 남는데, learn_writeback 은 매 turn
            # `sess.current_speaker` 를 읽으므로 학습만 person A 로 귀속된다 —
            # "이 턴의 프롬프트 상대 = 그 턴의 학습 귀속 대상" 불변식이 깨진 창이다.
            # 프롬프트를 A 로 못 맞추므로 반대쪽(귀속)을 보류해 창을 닫는다:
            # current_speaker 를 되돌려 학습도 익명(계정주 L2)으로 떨어뜨린다.
            # 세대가 이미 넘어갔으면 최신 화자를 지우게 되므로 건드리지 않는다.
            if epoch is None or getattr(sess, "speaker_epoch", epoch) == epoch:
                sess.current_speaker = None
            log.warning(
                "session %s bundle 부재로 L2' 스왑 스킵 — 학습 귀속도 익명으로 보류 person=%s",
                getattr(sess, "session_id", "?"), pid,
            )
            return

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

        # stale 가드 1: fetch 도중 화자가 또 바뀌었으면(연속 교대) 늦게 끝난 이 결과는
        # 버린다 — 최신 화자의 스왑(이미 진행/완료)을 덮어쓰지 않는다.
        current = getattr(sess, "current_speaker", None)
        if current is None or current[0] != pid:
            return

        # stale 가드 2 [T-252 fix / el I-2]: 세대(epoch) 비교. pid 만 보면 "화자가
        # 바뀌었나"는 알아도 "이 스왑이 최신 스케줄인가"는 모른다. `2(A) → 4 → 2(A)`
        # 복귀에서 A 로 두 번 스케줄되면 pid 는 둘 다 통과하지만, 늦게 끝난 첫 번째가
        # frozen name 과 낡은 L2' 로 두 번째 결과를 덮어쓴다. epoch 는 화자 상태가
        # 바뀔 때마다 오르므로 그 역전을 잡는다. epoch=None 은 세대 관리 밖에서
        # 직접 호출된 경우(테스트 등)로 이 가드를 건너뛴다.
        if epoch is not None and getattr(sess, "speaker_epoch", epoch) != epoch:
            return

        # T-252: base 뒤에 힌트를 덧붙이는 대신 프롬프트를 통째로 재조립한다.
        # append 방식은 "기본 상대는 지호" 선언과 "지금 상대는 민수" 선언이 프롬프트에
        # 동시에 남아 모순이 된다.
        # person_id 를 함께 넘긴다 — 프롬프트 쪽이 bundle.viewer.ownerPersonId 와 대조해
        # "이 화자가 L2 의 주인(계정주 본인)인가" 를 판정한다(Remember Me 2026-08-13).
        new_messages = bundle_to_messages(
            bundle,
            speaker={"name": name, "l2p_data": l2p_data, "person_id": pid},
        )
        if not new_messages:
            # [T-252 fix / el I-1] 입력(bundle) 가드만으로는 부족하다 — truthy bundle
            # 로도 재조립 결과가 [] 가 될 수 있다. 특히 화자 확정 경로는 상대 정보를
            # L2' 로만 채우므로(mizu H-2 수정), 클론 자기 속성·L0 가 비어 있고 상대
            # 속성만 있던 번들은 L2' 부재 시 통째로 빈다. update_persona([]) 는
            # 안전 규칙·성격·기억 전소이므로 기존 프롬프트를 그대로 유지한다.
            log.warning(
                "session %s L2' 재조립 결과가 비어 프롬프트를 유지한다(전소 방지) person=%s",
                getattr(sess, "session_id", "?"), pid,
            )
            return
        update = getattr(pipeline, "update_persona", None)
        if callable(update):
            update(new_messages)
            if _face_diag_on():
                # [T-135] l2p_data 원문(memories_personal/preference_personal 값)은 절대
                # 로깅하지 않는다 — 요약(_diag_summarize_l2p: 키/길이/개수만)만 남긴다
                # (mizu MEDIUM1). 실명(displayName)도 로그에 남기지 않는다.
                log.info(
                    "face_diag l2p_swapped session=%s person=%s l2p_summary=%s named=%s",
                    getattr(sess, "session_id", "?"), pid,
                    json.dumps(_diag_summarize_l2p(l2p_data), ensure_ascii=False),
                    bool(name),
                )
    except Exception as e:
        log.warning("session %s _maybe_swap_l2p failed: %s", getattr(sess, "session_id", "?"), e)


def _cancel_unconfirmed_timer(sess) -> None:
    """[T-252 Task 8] 상태 4 수명 타이머 해제. 타이머가 없는 세션에서도 안전해야 한다
    (_cancel_credit_guard 관례). speaker_confirmed 수신·통화 종료 두 곳에서 부른다."""
    handle = getattr(sess, "unconfirmed_timer", None)
    if handle is None:
        return
    try:
        handle.cancel()
    except Exception as e:
        log.warning(
            "session %s unconfirmed timer cancel failed: %s",
            getattr(sess, "session_id", "?"), e,
        )
    sess.unconfirmed_timer = None


def _cleanup_session_resources(sess) -> None:
    """[T-252 Task 9] 통화 종료 시 세션에 매달린 자원(플레이어·타이머) 정리.

    `make_app` 의 `connectionstatechange` 종료 분기에 인라인이던 블록을 그대로 뽑았다.
    인라인이면 실제 `RTCPeerConnection` 없이 부를 방법이 없어 테스트가
    `inspect.getsource` 문자열 포함 여부밖에 못 봤고, 그 단언은 호출을 `connected`
    분기로 옮겨도 그대로 통과한다(실측). 헬퍼로 빼면 테스트가 직접 불러 실제 취소
    동작을 검증할 수 있다.

    반드시 `pc.close()` **이전에** 부른다 — 남은 타이머가 종료된 세션의
    `pipeline.update_persona` 를 뒤늦게 건드리는 것을 막는다.
    세션에 해당 자원이 없어도 안전해야 한다(각 헬퍼가 no-op 을 보장)."""
    # [F7] filler cleanup: stop + 캐시 해제 (좀비 asyncio task 방지).
    filler = getattr(sess, "filler_player", None)
    if filler is not None:
        filler.close()
        sess.filler_player = None
        log.info("session %s FillerPlayer closed (cleanup)", getattr(sess, "session_id", "?"))
    # [T-167] 크레딧 가드 정리 — 남은 타이머가 종료 후 발화하면 이미 끊긴 통화를 또 끊으려 든다.
    _cancel_credit_guard(sess)
    # [T-252 Task 8] 상태 4 수명 타이머 정리 — 남으면 죽은 세션의 pipeline 을 건드린다.
    _cancel_unconfirmed_timer(sess)


def _unconfirmed_timeout(sess) -> None:
    """[T-252 Task 8] 상태 4 수명 만료 — 프롬프트를 상태 1(기본 상대)로 되돌린다.

    call_later 콜백이라 **동기**다. 통화 경로(say/greet)를 블로킹하지 않고, 어떤
    예외도 밖으로 새면 안 된다(루프 예외 핸들러로 흘러가 통화 로그를 오염시킨다)
    — 그래서 본문 전체를 try/except 로 감싼다. 실패하면 상태 4 가 유지될 뿐이다.

    되돌리는 것은 **프롬프트뿐**이다. `sess.current_speaker` 는 건드리지 않는다 —
    화자는 여전히 미확정이므로 learn_writeback 의 person 귀속은 익명으로 남는 것이
    맞다(프롬프트가 상태 1 = 계정주 L2 이고 귀속도 계정주이므로 "이 턴의 프롬프트
    상대 = 그 턴의 학습 귀속 대상" 불변식도 그대로 성립한다).

    가드 순서:
    1. `prompt_unconfirmed` 재확인 — 이미 상태 4 를 벗어났으면(speaker_confirmed 가
       루프가 이 콜백을 꺼낸 뒤에 cancel 을 불러 취소가 무효화된 경우 포함) 드랍한다.
       이것이 이 콜백의 stale 가드다. 무장 시점의 epoch 를 얼려 비교하면 안 된다 —
       연속 unknown_face 가 epoch 를 올리므로(강등을 스킵해도 bump 는 무조건 일어난다)
       그 비교는 정상 시나리오에서 복귀를 영구히 막아 고착을 그대로 재현한다.
    2. 전소 가드 — pipeline/bundle 부재(입력)와 재조립 결과 [] (출력) 양쪽.
       update_persona([]) 는 안전 규칙·성격·기억 전소다.
    3. epoch bump — 상태가 바뀌므로 in-flight `_maybe_swap_l2p` 가 이 복귀를
       덮어쓰지 못하게 세대를 올린다. 이 콜백에는 await 가 없어 bump 와 update
       사이에 다른 코루틴이 끼어들 수 없다.
    """
    try:
        sess.unconfirmed_timer = None
        if not getattr(sess, "prompt_unconfirmed", False):
            return
        pipeline = getattr(sess, "pipeline", None)
        bundle = getattr(sess, "bundle", None)
        if pipeline is None or not bundle:
            return
        update = getattr(pipeline, "update_persona", None)
        if not callable(update):
            return
        # speaker 인자 없음 = 상태 1(기본 상대 · 이름 호칭 허용).
        new_messages = bundle_to_messages(bundle)
        if not new_messages:
            log.warning(
                "session %s 상태1 복귀 재조립 결과가 비어 프롬프트를 유지한다(전소 방지)",
                getattr(sess, "session_id", "?"),
            )
            return
        _bump_speaker_epoch(sess)
        update(new_messages)
        # 반드시 내려야 다음 unknown_face 가 또 강등할 수 있다(재강등 반복이 설계다).
        sess.prompt_unconfirmed = False
        if _face_diag_on():
            # 실명·L2' 원문은 남기지 않는다 — 세션 id 와 사실만.
            log.info(
                "face_diag unconfirmed_expired session=%s restored=1",
                getattr(sess, "session_id", "?"),
            )
    except Exception as e:
        log.warning(
            "session %s unconfirmed timeout restore failed: %s",
            getattr(sess, "session_id", "?"), e,
        )
        # [T-252 Task 9] 복구 경로. 여기서 그냥 빠지면 `prompt_unconfirmed` 는 True 인 채
        # `unconfirmed_timer` 만 None 이라, 이후 `unknown_face` 는 `_clear_current_speaker` 의
        # 중복 강등 가드에 걸려 재무장조차 되지 않는다 — 상태 4 가 통화 끝까지 고착으로
        # 복귀한다(이 타이머가 없애려던 바로 그 증상). 그래서 한 번 다시 무장한다.
        #
        # 무한 재시도는 하지 않는다: update_persona 가 계속 실패하는 세션이 TTL 마다 영원히
        # 재시도하면 실패 로그만 쌓인다. `_UNCONFIRMED_MAX_RETRY` 회까지만 하고 포기한다
        # (포기해도 안전 측 실패다 — 상태 4 유지 = 이름을 안 부르는 쪽).
        # 재무장 자체가 또 실패해도 밖으로 새면 안 되므로 한 번 더 감싼다.
        try:
            if (
                getattr(sess, "prompt_unconfirmed", False)
                and getattr(sess, "unconfirmed_retry", 0) < _UNCONFIRMED_MAX_RETRY
            ):
                sess.unconfirmed_retry = getattr(sess, "unconfirmed_retry", 0) + 1
                _arm_unconfirmed_timer(sess)
        except Exception as e2:
            log.warning(
                "session %s unconfirmed timeout re-arm failed: %s",
                getattr(sess, "session_id", "?"), e2,
            )


def _arm_unconfirmed_timer(sess) -> None:
    """[T-252 Task 8] 상태 4 강등 직후 수명 타이머를 건다.

    **이미 떠 있으면 재무장하지 않고 그대로 둔다.** 연속 `unknown_face` 가 타이머를
    매번 갱신하면 얼굴이 계속 잡히는 동안 만료가 무한 연장되어 — 즉 고착이 발생하는
    바로 그 상황에서 — 이 장치가 통째로 무력해진다. 실제 `_clear_current_speaker` 는
    중복 강등을 `prompt_unconfirmed` 로 이미 막고 있어 여기까지 두 번 오지 않지만,
    "무장은 강등 1회당 1개" 를 이 함수 자체가 보장하게 해 둔다.

    이벤트 루프 밖에서 불리면(동기 단위 테스트 등) 조용히 스킵한다 — 통화 경로는
    항상 aiohttp 루프 안이므로 실운영에는 해당하지 않는다."""
    if getattr(sess, "unconfirmed_timer", None) is not None:
        return
    ttl = _unconfirmed_ttl_s()
    if ttl <= 0:
        return  # 비활성(롤백 스위치) — 상태 4 를 무기한 유지하던 구 동작
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return
    try:
        sess.unconfirmed_timer = loop.call_later(ttl, _unconfirmed_timeout, sess)
    except Exception as e:
        log.warning(
            "session %s unconfirmed timer arm failed: %s",
            getattr(sess, "session_id", "?"), e,
        )


def _clear_current_speaker(sess, event: str) -> None:
    """[T-135 v2 / T-252] 화자 확실성 게이팅 — `unknown_face`/`multi_face` 수신 시
    화자를 익명으로 되돌리고 프롬프트를 상태 4로 강등한다.

    두 가지 일을 하는데, 조건이 서로 다르다는 것이 핵심이다(T-252 fix / mizu H-1 · el B-2).

    1) `current_speaker=None` 해제 — 이미 None이면 no-op. 해제하면 이후
       `_maybe_swap_l2p`의 stale 가드가 늦게 도착하는 이전 화자의 스왑도 자동
       드랍한다(이중 방어). `learn_writeback` person 귀속도 이 시점부터 즉시
       익명(person_id=None)으로 보류된다(호출부가 매 turn `sess.current_speaker`를
       그때그때 읽으므로 별도 배선 불필요).
    2) 프롬프트 상태 4 강등 — **`current_speaker` 상태와 무관하게 무조건** 수행한다.
       예전엔 `if sess.current_speaker is None: return` 이 함수 전체를 막아서
       상태 4로 들어가는 간선이 `2→4` 하나뿐이었다. 그런데 `clone_person_faces`가
       0행이라 `/oth-path`는 절대 매칭되지 않고 → `speaker_confirmed`가
       한 번도 오지 않고 → `current_speaker`는 영원히 None이라 **상태 4가 100%
       발생하지 않았다**. 카메라 앞에 제3자가 앉아도 프롬프트는 상태 1 그대로
       ("상대는 지호")여서 클론이 제3자를 계정주 이름으로 부르고 계정주의 L2를
       그 사람 것으로 읊는다 — 설계 3.2가 T-135 완화의 유일한 안전 조건으로 내건
       "이름으로 부르지 않는다"가 정작 필요한 상황에서만 미작동했다.
       중복 재조립은 `sess.prompt_unconfirmed` 플래그로 막는다(연속 unknown_face).

    [T-252 Task 8] 강등이 실제로 일어나면 상태 4 수명 타이머를 건다. 상태 4 에서
    나가는 간선이 `speaker_confirmed` 하나뿐인데 `clone_person_faces` 0행이면 그
    이벤트가 구조적으로 발생할 수 없어, 강등이 곧 통화 끝까지 가는 고착이 된다.
    타이머가 만료되면 `_unconfirmed_timeout` 이 상태 1 로 되돌리고, 그 뒤 다시
    `unknown_face` 가 오면 또 강등한다(4 ↔ 1 반복).

    상태 4 재조립은 익명 리셋(상대 정보 통째 삭제)이 아니라 기본 상대(L2) 폴백이다 —
    얼굴이 감지됐으나 매칭에 실패한 것은 "낯선 사람"이 아니라 "누구인지 확정하지 못한
    상태"다. 관계·기억은 유지하되 이름 호칭만 억제한다. 복귀 대상은 통화를 건 사용자
    본인의 L2 뿐이며 타인의 L2' 는 남기지 않는다.
    """
    # [T-252 fix / el I-2] 세대는 항상 올린다 — 상태 4 로 넘어간 이상 in-flight
    # 스왑은 전부 낡은 것이다(재조립을 실제로 했는지와 무관).
    _bump_speaker_epoch(sess)
    if sess.current_speaker is not None:
        sess.current_speaker = None
        if _face_diag_on():
            log.info(
                "face_diag speaker session=%s event=%s cleared=1",
                getattr(sess, "session_id", "?"), event,
            )
    if getattr(sess, "prompt_unconfirmed", False):
        return  # 이미 상태 4 — 재조립 결과가 같으므로 중복 update 를 건너뛴다
    try:
        pipeline = getattr(sess, "pipeline", None)
        bundle = getattr(sess, "bundle", None)
        if pipeline is None or not bundle:
            # 재조립할 원본이 없다(스왑 전 재연결·offer 실패 등). update_persona([])는
            # 페르소나(안전 규칙·성격·기억) 전소라 절대 부르지 않는다.
            return
        update = getattr(pipeline, "update_persona", None)
        if not callable(update):
            return
        new_messages = bundle_to_messages(bundle, speaker={"unconfirmed": True})
        if not new_messages:
            # [T-252 fix / el I-1] 입력(bundle) 가드만으로는 부족하다 — truthy bundle
            # 로도 재조립 결과가 [] 가 될 수 있다(L0 rules_text 부재 + 클론 자기 속성
            # 부재 등). update_persona([]) 는 안전 규칙·성격·기억 전소다. 재조립이
            # 비면 기존 프롬프트를 그대로 유지한다.
            log.warning(
                "session %s 상태4 재조립 결과가 비어 프롬프트를 유지한다(전소 방지)",
                getattr(sess, "session_id", "?"),
            )
            return
        update(new_messages)
        sess.prompt_unconfirmed = True
        # [T-252 Task 8] 상태 4 는 수명을 갖는다 — 만료되면 상태 1 로 돌아간다.
        # 강등이 실제로 일어난 경로에서만 무장한다(가드로 스킵된 경우엔 상태가
        # 바뀌지 않았으므로 되돌릴 것도 없다).
        # [T-252 Task 9] 새 강등마다 복귀 재시도 예산을 새로 준다 — 앞선 강등에서
        # 예외로 예산을 다 썼다고 이번 강등의 복구까지 막을 이유는 없다.
        sess.unconfirmed_retry = 0
        _arm_unconfirmed_timer(sess)
    except Exception as e:
        log.warning(
            "session %s _clear_current_speaker persona reset failed: %s",
            getattr(sess, "session_id", "?"), e,
        )


def face_event_clone_matches(session_clone_id, event_clone_id) -> bool:
    """[T-257] face_event 의 clone_id 가 세션 clone_id 와 일치하는지.

    서버(/oth-path)가 이미 (user_id, clone_id) 스코프를 강제하므로
    이 검사는 방어 1층이다. event_clone_id 가 없으면(구 클라이언트) 통과시킨다 —
    서버 게이트가 정본이고, 여기서 막으면 하위호환이 깨진다.

    event_clone_id 는 datachannel 로 들어오는 **완전히 신뢰할 수 없는 입력**이다
    (T-135 IDOR 교훈). 이 함수는 전역(total) 함수여야 한다 — 어떤 입력이 와도
    예외를 던지지 않고 반드시 bool 을 반환한다. 정수로 해석할 수 없는 값(문자열
    "abc", list, dict 등)은 "해석 불가 = 불일치"로 취급해 False 를 반환한다
    (호출부가 이를 이벤트 드랍으로 이어가므로 fail-closed).

    bool 은 파이썬에서 int 의 서브클래스라 `int(True) == 1` 처럼 우연히 세션
    clone_id 와 일치해버릴 수 있다 — clone_id 로 인정하지 않고 명시적으로
    불일치(False) 처리한다.

    [재리뷰 fix] `except (TypeError, ValueError)` 로 예외 타입을 나열했더니
    `int(float('inf'))` 가 던지는 `OverflowError` 가 새지 못하고 그대로
    통과해버렸다(`_on_msg` 의 `json.loads` 는 표준 json 모듈 기본 동작상
    `Infinity`/`-Infinity`/`NaN` 토큰을 허용하므로 `{"clone_id":Infinity}` 가
    실제로 도달 가능하다). 타입을 나열하는 방식은 "네 번째 타입이 또 들어온다"는
    구조적 문제가 있으므로, 이 함수는 **뭐가 오든 예외를 밖으로 내보내지 않는다**는
    계약을 지키기 위해 `except Exception` 으로 광범위하게 잡는다. 원인 진단을
    위해 예외 타입명은 로그에 남긴다.
    """
    if event_clone_id is None:
        return True
    if isinstance(event_clone_id, bool):
        log.warning(
            "face_event_clone_matches: clone_id가 bool(%r) — clone_id로 인정하지 않고 불일치 처리",
            event_clone_id,
        )
        return False
    try:
        return int(session_clone_id) == int(event_clone_id)
    except Exception as e:
        # 의도적으로 광범위하게 잡는다 — 이 함수의 계약은 "어떤 입력이 와도
        # 예외를 던지지 않는다"이므로 특정 타입 나열은 다음 예외 타입(예:
        # OverflowError)이 다시 새는 재발 패턴을 만든다. 원인은 타입명으로 로그.
        log.warning(
            "face_event_clone_matches: clone_id 형식 이상(파싱 불가, garbage payload, %s) "
            "session=%r event=%r",
            type(e).__name__, session_clone_id, event_clone_id,
        )
        return False


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
    if not face_event_clone_matches(getattr(sess, "clone_id", None), data.get("clone_id")):
        log.warning(
            "session %s face_event clone_id 불일치(무시): session=%s event=%s",
            sess.session_id,
            getattr(sess, "clone_id", None),
            data.get("clone_id"),
        )
        return

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
            # [T-252 fix / mizu H-1] 상태 4 중복 방지 플래그를 반드시 여기서 푼다 —
            # 안 풀면 이 통화에서 두 번째 unknown_face 가 와도 강등이 스킵된다.
            sess.prompt_unconfirmed = False
            # [T-252 Task 8] 상태 4 수명 타이머 취소 — 화자가 확정됐으므로 상태 2 로
            # 가야 한다. 남겨 두면 10초 뒤 콜백이 상태 1 로 되돌려 방금 확정한 화자를
            # 덮어쓴다. (플래그를 이미 False 로 내렸으니 콜백이 늦게 실행돼도 자체
            # 가드에서 드랍되지만, 취소가 정공법이고 플래그 가드는 2층이다.)
            _cancel_unconfirmed_timer(sess)
            epoch = _bump_speaker_epoch(sess)
            if _face_diag_on():
                log.info(
                    "face_diag speaker session=%s person=%s swap_scheduled=1",
                    getattr(sess, "session_id", "?"), pid_int,
                )
            asyncio.ensure_future(_maybe_swap_l2p(sess, pid_int, name, epoch))
    elif event in ("unknown_face", "multi_face") and identity_on:
        # [T-135 v2] 화자 확실성 게이팅 — 낯선 얼굴/다중 얼굴이면 즉시 익명으로 해제.
        # speaker_confirmed로 재확정될 때까지 이름/L2' 주입·learn_writeback person
        # 귀속을 보류한다(_maybe_swap_l2p의 stale 가드가 current_speaker None을 보고
        # 이후 늦게 도착하는 이전 화자의 스왑도 자동 드랍 — 이중 방어).
        _clear_current_speaker(sess, event)

    if not react_on:
        return  # react(쿨다운·발화·pending_enroll)는 FACE_REACT 게이트 단독 — off면 여기서 종료

    # [Remember Me 2026-08-13] silent — 신원만 반영하고 반응 발화는 하지 않는 신호 경로.
    #
    # 앱이 계정주를 자동 등록한 직후 그 사실을 서버에 **즉시** 알리기 위해 쓴다. 예전에는
    # 다음 얼굴 인식 주기를 기다렸는데, 그 사이(실측 36초) 서버는 미확정이라 "Remember Me
    # 를 눌러달라" 고 말하는데 앱은 등록 중이라 시트를 안 띄운다 — 사용자에게는 등록을
    # 요구하면서 누를 UI 는 없는 상태로 보인다.
    #
    # 그렇다고 그냥 speaker_confirmed 를 보내면 react 가 걸려 클론이 갑자기 "다시
    # 오셨네요" 로 말을 끊는다(FACE_REACT_ENABLED=1). 그래서 신원 반영(위 프롬프트 갱신·
    # L2' 스왑)까지만 하고 여기서 끝낸다. 히즈키 제안 — "대답은 안 하는 신호 전용 경로".
    if data.get("silent") is True:
        if _face_diag_on():
            log.info(
                "face_diag silent session=%s event=%s person=%s — 신원만 반영, 발화 없음",
                getattr(sess, "session_id", "?"), event, pid_int,
            )
        return

    # [Remember Me 2026-08-13] rejoin — "끊겼다가 돌아왔다".
    #
    # 아는 얼굴 반응은 통화당 1회다(같은 사람에게 "오셨군요"를 반복하지 않기 위해).
    # 그런데 Remember Me 대기에 빠졌다가 아는 얼굴이 다시 잡힌 경우에는, 그 사람에게
    # 실제로 대화가 끊겼던 것이므로 다시 맞이해야 한다(히즈키 지시: "내 얼굴이 다시
    # 나오면 다시 왔다고 인사를 하고 대화 진행").
    #
    # 다만 1회 제한을 통째로 없애지는 않는다 — 앱이 신호를 반복해 보내면 클론이 매번
    # 말을 끊게 되므로, unknown 과 같은 60초 쿨다운은 그대로 적용한다.
    rejoin = data.get("rejoin") is True
    key = str(pid_int) if event == "speaker_confirmed" else "unknown"
    now = time.monotonic()
    last = sess.reacted_keys.get(key)
    if last is not None:
        # unknown 과 rejoin 은 "시간이 지나면 다시" — 그 외 아는 얼굴은 통화당 1회.
        cooldown_only = key == "unknown" or rejoin
        suppressed = (now - last < REACT_COOLDOWN_S) if cooldown_only else True
        if suppressed:
            if _face_diag_on():
                log.info(
                    "face_diag cooldown session=%s person=%s rejoin=%s suppressed=1",
                    getattr(sess, "session_id", "?"), pid_int, int(rejoin),
                )
            return  # 아는 얼굴=통화당 1회(rejoin 이면 60s 쿨다운), unknown=60s 쿨다운
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
    """
    import json as _json

    def _on_msg(msg):
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
        # [Remember Me 2026-08-12] "내 이름 기억해줘" 류 발화 → RN 에 시트를 열라고 통보.
        #
        # 아래 enroll_suggest 분기들과 독립이다(elif 체인에 넣지 않는다) — 저쪽은 이름을
        # LLM 으로 추출해 카드에 채우는 경로이고, 이쪽은 **이름을 만들지 않는다**.
        # payload 에 이름 자리가 아예 없는 것이 계약이다. 사용자가 시트에 직접 입력한다.
        # 잘못 발동해도 시트가 한 번 열릴 뿐이라 fail-open 으로 둔다.
        if mtype == "say" and channel is not None:
            try:
                from remember_me_intent import wants_remember_me
                if wants_remember_me(text) and getattr(channel, "readyState", None) == "open":
                    channel.send(_json.dumps({"type": "remember_me", "reason": "asked"}))
            except Exception as exc:
                log.warning("session %s remember_me signal failed: %s",
                            getattr(sess, "session_id", "?"), exc)

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
                        )
                    elif mode == "greet":
                        # greet: 사용자 발화 없으므로 filler 미사용(on_response_ready=None)
                        await sess.pipeline.greet(
                            turn=turn, on_first_audio=_emit_speech_start,
                            on_sentence=_emit_speech_text,
                        )
                    else:
                        await sess.pipeline.say(
                            text, turn=turn,
                            on_first_audio=_emit_speech_start,
                            on_response_ready=_response_hook,
                            on_sentence=_emit_speech_text,
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
                # 대화 원문 기록 + Phase B 자동학습. 둘 다 say 턴에서만, 둘 다
                # fire-and-forget(통화 무영향)이지만 서로 독립이다 — 아래 순서·조건이
                # 얽히면 안 된다.
                if mode == "say":
                    _clone_reply = "".join(getattr(turn, "_tokens", [])) if turn is not None else ""

                    # [T-067 Task 12] 화자 확정 상태. 기록(turn_writeback)과 학습
                    # (learn_writeback)이 **같은 시점의 화자**를 봐야 하므로 여기서 한 번만
                    # 읽는다. 예전엔 학습 직전에만 읽어서, 기록에는 화자가 아예 실리지 않았다
                    # (call_turns.speaker_person_id 462턴 전량 NULL). 둘이 서로 다른 값을 보면
                    # "L2'는 A 에게 학습됐는데 원문은 B 가 말한 것"이라는 대조 불가능한 기록이
                    # 남는다. 아래 두 ensure_future 는 인자로 값을 캡처하므로 시점이 고정된다.
                    _speaker = getattr(sess, "current_speaker", None)
                    _person_id = _speaker[0] if _speaker else None

                    # [T-252 Task14] call_turns 기록. 학습(아래)과 달리 어떤 게이트도 없다 —
                    # PRETHIRD_LEARN_ENABLED 가 꺼져 있든 사용자가 학습에 동의하지 않았든
                    # 통화 원문은 남긴다(통화 내역 화면·감사의 유일한 출처). 학습보다 먼저
                    # 스케줄하되, ensure_future 라 학습을 지연시키지 않는다.
                    # call_id 는 별도 값이 아니라 prethird session_id 그대로다 —
                    # call_lifecycle.call_start 가 sessionId 를 그대로 call_sessions.call_id 로
                    # INSERT 한다(afterlifeapi calls.ts prethird-start).
                    try:
                        from turn_writeback import turn_writeback
                        _sid = getattr(sess, "session_id", None)
                        asyncio.ensure_future(turn_writeback(
                            _sid, text, _clone_reply,
                            # seq 는 RN 이 통화 안에서 턴마다 부여한 값이라 재진입 방어 키로 충분.
                            # 없으면(None) 중복검사 없이 그대로 기록한다.
                            dedupe_key=f"{_sid}:{seq}" if seq is not None else None,
                            # 화자 미확정이면 None — 기록은 익명으로 남는다(기록 자체는 항상 나간다).
                            speaker_person_id=_person_id,
                        ))
                    except Exception as exc:
                        # import 실패 등도 통화·학습에 절대 영향 주지 않는다.
                        log.warning("session %s turn writeback schedule failed: %s",
                                    getattr(sess, "session_id", "?"), exc)

                    # [T-067 Task 12] current_speaker(화자 확정 상태) 있으면 화자별 L2'로 라우팅,
                    # 없으면 기존 사용자별 L2 그대로(learn_writeback 내부 person_id 분기).
                    # _person_id 는 위에서 기록과 공유하는 값 — 여기서 다시 읽지 않는다.
                    from learn_writeback import learn_writeback
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
                    # T-252: 화자 교대 시 프롬프트를 통째로 재조립하기 위해 원본을 보관한다.
                    sess.bundle = bundle
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
                    # [T-252 Task 9] filler player · 크레딧 가드 · 상태 4 타이머 정리.
                    # pc.close() 이전에 수행 — 세션 자원 정리 순서 일관성 유지.
                    # (인라인이던 것을 헬퍼로 추출: 테스트가 직접 호출해 실동작 검증)
                    _cleanup_session_resources(sess)
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
        # 라이브에만 있던 것을 역흡수(2026-08-13). verify 랩의 TTS 미리듣기 라우트.
        from tts_preview_endpoint import register_tts_preview_routes
        register_tts_preview_routes(app)
        # 2차 역흡수(2026-08-13) — 1차 때 preview 만 가져오고 아래 둘을 놓쳤다.
        # 배포로 덮으면 라이브의 TTS 어드민·녹취 조회 라우트가 조용히 사라진다.
        #
        # 🔴 두 모듈은 **라이브에만 있고 repo 에는 없다**(서버에서 직접 만들어진 파일).
        # 무조건 import 하면 repo·CI 에서 ImportError 로 죽는다 — 실제로 그렇게 만들었다가
        # prethird 테스트 실패가 31→46 으로 늘었다. 모듈을 repo 로 가져오는 것이 정석이지만
        # 그것은 별개 작업이므로, 여기서는 있으면 등록하고 없으면 조용히 건너뛴다.
        try:
            from tts_admin_endpoint import register_tts_admin_routes
            register_tts_admin_routes(app)
        except ImportError:
            log.info("tts_admin_endpoint 없음 — 등록 건너뜀(라이브 전용 모듈)")
        try:
            from admin_records_endpoint import register_admin_records_routes
            register_admin_records_routes(app)
        except ImportError:
            log.info("admin_records_endpoint 없음 — 등록 건너뜀(라이브 전용 모듈)")

    # T-117 학습하기 답변 해석 endpoint — Cloudflare Workers 만 호출 (X-Internal-Secret 방어).
    # 등록 flag 없이 항상 켬. auth 는 endpoint 내부에서 처리.
    from knowledge_interpret_endpoint import register_knowledge_interpret_routes
    register_knowledge_interpret_routes(app)
    from knowledge_followup_endpoint import register_knowledge_followup_routes
    register_knowledge_followup_routes(app)

    return app
