# afterlife-server/stt-afterlife/scripts/clone_stt.py
from __future__ import annotations
import os
import re
import tempfile
import json
import time
import uuid
from datetime import datetime, timezone, timedelta
import config

# clone_id 허용 문자: 영숫자, -, _  (최대 128자)
_CLONE_ID_RE = re.compile(r'^[A-Za-z0-9_-]{1,128}$')

_KST = timezone(timedelta(hours=9))


def validate_clone_id(clone_id: str) -> str:
    """clone_id 유효성 검사. 통과하면 clean 값 반환, 실패하면 ValueError."""
    if not _CLONE_ID_RE.match(clone_id):
        raise ValueError(f"invalid clone_id: {clone_id!r}")
    return clone_id


def voice_wav_path(clone_id: str, ref_root: str | None = None) -> str:
    root = ref_root if ref_root is not None else config.REF_ROOT
    return os.path.join(root, clone_id, "voice.wav")


def ref_text_path(clone_id: str, ref_root: str | None = None) -> str:
    root = ref_root if ref_root is not None else config.REF_ROOT
    return os.path.join(root, clone_id, "ref_text.txt")


def _allowed_prefixes() -> list[str]:
    prefixes = [os.path.realpath(config.REF_ROOT)]
    for p in config.ALLOWED_PREFIXES_EXTRA.split(";"):
        p = p.strip()
        if p:
            prefixes.append(os.path.realpath(p))
    return prefixes


def sanitize_wav_path(wav_path: str) -> str:
    """임의 wav 경로를 허용된 prefix 하위로 제한. path traversal 차단."""
    real = os.path.realpath(wav_path)
    for prefix in _allowed_prefixes():
        if real.startswith(prefix + os.sep) or real == prefix:
            return real
    raise ValueError(f"wav_path not under allowed prefix: {wav_path!r}")


def kst_now_iso() -> str:
    return datetime.now(_KST).isoformat(timespec="seconds")


def atomic_write(path: str, data: bytes) -> None:
    """같은 디렉터리에 .tmp.<pid>.<uuid8>.<basename> 임시파일 작성 후 os.replace 원자배치.

    uuid8 난수 suffix 로 동일 clone_id 동시 요청 간 tmp 경로 충돌(FileNotFoundError) 방지.
    uvicorn threadpool 에서 sync 핸들러가 병렬 실행될 때 race-free.
    """
    dir_ = os.path.dirname(path)
    pid = os.getpid()
    uid8 = uuid.uuid4().hex[:8]
    tmp_path = os.path.join(dir_, f".tmp.{pid}.{uid8}.{os.path.basename(path)}")
    with open(tmp_path, "wb") as f:
        f.write(data)
    os.replace(tmp_path, path)


_HANGUL_RE = re.compile(r'[가-힣]')


def sanity_check_transcript(text: str) -> tuple[bool, dict]:
    """전사 텍스트 한글 비율 sanity 검사.

    통과 조건 (둘 다 충족):
      - hangul_count >= config.MIN_HANGUL   (절대 개수 하한)
        → 이유: 비율이 높아도 글자 수가 너무 적으면(예: "네" 2자) 의미 있는
          참조 텍스트가 될 수 없음. 최소 발화량 보장.
      - hangul_ratio  >= config.MIN_HANGUL_RATIO  (전체 비율 하한)
        → 이유: 절대 개수를 충족해도 영어·숫자가 압도적이면 한국어 클론
          음성에 부적합. 한글 dominant 여부를 비율로 필터링.
        두 조건을 AND 로 묶어야 "짧고 한국어" 와 "길고 거의 영어" 둘 다 걸러짐.

    반환: (passed, {hangul_count, non_space_len, hangul_ratio})
    """
    stripped = text.strip()
    hangul_count = len(_HANGUL_RE.findall(stripped))
    non_space_len = len(stripped.replace(" ", ""))
    hangul_ratio = hangul_count / max(non_space_len, 1)

    metrics = {
        "hangul_count": hangul_count,
        "non_space_len": non_space_len,
        "hangul_ratio": round(hangul_ratio, 4),
    }

    passed = hangul_count >= config.MIN_HANGUL and hangul_ratio >= config.MIN_HANGUL_RATIO
    return passed, metrics


def write_ref_text(clone_id: str, text: str, wav_path: str,
                   model: str, lang: str, duration_sec: float,
                   segments_count: int, ref_root: str | None = None,
                   sanity_metrics: dict | None = None) -> str:
    """ref_text.txt + ref_text.meta.json 원자배치. 저장된 ref_text_path 반환."""
    root = ref_root if ref_root is not None else config.REF_ROOT
    clone_dir = os.path.join(root, clone_id)
    os.makedirs(clone_dir, exist_ok=True)

    txt_path = os.path.join(clone_dir, "ref_text.txt")
    meta_path = os.path.join(clone_dir, "ref_text.meta.json")

    wav_stat = os.stat(wav_path)
    meta = {
        "transcribed_at": kst_now_iso() + "+09:00",
        "wav_size": wav_stat.st_size,
        "wav_mtime_ns": wav_stat.st_mtime_ns,
        "model": model,
        "lang": lang,
        "duration_sec": round(duration_sec, 3),
        "segments_count": segments_count,
    }
    if sanity_metrics:
        meta.update(sanity_metrics)

    atomic_write(txt_path, text.encode("utf-8"))
    atomic_write(meta_path, json.dumps(meta, ensure_ascii=False, indent=2).encode("utf-8"))
    return txt_path
