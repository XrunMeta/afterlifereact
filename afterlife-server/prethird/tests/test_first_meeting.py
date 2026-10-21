"""[2026-10-20 sungjius] 상대 이름은 직접 알려준 것만 · 첫 대화(이전 대화 0건)는 처음 보는 사람.

1. 계정 이름(viewer.displayName)은 프롬프트에 넣지 않는다. 이름은 지난 대화에서 상대가 직접
   말한 것(prior 기록)이나 이 클론과의 대화에서 얼굴로 확정된 화자 이름만 쓴다.
2. 첫 대화면 얼굴로 확정된 화자도 쓰지 않고(다른 클론에서 등록된 얼굴일 수 있음) 설문만 쓴다.
3. 첫 대화 판정은 "조회 성공 + 0건" 뿐이다 — 꺼짐·실패를 0건으로 읽으면 아는 상대에게
   "오늘 처음 대화한다" 고 말하게 된다.
"""
import sys, pathlib
import numpy as np
import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from clone_dialog import bundle_to_messages  # noqa: E402
from clone_dialog.persona_prompt import _RULE_FIRST_MEETING, _RULE_NAME_UNKNOWN  # noqa: E402
import prior_conversation as pc  # noqa: E402
import signaling  # noqa: E402
import chat_reply_endpoint as cr  # noqa: E402
from pipeline import DialoguePipeline  # noqa: E402

_PERSONA = {
    "displayName": "주휘",
    "tone": "다정함",
    "relation": "연인",
    "memories_personal": ["지난주에 같이 영화 봄"],
}

def _bundle(viewer_name="히즈키"):
    return {"personaBundle": {"cloneId": "9192", "persona": dict(_PERSONA),
                              "viewer": {"displayName": viewer_name}}}

def _content(**kw):
    return bundle_to_messages(_bundle(), **kw)[0]["content"]

def _header(content):
    return content.split("\n\n", 1)[0]

# ─── 프롬프트 ────────────────────────────────────────────────────────────────

def test_계정_이름은_어느_상태에서도_넣지_않는다():
    for kw in ({}, {"first_meeting": True}, {"speaker": {"unconfirmed": True}},
               {"speaker": {"name": "민수", "l2p_data": {"relation": "친구"}}, "first_meeting": True}):
        assert "히즈키" not in _content(**kw), kw

def test_두번째_대화_얼굴_확정_전_설문은_쓰고_이름은_모른다():
    c = _content()
    assert '너는 "주휘" 이다' in c
    assert _RULE_NAME_UNKNOWN in _header(c)
    assert _RULE_FIRST_MEETING not in c
    assert "너 내 연인이잖아, 근데 이름이 뭐더라?" in c      # "나 누구야?" 처리
    assert "\n## 상대 정보\n" in c
    assert "연인" in c.split("\n## 상대 정보\n", 1)[1]        # 설문 관계는 그대로
    assert "지난주에 같이 영화 봄" in c

def test_두번째_대화_얼굴_확정되면_그_이름을_쓴다():
    c = _content(speaker={"name": "민수", "l2p_data": {"relation": "친구"}})
    assert '지금 너와 통화 중인 상대는 "민수" 이다.' in _header(c)
    assert _RULE_NAME_UNKNOWN not in c

def test_첫_대화_머리말_전문():
    expected_top = (
        '너는 "주휘" 이다. 아래 "너의 정보" 가 너 자신이다.\n'
        "지금 너와 통화 중인 상대와는 오늘 처음 대화한다. 상대의 이름은 아직 모른다.\n"
        '- "나 / 내 / 제가" 는 항상 너(주휘)를 가리킨다.\n'
        '- 상대가 "나 / 내" 라고 말하면 그것은 상대 자신을 가리킨다. 너가 아니다.\n'
        + _RULE_NAME_UNKNOWN + "\n" + _RULE_FIRST_MEETING + "\n"
    )
    c = _content(first_meeting=True)
    assert _header(c).startswith(expected_top)
    assert "연인" in c.split("\n## 상대 정보\n", 1)[1]        # 설문은 쓴다

def test_첫_대화는_얼굴_확정_화자도_무시하고_같은_프롬프트다():
    base = _content(first_meeting=True)
    face = _content(first_meeting=True,
                    speaker={"name": "민수", "l2p_data": {"memories_personal": ["민수 비밀"]},
                             "person_id": 3})
    unconfirmed = _content(first_meeting=True, speaker={"unconfirmed": True})
    assert face == base == unconfirmed
    assert "민수" not in face

# ─── 이전 대화 조회: 0건 vs 모름 ─────────────────────────────────────────────

class _Resp:
    def __init__(self, status, body):
        self.status, self._body = status, body
    async def __aenter__(self): return self
    async def __aexit__(self, *a): return False
    async def json(self): return self._body

def _sess_cls(status, body, boom=False):
    class _S:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        def get(self, *a, **kw):
            if boom:
                raise RuntimeError("network")
            return _Resp(status, body)
    return _S

@pytest.fixture
def env_on(monkeypatch):
    monkeypatch.setenv("PRETHIRD_PRIOR_CONVERSATION", "1")
    monkeypatch.setenv("ORCH_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "https://oth-path.example")

@pytest.mark.asyncio
async def test_fetch_prior_0건은_빈목록(env_on, monkeypatch):
    monkeypatch.setattr(pc.aiohttp, "ClientSession", _sess_cls(200, {"turns": [], "resetAt": 0}))
    assert await pc.fetch_prior(7, 9) == []

@pytest.mark.asyncio
@pytest.mark.parametrize("status,body,boom", [(500, {}, False), (200, {"turns": "x"}, False),
                                              (200, {}, True)])
async def test_fetch_prior_실패는_None(env_on, monkeypatch, status, body, boom):
    monkeypatch.setattr(pc.aiohttp, "ClientSession", _sess_cls(status, body, boom))
    assert await pc.fetch_prior(7, 9) is None
    assert await pc.fetch_prior_turns(7, 9) == []            # 기존 계약 유지

@pytest.mark.asyncio
async def test_fetch_prior_꺼져있으면_None(monkeypatch):
    monkeypatch.delenv("PRETHIRD_PRIOR_CONVERSATION", raising=False)
    assert await pc.fetch_prior(7, 9) is None

def _pipe():
    async def chat_fn(messages):
        yield "응"
    async def say_fn(text, se_path):
        return b""
    return DialoguePipeline(None, None, chat_fn, say_fn,
                            lambda b: (np.zeros(1, dtype=np.int16), 48000, 1),
                            lambda p, f: 0,
                            persona_messages=[{"role": "system", "content": "기본"}])

@pytest.mark.asyncio
@pytest.mark.parametrize("result,first", [([], True), (None, False),
                                          ([{"callId": "c", "role": "user", "text": "나 민수야", "at": 1}], False)])
async def test_load_prior_첫대화_판정(monkeypatch, result, first):
    async def _fetch(user_id, clone_id, exclude_call_id=None):
        return result
    monkeypatch.setattr(pc, "fetch_prior", _fetch)
    pipe = _pipe()
    await pipe.load_prior(7, 9, "abcdef012345")
    assert pipe.first_meeting is first

class _Sess:
    def __init__(self, bundle):
        self.session_id, self.user_id, self.clone_id = "abcdef012345", 7, 9192
        self.bundle, self.user_location, self.ask_region_intro = bundle, None, True
        self.persona_messages = bundle_to_messages(bundle)

@pytest.mark.asyncio
@pytest.mark.parametrize("result,swapped", [([], True), (None, False)])
async def test_signaling_첫대화면_프롬프트를_교체한다(monkeypatch, result, swapped):
    async def _fetch(user_id, clone_id, exclude_call_id=None):
        return result
    monkeypatch.setattr(pc, "fetch_prior", _fetch)
    sess = _Sess(_bundle())
    sess.pipeline = _pipe()
    before = sess.pipeline.persona_messages
    await signaling._load_prior_and_mark(sess)
    if swapped:
        assert sess.first_meeting is True
        assert sess.pipeline.persona_messages == bundle_to_messages(_bundle(), first_meeting=True)
        assert sess.persona_messages == sess.pipeline.persona_messages
    else:
        assert getattr(sess, "first_meeting", False) is False
        assert sess.pipeline.persona_messages is before

# ─── 채팅 답장 ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("prior,recent,first", [
    ([], [], True),
    ([{"callId": "c", "role": "user", "text": "안녕", "at": 1}], [], False),
    ([], [{"role": "user", "text": "안녕"}], False),
])
async def test_chat_reply_첫대화_판정(monkeypatch, prior, recent, first):
    monkeypatch.setattr(cr, "_CHAT_SECRET", "S")
    seen = {}

    async def fake_fetch_bundle(api_base, clone_id, token):
        return _bundle()

    async def fake_chat_once(messages, **kw):
        seen["system"] = messages[0]["content"]
        return "응"

    monkeypatch.setattr(cr, "fetch_bundle", fake_fetch_bundle)
    monkeypatch.setattr(cr, "chat_once", fake_chat_once)
    app = web.Application()
    cr.register_chat_reply_routes(app)
    async with TestClient(TestServer(app)) as client:
        resp = await client.post("/chat/reply", headers={"X-Internal-Secret": "S"},
                                 json={"clone_id": 9192, "user_token": "T", "text": "누구야?",
                                       "prior": prior, "recent": recent})
        assert resp.status == 200
    assert (_RULE_FIRST_MEETING in seen["system"]) is first
    assert "히즈키" not in seen["system"]
