import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio
import json
import time
import pytest
from signaling import _make_dc_handler  # noqa: E402
import signaling  # noqa: E402 — 모듈 상수(REACT_PENDING_WAIT_CAP_S 등) monkeypatch 용


class _Channel:
    def __init__(self):
        self.readyState = "open"
        self.sent = []
    def send(self, s): self.sent.append(json.loads(s))


class _Pipeline:
    def __init__(self):
        self.greet_calls = 0
        self.say_calls = []
        self.speak_calls = []
        self.react_calls = []
    async def greet(self, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        self.greet_calls += 1
        if on_first_audio:
            on_first_audio()
    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        self.say_calls.append(text)
        if on_first_audio:
            on_first_audio()
    async def speak(self, text, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        self.speak_calls.append(text)
        if on_first_audio:
            on_first_audio()
    async def react(self, kind, display_name=None, turn=None, on_first_audio=None):
        self.react_calls.append((kind, display_name))


class _GatedPipeline(_Pipeline):
    """say()가 say_gate(asyncio.Event)가 set 될 때까지 반환하지 않음 — 발화 지속 시뮬용."""
    def __init__(self):
        super().__init__()
        self.say_gate = asyncio.Event()
    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        self.say_calls.append(text)
        if on_first_audio:
            on_first_audio()
        await self.say_gate.wait()


class _BoomPipeline(_Pipeline):
    """react()가 항상 예외를 던짐 — react 예외 경로가 세션을 죽이지 않는지 검증용."""
    async def react(self, kind, display_name=None, turn=None, on_first_audio=None):
        self.react_calls.append((kind, display_name))
        raise RuntimeError("musetalk render fail")


class _Sess:
    def __init__(self):
        self.pipeline = _Pipeline()
        self.session_id = "s1"
        self.se_path = None
        self.offer_time = None
        self.recorder = None
        self.state = None
        self.reacted_keys = {}
        self.pending_enroll = False
        self.current_speaker = None
        self.pending_react = None
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


def test_face_event_disabled_by_default(monkeypatch):
    """[T-135] 두 게이트 다 off 일 때만 구(T-067 이전) 동작과 완전 동일 — 회귀 0.
    SPEAKER_IDENTITY는 기본 on(dev/preview 전제)이라 명시적으로 꺼야 old 동작을 재현한다."""
    monkeypatch.delenv("PRETHIRD_FACE_REACT_ENABLED", raising=False)
    monkeypatch.setenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", "0")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    })
    assert sess.pipeline.react_calls == []
    assert sess.reacted_keys == {}
    assert sess.pending_enroll is False
    assert sess.current_speaker is None
    assert ch.sent == []


def test_speaker_identity_default_on_sets_current_speaker_without_react(monkeypatch):
    """[T-135] 기본값(SPEAKER_IDENTITY on, FACE_REACT off 기본값) — current_speaker/L2'
    주입은 동작하지만 react 발화·쿨다운·pending_enroll은 여전히 무동작이어야 한다."""
    monkeypatch.delenv("PRETHIRD_FACE_REACT_ENABLED", raising=False)
    monkeypatch.delenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", raising=False)
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    })
    assert sess.current_speaker == (3, "민지")
    assert sess.pipeline.react_calls == []  # react 게이트는 여전히 off
    assert sess.reacted_keys == {}
    assert sess.pending_enroll is False
    assert ch.sent == []


def test_speaker_identity_off_react_on_reacts_without_current_speaker(monkeypatch):
    """[T-135] 반대 매트릭스 — identity off + react on: react/발화는 동작하지만
    current_speaker/L2' 스왑은 트리거되지 않아야 한다(관심사 완전 분리)."""
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    monkeypatch.setenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", "0")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    })
    assert sess.pipeline.react_calls == [("known", "민지")]
    assert sess.current_speaker is None


def test_unknown_face_clears_current_speaker_when_identity_on(monkeypatch):
    """[T-135 v2] 화자 확실성 게이팅 — confirmed로 확정된 상태에서 unknown_face가
    오면 current_speaker가 즉시 None으로 해제된다(이름/L2' 오염 차단)."""
    monkeypatch.delenv("PRETHIRD_FACE_REACT_ENABLED", raising=False)
    monkeypatch.delenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", raising=False)  # 기본 on
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 1,
    })
    assert sess.current_speaker == (3, "민지")

    _run_handler(sess, ch, {"type": "face_event", "event": "unknown_face", "seq": 2})
    assert sess.current_speaker is None


def test_multi_face_clears_current_speaker_when_identity_on(monkeypatch):
    monkeypatch.delenv("PRETHIRD_FACE_REACT_ENABLED", raising=False)
    monkeypatch.delenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", raising=False)
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 1,
    })
    assert sess.current_speaker == (3, "민지")

    _run_handler(sess, ch, {"type": "face_event", "event": "multi_face", "seq": 2})
    assert sess.current_speaker is None


def test_confirmed_unknown_confirmed_transition_restores_speaker(monkeypatch):
    """[T-135 v2] confirmed→unknown→confirmed 전이 — 해제됐다가 재확정 시 다시
    화자로 복귀한다(같은 사람이든 다른 사람이든 speaker_confirmed가 오면 확정)."""
    monkeypatch.delenv("PRETHIRD_FACE_REACT_ENABLED", raising=False)
    monkeypatch.delenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", raising=False)
    sess, ch = _Sess(), _Channel()

    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 1,
    })
    assert sess.current_speaker == (3, "민지")

    _run_handler(sess, ch, {"type": "face_event", "event": "unknown_face", "seq": 2})
    assert sess.current_speaker is None

    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 3,
    })
    assert sess.current_speaker == (3, "민지")


def test_unknown_face_noop_when_already_none(monkeypatch):
    """current_speaker가 이미 None인 상태에서 unknown_face가 와도 예외 없이 no-op."""
    monkeypatch.delenv("PRETHIRD_FACE_REACT_ENABLED", raising=False)
    monkeypatch.delenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", raising=False)
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "face_event", "event": "unknown_face", "seq": 1})
    assert sess.current_speaker is None


def test_unknown_face_does_not_clear_when_identity_gate_off(monkeypatch):
    """identity 게이트 off면 confirmed로 current_speaker가 설정될 수 없으므로
    (원래 항상 None) unknown_face도 아무 영향이 없다 — 관심사 분리 회귀 확인."""
    monkeypatch.setenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", "0")
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    sess.current_speaker = (3, "민지")  # identity off 상태에서도 외부에서 세팅된 값이 있다면
    _run_handler(sess, ch, {"type": "face_event", "event": "unknown_face", "seq": 1})
    assert sess.current_speaker == (3, "민지")  # identity off → 게이팅 로직 자체가 스킵


def test_known_face_react(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    })
    assert sess.pipeline.react_calls == [("known", "민지")]
    assert sess.current_speaker == (3, "민지")
    assert "3" in sess.reacted_keys


def test_unknown_face_react_sets_pending(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "face_event", "event": "unknown_face", "seq": 1})
    assert sess.pipeline.react_calls == [("unknown", None)]
    assert sess.pending_enroll is True


def test_multi_face_treated_as_unknown(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "face_event", "event": "multi_face", "seq": 2})
    assert sess.pipeline.react_calls == [("unknown", None)]
    assert sess.pending_enroll is True


def test_cooldown_same_key(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    msg = {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    }
    _run_handler(sess, ch, msg)
    _run_handler(sess, ch, msg)
    assert sess.pipeline.react_calls == [("known", "민지")]


def test_say_regression():
    """face_event 코드 추가가 기존 say 흐름에 영향을 주지 않는다(회귀 0)."""
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 3})
    assert sess.pipeline.say_calls == ["안녕"]
    assert sess.pipeline.react_calls == []
    assert ("speech_start", 3) in [(m["type"], m.get("seq")) for m in ch.sent]


def _pump_until(loop, cond, max_ticks=20):
    """cond()가 참이 될 때까지 이벤트루프를 최대 max_ticks 틱 진행."""
    for _ in range(max_ticks):
        if cond():
            return
        loop.run_until_complete(asyncio.sleep(0))
    raise AssertionError("condition not satisfied within pump ticks")


def test_react_deferred_while_busy_then_played_after_say(monkeypatch):
    """플랜 §6.2: 발화(say) 진행 중 face_event 도착 → 즉시 겹쳐 재생하지 않고
    단일 pending 슬롯에 대기했다가, say 종료 후에 재생된다(오디오/비디오 겹침 없음)."""
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    sess.pipeline = _GatedPipeline()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, ch)
        handler(json.dumps({"type": "say", "text": "안녕", "seq": 1}))
        _pump_until(loop, lambda: sess.pipeline.say_calls)

        handler(json.dumps({
            "type": "face_event", "event": "speaker_confirmed",
            "personId": 3, "displayName": "민지", "seq": 2,
        }))
        _pump_until(loop, lambda: sess.pending_react is not None)
        # say 발화 중엔 react가 아직 재생되지 않아야 한다(겹침 없음).
        assert sess.pipeline.react_calls == []

        sess.pipeline.say_gate.set()
        pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
        loop.run_until_complete(asyncio.gather(*pending))

        assert sess.pipeline.react_calls == [("known", "민지")]
        assert sess.pending_react is None
    finally:
        asyncio.set_event_loop(None)
        loop.close()


def test_pending_react_replaced_by_latest(monkeypatch):
    """발화 중 face_event 2연속 도착 → 단일 슬롯이 최신 것으로 교체(연쇄 큐 금지),
    발화 종료 후 재생되는 것은 최신(2번째) 것 1개뿐."""
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    sess.pipeline = _GatedPipeline()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, ch)
        handler(json.dumps({"type": "say", "text": "안녕", "seq": 1}))
        _pump_until(loop, lambda: sess.pipeline.say_calls)

        handler(json.dumps({
            "type": "face_event", "event": "speaker_confirmed",
            "personId": 3, "displayName": "민지", "seq": 2,
        }))
        _pump_until(loop, lambda: sess.pending_react is not None)
        first_pending = sess.pending_react

        handler(json.dumps({
            "type": "face_event", "event": "speaker_confirmed",
            "personId": 5, "displayName": "철수", "seq": 3,
        }))
        _pump_until(loop, lambda: sess.pending_react is not None and sess.pending_react is not first_pending)
        assert sess.pending_react["name"] == "철수"

        sess.pipeline.say_gate.set()
        pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
        loop.run_until_complete(asyncio.gather(*pending))

        # 최신(철수) 것 1개만 재생 — 민지는 드랍(연쇄 큐 금지)
        assert sess.pipeline.react_calls == [("known", "철수")]
    finally:
        asyncio.set_event_loop(None)
        loop.close()


def test_pending_react_dropped_after_wait_cap(monkeypatch):
    """대기 상한(REACT_PENDING_WAIT_CAP_S) 초과 후 드레인 시점이 오면 스테일 반응으로 드랍."""
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    clock = {"t": 1_000_000.0}

    def fake_monotonic():
        return clock["t"]

    monkeypatch.setattr(time, "monotonic", fake_monotonic)

    sess, ch = _Sess(), _Channel()
    sess.pipeline = _GatedPipeline()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, ch)
        handler(json.dumps({"type": "say", "text": "안녕", "seq": 1}))
        _pump_until(loop, lambda: sess.pipeline.say_calls)

        handler(json.dumps({
            "type": "face_event", "event": "speaker_confirmed",
            "personId": 3, "displayName": "민지", "seq": 2,
        }))
        _pump_until(loop, lambda: sess.pending_react is not None)

        # 대기 상한(기본 20s)을 훌쩍 넘겨 시계 이동 — 발화가 아주 길게 이어진 상황 시뮬.
        clock["t"] += signaling.REACT_PENDING_WAIT_CAP_S + 5.0

        sess.pipeline.say_gate.set()
        pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
        loop.run_until_complete(asyncio.gather(*pending))

        assert sess.pipeline.react_calls == []   # 드랍됨 — 재생 안 됨
        assert sess.pending_react is None
    finally:
        asyncio.set_event_loop(None)
        loop.close()


def test_malformed_person_id_ignored_before_cooldown_record(monkeypatch):
    """personId가 숫자로 변환 불가하면 쿨다운 키를 기록하기 전에 조기 무시 —
    이후 올바른 personId 이벤트가 정상적으로 react 기회를 소모할 수 있어야 한다."""
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": "abc", "displayName": "민지", "seq": 1,
    })
    assert sess.pipeline.react_calls == []
    assert sess.reacted_keys == {}        # 조기 무시 — 쿨다운 키 기록 안 됨
    assert sess.current_speaker is None

    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 2,
    })
    assert sess.pipeline.react_calls == [("known", "민지")]  # 기회 소모 안 됐음이 증명됨


def test_react_exception_does_not_kill_session(monkeypatch):
    """react() 내부 예외 → 로그만 남기고 세션 생존, 후속 say는 정상 동작."""
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    sess.pipeline = _BoomPipeline()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 1,
    })
    assert sess.pipeline.react_calls == [("known", "민지")]  # 시도는 됐음

    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 2})
    assert sess.pipeline.say_calls == ["안녕"]  # react 예외 후에도 통화(say) 정상
