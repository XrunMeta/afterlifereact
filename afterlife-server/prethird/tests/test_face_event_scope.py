"""AFL-1030: face_event personId 는 신뢰 불가 입력 — 이 통화의 user x clone 소속으로
API 검증된 pid 만 화자(current_speaker)로 채택한다. 검증 실패·오류는 fail-closed."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import pytest  # noqa: E402
import signaling  # noqa: E402
import l2p_client  # noqa: E402


class _FakePipeline:
    def update_persona(self, msgs):
        pass


class _Sess:
    def __init__(self):
        self.session_id = "0123456789ab"
        self.pipeline = _FakePipeline()
        self.clone_id = 9128
        self.user_id = 77
        self.current_speaker = None
        self.reacted_keys = {}
        self.pending_enroll = False
        self.pending_react = None
        # bundle 이 없으면 _maybe_swap_l2p 가 화자를 익명으로 되돌리므로 최소 번들을 둔다.
        self.bundle = {"personaBundle": {"cloneId": "9128", "persona": {"displayName": "코조", "tone": "친근"}, "viewer": {"displayName": "지호"}}}
        self.user_location = None
        self.speaker_epoch = 0


@pytest.fixture(autouse=True)
def _scope_on(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_SCOPE_VERIFY", "1")
    monkeypatch.setenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", "1")
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "0")


def _patch_verify(monkeypatch, allowed, calls):
    async def fake(clone_id, user_id, person_id):
        calls.append((clone_id, user_id, person_id))
        return "ok" if person_id in allowed else "denied"
    monkeypatch.setattr(l2p_client, "verify_person_scope", fake)

    async def fake_fetch(*a, **k):
        return None
    monkeypatch.setattr(l2p_client, "fetch_l2p", fake_fetch)


def _confirm(sess, pid):
    signaling._handle_face_event(
        sess, {"event": "speaker_confirmed", "personId": pid, "displayName": "도기"})


async def _settle():
    for _ in range(50):
        await asyncio.sleep(0)


async def test_정상_person은_검증_후_채택된다(monkeypatch):
    calls = []
    _patch_verify(monkeypatch, {58}, calls)
    sess = _Sess()
    _confirm(sess, 58)
    assert sess.current_speaker is None  # 검증 전에는 채택하지 않는다
    await _settle()
    assert sess.current_speaker == (58, "도기")
    assert calls == [(9128, 77, 58)]
    # 검증 캐시 — 같은 pid 재확정은 API 를 다시 부르지 않는다
    _confirm(sess, 58)
    assert len(calls) == 1


async def test_다른_계정_또는_다른_클론_person은_채택되지_않는다(monkeypatch):
    calls = []
    _patch_verify(monkeypatch, set(), calls)  # API 가 404 로 거부하는 상황
    sess = _Sess()
    for pid in (999, 1000):
        _confirm(sess, pid)
        await _settle()
        assert sess.current_speaker is None
    # 거부된 pid 는 세션 동안 기억 — API 재호출 없음
    n = len(calls)
    _confirm(sess, 999)
    await _settle()
    assert len(calls) == n and sess.current_speaker is None


async def test_검증_실패시_기존_화자가_있으면_unknown으로_해제된다(monkeypatch):
    calls = []
    _patch_verify(monkeypatch, {58}, calls)
    sess = _Sess()
    _confirm(sess, 58)
    await _settle()
    assert sess.current_speaker[0] == 58
    _confirm(sess, 999)
    await _settle()
    assert sess.current_speaker is None


async def test_검증_호출_예외_또는_env_미설정은_fail_closed(monkeypatch):
    async def boom(*a):
        raise RuntimeError("network")
    monkeypatch.setattr(l2p_client, "verify_person_scope", boom)
    sess = _Sess()
    _confirm(sess, 58)
    await _settle()
    assert sess.current_speaker is None

    monkeypatch.undo()
    monkeypatch.setenv("PRETHIRD_FACE_SCOPE_VERIFY", "1")
    monkeypatch.setenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", "1")
    monkeypatch.delenv("LEARN_SECRET", raising=False)
    monkeypatch.delenv("PRETHIRD_API_BASE", raising=False)
    assert await l2p_client.verify_person_scope(9128, 77, 58) == "error"
    assert await l2p_client.verify_person_scope(9128, None, 58) == "error"
    assert await l2p_client.fetch_l2p(9128, 58, None) is None


async def test_검증_대기중_더_새로운_이벤트가_오면_낡은_확정은_재처리하지_않는다(monkeypatch):
    calls = []
    _patch_verify(monkeypatch, {58}, calls)
    sess = _Sess()
    _confirm(sess, 58)
    signaling._handle_face_event(sess, {"event": "unknown_face"})  # 검증 중 낯선 얼굴
    await _settle()
    assert sess.current_speaker is None


async def test_일시_오류는_캐시하지_않고_다음_이벤트에서_재검증되어_채택된다(monkeypatch):
    results = iter(["error", "ok"])
    calls = []

    async def flaky(clone_id, user_id, person_id):
        calls.append(person_id)
        return next(results)
    monkeypatch.setattr(l2p_client, "verify_person_scope", flaky)

    async def fake_fetch(*a, **k):
        return None
    monkeypatch.setattr(l2p_client, "fetch_l2p", fake_fetch)
    sess = _Sess()
    _confirm(sess, 58)
    await _settle()
    assert sess.current_speaker is None
    assert 58 not in getattr(sess, "rejected_person_ids", set())
    _confirm(sess, 58)
    await _settle()
    assert calls == [58, 58]
    assert sess.current_speaker == (58, "도기")


async def test_user_id_없으면_검증_호출없이_미채택(monkeypatch):
    calls = []
    _patch_verify(monkeypatch, {58}, calls)
    sess = _Sess()
    sess.user_id = None
    _confirm(sess, 58)
    await _settle()
    assert sess.current_speaker is None and calls == []


async def test_검증_중_같은_pid_더_새_이벤트가_와도_채택된다(monkeypatch):
    gate = asyncio.Event()

    async def slow(clone_id, user_id, person_id):
        await gate.wait()
        return "ok"
    monkeypatch.setattr(l2p_client, "verify_person_scope", slow)

    async def fake_fetch(*a, **k):
        return None
    monkeypatch.setattr(l2p_client, "fetch_l2p", fake_fetch)
    sess = _Sess()
    _confirm(sess, 58)
    await _settle()
    _confirm(sess, 58)  # 검증 진행 중 같은 pid 재확정
    gate.set()
    await _settle()
    assert sess.current_speaker == (58, "도기")


@pytest.mark.parametrize("val,expected", [
    (None, True), ("1", True), ("true", True), ("on", True), ("1 ", True), ("yes", True), ("", True),
    ("0", False), ("false", False), ("OFF", False), (" Off ", False), ("False", False),
])
def test_게이트_파싱_기본_켜짐_0_false_off만_끈다(monkeypatch, val, expected):
    if val is None:
        monkeypatch.delenv("PRETHIRD_FACE_SCOPE_VERIFY", raising=False)
    else:
        monkeypatch.setenv("PRETHIRD_FACE_SCOPE_VERIFY", val)
    assert signaling._face_scope_verify_enabled() is expected
