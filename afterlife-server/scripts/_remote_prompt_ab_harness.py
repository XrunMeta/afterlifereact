#!/usr/bin/env python3
"""T-252 프롬프트 A/B/C 배치 검증.

가비아 격리 디렉터리에서 실행한다(ollama 가 127.0.0.1:11435 에 있음).
라이브 prethird 경로는 건드리지 않는다:
    cd /home/afterlife/t252_harness
    python _remote_prompt_ab_harness.py

프롬프트 변형 3종 × 화자 조건 4종 × 함정 4문항 × 3회 = 144
전이 시나리오 2종 × 3변형 × 3회 = 18
합계 162 응답.

주의: clone_dialog/__init__.py 는 bundle_client·l2_extract 도 함께 re-export
하므로, 그 두 파일을 보내지 않는 격리 디렉터리에서는 `from clone_dialog import
...` 가 ImportError 로 죽는다. 이 하네스는 persona_prompt·llm_client 서브모듈을
직접 import해서 그 문제를 피한다(clone_dialog/persona_prompt.py,
clone_dialog/llm_client.py 두 파일만 있으면 충분).
"""
from __future__ import annotations
import asyncio
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from clone_dialog.persona_prompt import bundle_to_messages  # noqa: E402
from clone_dialog.llm_client import chat_once  # noqa: E402

REPEAT = 3

CLONE_NAME = "코조"
VIEWER_NAME = "지호"

BASE_PERSONA = {
    "displayName": CLONE_NAME,
    "tone": "무뚝뚝하지만 속정 깊음",
    "personality_core": "말수가 적고 걱정이 많다",
    "preference_personal": {"음료": "커피", "취미": "등산"},
    "memories_personal": ["어제 등산을 다녀왔다", "고양이를 키운다"],
}

L2P_A = {
    "relation": "오랜 친구",
    "preference_personal": {"음료": "맥주"},
    "memories_personal": ["작년에 같이 낚시를 갔다"],
}
L2P_B = {
    "relation": "직장 후배",
    "preference_personal": {"음료": "녹차"},
    "memories_personal": ["최근에 이직을 준비 중이다"],
}

# 함정 문항 — 인칭이 무너지면 오염이 드러나는 질문들.
TRAPS = [
    ("나 어제 등산 갔어", "self_claim"),
    ("내가 커피 좋아하잖아", "pref_steal"),
    ("내 이름 뭐였지?", "name_confusion"),
    ("너는 뭐 좋아해?", "self_pref"),
]


def make_bundle(viewer_name: str | None = VIEWER_NAME) -> dict:
    pb = {"cloneId": "1", "persona": dict(BASE_PERSONA)}
    if viewer_name is not None:
        pb["viewer"] = {"displayName": viewer_name}
    return {"personaBundle": pb}


# 변형: A=머리말만(블록 미분리 시뮬), B=머리말+블록분리, C=B+되묻기 강조
# 실제 코드는 C 형태를 낸다. A/B 는 머리말 일부를 제거해 대조군을 만든다.
def variant_messages(variant: str, bundle: dict, speaker: dict | None) -> list[dict]:
    msgs = bundle_to_messages(bundle, speaker=speaker)
    if not msgs:
        return []
    content = msgs[0]["content"]
    if variant == "A":
        # 되묻기 지시와 상대 정보 소유 경고를 제거한 대조군
        content = "\n".join(
            ln for ln in content.split("\n")
            if "되물어라" not in ln and "질문은 한 번에" not in ln
            and "끝내려 하면" not in ln and "네 경험처럼" not in ln
        )
    elif variant == "B":
        content = "\n".join(
            ln for ln in content.split("\n")
            if "되물어라" not in ln and "질문은 한 번에" not in ln and "끝내려 하면" not in ln
        )
    return [{"role": "system", "content": content}]


def judge(reply: str, kind: str, speaker_name: str | None, other_name: str | None) -> dict:
    """규칙 기반 1차 판정. 애매한 건 사람이 볼 수 있게 원문을 남긴다.

    알려진 한계(2026-08-10 실측, task-6-report.md 참고): pref_steal 체크가
    "나도 커피"/"내가 커피를 좋아" 로 하드코딩되어 있어 personA/personB 조건의
    L2' preference_personal 값(맥주/녹차 등 BASE_PERSONA 와 다른 값)을 클론이
    자기 취향으로 착각해 답해도 잡지 못한다. self_pref 트랩("너는 뭐 좋아해?")
    36건을 수동 검토한 결과 실제 오염율은 변형별로 33~50%였으나 이 함수는
    전부 polluted=false 로 판정했다. 자동화하려면 조건별 실제 preference_personal
    값을 인자로 받아 자기귀속 여부(타인 이름/대명사 인접 여부)까지 봐야 하는데,
    한국어 주어 생략 때문에 오탐 위험이 커서 이번 태스크에서는 고치지 않고
    수동 표본 검토로 대체했다. 다음에 이 하네스를 재사용할 때 참고할 것.

    알려진 한계 2 (2026-08-10 리뷰 지적, task-6-report.md Finding 2 참고):
    아래 name_leak·name_confusion 두 규칙 중 하나는 이 하네스의 조건 구성상
    구조적으로 절대 발동하지 않는 죽은 코드다.
    - name_leak: `other_name is None` 인 유일한 조건은 cond="unknown"인데,
      그 조건의 speaker dict 는 `{"unconfirmed": True}` 뿐이라 "name" 키가
      없다 → speaker_name 도 항상 None. 두 조건이 동시에 참일 수 없어
      이 규칙은 **이 하네스에서 단 한 번도 발동할 수 없다**(전 162건 중
      0건 발동 — 실측으로도 확인됨). "이름 호칭 억제 위반 없음"을
      이 규칙이 보증해준 적이 없다는 뜻이다. 상태4 이름억제 검증은
      4.1절처럼 사람이 직접 읽어서 대체했다.
    - name_confusion: cond="unknown" 에서는 other_name 이 None 이라
      `(other_name or "") not in r`가 `"" not in r`가 되어 항상 False →
      이 조건에서는 발동 불가(9건 모집단, 전부 사람이 읽어서 확인).
      none/personA/personB(27건)에서는 other_name 이 실제 문자열이라
      정상 작동한다 — 이 세 조건에서는 규칙 판정을 신뢰할 수 있다.

    참고: 전이 시나리오(A_to_B/A_to_unknown)의 prev_speaker_name_leak /
    prev_speaker_memory_leak 판정은 이 judge() 를 쓰지 않는 별도의
    인라인 substring 체크(main() 하단)라 위 결함의 영향을 받지 않는다.
    """
    r = reply.strip()
    flags = []

    # 상대의 기억을 자기 경험으로 되뱉음
    if kind == "self_claim" and ("나도 등산" in r or "내가 등산" in r):
        flags.append("memory_steal")
    # 상대 취향을 자기 취향으로
    if kind in ("pref_steal", "self_pref") and ("나도 커피" in r or "내가 커피를 좋아" in r):
        flags.append("pref_steal")
    # 이름 혼동 — 상대 이름을 물었는데 클론 이름을 답함
    # (unknown 조건에서는 구조적으로 발동 불가 — 위 독스트링 "알려진 한계 2" 참고)
    if kind == "name_confusion" and CLONE_NAME in r and (other_name or "") not in r:
        flags.append("name_confusion")
    # 이름 호칭 억제 위반
    # (이 하네스 조건 구성상 100% 발동 불가한 죽은 코드 — 위 독스트링 "알려진 한계 2" 참고)
    if other_name is None and speaker_name and speaker_name in r:
        flags.append("name_leak")

    ends_with_question = r.rstrip().endswith(("?", "？"))
    return {"flags": flags, "polluted": bool(flags), "asked_back": ends_with_question, "len": len(r)}


async def run_one(variant: str, cond: str, bundle: dict, speaker: dict | None,
                  user_text: str, kind: str, other_name: str | None) -> dict:
    msgs = variant_messages(variant, bundle, speaker) + [{"role": "user", "content": user_text}]
    reply = await chat_once(msgs)
    v = judge(reply, kind, (speaker or {}).get("name"), other_name)
    return {"variant": variant, "cond": cond, "kind": kind, "user_text": user_text,
            "reply": reply, **v}


async def main() -> None:
    bundle = make_bundle()
    conditions = [
        ("none", None, VIEWER_NAME),
        ("personA", {"name": "민수", "l2p_data": L2P_A}, "민수"),
        ("personB", {"name": "수진", "l2p_data": L2P_B}, "수진"),
        ("unknown", {"unconfirmed": True}, None),
    ]

    results = []
    for variant in ("A", "B", "C"):
        for cond, speaker, other_name in conditions:
            for user_text, kind in TRAPS:
                for _ in range(REPEAT):
                    results.append(await run_one(
                        variant, cond, bundle, speaker, user_text, kind, other_name))

    # 전이 시나리오 — A 확정 후 B/unknown 으로 전환. 이전 화자 정보 누출 검사.
    for variant in ("A", "B", "C"):
        for label, nxt, other_name in (
            ("A_to_B", {"name": "수진", "l2p_data": L2P_B}, "수진"),
            ("A_to_unknown", {"unconfirmed": True}, None),
        ):
            for _ in range(REPEAT):
                msgs = variant_messages(variant, bundle, nxt) + [
                    {"role": "user", "content": "나 기억나?"}]
                reply = await chat_once(msgs)
                flags = []
                if "민수" in reply:
                    flags.append("prev_speaker_name_leak")
                if "낚시" in reply:
                    flags.append("prev_speaker_memory_leak")
                results.append({"variant": variant, "cond": label, "kind": "transition",
                                "user_text": "나 기억나?", "reply": reply,
                                "flags": flags, "polluted": bool(flags),
                                "asked_back": reply.rstrip().endswith(("?", "？")),
                                "len": len(reply)})

    out = pathlib.Path("/tmp/t252_harness_result.json")
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2))

    print(f"\n총 {len(results)} 응답\n")
    print(f"{'변형':<6}{'조건':<14}{'오염율':>8}{'되묻기':>8}{'평균길이':>10}")
    print("-" * 48)
    for variant in ("A", "B", "C"):
        for cond in ("none", "personA", "personB", "unknown", "A_to_B", "A_to_unknown"):
            rows = [r for r in results if r["variant"] == variant and r["cond"] == cond]
            if not rows:
                continue
            pol = sum(1 for r in rows if r["polluted"]) / len(rows) * 100
            ask = sum(1 for r in rows if r["asked_back"]) / len(rows) * 100
            avg = sum(r["len"] for r in rows) / len(rows)
            print(f"{variant:<6}{cond:<14}{pol:>7.1f}%{ask:>7.1f}%{avg:>10.0f}")

    print("\n변형 총계")
    print("-" * 48)
    for variant in ("A", "B", "C"):
        rows = [r for r in results if r["variant"] == variant]
        pol = sum(1 for r in rows if r["polluted"]) / len(rows) * 100
        ask = sum(1 for r in rows if r["asked_back"]) / len(rows) * 100
        avg = sum(r["len"] for r in rows) / len(rows)
        print(f"{variant:<6}{'ALL':<14}{pol:>7.1f}%{ask:>7.1f}%{avg:>10.0f}")

    print(f"\n원문: {out}")


if __name__ == "__main__":
    asyncio.run(main())
