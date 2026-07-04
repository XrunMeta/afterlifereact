import pytest
from aiohttp.test_utils import TestClient, TestServer
import app as labapp
from registry import KnobsRegistry
from artifact_store import ArtifactStore

@pytest.mark.asyncio
async def test_knobs_get_post(tmp_path):
    r = KnobsRegistry()
    store = ArtifactStore(str(tmp_path))
    application = labapp.build_app(r, factory=None, store=store)
    client = TestClient(TestServer(application))
    await client.start_server()
    try:
        resp = await client.get("/knobs")
        assert resp.status == 200
        data = await resp.json()
        assert data["tts"]["speed"] == 1.0

        resp = await client.post("/knobs", json={"tts": {"speed": 1.7}})
        assert resp.status == 200
        merged = await resp.json()
        assert merged["tts"]["speed"] == 1.7
        assert r.get().tts.speed == 1.7
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_runs_list_endpoint(tmp_path):
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    rid1 = store.new_run(); rid2 = store.new_run(); store.pin(rid1)
    application = labapp.build_app(r, factory=None, store=store)
    client = TestClient(TestServer(application))
    await client.start_server()
    try:
        resp = await client.get("/runs")
        assert resp.status == 200
        runs = {x["run_id"]: x for x in await resp.json()}
        assert runs[rid1]["pinned"] is True
        assert runs[rid2]["pinned"] is False
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_healthz_present(tmp_path):
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    application = labapp.build_app(r, factory=None, store=store)
    client = TestClient(TestServer(application))
    await client.start_server()
    try:
        resp = await client.get("/healthz")   # make_app 제공
        assert resp.status == 200
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_replay_tts_reuses_pinned_text(tmp_path):
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    rid = store.new_run(); store.save_text(rid, "llm.txt", "다시 말해줘")

    async def fake_say(text, se_path=None):
        assert text == "다시 말해줘"
        return b"NEWWAV"
    application = labapp.build_app(r, factory=None, store=store, say_fn=fake_say)
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/replay/tts", json={"run_id": rid})
        assert resp.status == 200
        assert store.load_bytes(rid, "answer.wav") == b"NEWWAV"
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_replay_tts_rejects_invalid_run_id(tmp_path):
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))

    async def fake_say(text, se_path=None):
        raise AssertionError("run_id 검증 없이 say_fn 호출됨 — 회귀")
    application = labapp.build_app(r, factory=None, store=store, say_fn=fake_say)
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/replay/tts", json={"run_id": "../etc"})
        assert resp.status == 400
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_replay_fifth_rejects_invalid_run_id(tmp_path):
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    application = labapp.build_app(r, factory=None, store=store, render_url="http://x:8810")
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/replay/fifth", json={"run_id": "../../etc/passwd"})
        assert resp.status == 400
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_replay_tts_missing_llm_txt_returns_404(tmp_path):
    # el S12b MINOR: 무발화턴(llm.txt 미기록) → 500 대신 404.
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    rid = store.new_run()   # llm.txt 저장 없이 run만 생성

    async def fake_say(text, se_path=None):
        raise AssertionError("llm.txt 없는데 say_fn 호출됨 — 회귀")
    application = labapp.build_app(r, factory=None, store=store, say_fn=fake_say)
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/replay/tts", json={"run_id": rid})
        assert resp.status == 404
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_replay_fifth_missing_answer_wav_returns_404(tmp_path, monkeypatch):
    # el S12b MINOR: 무발화턴(answer.wav 미기록) → 500 대신 404.
    import harness
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    rid = store.new_run()   # answer.wav 저장 없이 run만 생성

    def _boom(*a, **kw):
        raise AssertionError("answer.wav 없는데 렌더러가 생성됨 — 회귀")
    monkeypatch.setattr(harness, "KnobsFifthInproc", _boom)

    application = labapp.build_app(r, factory=None, store=store, render_url="http://x:8810")
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/replay/fifth", json={"run_id": rid})
        assert resp.status == 404
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_replay_fifth_busy_guard_returns_409(tmp_path, monkeypatch):
    import harness
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    rid = store.new_run(); store.save_bytes(rid, "answer.wav", b"RIFF...")

    class _BusyGuard:
        def assert_free(self):
            from live_guard import LiveBusyError
            raise LiveBusyError("라이브 통화 1건 활성")

    def _boom(*a, **kw):
        raise AssertionError("guard busy인데 렌더러가 생성됨 — 회귀")
    monkeypatch.setattr(harness, "KnobsFifthInproc", _boom)

    application = labapp.build_app(r, factory=None, store=store,
                                    render_url="http://x:8810", guard=_BusyGuard())
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/replay/fifth", json={"run_id": rid})
        assert resp.status == 409
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_replay_fifth_renders_pinned_wav(tmp_path, monkeypatch):
    import harness
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    rid = store.new_run(); store.save_bytes(rid, "answer.wav", b"RIFF...")

    calls = {}
    class _FakeRenderer:
        def __init__(self, video_path, registry, clone_id=None, render_url=None):
            calls["video_path"] = video_path
            calls["render_url"] = render_url
        def load(self):
            calls["loaded"] = True
        def infer(self, wav_path, on_frame, video_path=None):
            calls["wav_path"] = wav_path
            on_frame(None); on_frame(None)
            return 2
    monkeypatch.setattr(harness, "KnobsFifthInproc", _FakeRenderer)

    application = labapp.build_app(r, factory=None, store=store, render_url="http://x:8810")
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/replay/fifth", json={"run_id": rid, "video_path": "/f.jpg"})
        assert resp.status == 200
        body = await resp.json()
        assert body["frames"] == 2
        assert calls["render_url"] == "http://x:8810"
        assert calls["wav_path"].endswith("answer.wav")
    finally:
        await client.close()
