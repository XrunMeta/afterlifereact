"""AFL-1064 감정 영상 세트 굽기 대기열 — 클론의 세트를 백그라운드로 굽는다.

넣는 곳 세 군데:
  - 클론을 만들 때(AFL-1073): afterlifeapi createClone → POST /oth-path 가 얼굴 사진을 받은 뒤 enqueue.
  - 통화 시작(offer): 얼굴 사진을 받은 뒤 enqueue — 만들 때 놓친 클론(옛 클론·실패)의 안전망.
  - 관리자 「다시 굽기」(AFL-1073): enqueue(rebake=True) — 표시를 비우고 처음부터.
굽기는 한 번에 한 클론씩, fifth/scripts/bake_clone_emo.sh 를 하위 프로세스로 돌린다. 스크립트가 기본 세트 → 나머지
순서로 굽고 클립마다 준비 표시(emo/ready.txt)를 남기므로, 기본 세트가 끝난 뒤의 다음 통화부터 감정 영상이 켜진다.
중간에 죽어도 다음에 다시 넣으면 이미 표시된 클립은 건너뛴다.

크래시 뒤 이어 굽기(sungjius 11-01): 통화가 없어도 서버 시작 때와 PRETHIRD_EMO_BAKE_SWEEP_S(기본 600초)마다
video-ref 를 훑어, 굽기를 시작했다가(ready.txt 있음) 덜 끝난 클론을 다시 넣는다. 같은 클론이 연달아
PRETHIRD_EMO_BAKE_MAX_FAIL(기본 3)번 실패하면 서버 재시작 전까지(또는 관리자 다시 굽기 전까지) 다시 넣지 않는다.
길이 버전(PRETHIRD_EMO_LEN_SECS)이 켜져 있으면 감정 클립마다 그 버전들까지 다 표시돼야 끝난 것으로 본다.

켜기(is_target): 관리자 「감정 설정」 영상 값(all·some 목록, 설정 파일이 없으면 PRETHIRD_EMO_VIDEO_AUTO=1)이거나,
이미 굽기를 시작한 클론(끝까지 굽는다)이거나, 클론 생성 때 「생성 즉시 굽기」(video.bake_on_create)가 켜져 있을 때.
대상이 아니면 enqueue 는 아무것도 하지 않는다(다시 굽기는 관리자가 직접 고른 것이라 예외).
"""
from __future__ import annotations

import asyncio
import collections
import logging
import os
import time

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
# 관리자 상태 화면용(서버 재시작하면 비워진다 — 진행 정도는 ready.txt 가 정본).
_jobs: dict[str, dict] = {}   # 대기·굽는 중: {state, rebake, queued_at, started_at, stage}
_last: dict[str, dict] = {}   # 마지막 결과: {ok, rc, finished_at, sec, rebake, tail}


def wanted(video_ref_root: str, clone_id) -> set[str]:
    """다 구웠을 때 준비 표시에 있어야 할 이름들 — 클립 6개 + 감정 클립별 길이 버전."""
    out = set(emotion_video.CLIPS)
    for clip in emotion_video.EMO_CLIPS:
        for sec in emotion_video.len_secs():
            out.add(emotion_video.version_key(clip, sec))
    return out


def face_path(video_ref_root: str, clone_id) -> str:
    c = str(clone_id)
    return os.path.join(video_ref_root, c, f"{c}-face.jpg")


def needs_bake(video_ref_root: str, clone_id) -> bool:
    """얼굴 사진이 있고, 준비 표시가 없거나 덜 찬 클론. 표시 없이 손으로 구운 옛 세트(무감정+idle)는 건드리지 않는다."""
    c = str(clone_id)
    if not os.path.isfile(face_path(video_ref_root, c)):
        return False
    d = emotion_video.emo_dir(video_ref_root, c)
    ready = emotion_video.ready_clips(d)
    if ready is None:
        return emotion_video.find_assets(video_ref_root, c) is None
    return not wanted(video_ref_root, c) <= ready


def started(video_ref_root: str, clone_id) -> bool:
    """굽기를 시작한 클론(emo/ready.txt 있음)."""
    return os.path.isfile(os.path.join(emotion_video.emo_dir(video_ref_root, clone_id), emotion_video.READY))


def is_target(video_ref_root: str, clone_id, on_create: bool = False) -> bool:
    """대기열에 넣어도 되는 클론 — 영상 설정 대상이거나, 이미 시작한 굽기(끝까지 굽는다),
    또는 클론 생성 때 「생성 즉시 굽기」가 켜져 있을 때."""
    return (emotion_video.bake_enabled(clone_id) or started(video_ref_root, clone_id)
            or (on_create and emotion_video.bake_on_create()))


def enqueue(video_ref_root: str, clone_id, rebake: bool = False, on_create: bool = False) -> bool:
    """굽기가 필요하면 대기열에 넣고 True. 이미 들어 있거나 필요 없으면 False.

    rebake=True(관리자 다시 굽기): 대상 판정·완료 여부·연속 실패와 상관없이 얼굴 사진만 있으면 처음부터 굽는다.
    on_create=True(/emo-bake): 「생성 즉시 굽기」가 켜져 있으면 영상 설정 대상이 아니어도 굽는다."""
    if clone_id is None:
        return False
    c = str(clone_id)
    if c in _pending:
        return False
    if rebake:
        if not os.path.isfile(face_path(video_ref_root, c)):
            return False
        _fails.pop(c, None)
    elif (not is_target(video_ref_root, c, on_create) or _fails.get(c, 0) >= MAX_FAIL
          or not needs_bake(video_ref_root, c)):
        return False
    _pending.add(c)
    _jobs[c] = {"state": "queued", "rebake": rebake, "queued_at": time.time(), "started_at": None, "stage": None}
    asyncio.get_running_loop().create_task(_run(c, rebake))
    log.info("[AFL-1064] 굽기 대기열 추가 clone=%s rebake=%s 대기=%d", c, rebake, len(_pending))
    return True


async def _run(clone_id: str, rebake: bool = False) -> None:
    tail: collections.deque[str] = collections.deque(maxlen=8)
    job = _jobs.get(clone_id, {})
    try:
        async with _lock:
            log.info("[AFL-1064] 굽기 시작 clone=%s rebake=%s", clone_id, rebake)
            job.update(state="running", started_at=time.time())
            t0 = time.monotonic()
            # 굽기 스크립트의 길이 버전 목록을 통화 쪽(PRETHIRD_EMO_LEN_SECS)과 같게 맞춘다.
            env = dict(os.environ, EMO_LEN_SECS=" ".join(map(str, emotion_video.len_secs())))
            if rebake:
                env["EMO_REBAKE"] = "1"
            proc = await asyncio.create_subprocess_exec(
                "bash", BAKE_CMD, clone_id, env=env,
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)

            async def _pump() -> None:
                # 줄마다 받아 마지막 단계("[시간] 기본 단계 …")를 상태 화면에 보여 준다.
                async for raw in proc.stdout:
                    line = raw.decode(errors="replace").strip()
                    if line:
                        tail.append(line)
                        job["stage"] = line[:200]
                await proc.wait()

            try:
                await asyncio.wait_for(_pump(), timeout=BAKE_TIMEOUT)
            except asyncio.TimeoutError:
                proc.kill()
                await proc.wait()
                _fails[clone_id] = _fails.get(clone_id, 0) + 1
                log.warning("[AFL-1064] 굽기 타임아웃 clone=%s (%ss)", clone_id, BAKE_TIMEOUT)
                _finish(clone_id, ok=False, rc=None, sec=time.monotonic() - t0, rebake=rebake,
                        tail=list(tail) + [f"시간 초과({BAKE_TIMEOUT:.0f}초)"])
                return
            ok = proc.returncode == 0
            if not ok:
                _fails[clone_id] = _fails.get(clone_id, 0) + 1
                log.warning("[AFL-1064] 굽기 실패 clone=%s rc=%s 연속=%d: %s",
                            clone_id, proc.returncode, _fails[clone_id], " | ".join(tail))
            else:
                _fails.pop(clone_id, None)
                log.info("[AFL-1064] 굽기 완료 clone=%s %s", clone_id, " | ".join(list(tail)[-2:]))
            _finish(clone_id, ok=ok, rc=proc.returncode, sec=time.monotonic() - t0, rebake=rebake, tail=list(tail))
    except Exception as e:  # 굽기는 부가 작업 — 통화 서버를 깨지 않는다
        log.warning("[AFL-1064] 굽기 예외 clone=%s: %s", clone_id, e)
        _finish(clone_id, ok=False, rc=None, sec=None, rebake=rebake, tail=list(tail) + [f"예외: {e}"])
    finally:
        _pending.discard(clone_id)
        _jobs.pop(clone_id, None)


def _finish(clone_id: str, ok: bool, rc, sec, rebake: bool, tail: list) -> None:
    _last[clone_id] = {"ok": ok, "rc": rc, "finished_at": time.time(),
                       "sec": None if sec is None else round(sec, 1), "rebake": rebake, "tail": tail[-8:]}


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
    """서버 시작 직후 한 번, 그 뒤 SWEEP_S 마다. 굽기 대상이 아닌 클론은 enqueue 가 막는다."""
    while True:
        try:
            added = sweep(video_ref_root)
            if added:
                log.info("[AFL-1064] 이어 굽기 대기열 추가 clones=%s", added)
        except Exception as e:  # noqa: BLE001 — 점검 실패가 서버를 깨지 않게
            log.warning("[AFL-1064] 이어 굽기 점검 실패: %s", e)
        await asyncio.sleep(SWEEP_S)


# ── 관리자 상태(AFL-1073) ────────────────────────────────────────────────

# 상태 이름 — 화면은 이 값으로 색·문구를 고른다.
#   running 굽는 중 · queued 대기 · stopped 연속 실패로 멈춤 · failed 마지막 굽기 실패
#   done 다 구움 · partial 덜 구움(이어 굽기 대상) · legacy 표시 없이 손으로 구운 옛 세트 · none 안 구움 · no_face 얼굴 사진 없음
def clone_status(video_ref_root: str, clone_id) -> dict:
    c = str(clone_id)
    d = emotion_video.emo_dir(video_ref_root, c)
    ready = emotion_video.ready_clips(d)
    want = wanted(video_ref_root, c)
    face = os.path.isfile(face_path(video_ref_root, c))
    assets = emotion_video.find_assets(video_ref_root, c)
    legacy = ready is None and assets is not None
    job = _jobs.get(c)
    last = _last.get(c)
    if job:
        state = job["state"]
    elif _fails.get(c, 0) >= MAX_FAIL:
        state = "stopped"
    elif last and not last["ok"]:
        state = "failed"
    elif ready is not None and want <= ready:
        state = "done"
    elif legacy:
        state = "legacy"
    elif ready is not None:
        state = "partial"
    elif not face:
        state = "no_face"
    else:
        state = "none"
    return {
        "clone": c,
        "state": state,
        "face": face,
        "ready": len(want & ready) if ready is not None else 0,
        "total": len(want),
        "base_ready": ready is not None and set(emotion_video.BASE_CLIPS) <= ready,
        "legacy_clips": sorted(k for k in assets if k != "versions") if legacy else [],
        "bake_target": is_target(video_ref_root, c),
        "video_on": emotion_video.enabled_for(c) and assets is not None,
        "fails": _fails.get(c, 0),
        "job": dict(job) if job else None,
        "last": dict(last) if last else None,
    }


_STATE_ORDER = ("running", "queued", "stopped", "failed", "partial", "legacy", "none", "no_face", "done")


def status(video_ref_root: str, scope: str = "relevant") -> dict:
    """관리자 상태 표. scope=relevant: 설정 목록·굽기 시작·대기·최근 결과가 있는 클론, scope=all: 얼굴 사진 있는 클론 전부."""
    clones: set[str] = set(started_clones(video_ref_root)) | set(_jobs) | set(_last)
    setting = emotion_video.file_video_setting()
    if setting is not None:
        clones |= set(setting[1])
    if scope == "all":
        try:
            names = os.listdir(video_ref_root)
        except OSError:
            names = []
        clones |= {n for n in names if os.path.isfile(face_path(video_ref_root, n))}
    rows = [clone_status(video_ref_root, c) for c in clones]
    rows.sort(key=lambda r: (_STATE_ORDER.index(r["state"]), -int(r["clone"]) if r["clone"].isdigit() else 0, r["clone"]))
    return {
        "clones": rows,
        "running": next((c for c, j in _jobs.items() if j["state"] == "running"), None),
        "queued": sorted((c for c, j in _jobs.items() if j["state"] == "queued"), key=lambda c: _jobs[c]["queued_at"]),
        "video_setting": None if setting is None else {"mode": setting[0], "clones": sorted(setting[1])},
        "bake_on_create": emotion_video.bake_on_create(),
        "auto_env": emotion_video.auto_enabled(),
        "len_secs": list(emotion_video.len_secs()),
        "max_fail": MAX_FAIL,
    }
