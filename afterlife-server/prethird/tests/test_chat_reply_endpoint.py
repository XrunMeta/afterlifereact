"""test_chat_reply_endpoint — AFL-1018 앱 채팅 답장(/chat/reply).

통화와 같은 GPT·같은 페르소나 프롬프트로 채팅 답을 만든다. 이전 대화(통화+채팅)는
Worker 가 조립해 넘기고, 지금 채팅의 최근 주고받은 말은 user/assistant 로 이어 붙인다.
"""
import sys, pathlib
import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import chat_reply_endpoint as cr  # noqa: E402

DAY1 = 1_759_280_400_000   # 2025-10-01 10:00 KST (ms)


def _app():
    app = web.Application()
    cr.register_chat_reply_routes(app)
    return app


def test_build_messages_order_persona_prior_recent_user():
    persona = [{"role": "system", "content": "너는 할배"}]
    prior = [{"callId": "c1", "role": "user", "text": "고추 땄어", "at": DAY1}]
    recent = [{"role": "user", "text": "밥 먹었어?"}, {"role": "clone", "text": "먹었다"}]
    msgs = cr.build_chat_messages(persona, prior, recent, "뭐 먹었어?", max_chars=16000)
    assert msgs[0] == persona[0]
    assert msgs[1]["role"] == "system" and "고추 땄어" in msgs[1]["content"]
    assert msgs[2:] == [
        {"role": "user", "content": "밥 먹었어?"},
        {"role": "assistant", "content": "먹었다"},
        {"role": "user", "content": "뭐 먹었어?"},
    ]


def test_build_messages_recent_starting_with_clone_and_empty_prior():
    msgs = cr.build_chat_messages([], [], [{"role": "clone", "text": "왔니"}], "응", max_chars=0)
    assert msgs == [
        {"role": "assistant", "content": "왔니"},
        {"role": "user", "content": "응"},
    ]


@pytest.mark.asyncio
async def test_rejects_without_secret_even_when_env_unset(monkeypatch):
    monkeypatch.setattr(cr, "_CHAT_SECRET", "")
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/chat/reply", json={"clone_id": 1, "text": "hi"})
        assert resp.status == 503


@pytest.mark.asyncio
async def test_rejects_wrong_secret(monkeypatch):
    monkeypatch.setattr(cr, "_CHAT_SECRET", "S")
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/chat/reply", headers={"X-Internal-Secret": "x"},
                                 json={"clone_id": 1, "text": "hi"})
        assert resp.status == 401


@pytest.mark.asyncio
async def test_reply_uses_bundle_persona_and_default_llm(monkeypatch):
    monkeypatch.setattr(cr, "_CHAT_SECRET", "S")
    seen = {}

    async def fake_fetch_bundle(api_base, clone_id, token):
        seen["bundle"] = (clone_id, token)
        return {"personaBundle": {"cloneId": str(clone_id), "persona": {"displayName": "할배"}}}

    async def fake_chat_once(messages, model=None, temperature=None, fmt=None, num_predict=None):
        seen["messages"] = messages
        seen["model"] = model
        return "  오냐, 잘 왔다  "

    monkeypatch.setattr(cr, "fetch_bundle", fake_fetch_bundle)
    monkeypatch.setattr(cr, "chat_once", fake_chat_once)
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post(
            "/chat/reply",
            headers={"X-Internal-Secret": "S"},
            json={"clone_id": 9043, "user_token": "T", "text": "할아버지",
                  "prior": [], "recent": []},
        )
        assert resp.status == 200
        assert (await resp.json()) == {"reply": "오냐, 잘 왔다"}
    assert seen["bundle"] == (9043, "T")
    assert seen["model"] is None          # 통화와 같은 기본 모델
    assert seen["messages"][-1] == {"role": "user", "content": "할아버지"}
    assert seen["messages"][0]["role"] == "system"


@pytest.mark.asyncio
async def test_bundle_missing_is_502(monkeypatch):
    monkeypatch.setattr(cr, "_CHAT_SECRET", "S")

    async def none_bundle(api_base, clone_id, token):
        return None

    monkeypatch.setattr(cr, "fetch_bundle", none_bundle)
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/chat/reply", headers={"X-Internal-Secret": "S"},
                                 json={"clone_id": 1, "user_token": "T", "text": "hi"})
        assert resp.status == 502


@pytest.mark.asyncio
async def test_bad_input_400(monkeypatch):
    monkeypatch.setattr(cr, "_CHAT_SECRET", "S")
    async with TestClient(TestServer(_app())) as client:
        for body in ({"clone_id": 1, "user_token": "T", "text": ""},
                     {"clone_id": "x", "user_token": "T", "text": "hi"},
                     {"clone_id": 1, "text": "hi"},
                     {"clone_id": 1, "user_token": "T", "text": "a" * 4001}):
            resp = await client.post("/chat/reply", headers={"X-Internal-Secret": "S"}, json=body)
            assert resp.status == 400, body


def test_build_messages_caps_each_item_length():
    long = "가" * 5000
    msgs = cr.build_chat_messages([], [], [{"role": "user", "text": long}], "응", max_chars=0)
    assert len(msgs[0]["content"]) == cr._MAX_ITEM_CHARS


# AFL-1031 (2026-10-22): Worker 가 관리자 설정 채팅 모델을 `model` 로 넘기면 그 모델로 답한다.
@pytest.mark.asyncio
async def test_reply_uses_model_from_worker(monkeypatch):
    monkeypatch.setattr(cr, "_CHAT_SECRET", "S")
    seen = []

    async def fake_fetch_bundle(api_base, clone_id, token):
        return {"personaBundle": {"cloneId": str(clone_id), "persona": {"displayName": "할배"}}}

    async def fake_chat_once(messages, model=None, temperature=None, fmt=None, num_predict=None):
        seen.append(model)
        return "응"

    monkeypatch.setattr(cr, "fetch_bundle", fake_fetch_bundle)
    monkeypatch.setattr(cr, "chat_once", fake_chat_once)
    async with TestClient(TestServer(_app())) as client:
        for model in ("gpt-5-nano", "openai:gpt-4o-mini", "bad model!", "x" * 101, 5, ""):
            resp = await client.post(
                "/chat/reply", headers={"X-Internal-Secret": "S"},
                json={"clone_id": 1, "user_token": "T", "text": "hi", "model": model})
            assert resp.status == 200, model
    # 이상한 값(공백·특수문자·너무 김·문자열 아님·빈 값)은 무시하고 기본 모델(None)로 답한다.
    assert seen == ["gpt-5-nano", "openai:gpt-4o-mini", None, None, None, None]
