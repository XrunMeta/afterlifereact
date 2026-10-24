"""AFL-1039: 말하는 순간 얼굴 대조(turn_face) → 이번 턴 LLM 지시 1줄.

앱은 say 직전에 dc 로 `turn_face` 를 보낸다(verdict·quality·personId·score — 이름 없음).
서버는 그 결과를 이번 턴 프롬프트에만 쓴다:
  1. unknown, 또는 확정된 화자가 없는데 insufficient → 얼굴이 확인되지 않았다.
     (확정된 화자가 있으면 insufficient 는 그 화자 유지 — 지시 없음.) "나 누구야?" 류면 이름을 말하지 말고
     화면 상태에 맞게 카메라를 봐 달라고 한 뒤 `<ask=who>` 태그를 단다(→ 앱이 재대조).
  2. known / switch 인데 점수 0.6 미만 → 누구냐고 물을 때만 "혹시 {이름}야?" 확인 말투.
     이름은 서버가 확정한 speaker_name 에서만 가져온다(앱 payload 에는 이름이 없다).
     서버가 그 personId 로 화자 확정·스왑을 아직 못 마쳤으면(speaker_ok=False) 1 과 같이 미확인으로 본다.
  3. 그 밖(점수 0.6 이상·점수 없음·오래된 결과·스위치 off) → 지시 없음(None).
"""
from __future__ import annotations

import os

# turn_face 수신 후 이만큼(초, time.monotonic 기준) 지나면 이번 턴과 무관한 낡은 결과로 본다.
TURN_FACE_MAX_AGE_S = 5.0
# "누구야?" 턴에서만 쓰는 확인 말투 기준(평소 확정 기준 0.5 와 별개).
HEDGE_SCORE_BELOW = 0.6

# 화면 상태별 (상태 설명, 부탁할 것) — 이름은 절대 넣지 않는다.
# 상태 설명에 명령형("부탁해라")을 넣지 않는다: 괄호 속 명령은 조건과 상관없이 따라서, "응"·인사에도
#   "카메라 봐줘" 가 나왔다(2026-10-23 실통화). 부탁은 아래 "직접 물을 때만" 조건 안에서만 쓴다.
_QUALITY_HINTS = {
    "dark": ("화면이 어두워 얼굴이 잘 안 보인다", "조명을 밝게 해 달라고"),
    "small": ("상대가 멀리 있어 얼굴이 작게 보인다", "카메라 가까이 와 달라고"),
    "turned": ("상대가 옆을 보고 있어 얼굴이 옆모습이다", "카메라를 정면으로 봐 달라고"),
    "none": ("화면에 얼굴이 안 보인다", "카메라에 얼굴을 보여 달라고"),
}
_DEFAULT_HINT = ("얼굴 대조가 아직 끝나지 않았다", "카메라를 잠깐 봐 달라고")


def _enabled() -> bool:
    # 호출 시점 평가 — 프로세스 재시작 없이 env 토글·테스트 monkeypatch 반영.
    return os.environ.get("PRETHIRD_WHOAMI_ENABLED", "1") == "1"


def _fresh(turn_face, now: float) -> bool:
    """이번 턴 것으로 볼 만큼 새로운 turn_face 인지(스위치와 무관)."""
    if not isinstance(turn_face, dict):
        return False
    at = turn_face.get("at")
    return isinstance(at, (int, float)) and now - at <= TURN_FACE_MAX_AGE_S


def _active(turn_face, now: float) -> bool:
    """스위치 on 이고 이번 턴 것으로 볼 만큼 새로운 turn_face 인지."""
    return _enabled() and _fresh(turn_face, now)


def _unconfirmed(turn_face: dict, has_speaker: bool = False) -> bool:
    """이번 턴 얼굴이 미확인인지.

    unknown 은 미확인이다. insufficient(얼굴이 안 잡힘)는 확정된 화자가 없을 때만 미확인이다 —
    이미 확정된 화자가 있으면 안 잡혔다는 것만으로 사람이 바뀌었다고 보지 않고 그 화자를 유지한다
    (2026-10-23 sungjius: "안 잡히는 건 기존 사용자 유지, 바뀌었을 때만 반응"). known·switch 라도
    서버가 그 personId 로 화자 확정·스왑을 마치지 못했으면(signaling 이 speaker_ok=False 로 표시)
    서버 쪽 이름은 이전 사람 것이라 미확인으로 본다."""
    verdict = turn_face.get("verdict")
    if verdict == "unknown":
        return True
    if verdict == "insufficient":
        return not has_speaker
    return verdict in ("known", "switch") and turn_face.get("speaker_ok") is False


NO_CONSENT_GUIDE = (
    "얼굴 인식 동의가 꺼져 있어 이 통화에서는 상대의 얼굴을 보거나 알아볼 수 없다. "
    "이름을 말하지 말고 \"얼굴 인식에 동의해 주면 알아볼 수 있다\"는 취지로, "
    "앱 설정에서 '얼굴 인식 허용'을 켜 달라고 네 말투로 짧게 안내해라(예: \"얼굴 인식에 동의해 주면 내가 알아볼 수 있어. "
    "설정에서 '얼굴 인식 허용'을 켜 줘.\"). "
    "<ask=who> 는 붙이지 마라."
)


def no_consent_instruction() -> str:
    """AFL-1040: 얼굴 비동의 사용자가 누구냐고 물은 턴(verdict=no_consent) 지시. 이름 금지 + 설정 안내.

    일반 규칙(\"얼굴 인식·버튼·등록·팝업 같은 화면·시스템 얘기는 하지 마라\")의 이번 턴 한정 예외다."""
    return (
        "[이번 턴] 상대가 자기(또는 화면 속 사람)가 누구냐고 물었다. "
        "이번 턴에 한해, '얼굴 인식·화면·시스템 얘기는 하지 마라'는 규칙의 예외로 아래를 따라라. "
        + NO_CONSENT_GUIDE
    )


def remember_me_consent_instruction() -> str:
    """AFL-1040: 얼굴 비동의 사용자가 \"기억해\" 류를 요청한 턴 지시(등록 시트는 열지 않는다)."""
    return (
        "[이번 턴] 상대가 자기를 기억해 달라고 했다. "
        "이번 턴에 한해, '얼굴 인식·화면·시스템 얘기는 하지 마라'는 규칙의 예외로 아래를 따라라. "
        + NO_CONSENT_GUIDE
    )


def turn_face_names_allowed(turn_face: dict | None, now: float, has_speaker: bool = False,
                            face_consent=None) -> bool:
    """이번 턴 프롬프트에 화자 이름(T-566 화자 힌트·이름 부르기 힌트·확인 말투)을 넣어도 되는지.

    미확인 턴이면 False — "이름을 말하지 마라" 지시와 "이름을 말해라" 힌트가 한 프롬프트에
    함께 들어가지 않게 한다. turn_face 가 없거나 낡았거나 스위치 off 면 True(기존 동작).
    AFL-1040: face_consent 가 False(비동의)면 항상 False, verdict=no_consent 도 False."""
    # AFL-1040: 비동의 이름 차단은 PRETHIRD_WHOAMI_ENABLED 롤백 스위치와 무관하게 유지한다.
    if face_consent is False:
        return False
    if _fresh(turn_face, now) and turn_face.get("verdict") == "no_consent":
        return False
    if not _active(turn_face, now):
        return True
    return not _unconfirmed(turn_face, has_speaker)


def turn_face_instruction(turn_face: dict | None, speaker_name: str | None, now: float,
                          face_consent=None) -> str | None:
    """이번 턴에 붙일 시스템 지시 문장. 붙일 게 없으면 None."""
    # AFL-1040: 비동의 안내는 PRETHIRD_WHOAMI_ENABLED 스위치와 무관(_fresh) — 스위치 off 여도 유지한다.
    #   앱이 no_consent 로 알렸거나 세션이 비동의면 이름·카메라 부탁·<ask=who> 없이 설정 안내만.
    if _fresh(turn_face, now):
        if turn_face.get("verdict") == "no_consent":
            return no_consent_instruction()
        if face_consent is False:
            if turn_face.get("who") in ("self", "other"):
                return no_consent_instruction()
            return None
    if not _active(turn_face, now):
        return None

    verdict = turn_face.get("verdict")
    who = turn_face.get("who")
    if who in ("self", "other"):
        return _who_question_instruction(turn_face, who, speaker_name)
    if _unconfirmed(turn_face, bool(speaker_name)):
        state, ask = _QUALITY_HINTS.get(turn_face.get("quality"), _DEFAULT_HINT)
        return (
            f"[이번 턴] 지금 말하는 사람의 얼굴은 확인되지 않았다(화면: {state}). "
            "상대의 **이번 말**이 '나 누구야?'·'내가 누군지 알아?'처럼 자기가 누구인지 직접 묻는 말일 때만: "
            f"이름을 말하지 말고 {ask} 짧게 부탁하고, "
            "답 맨 앞 언어 태그 바로 뒤에 <ask=who> 를 붙여라(예: <lang=ko><ask=who>카메라 잠깐 봐줄래?). "
            "<ask=who> 는 그 자리에 한 번만 쓰고 닫는 태그(</ask=who>)는 쓰지 마라. "
            "그 밖의 말(대답·맞장구·인사·다른 이야기)이면 앞 대화가 얼굴 얘기였더라도 "
            "얼굴·카메라 얘기를 꺼내지 말고 <ask=who> 도 붙이지 말고 평소처럼 답해라."
        )

    if verdict in ("known", "switch"):
        score = turn_face.get("score")
        if (isinstance(score, (int, float)) and not isinstance(score, bool)
                and score < HEDGE_SCORE_BELOW and speaker_name):
            return (
                f"[이번 턴] 상대가 '나 누구야?'처럼 **상대 자신**이 누구냐고 물을 때만 '혹시 {speaker_name}야?' 처럼 "
                "확인하는 말투로 답해라. '너는 누구야?'·'네 이름은?'처럼 너(클론)를 물으면 이 말투를 쓰지 말고 "
                "네 이름으로 답해라. 묻지 않았으면 평소처럼 답해라."
            )
    return None


def _who_question_instruction(turn_face: dict, who: str, speaker_name: str | None) -> str:
    """앱이 음성 인식 결과로 "누구냐" 질문을 확실히 알아채고 얼굴을 대조한 턴(2026-10-23).

    판정·재대조·등록 팝업은 앱이 한다 — 여기서는 답 내용만 정한다. <ask=who> 는 쓰지 않게 한다."""
    asked = ("상대가 자기가 누구냐고 물었다" if who == "self"
             else "상대가 화면 속 사람이 누구냐고 물었다")
    target = "상대" if who == "self" else "그 사람"
    no_tag = " <ask=who> 는 붙이지 마라."
    verdict = turn_face.get("verdict")
    if verdict in ("known", "switch") and speaker_name and not _unconfirmed(turn_face):
        score = turn_face.get("score")
        hedge = (isinstance(score, (int, float)) and not isinstance(score, bool)
                 and score < HEDGE_SCORE_BELOW)
        how = (f"'혹시 {speaker_name}야?' 처럼 확인하는 말투로" if hedge
               else f"'{speaker_name}'이라고 자연스럽게 알아보며")
        return f"[이번 턴] {asked}. 얼굴로 확인한 {target}은 '{speaker_name}'이다. {how} 답해라.{no_tag}"
    nameless_known = (verdict in ("known", "switch") and not speaker_name
                      and turn_face.get("speaker_ok") is not False)
    if verdict == "unknown" or nameless_known:
        # 처음 보는 얼굴(또는 이름을 모르는 사람) — 앱이 등록 창을 이미 띄웠다.
        # (아는 사람인데 서버가 화자 교체를 아직 못 마친 경우 speaker_ok=False 는 아래 "확인 중"으로 간다.)
        return (
            f"[이번 턴] {asked}. 얼굴을 대조해 보니 {target}은 처음 보는 얼굴이다. 이름을 지어내지 말고 "
            f"처음 보는 것 같다고 솔직하게 말한 뒤, 화면에 뜬 등록 창에 {target} 이름을 알려 달라고 짧게 권해라. "
            f"카메라를 봐 달라고 하지 마라.{no_tag}"
        )
    state, ask = _QUALITY_HINTS.get(turn_face.get("quality"), _DEFAULT_HINT)
    return (
        f"[이번 턴] {asked}. 그런데 얼굴이 확인되지 않았다(화면: {state}). 이름을 말하지 말고 "
        f"{ask} 짧게 부탁해라(곧 다시 확인한다).{no_tag}"
    )
