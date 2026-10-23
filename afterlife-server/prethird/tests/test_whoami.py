"""AFL-1039: 말하는 순간 얼굴 대조(turn_face) · "나 누구야?" 처리(who_asked)."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio
import json
import time

import numpy as np

from clone_dialog.whoami import turn_face_instruction, TURN_FACE_MAX_AGE_S  # noqa: E402
from signaling import _make_dc_handler  # noqa: E402
from pipeline import DialoguePipeline  # noqa: E402


# ---------------------------------------------------------------------------
# whoami.turn_face_instruction
# ---------------------------------------------------------------------------

NOW = 1000.0


def tf(**kw):
    return {"verdict": "unknown", "quality": "dark", "personId": None, "score": None, "at": NOW, **kw}


def test_unknown_gives_no_name_and_ask_tag_rule():
    s = turn_face_instruction(tf(), speaker_name="지호", now=NOW)
    assert "<ask=who>" in s and "지호" not in s and "어두" in s


def test_quality_none_mentions_face_not_visible():
    assert "안 보" in turn_face_instruction(tf(quality="none", verdict="insufficient"), None, NOW)


def test_insufficient_quality_ok_still_unconfirmed_without_name():
    s = turn_face_instruction(tf(quality="ok", verdict="insufficient"), "지호", NOW)
    assert "확인되지 않았다" in s and "<ask=who>" in s and "지호" not in s


def test_known_high_score_no_instruction():
    assert turn_face_instruction(tf(verdict="known", personId=7, score=0.72), "지호", NOW) is None


def test_known_score_none_no_instruction():
    assert turn_face_instruction(tf(verdict="known", personId=7, score=None), "지호", NOW) is None


def test_known_low_score_hedge_only_for_who_question():
    s = turn_face_instruction(tf(verdict="known", personId=7, score=0.55), "지호", NOW)
    assert "혹시" in s and "누구" in s     # 누구냐고 물을 때만 확인 말투로
    assert "지호" in s and "<ask=who>" not in s


def test_switch_low_score_without_server_name_no_instruction():
    # 이름은 서버의 speaker_name 에서만 — 없으면 확인 말투 지시도 없다.
    assert turn_face_instruction(tf(verdict="switch", personId=7, score=0.5), None, NOW) is None


def test_stale_turn_face_ignored():
    assert turn_face_instruction(tf(at=NOW - 6), "지호", NOW) is None
    assert TURN_FACE_MAX_AGE_S == 5.0


def test_none_turn_face_no_instruction():
    assert turn_face_instruction(None, "지호", NOW) is None


def test_switch_disabled_by_env(monkeypatch):
    monkeypatch.setenv("PRETHIRD_WHOAMI_ENABLED", "0")
    assert turn_face_instruction(tf(), "지호", NOW) is None


# ---------------------------------------------------------------------------
# signaling: turn_face 수신 · who_asked 발신 · 구버전 앱 호환
# ---------------------------------------------------------------------------

class _Channel:
    def __init__(self):
        self.readyState = "open"
        self.sent = []

    def send(self, s):
        self.sent.append(json.loads(s))


class _Pipeline:
    def __init__(self, ask=None):
        self.ask = ask
        self.say_calls = []

    async def react(self, kind, display_name=None, turn=None, on_first_audio=None):
        pass

    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None,
                  on_sentence=None, turn_face=None, on_ask=None):
        self.say_calls.append({"text": text, "turn_face": turn_face})
        if self.ask and on_ask is not None:
            on_ask(self.ask)


class _Sess:
    def __init__(self, pipeline=None):
        self.pipeline = pipeline if pipeline is not None else _Pipeline()
        self.session_id = "s1"
        self.clone_id = 9201
        self.se_path = None
        self.offer_time = None
        self.recorder = None
        self.state = None
        self.reacted_keys = {}
        self.pending_enroll = False
        self.current_speaker = None
        self.pending_react = None
        self.user_id = None

    def set_state(self, s):
        self.state = s


async def _drain():
    me = asyncio.current_task()
    for _ in range(5):
        await asyncio.sleep(0)
        pending = [t for t in asyncio.all_tasks() if t is not me and not t.done()]
        if pending:
            await asyncio.gather(*pending, return_exceptions=True)


def _no_writeback(monkeypatch):
    import turn_writeback as tw
    import learn_writeback as lw

    async def _noop(*a, **k):
        return None
    monkeypatch.setattr(tw, "turn_writeback", _noop)
    monkeypatch.setattr(lw, "learn_writeback", _noop)


async def test_on_ask_who_sends_who_asked(monkeypatch):
    _no_writeback(monkeypatch)
    sess, ch = _Sess(_Pipeline(ask="who")), _Channel()
    _make_dc_handler(sess, ch)(json.dumps({"type": "say", "text": "나 누구야?", "seq": 1}))
    await _drain()
    assert {"type": "who_asked"} in ch.sent
    # 이름 문자열을 싣지 않는다
    assert [m for m in ch.sent if m.get("type") == "who_asked"] == [{"type": "who_asked"}]


async def test_no_ask_no_who_asked(monkeypatch):
    _no_writeback(monkeypatch)
    sess, ch = _Sess(), _Channel()
    _make_dc_handler(sess, ch)(json.dumps({"type": "say", "text": "안녕", "seq": 1}))
    await _drain()
    assert not [m for m in ch.sent if m.get("type") == "who_asked"]


async def test_turn_face_message_stored_with_timestamp(monkeypatch):
    _no_writeback(monkeypatch)
    sess, ch = _Sess(), _Channel()
    before = time.monotonic()
    _make_dc_handler(sess, ch)(json.dumps({
        "type": "turn_face", "verdict": "unknown", "quality": "dark",
        "personId": None, "score": None, "retry": False,
    }))
    await _drain()
    assert sess.turn_face["verdict"] == "unknown"
    assert sess.turn_face["quality"] == "dark"
    assert sess.turn_face["at"] >= before
    assert sess.pipeline.say_calls == []        # 발화 없음
    assert sess.state is None
    assert ch.sent == []


async def test_turn_face_switch_marks_turn_switch_at(monkeypatch):
    sess, ch = _Sess(), _Channel()
    _make_dc_handler(sess, ch)(json.dumps({"type": "turn_face", "verdict": "switch", "personId": 5, "score": 0.7}))
    await _drain()
    assert getattr(sess, "turn_switch_at", 0) > 0


async def test_turn_face_then_say_passes_and_consumes(monkeypatch):
    _no_writeback(monkeypatch)
    sess, ch = _Sess(), _Channel()
    h = _make_dc_handler(sess, ch)
    h(json.dumps({"type": "turn_face", "verdict": "unknown", "quality": "small"}))
    h(json.dumps({"type": "say", "text": "나 누구야?", "seq": 2}))
    await _drain()
    assert sess.pipeline.say_calls[0]["turn_face"]["quality"] == "small"
    assert sess.turn_face is None               # 한 턴만 쓰고 버린다


async def test_old_app_without_turn_face_unchanged(monkeypatch):
    _no_writeback(monkeypatch)
    sess, ch = _Sess(), _Channel()
    _make_dc_handler(sess, ch)(json.dumps({"type": "say", "text": "안녕", "seq": 1}))
    await _drain()
    assert sess.pipeline.say_calls == [{"text": "안녕", "turn_face": None}]


async def test_turn_face_without_pipeline_is_harmless():
    sess, ch = _Sess(), _Channel()
    sess.pipeline = None
    _make_dc_handler(sess, ch)(json.dumps({"type": "turn_face", "verdict": "known", "personId": 1, "score": 0.9}))
    await _drain()
    assert ch.sent == []


async def test_say_waits_for_pending_l2p_swap(monkeypatch):
    _no_writeback(monkeypatch)
    sess, ch = _Sess(), _Channel()
    order = []

    async def _swap():
        await asyncio.sleep(0.05)
        order.append("swap")
    sess.l2p_swap_task = asyncio.ensure_future(_swap())

    orig_say = sess.pipeline.say

    async def _say(text, turn=None, on_first_audio=None, on_response_ready=None,
                   on_sentence=None, turn_face=None, on_ask=None):
        order.append("say")
        await orig_say(text, turn_face=turn_face, on_ask=on_ask)
    monkeypatch.setattr(sess.pipeline, "say", _say)
    _make_dc_handler(sess, ch)(json.dumps({"type": "say", "text": "안녕", "seq": 1}))
    await _drain()
    assert order == ["swap", "say"]


# ---------------------------------------------------------------------------
# pipeline.say: turn_face 지시 주입 · on_ask 호출
# ---------------------------------------------------------------------------

class _FakeTrack:
    def push_ndarray(self, a): pass
    def push_pcm_int16(self, p): pass
    def signal_end(self): pass
    def begin_response(self): pass
    def flush(self): return 0
    def queue_depth(self): return 0
    def queue_depth_samples(self): return 0


def _fast_bridge(monkeypatch):
    # 실제 대기(브리지 유예·지속)를 짧게 — 이 테스트는 프롬프트·on_ask 만 본다.
    monkeypatch.setenv("PRETHIRD_BRIDGE_GRACE_MS", "10")
    monkeypatch.setenv("PRETHIRD_BRIDGE_DURATION_MS", "10")
    monkeypatch.setenv("PRETHIRD_POST_BRIDGE_DELAY_MS", "0")


def _make_pipe(tokens, seen):
    async def fake_chat(messages):
        seen.append(messages)
        for t in tokens:
            yield t

    async def fake_say(text, se_path):
        return b"RIFFfake"

    def fake_decode(wav):
        return (np.zeros(8000, dtype=np.int16), 16000, 1)

    def fake_infer(wav_path, on_frame):
        on_frame(np.zeros((8, 8, 3), dtype=np.uint8))
        return 1
    return DialoguePipeline(
        video_track=_FakeTrack(), audio_track=_FakeTrack(),
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )


async def test_pipeline_say_injects_turn_face_instruction_and_calls_on_ask(monkeypatch):
    _fast_bridge(monkeypatch)
    seen, asks = [], []
    pipe = _make_pipe(["<lang=ko>", "<ask=who>", "카메라를 ", "봐 줄래?"], seen)
    pipe.current_speaker_name = "지호"
    tfd = {"verdict": "unknown", "quality": "turned", "personId": None, "score": None,
           "at": time.monotonic()}
    await pipe.say("나 누구야?", turn_face=tfd, on_ask=asks.append)
    systems = [m["content"] for m in seen[0] if m["role"] == "system"]
    assert any("<ask=who>" in c and "지호" not in c for c in systems)
    assert asks == ["who"]


async def test_pipeline_say_without_turn_face_no_on_ask(monkeypatch):
    _fast_bridge(monkeypatch)
    seen, asks = [], []
    pipe = _make_pipe(["<lang=ko>", "안녕"], seen)
    await pipe.say("안녕", on_ask=asks.append)
    assert not any("<ask=who>" in m["content"] for m in seen[0] if m["role"] == "system")
    assert asks == []


# ---------------------------------------------------------------------------
# [최종 리뷰 I1] 미확인 턴에는 이름 힌트를 붙이지 않는다
# ---------------------------------------------------------------------------

from clone_dialog.whoami import turn_face_names_allowed  # noqa: E402


def test_names_not_allowed_on_unconfirmed_turns():
    assert turn_face_names_allowed(tf(verdict="unknown"), NOW) is False
    assert turn_face_names_allowed(tf(verdict="insufficient", quality="ok"), NOW) is False
    assert turn_face_names_allowed(tf(verdict="switch", personId=7, score=0.8, speaker_ok=False), NOW) is False


def test_names_allowed_when_confirmed_absent_stale_or_disabled(monkeypatch):
    assert turn_face_names_allowed(tf(verdict="known", personId=7, score=0.8), NOW) is True
    assert turn_face_names_allowed(tf(verdict="switch", personId=7, score=0.8, speaker_ok=True), NOW) is True
    assert turn_face_names_allowed(None, NOW) is True
    assert turn_face_names_allowed(tf(at=NOW - 6), NOW) is True
    monkeypatch.setenv("PRETHIRD_WHOAMI_ENABLED", "0")
    assert turn_face_names_allowed(tf(), NOW) is True


def test_switch_not_settled_on_server_gives_unconfirmed_without_name():
    s = turn_face_instruction(
        tf(verdict="switch", personId=7, score=0.55, quality="ok", speaker_ok=False), "지호", NOW)
    assert "확인되지 않았다" in s and "<ask=who>" in s and "지호" not in s and "혹시" not in s


def _sys_texts(messages):
    return [m["content"] for m in messages if m["role"] == "system"]


async def test_pipeline_insufficient_turn_drops_name_hints(monkeypatch):
    _fast_bridge(monkeypatch)
    seen = []
    pipe = _make_pipe(["<lang=ko>", "안녕"], seen)
    pipe.current_speaker_name = "민지"
    pipe.name_mention_hint = "민지"
    tfd = {"verdict": "insufficient", "quality": "ok", "personId": None, "score": None,
           "at": time.monotonic()}
    await pipe.say("나 누구야?", turn_face=tfd)
    systems = _sys_texts(seen[0])
    assert not any("민지" in c for c in systems)          # T-566 힌트·이름 부르기 힌트 둘 다 없음
    assert any("확인되지 않았다" in c for c in systems)   # 미확인 지시만
    assert pipe.name_mention_hint is None                 # 다음 턴으로 새지 않게 버린다
    assert pipe.current_speaker_name == "민지"            # 화자 상태는 그대로(이번 턴만)


async def test_pipeline_known_turn_keeps_name_hint(monkeypatch):
    _fast_bridge(monkeypatch)
    seen = []
    pipe = _make_pipe(["<lang=ko>", "안녕"], seen)
    pipe.current_speaker_name = "민지"
    tfd = {"verdict": "known", "quality": "ok", "personId": 3, "score": 0.8,
           "at": time.monotonic()}
    await pipe.say("나 누구야?", turn_face=tfd)
    assert any("'민지' 님" in c for c in _sys_texts(seen[0]))


# ---------------------------------------------------------------------------
# [최종 리뷰 C1] 운영 기본(소속 검증 on)에서 처음 보는 사람의 "나 누구야?"
# ---------------------------------------------------------------------------

def _scope_on_session(monkeypatch, verify_delay):
    """화자 '민지'(1) 확정 상태의 세션 + 실제 DialoguePipeline. 소속 검증은 verify_delay 초 뒤 ok."""
    monkeypatch.setenv("PRETHIRD_FACE_SCOPE_VERIFY", "1")   # conftest autouse 의 off 를 덮어쓴다
    _no_writeback(monkeypatch)
    _fast_bridge(monkeypatch)
    import l2p_client

    async def _verify(clone_id, user_id, pid):
        await asyncio.sleep(verify_delay)
        return "ok"
    monkeypatch.setattr(l2p_client, "verify_person_scope", _verify)

    async def _fake_swap(sess, pid, name, epoch=None):
        await asyncio.sleep(0.05)
        cur = getattr(sess, "current_speaker", None)
        if cur is not None and cur[0] == pid:
            sess.pipeline.current_speaker_name = name or None
    # 다른 테스트가 signaling 을 reload 할 수 있어, 이 파일이 쥔 _make_dc_handler 의 모듈 전역을 고친다.
    monkeypatch.setitem(_make_dc_handler.__globals__, "_maybe_swap_l2p", _fake_swap)

    seen = []
    pipe = _make_pipe(["<lang=ko>", "안녕"], seen)
    pipe.current_speaker_name = "민지"
    sess = _Sess(pipe)
    sess.user_id = "u1"
    sess.current_speaker = (1, "민지")
    sess.verified_person_ids = {1}
    return sess, seen


async def _wait_seen(seen, timeout=4.0):
    end = time.monotonic() + timeout
    while not seen and time.monotonic() < end:
        await asyncio.sleep(0.02)
    me = asyncio.current_task()
    for t in [t for t in asyncio.all_tasks() if t is not me and not t.done()]:
        t.cancel()
    await asyncio.sleep(0)


def _switch_turn(handler, pid, name):
    handler(json.dumps({"type": "turn_face", "verdict": "switch", "quality": "ok",
                        "personId": pid, "score": 0.55, "retry": False}))
    handler(json.dumps({"type": "face_event", "event": "speaker_confirmed",
                        "personId": pid, "displayName": name, "seq": 1}))
    handler(json.dumps({"type": "say", "text": "나 누구야?", "seq": 3}))


async def test_scope_verify_on_slow_verify_never_answers_with_previous_name(monkeypatch):
    sess, seen = _scope_on_session(monkeypatch, verify_delay=3.0)
    _switch_turn(_make_dc_handler(sess, _Channel()), 2, "도윤")
    await _wait_seen(seen)
    assert seen, "say 가 1.5초 안에 진행돼야 한다"
    texts = [m["content"] for m in seen[0]]
    assert not any("민지" in c for c in texts)            # 이전 사람 이름 힌트·확인 말투 없음
    assert any("확인되지 않았다" in c for c in _sys_texts(seen[0]))


async def test_scope_verify_on_fast_verify_waits_and_uses_new_name(monkeypatch):
    sess, seen = _scope_on_session(monkeypatch, verify_delay=0.1)
    _switch_turn(_make_dc_handler(sess, _Channel()), 2, "도윤")
    await _wait_seen(seen)
    assert sess.current_speaker == (2, "도윤")
    texts = _sys_texts(seen[0])
    assert not any("민지" in c for c in texts)
    assert any("'도윤' 님" in c for c in texts)           # 검증·스왑을 기다린 뒤 새 이름으로
    assert any("혹시 도윤야?" in c for c in texts)          # 0.55 → 확인 말투도 새 이름


async def test_known_turn_matching_server_speaker_does_not_wait(monkeypatch):
    sess, seen = _scope_on_session(monkeypatch, verify_delay=3.0)
    h = _make_dc_handler(sess, _Channel())
    t0 = time.monotonic()
    h(json.dumps({"type": "turn_face", "verdict": "known", "quality": "ok",
                  "personId": 1, "score": 0.8}))
    h(json.dumps({"type": "say", "text": "나 누구야?", "seq": 4}))
    await _wait_seen(seen)
    assert time.monotonic() - t0 < 1.0
    assert any("'민지' 님" in c for c in _sys_texts(seen[0]))


# AFL-1039 실통화(2026-10-23): "응" 에도 "카메라 봐줘" — 직접 물을 때만 쓰라고 좁혔다.
def test_unconfirmed_instruction_only_on_direct_question():
    s = turn_face_instruction(tf(verdict="insufficient", quality="ok"), None, NOW)
    assert "직접 묻는 말일 때만" in s
    assert "얼굴·카메라 얘기를 꺼내지 말고" in s
    assert "</ask=who>" in s  # 닫는 태그 금지 문구
