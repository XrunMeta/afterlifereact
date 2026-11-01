"""AFL-1064 감정 영상 세트 굽기 대기열 — 처음 통화한 클론의 세트를 백그라운드로 굽는다.

통화 시작(offer)에서 얼굴 사진을 받은 뒤 enqueue(clone) 를 부른다. 굽기는 한 번에 한 클론씩,
fifth/scripts/bake_clone_emo.sh 를 하위 프로세스로 돌린다. 스크립트가 기본 세트 → 나머지 순서로 굽고
클립마다 준비 표시(emo/ready.txt)를 남기므로, 기본 세트가 끝난 뒤의 다음 통화부터 감정 영상이 켜진다.
중간에 죽어도 다음 통화에서 다시 넣으면 이미 표시된 클립은 건너뛴다.

크래시 뒤 이어 굽기(sungjius 11-01): 통화가 없어도 서버 시작 때와 PRETHIRD_EMO_BAKE_SWEEP_S(기본 600초)마다
video-ref 를 훑어, 굽기를 시작했다가(ready.txt 있음) 덜 끝난 클론을 다시 넣는다. 같은 클론이 연달아
PRETHIRD_EMO_BAKE_MAX_FAIL(기본 3)번 실패하면 서버 재시작 전까지 다시 넣지 않는다(헛돌기 방지).
길이 버전(PRETHIRD_EMO_LEN_SECS)이 켜져 있으면 감정 클립마다 그 버전들까지 다 표시돼야 끝난 것으로 본다.

켜기: PRETHIRD_EMO_VIDEO_AUTO=1 (emotion_video.auto_enabled). 끄면 enqueue 는 아무것도 하지 않는다.
"""
from __future__ import annotations

import asyncio
import logging
import os

import emotion_video

log = logging.getLogger("prethird.emo_bake")

_HERE = os.path.dirname(os.path.abspath(__file__))
BAKE_CMD = os.environ.get(
    "PRETHIRD_EMO_BAKE_CMD",
    os.path.normpath(os.path.join(_HERE, "..", "..", "fifth", "scripts", "bake_clone_emo.sh")),
)
BAKE_TIMEOUT = float(os.environ.get("PRETHIRD_EMO_BAKE_TIMEOUT", "3600"))

MAX_FAIL = int(os.environ.get("PRETHIRD_EMO_BAKE_MAX_FAIL", "3"))
SWEEP_S = float(os.environ.get("PRETHIRD_EMO_BAKE_SWEEP_S", "600"))

_lock = asyncio.Lock()
_pending: set[str] = set()
_fails: dict[str, int] = {}


def wanted(video_ref_root: str, clone_id) -> set[str]:
    """다 구웠을 때 준비 표시에 있어야 할 이름들 — 클립 6개 + 감정 클립별 길이 버전."""
    out = set(emotion_video.CLIPS)
    for clip in emotion_video.EMO_CLIPS:
        for sec in emotion_video.len_secs():
            out.add(emotion_video.version_key(clip, sec))
    return out


def needs_bake(video_ref_root: str, clone_id) -> bool:
    """얼굴 사진이 있고, 준비 표시가 없거나 덜 찬 클론. 표시 없이 손으로 구운 옛 세트(무감정+idle)는 건드리지 않는다."""
    c = str(clone_id)
    if not os.path.isfile(os.path.join(video_ref_root, c, f"{c}-face.jpg")):
        return False
    d = emotion_video.emo_dir(video_ref_root, c)
    ready = emotion_video.ready_clips(d)
    if ready is None:
        return emotion_video.find_assets(video_ref_root, c) is None
    return not wanted(video_ref_root, c) <= ready


def enqueue(video_ref_root: str, clone_id) -> bool:
    """굽기가 필요하면 대기열에 넣고 True. 이미 들어 있거나 필요 없으면 False."""
    if clone_id is None or not emotion_video.auto_enabled():
        return False
    c = str(clone_id)
    if c in _pending or _fails.get(c, 0) >= MAX_FAIL or not needs_bake(video_ref_root, c):
        return False
    _pending.add(c)
    asyncio.get_running_loop().create_task(_run(c))
    log.info("[AFL-1064] 굽기 대기열 추가 clone=%s 대기=%d", c, len(_pending))
    return True


async def _run(clone_id: str) -> None:
    try:
        async with _lock:
            log.info("[AFL-1064] 굽기 시작 clone=%s", clone_id)
            # 굽기 스크립트의 길이 버전 목록을 통화 쪽(PRETHIRD_EMO_LEN_SECS)과 같게 맞춘다.
            env = dict(os.environ, EMO_LEN_SECS=" ".join(map(str, emotion_video.len_secs())))
            proc = await asyncio.create_subprocess_exec(
                "bash", BAKE_CMD, clone_id, env=env,
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
            try:
                out, _ = await asyncio.wait_for(proc.communicate(), timeout=BAKE_TIMEOUT)
            except asyncio.TimeoutError:
                proc.kill()
                await proc.wait()
                _fails[clone_id] = _fails.get(clone_id, 0) + 1
                log.warning("[AFL-1064] 굽기 타임아웃 clone=%s (%ss)", clone_id, BAKE_TIMEOUT)
                return
            tail = out.decode(errors="replace").strip().splitlines()[-8:]
            if proc.returncode != 0:
                _fails[clone_id] = _fails.get(clone_id, 0) + 1
                log.warning("[AFL-1064] 굽기 실패 clone=%s rc=%s 연속=%d: %s",
                            clone_id, proc.returncode, _fails[clone_id], " | ".join(tail))
            else:
                _fails.pop(clone_id, None)
                log.info("[AFL-1064] 굽기 완료 clone=%s %s", clone_id, " | ".join(tail[-2:]))
    except Exception as e:  # 굽기는 부가 작업 — 통화 서버를 깨지 않는다
        log.warning("[AFL-1064] 굽기 예외 clone=%s: %s", clone_id, e)
    finally:
        _pending.discard(clone_id)


def started_clones(video_ref_root: str) -> list[str]:
    """굽기를 시작한(emo/ready.txt 가 있는) 클론들."""
    try:
        names = os.listdir(video_ref_root)
    except OSError:
        return []
    return sorted(c for c in names if os.path.isfile(os.path.join(emotion_video.emo_dir(video_ref_root, c), emotion_video.READY)))


def sweep(video_ref_root: str) -> list[str]:
    """덜 끝난 굽기를 대기열에 다시 넣는다. 넣은 클론 목록."""
    return [c for c in started_clones(video_ref_root) if enqueue(video_ref_root, c)]


async def sweep_loop(video_ref_root: str) -> None:
    """서버 시작 직후 한 번, 그 뒤 SWEEP_S 마다. 자동 켜기가 꺼져 있으면 아무것도 안 한다(enqueue 가 막는다)."""
    while True:
        try:
            added = sweep(video_ref_root)
            if added:
                log.info("[AFL-1064] 이어 굽기 대기열 추가 clones=%s", added)
        except Exception as e:  # noqa: BLE001 — 점검 실패가 서버를 깨지 않게
            log.warning("[AFL-1064] 이어 굽기 점검 실패: %s", e)
        await asyncio.sleep(SWEEP_S)
