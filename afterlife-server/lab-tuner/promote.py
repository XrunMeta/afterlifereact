# promote.py
from __future__ import annotations

import os
import re
import shutil
from datetime import datetime, timedelta, timezone

from knobs import KNOB_META

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
    "transport.idle_source_mode": {"env": "IDLE_SOURCE_MODE", "file": _PRETHIRD_DROPIN},
    "filler.enabled": {"env": "PRETHIRD_FILLER", "file": _PRETHIRD_DROPIN},
    "filler.lookahead_sec": {"env": "FILLER_LOOKAHEAD_SEC", "file": _PRETHIRD_DROPIN},
    "filler.blend_frames": {"env": "PRETHIRD_IDLE_BLEND_FRAMES", "file": _PRETHIRD_DROPIN},
    "filler.idle_prebake": {"env": "FIFTH_IDLE_PREBAKE", "file": _PRETHIRD_DROPIN},
    "filler.order": {"env": "PRETHIRD_FILLER_ORDER", "file": _PRETHIRD_DROPIN},
    # engine-baked (fifth 컨테이너): 경고 동반
    # fifth idle(per-request이나 라이브 기본값도 갱신 가능) + cfg(startup-baked). 전부 fifth 렌더 env(컨테이너).
    "fifth.idle_motion_scale": {"env": "FIFTH_IDLE_MOTION_SCALE", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.idle_rms_low": {"env": "FIFTH_IDLE_RMS_LOW", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.idle_rms_high": {"env": "FIFTH_IDLE_RMS_HIGH", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.head_slew_frames": {"env": "FIFTH_HEAD_SLEW_FRAMES", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.cfg_scale": {"env": "FIFTH_CFG_SCALE", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.driving_multiplier": {"env": "FIFTH_DRIVING_MULTIPLIER", "file": _FIFTH_ENV_NOTE, "container": True},
    # T-113 Task3: prethird pipeline._resolve_render_mode() 가 host env
    # PRETHIRD_RENDER_MODE(partial|batch)를 직접 읽도록 배포됨 → 더 이상
    # fifth 컨테이너 재기동이 필요 없는 host-baked 노브로 재분류.
    "fifth.render_mode": {"env": "PRETHIRD_RENDER_MODE", "file": _PRETHIRD_DROPIN},

    # --- 1층 나머지: 컨테이너 env, 기동 시 1회 로드 → 재기동 필요 ---
    "fifth.head_smooth": {"env": "FIFTH_HEAD_SMOOTH", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.blink_dur": {"env": "FIFTH_BLINK_DUR", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.eye_source_lock": {"env": "FIFTH_EYE_SOURCE_LOCK", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.eye_target_scale": {"env": "FIFTH_EYE_TARGET_SCALE", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.input_normalize": {"env": "FIFTH_INPUT_NORMALIZE", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.pasteback_output": {"env": "FIFTH_PASTEBACK_OUTPUT", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.cdlip_smooth": {"env": "FIFTH_CDLIP_SMOOTH", "file": _FIFTH_ENV_NOTE, "container": True},
    "fifth.cdlip_sigma": {"env": "FIFTH_CDLIP_SIGMA", "file": _FIFTH_ENV_NOTE, "container": True},

    # --- 3층: FLP 플러그인 infer_params 오버라이드 (컨테이너 재기동) ---
    "flp.animation_region": {"env": "FIFTH_FLP_ANIMATION_REGION", "file": _FIFTH_ENV_NOTE, "container": True},
    "flp.flag_stitching": {"env": "FIFTH_FLP_STITCHING", "file": _FIFTH_ENV_NOTE, "container": True},
    "flp.flag_lip_retargeting": {"env": "FIFTH_FLP_LIP_RETARGETING", "file": _FIFTH_ENV_NOTE, "container": True},
    "flp.flag_eye_retargeting": {"env": "FIFTH_FLP_EYE_RETARGETING", "file": _FIFTH_ENV_NOTE, "container": True},
    "flp.flag_pasteback": {"env": "FIFTH_FLP_PASTEBACK", "file": _FIFTH_ENV_NOTE, "container": True},
    "flp.flag_normalize_lip": {"env": "FIFTH_FLP_NORMALIZE_LIP", "file": _FIFTH_ENV_NOTE, "container": True},
    "flp.lip_normalize_threshold": {"env": "FIFTH_FLP_LIP_NORM_THRESHOLD", "file": _FIFTH_ENV_NOTE, "container": True},
    "flp.cfg_scale": {"env": "FIFTH_FLP_CFG_SCALE", "file": _FIFTH_ENV_NOTE, "container": True},
    "flp.driving_multiplier": {"env": "FIFTH_FLP_DRIVING_MULTIPLIER", "file": _FIFTH_ENV_NOTE, "container": True},

    # --- 호스트 drop-in: 문장 분할·응답 길이(지연 직결) ---
    "dialogue.first_min_len": {"env": "PRETHIRD_SENTENCE_FIRST_MIN_LEN", "file": _PRETHIRD_DROPIN},
    "dialogue.max_response_tokens": {"env": "PRETHIRD_MAX_RESPONSE_TOKENS", "file": _PRETHIRD_DROPIN},
    "dialogue.min_len": {"env": "PRETHIRD_SENTENCE_MIN_LEN", "file": _PRETHIRD_DROPIN},
    "dialogue.force_flush": {"env": "PRETHIRD_SENTENCE_FORCE_FLUSH", "file": _PRETHIRD_DROPIN},
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


def _validate_enum(path, value) -> None:
    """enum 노브(KNOB_META[path]["type"] == "enum")의 값이 choices 밖이면 거부.

    T-111 Task 6: _SAFE_ENV_VAL(문자셋 화이트리스트) 위의 2차 방어 — 임의
    문자열이 화이트리스트 문자셋(영숫자·`_./: -`)만 지켜도 enum 노브(예:
    tts.engine)에는 정의되지 않은 값(예: "evilengine")으로 유입될 수 있다.
    choices 밖 값은 라이브 env 매핑 여부와 무관하게 즉시 거부한다.
    """
    meta = KNOB_META.get(path)
    if meta and meta.get("type") == "enum":
        choices = meta.get("choices") or []
        if str(value) not in choices:
            raise UnsafeEnvValueError(f"enum {path} 허용 외 값: {value!r} (choices={choices})")


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
    # T-111 Task 6: enum 노브 검증 — KNOB_TO_LIVE에 아직 라이브 매핑이 없는
    # 노브(예: tts.engine, 현재는 PRETHIRD_TTS_URL 스왑으로 운영)도 포함해
    # 검사한다. 검증 대상은 KNOB_TO_LIVE 루프와 무관하게 dirty(또는 dirty가
    # None이면 KNOB_META 전체)로 정한다 — "이번에 실제로 건드린(또는 전체)
    # 노브"의 값이 choices 밖이면 라이브에 실려나가는지 여부와 상관없이 즉시
    # 거부(자유 문자열이 향후 매핑되거나 다른 소비처로 흘러가는 경로 차단).
    enum_scope = dirty if dirty is not None else KNOB_META.keys()
    for path in enum_scope:
        meta = KNOB_META.get(path)
        if not meta or meta.get("type") != "enum":
            continue
        val = _knob_value(knobs, path)
        if val is None:
            continue
        _validate_enum(path, _fmt(val))

    out = []
    for path, loc in KNOB_TO_LIVE.items():
        if dirty is not None and path not in dirty:
            continue
        val = _knob_value(knobs, path)
        if val is None:
            continue
        new = _fmt(val)
        _validate_enum(path, new)
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

# ---------------------------------------------------------------------------
# fifth 렌더서버 env 반영 (2026-08-18)
#
# fifth/flp 노브는 렌더서버가 기동 시 1회 읽는다. cfg_scale 은 아예 JoyVASA 모델
# 생성자 인자라 요청별로 못 바꾼다. 그래서 랩에서 값을 바꿔도 반영 경로가 없었다 —
# /render body 로도(서버가 그 키를 안 받는다), promote apply 로도(container=True 라
# 제외된다). UI 는 "재기동 필요"라 안내했지만 그 버튼은 prethird 를 재기동해서
# fifth 와는 무관했다(2026-08-18 히즈키 보고, 실측으로 규명).
#
# 반영 경로는 있다 — env 가 서비스 파일 ExecStart 안에 **인라인 export** 로 박혀 있다.
# 컨테이너 재생성 없이 서비스만 재시작하면 새 값으로 뜬다.
#
# 🔴 systemd drop-in 의 Environment= 로는 안 된다. docker exec 는 호스트 env 를
#    컨테이너로 전달하지 않으므로, ExecStart 자체를 재정의해야 한다.
# 🔴 그래서 노브 값이 bash -c 문자열 안으로 들어간다 = 셸 인젝션 표면. 검증 필수.
# ---------------------------------------------------------------------------
FIFTH_SERVICE = "afterlife-fifth-render.service"
FIFTH_UNIT = "/etc/systemd/system/afterlife-fifth-render.service"
FIFTH_DROPIN = "/etc/systemd/system/afterlife-fifth-render.service.d/lab-tuner.conf"

# 값은 bash 의 export 인자로 들어간다 — 공백은 인자 분리라 치명적이라 _SAFE_ENV_VAL
# (공백 허용)보다 엄격하게 간다. 빈 값도 거부한다(export K= 는 의미가 달라진다).
_SAFE_SH_VAL = re.compile(r'\A[A-Za-z0-9_./:\-]+\Z')
_SAFE_SH_KEY = re.compile(r'\A[A-Z][A-Z0-9_]*\Z')

_EXPORT_MARK = "export "
_EXEC_MARK = " && exec "


def _parse_exec_env(exec_start: str) -> tuple:
    """ExecStart → (앞부분, {env}, 뒷부분). 구조가 예상과 다르면 ValueError.

    못 알아보면 **아무것도 하지 않는 쪽**이 옳다 — 반쯤 맞는 조립으로 덮어쓰면
    라이브 렌더서버가 아예 안 뜬다.
    """
    if not exec_start or _EXPORT_MARK not in exec_start or _EXEC_MARK not in exec_start:
        raise ValueError(
            "예상과 다른 ExecStart — export/exec 구간을 못 찾았다. 서비스 정의가 바뀌었다면 "
            "손대지 않는다(수동 확인 필요)")
    head, rest = exec_start.split(_EXPORT_MARK, 1)
    env_part, tail = rest.split(_EXEC_MARK, 1)
    env = {}
    for token in env_part.split():
        if "=" not in token:
            raise ValueError(f"export 구간에 K=V 아닌 토큰: {token!r}")
        k, v = token.split("=", 1)
        env[k] = v
    if not env:
        raise ValueError("export 구간이 비어 있다")
    return head, env, tail


def build_fifth_dropin(exec_start: str, env_updates: dict) -> str:
    """fifth 렌더서버 ExecStart 를 재정의하는 systemd drop-in 내용을 만든다.

    원본의 인라인 export 목록에서 env_updates 만 갈아끼우고 나머지(cd·
    LD_LIBRARY_PATH·exec 실행부)는 그대로 보존한다.
    """
    if not env_updates:
        raise ValueError("바꿀 env 가 없다 — 공연히 라이브 렌더를 재기동하지 않는다")
    for k, v in env_updates.items():
        if not _SAFE_SH_KEY.match(str(k)):
            raise UnsafeEnvValueError(f"unsafe env key rejected: {k!r}")
        if not _SAFE_SH_VAL.match(str(v)):
            raise UnsafeEnvValueError(f"unsafe env value rejected: {v!r}")

    head, env, tail = _parse_exec_env(exec_start)
    env.update({str(k): str(v) for k, v in env_updates.items()})
    rebuilt = head + _EXPORT_MARK + " ".join(f"{k}={v}" for k, v in env.items()) + _EXEC_MARK + tail
    # ExecStart 는 systemd 에서 누적된다 — 비우기 줄이 재정의보다 먼저 와야 한다.
    return f"[Service]\nExecStart=\nExecStart={rebuilt}\n"


def fifth_env_updates(knobs, dirty: set | None = None, baked: dict | None = None) -> dict:
    """KNOB_TO_LIVE 의 container 항목만 {ENV: 값} 으로 모은다.

    prethird drop-in 으로 가야 할 값이 섞이면 렌더서버 ExecStart 에 엉뚱한 env 가
    박히므로 container 플래그로만 고른다.

    dirty: 이번 세션에 실제로 바꾼 노브 경로. 새 키는 여기 있을 때만 굽는다 —
        랩 기본값은 "랩이 정한 값"일 뿐이라, 안 건드린 값을 구우면 렌더서버 기본값이
        조용히 덮인다.
    baked: 지금 ExecStart 에 이미 구워져 있는 {ENV: 값}. 🔴 **한 번 구운 키는 dirty
        여부와 무관하게 계속 추적한다.** 안 그러면 노브를 기본값으로 되돌렸을 때
        (= dirty 에 안 잡힘) 구운 값이 영영 남아 되돌릴 방법이 없다
        (2026-08-18: FIFTH_FLP_EYE_RETARGETING=0 이 남아 깜빡임이 죽은 채 고정).
    """
    baked = baked or {}
    out = {}
    for path, loc in KNOB_TO_LIVE.items():
        if not loc.get("container"):
            continue
        env_name = loc["env"]
        val = _knob_value(knobs, path)
        if val is None:
            continue
        new_val = _fmt(val)
        if env_name in baked:
            # 이미 구운 키 — 값이 달라졌을 때만 다시 굽는다.
            if baked[env_name] != new_val:
                out[env_name] = new_val
            continue
        if dirty is not None and path not in dirty:
            continue
        out[env_name] = new_val
    return out

def extract_exec_start(unit_text: str) -> str:
    """유닛 파일 본문에서 ExecStart 한 줄을 꺼낸다.

    ExecStartPre 를 집으면 pkill 명령을 서버 기동 명령으로 덮어쓰게 되므로
    정확히 "ExecStart=" 로 시작하는 줄만 본다. 여러 개면 이미 재정의된 상태이거나
    유닛이 우리 가정과 다르다는 뜻이라 거부한다(중첩 적용 방지).
    """
    lines = [l.strip() for l in unit_text.splitlines()]
    found = [l[len("ExecStart="):] for l in lines
             if l.startswith("ExecStart=") and l.strip() != "ExecStart="]
    if not found:
        raise ValueError("유닛에서 ExecStart 를 찾지 못했다")
    if len(found) > 1:
        raise ValueError(f"ExecStart 가 {len(found)}개다 — 이미 재정의된 상태일 수 있어 "
                         "자동 조립을 중단한다(수동 확인 필요)")
    return found[0]
