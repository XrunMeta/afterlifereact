# afterlife-server/qwen3tts/tests/test_icl_and_clone_id.py
# ICL 모드 전환 + clone_id 직접 수용 + load_ref_text 검증
# GPU 없이: server/engine mock 으로 라우트·로직만 검증.
import sys, pathlib, io
import numpy as np
import soundfile as sf
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))


# ── clone_ref.load_ref_text ──────────────────────────────────────────────────

from clone_ref import load_ref_text, ref_text_path  # noqa: E402


def test_load_ref_text_returns_content(tmp_path, monkeypatch):
    """ref_text.txt 있으면 내용 반환."""
    import config as cfg
    monkeypatch.setattr(cfg, "REF_ROOT", str(tmp_path))
    (tmp_path / "halbae").mkdir()
    (tmp_path / "halbae" / "ref_text.txt").write_text("안녕하세요 저는 할배입니다", encoding="utf-8")
    result = load_ref_text("halbae")
    assert result == "안녕하세요 저는 할배입니다"


def test_load_ref_text_returns_none_if_missing(tmp_path, monkeypatch):
    """ref_text.txt 없으면 None."""
    import config as cfg
    monkeypatch.setattr(cfg, "REF_ROOT", str(tmp_path))
    (tmp_path / "halbae").mkdir()
    assert load_ref_text("halbae") is None


def test_load_ref_text_returns_none_if_empty(tmp_path, monkeypatch):
    """ref_text.txt 내용이 공백/빈 문자열이면 None."""
    import config as cfg
    monkeypatch.setattr(cfg, "REF_ROOT", str(tmp_path))
    (tmp_path / "halbae").mkdir()
    (tmp_path / "halbae" / "ref_text.txt").write_text("   \n", encoding="utf-8")
    assert load_ref_text("halbae") is None


def test_ref_text_path_correct(tmp_path, monkeypatch):
    """ref_text_path 경로 규약 확인."""
    import config as cfg
    monkeypatch.setattr(cfg, "REF_ROOT", "/tmp/refs")
    p = ref_text_path("gomin")
    assert p == "/tmp/refs/gomin/ref_text.txt"


# ── server 라우트: ICL 배선 검증 ─────────────────────────────────────────────

import config as cfg  # noqa: E402


class FakeEngine:
    def __init__(self):
        self.calls = []

    def synth(self, text, clone_id, voice_wav, ref_text=None, speed=1.0, gen_params=None):
        self.calls.append({"text": text, "clone_id": clone_id, "ref_text": ref_text})
        buf = io.BytesIO()
        sf.write(buf, np.zeros(1600, dtype="float32"), 16000, format="WAV", subtype="PCM_16")
        return buf.getvalue()


def _setup(tmp_path, monkeypatch, *, clone_id="halbae", ref_text_content=None):
    """fake engine + 클론 디렉토리 + 선택적 ref_text.txt 셋업."""
    (tmp_path / clone_id).mkdir(parents=True, exist_ok=True)
    sf.write(str(tmp_path / clone_id / "voice.wav"), np.zeros(1600, dtype="float32"), 16000)
    if ref_text_content is not None:
        (tmp_path / clone_id / "ref_text.txt").write_text(ref_text_content, encoding="utf-8")
    monkeypatch.setattr(cfg, "REF_ROOT", str(tmp_path))
    from fastapi.testclient import TestClient
    from server import app
    app.router.on_startup.clear()
    eng = FakeEngine()
    app.state.engine = eng
    return TestClient(app), eng


def test_icl_mode_when_ref_text_present(tmp_path, monkeypatch):
    """ref_text.txt 있으면 synth() 에 ref_text 가 전달된다 (ICL 활성)."""
    client, eng = _setup(tmp_path, monkeypatch, ref_text_content="대본 텍스트입니다")
    resp = client.post("/tts/kr", json={"text": "합성 문장", "clone_id": "halbae"})
    assert resp.status_code == 200
    assert eng.calls[0]["ref_text"] == "대본 텍스트입니다"
    assert resp.headers.get("x-icl-mode") == "true"


def test_xvector_mode_when_ref_text_absent(tmp_path, monkeypatch):
    """ref_text.txt 없으면 synth() 에 ref_text=None 전달 (x_vector_only 경로)."""
    client, eng = _setup(tmp_path, monkeypatch, ref_text_content=None)
    resp = client.post("/tts/kr", json={"text": "합성 문장", "clone_id": "halbae"})
    assert resp.status_code == 200
    assert eng.calls[0]["ref_text"] is None
    assert resp.headers.get("x-icl-mode") == "false"


def test_400_when_no_clone_id_and_no_se_path(tmp_path, monkeypatch):
    """clone_id 와 se_path 둘 다 없으면 400 (halbae fallback 제거 확인)."""
    client, _ = _setup(tmp_path, monkeypatch)
    resp = client.post("/tts/kr", json={"text": "아무 문장"})
    assert resp.status_code == 400
    assert "absent" in resp.json()["detail"]


def test_clone_id_takes_priority_over_se_path(tmp_path, monkeypatch):
    """clone_id > se_path 우선순위. se_path 에 다른 clone 경로가 있어도 clone_id 사용."""
    client, eng = _setup(tmp_path, monkeypatch, clone_id="halbae")
    resp = client.post("/tts/kr", json={
        "text": "우선순위",
        "clone_id": "halbae",
        "se_path": "reference_voices/gomin/se.pth",
    })
    assert resp.status_code == 200
    assert eng.calls[0]["clone_id"] == "halbae"


def test_se_path_still_works_without_clone_id(tmp_path, monkeypatch):
    """se_path 단독 호출 회귀 (하위호환)."""
    client, eng = _setup(tmp_path, monkeypatch, clone_id="halbae")
    resp = client.post("/tts/kr", json={
        "text": "se_path 회귀",
        "se_path": "reference_voices/halbae/se.pth",
    })
    assert resp.status_code == 200
    assert eng.calls[0]["clone_id"] == "halbae"
    assert resp.headers.get("x-clone-id") == "halbae"


# ── Qwen3Engine: ICL x_vector_only_mode 분기 검증 ────────────────────────────

from tts_engine import Qwen3Engine  # noqa: E402


class FakeModel:
    def __init__(self):
        self.prompt_calls = []
        self.gen_calls = 0

    def create_voice_clone_prompt(self, ref_audio, ref_text, x_vector_only_mode):
        self.prompt_calls.append({"ref_text": ref_text, "xvo": x_vector_only_mode})
        return {"prompt_id": len(self.prompt_calls)}

    def generate_voice_clone(self, text, language, voice_clone_prompt):
        self.gen_calls += 1
        return [np.zeros(1600, dtype="float32")], 16000


def _fake_clip(voice_wav, max_sec=None):
    return np.zeros(16000, dtype="float32"), 16000


def _wav(tmp_path, clone_id="halbae"):
    p = str(tmp_path / clone_id / "voice.wav")
    import os
    os.makedirs(str(tmp_path / clone_id), exist_ok=True)
    sf.write(p, np.zeros(1600, dtype="float32"), 16000)
    return p


def test_engine_icl_xvo_false_when_ref_text_given(tmp_path):
    """ref_text 있으면 x_vector_only_mode=False (ICL)."""
    wav = _wav(tmp_path)
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="halbae", voice_wav=wav, ref_text="대본")
    assert m.prompt_calls[0]["xvo"] is False


def test_engine_icl_xvo_true_when_no_ref_text(tmp_path):
    """ref_text None 이면 x_vector_only_mode=True."""
    wav = _wav(tmp_path)
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="halbae", voice_wav=wav, ref_text=None)
    assert m.prompt_calls[0]["xvo"] is True
