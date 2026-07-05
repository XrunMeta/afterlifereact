from __future__ import annotations
import asyncio, os, time, pathlib, logging, json
from typing import Callable, Optional
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from session import SessionManager
from clone_dialog import fetch_bundle, bundle_to_messages
from asset_fetch import fetch_to
from voice_fetch import ensure_voice_wav
from prebuild import prebuild_handler
from recorder import make_recorder
from idle_policy import clone_mp4_enabled

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
# fail-closed 안전장치: clone_id 지정 통화에서 bundle 조회 실패 시 halbae 폴백 차단.
# "0" 이면 기존 폴백 동작 유지(롤백 안전장치).
_STRICT_CLONE_BUNDLE = os.environ.get("PRETHIRD_STRICT_CLONE_BUNDLE", "1") == "1"
# [F7] filler 토글: PRETHIRD_FILLER=1 일 때만 다운로드·FillerPlayer 활성.
# 기본 off → 기존 idle 정지 루프 100% 동일(회귀 0). 테스트에서 monkeypatch 가능.
_FILLER_ENABLED = os.environ.get("PRETHIRD_FILLER", "0") == "1"
# [T-067] face_event 선제 발화 토글: 기본 off — off면 face_event 수신해도 완전 무동작
# (기존 say/speak/greet 경로 바이트 단위 동일, 회귀 0). 프로세스 시작 후에도 env 재평가.
_FACE_REACT_ENABLED_KEY = "PRETHIRD_FACE_REACT_ENABLED"
# 아는 얼굴(personId)=통화당 1회(영구), unknown/multi_face=이 초 동안 쿨다운.
REACT_COOLDOWN_S = float(os.environ.get("PRETHIRD_REACT_COOLDOWN_S", "60"))
# react가 다른 발화(say/speak/greet/react) 진행 중 도착하면 단일 pending 슬롯에 대기(latest-wins,
# 연쇄 큐 금지). 이 초를 넘겨 대기한 채로 드레인 시점이 오면 스테일 반응으로 간주해 드랍.
REACT_PENDING_WAIT_CAP_S = float(os.environ.get("PRETHIRD_REACT_PENDING_WAIT_S", "20"))
if not _STRICT_CLONE_BUNDLE:
    logging.getLogger("prethird.signaling").warning(
        "PRETHIRD_STRICT_CLONE_BUNDLE=0: 고인 신원 오표시 폴백 활성화 — 운영 배포 금지"
    )


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

        if l2p_data:
            hint = f"현재 화면의 화자: {name}. 이 사람과의 관계 기억: {_summarize_l2p_fields(l2p_data)}"
        else:
            hint = f"현재 화면의 화자: {name}"

        new_messages = sess.base_persona_messages + [{"role": "system", "content": hint}]
        update = getattr(pipeline, "update_persona", None)
        if callable(update):
            update(new_messages)
            if _face_diag_on():
                log.info(
                    "face_diag l2p_swapped session=%s person=%s",
                    getattr(sess, "session_id", "?"), pid,
                )
    except Exception as e:
        log.warning("session %s _maybe_swap_l2p failed: %s", getattr(sess, "session_id", "?"), e)


def _handle_face_event(sess, data: dict) -> None:
    """[T-067] datachannel face_event 메시지 처리.

    RN → `{"type":"face_event","event":"speaker_confirmed"|"unknown_face"|"multi_face",
    "personId":3,"displayName":"민지","seq":12}`.

    토글 `PRETHIRD_FACE_REACT_ENABLED`(기본 "0") off 면 완전 무동작 — say/speak/greet
    경로와 완전히 독립적이라 off 상태에서 기존 동작에 어떤 영향도 주지 않는다(회귀 0).
    쿨다운: 아는 얼굴(personId)=통화당 1회(영구), unknown/multi_face=REACT_COOLDOWN_S(60s).
    다른 발화가 진행 중이면(busy_lock) 겹쳐 push하지 않고 단일 pending 슬롯에 대기시켜
    발화 종료 후 재생한다(_drain_pending_react, 플랜 §6.2).

    Task 11(pending_enroll)은 이 함수 밖(say 처리부)에서 소비. Task 12(L2' 화자별
    persona 스왑)는 _maybe_swap_l2p — 화자가 바뀔 때(쿨다운과 무관) fire-and-forget으로
    스케줄되며 react(_run, 쿨다운 게이트 대상)와는 완전히 분리된 별도 태스크(§6.4).
    """
    if os.environ.get(_FACE_REACT_ENABLED_KEY, "0") != "1":
        return
    if sess.pipeline is None:
        return
    event = data.get("event")
    pid = data.get("personId")
    name = data.get("displayName")

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

    # [T-067 Task 12 / 스펙 §6.4] persona 스왑 트리거는 react 쿨다운과 완전히 무관 —
    # 화자가 실제로 바뀌었으면(현재 sess.current_speaker와 다른 personId) 쿨다운으로
    # react가 눌려도(복귀 화자 A→B→A 등) 매번 다시 트리거해야 persona가 최신 화자에
    # 고착되지 않는다. fire-and-forget(swap이 react를 절대 지연시키지 않음).
    if event == "speaker_confirmed":
        prev = sess.current_speaker
        if prev is None or prev[0] != pid_int:
            sess.current_speaker = (pid_int, name)
            if _face_diag_on():
                log.info(
                    "face_diag speaker session=%s person=%s swap_scheduled=1",
                    getattr(sess, "session_id", "?"), pid_int,
                )
            asyncio.ensure_future(_maybe_swap_l2p(sess, pid_int, name))

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


async def _send_enroll_suggest(sess, channel, text: str) -> None:
    """[T-067 Task 11] pending_enroll 상태에서 도착한 첫 say의 텍스트로 화자 본인 이름을
    추출해 RN 동의 카드에 프리필시킨다("저 딸 민지예요" → name="민지").

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
        try:
            channel.send(json.dumps({"type": "enroll_suggest", "name": name}))
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
        # [T-067 Task 11] 즉석등록: pending_enroll 상태의 첫 say에서만 1회 발화(플래그를
        # 즉시 내려 재진입 차단) — fire-and-forget이라 say 본 흐름은 지연되지 않는다.
        if mtype == "say" and getattr(sess, "pending_enroll", False):
            sess.pending_enroll = False
            asyncio.ensure_future(_send_enroll_suggest(sess, channel, text))
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

        async def _run(mode=mtype, text=text, seq=seq, turn=turn):
            _se_present = bool(getattr(sess, "se_path", None))
            _offer_t = getattr(sess, "offer_time", None)
            _t0 = time.time()

            # [F7] filler 배선: PRETHIRD_FILLER on + filler_player 있을 때만.
            # off 경로 → _filler=None → 이하 모든 filler 코드 무동작(회귀 0).
            _filler = getattr(sess, "filler_player", None) if _FILLER_ENABLED else None

            # 발화종료 gate: say/speak(사용자 발화) 수신 → FillerPlayer 시작.
            # greet는 클론 선인사 — 사용자 발화가 아니므로 filler 재생 불필요.
            if mode in ("say", "speak") and _filler is not None:
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
                        )
                    elif mode == "greet":
                        # greet: 사용자 발화 없으므로 filler 미사용(on_response_ready=None)
                        await sess.pipeline.greet(turn=turn, on_first_audio=_emit_speech_start)
                    else:
                        await sess.pipeline.say(
                            text, turn=turn,
                            on_first_audio=_emit_speech_start,
                            on_response_ready=_response_hook,
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
                        channel.send(_json.dumps({"type": "speech_end", "seq": seq}))
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
                        await call_start(
                            os.environ.get("PRETHIRD_API_BASE"),
                            sess.clone_id, sess.session_id, access_token,
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
                                """단일 filler mp4 다운로드. 존재 시 skip(fetch_to 패턴). 실패는 None 반환."""
                                dest = f"{_filler_root}/{clone_id}-filler-{idx}.mp4"
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

    return app
