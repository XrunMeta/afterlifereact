"""AFL-1064 감정 영상 세트 굽기 대기열 — 처음 통화한 클론의 세트를 백그라운드로 굽는다.

통화 시작(offer)에서 얼굴 사진을 받은 뒤 enqueue(clone) 를 부른다. 굽기는 한 번에 한 클론씩,
fifth/scripts/bake_clone_emo.sh 를 하위 프로세스로 돌린다. 스크립트가 기본 세트 → 나머지 순서로 굽고
클립마다 준비 표시(emo/ready.txt)를 남기므로, 기본 세트가 끝난 뒤의 다음 통화부터 감정 영상이 켜진다.
중간에 죽어도 다음 통화에서 다시 넣으면 이미 표시된 클립은 건너뛴다.

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

_lock = asyncio.Lock()
_pending: set[str] = set()


def needs_bake(video_ref_root: str, clone_id) -> bool:
    """얼굴 사진이 있고, 준비 표시가 없거나 덜 찬 클론. 표시 없이 손으로 구운 옛 세트(무감정+idle)는 건드리지 않는다."""
    c = str(clone_id)
    if not os.path.isfile(os.path.join(video_ref_root, c, f"{c}-face.jpg")):
        return False
    d = emotion_video.emo_dir(video_ref_root, c)
    ready = emotion_video.ready_clips(d)
    if ready is None:
        return emotion_video.find_assets(video_ref_root, c) is None
    return not set(emotion_video.CLIPS) <= ready


def enqueue(video_ref_root: str, clone_id) -> bool:
    """굽기가 필요하면 대기열에 넣고 True. 이미 들어 있거나 필요 없으면 False."""
    if clone_id is None or not emotion_video.auto_enabled():
        return False
    c = str(clone_id)
    if c in _pending or not needs_bake(video_ref_root, c):
        return False
    _pending.add(c)
    asyncio.get_running_loop().create_task(_run(c))
    log.info("[AFL-1064] 굽기 대기열 추가 clone=%s 대기=%d", c, len(_pending))
    return True


async def _run(clone_id: str) -> None:
    try:
        async with _lock:
            log.info("[AFL-1064] 굽기 시작 clone=%s", clone_id)
            proc = await asyncio.create_subprocess_exec(
                "bash", BAKE_CMD, clone_id,
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
            try:
                out, _ = await asyncio.wait_for(proc.communicate(), timeout=BAKE_TIMEOUT)
            except asyncio.TimeoutError:
                proc.kill()
                await proc.wait()
                log.warning("[AFL-1064] 굽기 타임아웃 clone=%s (%ss)", clone_id, BAKE_TIMEOUT)
                return
            tail = out.decode(errors="replace").strip().splitlines()[-8:]
            if proc.returncode != 0:
                log.warning("[AFL-1064] 굽기 실패 clone=%s rc=%s: %s", clone_id, proc.returncode, " | ".join(tail))
            else:
                log.info("[AFL-1064] 굽기 완료 clone=%s %s", clone_id, " | ".join(tail[-2:]))
    except Exception as e:  # 굽기는 부가 작업 — 통화 서버를 깨지 않는다
        log.warning("[AFL-1064] 굽기 예외 clone=%s: %s", clone_id, e)
    finally:
        _pending.discard(clone_id)
