"""AFL-1064 MuseTalk 캐시 줄이기 — 마스크 압축 저장(옛 무압축도 읽기) · mp4 직접 읽기가 PNG 추출과 픽셀이 같다."""
import glob
import os
import pickle
import shutil
import subprocess
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import cache_slim  # noqa: E402


def _masks(n=6):
    rng = np.random.default_rng(0)
    return [(rng.integers(0, 3, (584, 584), dtype=np.uint8) * 80, (-26, 185, 558, 769)) if i % 2 else None
            for i in range(n)]


def test_마스크는_압축해_저장하고_그대로_읽는다(tmp_path, monkeypatch):
    monkeypatch.delenv("PRETHIRD_MT_CACHE_SLIM", raising=False)
    p = str(tmp_path / "m.pkl")
    m = _masks()
    cache_slim.dump_masks(p, m)
    assert open(p, "rb").read().startswith(cache_slim.MAGIC)
    assert os.path.getsize(p) < len(pickle.dumps(m)) / 3
    got = cache_slim.load_masks(p)
    assert got[0] is None and np.array_equal(got[1][0], m[1][0]) and got[1][1] == m[1][1]
    assert not glob.glob(p + ".tmp*")


def test_옛_무압축_마스크도_읽는다(tmp_path):
    p = tmp_path / "old.pkl"
    m = _masks()
    p.write_bytes(pickle.dumps(m))
    got = cache_slim.load_masks(str(p))
    assert np.array_equal(got[3][0], m[3][0])


def test_끄면_예전처럼_무압축(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_MT_CACHE_SLIM", "0")
    p = str(tmp_path / "m.pkl")
    cache_slim.dump_masks(p, _masks())
    assert not open(p, "rb").read().startswith(cache_slim.MAGIC)
    assert not cache_slim.enabled()


@pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg 없음")
def test_mp4_직접_읽기는_PNG_추출과_픽셀이_같다(tmp_path):
    v = tmp_path / "v.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=128x256:rate=25:duration=1",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", str(v)], check=True)
    d = tmp_path / "png"
    d.mkdir()
    subprocess.run(f"ffmpeg -v fatal -i {v} -start_number 0 {d}/%08d.png", shell=True, check=True)
    cv2 = pytest.importorskip("cv2")
    pngs = [cv2.imread(p) for p in sorted(glob.glob(str(d / "*.png")))]
    frames = cache_slim.read_video_frames(str(v))
    assert len(frames) == len(pngs) == 25
    assert all(np.array_equal(a, b) for a, b in zip(frames, pngs))


def test_푼_프레임은_메모리에_두고_파일이_바뀌면_다시_푼다(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(cache_slim, "decode_video_frames",
                        lambda p: calls.append(p) or [np.zeros((4, 4, 3), np.uint8) for _ in range(3)])
    monkeypatch.setattr(cache_slim, "_frames", cache_slim.OrderedDict())
    monkeypatch.setattr(cache_slim, "_frames_bytes", 0)
    v = tmp_path / "a.mp4"
    v.write_bytes(b"x")
    a = cache_slim.read_video_frames(str(v))
    b = cache_slim.read_video_frames(str(v))
    assert a is b and len(calls) == 1
    v.write_bytes(b"xy")  # 크기가 바뀌면 다른 영상
    cache_slim.read_video_frames(str(v))
    assert len(calls) == 2


def test_메모리_상한을_넘으면_오래된_것부터_비운다(tmp_path, monkeypatch):
    monkeypatch.setattr(cache_slim, "decode_video_frames", lambda p: [np.zeros((1024, 1024), np.uint8)])  # 1MB
    monkeypatch.setattr(cache_slim, "_frames", cache_slim.OrderedDict())
    monkeypatch.setattr(cache_slim, "_frames_bytes", 0)
    monkeypatch.setenv("PRETHIRD_MT_FRAME_CACHE_MB", "2.5")
    for n in "abc":
        (tmp_path / f"{n}.mp4").write_bytes(n.encode())
        cache_slim.read_video_frames(str(tmp_path / f"{n}.mp4"))
    assert len(cache_slim._frames) == 2
    assert not any(k[0].endswith("a.mp4") for k in cache_slim._frames)


def test_예열은_영상을_메모리_캐시에_올리고_실패는_건너뛴다(tmp_path, monkeypatch):
    calls = []

    def dec(p):
        if p.endswith("bad.mp4"):
            raise RuntimeError("깨진 영상")
        calls.append(p)
        return [np.zeros((4, 4, 3), np.uint8)]

    monkeypatch.setattr(cache_slim, "decode_video_frames", dec)
    monkeypatch.setattr(cache_slim, "_frames", cache_slim.OrderedDict())
    monkeypatch.setattr(cache_slim, "_frames_bytes", 0)
    ps = []
    for n in ("a", "b", "bad"):
        (tmp_path / f"{n}.mp4").write_bytes(n.encode())
        ps.append(str(tmp_path / f"{n}.mp4"))
    cache_slim.prewarm(ps + [str(tmp_path / "없음.mp4")], workers=2)
    assert sorted(calls) == sorted(ps[:2]) and len(cache_slim._frames) == 2
    cache_slim.read_video_frames(ps[0])
    assert len(calls) == 2   # 렌더 때는 다시 풀지 않는다
