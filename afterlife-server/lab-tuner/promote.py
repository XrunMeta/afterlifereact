# promote.py
from __future__ import annotations

import os
import re
import shutil
from datetime import datetime, timedelta, timezone

_KST = timezone(timedelta(hours=9))

# knob 경로 → 라이브 위치. drop-in conf는 systemd override(EnvironmentFile 또는 Environment).
# 실제 경로는 배포 환경에 맞춰 조정(스파이크 문서 참조). engine-baked는 fifth 컨테이너 env.
_PRETHIRD_DROPIN = "/etc/systemd/system/afterlife-prethird.service.d/lab-tuner.conf"
_FIFTH_ENV_NOTE = "docker(fifth_poc_flp) env — 컨테이너 재기동/커밋 필요"

KNOB_TO_LIVE = {
    "tts.speed": {"env": "PRETHIRD_TTS_SPEED", "file": _PRETHIRD_DROPIN},
    "dialogue.model": {"env": "PRETHIRD_OLLAMA_MODEL", "file": _PRETHIRD_DROPIN},
    "transport.playback_buffer_ms": {"env": "PRETHIRD_PLAYBACK_BUFFER_MS", "file": _PRETHIRD_DROPIN},
    "transport.idle_grace_sec": {"env": "IDLE_GRACE_SEC", "file": _PRETHIRD_DROPIN},
    "transport.width": {"env": "PRETHIRD_WIDTH", "file": _PRETHIRD_DROPIN},
    "transport.height": {"env": "PRETHIRD_HEIGHT", "file": _PRETHIRD_DROPIN},
    "filler.enabled": {"env": "PRETHIRD_FILLER", "file": _PRETHIRD_DROPIN},
    # engine-baked (fifth 컨테이너): 경고 동반
    # fifth idle(per-request이나 라이브 기본값도 갱신 가능) + cfg(startup-baked). 전부 fifth 렌더 env(컨테이너).
    "fifth.idle_motion_scale": {"env": "FIFTH_IDLE_MOTION_SCALE", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.idle_rms_low": {"env": "FIFTH_IDLE_RMS_LOW", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.idle_rms_high": {"env": "FIFTH_IDLE_RMS_HIGH", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.head_slew_frames": {"env": "FIFTH_HEAD_SLEW_FRAMES", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.cfg_scale": {"env": "FIFTH_CFG_SCALE", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.driving_multiplier": {"env": "FIFTH_DRIVING_MULTIPLIER", "file": _FIFTH_ENV_NOTE, "container": True},
}


def _knob_value(knobs, path):
    section, key = path.split(".")
    return getattr(getattr(knobs, section), key)


def _fmt(v):
    if isinstance(v, bool):
        return "1" if v else "0"
    return str(v)


def diff(knobs, read_env_fn) -> list:
    """현재 라이브 env(read_env_fn) 대비 변경될 항목만."""
    out = []
    for path, loc in KNOB_TO_LIVE.items():
        new = _fmt(_knob_value(knobs, path))
        cur = read_env_fn(loc["env"])
        if new != cur:
            out.append({"key": path, "env": loc["env"], "current": cur,
                        "new": new, "file": loc["file"],
                        "container": loc.get("container", False)})
    return out


def apply(entries, write_fn, backup_fn, dry_run: bool = True) -> dict:
    """entries를 라이브에 반영. dry_run=True면 파일 미변경."""
    backups = []
    if dry_run:
        return {"dry_run": True, "planned": entries, "backup_ids": []}
    seen_files = set()
    for e in entries:
        f = e["file"]
        if f not in seen_files:
            backups.append(backup_fn(f))
            seen_files.add(f)
        write_fn(f, e["env"], e["new"])
    return {"dry_run": False, "backup_ids": backups}


def rollback(backup_id, restore_fn):
    return restore_fn(backup_id)


# ---------------------------------------------------------------------------
# 실 write_fn/backup_fn/restore_fn 구현 (app.py가 real 경로로 주입).
# 단위테스트는 반드시 tmp_path 경로로만 호출한다(실 systemd 경로 미접근).
# ---------------------------------------------------------------------------

def _kst_ts() -> str:
    """KST(UTC+9) 타임스탬프(백업 파일명 접미사)."""
    return datetime.now(_KST).strftime("%Y%m%d-%H%M%S")


def upsert_env_line(path: str, env: str, value: str) -> None:
    """systemd drop-in(.conf)의 `Environment="K=V"` 라인을 upsert.

    파일이 없으면 [Service] 섹션과 함께 새로 생성. 같은 env 라인이 이미 있으면
    교체, 없으면 [Service] 섹션 끝에 추가.
    """
    line = f'Environment="{env}={value}"'
    if os.path.exists(path):
        with open(path) as f:
            lines = f.read().splitlines()
    else:
        lines = ["[Service]"]

    pattern = re.compile(rf'^Environment="{re.escape(env)}=')
    replaced = False
    for i, existing in enumerate(lines):
        if pattern.match(existing):
            lines[i] = line
            replaced = True
            break
    if not replaced:
        lines.append(line)

    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")


def backup_file(path: str):
    """path를 KST 타임스탬프 접미사로 백업(`<path>.bak-<ts>`).

    원본이 없으면(첫 upsert로 신규 생성될 파일) 백업 대상이 없으므로 None 반환
    — apply()의 backup_ids에 None이 섞일 수 있음(호출부가 감안).
    """
    if not os.path.exists(path):
        return None
    backup_path = f"{path}.bak-{_kst_ts()}"
    shutil.copy2(path, backup_path)
    return backup_path


def restore_file(backup_id) -> str:
    """backup_id(`<path>.bak-<ts>`)로부터 원본 경로를 복원. 반환: 복원된 원본 경로."""
    if not backup_id or ".bak-" not in str(backup_id) or not os.path.exists(backup_id):
        raise ValueError(f"invalid backup_id: {backup_id!r}")
    target = str(backup_id).rsplit(".bak-", 1)[0]
    shutil.copy2(backup_id, target)
    return target
