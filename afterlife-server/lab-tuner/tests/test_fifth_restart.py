"""fifth 렌더서버 env 반영(drop-in 조립) 단위 테스트.

왜 이 기능이 필요한가
---------------------
fifth/flp 노브 24종은 렌더서버가 **기동 시 1회** 읽는 env 다(cfg_scale 은 아예
JoyVASA 모델 생성자 인자라 요청별로 못 바꾼다). 그래서 랩에서 값을 바꿔도
/render body 로도, promote apply 로도(container=True 라 제외) 반영되지 않았다.
UI 는 "재기동 필요"라 안내하지만 그 재기동 버튼은 prethird 를 재기동한다 —
fifth 와 무관해서 아무 일도 일어나지 않는다(2026-08-18 히즈키 보고).

반영 경로가 있다는 근거(실측)
-----------------------------
env 가 서비스 파일 ExecStart 안에 **인라인 export** 로 박혀 있다. 컨테이너를
재생성할 필요 없이 서비스만 재시작하면 새 값으로 뜬다.

    ExecStart=/usr/bin/docker exec fifth_poc_flp bash -c 'cd /root/FasterLivePortrait \
      && export LD_LIBRARY_PATH=... FIFTH_CFG_SCALE=2.0 ... && exec python fifth_render_server.py'

🔴 systemd drop-in 의 Environment= 로는 안 된다 — docker exec 는 호스트 env 를
컨테이너로 전달하지 않는다. ExecStart 자체를 재정의해야 한다.

🔴 그래서 노브 값이 **bash -c 문자열 안으로 들어간다** = 셸 인젝션 표면이다.
값 검증은 선택이 아니라 필수다.
"""
import pytest

import promote


# 2026-08-18 서버 실측 원문(systemctl cat afterlife-fifth-render.service).
REAL_EXEC = (
    "/usr/bin/docker exec fifth_poc_flp bash -c 'cd /root/FasterLivePortrait && "
    "export LD_LIBRARY_PATH=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib "
    "FIFTH_CFG_YAML=configs/trt_infer.yaml FIFTH_LIP_OPEN=0.24 FIFTH_CFG_SCALE=2.0 "
    "FIFTH_BLINK=1 FIFTH_HEAD_SMOOTH=3.5 FIFTH_EYE_SOURCE_LOCK=1 "
    "FIFTH_EYE_TARGET_SCALE=0.8 && exec /root/miniconda3/bin/python fifth_render_server.py'"
)


def _exec_line(dropin: str) -> str:
    """drop-in 에서 재정의된 ExecStart 한 줄(비우기 줄 제외)을 꺼낸다."""
    lines = [l for l in dropin.splitlines() if l.startswith("ExecStart=") and l.strip() != "ExecStart="]
    assert len(lines) == 1, dropin
    return lines[0][len("ExecStart="):]


# --- 값 교체 -------------------------------------------------------------

def test_기존_env_값을_바꾼다():
    out = promote.build_fifth_dropin(REAL_EXEC, {"FIFTH_CFG_SCALE": "3.5"})
    cmd = _exec_line(out)
    assert "FIFTH_CFG_SCALE=3.5" in cmd
    assert "FIFTH_CFG_SCALE=2.0" not in cmd


def test_없던_env_를_추가한다():
    """ExecStart 에 아직 없는 키(FIFTH_DRIVING_MULTIPLIER 등)도 넣을 수 있어야 한다."""
    out = promote.build_fifth_dropin(REAL_EXEC, {"FIFTH_DRIVING_MULTIPLIER": "1.4"})
    cmd = _exec_line(out)
    assert "FIFTH_DRIVING_MULTIPLIER=1.4" in cmd
    assert "FIFTH_CFG_SCALE=2.0" in cmd          # 기존 값은 그대로


def test_명령의_나머지_부분을_보존한다():
    """cd·LD_LIBRARY_PATH·exec 실행부가 하나라도 어긋나면 렌더서버가 안 뜬다."""
    cmd = _exec_line(promote.build_fifth_dropin(REAL_EXEC, {"FIFTH_BLINK": "0"}))
    assert cmd.startswith("/usr/bin/docker exec fifth_poc_flp bash -c 'cd /root/FasterLivePortrait")
    assert "LD_LIBRARY_PATH=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib" in cmd
    assert cmd.endswith("&& exec /root/miniconda3/bin/python fifth_render_server.py'")
    assert "FIFTH_CFG_YAML=configs/trt_infer.yaml" in cmd


def test_dropin_은_ExecStart_를_먼저_비운다():
    """systemd 는 ExecStart 가 누적된다 — 비우지 않으면 두 번 실행된다."""
    out = promote.build_fifth_dropin(REAL_EXEC, {"FIFTH_BLINK": "0"})
    body = [l for l in out.splitlines() if l.strip()]
    assert body[0] == "[Service]"
    assert body[1] == "ExecStart="          # 비우기가 재정의보다 먼저여야 한다


def test_여러_키를_한번에():
    out = promote.build_fifth_dropin(REAL_EXEC, {
        "FIFTH_CFG_SCALE": "3.0", "FIFTH_DRIVING_MULTIPLIER": "1.2",
        "FIFTH_EYE_SOURCE_LOCK": "0",
    })
    cmd = _exec_line(out)
    assert "FIFTH_CFG_SCALE=3.0" in cmd
    assert "FIFTH_DRIVING_MULTIPLIER=1.2" in cmd
    assert "FIFTH_EYE_SOURCE_LOCK=0" in cmd
    assert "FIFTH_EYE_SOURCE_LOCK=1" not in cmd


def test_빈_업데이트는_거부():
    """바꿀 게 없는데 drop-in 을 쓰면 라이브 렌더를 공연히 재기동하게 된다."""
    with pytest.raises(ValueError):
        promote.build_fifth_dropin(REAL_EXEC, {})


# --- 🔴 셸 인젝션 차단 ----------------------------------------------------

@pytest.mark.parametrize("bad", [
    "1.0; rm -rf /", "1.0 && curl evil", "$(whoami)", "`id`", "1.0'", '1.0"',
    "1.0\nExecStart=/bin/sh", "1.0|tee", "a b",
])
def test_위험한_값은_거부한다(bad):
    """값이 bash -c 문자열 안으로 들어가므로 화이트리스트 통과가 필수다."""
    with pytest.raises(promote.UnsafeEnvValueError):
        promote.build_fifth_dropin(REAL_EXEC, {"FIFTH_CFG_SCALE": bad})


@pytest.mark.parametrize("bad", ["FIFTH CFG", "FIFTH;X", "FIFTH=X", "", "fifth-cfg"])
def test_위험한_키도_거부한다(bad):
    with pytest.raises(promote.UnsafeEnvValueError):
        promote.build_fifth_dropin(REAL_EXEC, {bad: "1.0"})


# --- 구조가 바뀌면 손대지 않는다 -------------------------------------------

@pytest.mark.parametrize("broken", [
    "/usr/bin/docker exec fifth_poc_flp bash -c 'cd /x && exec python s.py'",   # export 없음
    "/usr/bin/docker exec fifth_poc_flp bash -c 'export A=1'",                  # exec 없음
    "",
])
def test_예상과_다른_ExecStart_는_거부한다(broken):
    """서비스 정의가 바뀐 뒤 옛 가정으로 덮어쓰면 라이브 렌더가 안 뜬다.

    못 알아보면 **아무것도 하지 않는 쪽**이 옳다 — 반쯤 맞는 조립보다 낫다.
    """
    with pytest.raises(ValueError):
        promote.build_fifth_dropin(broken, {"FIFTH_CFG_SCALE": "3.0"})


# --- 노브 → env 매핑 -------------------------------------------------------

def test_container_노브만_모은다():
    """fifth_env_updates 는 KNOB_TO_LIVE 의 container 항목만 뽑아야 한다.

    prethird drop-in 으로 가야 할 값(tts.speed 등)이 섞이면 렌더서버 ExecStart 에
    엉뚱한 env 가 박힌다.
    """
    from knobs import RunKnobs
    knobs = RunKnobs()
    upd = promote.fifth_env_updates(knobs)
    assert "FIFTH_CFG_SCALE" in upd
    assert "FIFTH_DRIVING_MULTIPLIER" in upd
    assert "PRETHIRD_TTS_SPEED" not in upd
    assert "PRETHIRD_RENDER_MODE" not in upd      # 호스트 env(prethird) 라 여기 오면 안 된다
    # per-request 로 매 호출 실려 가는 값은 굳이 구울 필요가 없다.
    for k in upd:
        assert k.startswith("FIFTH_")


def test_dirty_로_범위를_좁힐_수_있다():
    from knobs import RunKnobs
    upd = promote.fifth_env_updates(RunKnobs(), dirty={"fifth.cfg_scale"})
    assert list(upd) == ["FIFTH_CFG_SCALE"]


# --- 유닛 파일에서 ExecStart 뽑기 ------------------------------------------

UNIT_TEXT = """[Unit]
Description=afterlife fifth render server
After=docker.service

[Service]
Type=simple
User=root
Restart=always
ExecStart=%s
ExecStartPre=/bin/bash -c '/usr/bin/docker exec fifth_poc_flp bash -c "pkill -9 -f x"'

[Install]
WantedBy=multi-user.target
""" % REAL_EXEC


def test_유닛에서_ExecStart_만_뽑는다():
    """ExecStartPre 를 잘못 집으면 pkill 명령을 서버 기동으로 덮어쓴다."""
    got = promote.extract_exec_start(UNIT_TEXT)
    assert got == REAL_EXEC
    assert "pkill" not in got


def test_ExecStart_없으면_거부():
    with pytest.raises(ValueError):
        promote.extract_exec_start("[Service]\nExecStartPre=/bin/true\n")


def test_ExecStart_가_여러개면_거부():
    """이미 drop-in 이 적용된 상태를 원본으로 착각하면 값이 중첩된다."""
    text = UNIT_TEXT + "ExecStart=/usr/bin/true\n"
    with pytest.raises(ValueError):
        promote.extract_exec_start(text)


# ---------------------------------------------------------------------------
# 엔드포인트 가드 — 라이브 렌더서버를 재기동하는 유일한 경로라 엄격하다.
# ---------------------------------------------------------------------------
import types

import pytest as _pytest
from aiohttp.test_utils import TestClient, TestServer

import app as labapp
from artifact_store import ArtifactStore
from live_guard import LiveGuard
from registry import KnobsRegistry


async def _client(tmp_path, *, sessions=0, registry=None):
    r = registry or KnobsRegistry()
    guard = LiveGuard("http://live/healthz", fetch_fn=lambda url: {"sessions": sessions})
    application = labapp.build_app(r, factory=None, store=ArtifactStore(str(tmp_path)),
                                   guard=guard)
    c = TestClient(TestServer(application))
    await c.start_server()
    return c, r


@_pytest.mark.asyncio
async def test_렌더재기동은_토큰이_필요하다(tmp_path, monkeypatch):
    monkeypatch.setenv("LAB_TUNER_TOKEN", "s3cret")
    c, _ = await _client(tmp_path)
    try:
        r = await c.post("/promote/render-restart",
                         json={"confirm": "RESTART_RENDER", "confirm2": True})
        assert r.status == 401
    finally:
        await c.close()


@_pytest.mark.asyncio
@_pytest.mark.parametrize("body", [
    {}, {"confirm": "RESTART_RENDER"}, {"confirm2": True},
    {"confirm": "RESTART", "confirm2": True},        # prethird 쪽 토큰으론 안 된다
])
async def test_2단계_확인이_없으면_거부(tmp_path, body):
    c, _ = await _client(tmp_path)
    try:
        r = await c.post("/promote/render-restart", json=body)
        assert r.status == 400
    finally:
        await c.close()


@_pytest.mark.asyncio
async def test_라이브_통화_중이면_차단(tmp_path):
    """🔴 fifth 컨테이너는 라이브와 공유한다 — 재기동하면 통화가 끊긴다."""
    c, _ = await _client(tmp_path, sessions=1)
    try:
        r = await c.post("/promote/render-restart",
                         json={"confirm": "RESTART_RENDER", "confirm2": True})
        assert r.status == 409
        assert "통화" in (await r.json())["error"]
    finally:
        await c.close()


@_pytest.mark.asyncio
async def test_preview_는_바뀔_값만_보여준다(tmp_path, monkeypatch):
    unit = tmp_path / "unit.service"
    unit.write_text(UNIT_TEXT)
    monkeypatch.setattr(promote, "FIFTH_UNIT", str(unit))
    r = KnobsRegistry()
    r.update({"fifth": {"cfg_scale": 3.5}})
    c, _ = await _client(tmp_path, registry=r)
    try:
        d = await (await c.get("/promote/render-preview")).json()
        chg = {e["env"]: e for e in d["changes"]}
        assert chg["FIFTH_CFG_SCALE"]["current"] == "2.0"
        assert chg["FIFTH_CFG_SCALE"]["new"] == "3.5"
        # 값이 같은 것은 변경 목록에 없어야 한다(공연한 재기동 방지).
        assert "FIFTH_EYE_TARGET_SCALE" not in chg
    finally:
        await c.close()


@_pytest.mark.asyncio
async def test_기동_실패하면_자동으로_되돌린다(tmp_path, monkeypatch):
    """🔴 렌더서버가 안 뜨면 라이브 통화가 통째로 죽는다 — 사람 손을 기다리면 안 된다."""
    unit = tmp_path / "unit.service"; unit.write_text(UNIT_TEXT)
    dropin = tmp_path / "dropin.conf"
    monkeypatch.setattr(promote, "FIFTH_UNIT", str(unit))
    monkeypatch.setattr(promote, "FIFTH_DROPIN", str(dropin))
    monkeypatch.setattr(labapp, "_sh", lambda cmd, timeout=30:
                        types.SimpleNamespace(returncode=0, stdout="", stderr=""))
    monkeypatch.setattr(labapp, "_render_healthy", lambda url, tries=1, delay=0: False)
    r = KnobsRegistry(); r.update({"fifth": {"cfg_scale": 3.5}})
    c, _ = await _client(tmp_path, registry=r)
    try:
        d = await (await c.post("/promote/render-restart",
                                json={"confirm": "RESTART_RENDER", "confirm2": True})).json()
        assert d["rolled_back"] is True
        assert not dropin.exists(), "롤백했으면 drop-in 이 남아 있으면 안 된다"
    finally:
        await c.close()


@_pytest.mark.asyncio
async def test_정상_기동하면_dropin_이_남는다(tmp_path, monkeypatch):
    unit = tmp_path / "unit.service"; unit.write_text(UNIT_TEXT)
    dropin = tmp_path / "dropin.conf"
    monkeypatch.setattr(promote, "FIFTH_UNIT", str(unit))
    monkeypatch.setattr(promote, "FIFTH_DROPIN", str(dropin))
    monkeypatch.setattr(labapp, "_sh", lambda cmd, timeout=30:
                        types.SimpleNamespace(returncode=0, stdout="", stderr=""))
    monkeypatch.setattr(labapp, "_render_healthy", lambda url, tries=1, delay=0: True)
    r = KnobsRegistry(); r.update({"fifth": {"cfg_scale": 3.5}})
    c, _ = await _client(tmp_path, registry=r)
    try:
        d = await (await c.post("/promote/render-restart",
                                json={"confirm": "RESTART_RENDER", "confirm2": True})).json()
        assert d["rolled_back"] is False and d["ok"] is True
        assert "FIFTH_CFG_SCALE=3.5" in dropin.read_text()
    finally:
        await c.close()


@_pytest.mark.asyncio
async def test_dropin_디렉터리가_없으면_sudo_로_만든다(tmp_path, monkeypatch):
    """/etc/systemd/system 은 root 소유라 os.makedirs 로는 PermissionError 가 난다.

    prethird 쪽 디렉터리가 afterlife 소유인 것과 같은 상태로 만들어야
    이후 쓰기가 sudo 없이 된다(2026-08-18 서버 실측).
    """
    unit = tmp_path / "unit.service"; unit.write_text(UNIT_TEXT)
    dropin = tmp_path / "nope" / "lab-tuner.conf"       # 부모 디렉터리 없음
    monkeypatch.setattr(promote, "FIFTH_UNIT", str(unit))
    monkeypatch.setattr(promote, "FIFTH_DROPIN", str(dropin))
    cmds = []

    def _fake_sh(cmd, timeout=30):
        cmds.append(cmd)
        if cmd[:2] == ["sudo", "mkdir"]:                # 진짜로 만들어 준다
            import os as _os
            _os.makedirs(cmd[-1], exist_ok=True)
        return types.SimpleNamespace(returncode=0, stdout="", stderr="")

    monkeypatch.setattr(labapp, "_sh", _fake_sh)
    monkeypatch.setattr(labapp, "_render_healthy", lambda url, tries=1, delay=0: True)
    r = KnobsRegistry(); r.update({"fifth": {"cfg_scale": 3.5}})
    c, _ = await _client(tmp_path, registry=r)
    try:
        d = await (await c.post("/promote/render-restart",
                                json={"confirm": "RESTART_RENDER", "confirm2": True})).json()
        assert d["ok"] is True, d
        flat = [" ".join(x) for x in cmds]
        assert any(s.startswith("sudo mkdir") for s in flat), flat
        assert any(s.startswith("sudo chown") for s in flat), flat
        assert dropin.exists()
    finally:
        await c.close()


@_pytest.mark.asyncio
async def test_사용자가_만진_값만_굽는다(tmp_path, monkeypatch):
    """🔴 안 건드린 노브까지 구우면 라이브 렌더 동작이 통째로 바뀐다.

    랩 노브의 기본값은 "랩이 정한 값"일 뿐 렌더서버가 실제로 쓰는 기본값이 아니다.
    ExecStart 에 없던 키를 굽는 순간 렌더서버 기본값이 랩 값으로 덮인다.
    그래서 "이번에 실제로 바꾼 값"(registry.dirty)만 대상으로 한다.
    """
    unit = tmp_path / "unit.service"; unit.write_text(UNIT_TEXT)
    monkeypatch.setattr(promote, "FIFTH_UNIT", str(unit))
    r = KnobsRegistry()
    c, _ = await _client(tmp_path, registry=r)
    try:
        # 아무것도 안 건드린 상태 → 구울 게 없어야 한다.
        d = await (await c.get("/promote/render-preview")).json()
        assert d["changes"] == [], d

        # 하나만 바꾸면 그 하나만.
        r.update({"fifth": {"cfg_scale": 3.5}})
        d = await (await c.get("/promote/render-preview")).json()
        assert [e["env"] for e in d["changes"]] == ["FIFTH_CFG_SCALE"], d
    finally:
        await c.close()
