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
