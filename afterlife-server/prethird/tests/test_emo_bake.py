"""AFL-1064 감정 영상 세트 굽기 대기열."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import emo_bake  # noqa: E402
import emotion_video as ev  # noqa: E402


def _clone(tmp_path, clone="9300", face=True, clips=(), ready=None):
    d = tmp_path / clone / "emo"
    d.mkdir(parents=True)
    if face:
        (tmp_path / clone / f"{clone}-face.jpg").write_bytes(b"x")
    for c in clips:
        (d / f"{clone}-emo-{c}.mp4").write_bytes(b"x")
    if ready is not None:
        ev.mark_ready(str(d), *ready) if ready else (d / ev.READY).write_text("")
    return str(tmp_path)


def test_새_클론은_굽는다(tmp_path):
    assert emo_bake.needs_bake(_clone(tmp_path), "9300")


def test_얼굴_사진이_없으면_안_굽는다(tmp_path):
    assert not emo_bake.needs_bake(_clone(tmp_path, face=False), "9300")


def test_기본_세트만_있으면_나머지를_굽는다(tmp_path):
    root = _clone(tmp_path, clips=ev.CLIPS, ready=ev.BASE_CLIPS)
    assert emo_bake.needs_bake(root, "9300")


def test_다_구웠으면_안_굽는다(tmp_path):
    root = _clone(tmp_path, clips=ev.CLIPS, ready=ev.CLIPS)
    assert not emo_bake.needs_bake(root, "9300")


def test_표시_없이_구운_옛_세트는_건드리지_않는다(tmp_path):
    root = _clone(tmp_path, clips=ev.CLIPS)
    assert not emo_bake.needs_bake(root, "9300")


def test_자동_켜기_꺼지면_대기열에_안_넣는다(tmp_path, monkeypatch):
    monkeypatch.delenv("PRETHIRD_EMO_VIDEO_AUTO", raising=False)
    assert not emo_bake.enqueue(_clone(tmp_path), "9300")


def test_대기열은_한_클론을_한_번만_돌린다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    log = tmp_path / "ran.txt"
    cmd = tmp_path / "bake.sh"
    cmd.write_text(f'echo "$1" >> {log}; sleep 0.1\n')
    monkeypatch.setattr(emo_bake, "BAKE_CMD", str(cmd))
    root = _clone(tmp_path)

    async def go():
        assert emo_bake.enqueue(root, "9300")
        assert not emo_bake.enqueue(root, 9300)  # 이미 대기 중
        for _ in range(50):
            await asyncio.sleep(0.05)
            if not emo_bake._pending:
                break

    asyncio.run(go())
    assert log.read_text().split() == ["9300"]
    assert not emo_bake._pending


def test_길이_버전이_켜지면_버전까지_다_있어야_끝(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_LEN_SECS", "2,3")
    root = _clone(tmp_path, clips=ev.CLIPS, ready=ev.CLIPS)
    assert emo_bake.needs_bake(root, "9300")
    d = ev.emo_dir(root, "9300")
    ev.mark_ready(d, *(ev.version_key(c, s) for c in ev.EMO_CLIPS for s in (2, 3)))
    assert not emo_bake.needs_bake(root, "9300")


def test_연속_실패하면_다시_넣지_않는다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    monkeypatch.setattr(emo_bake, "_fails", {"9300": emo_bake.MAX_FAIL})
    assert not emo_bake.enqueue(_clone(tmp_path), "9300")


def test_실패하면_횟수를_세고_성공하면_지운다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    monkeypatch.setattr(emo_bake, "_fails", {})
    cmd = tmp_path / "bake.sh"
    cmd.write_text("exit 1\n")
    monkeypatch.setattr(emo_bake, "BAKE_CMD", str(cmd))
    root = _clone(tmp_path)

    async def run_once():
        assert emo_bake.enqueue(root, "9300")
        for _ in range(50):
            await asyncio.sleep(0.05)
            if not emo_bake._pending:
                break

    asyncio.run(run_once())
    assert emo_bake._fails == {"9300": 1}
    cmd.write_text("exit 0\n")
    asyncio.run(run_once())
    assert emo_bake._fails == {}


def test_이어_굽기는_시작한_클론만_다시_넣는다(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_EMO_VIDEO_AUTO", "1")
    monkeypatch.setattr(emo_bake, "_fails", {})
    started = []
    monkeypatch.setattr(emo_bake, "enqueue", lambda root, c: started.append(c) or True)
    _clone(tmp_path, clone="9300", ready=["neutral"])         # 시작했다가 멈춤
    _clone(tmp_path, clone="9301")                              # 통화 전 — 표시 없음
    _clone(tmp_path, clone="9302", clips=ev.CLIPS)             # 옛 세트 — 표시 없음
    assert emo_bake.started_clones(str(tmp_path)) == ["9300"]
    assert emo_bake.sweep(str(tmp_path)) == ["9300"]
