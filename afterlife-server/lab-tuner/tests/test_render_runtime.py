"""렌더서버 기동 로그 → 실제 적용값 파싱.

왜 로그를 읽나
--------------
렌더서버 `/config` 는 믿을 수 없다. 스스로 "infer_params 는 코드 강제·env
오버라이드까지 반영된 최종값"이라 주장하면서 `cfg_scale` 을 **env 가 2.0 일 때도
2.5 일 때도 항상 1.2** 로 보여준다(2026-08-18 실측). driving_multiplier 는 맞게
보여줘서 더 헷갈린다. 랩 UI 의 FLP 패널이 이 소스를 쓰고 있었고, 그래서
"파라미터가 적용됐는지 확인이 안 된다"는 상태였다(히즈키 보고).

렌더서버가 기동·렌더 때 찍는 로그는 실제로 쓰는 값이다. 그것이 정본이다.
"""
import pytest

import render_runtime as rr


LOG = """\
Aug 18 15:10:20 server172-32 docker[147029]: 2026-08-18 14:10:20,058 [fifth_render_server] INFO FifthConfig: FifthConfig(fps=25, lip_open=0.24, lip_closed=0.0023, open_scale=1.0, offset=2, sigma=1.0, gamma=1.0, silence=0.05, closed_thresh=0.1, open_thresh=0.4)
Aug 18 15:10:20 server172-32 docker[147029]: 2026-08-18 14:10:20,058 [fifth_render_server] INFO FifthFLPEngine 로드 중... (cfg=configs/trt_infer.yaml)
Aug 18 15:10:22 server172-32 docker[147029]: [flp_engine] flag_relative_motion=False  cfg_scale=2.5  driving_multiplier=1.3  flag_eye_retargeting=True
Aug 18 15:10:24 server172-32 docker[147029]: 2026-08-18 14:10:24,997 [fifth_render_server] INFO JoyVASA 로드 완료 (cfg_scale=2.5)
Aug 18 15:11:17 server172-32 docker[147029]: 2026-08-18 14:11:17,463 [fifth_render_server] INFO [cfg-final] lip_open=0.24 lip_closed=0.0023 open_scale=1.0 offset=2 sigma=1.0 gamma=1.0 silence=0.05 closed_thresh=0.1 open_thresh=0.4 fps=25 (override=없음)
Aug 18 15:11:17 server172-32 docker[147029]: 2026-08-18 14:11:17,463 [fifth_render_server] INFO [lip-path] 오디오 기반 계산 (lip_open=0.24 사용)
Aug 18 15:11:40 server172-32 docker[147873]: 2026-08-18 14:11:40,915 [fifth_render_server] INFO FifthConfig: FifthConfig(fps=25, lip_open=0.24, lip_closed=0.0023, open_scale=1.0, offset=2, sigma=1.0, gamma=1.0, silence=0.05, closed_thresh=0.1, open_thresh=0.4)
Aug 18 15:11:43 server172-32 docker[147873]: [flp_engine] flag_relative_motion=False  cfg_scale=2.0  driving_multiplier=1.0  flag_eye_retargeting=True
Aug 18 15:11:46 server172-32 docker[147873]: 2026-08-18 14:11:46,021 [fifth_render_server] INFO JoyVASA 로드 완료 (cfg_scale=2.0)
"""


# --- 최근 기동만 본다 -------------------------------------------------------

def test_가장_최근_기동의_값을_쓴다():
    """로그에는 재기동 이력이 쌓인다 — 옛 기동값을 보여주면 정반대로 판단하게 된다."""
    d = rr.parse(LOG)
    assert d["flp_engine"]["cfg_scale"] == "2.0"          # 2.5 는 이전 기동
    assert d["flp_engine"]["driving_multiplier"] == "1.0"
    assert d["joyvasa"]["cfg_scale"] == "2.0"


def test_기동_시각을_돌려준다():
    """언제 뜬 값인지 모르면 "재기동했는데 안 바뀌었다"를 구분할 수 없다."""
    assert rr.parse(LOG)["booted_at"] == "Aug 18 15:11:40"


# --- flp_engine ------------------------------------------------------------

def test_flp_engine_값을_모두_뽑는다():
    e = rr.parse(LOG)["flp_engine"]
    assert e == {
        "flag_relative_motion": "False", "cfg_scale": "2.0",
        "driving_multiplier": "1.0", "flag_eye_retargeting": "True",
    }


# --- FifthConfig(기동 기본값) ----------------------------------------------

def test_기동_FifthConfig_를_뽑는다():
    c = rr.parse(LOG)["fifth_config"]
    assert c["lip_open"] == "0.24"
    assert c["fps"] == "25"
    assert c["closed_thresh"] == "0.1"


# --- cfg-final(매 렌더 최종값) ---------------------------------------------

def test_마지막_렌더의_cfg_final_을_뽑는다():
    """per-request 노브가 실제로 먹었는지 보여주는 유일한 증거다."""
    f = rr.parse(LOG)["cfg_final"]
    assert f["values"]["lip_open"] == "0.24"
    assert f["override"] == "없음"
    assert f["at"] == "Aug 18 15:11:17"


def test_override_가_있으면_그대로_보여준다():
    log = LOG + ("Aug 18 15:20:01 h docker[1]: 2026-08-18 14:20:01,000 [fifth_render_server] "
                 "INFO [cfg-final] lip_open=0.9 fps=25 (override=lip_open,sigma)\n")
    f = rr.parse(log)["cfg_final"]
    assert f["values"]["lip_open"] == "0.9"
    assert f["override"] == "lip_open,sigma"


def test_lip_path_로_잠금_경로를_알려준다():
    """source_face_lock > lip_lock > 오디오 우선순위 중 무엇이 이겼는지.

    "잠금을 켰는데도 움직인다"를 눈으로 가릴 수 있는 자리다.
    """
    assert "오디오 기반 계산" in rr.parse(LOG)["lip_path"]

    log = LOG + ("Aug 18 15:21:01 h docker[1]: 2026-08-18 14:21:01,000 [fifth_render_server] "
                 "INFO [lip-path] source_face_lock → 원본 사진 입 모양 고정 (lip_open 무시됨)\n")
    assert "source_face_lock" in rr.parse(log)["lip_path"]


# --- 없거나 깨진 로그 -------------------------------------------------------

def test_로그가_비면_빈_결과():
    """렌더서버가 오래 떠 있어 로그 윈도우 밖이면 값이 없다 — 거짓말 대신 빈 값."""
    d = rr.parse("")
    assert d["flp_engine"] == {} and d["fifth_config"] == {}
    assert d["cfg_final"] is None and d["booted_at"] is None


def test_기동_마커가_없어도_있는_것은_준다():
    """기동 로그는 잘려 나가고 렌더 로그만 남은 흔한 상황."""
    only_render = ("Aug 18 15:30:00 h docker[1]: 2026-08-18 14:30:00,000 [fifth_render_server] "
                   "INFO [cfg-final] lip_open=0.5 fps=25 (override=없음)\n")
    d = rr.parse(only_render)
    assert d["booted_at"] is None
    assert d["cfg_final"]["values"]["lip_open"] == "0.5"


def test_숫자가_아닌_값도_문자열로_보존한다():
    """bool·경로 등을 숫자로 캐스팅하려다 죽지 않는다 — 표시가 목적이다."""
    e = rr.parse(LOG)["flp_engine"]
    assert isinstance(e["flag_relative_motion"], str)


# --- env 대조 --------------------------------------------------------------

def test_env_와_실제값_불일치를_짚어준다():
    """ExecStart env 는 2.0 인데 엔진이 1.2 로 떴다면 그게 진짜 문제다.

    /config 가 거짓말했던 자리를 이 대조가 대신한다.
    """
    d = rr.parse(LOG)
    mism = rr.mismatches(d, {"FIFTH_CFG_SCALE": "3.0", "FIFTH_DRIVING_MULTIPLIER": "1.0"})
    assert mism == [{"env": "FIFTH_CFG_SCALE", "expected": "3.0", "actual": "2.0"}]


def test_일치하면_빈_목록():
    d = rr.parse(LOG)
    assert rr.mismatches(d, {"FIFTH_CFG_SCALE": "2.0"}) == []


def test_모르는_env_는_대조하지_않는다():
    """로그에 대응 값이 없는 env 를 '불일치'로 부르면 거짓 경보가 된다."""
    d = rr.parse(LOG)
    assert rr.mismatches(d, {"FIFTH_BLINK": "1"}) == []


# ---------------------------------------------------------------------------
# 엔드포인트 — 로그를 읽어 실제 적용값을 내려준다.
# ---------------------------------------------------------------------------
import types

import pytest as _pytest
from aiohttp.test_utils import TestClient, TestServer

import app as labapp
import promote
from artifact_store import ArtifactStore
from registry import KnobsRegistry

UNIT = ("[Service]\nExecStart=/usr/bin/docker exec fifth_poc_flp bash -c 'cd /x && "
        "export LD_LIBRARY_PATH=/l FIFTH_CFG_SCALE=3.0 && exec python s.py'\n")


async def _client(tmp_path):
    application = labapp.build_app(KnobsRegistry(), factory=None,
                                   store=ArtifactStore(str(tmp_path)))
    c = TestClient(TestServer(application))
    await c.start_server()
    return c


@_pytest.mark.asyncio
async def test_엔드포인트가_로그값을_내려준다(tmp_path, monkeypatch):
    unit = tmp_path / "u.service"; unit.write_text(UNIT)
    monkeypatch.setattr(promote, "FIFTH_UNIT", str(unit))
    monkeypatch.setattr(promote, "FIFTH_DROPIN", str(tmp_path / "none.conf"))
    monkeypatch.setattr(labapp, "_sh", lambda cmd, timeout=30:
                        types.SimpleNamespace(returncode=0, stdout=LOG, stderr=""))
    c = await _client(tmp_path)
    try:
        d = await (await c.get("/render-runtime")).json()
        assert d["flp_engine"]["cfg_scale"] == "2.0"
        assert d["cfg_final"]["values"]["lip_open"] == "0.24"
        # ExecStart 는 3.0 인데 엔진은 2.0 으로 떴다 → 불일치로 짚어야 한다.
        assert d["mismatches"] == [
            {"env": "FIFTH_CFG_SCALE", "expected": "3.0", "actual": "2.0"}]
    finally:
        await c.close()


@_pytest.mark.asyncio
async def test_journalctl_이_실패해도_랩은_산다(tmp_path, monkeypatch):
    """로그 조회 실패가 패널 하나 때문에 랩 전체를 막으면 안 된다."""
    monkeypatch.setattr(labapp, "_sh", lambda cmd, timeout=30:
                        types.SimpleNamespace(returncode=1, stdout="", stderr="denied"))
    c = await _client(tmp_path)
    try:
        r = await c.get("/render-runtime")
        assert r.status == 200
        d = await r.json()
        assert d["error"]
        assert d["flp_engine"] == {}
    finally:
        await c.close()


@_pytest.mark.asyncio
async def test_dropin_이_있으면_그것을_실제_env_로_본다(tmp_path, monkeypatch):
    """재기동으로 값을 바꾼 뒤에는 drop-in 이 최종 ExecStart 다."""
    unit = tmp_path / "u.service"; unit.write_text(UNIT)
    dropin = tmp_path / "lab.conf"
    dropin.write_text("[Service]\nExecStart=\nExecStart=/usr/bin/docker exec f bash -c "
                      "'cd /x && export FIFTH_CFG_SCALE=2.0 && exec python s.py'\n")
    monkeypatch.setattr(promote, "FIFTH_UNIT", str(unit))
    monkeypatch.setattr(promote, "FIFTH_DROPIN", str(dropin))
    monkeypatch.setattr(labapp, "_sh", lambda cmd, timeout=30:
                        types.SimpleNamespace(returncode=0, stdout=LOG, stderr=""))
    c = await _client(tmp_path)
    try:
        d = await (await c.get("/render-runtime")).json()
        assert d["mismatches"] == []      # drop-in 2.0 == 로그 2.0
    finally:
        await c.close()
