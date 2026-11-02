"""AFL-1064 감정 태그 → 감정 영상 클립 · 한 시계 재생 위치."""
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import emotion_video as ev  # noqa: E402
from emotion_video import CLIP_FOR_EMO, EmotionVideo, enabled_for, find_assets  # noqa: E402


def _assets(tmp_path, clone="9232", clips=("neutral", "idle", "warm_calm", "agreement", "serious", "disagreement")):
    d = tmp_path / clone / "emo"
    d.mkdir(parents=True)
    for c in clips:
        (d / f"{clone}-emo-{c}.mp4").write_bytes(b"x")
    return tmp_path


def test_연결표는_6종_감정을_모두_덮는다():
    from clone_dialog.lang_tag import EMOTIONS
    assert set(CLIP_FOR_EMO) == set(EMOTIONS)
    assert CLIP_FOR_EMO["neutral"] == CLIP_FOR_EMO["calm"] == "neutral"
    assert CLIP_FOR_EMO["warm"] == "warm_calm"
    assert CLIP_FOR_EMO["happy"] == "agreement"
    assert CLIP_FOR_EMO["sad"] == "serious"
    assert CLIP_FOR_EMO["angry"] == "disagreement"


def test_클론_허용목록(monkeypatch, tmp_path):
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(tmp_path / "없음.json"))
    monkeypatch.delenv("PRETHIRD_EMO_VIDEO_CLONES", raising=False)
    assert not enabled_for(9232)
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_CLONES", "9232, 9075")
    assert enabled_for(9232) and enabled_for("9075")
    assert not enabled_for(9194) and not enabled_for(None)


def test_자산은_무감정과_idle_이_있어야_쓴다(tmp_path):
    root = _assets(tmp_path)
    a = find_assets(str(root), "9232")
    assert a["neutral"].endswith("9232/emo/9232-emo-neutral.mp4")
    assert set(a) == {"neutral", "idle", "warm_calm", "agreement", "serious", "disagreement"}
    assert find_assets(str(_assets(tmp_path / "b", clips=("neutral", "warm_calm"))), "9232") is None


def test_감정_클립이_없으면_무감정으로(tmp_path):
    a = find_assets(str(_assets(tmp_path, clips=("neutral", "idle"))), "9232")
    v = EmotionVideo(a, cycle_len=588)
    path, rot = v.segment(reply_seq=1, emo="angry", idle_pos=10)
    assert path == a["neutral"] and rot == 10


def test_감정_클립은_0번부터_조각마다_이어진다(tmp_path):
    a = find_assets(str(_assets(tmp_path)), "9232")
    v = EmotionVideo(a, cycle_len=588)
    path, rot = v.segment(reply_seq=1, emo="angry", idle_pos=300)
    assert path == a["disagreement"] and rot == 0
    v.advance(55)
    path, rot = v.segment(reply_seq=1, emo="angry", idle_pos=999)
    assert path == a["disagreement"] and rot == 55   # 같은 답의 다음 문장 조각은 이어서
    v.advance(30)
    assert v.idle_resume_pos() == 0                  # 감정 답 뒤 idle 은 처음(중립)부터


def test_감정_클립은_길이가_달라도_위치를_누적한다(tmp_path):
    # 감정 클립(193프레임 → 사이클 386)은 무감정 사이클(588)과 길이가 다르다.
    # 위치를 588 로 접으면 긴 답에서 조각 사이가 튄다 → 누적값을 주고 접기는 MuseTalk 가 자기 사이클로 한다.
    a = find_assets(str(_assets(tmp_path)), "9232")
    v = EmotionVideo(a, cycle_len=588)
    v.segment(reply_seq=1, emo="sad", idle_pos=0)
    v.advance(500)
    v.advance(200)
    _, rot = v.segment(reply_seq=1, emo="sad", idle_pos=0)
    assert rot == 700


def test_무감정은_idle_위치에서_시작하고_idle_이_말끝에서_이어받는다(tmp_path):
    a = find_assets(str(_assets(tmp_path)), "9232")
    v = EmotionVideo(a, cycle_len=588)
    path, rot = v.segment(reply_seq=1, emo="neutral", idle_pos=120)
    assert path == a["neutral"] and rot == 120
    v.advance(500)
    assert v.idle_resume_pos() == (120 + 500) % 588


def test_새_답이면_다시_고른다(tmp_path):
    a = find_assets(str(_assets(tmp_path)), "9232")
    v = EmotionVideo(a, cycle_len=588)
    v.segment(reply_seq=1, emo="warm", idle_pos=0)
    v.advance(40)
    path, rot = v.segment(reply_seq=2, emo="calm", idle_pos=77)
    assert path == a["neutral"] and rot == 77


def test_감정_모름은_무감정(tmp_path):
    a = find_assets(str(_assets(tmp_path)), "9232")
    v = EmotionVideo(a, cycle_len=588)
    path, _ = v.segment(reply_seq=1, emo=None, idle_pos=0)
    assert path == a["neutral"]
    path, _ = v.segment(reply_seq=2, emo="surprised", idle_pos=0)
    assert path == a["neutral"]


def test_idle_위치_오프셋():
    from idle import _select_idle_frame
    frames = list(range(100))
    f, t0 = _select_idle_frame(10.0, 0.0, 0.5, frames, 0.0, None, offset=30)
    assert f == 30 and t0 == 10.0
    f, _ = _select_idle_frame(11.0, 0.0, 0.5, frames, t0, None, offset=30)
    assert f == 55
    f, _ = _select_idle_frame(11.0, 0.0, 0.5, frames, t0, None)   # 기본은 지금과 같다
    assert f == 25
    assert ev  # noqa


def test_준비_표시가_있으면_적힌_클립만_쓴다(tmp_path):
    root = _assets(tmp_path)
    d = ev.emo_dir(str(root), "9232")
    ev.mark_ready(d, "neutral", "idle", "agreement")
    a = find_assets(str(root), "9232")
    assert set(a) == {"neutral", "idle", "agreement"}  # 굽는 중인 나머지 클립은 안 쓴다
    e = EmotionVideo(a, cycle_len=588)
    assert e.clip_for("angry") == "neutral" and e.clip_for("happy") == "agreement"


def test_준비_표시가_비어_있으면_감정_영상_안_씀(tmp_path):
    root = _assets(tmp_path)
    (tmp_path / "9232" / "emo" / ev.READY).write_text("")
    assert find_assets(str(root), "9232") is None


def test_준비_표시는_더해지고_순서가_고정된다(tmp_path):
    d = tmp_path / "emo"
    d.mkdir()
    ev.mark_ready(str(d), "agreement")
    ev.mark_ready(str(d), "idle", "neutral", "agreement")
    assert (d / ev.READY).read_text().split() == ["neutral", "idle", "agreement"]
    assert ev.ready_clips(str(d)) == {"neutral", "idle", "agreement"}
    assert not (d / (ev.READY + ".tmp")).exists()


def test_기본_세트(monkeypatch):
    assert set(ev.BASE_CLIPS) == {"neutral", "idle", "agreement"}
    monkeypatch.delenv("PRETHIRD_EMO_VIDEO_AUTO", raising=False)
    assert not ev.auto_enabled()
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    assert ev.auto_enabled()


# AFL-1072 관리자 「감정 설정」 영상 — 설정 파일이 정본, 없거나 깨지면 env.
def _write_cfg(path, video):
    import json
    tmp = str(path) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump({"voice": {"enabled": True, "choice": {}}, "video": video}, f)
    os.replace(tmp, path)


@pytest.mark.parametrize("video, allowed, denied", [
    ({"mode": "off", "clones": ["9232"]}, [], ["9232", "9075"]),
    ({"mode": "all", "clones": []}, ["9232", "9075", "preset-3"], []),
    ({"mode": "some", "clones": ["9194", "preset-3"]}, ["9194", 9194, "preset-3"], ["9232"]),
])
def test_설정_파일_영상_모드(monkeypatch, tmp_path, video, allowed, denied):
    p = tmp_path / "emotion_config.json"
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(p))
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_CLONES", "9232")  # 파일이 있으면 env 는 안 본다
    _write_cfg(p, video)
    assert all(enabled_for(c) for c in allowed)
    assert not any(enabled_for(c) for c in denied)
    assert not enabled_for(None)


@pytest.mark.parametrize("content", ["{깨짐", '{"voice": {}}', '{"video": {"mode": "maybe"}}',
                                     '{"video": {"mode": "some", "clones": ["9232\\n"]}}'])
def test_설정_파일이_깨지거나_영상값_없으면_env(monkeypatch, tmp_path, content):
    p = tmp_path / "emotion_config.json"
    p.write_text(content, encoding="utf-8")
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(p))
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_CLONES", "9232")
    assert enabled_for("9232") and not enabled_for("9075")


def test_설정_저장하면_다음_호출부터_반영(monkeypatch, tmp_path):
    p = tmp_path / "emotion_config.json"
    monkeypatch.setenv("EMOTION_CONFIG_PATH", str(p))
    _write_cfg(p, {"mode": "some", "clones": ["9232"]})
    assert enabled_for("9232")
    st = os.stat(p)
    _write_cfg(p, {"mode": "off", "clones": ["9232"]})
    os.utime(p, ns=(st.st_atime_ns, st.st_mtime_ns))  # 같은 mtime 이어도 inode·크기로 잡는다
    assert not enabled_for("9232")


def _with_versions(tmp_path, monkeypatch, secs=(2, 3, 4)):
    monkeypatch.setenv("PRETHIRD_EMO_LEN_SECS", ",".join(map(str, secs)))
    root = _assets(tmp_path)
    d = ev.emo_dir(str(root), "9232")
    for s in secs:
        (tmp_path / "9232" / "emo" / f"9232-emo-disagreement-{s}s.mp4").write_bytes(b"x")
    ev.mark_ready(d, *ev.CLIPS, *(ev.version_key("disagreement", s) for s in secs))
    return find_assets(str(root), "9232")


def test_길이_버전은_준비_표시된_것만_찾는다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_LEN_SECS", "2,3")
    root = _assets(tmp_path)
    d = ev.emo_dir(str(root), "9232")
    for s in (2, 3):
        (tmp_path / "9232" / "emo" / f"9232-emo-disagreement-{s}s.mp4").write_bytes(b"x")
    ev.mark_ready(d, *ev.CLIPS, "disagreement@2")  # 3초는 굽는 중
    a = find_assets(str(root), "9232")
    assert set(a["versions"]["disagreement"]) == {2}
    assert (tmp_path / "9232" / "emo" / ev.READY).read_text().split()[-1] == "disagreement@2"


def test_길이_버전_끄면_원본_클립(tmp_path, monkeypatch):
    a = _with_versions(tmp_path, monkeypatch)
    monkeypatch.delenv("PRETHIRD_EMO_LEN_SECS")
    a = find_assets(str(tmp_path), "9232")
    assert "versions" not in a


def test_추정보다_조금_짧은_버전을_고른다(tmp_path, monkeypatch):
    e = EmotionVideo(_with_versions(tmp_path, monkeypatch), cycle_len=588)
    assert e.pick_version("disagreement", 90) == 3     # 3.6초 → 3초
    assert e.pick_version("disagreement", 1000) == 4   # 가장 긴 버전
    assert e.pick_version("disagreement", 30) == 2     # 2초보다 짧으면 가장 짧은 버전
    assert e.pick_version("disagreement", None) == 2
    assert e.pick_version("warm_calm", 90) is None     # 버전 없는 클립


def test_말이_버전보다_길면_버전_끝에서_무감정_0번으로_잇는다(tmp_path, monkeypatch):
    e = EmotionVideo(_with_versions(tmp_path, monkeypatch), cycle_len=588)
    p1 = e.plan(1, "angry", idle_pos=300, frames=50, est_frames=90)   # 3초 버전(75프레임)
    assert p1 == [(e.versions["disagreement"][3], 0, 50)]
    e.advance(50)
    assert e.clip == "disagreement@3"
    p2 = e.plan(1, "angry", idle_pos=300, frames=40)
    assert p2 == [(e.versions["disagreement"][3], 50, 25), (e.assets["neutral"], 0, 15)]
    e.advance(25)
    assert e.clip == "neutral"
    e.advance(15)
    assert e.idle_resume_pos() == 15   # 무감정 한 시계로 이어짐
    assert e.tail_frames(1) == 0


def test_말이_버전보다_짧으면_남은_프레임을_마무리한다(tmp_path, monkeypatch):
    e = EmotionVideo(_with_versions(tmp_path, monkeypatch), cycle_len=588)
    e.plan(1, "angry", idle_pos=0, frames=40, est_frames=40)   # 2초 버전(50프레임)
    e.advance(40)
    assert e.tail_frames(1) == 10
    assert e.tail_frames(2) == 0   # 다른 답이면 없음
    assert e.plan(1, "angry", 0, 10) == [(e.versions["disagreement"][2], 40, 10)]
    e.advance(10)
    assert e.tail_frames(1) == 0 and e.idle_resume_pos() == 0


def test_버전_없는_감정은_예전처럼_원본_누적(tmp_path, monkeypatch):
    e = EmotionVideo(_with_versions(tmp_path, monkeypatch), cycle_len=588)
    assert e.plan(1, "warm", 0, 30, est_frames=90) == [(e.assets["warm_calm"], 0, 30)]
    e.advance(30)
    assert e.plan(1, "warm", 0, 30) == [(e.assets["warm_calm"], 30, 30)]
    assert e.tail_frames(1) == 0


def test_답_길이_추정은_글자_수_기준이고_조각보다_짧지_않다(monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_SEC_PER_CHAR", "0.27")
    assert ev.estimate_frames("아니, 그건 아니야.", True, 10) == int(7 * 0.27 * 25)
    assert ev.estimate_frames("", False, 40) == 40


def test_wav_를_프레임_지점에서_나눈다(tmp_path):
    import wave
    p = tmp_path / "a.wav"
    with wave.open(str(p), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        w.writeframes(b"\x01\x00" * 16000 * 2)   # 2초 = 50프레임
    assert ev.wav_frames(str(p)) == 50
    a, b = ev.split_wav(str(p), 20)
    assert ev.wav_frames(a) == 20 and ev.wav_frames(b) == 30
    os.unlink(a)
    os.unlink(b)


def test_예열은_무감정_먼저_자주_쓰는_길이부터_감정을_번갈아(tmp_path, monkeypatch):
    a = _with_versions(tmp_path, monkeypatch, secs=(2, 3, 4))
    paths = ev.prewarm_paths(a)
    assert paths[0] == a["neutral"]
    assert paths[1:4] == [a["versions"]["disagreement"][s] for s in (4, 3, 2)]  # 4→3→2(자주 쓰는 순)
    assert a["warm_calm"] in paths and a["idle"] not in paths                    # 버전 없는 감정은 원본, idle 제외
