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


class UnsafeEnvValueError(ValueError):
    """env 값이 화이트리스트를 벗어남 — systemd 지시문 인젝션(RCE) 위험(mizu VETO)."""


# mizu VETO(CRITICAL 1): 개행·따옴표·대괄호 등은 systemd drop-in Environment= 라인에
# 삽입되면 지시문 인젝션(예: `[Service]\nExecStart=...`)으로 이어질 수 있다.
# 영숫자·`_./: -` 만 허용(화이트리스트) — 그 외는 즉시 거부.
# mizu R2: `^...$`의 `$`는 파이썬 정규식에서 "문자열 끝 또는 끝 개행 직전"까지
# 매치해 트레일링 개행 1개(`"gemma3\n"`)를 통과시켜버린다(RCE는 아니나 systemd
# 유닛 파일이 물리적으로 두 줄로 쪼개져 파싱 손상 → 가용성 리스크). `\A...\Z`는
# 이 예외가 없어 트레일링 개행도 확실히 거부한다.
_SAFE_ENV_VAL = re.compile(r'\A[A-Za-z0-9_./:\- ]*\Z')


def _validate_env_value(value) -> None:
    """value가 화이트리스트를 벗어나면 UnsafeEnvValueError."""
    s = "" if value is None else str(value)
    # mizu R2: 개행류는 이중 방어(화이트리스트 정규식 + 명시적 문자 검사) —
    # `\A...\Z` 만으로 충분하지만 실수로 앵커가 되돌아가도 여기서 한 번 더 막는다.
    if "\n" in s or "\r" in s:
        raise UnsafeEnvValueError(f"unsafe env value rejected(newline): {value!r}")
    if not _SAFE_ENV_VAL.match(s):
        raise UnsafeEnvValueError(f"unsafe env value rejected: {value!r}")


def _knob_value(knobs, path):
    section, key = path.split(".")
    return getattr(getattr(knobs, section), key)


def _fmt(v):
    if v is None:
        return ""   # el BLOCKER 2: None → 리터럴 "None" 생성 방지
    if isinstance(v, bool):
        return "1" if v else "0"
    return str(v)


def diff(knobs, read_env_fn, dirty: set | None = None) -> list:
    """현재 라이브 env(read_env_fn) 대비 변경될 항목만.

    el BLOCKER 2:
      - dirty 지정 시(None이 아니면) dirty에 포함된 knob 경로만 비교 대상으로
        삼는다 — registry.dirty()를 넘기면 "이번 세션에 실제로 튜닝한 항목"만
        promote 후보가 되어, 건드리지 않은 knob이 env 미설정(빈 문자열)과
        달라 보여 오탐되는 문제를 없앤다. dirty=None(기본)이면 필터 없이 전체 비교
        (레거시 동작 — 기존 단위테스트 호환).
      - knob 값이 None이면(예: dialogue.model 미설정) 아예 스킵(promote 후보에서 제외).
    """
    out = []
    for path, loc in KNOB_TO_LIVE.items():
        if dirty is not None and path not in dirty:
            continue
        val = _knob_value(knobs, path)
        if val is None:
            continue
        new = _fmt(val)
        cur = read_env_fn(loc["env"])
        if new != cur:
            out.append({"key": path, "env": loc["env"], "current": cur,
                        "new": new, "file": loc["file"],
                        "container": loc.get("container", False)})
    return out


def apply(entries, write_fn, backup_fn, dry_run: bool = True) -> dict:
    """entries를 라이브에 반영. dry_run=True면 파일 미변경.

    mizu VETO(CRITICAL 1): write 전 **모든** entry.new를 화이트리스트로 검증한다.
    하나라도 불량이면 write_fn/backup_fn을 단 한 번도 호출하지 않고(부분 write
    없이) UnsafeEnvValueError를 던진다 — dry_run 여부와 무관하게 항상 검증한다.
    """
    for e in entries:
        _validate_env_value(e["new"])

    if dry_run:
        return {"dry_run": True, "planned": entries, "backup_ids": []}
    backups = []
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

    mizu VETO(CRITICAL 1): value를 화이트리스트로 검증 후에만 쓴다 — 개행·따옴표·
    대괄호 등 systemd 지시문 인젝션에 쓰일 수 있는 문자는 거부(UnsafeEnvValueError).
    """
    _validate_env_value(value)
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
    """path를 KST 타임스탬프 접미사로 백업(`<path>.bak-<ts>`), 0600 권한.

    원본이 없으면(첫 upsert로 신규 생성될 파일) 백업 대상이 없으므로 None 반환
    — apply()의 backup_ids에 None이 섞일 수 있음(호출부가 감안).
    """
    if not os.path.exists(path):
        return None
    backup_path = f"{path}.bak-{_kst_ts()}"
    shutil.copy2(path, backup_path)
    os.chmod(backup_path, 0o600)   # mizu MED 5
    return backup_path


# mizu R2: `_SAFE_ENV_VAL`과 동일 특성(`$` 트레일링 개행 예외) → 일관되게 \A...\Z.
_BACKUP_NAME_RE = re.compile(r'\A.+\.bak-\d{8}-\d{6}\Z')


def _dropin_root() -> str:
    return os.path.realpath(os.path.dirname(_PRETHIRD_DROPIN))


def restore_file(backup_id, allowed_root: str | None = None) -> str:
    """backup_id(`<path>.bak-<ts>`)로부터 원본 경로를 복원. 반환: 복원된 원본 경로.

    mizu HIGH 4: backup_id가 허용 디렉토리(기본: 프로덕션 드롭인 디렉토리) 하위이고
    파일명이 `<원본>.bak-<타임스탬프>` 형식인지 엄격 검증한 뒤에만 복원한다
    (경로탈출·임의파일 복원 차단). allowed_root는 테스트 주입용(기본은 프로덕션
    드롭인 디렉토리 — 실 서비스 호출 시 이 기본값으로 검증됨).
    """
    if not backup_id:
        raise ValueError(f"invalid backup_id: {backup_id!r}")
    root = os.path.realpath(allowed_root) if allowed_root is not None else _dropin_root()
    real = os.path.realpath(str(backup_id))
    if os.path.commonpath([real, root]) != root:
        raise ValueError(f"backup_id 경로가 허용 디렉토리 밖: {backup_id!r}")
    if not _BACKUP_NAME_RE.match(os.path.basename(real)):
        raise ValueError(f"invalid backup_id format: {backup_id!r}")
    if not os.path.exists(real):
        raise ValueError(f"invalid backup_id: {backup_id!r}")
    target = real.rsplit(".bak-", 1)[0]
    shutil.copy2(real, target)
    return target
