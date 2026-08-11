"""test_turn_writeback.py — 통화 대화 원문(call_turns) 서버 기록 단위 테스트.

검증 항목:
1. user/clone 두 발화가 모두, user 먼저 전송된다(서버 seq 채번 = 전송 순서).
2. 빈/공백 텍스트는 전송하지 않는다(서버가 400 이므로 왕복 낭비).
3. HTTP 실패·예외는 흡수한다(통화·학습·과금 무영향).
4. env(ORCH_SECRET/PRETHIRD_API_BASE)·call_id 형식 미비 시 조용히 skip.
5. 인증 헤더가 ORCH_SECRET 이다(LEARN_SECRET 복사 시 401 회귀 방지).
6. dedupe_key 로 같은 턴 재전송을 막는다.
"""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import turn_writeback as tw  # noqa: E402


def _env(monkeypatch, *, orch="orch-s", learn="learn-s", base="http://oth-path"):
    monkeypatch.delenv("ORCH_SECRET", raising=False)
    monkeypatch.delenv("PRETHIRD_API_BASE", raising=False)
    if orch is not None:
        monkeypatch.setenv("ORCH_SECRET", orch)
    if learn is not None:
        monkeypatch.setenv("LEARN_SECRET", learn)
    if base is not None:
        monkeypatch.setenv("PRETHIRD_API_BASE", base)


def _capture(monkeypatch):
    calls: list[tuple] = []

    async def _fake_post(api_base, secret, call_id, role, text, speaker_person_id=None):
        calls.append((api_base, secret, call_id, role, text, speaker_person_id))

    monkeypatch.setattr(tw, "_post_turn", _fake_post)
    return calls


def setup_function(_fn):
    # 모듈 전역 dedupe 집합이 테스트 간에 새지 않도록.
    tw._SENT_KEYS.clear()


async def test_posts_user_then_clone(monkeypatch):
    _env(monkeypatch)
    calls = _capture(monkeypatch)
    await tw.turn_writeback("0123456789ab", "이름 기억해", "그래 기억할게")
    assert [(c[3], c[4]) for c in calls] == [
        ("user", "이름 기억해"),
        ("clone", "그래 기억할게"),
    ]
    # 인증은 ORCH_SECRET — LEARN_SECRET 를 그대로 복사하면 수신처가 401.
    assert {c[1] for c in calls} == {"orch-s"}
    assert {c[0] for c in calls} == {"http://oth-path"}


async def test_skips_empty_texts(monkeypatch):
    _env(monkeypatch)
    calls = _capture(monkeypatch)
    await tw.turn_writeback("0123456789ab", "   ", "")
    assert calls == []
    # 한쪽만 비어도 나머지는 나간다.
    await tw.turn_writeback("0123456789ab", "안녕", None)
    assert [(c[3], c[4]) for c in calls] == [("user", "안녕")]


async def test_skips_without_env_or_bad_call_id(monkeypatch):
    calls = _capture(monkeypatch)

    _env(monkeypatch, orch=None)
    await tw.turn_writeback("0123456789ab", "안녕", "응답")
    _env(monkeypatch, base=None)
    await tw.turn_writeback("0123456789ab", "안녕", "응답")
    _env(monkeypatch)
    await tw.turn_writeback(None, "안녕", "응답")
    await tw.turn_writeback("../../admin", "안녕", "응답")  # path 보간 방어
    await tw.turn_writeback("SHORT", "안녕", "응답")
    assert calls == []


async def test_swallows_http_failure(monkeypatch):
    _env(monkeypatch)
    seen: list[str] = []

    async def _boom(api_base, secret, call_id, role, text, speaker_person_id=None):
        seen.append(role)
        raise RuntimeError("network")

    monkeypatch.setattr(tw, "_post_turn", _boom)
    # raise 되면 테스트 실패 — 통화 경로로 예외가 새면 안 된다.
    await tw.turn_writeback("0123456789ab", "안녕", "응답")
    # 한쪽 실패가 다른 쪽 기록을 막지 않는다.
    assert seen == ["user", "clone"]


async def test_dedupe_key_blocks_resend(monkeypatch):
    _env(monkeypatch)
    calls = _capture(monkeypatch)
    await tw.turn_writeback("0123456789ab", "안녕", "응답", dedupe_key="s1:7")
    await tw.turn_writeback("0123456789ab", "안녕", "응답", dedupe_key="s1:7")
    assert len(calls) == 2  # 2회차는 통째로 skip
    # 다른 키는 정상 전송.
    await tw.turn_writeback("0123456789ab", "또", "응답2", dedupe_key="s1:8")
    assert len(calls) == 4


# ─────────────────────────────────────────────────────────────────────────
# speaker_person_id — 얼굴로 확정한 화자를 발화에 붙인다.
#
# 이게 없으면 call_turns 에 "누가 말했는가"가 남지 않아, 화자별 L2' 학습이
# 올바른 사람에게 귀속됐는지 사후에 확인할 방법이 없다(462턴 전량 NULL 이었다).
# ─────────────────────────────────────────────────────────────────────────

async def test_speaker_person_id_only_on_user_turn(monkeypatch):
    """화자는 user 발화에만 붙는다 — clone 턴의 화자는 클론 자신이다."""
    _env(monkeypatch)
    calls = _capture(monkeypatch)
    await tw.turn_writeback("0123456789ab", "나 왔어", "어서 와", speaker_person_id=43)
    assert [(c[3], c[5]) for c in calls] == [("user", 43), ("clone", None)]


async def test_speaker_person_id_absent_by_default(monkeypatch):
    """미지정이면 None — 이 인자를 안 넘기던 기존 호출부 회귀 0."""
    _env(monkeypatch)
    calls = _capture(monkeypatch)
    await tw.turn_writeback("0123456789ab", "안녕", "응답")
    assert [c[5] for c in calls] == [None, None]


def test_build_body_puts_speaker_only_for_user_and_int():
    """body 조립 계약. 서버가 정수만 받으므로 그 밖의 값은 키 자체를 생략한다
    (키를 None 으로 보내도 서버가 버리지만, 의미 없는 필드를 페이로드에 남기지 않는다)."""
    assert tw._build_body("user", "t", 43) == {"role": "user", "text": "t", "speakerPersonId": 43}
    # clone 턴에는 화자를 싣지 않는다.
    assert tw._build_body("clone", "t", 43) == {"role": "clone", "text": "t"}
    # 미확정·비정수(문자열/실수/bool)는 생략. bool 은 파이썬에서 int 의 서브클래스라
    # 명시적으로 걸러내지 않으면 True 가 1 로 새어 들어간다.
    for bad in (None, "43", 4.3, True):
        assert tw._build_body("user", "t", bad) == {"role": "user", "text": "t"}


async def test_no_dedupe_key_always_sends(monkeypatch):
    """키가 없다고 기록을 건너뛰면 원문이 유실된다 — 무조건 보낸다."""
    _env(monkeypatch)
    calls = _capture(monkeypatch)
    await tw.turn_writeback("0123456789ab", "안녕", "응답")
    await tw.turn_writeback("0123456789ab", "안녕", "응답")
    assert len(calls) == 4
