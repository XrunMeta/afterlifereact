"""tests/test_signaling_stage_dc.py — [T-258] stage 신호의 dc 페이로드 계약.

클라(RN)와 합의된 형식을 서버가 지키는지 고정한다:
    {"type":"stage","seq":<RN이 준 값 echo>,"stage":<name>,"tMs":<int>,"detail":{...}}
- seq 는 speech_start/speech_end 와 **같은 값**
- tMs 는 턴 시작(dc 수신) 기준 경과 ms
- 기존 speech_start/speech_text/speech_end 는 그대로 나간다(하위호환)
- dc 가 닫혀 있거나 send 가 실패해도 발화가 죽지 않는다
- PRETHIRD_STAGE_SIGNAL=0 이면 stage 만 사라지고 나머지는 동일
"""
import asyncio
import json

from signaling import _make_dc_handler


class _Channel:
    def __init__(self, ready="open", boom=False):
        self.readyState = ready
        self.sent = []
        self._boom = boom

    def send(self, s):
        if self._boom:
            raise RuntimeError("dc send failed")
        self.sent.append(json.loads(s))


class _Pipeline:
    """on_stage 를 받아 batch 순서대로 단계를 흘려보내는 가짜 파이프라인."""

    def __init__(self):
        self.say_calls = []

    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None,
                  on_sentence=None, on_stage=None, **_kw):
        self.say_calls.append(text)
        if on_stage:
            on_stage("llm_done", {"chars": 12})
            on_stage("tts_start", None)
            on_stage("tts_done", {"audio_ms": 3400})
            on_stage("render_start", None)
        if on_first_audio:
            on_first_audio()
        if on_stage:
            on_stage("render_done", {"frames": 85})
            on_stage("stream_start", None)
            on_stage("stream_end", {"queued_ms": 3400})


class _Sess:
    def __init__(self):
        self.pipeline = _Pipeline()
        self.session_id = "s1"
        self.se_path = None
        self.offer_time = None
        self.recorder = None
        self.state = None

    def set_state(self, s):
        self.state = s


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


def test_stage_payload_shape_and_seq_echo():
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 42})

    stages = [m for m in ch.sent if m["type"] == "stage"]
    assert [m["stage"] for m in stages] == [
        "llm_done", "tts_start", "tts_done", "render_start",
        "render_done", "stream_start", "stream_end",
    ]
    for m in stages:
        assert m["seq"] == 42                 # speech_start/end 와 동일한 seq
        assert isinstance(m["tMs"], int) and m["tMs"] >= 0
    # detail 은 있을 때만 실린다
    assert dict((m["stage"], m.get("detail")) for m in stages)["tts_done"] == {"audio_ms": 3400}
    assert "detail" not in [m for m in stages if m["stage"] == "tts_start"][0]
    # tMs 는 단조 증가(턴 시작 기준 경과)
    tms = [m["tMs"] for m in stages]
    assert tms == sorted(tms)


def test_existing_speech_signals_unchanged():
    """하위호환 — stage 추가가 speech_start/speech_end 를 밀어내지 않는다."""
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 7})

    types = [(m["type"], m.get("seq")) for m in ch.sent]
    assert ("speech_start", 7) in types
    assert ("speech_end", 7) in types
    assert types.index(("speech_start", 7)) < types.index(("speech_end", 7))


def test_stage_signal_disabled_by_env(monkeypatch):
    monkeypatch.setenv("PRETHIRD_STAGE_SIGNAL", "0")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 1})

    assert [m for m in ch.sent if m["type"] == "stage"] == []
    assert sess.pipeline.say_calls == ["안녕"]           # 발화는 그대로
    assert ("speech_end", 1) in [(m["type"], m.get("seq")) for m in ch.sent]


def test_closed_channel_is_silently_skipped(caplog):
    """[리뷰 Important 3] dc 가 닫혀 있으면 send 뿐 아니라 `[stage]` log.info 도
    남기지 않는다 — 이전엔 로그가 readyState 검사보다 앞에 있어 채널이 닫혀
    있어도 턴당 7줄이 핫패스에서 무조건 찍혔다(그중 2줄은 _fire_hook~push 창
    안 → 루트 핸들러가 파일이면 블로킹 I/O 로 push 지연)."""
    import logging as _logging

    sess, ch = _Sess(), _Channel(ready="closed")
    with caplog.at_level(_logging.INFO, logger="prethird.signaling"):
        _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 1})
    assert ch.sent == []                                  # 아무것도 안 보냄
    assert sess.pipeline.say_calls == ["안녕"]            # 발화는 정상 수행
    assert [r for r in caplog.records if "[stage]" in r.getMessage()] == []


def test_stage_log_emitted_only_when_sent(caplog):
    """열린 채널에서는 보낸 만큼만 `[stage]` 로그가 남는다(7단계 = 7줄)."""
    import logging as _logging

    sess, ch = _Sess(), _Channel()
    with caplog.at_level(_logging.INFO, logger="prethird.signaling"):
        _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 5})
    logs = [r.getMessage() for r in caplog.records if "[stage]" in r.getMessage()]
    assert len(logs) == 7
    assert len([m for m in ch.sent if m["type"] == "stage"]) == 7


def test_seq_and_t0_are_keyword_only():
    """[리뷰 minor] seq/t0 를 3·4번째 위치인자로 덮어쓰는 오호출은 TypeError.
    pipeline 은 on_stage(name, detail) 2인자로만 부른다."""
    captured = {}

    class _P(_Pipeline):
        async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None,
                      on_sentence=None, on_stage=None, **_kw):
            self.say_calls.append(text)
            try:
                on_stage("llm_done", None, 999)      # seq 를 위치로 밀어넣기 시도
            except TypeError as e:
                captured["err"] = str(e)

    sess, ch = _Sess(), _Channel()
    sess.pipeline = _P()
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 3})

    assert "err" in captured, "위치인자 오호출이 차단되지 않았다"
    assert [m for m in ch.sent if m["type"] == "stage"] == []   # 잘못된 신호는 안 나감


def test_send_failure_does_not_kill_utterance():
    sess, ch = _Sess(), _Channel(boom=True)
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 1})
    assert sess.pipeline.say_calls == ["안녕"]
    assert sess.state == "idle"                           # 정상 종료 경로
