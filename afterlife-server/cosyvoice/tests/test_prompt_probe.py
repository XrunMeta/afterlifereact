"""견본 후보 시험 합성·점수 (AFL-1059).

폭주는 대본보다 개별 견본에 좌우된다(2026-10-26 측정: 같은 대본도 목소리마다 0~8회).
후보 견본마다 짧은 질문을 1차 생성 그대로 받아 늘어진 만큼을 점수로 매기고 가장 낮은 것을 쓴다.
"""
import io
import json
import sys
import urllib.error
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import config  # noqa: E402
import make_prompt_ref as mpr  # noqa: E402

BASE, PER = mpr.PROBE_RAMBLE_BASE_SEC, config.RAMBLE_PER_CHAR_SEC

def _wav_bytes(sec: float, sr: int = 24000) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, np.zeros(int(sr * sec), dtype=np.float32), sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()

def test_시험문장_고정():
    assert mpr.PROBE_SENTENCES == [
        "너는 뭐 먹었어?", "뭐 하고 있었어?", "무슨 일 있어?", "돌아왔네.", "잘 들려?", "밥은 먹었어?",
    ]

def test_점수_정상길이는_0():
    assert mpr.probe_score([1.0], ["너는 뭐 먹었어?"]) == 0.0

def test_점수_늘어진만큼():
    s = "너는 뭐 먹었어?"
    assert mpr.probe_score([7.2], [s]) == pytest.approx(7.2 - (BASE + len(s) * PER))

def test_점수_기준은_라이브값_0점9(monkeypatch):
    # prebuild(prethird) 환경에는 엔진의 COSYVOICE_RAMBLE_BASE_SEC=0.9 가 없어 config 기본 1.8 이
    # 쓰였고, 동점 0 이 많아 후보를 못 가렸다(2026-10-27 검증: 0.9 로 다시 매기면 2건이 바뀜).
    assert mpr.PROBE_RAMBLE_BASE_SEC == 0.9
    assert mpr.probe_score([3.2], ["잘 들려?"]) == pytest.approx(3.2 - (0.9 + 5 * PER))

def test_고르기_최저점():
    assert mpr.pick_best([3.0, 0.5, 0.5]) == 1

def test_고르기_동점은_앞():
    assert mpr.pick_best([0.0, 0.0]) == 0

def test_고르기_None_건너뜀():
    assert mpr.pick_best([None, 2.0]) == 1

def test_고르기_전부None은_0():
    assert mpr.pick_best([None, None]) == 0

def test_시험합성_오류면_None(monkeypatch):
    def boom(req, timeout=None):
        raise urllib.error.HTTPError(req.full_url, 503, "down", {}, None)
    monkeypatch.setattr(mpr.urllib.request, "urlopen", boom)
    assert mpr.probe_durations("zz-probe-x-0", mpr.PROBE_SENTENCES, "http://t") is None

def test_시험합성_요청본문(monkeypatch):
    seen = []

    class _Resp:
        def __init__(self, body):
            self._b = body

        def read(self):
            return self._b

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    def fake(req, timeout=None):
        seen.append((req.full_url, json.loads(req.data.decode())))
        return _Resp(_wav_bytes(1.0))

    monkeypatch.setattr(mpr.urllib.request, "urlopen", fake)
    out = mpr.probe_durations("zz-probe-x-0", mpr.PROBE_SENTENCES, "http://t")
    assert out == pytest.approx([1.0] * 6)
    assert seen[0] == ("http://t/tts/kr",
                       {"text": "너는 뭐 먹었어?", "clone_id": "zz-probe-x-0", "ramble_retries": 0})

# ── build() 프로브 경로 ─────────────────────────────────────────────────────
CID = "9999"
WINS = [(0.0, 9.35), (4.4, 13.85), (9.4, 18.35)]

@pytest.fixture
def probe_env(tmp_path, monkeypatch):
    root = tmp_path / "refs"
    (root / CID).mkdir(parents=True)
    (root / CID / "voice.wav").write_bytes(b"x" * 2000)
    cache = tmp_path / "cache"
    cache.mkdir()
    monkeypatch.setattr(config, "PROMPT_CACHE_DIR", str(cache))
    monkeypatch.setenv("COSYVOICE_PROMPT_PROBE", "1")
    monkeypatch.setattr(mpr, "speech_start", lambda p: 0.0)
    monkeypatch.setattr(mpr, "duration", lambda p: 30.0)
    monkeypatch.setattr(mpr, "candidate_windows", lambda p, s, t, n: list(WINS))

    def fake_cut(src, dst, start, dur):
        Path(dst).write_bytes(f"wav@{start}".encode() * 200)
        return True
    monkeypatch.setattr(mpr, "cut", fake_cut)
    monkeypatch.setattr(mpr, "transcribe", lambda p: f"전사{Path(p).parent.name[-1]}")
    calls = []
    monkeypatch.setattr(mpr, "probe_durations",
                        lambda pid, ss, url: calls.append(pid) or [1.0] * 6)
    return root, cache, calls

def _probe_dirs(root):
    return sorted(p.name for p in root.iterdir() if p.name.startswith("zz-probe-"))

def test_프로브_꺼지면_종전경로(probe_env, monkeypatch):
    root, _, calls = probe_env
    monkeypatch.delenv("COSYVOICE_PROMPT_PROBE")
    monkeypatch.setattr(mpr, "candidate_windows",
                        lambda *a: (_ for _ in ()).throw(AssertionError("불리면 안 됨")))
    monkeypatch.setattr(mpr, "pick_end", lambda p, s, t: (9.35, "ok"))
    assert mpr.build(CID, str(root)) is True
    assert calls == []
    assert (root / CID / "ref_prompt.txt").read_text(encoding="utf-8") == "전사9"

def test_프로브_최저점_후보_채택(probe_env, monkeypatch):
    root, _, _ = probe_env
    durs = {"0": [5.0] * 6, "1": [1.0] * 6, "2": [3.0] * 6}
    monkeypatch.setattr(mpr, "probe_durations", lambda pid, ss, url: durs[pid[-1]])
    assert mpr.build(CID, str(root)) is True
    assert (root / CID / "ref_prompt.txt").read_text(encoding="utf-8") == "전사1"
    assert (root / CID / "voice_prompt.wav").read_bytes().startswith(b"wav@4.4")
    rep = json.loads((root / CID / "prompt_probe.json").read_text(encoding="utf-8"))
    assert rep["picked"] == 1
    assert rep["windows"] == [list(w) for w in WINS]

def test_프로브_TTS_전멸이면_첫후보(probe_env, monkeypatch):
    root, _, _ = probe_env
    monkeypatch.setattr(mpr, "probe_durations", lambda pid, ss, url: None)
    assert mpr.build(CID, str(root)) is True
    assert (root / CID / "ref_prompt.txt").read_text(encoding="utf-8") == "전사0"

def test_프로브_전사실패_후보는_제외(probe_env, monkeypatch):
    root, _, _ = probe_env
    monkeypatch.setattr(mpr, "transcribe",
                        lambda p: None if Path(p).parent.name.endswith("-1") else "전사")
    durs = {"0": [5.0] * 6, "1": [0.5] * 6, "2": [3.0] * 6}
    monkeypatch.setattr(mpr, "probe_durations", lambda pid, ss, url: durs[pid[-1]])
    assert mpr.build(CID, str(root)) is True
    assert (root / CID / "voice_prompt.wav").read_bytes().startswith(b"wav@9.4")

def test_프로브_전사_전부실패면_False(probe_env, monkeypatch):
    root, _, _ = probe_env
    monkeypatch.setattr(mpr, "transcribe", lambda p: None)
    assert mpr.build(CID, str(root)) is False
    assert not (root / CID / "voice_prompt.wav").exists()

def test_프로브_시험폴더_남지않음(probe_env):
    root, cache, _ = probe_env
    (root / f"zz-probe-{CID}-9").mkdir()
    (cache / f"zz-probe-{CID}-0_prompt.wav").write_bytes(b"c")
    assert mpr.build(CID, str(root)) is True
    assert _probe_dirs(root) == []
    assert list(cache.iterdir()) == []

def test_프로브_후보하나면_종전경로(probe_env, monkeypatch):
    root, _, calls = probe_env
    monkeypatch.setattr(mpr, "candidate_windows", lambda p, s, t, n: [WINS[0]])
    monkeypatch.setattr(mpr, "pick_end", lambda p, s, t: (9.35, "ok"))
    assert mpr.build(CID, str(root)) is True
    assert calls == []

def test_프로브_같은클론_잠금(probe_env, monkeypatch):
    # 리뷰(2026-10-27): 같은 클론 prebuild 가 동시에 돌면 서로의 시험 폴더를 지우고
    # 진짜 견본이 "A 의 wav + B 의 txt" 로 섞일 수 있다 → 클론 폴더 잠금 아래에서 돈다.
    root, _, _ = probe_env
    events = []
    real_cut = mpr.cut
    monkeypatch.setattr(mpr.fcntl, "flock", lambda fd, op: events.append(("flock", op)))
    monkeypatch.setattr(mpr, "cut", lambda *a: events.append(("cut",)) or real_cut(*a))
    assert mpr.build(CID, str(root)) is True
    assert events[0] == ("flock", mpr.fcntl.LOCK_EX)
    assert ("flock", mpr.fcntl.LOCK_UN) in events

def test_프로브_진짜쌍은_통째로_교체(probe_env, monkeypatch):
    # 리뷰(2026-10-27): 제자리 복사는 엔진이 반쯤 쓴 wav 를 읽을 수 있다 → 임시 파일 후 os.replace.
    root, _, _ = probe_env
    replaced = []
    real_replace = mpr.os.replace
    monkeypatch.setattr(mpr.os, "replace", lambda s, d: replaced.append(Path(d).name) or real_replace(s, d))
    assert mpr.build(CID, str(root)) is True
    assert replaced == ["voice_prompt.wav", "ref_prompt.txt"]
    # 임시 파일이 남지 않는다.
    assert sorted(p.name for p in (root / CID).iterdir()) == sorted([
        ".prompt.lock", "prompt_probe.json", "ref_prompt.txt", "voice.wav", "voice_prompt.wav"])
