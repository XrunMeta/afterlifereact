"""AFL-1039: 말하는 순간 얼굴 대조(turn_face) → 이번 턴 LLM 지시 1줄.

앱은 say 직전에 dc 로 `turn_face` 를 보낸다(verdict·quality·personId·score — 이름 없음).
서버는 그 결과를 이번 턴 프롬프트에만 쓴다:
  1. unknown / insufficient → 얼굴이 확인되지 않았다. "나 누구야?" 류면 이름을 말하지 말고
     화면 상태에 맞게 카메라를 봐 달라고 한 뒤 `<ask=who>` 태그를 단다(→ 앱이 재대조).
  2. known / switch 인데 점수 0.6 미만 → 누구냐고 물을 때만 "혹시 {이름}야?" 확인 말투.
     이름은 서버가 확정한 speaker_name 에서만 가져온다(앱 payload 에는 이름이 없다).
  3. 그 밖(점수 0.6 이상·점수 없음·오래된 결과·스위치 off) → 지시 없음(None).
"""
from __future__ import annotations

import os

# turn_face 수신 후 이만큼(초, time.monotonic 기준) 지나면 이번 턴과 무관한 낡은 결과로 본다.
TURN_FACE_MAX_AGE_S = 5.0
# "누구야?" 턴에서만 쓰는 확인 말투 기준(평소 확정 기준 0.5 와 별개).
HEDGE_SCORE_BELOW = 0.6

# 화면 상태별 안내 — 이름은 절대 넣지 않는다.
_QUALITY_HINTS = {
    "dark": "화면이 어두워 얼굴이 잘 안 보인다. 조명을 밝게 해 달라고 부탁해라",
    "small": "상대가 멀리 있어 얼굴이 작게 보인다. 카메라 가까이 와 달라고 부탁해라",
    "turned": "상대가 옆을 보고 있어 얼굴이 옆모습이다. 카메라를 정면으로 봐 달라고 부탁해라",
    "none": "화면에 얼굴이 안 보인다. 카메라에 얼굴을 보여 달라고 부탁해라",
}
_DEFAULT_HINT = "얼굴을 아직 확인하지 못했다. 카메라를 잠깐 봐 달라고 부탁해라"


def _enabled() -> bool:
    # 호출 시점 평가 — 프로세스 재시작 없이 env 토글·테스트 monkeypatch 반영.
    return os.environ.get("PRETHIRD_WHOAMI_ENABLED", "1") == "1"


def turn_face_instruction(turn_face: dict | None, speaker_name: str | None, now: float) -> str | None:
    """이번 턴에 붙일 시스템 지시 문장. 붙일 게 없으면 None."""
    if not _enabled() or not isinstance(turn_face, dict):
        return None
    at = turn_face.get("at")
    if not isinstance(at, (int, float)) or now - at > TURN_FACE_MAX_AGE_S:
        return None

    verdict = turn_face.get("verdict")
    if verdict in ("unknown", "insufficient"):
        hint = _QUALITY_HINTS.get(turn_face.get("quality"), _DEFAULT_HINT)
        return (
            f"[이번 턴] 지금 말하는 사람의 얼굴은 확인되지 않았다(화면: {hint}). "
            "상대가 자기가 누구냐고 물으면 이름을 말하지 말고 화면 상태에 맞게 카메라를 봐 달라고 "
            "짧게 말한 뒤, 답 맨 앞 언어 태그 바로 뒤에 <ask=who> 를 붙여라. "
            "묻지 않았으면 평소처럼 답해라."
        )

    if verdict in ("known", "switch"):
        score = turn_face.get("score")
        if (isinstance(score, (int, float)) and not isinstance(score, bool)
                and score < HEDGE_SCORE_BELOW and speaker_name):
            return (
                f"[이번 턴] 상대가 자기가 누구냐고 물으면 '혹시 {speaker_name}야?' 처럼 "
                "확인하는 말투로 답해라. 묻지 않았으면 평소처럼 답해라."
            )
    return None
