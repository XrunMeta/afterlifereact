"""test_emotion_admin_endpoint — AFL-1072 관리자 감정 관리 endpoint."""
import json
import os
import sys
import pathlib

import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import emotion_admin_endpoint as ea  # noqa: E402

AUTH = {"Authorization": "Bearer s3cret"}


@pytest.fixture
def env(tmp_path, monkeypatch):
    bank = tmp_path / "bank"
    bank.mkdir()
    for stem, text in (("happy_ainsley", "기뻐요"), ("sad_hana", "슬퍼요"), ("warm_ainsley", "다정"),
                       ("warm_hana", "다정2"), ("angry_ainsley", "화나요"), ("angry_hana", "화2"),
                       ("angry_zed", "")):  # zed 는 txt 가 비어 후보 아님
        (bank / f"{stem}.wav").write_bytes(b"RIFF" + stem.encode())
        (bank / f"{stem}.txt").write_text(text, encoding="utf-8")
    (bank / "sad_orphan.wav").write_bytes(b"RIFFx")  # txt 없음
    monkeypatch.setenv("LEARN_SECRET", "s3cret")
    monkeypatch.setenv("PRETHIRD_EMO_BANK_DIR", str(bank))
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(tmp_path / "cfg" / "emotion_config.json"))
    return tmp_path


def _app():
    app = web.Application()
    ea.register_emotion_admin_routes(app)
    return app


@pytest.mark.asyncio
async def test_인증_거부(env, monkeypatch):
    async with TestClient(TestServer(_app())) as c:
        assert (await c.get("/oth-path")).status == 401
        assert (await c.get("/oth-path", headers={"Authorization": "Bearer x"})).status == 401
        assert (await c.put("/oth-path", json={}, headers={})).status == 401
        assert (await c.get("/oth-path")).status == 401
        monkeypatch.delenv("LEARN_SECRET")
        monkeypatch.delenv("PRETHIRD_LEARN_SECRET", raising=False)
        assert (await c.get("/oth-path", headers={"Authorization": "Bearer "})).status == 401


@pytest.mark.asyncio
async def test_GET_기본값과_후보_라벨_순번(env):
    async with TestClient(TestServer(_app())) as c:
        r = await c.get("/oth-path", headers=AUTH)
        assert r.status == 200
        j = await r.json()
    assert j["source"] == "default"
    assert j["emotions"] == ["happy", "sad", "warm", "angry"]
    assert j["config"]["voice"] == {"enabled": False, "choice": ea.DEFAULT_CHOICE}
    assert j["config"]["video"] == {"mode": "off", "clones": []}
    assert [x["label"] for x in j["candidates"]["warm"]] == ["다정1", "다정2"]
    assert [x["id"] for x in j["candidates"]["angry"]] == ["angry_ainsley", "angry_hana"]
    assert [x["label"] for x in j["candidates"]["angry"]] == ["화남1", "화남2"]
    assert j["candidates"]["happy"][0] == {"id": "happy_ainsley", "label": "기쁨1",
                                           "speaker": "ainsley", "text": "기뻐요"}
    assert [x["id"] for x in j["candidates"]["sad"]] == ["sad_hana"]  # 고아 wav 제외


@pytest.mark.asyncio
async def test_PUT_부분갱신_저장(env):
    async with TestClient(TestServer(_app())) as c:
        r = await c.put("/oth-path", headers=AUTH, json={
            "voice": {"enabled": True, "choice": {"angry": "angry_hana", "sad": None}},
            "updated_by": "a@x.com"})
        assert r.status == 200
        j = await r.json()
        assert j["source"] == "file"
        v = j["config"]["voice"]
        assert v["enabled"] is True
        assert v["choice"] == {"happy": "happy_ainsley", "sad": None, "warm": "warm_ainsley", "angry": "angry_hana"}
        assert j["config"]["updated_by"] == "a@x.com"
        assert j["config"]["updated_at"].endswith("+09:00")
        # 영상만 바꾸면 목소리는 유지
        r = await c.put("/oth-path", headers=AUTH,
                        json={"video": {"mode": "some", "clones": ["12", "preset-3", "12"]}})
        j = await r.json()
        assert j["config"]["voice"]["enabled"] is True
        assert j["config"]["video"] == {"mode": "some", "clones": ["12", "preset-3"]}
        assert (await (await c.get("/oth-path", headers=AUTH)).json())["config"] == j["config"]
    saved = json.loads(pathlib.Path(os.environ["EMOTION_CONFIG_PATH"]).read_text(encoding="utf-8"))
    assert saved["voice"]["choice"]["angry"] == "angry_hana"


@pytest.mark.asyncio
@pytest.mark.parametrize("body", [
    {"voice": {"enabled": "yes"}},
    {"voice": {"choice": {"angry": "happy_ainsley"}}},   # 다른 감정 파일
    {"voice": {"choice": {"angry": "angry_zed"}}},       # 후보 아님(txt 비어있음)
    {"voice": {"choice": {"neutral": "happy_ainsley"}}},
    {"voice": {"choice": {"happy": "../etc/passwd"}}},
    {"video": {"mode": "maybe"}},
    {"video": {"clones": "1"}},
    {"video": {"clones": ["abc"]}},
    {"video": {"clones": [1]}},
    {"video": {"clones": [str(i) for i in range(501)]}},
    {"updated_by": 5},
    {"video": {"clones": ["123\n"]}},   # $ 가 아닌 fullmatch
    [],
])
async def test_PUT_검증_실패_400_저장_안됨(env, body):
    async with TestClient(TestServer(_app())) as c:
        assert (await c.put("/oth-path", headers=AUTH, json={"voice": {"enabled": False}})).status == 200
        before = pathlib.Path(os.environ["EMOTION_CONFIG_PATH"]).read_text(encoding="utf-8")
        r = await c.put("/oth-path", headers=AUTH, json=body)
        assert r.status == 400
        assert (await r.json())["code"] == "INVALID_BODY"
    assert pathlib.Path(os.environ["EMOTION_CONFIG_PATH"]).read_text(encoding="utf-8") == before


@pytest.mark.asyncio
async def test_PUT_JSON_아님_400(env):
    async with TestClient(TestServer(_app())) as c:
        r = await c.put("/oth-path", headers=AUTH, data=b"{nope")
        assert r.status == 400


@pytest.mark.asyncio
async def test_clones_500개는_허용(env):
    async with TestClient(TestServer(_app())) as c:
        r = await c.put("/oth-path", headers=AUTH,
                        json={"voice": {"enabled": False},
                              "video": {"mode": "some", "clones": [str(i) for i in range(500)]}})
        assert r.status == 200


@pytest.mark.asyncio
async def test_샘플_재생과_경로탈출_404(env):
    async with TestClient(TestServer(_app())) as c:
        r = await c.get("/oth-path", headers=AUTH)
        assert r.status == 200
        assert r.headers["Content-Type"].startswith("audio/wav")
        assert r.headers["Cache-Control"] == "no-store"
        assert await r.read() == b"RIFFwarm_hana"
        for bad in ("angry_zed", "sad_orphan", "nope_x", "..%2Fetc%2Fpasswd", "happy_ainsley%0A", "Happy_ainsley", "happy_ainsley.wav"):
            r = await c.get(f"/oth-path", headers=AUTH)
            assert r.status == 404, bad


@pytest.mark.asyncio
async def test_원자적_저장_실패시_원본_유지(env, monkeypatch):
    async with TestClient(TestServer(_app())) as c:
        await c.put("/oth-path", headers=AUTH, json={"voice": {"enabled": True}})
        path = pathlib.Path(os.environ["EMOTION_CONFIG_PATH"])
        before = path.read_text(encoding="utf-8")

        def boom(src, dst):
            raise OSError("disk")
        monkeypatch.setattr(ea.os, "replace", boom)
        r = await c.put("/oth-path", headers=AUTH, json={"voice": {"enabled": False}})
        assert r.status == 500
    assert path.read_text(encoding="utf-8") == before
    assert [p.name for p in path.parent.iterdir()] == ["emotion_config.json"]  # tmp 잔재 없음


@pytest.mark.asyncio
async def test_깨진_파일은_기본값(env):
    p = pathlib.Path(os.environ["EMOTION_CONFIG_PATH"])
    p.parent.mkdir()
    p.write_text("{bad", encoding="utf-8")
    async with TestClient(TestServer(_app())) as c:
        j = await (await c.get("/oth-path", headers=AUTH)).json()
    assert j["source"] == "default"


@pytest.mark.asyncio
async def test_파일_없을때_enabled_없으면_409(env):
    async with TestClient(TestServer(_app())) as c:
        for body in ({"video": {"mode": "all"}}, {"voice": {"choice": {"sad": None}}}, {}):
            r = await c.put("/oth-path", headers=AUTH, json=body)
            assert r.status == 409
            assert (await r.json())["code"] == "VOICE_UNSET"
    assert not pathlib.Path(os.environ["EMOTION_CONFIG_PATH"]).exists()


@pytest.mark.asyncio
async def test_첫_저장은_choice_4감정_모두_채움(env):
    (pathlib.Path(os.environ["PRETHIRD_EMO_BANK_DIR"]) / "sad_hana.wav").unlink()  # 기본 후보 하나 없음
    async with TestClient(TestServer(_app())) as c:
        r = await c.put("/oth-path", headers=AUTH,
                        json={"voice": {"enabled": True, "choice": {"angry": "angry_hana"}}})
        assert r.status == 200
        ch = (await r.json())["config"]["voice"]["choice"]
    assert ch == {"happy": "happy_ainsley", "sad": None, "warm": "warm_ainsley", "angry": "angry_hana"}


@pytest.mark.asyncio
async def test_enabled가_bool_아닌_파일은_default(env):
    p = pathlib.Path(os.environ["EMOTION_CONFIG_PATH"])
    p.parent.mkdir()
    p.write_text(json.dumps({"voice": {"enabled": "yes", "choice": {}},
                             "video": {"mode": "off", "clones": []}}), encoding="utf-8")
    async with TestClient(TestServer(_app())) as c:
        j = await (await c.get("/oth-path", headers=AUTH)).json()
    assert j["source"] == "default"


def test_은행_디렉터리_env_폴백(monkeypatch):
    monkeypatch.delenv("PRETHIRD_EMO_BANK_DIR", raising=False)
    monkeypatch.setenv("COSYVOICE_EMO_BANK_DIR", "/x/cosy")
    assert ea._bank_dir() == "/x/cosy"
    monkeypatch.delenv("COSYVOICE_EMO_BANK_DIR")
    assert ea._bank_dir() == "/data/emo_bank_20261030"
