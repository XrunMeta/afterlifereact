"""ref_quality — 클론 ref 음성 품질 판정(등록 게이트).

배경: ref voice.wav 가 목소리가 아닌 노이즈여도 등록이 그대로 통과하던 구멍이 있었다.
STT 는 노이즈에서 글자를 거의 못 뽑는데(클론 9104: 10초에 한글 19자, 정상은 40~85자),
CosyVoice zero-shot ICL 은 "그 텍스트 = 그 오디오 길이"로 학습하므로 짧은 문장에도
길게 늘여 생성한다(폭주). 그 결과가 통화 응답 지연 + 음성 붕괴였다.

∴ ref_text 문자밀도(char/s)를 오염 탐지 지표로 쓴다. 실측 분포:
  정상 41개 클론 4.1 ~ 8.5 / 오염 클론 9104=1.90, 9074=3.20.
기본 임계 3.5 는 정상 최저(4.10)와 오염 최고(3.20) 사이에 둔 값이다.

판정은 **경고 전용** — 미달이어도 등록·통화를 막지 않는다. 지금 문제는 오염 클론이
탐지조차 안 되던 것이므로 먼저 가시화한다. 차단이 필요해지면 호출부에서 ok=False 를
근거로 정책을 올리면 된다.
"""
from __future__ import annotations

import json
import os
import pathlib

# 정상 최저 4.10(9086) vs 오염 최고 3.20(9074) 사이. env 로 재튜닝 가능.
DEFAULT_MIN_CHAR_PER_SEC = 3.5

REPORT_NAME = "ref_quality.json"
META_NAME = "ref_text.meta.json"


def _threshold() -> float:
    try:
        return float(os.environ.get("PREBUILD_REF_MIN_CHAR_PER_SEC", DEFAULT_MIN_CHAR_PER_SEC))
    except (TypeError, ValueError):
        return DEFAULT_MIN_CHAR_PER_SEC


def load_meta(ref_root: str, clone_id) -> dict | None:
    """{ref_root}/{clone_id}/ref_text.meta.json 을 읽는다(없거나 깨졌으면 None).

    이 파일은 STT 서비스가 쓴다. 여기서는 읽기만 하고, 판정 결과는 별도 파일
    (REPORT_NAME)로 남겨 소유권을 섞지 않는다.
    """
    path = os.path.join(ref_root, str(clone_id), META_NAME)
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def evaluate(meta: dict | None, threshold: float | None = None) -> dict:
    """문자밀도로 ref 품질을 판정한다.

    반환: {"density": float|None, "threshold": float, "ok": bool|None, "reason": str}
    ok 는 3-상태 — True(정상) / False(미달) / None(판정 불가).
    판정에 필요한 값이 없을 때 미달로 몰면 정상 클론까지 경고가 나므로 None 으로 둔다.
    """
    thr = _threshold() if threshold is None else float(threshold)
    if not isinstance(meta, dict):
        return {"density": None, "threshold": thr, "ok": None, "reason": "meta 없음"}

    chars = meta.get("non_space_len")
    dur = meta.get("duration_sec")
    try:
        chars = float(chars)
        dur = float(dur)
    except (TypeError, ValueError):
        return {"density": None, "threshold": thr, "ok": None, "reason": "필드 없음/형식 오류"}
    if dur <= 0:
        return {"density": None, "threshold": thr, "ok": None, "reason": "duration 0"}

    density = round(chars / dur, 2)
    ok = density >= thr
    reason = "정상" if ok else f"문자밀도 {density} < {thr} — ref 음성이 노이즈이거나 발화가 거의 없음"
    return {"density": density, "threshold": thr, "ok": ok, "reason": reason}


def write_report(ref_root: str, clone_id, result: dict) -> None:
    """판정 결과를 {clone_dir}/ref_quality.json 으로 남긴다.

    부가기능이므로 어떤 실패도 삼킨다 — 리포트 기록이 등록 흐름을 깨면 안 된다.
    """
    try:
        clone_dir = os.path.join(ref_root, str(clone_id))
        pathlib.Path(clone_dir).mkdir(parents=True, exist_ok=True)
        tmp = os.path.join(clone_dir, REPORT_NAME + ".part")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        os.replace(tmp, os.path.join(clone_dir, REPORT_NAME))
    except Exception:
        pass


def check(ref_root: str, clone_id) -> dict:
    """meta 로드 → 판정 → 리포트 기록까지 한 번에. 호출부는 결과만 로깅하면 된다."""
    result = evaluate(load_meta(ref_root, clone_id))
    write_report(ref_root, clone_id, result)
    return result
