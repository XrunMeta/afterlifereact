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
)
from clone_dialog import bundle_to_messages  # noqa: E402

# T-252: _clear_current_speaker/_maybe_swap_l2p 가 재조립할 원본 번들.
_BUNDLE = {
    "personaBundle": {
        "cloneId": "9201",
        "persona": {"displayName": "코조", "tone": "친근함"},
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
    가드가 드랍해 persona가 오염된 데이터(관계기억 "친구")로 되돌아가지 않는다."""
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")
    monkeypatch.setenv("LEARN_SECRET", "s")
    import l2p_client

    gate = asyncio.Event()

    async def _slow_fetch(clone_id, person_id):
        await gate.wait()  # face_event 유실/경합 시뮬 — 응답이 늦게 도착
        return {"relation": "친구"}
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
    # 폴백 리셋 1건뿐 — "친구" 관계기억으로 오염되지 않는다.
    assert len(sess.pipeline.update_calls) == 1
    assert not any("친구" in str(c) for c in sess.pipeline.update_calls)
