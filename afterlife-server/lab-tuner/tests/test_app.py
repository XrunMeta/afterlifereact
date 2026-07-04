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

@pytest.mark.asyncio
async def test_promote_preview_smoke(tmp_path):
    # 계획서 Task 14 Step 5 스모크: POST /oth-path → 200 + list.
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    r.update({"tts": {"speed": 1.7}})
    application = labapp.build_app(r, factory=None, store=store)
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/promote/preview")
        assert resp.status == 200
        body = await resp.json()
        assert isinstance(body["entries"], list)
        speeds = [e for e in body["entries"] if e["env"] == "PRETHIRD_TTS_SPEED"]
        assert speeds and speeds[0]["new"] == "1.7"
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_promote_apply_without_confirm_forces_dry_run(tmp_path):
    # ⚠️ confirm:true 없이 호출 → 반드시 dry_run 강제(라이브 파일 절대 미변경).
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    r.update({"tts": {"speed": 1.9}})
    application = labapp.build_app(r, factory=None, store=store)
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/promote/apply", json={})
        assert resp.status == 200
        body = await resp.json()
        assert body["dry_run"] is True
        assert body["backup_ids"] == []
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_promote_apply_excludes_container_entries_from_applicable(tmp_path):
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    r.update({"fifth": {"cfg_scale": 3.5}})   # container=True 항목
    application = labapp.build_app(r, factory=None, store=store)
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/promote/apply", json={})
        assert resp.status == 200
        body = await resp.json()
        assert body["dry_run"] is True
        warned = [w["env"] for w in body["container_warnings"]]
        assert "FIFTH_CFG_SCALE" in warned
        # container 항목은 "planned"(applicable) 목록에 없어야 함(dry_run 응답의 planned에도 미포함).
        planned_envs = [p["env"] for p in body.get("planned", [])]
        assert "FIFTH_CFG_SCALE" not in planned_envs
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_promote_rollback_invalid_backup_id_returns_400(tmp_path):
    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    application = labapp.build_app(r, factory=None, store=store)
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/promote/rollback", json={"backup_id": "not-a-real-backup"})
        assert resp.status == 400
    finally:
        await client.close()

@pytest.mark.asyncio
async def test_promote_restart_without_two_step_confirm_returns_400(tmp_path, monkeypatch):
    # subprocess가 절대 호출되지 않음을 보장 — 2단계 확인 미충족 시 400로 조기 반환.
    import subprocess as _subprocess

    def _boom(*a, **kw):
        raise AssertionError("2단계 확인 없이 subprocess.run 호출됨 — 회귀(실 restart 위험)")
    monkeypatch.setattr(_subprocess, "run", _boom)

    r = KnobsRegistry(); store = ArtifactStore(str(tmp_path))
    application = labapp.build_app(r, factory=None, store=store)
    client = TestClient(TestServer(application)); await client.start_server()
    try:
        resp = await client.post("/promote/restart", json={"confirm": "RESTART"})   # confirm2 없음
        assert resp.status == 400
    finally:
        await client.close()
