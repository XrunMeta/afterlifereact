"""test_verify_learn — /oth-path·/oth-path 단위.

T-110 Phase2: verify_learn 이 프로덕션 학습 경로(clone_dialog.extract_l2 + dev ont-merge)를
그대로 타므로, ce.extract_l2 / ce._dev_ont_data / ce._ont_merge / ce._resolve_user_id 를 monkeypatch.
/oth-path 은 기존 _patch_l2 경로 그대로(변경 없음).
"""
import sys, pathlib
import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import chat_endpoint as ce  # noqa: E402


def _app():
    app = web.Application()
    ce.register_verify_routes(app)
    return app


def _stub_dev_secret(monkeypatch):
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")


async def _fake_resolve_user_id(token):
    return 42


@pytest.mark.asyncio
async def test_learn_extracts_and_saves(monkeypatch):
    """단일 turn 쌍 → extract_l2 1회 호출 → ont-merge 1회 호출 → before/extracted/after 반환."""
    _stub_dev_secret(monkeypatch)
    monkeypatch.setattr(ce, "_resolve_user_id", _fake_resolve_user_id)

    async def fake_dev_ont_data(clone_id, user_id):
        return {"relation": "친구"}

    calls = []

    async def fake_extract_l2(user_text, clone_reply):
        calls.append((user_text, clone_reply))
        return {"preference_personal": {"취향": "제주 여행"}}

    merged = {}

    async def fake_ont_merge(clone_id, user_id, extracted):
        merged.update(extracted)
        return {"relation": "친구", "preference_personal": {"취향": "제주 여행"}}

    monkeypatch.setattr(ce, "_dev_ont_data", fake_dev_ont_data)
    monkeypatch.setattr(ce, "extract_l2", fake_extract_l2)
    monkeypatch.setattr(ce, "_ont_merge", fake_ont_merge)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 9043, "turns": [
                {"role": "user", "content": "나 제주 다녀왔어"},
                {"role": "assistant", "content": "좋았겠다!"}]})
        assert resp.status == 200
        body = await resp.json()

    assert calls == [("나 제주 다녀왔어", "좋았겠다!")]
    assert body["before"] == {"relation": "친구"}
    assert body["extracted"] == [{
        "user_text": "나 제주 다녀왔어", "clone_reply": "좋았겠다!",
        "extracted": {"preference_personal": {"취향": "제주 여행"}},
    }]
    assert body["after"]["preference_personal"] == {"취향": "제주 여행"}
    assert merged == {"preference_personal": {"취향": "제주 여행"}}


@pytest.mark.asyncio
async def test_learn_does_not_leak_clone_speech_as_user_fact(monkeypatch):
    """콜라(사용자 발화) vs 막걸리(클론 제안) — extract_l2 는 화자분리로 USER 사실만 뽑으므로,
    verify_learn 이 그 결과를 그대로 ont-merge 로 넘길 때 클론 발화(막걸리)가 섞이지 않아야 한다.
    이 테스트는 extract_l2 자체(clone_dialog)가 아니라 verify_learn의 호출 인자·전달 경로를 검증한다:
    extract_l2 스텁이 '콜라'만 반환하도록 하고, ont-merge 로 넘어간 extracted 에 '막걸리'가 없음을 확인.
    """
    _stub_dev_secret(monkeypatch)
    monkeypatch.setattr(ce, "_resolve_user_id", _fake_resolve_user_id)

    async def fake_dev_ont_data(clone_id, user_id):
        return {}

    seen_args = []

    async def fake_extract_l2(user_text, clone_reply):
        seen_args.append((user_text, clone_reply))
        # 프로덕션 extract_l2 는 USER 발화만 근거로 추출 — 클론이 제안한 "막걸리"는 무시하고
        # 사용자가 실제 말한 "콜라"만 반환하는 상황을 스텁으로 재현.
        return {"preference_personal": {"음료": "콜라"}}

    merge_calls = []

    async def fake_ont_merge(clone_id, user_id, extracted):
        merge_calls.append(extracted)
        return {"preference_personal": {"음료": "콜라"}}

    monkeypatch.setattr(ce, "_dev_ont_data", fake_dev_ont_data)
    monkeypatch.setattr(ce, "extract_l2", fake_extract_l2)
    monkeypatch.setattr(ce, "_ont_merge", fake_ont_merge)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 9043, "turns": [
                {"role": "user", "content": "콜라 좋아해"},
                {"role": "assistant", "content": "자네는 막걸리를 좋아하는구려"}]})
        assert resp.status == 200
        body = await resp.json()

    # extract_l2 는 (user_text, clone_reply) 둘 다 받지만(문맥용) 화자 표시가 없다 —
    # 그 분리 책임은 extract_l2(clone_dialog) 안에 있고, verify_learn 은 결과를 그대로 신뢰해 전달한다.
    assert seen_args == [("콜라 좋아해", "자네는 막걸리를 좋아하는구려")]
    assert merge_calls == [{"preference_personal": {"음료": "콜라"}}]
    for ex in merge_calls:
        assert "막걸리" not in str(ex)
    assert "막걸리" not in str(body["after"])
    assert body["extracted"][0]["extracted"] == {"preference_personal": {"음료": "콜라"}}


@pytest.mark.asyncio
async def test_learn_multiturn_sequential_merge(monkeypatch):
    """멀티턴: user 턴마다 순서대로 extract_l2 → ont-merge, 마지막 after 반환."""
    _stub_dev_secret(monkeypatch)
    monkeypatch.setattr(ce, "_resolve_user_id", _fake_resolve_user_id)

    async def fake_dev_ont_data(clone_id, user_id):
        return {}

    extract_calls = []

    async def fake_extract_l2(user_text, clone_reply):
        extract_calls.append((user_text, clone_reply))
        return {"memories_personal": [user_text]}

    merge_order = []

    async def fake_ont_merge(clone_id, user_id, extracted):
        merge_order.append(extracted["memories_personal"][0])
        return {"memories_personal": list(merge_order)}

    monkeypatch.setattr(ce, "_dev_ont_data", fake_dev_ont_data)
    monkeypatch.setattr(ce, "extract_l2", fake_extract_l2)
    monkeypatch.setattr(ce, "_ont_merge", fake_ont_merge)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 9043, "turns": [
                {"role": "user", "content": "첫턴"},
                {"role": "assistant", "content": "응1"},
                {"role": "user", "content": "둘째턴"},
                {"role": "assistant", "content": "응2"},
            ]})
        assert resp.status == 200
        body = await resp.json()

    assert extract_calls == [("첫턴", "응1"), ("둘째턴", "응2")]
    assert merge_order == ["첫턴", "둘째턴"]
    assert body["after"]["memories_personal"] == ["첫턴", "둘째턴"]
    assert len(body["extracted"]) == 2


@pytest.mark.asyncio
async def test_learn_no_user_turn_is_noop(monkeypatch):
    """user 턴이 없으면 extract_l2/ont-merge 호출 없이 before==after."""
    _stub_dev_secret(monkeypatch)
    monkeypatch.setattr(ce, "_resolve_user_id", _fake_resolve_user_id)

    async def fake_dev_ont_data(clone_id, user_id):
        return {"relation": "친구"}

    called = {"extract": False, "merge": False}

    async def fake_extract_l2(user_text, clone_reply):
        called["extract"] = True
        return {}

    async def fake_ont_merge(clone_id, user_id, extracted):
        called["merge"] = True
        return {}

    monkeypatch.setattr(ce, "_dev_ont_data", fake_dev_ont_data)
    monkeypatch.setattr(ce, "extract_l2", fake_extract_l2)
    monkeypatch.setattr(ce, "_ont_merge", fake_ont_merge)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 9043, "turns": [{"role": "assistant", "content": "인사"}]})
        assert resp.status == 200
        body = await resp.json()

    assert called == {"extract": False, "merge": False}
    assert body["before"] == body["after"] == {"relation": "친구"}
    assert body["extracted"] == []


@pytest.mark.asyncio
async def test_learn_no_token_401():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", json={"clone_id": 1, "turns": []})
        assert resp.status == 401


@pytest.mark.asyncio
async def test_learn_bad_clone_id_400():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": "../x", "turns": []})
        assert resp.status == 400


@pytest.mark.asyncio
async def test_learn_no_dev_secret_503(monkeypatch):
    """DEV_SECRET 미설정 시 학습 시도조차 하지 않고 503(ont-raw/ont-merge 모두 DEV_SECRET 필요)."""
    monkeypatch.setattr(ce, "_DEV_SECRET", "")
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 1, "turns": [{"role": "user", "content": "x"}]})
        assert resp.status == 503


@pytest.mark.asyncio
async def test_learn_cannot_resolve_user_401(monkeypatch):
    _stub_dev_secret(monkeypatch)

    async def fake_resolve_none(token):
        return None
    monkeypatch.setattr(ce, "_resolve_user_id", fake_resolve_none)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 1, "turns": [{"role": "user", "content": "x"}]})
        assert resp.status == 401


@pytest.mark.asyncio
async def test_learn_rejects_oversized_turns():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 1, "turns": [{"role": "user", "content": "A" * 2001}]})
        assert resp.status == 400


@pytest.mark.asyncio
async def test_l2_reset(monkeypatch):
    """verify_l2-reset 은 변경 없음(구4필드 _patch_l2 그대로) — 회귀 확인용."""
    saved = {}
    async def fake_patch_l2(clone_id, fields, token):
        saved.update(fields); return fields
    monkeypatch.setattr(ce, "_patch_l2", fake_patch_l2)
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"}, json={"clone_id": 9043})
        assert resp.status == 200
    assert saved == {"memory_summary": "", "relationship": "", "context": "", "recent_topics": ""}
