"""test_speaker_identity_say.py — T-135 v2: identity 소스는 face_event(생체검증)
단일 경로. say payload는 identity를 절대 확정하지 않는다(v1 "say-only 확정 경로"는
폐기 — CRITICAL(IDOR) 게이트 반영).

signaling.py 대상:
- say(_on_msg)가 personId/speakerName을 더 이상 읽지 않는다(회귀 확인).
- _sanitize_display_name — displayName 길이/제어문자/제로폭 검증(mizu HIGH1).

[T-252] 옛 L2' 힌트 조립 함수(name falsy 방어)는 삭제됐고, 그 전용 검증은
tests/test_l2p_hint.py로 이관됐다(재조립 bundle_to_messages 기준으로 갱신).
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio
import json
import pytest
from signaling import (  # noqa: E402
    _make_dc_handler, _sanitize_display_name,
    _clear_current_speaker, _maybe_swap_l2p,
    _arm_unconfirmed_timer, _cancel_unconfirmed_timer, _unconfirmed_timeout,
    _cleanup_session_resources, _UNCONFIRMED_MAX_RETRY,
    _handle_face_event,
)
from clone_dialog import bundle_to_messages  # noqa: E402

# T-252: _clear_current_speaker/_maybe_swap_l2p 가 재조립할 원본 번들.
# [T-252 fix / el 지적] persona 에 _OTHER_LABELS 키를 채워야 "상대 정보" 관련
# 단언이 공허 통과하지 않는다.
_BUNDLE = {
    "personaBundle": {
        "cloneId": "9201",
        "persona": {
            "displayName": "코조",
            "tone": "친근함",
            "relation": "친구",
            "memories_personal": ["어제 등산을 갔다"],
        },
        "viewer": {"displayName": "지호"},
    }
}


class _Channel:
    def __init__(self):
        self.readyState = "open"
        self.sent = []
    def send(self, s): self.sent.append(json.loads(s))


class _Pipeline:
    def __init__(self, persona_messages=None):
        self.persona_messages = persona_messages or [{"role": "system", "content": "base persona"}]
        self.update_calls = []
        self.say_calls = []
    def update_persona(self, messages):
        self.update_calls.append(list(messages))
        self.persona_messages = list(messages)
    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        self.say_calls.append(text)
        if on_first_audio:
            on_first_audio()


class _Sess:
    def __init__(self, clone_id=9201):
        self.pipeline = _Pipeline()
        self.session_id = "s1"
        self.clone_id = clone_id
        self.se_path = None
        self.offer_time = None
        self.recorder = None
        self.state = None
        self.reacted_keys = {}
        self.pending_enroll = False
        self.current_speaker = None
        self.pending_react = None
        self.bundle = dict(_BUNDLE)  # T-252: 재조립 원본. offer 시 signaling.py가 대입하는 값.
        self.user_id = None
        self.name_extract_sent = set()
        self.prompt_unconfirmed = False
        self.speaker_epoch = 0
        self.unconfirmed_timer = None  # T-252 Task 8: 상태 4 수명 타이머 핸들
        self.unconfirmed_retry = 0     # T-252 Task 9: 복귀 실패 재시도 횟수
        self.filler_player = None      # F7: 종료 cleanup 대상
        self.credit_guard = None       # T-167: 종료 cleanup 대상
    def set_state(self, s): self.state = s


def _run_handler(sess, channel, msg):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel)
        handler(json.dumps(msg))
        loop.run_until_complete(asyncio.sleep(0))
        pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
        if pending:
            loop.run_until_complete(asyncio.gather(*pending))
    finally:
        asyncio.set_event_loop(None)
        loop.close()


# ---------------------------------------------------------------------------
# say는 personId/speakerName을 절대 읽지 않는다(v1 롤백 확인)
# ---------------------------------------------------------------------------

def test_say_ignores_person_id_and_speaker_name(monkeypatch):
    """[T-135 v2] say payload에 personId/speakerName이 실려와도 완전히 무시된다 —
    identity 소스는 face_event 단일 경로. current_speaker 불변, persona 재주입 없음."""
    monkeypatch.delenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", raising=False)  # 기본 on이어도 무관
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "say", "text": "안녕", "seq": 1, "personId": 3, "speakerName": "민지",
    })
    assert sess.current_speaker is None
    assert sess.pipeline.update_calls == []
    assert sess.pipeline.say_calls == ["안녕"]


def test_say_ignores_person_id_even_with_existing_current_speaker(monkeypatch):
    """face_event로 이미 확정된 current_speaker가 있어도, say payload의 다른
    personId가 이를 바꾸지 못한다 — face_event만이 유일한 확정/해제 경로."""
    monkeypatch.delenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", raising=False)
    sess, ch = _Sess(), _Channel()
    sess.current_speaker = (3, "민지")
    _run_handler(sess, ch, {
        "type": "say", "text": "안녕", "seq": 1, "personId": 5, "speakerName": "철수",
    })
    assert sess.current_speaker == (3, "민지")  # face_event가 확정한 값 그대로
    assert sess.pipeline.update_calls == []


def test_say_ignores_person_id_when_identity_gate_off(monkeypatch):
    monkeypatch.setenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", "0")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "say", "text": "안녕", "seq": 1, "personId": 3, "speakerName": "민지",
    })
    assert sess.current_speaker is None
    assert sess.pipeline.update_calls == []


# ---------------------------------------------------------------------------
# _sanitize_display_name — mizu HIGH1 (afterlifeapi assertValidDisplayName 동등)
# ---------------------------------------------------------------------------

def test_sanitize_display_name_valid():
    assert _sanitize_display_name("민지") == "민지"


def test_sanitize_display_name_trims_whitespace():
    assert _sanitize_display_name("  민지  ") == "민지"


def test_sanitize_display_name_none_or_non_string():
    assert _sanitize_display_name(None) is None
    assert _sanitize_display_name(123) is None
    assert _sanitize_display_name(["민지"]) is None


def test_sanitize_display_name_empty_or_whitespace_only():
    assert _sanitize_display_name("") is None
    assert _sanitize_display_name("   ") is None


def test_sanitize_display_name_too_long():
    assert _sanitize_display_name("가" * 31) is None
    assert _sanitize_display_name("가" * 30) == "가" * 30  # 경계값(30자)은 허용


def test_sanitize_display_name_control_char_rejected():
    assert _sanitize_display_name("민\n지") is None
    assert _sanitize_display_name("민\x00지") is None
    assert _sanitize_display_name("민\x7f지") is None


def test_sanitize_display_name_zero_width_rejected():
    assert _sanitize_display_name("민지​") is None  # zero-width space
    assert _sanitize_display_name("민지‮") is None  # bidi override
    assert _sanitize_display_name("민지﻿") is None  # BOM/zero-width no-break space


# ---------------------------------------------------------------------------
# 통합: face_event의 malformed displayName은 이름 없이 화자만 확정된다
# ---------------------------------------------------------------------------

def test_face_event_malformed_display_name_degrades_to_none(monkeypatch):
    monkeypatch.delenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", raising=False)
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지\x00<script>", "seq": 1,
    })
    assert sess.current_speaker == (3, None)  # personId는 신뢰, 이름만 강등


# ---------------------------------------------------------------------------
# [sion MINOR #1] _clear_current_speaker — persona 동기 리셋 직접 검증
# (기존 test_face_react.py의 confirmed→unknown→confirmed 통합테스트는 current_speaker
# 전이만 간접 확인 — 여기서는 update_persona 호출/내용을 직접 단언한다.)
# ---------------------------------------------------------------------------

def test_clear_current_speaker_falls_back_to_l2_when_bundle_present():
    """[T-252] sess.bundle이 있으면 update_persona(기본 상대 폴백)로 동기 리셋 —
    직전 화자의 이름/L2' 힌트가 다음 턴 프롬프트에 잔류하지 않는다. 예전엔 상대
    정보를 통째로 지웠지만(익명 리셋), 지금은 기본 상대(L2)로 폴백하되 이름
    호칭만 억제한다(unknown_face는 "낯선 사람"이 아니라 "미확정 상태")."""
    sess = _Sess()
    sess.current_speaker = (3, "민지")

    _clear_current_speaker(sess, "unknown_face")

    assert sess.current_speaker is None
    expected = bundle_to_messages(sess.bundle, speaker={"unconfirmed": True})
    assert sess.pipeline.update_calls == [expected]
    assert sess.pipeline.persona_messages == expected
    # [T-252] 실제로 pipeline에 전달된 인자를 검사한다 — expected와의 항등 단언은
    # 위에서 이미 확인했으므로, 여기서는 update_persona 호출부의 실제 content에
    # 직전 화자 이름이 새지 않는지를 직접 본다(미러 단언만으로는 포맷 회귀를 못 잡음).
    assert "민지" not in sess.pipeline.update_calls[0][0]["content"]  # 이름 호칭 억제


def test_clear_current_speaker_noop_reset_when_bundle_absent():
    """[T-252] sess.bundle이 없으면(재연결 등, 재조립할 원본이 없음) update_persona를
    호출하지 않는다 — bundle_to_messages(None)은 []을 반환하므로 그대로 update하면
    페르소나 전체가 소실된다. current_speaker 해제만 일어난다."""
    sess = _Sess()
    sess.current_speaker = (3, "민지")
    sess.bundle = None

    _clear_current_speaker(sess, "multi_face")

    assert sess.current_speaker is None
    assert sess.pipeline.update_calls == []


def test_clear_current_speaker_강등은_confirmed_이력이_없어도_일어난다():
    """[T-252 fix / mizu H-1 · el B-2] 확정된 화자가 한 번도 없었어도(current_speaker
    가 이미 None) 프롬프트는 상태 4로 강등돼야 한다.

    clone_person_faces 0행이라 /oth-path 는 절대 매칭되지 않는다 →
    speaker_confirmed 가 오지 않는다 → 구 코드의 `if current_speaker is None: return`
    가 함수 전체를 막아 상태 4가 100% 발생하지 않았다. 그 결과 카메라 앞 제3자를
    계정주 이름으로 부르고 계정주 L2를 그 사람 것으로 읊었다."""
    sess = _Sess()
    sess.current_speaker = None

    _clear_current_speaker(sess, "unknown_face")

    assert sess.current_speaker is None
    expected = bundle_to_messages(sess.bundle, speaker={"unconfirmed": True})
    assert sess.pipeline.update_calls == [expected]
    content = sess.pipeline.update_calls[0][0]["content"]
    assert "지호" not in content          # viewer(계정주) 이름 호칭 억제
    assert "확정하지 못했다" in content
    assert sess.prompt_unconfirmed is True


def test_clear_current_speaker_연속_unknown은_한_번만_재조립한다():
    """중복 강등 방지 플래그 — 같은 통화에서 이미 상태 4면 스킵(사람 결정 2)."""
    sess = _Sess()
    sess.current_speaker = (3, "민지")

    _clear_current_speaker(sess, "unknown_face")
    _clear_current_speaker(sess, "unknown_face")
    _clear_current_speaker(sess, "multi_face")

    assert len(sess.pipeline.update_calls) == 1


def test_speaker_confirmed_후_다시_unknown이면_또_강등된다(monkeypatch):
    """플래그를 speaker_confirmed 에서 리셋하지 않으면 두 번째 unknown_face 가
    조용히 스킵되어 상태 4로 못 돌아간다."""
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")
    monkeypatch.setenv("LEARN_SECRET", "s")
    import l2p_client

    async def _fake_fetch(clone_id, person_id):
        return None
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch)

    sess, ch = _Sess(), _Channel()
    _clear_current_speaker(sess, "unknown_face")          # 1회차 강등
    assert sess.prompt_unconfirmed is True

    _run_handler(sess, ch, {                              # 화자 확정 → 플래그 리셋
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 1,
    })
    assert sess.prompt_unconfirmed is False

    _clear_current_speaker(sess, "unknown_face")          # 2회차 강등도 일어나야 한다
    assert sess.prompt_unconfirmed is True
    assert "민지" not in sess.pipeline.update_calls[-1][0]["content"]


# ---------------------------------------------------------------------------
# [sion MINOR #2] async race — clear 이후 늦게 도착한 _maybe_swap_l2p가 stale
# 가드로 드랍되어 persona를 오염시키지 않는지 명시 검증.
# ---------------------------------------------------------------------------

def test_maybe_swap_l2p_dropped_as_stale_after_clear_mid_flight(monkeypatch):
    """[T-135 v2 async race] speaker_confirmed로 _maybe_swap_l2p가 스케줄된 직후(아직
    fetch_l2p 응답 대기 중) unknown_face가 도착해 _clear_current_speaker로 화자를
    해제하면 — 늦게 응답이 도착해도(current_speaker[0] != pid, 심지어 None) stale
    가드가 드랍해 persona가 오염된 데이터(L2' 관계기억)로 되돌아가지 않는다.

    [T-252 fix] 센티넬은 픽스처 persona(계정주 L2)에 없는 값이어야 한다 — 겹치면
    상태 4 폴백이 정상 렌더한 계정주 값을 오염으로 오판한다."""
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")
    monkeypatch.setenv("LEARN_SECRET", "s")
    import l2p_client

    gate = asyncio.Event()

    async def _slow_fetch(clone_id, person_id):
        await gate.wait()  # face_event 유실/경합 시뮬 — 응답이 늦게 도착
        return {"relation": "낚시 동료"}
    monkeypatch.setattr(l2p_client, "fetch_l2p", _slow_fetch)

    sess = _Sess()
    sess.current_speaker = (3, "민지")

    async def _scenario():
        task = asyncio.ensure_future(_maybe_swap_l2p(sess, 3, "민지"))
        await asyncio.sleep(0)  # _maybe_swap_l2p가 fetch_l2p 내부 await(gate.wait())까지 진행

        # unknown_face 도착 — in-flight fetch가 아직 끝나지 않은 상태에서 화자 해제.
        _clear_current_speaker(sess, "unknown_face")
        assert sess.current_speaker is None
        # 해제 시점에 이미 기본 상대 폴백으로 동기 리셋됐다(1번째 update_calls).
        expected_fallback = bundle_to_messages(sess.bundle, speaker={"unconfirmed": True})
        assert sess.pipeline.update_calls[-1] == expected_fallback

        gate.set()  # 늦은 fetch 응답 방출 — _maybe_swap_l2p의 stale 가드가 이를 드랍해야 함
        await task

    asyncio.run(_scenario())

    assert sess.current_speaker is None
    # stale swap이 드랍됐으므로 update_persona는 _clear_current_speaker가 만든
    # 폴백 리셋 1건뿐 — L2' 관계기억("낚시 동료")으로 오염되지 않는다.
    assert len(sess.pipeline.update_calls) == 1
    assert not any("낚시 동료" in str(c) for c in sess.pipeline.update_calls)


# ---------------------------------------------------------------------------
# [T-252 Task 8] 상태 4 수명 타이머 — 10초 뒤 상태 1 복귀 (4 ↔ 1 반복)
#
# 왜 필요한가: 상태 4 에서 나가는 간선이 speaker_confirmed 하나뿐인데,
# clone_person_faces 가 0행이면 /oth-path 가 구조적으로 매칭될 수 없어
# 그 이벤트가 영영 오지 않는다 → 얼굴이 카메라에 잡히는 순간부터 통화가 끝날
# 때까지 이름을 한 번도 못 부르는 고착. "벡터 0 이면 화자식별 off" 는 등록 요청
# (enroll_suggest)까지 막아 벡터가 영영 0 인 데드락이라 해법이 못 된다.
#
# 실제 10초를 기다리지 않도록 PRETHIRD_UNCONFIRMED_TTL_S 를 짧게 덮어쓴다
# (호출 시점 env 재평가라 monkeypatch.setenv 만으로 충분 — 모듈 reload 불필요).
# ---------------------------------------------------------------------------

_TTL = 0.05  # 테스트용 상태 4 수명(초)


@pytest.fixture
def short_ttl(monkeypatch):
    monkeypatch.setenv("PRETHIRD_UNCONFIRMED_TTL_S", str(_TTL))


def _state1_head(sess):
    """상태 1(기본 상대 · 이름 호칭 허용) 프롬프트의 머리말 둘째 줄."""
    return '지금 너와 통화 중인 상대는 "지호" 이다.'


async def test_상태4는_타임아웃_뒤_상태1로_복귀한다(short_ttl):
    """강등 후 TTL 이 지나면 update_persona 가 상태 1 프롬프트로 다시 불린다.

    미러 단언(bundle_to_messages 재계산과의 등호)만 두면 포맷 회귀를 못 잡으므로
    상태 1 머리말 문자열을 직접 단언한다 — 상태 4 문안("확정하지 못했다")과
    이름 호칭 허용 여부가 실제로 뒤바뀌었는지가 이 기능의 전부다."""
    sess = _Sess()

    _clear_current_speaker(sess, "unknown_face")
    assert sess.prompt_unconfirmed is True
    assert len(sess.pipeline.update_calls) == 1
    s4 = sess.pipeline.update_calls[0][0]["content"]
    assert "확정하지 못했다" in s4 and "지호" not in s4   # 상태 4: 이름 억제

    await asyncio.sleep(_TTL * 4)

    assert len(sess.pipeline.update_calls) == 2, "타이머가 상태 1 복귀를 수행하지 않았다"
    s1 = sess.pipeline.update_calls[1][0]["content"]
    assert _state1_head(sess) in s1                       # 상태 1: 이름 호칭 부활
    assert "확정하지 못했다" not in s1
    assert sess.pipeline.update_calls[1] == bundle_to_messages(sess.bundle)
    # current_speaker 는 건드리지 않는다 — 여전히 화자 미확정이므로 학습 귀속은 익명 유지.
    assert sess.current_speaker is None
    assert sess.unconfirmed_timer is None


async def test_타임아웃_뒤_플래그가_풀려_다시_강등된다(short_ttl):
    """prompt_unconfirmed 를 안 내리면 다음 unknown_face 가 조용히 스킵되어
    상태 4 로 못 돌아간다 — 4 ↔ 1 반복이 성립하지 않는다."""
    sess = _Sess()

    _clear_current_speaker(sess, "unknown_face")
    await asyncio.sleep(_TTL * 4)
    assert sess.prompt_unconfirmed is False, "복귀 후 플래그가 풀리지 않았다"

    _clear_current_speaker(sess, "unknown_face")           # 재강등
    assert sess.prompt_unconfirmed is True
    assert len(sess.pipeline.update_calls) == 3
    assert "확정하지 못했다" in sess.pipeline.update_calls[2][0]["content"]

    await asyncio.sleep(_TTL * 4)                          # 두 번째 복귀도 일어난다
    assert len(sess.pipeline.update_calls) == 4
    assert _state1_head(sess) in sess.pipeline.update_calls[3][0]["content"]


async def test_타임아웃_전_speaker_confirmed면_타이머가_취소되고_상태2다(short_ttl, monkeypatch):
    """확정 화자가 오면 상태 2 가 최종 상태여야 한다. 타이머가 살아 있으면
    TTL 뒤에 상태 1 이 방금 확정한 화자를 덮어쓴다."""
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")
    monkeypatch.setenv("LEARN_SECRET", "s")
    import l2p_client

    async def _fake_fetch(clone_id, person_id):
        return {"relation": "낚시 동료"}
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch)

    sess = _Sess()
    _clear_current_speaker(sess, "unknown_face")
    assert sess.unconfirmed_timer is not None

    _handle_face_event(sess, {
        "event": "speaker_confirmed", "personId": 3, "displayName": "민지",
    })
    assert sess.unconfirmed_timer is None, "확정 후에도 타이머가 남아 있다"
    assert sess.prompt_unconfirmed is False

    await asyncio.sleep(_TTL * 4)                # 스왑 완료 + TTL 경과

    last = sess.pipeline.update_calls[-1][0]["content"]
    assert '지금 너와 통화 중인 상대는 "민지" 이다.' in last, "상태 1 이 상태 2 를 덮어썼다"
    assert "확정하지 못했다" not in last
    assert sess.current_speaker == (3, "민지")


async def test_연속_unknown_face는_타이머를_연장하지_않는다(short_ttl):
    """연장하면 얼굴이 계속 잡히는 동안 만료가 무한히 밀려 — 고착이 발생하는 바로
    그 상황에서 — 장치가 통째로 무력해진다. 무장은 강등 1회당 1개다."""
    sess = _Sess()

    _clear_current_speaker(sess, "unknown_face")
    handle, when = sess.unconfirmed_timer, sess.unconfirmed_timer.when()

    await asyncio.sleep(_TTL * 0.5)
    _clear_current_speaker(sess, "unknown_face")   # 중복 강등(플래그 가드)
    _clear_current_speaker(sess, "multi_face")
    _arm_unconfirmed_timer(sess)                   # 무장 함수 자체의 재무장 금지 가드
    assert sess.unconfirmed_timer is handle, "타이머가 교체됐다(재무장)"
    assert sess.unconfirmed_timer.when() == when, "만료 시각이 밀렸다(연장)"

    await asyncio.sleep(_TTL * 4)
    assert len(sess.pipeline.update_calls) == 2    # 강등 1 + 복귀 1
    assert _state1_head(sess) in sess.pipeline.update_calls[1][0]["content"]


async def test_bundle이_없으면_타이머_콜백은_update_persona를_부르지_않는다():
    """페르소나 전소 가드(입력) — bundle_to_messages(None) 은 [] 를 반환하는데
    그대로 update 하면 안전 규칙·성격·기억이 통째로 사라진다."""
    sess = _Sess()
    sess.prompt_unconfirmed = True
    sess.bundle = None

    _unconfirmed_timeout(sess)

    assert sess.pipeline.update_calls == []
    assert sess.prompt_unconfirmed is True         # 상태를 바꾸지 않았다


async def test_재조립_결과가_비면_타이머_콜백은_프롬프트를_유지한다():
    """페르소나 전소 가드(출력) — truthy bundle 로도 재조립 결과가 [] 가 될 수 있다."""
    sess = _Sess()
    sess.prompt_unconfirmed = True
    sess.bundle = {"personaBundle": {"cloneId": "9201"}}   # 렌더할 필드가 없다
    assert bundle_to_messages(sess.bundle) == []           # 픽스처 전제 확인

    _unconfirmed_timeout(sess)

    assert sess.pipeline.update_calls == []
    assert sess.prompt_unconfirmed is True


async def test_상태4가_아니면_타이머_콜백은_드랍된다():
    """stale 가드 — 취소가 무효화된 채 콜백이 실행돼도(루프가 이미 꺼낸 뒤 cancel)
    이미 상태 4 를 벗어났으면 아무것도 되돌리지 않는다."""
    sess = _Sess()
    sess.prompt_unconfirmed = False

    _unconfirmed_timeout(sess)

    assert sess.pipeline.update_calls == []


async def test_타이머_콜백은_epoch를_올려_in_flight_스왑을_무효화한다(short_ttl):
    """복귀도 화자 상태 전이다 — 세대를 올리지 않으면 늦게 끝난 _maybe_swap_l2p 가
    epoch 가드를 통과해 방금 되돌린 상태 1 을 덮어쓴다."""
    sess = _Sess()
    _clear_current_speaker(sess, "unknown_face")
    before = sess.speaker_epoch

    await asyncio.sleep(_TTL * 4)

    assert sess.speaker_epoch > before


async def test_취소된_타이머는_발화하지_않는다(short_ttl):
    """통화 종료(cleanup) 경로가 쓰는 취소 헬퍼 — 종료된 세션의 pipeline 을
    건드리면 안 된다. 타이머가 없는 세션에서 불려도 안전해야 한다."""
    sess = _Sess()
    _cancel_unconfirmed_timer(sess)                # 타이머 없음 — no-op
    _clear_current_speaker(sess, "unknown_face")
    assert sess.unconfirmed_timer is not None

    _cancel_unconfirmed_timer(sess)
    assert sess.unconfirmed_timer is None

    await asyncio.sleep(_TTL * 4)
    assert len(sess.pipeline.update_calls) == 1    # 강등 1건뿐, 복귀 없음


class _FakeFiller:
    def __init__(self):
        self.closed = False
    def close(self):
        self.closed = True


class _FakeGuard:
    def __init__(self):
        self.cancelled = False
    def cancel(self):
        self.cancelled = True


async def test_통화_종료_cleanup이_상태4_타이머를_실제로_취소한다(short_ttl):
    """[T-252 Task 9] 종전 이 테스트는 `inspect.getsource` 문자열 포함 여부만 봐서
    호출을 `connected` 분기로 옮겨도 그대로 통과했다(리뷰어 실측). 정리 블록을
    `_cleanup_session_resources` 헬퍼로 뽑았으므로 직접 불러 실동작을 검증한다 —
    취소가 안 되면 죽은 세션의 pipeline.update_persona 를 타이머가 뒤늦게 건드린다."""
    sess = _Sess()
    _clear_current_speaker(sess, "unknown_face")
    assert sess.unconfirmed_timer is not None

    _cleanup_session_resources(sess)

    assert sess.unconfirmed_timer is None
    await asyncio.sleep(_TTL * 4)
    assert len(sess.pipeline.update_calls) == 1, "종료된 세션에서 복귀가 발화했다"
    assert sess.prompt_unconfirmed is True


def test_정리_헬퍼는_filler와_크레딧가드도_함께_해제한다():
    """헬퍼로 추출하면서 기존 정리 항목이 빠지지 않았는지 — 각각 실제 호출을 단언."""
    sess = _Sess()
    filler, guard = _FakeFiller(), _FakeGuard()
    sess.filler_player, sess.credit_guard = filler, guard

    _cleanup_session_resources(sess)

    assert filler.closed is True and sess.filler_player is None
    assert guard.cancelled is True and sess.credit_guard is None


def test_정리_헬퍼는_아무것도_없는_세션에서도_안전하다():
    """greet 이전 종료·재연결 실패 등 자원이 하나도 안 붙은 세션."""
    sess = _Sess()
    _cleanup_session_resources(sess)   # 예외 없이 통과해야 한다
    assert sess.unconfirmed_timer is None


def test_정리_헬퍼는_종료분기에서_pc_close_이전에_불린다():
    """배선 위치 검증. 문자열 포함만 보면 호출을 `connected` 분기로 옮겨도 통과하므로
    **순서**를 단언한다 — 종료 분기 시작 < 정리 호출 < 그 분기의 `await pc.close()`.
    (그 핸들러는 실제 RTCPeerConnection 없이 호출할 seam 이 없어 소스로 본다)"""
    import inspect
    import signaling
    src = inspect.getsource(signaling.make_app)
    i_branch = src.index('pc.connectionState in ("failed", "closed", "disconnected")')
    i_cleanup = src.index("_cleanup_session_resources(sess)")
    i_close = src.index("await pc.close()", i_branch)
    assert i_branch < i_cleanup < i_close, (
        "정리 호출이 종료 분기 안, pc.close() 앞에 있어야 한다"
    )


# ---------------------------------------------------------------------------
# [T-252 Task 9] 복귀 실패(예외) 시 고착으로 돌아가지 않는다
#
# 타이머 콜백에서 update_persona 가 예외를 던지면 `prompt_unconfirmed` 는 True 인 채
# `unconfirmed_timer` 만 None 이 된다. 그러면 이후 unknown_face 는 _clear_current_speaker
# 의 중복 강등 가드에 걸려 재무장조차 되지 않아, 상태 4 가 통화 끝까지 고착으로 복귀한다
# — 이 타이머가 없애려던 바로 그 증상이다.
# ---------------------------------------------------------------------------

class _FlakyPipeline(_Pipeline):
    """지정한 순번의 update_persona 호출만 예외를 던진다.

    1번째 호출 = `_clear_current_speaker` 의 상태 4 강등(성공해야 타이머가 걸린다),
    2번째부터 = 타이머 콜백의 상태 1 복귀."""
    def __init__(self, fail_on=(2,), fail_all_after=None):
        super().__init__()
        self.attempts = 0
        self._fail_on = set(fail_on)
        self._fail_all_after = fail_all_after

    def update_persona(self, messages):
        self.attempts += 1
        if self.attempts in self._fail_on or (
            self._fail_all_after is not None and self.attempts >= self._fail_all_after
        ):
            raise RuntimeError("update_persona boom")
        super().update_persona(messages)


async def test_복귀가_예외로_실패하면_타이머를_재무장해_결국_복귀한다(short_ttl):
    """1차 복귀만 실패시킨다. 재무장이 없으면 update_calls 는 강등 1건에서 멈추고
    prompt_unconfirmed 가 True 로 남아 고착이 된다."""
    sess = _Sess()
    sess.pipeline = _FlakyPipeline(fail_on=(2,))

    _clear_current_speaker(sess, "unknown_face")
    assert sess.prompt_unconfirmed is True
    assert sess.unconfirmed_timer is not None

    await asyncio.sleep(_TTL * 8)

    assert sess.pipeline.attempts == 3, "복귀 재시도가 일어나지 않았다(1차 실패로 끝)"
    assert len(sess.pipeline.update_calls) == 2, "재시도 복귀가 실제로 적용되지 않았다"
    s1 = sess.pipeline.update_calls[1][0]["content"]
    assert _state1_head(sess) in s1              # 상태 1 로 실제 복귀
    assert "확정하지 못했다" not in s1
    assert sess.prompt_unconfirmed is False      # 다음 unknown_face 가 다시 강등할 수 있다
    assert sess.unconfirmed_timer is None
    assert sess.unconfirmed_retry == 1


async def test_복귀가_계속_실패해도_재시도는_상한에서_멈춘다(short_ttl):
    """update_persona 가 영구 고장인 세션이 TTL 마다 무한 재시도하지 않는다.
    포기해도 안전 측 실패다 — 상태 4 유지 = 이름을 부르지 않는 쪽."""
    sess = _Sess()
    sess.pipeline = _FlakyPipeline(fail_on=(), fail_all_after=2)

    _clear_current_speaker(sess, "unknown_face")

    await asyncio.sleep(_TTL * 12)

    # 강등 1회 + 복귀 시도 (1 + _UNCONFIRMED_MAX_RETRY) 회에서 멈춘다.
    assert sess.pipeline.attempts == 1 + 1 + _UNCONFIRMED_MAX_RETRY
    assert sess.unconfirmed_retry == _UNCONFIRMED_MAX_RETRY
    assert sess.unconfirmed_timer is None
    assert sess.prompt_unconfirmed is True        # 안전 측 실패(이름 억제 유지)
    assert len(sess.pipeline.update_calls) == 1   # 강등만 적용됨


async def test_새_강등은_복귀_재시도_예산을_새로_받는다(short_ttl):
    """앞선 강등에서 예산을 다 썼다고 이번 강등의 복구까지 막으면 안 된다."""
    sess = _Sess()
    sess.pipeline = _FlakyPipeline(fail_on=(2,))

    _clear_current_speaker(sess, "unknown_face")
    await asyncio.sleep(_TTL * 8)
    assert sess.unconfirmed_retry == 1 and sess.prompt_unconfirmed is False

    _clear_current_speaker(sess, "unknown_face")   # 2회차 강등

    assert sess.unconfirmed_retry == 0, "새 강등이 재시도 예산을 초기화하지 않았다"
    assert sess.unconfirmed_timer is not None


async def test_TTL이_0이면_타이머를_걸지_않는다(monkeypatch):
    """롤백 스위치 — 0 이하면 상태 4 를 무기한 유지하던 구 동작으로 되돌아간다."""
    monkeypatch.setenv("PRETHIRD_UNCONFIRMED_TTL_S", "0")
    sess = _Sess()

    _clear_current_speaker(sess, "unknown_face")

    assert sess.unconfirmed_timer is None
    await asyncio.sleep(0.05)
    assert len(sess.pipeline.update_calls) == 1     # 복귀 없음
    assert sess.prompt_unconfirmed is True
