"""엔진의 프롬프트 등록 — 견본 쌍은 자르지 않는다(AFL-1002).

엔진은 voice.wav 폴백용으로 앞 REF_CLIP_MAX_SEC(10초)만 쓴다. ref_text.txt 가 앞 10초의
전사라서 둘을 맞추려는 것이다. 그런데 견본 쌍(voice_prompt.wav + ref_prompt.txt)은
make_prompt_ref 가 15초 이후 첫 쉼에서 잘라 **통째로** 전사한 것이라, 여기서 10초로 또
자르면 오디오는 말 중간에서 끊기고 텍스트는 전체가 남는다 — 단어 반복을 부른 바로 그
불일치(프리셋 9520)가 엔진 안에서 다시 생긴다.
"""
import sys
import threading
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import config  # noqa: E402
import cosy_engine  # noqa: E402
from clone_ref import PROMPT_WAV  # noqa: E402

SR = 16000


class _Model:
    def __init__(self):
        self.registered = {}

    def add_zero_shot_spk(self, text, path, clone_id):
        data, sr = sf.read(path)
        self.registered[clone_id] = len(data) / sr
        self.calls = getattr(self, "calls", 0) + 1


def _engine(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "PROMPT_CACHE_DIR", str(tmp_path / "cache"))
    monkeypatch.setattr(config, "REF_CLIP_MAX_SEC", 10.0)
    monkeypatch.setattr(config, "PROMPT_TAIL_SILENCE_MS", 0)
    (tmp_path / "cache").mkdir()
    eng = cosy_engine.CosyEngine.__new__(cosy_engine.CosyEngine)
    eng.model = _Model()
    eng._registered = {}
    eng._reg_lock = threading.Lock()
    return eng


def _wav(path, sec):
    sf.write(path, np.full(int(sec * SR), 0.1, dtype=np.float32), SR)
    return str(path)


def test_견본_쌍은_10초로_자르지_않는다(tmp_path, monkeypatch):
    eng = _engine(tmp_path, monkeypatch)
    eng._ensure_prompt("c1", _wav(tmp_path / PROMPT_WAV, 15.8), "전체 견본 텍스트")
    assert abs(eng.model.registered["c1"] - 15.8) < 0.01


def test_voice_wav_폴백은_기존대로_10초로_자른다(tmp_path, monkeypatch):
    eng = _engine(tmp_path, monkeypatch)
    eng._ensure_prompt("c2", _wav(tmp_path / "voice.wav", 23.6), "앞 10초 전사")
    assert abs(eng.model.registered["c2"] - 10.0) < 0.01


# ─────────────────────────────────────────────────────────────────────────────
# 시드 고정(AFL-746, 라이브에만 있던 코드를 흡수) + 재시도마다 다른 시드(AFL-1002).
#
# 라이브는 (clone_id, text) 로 시드를 고정했다 — 같은 문장은 늘 같은 소리(재현 가능).
# 그런데 재시도도 같은 시드·같은 top_k=1 이라 폭주가 나면 6번을 다시 해도 똑같이 폭주했다.
# ─────────────────────────────────────────────────────────────────────────────

def test_같은_입력이면_같은_시드():
    assert cosy_engine.seed_for("9177", "안녕.", 0) == cosy_engine.seed_for("9177", "안녕.", 0)


def test_재시도마다_시드가_다르다():
    seeds = {cosy_engine.seed_for("9177", "안녕.", a) for a in range(7)}
    assert len(seeds) == 7


def test_시드는_양의_31비트_정수():
    s = cosy_engine.seed_for("x", "y", 3)
    assert 0 < s <= 0x7FFFFFFF


def test_시드는_파이썬_해시_랜덤화와_무관하다():
    """라이브는 PYTHONHASHSEED=0 에 기대고 있었다 — env 가 빠지면 재현성이 깨진다."""
    import subprocess
    code = ("import sys; sys.path.insert(0, %r); import cosy_engine; "
            "print(cosy_engine.seed_for('9177', '안녕.', 0))") % str(Path(cosy_engine.__file__).parent)
    a = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True,
                       env={"PYTHONHASHSEED": "1"}).stdout
    b = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True,
                       env={"PYTHONHASHSEED": "2"}).stdout
    assert a and a == b


# ─────────────────────────────────────────────────────────────────────────────
# 견본 쌍에는 끝 무음을 덧붙이지 않는다(AFL-1002 A/B).
#
# 견본 쌍은 make_prompt_ref 가 쉼을 물고 자른 것이라 이미 무음으로 끝난다. 엔진이 0.3초를
# 또 붙이면 끝 무음이 0.6초를 넘고, 프리셋 9520 새 견본에서 합성 앞머리 무음이 평균 0.77초로
# 늘어 짧은 말이 길이 검사에 걸렸다(폭주 의심 5→47회, 응답 중앙값 0.5→3.1초).
# ─────────────────────────────────────────────────────────────────────────────

def test_견본_쌍에는_끝_무음을_덧붙이지_않는다(tmp_path, monkeypatch):
    eng = _engine(tmp_path, monkeypatch)
    monkeypatch.setattr(config, "PROMPT_TAIL_SILENCE_MS", 300)
    eng._ensure_prompt("c3", _wav(tmp_path / PROMPT_WAV, 15.8), "전체 견본 텍스트")
    assert abs(eng.model.registered["c3"] - 15.8) < 0.01


def test_voice_wav_폴백에는_기존대로_끝_무음을_붙인다(tmp_path, monkeypatch):
    eng = _engine(tmp_path, monkeypatch)
    monkeypatch.setattr(config, "PROMPT_TAIL_SILENCE_MS", 300)
    eng._ensure_prompt("c4", _wav(tmp_path / "voice.wav", 23.6), "앞 10초 전사")
    assert abs(eng.model.registered["c4"] - 10.3) < 0.01


# ─────────────────────────────────────────────────────────────────────────────
# 견본이 바뀌면 재시작 없이 다시 등록한다(AFL-1002).
#
# 엔진은 clone_id 로만 캐시해서, 견본을 교체해도 프로세스를 재시작하기 전까지 옛 견본으로
# 말했다. 프리셋 견본 교체·재녹음(AFL-1005)마다 재시작할 수는 없다. qwen3tts 처럼 파일
# 크기·수정시각과 텍스트가 바뀌었는지 보고 다시 등록한다.
# ─────────────────────────────────────────────────────────────────────────────

def test_같은_견본이면_다시_등록하지_않는다(tmp_path, monkeypatch):
    eng = _engine(tmp_path, monkeypatch)
    w = _wav(tmp_path / PROMPT_WAV, 9.0)
    eng._ensure_prompt("c5", w, "텍스트")
    eng._ensure_prompt("c5", w, "텍스트")
    assert eng.model.calls == 1


def test_견본_파일이_바뀌면_다시_등록한다(tmp_path, monkeypatch):
    import os
    eng = _engine(tmp_path, monkeypatch)
    w = _wav(tmp_path / PROMPT_WAV, 9.0)
    eng._ensure_prompt("c6", w, "텍스트")
    _wav(tmp_path / PROMPT_WAV, 11.0)
    os.utime(w, ns=(1, 2_000_000_000_000_000_000))
    eng._ensure_prompt("c6", w, "텍스트")
    assert eng.model.calls == 2
    assert abs(eng.model.registered["c6"] - 11.0) < 0.01


def test_견본_텍스트가_바뀌면_다시_등록한다(tmp_path, monkeypatch):
    eng = _engine(tmp_path, monkeypatch)
    w = _wav(tmp_path / PROMPT_WAV, 9.0)
    eng._ensure_prompt("c7", w, "옛 텍스트")
    eng._ensure_prompt("c7", w, "새 텍스트")
    assert eng.model.calls == 2
