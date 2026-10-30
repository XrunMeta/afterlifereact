"""감정 은행(AFL-1069) — 말투는 은행 견본, 음색은 클론 견본.

CosyVoice 는 화자 캐시(spk2info)를 키별 dict 로 보관한다. LLM 단계 키(prompt_text·llm 토큰·
llm_embedding)를 은행 견본에서, flow 단계 키(flow 토큰·prompt_speech_feat·flow_embedding)를
클론에서 가져온 항목을 "emo-mix:<클론>:<감정>" 이름으로 등록해 기존 합성 경로를 그대로 탄다.
가비아 `/data/emo_mix_20261030/` 실측: 음색 유사도 유지·폭주 0·말투는 은행 것.
"""
import sys
import threading
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import config  # noqa: E402
import cosy_engine  # noqa: E402

SR = 16000
LLM_KEYS = ("prompt_text", "prompt_text_len", "llm_prompt_speech_token",
            "llm_prompt_speech_token_len", "llm_embedding")


class _Frontend:
    def __init__(self):
        self.spk2info = {}


class _Model:
    """add_zero_shot_spk 가 키마다 '<출처>:<키>' 값을 넣는다 — 섞인 결과의 출처를 바로 본다."""

    def __init__(self):
        self.frontend = _Frontend()
        self.calls = []

    def add_zero_shot_spk(self, text, path, spk_id):
        self.calls.append((spk_id, text))
        self.paths = getattr(self, "paths", {})
        self.paths[spk_id] = path
        keys = LLM_KEYS + cosy_engine.FLOW_KEYS
        self.frontend.spk2info[spk_id] = {k: f"{spk_id}:{k}" for k in keys}


def _wav(path, sec=1.0):
    sf.write(path, np.full(int(sec * SR), 0.1, dtype=np.float32), SR)
    return str(path)


@pytest.fixture
def bank_dir(tmp_path):
    d = tmp_path / "bank"
    d.mkdir()
    for name, text in (("happy_ainsley", "정말 합격했어요?"), ("sad_hana", "보고 싶어요.")):
        _wav(d / f"{name}.wav")
        (d / f"{name}.txt").write_text(text + "\n", encoding="utf-8")
    return d


@pytest.fixture
def eng(tmp_path, monkeypatch, bank_dir):
    monkeypatch.setattr(config, "PROMPT_CACHE_DIR", str(tmp_path / "cache"))
    monkeypatch.setattr(config, "PROMPT_TAIL_SILENCE_MS", 0)
    monkeypatch.setattr(config, "PROMPT_TEXT_PREFIX", "")
    monkeypatch.setattr(config, "EMO_BANK_ENABLED", True)
    monkeypatch.setattr(config, "EMO_BANK_DIR", str(bank_dir))
    monkeypatch.setattr(config, "EMO_BANK_MAP", {"happy": "happy_ainsley", "sad": "sad_hana",
                                                 "angry": "angry_ainsley"})
    (tmp_path / "cache").mkdir()
    e = cosy_engine.CosyEngine.__new__(cosy_engine.CosyEngine)
    e.model = _Model()
    e._registered = {}
    e._reg_lock = threading.Lock()
    e._banks = {}
    e._mixed = {}
    e._ensure_prompt("c1", _wav(tmp_path / "voice.wav"), "클론 견본")
    return e


def test_기쁨은_말투_은행_음색_클론(eng):
    spk = eng._voice_for("c1", "happy")
    assert spk == "emo-mix:c1:happy"
    info = eng.model.frontend.spk2info[spk]
    for k in LLM_KEYS:
        assert info[k] == f"emo-bank:happy_ainsley:{k}"
    for k in cosy_engine.FLOW_KEYS:
        assert info[k] == f"c1:{k}"


def test_은행_견본_텍스트를_프롬프트로_등록(eng):
    eng._voice_for("c1", "happy")
    assert ("emo-bank:happy_ainsley", "정말 합격했어요?") in eng.model.calls


@pytest.mark.parametrize("emotion", [None, "", "neutral", "calm", "모름", "warm"])
def test_은행_없는_감정은_클론_그대로(eng, emotion):
    # warm 은 이 테스트의 맵에 없다 — 맵에 없는 감정은 지금처럼 클론만 쓴다.
    assert eng._voice_for("c1", emotion) == "c1"
    assert not any(spk.startswith("emo-bank:") for spk, _ in eng.model.calls)


def test_대소문자_공백은_정리(eng):
    assert eng._voice_for("c1", " Happy ") == "emo-mix:c1:happy"


def test_스위치_꺼지면_클론_그대로(eng, monkeypatch):
    monkeypatch.setattr(config, "EMO_BANK_ENABLED", False)
    assert eng._voice_for("c1", "happy") == "c1"
    assert len(eng.model.calls) == 1  # 클론 등록 1회뿐


def test_은행_파일_없으면_클론으로_되돌리고_다시_찾지_않는다(eng):
    assert eng._voice_for("c1", "angry") == "c1"
    assert eng._voice_for("c1", "angry") == "c1"
    assert not any(spk.startswith("emo-bank:") for spk, _ in eng.model.calls)
    assert eng._banks["angry_ainsley"] is None


def test_은행_등록은_한_번(eng, tmp_path):
    eng._ensure_prompt("c2", _wav(tmp_path / "voice_c2.wav"), "다른 클론")
    eng._voice_for("c1", "happy")
    eng._voice_for("c1", "happy")
    assert eng._voice_for("c2", "happy") == "emo-mix:c2:happy"
    assert sum(spk == "emo-bank:happy_ainsley" for spk, _ in eng.model.calls) == 1


def test_클론_견본이_바뀌면_섞은_항목도_새로(eng, tmp_path):
    eng._voice_for("c1", "sad")
    eng._ensure_prompt("c1", _wav(tmp_path / "voice2.wav", 2.0), "새 견본")
    # 새 등록이 클론 항목을 바꾼 것처럼 표시한다.
    eng.model.frontend.spk2info["c1"]["flow_embedding"] = "c1-new:flow_embedding"
    eng._voice_for("c1", "sad")
    assert eng.model.frontend.spk2info["emo-mix:c1:sad"]["flow_embedding"] == "c1-new:flow_embedding"


def test_은행_맵_파싱():
    assert config.parse_emo_bank_map("happy=happy_ainsley, SAD = sad_hana,,bad,=x,y=") == {
        "happy": "happy_ainsley", "sad": "sad_hana"}


def test_synth_는_섞은_화자로_합성(eng, monkeypatch):
    seen = {}

    def fake_once(text, spk, speed, top_k=None, top_p=None, attempt=0):
        seen["spk"] = spk
        return np.zeros(int(0.5 * 24000), dtype=np.float32)

    monkeypatch.setattr(eng, "_synth_once", fake_once)
    eng.sr = 24000
    eng.synth("좋아.", "c1", str(Path(config.PROMPT_CACHE_DIR) / "c1_prompt.wav"), "클론 견본",
              emotion="happy")
    assert seen["spk"] == "emo-mix:c1:happy"


def test_서버는_emotion_을_엔진에_넘긴다(monkeypatch, tmp_path):
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient
    import server

    _wav(tmp_path / "voice.wav")
    monkeypatch.setattr(server, "ref_pair", lambda cid: (str(tmp_path / "voice.wav"), "견본"))
    seen = {}

    class _Eng:
        def synth(self, text, **kw):
            seen.update(kw)
            return b"RIFF"

    monkeypatch.setattr(server.app.state, "engine", _Eng())
    c = TestClient(server.app)  # with 블록 없이 — startup(모델 로딩)을 띄우지 않는다
    assert c.post("/tts/kr", json={"text": "좋아.", "clone_id": "c1", "emotion": "sad"}).status_code == 200
    assert seen["emotion"] == "sad"
    assert c.post("/tts/kr", json={"text": "좋아.", "clone_id": "c1"}).status_code == 200
    assert seen["emotion"] is None


def test_은행_견본에도_끝_무음을_붙여_등록(eng, monkeypatch):
    monkeypatch.setattr(config, "PROMPT_TAIL_SILENCE_MS", 300)
    eng._voice_for("c1", "happy")
    data, sr = sf.read(eng.model.paths["emo-bank:happy_ainsley"])
    assert abs(len(data) / sr - 1.3) < 0.01
    assert np.all(data[-int(0.3 * sr):] == 0)


def test_은행_등록이_터져도_클론으로_되돌리고_한_번만_시도(eng, monkeypatch):
    calls = []

    def boom(name):
        calls.append(name)
        raise RuntimeError("깨진 wav")

    monkeypatch.setattr(eng, "_ensure_bank", boom)
    assert eng._voice_for("c1", "happy") == "c1"
    assert eng._voice_for("c1", "happy") == "c1"
    assert calls == ["happy_ainsley"]  # 두 번째는 None 기억으로 바로 클론


def test_빈_wav_은행은_클론으로(eng, bank_dir):
    (bank_dir / "happy_ainsley.wav").write_bytes(b"")
    assert eng._voice_for("c1", "happy") == "c1"


def test_빈_대사_은행은_클론으로(eng, bank_dir):
    (bank_dir / "sad_hana.txt").write_text("  \n", encoding="utf-8")
    assert eng._voice_for("c1", "sad") == "c1"
    assert eng._banks["sad_hana"] is None


def test_warmup_클론이_없어도_은행은_미리_등록(eng, monkeypatch):
    monkeypatch.setattr(config, "WARMUP_CLONE", "")
    eng.warmup()
    assert eng._banks["happy_ainsley"] == "emo-bank:happy_ainsley"
    assert eng._banks["sad_hana"] == "emo-bank:sad_hana"
    assert eng._banks["angry_ainsley"] is None


def test_섞은_항목은_클론_이름공간과_겹치지_않는다(eng, tmp_path):
    # 디렉터리 이름이 "c1@happy" 인 클론이 있어도 c1 의 기쁨 항목과 다른 키다.
    eng._ensure_prompt("c1@happy", _wav(tmp_path / "voice_x.wav"), "이상한 이름")
    spk = eng._voice_for("c1", "happy")
    assert spk != "c1@happy"
    assert eng.model.frontend.spk2info["c1@happy"]["flow_embedding"] == "c1@happy:flow_embedding"
