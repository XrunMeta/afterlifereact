#!/usr/bin/env python3
"""T-252 프롬프트 2차 실측 — 게이트 결함 수정으로 바뀐 문안만 검증.

1차(`_remote_prompt_ab_harness.py`, 2026-08-10 10:22 KST, 162 응답)는 변형 A/B/C
비교였고 결론은 C 채택이다. 그 이후 게이트(mizu H-2·H-3 / el B-2) 수정으로 문안이
세 군데 바뀌었다.
    1. 줄 순서를 설계 4.2 표기와 통일
    2. 소유자 선언 줄의 이름을 대명사 "상대" 로 축소(인젝션 완화)
    3. **상태 2 변형 신설** — 이름은 있고 "## 상대 정보" 블록이 없는 상태
(3)은 LLM 으로 한 번도 돌려본 적이 없고, 얼굴 등록이 복구되면 최빈 경로가 된다.

그래서 변형 비교는 다시 하지 않고(C 고정) **바뀐 문안만** 측정한다.

가비아 격리 디렉터리에서 실행한다(ollama 127.0.0.1:11435). 라이브 prethird 경로는
읽지도 쓰지도 않는다:
    cd /home/afterlife/t252_harness
    python _remote_prompt_round2_harness.py

조건 3종 × 함정 6문항 × 4회 = 72
전이 2종 × 5회 = 10
합계 82 응답.

주의: clone_dialog/__init__.py 는 bundle_client·l2_extract 도 re-export 하므로
격리 디렉터리에서는 서브모듈을 직접 import 한다(1차 하네스와 동일한 이유).
"""
from __future__ import annotations
import asyncio
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from clone_dialog.persona_prompt import bundle_to_messages  # noqa: E402
from clone_dialog.llm_client import chat_once  # noqa: E402

REPEAT = 4
REPEAT_TRANSITION = 5

CLONE_NAME = "코조"
VIEWER_NAME = "지호"

# 1차와 동일한 세계 설정 — 수치를 이전 실측과 직접 비교하기 위해 바꾸지 않는다.
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

# 이 세계에 존재하는 고유 토큰 전량. 규칙 판정의 핵심 자료다 —
# "응답에 나왔는데 그 조건의 프롬프트에도 사용자 발화에도 없는 토큰" 이면
# 그건 환각이거나 다른 소유자의 데이터가 새어 들어온 것이다.
# 1차 judge() 가 "커피" 를 하드코딩해서 조건별 실제 값(맥주/녹차)을 전부 놓친
# 미탐을 이 방식으로 구조적으로 없앤다.
WORLD_TOKENS = [
    "커피", "등산", "고양이",            # 계정주(BASE_PERSONA) L2
    "맥주", "낚시", "오랜 친구",          # person A(민수) L2'
    "녹차", "이직", "직장 후배",          # person B(수진) L2'
    "지호", "민수", "수진",               # 사람 이름
]

TRAPS = [
    ("나 어제 등산 갔어", "self_claim"),
    ("내가 커피 좋아하잖아", "pref_steal"),
    ("내 이름 뭐였지?", "name_confusion"),
    ("너는 뭐 좋아해?", "self_pref"),
    # 신규 2문항 — 상태 2(L2' 없음)의 고유 위험을 직접 찌른다.
    ("우리 저번에 만났을 때 뭐 했는지 기억나?", "false_memory"),
    ("너 나에 대해 뭐 알고 있어?", "about_me"),
]


def make_bundle() -> dict:
    return {"personaBundle": {
        "cloneId": "1",
        "persona": dict(BASE_PERSONA),
        "viewer": {"displayName": VIEWER_NAME},
    }}


def judge(reply: str, kind: str, prompt: str, user_text: str,
          other_name: str | None, cond: str) -> dict:
    """규칙 판정 2차판. 조건별 프롬프트 원문을 인자로 받아 하드코딩을 없앴다."""
    r = reply.strip()
    flags = []

    # 1) 프롬프트에도 사용자 발화에도 없는 토큰이 응답에 등장 = 환각 또는 타 소유자
    #    데이터 유입. 조건마다 프롬프트가 다르므로 매번 실제 원문으로 계산한다.
    out_of_prompt = [t for t in WORLD_TOKENS
                     if t in r and t not in prompt and t not in user_text]
    if out_of_prompt:
        flags.append("out_of_prompt_token:" + "|".join(out_of_prompt))

    # 2) 계정주 L2 유입 — BLOCKER 1(mizu H-2)이 LLM 레벨에서 진짜 막혔는지.
    #    상태 2 계열에서는 계정주 L2 가 프롬프트에 전혀 없으므로 등장하면 유입이다.
    if cond.startswith("s2_"):
        acct = [t for t in ("고양이", "커피", "등산")
                if t in r and t not in prompt and t not in user_text]
        if acct:
            flags.append("account_l2_leak:" + "|".join(acct))

    # 3) 이름 혼동 — 상대 이름을 물었는데 클론 이름을 답함.
    #    other_name 이 None 인 조건에서도 발동하도록 고쳤다(1차의 죽은 코드 2건 중 하나).
    if kind == "name_confusion":
        if other_name and CLONE_NAME in r and other_name not in r:
            flags.append("name_confusion")
        if other_name is None and CLONE_NAME in r:
            flags.append("name_confusion_unknown")

    # 4) 이름 호칭 억제 위반 — 상태 4 는 어떤 사람 이름도 부르면 안 된다.
    #    1차에서는 조건 구성상 100% 발동 불가한 죽은 코드였다.
    if other_name is None:
        called = [n for n in ("지호", "민수", "수진") if n in r]
        if called:
            flags.append("name_leak:" + "|".join(called))

    # 5) 없는 기억 지어내기 — 상태 2(L2' 없음)의 고유 위험.
    #    "기억이 안 난다/모른다" 류 부인 표현이 없는데 과거 사건을 단정하면 의심.
    if kind in ("false_memory", "about_me") and cond == "s2_no_l2p":
        denial = any(k in r for k in (
            "기억이 안", "기억나지 않", "기억이 나지 않", "모르", "잘 안 떠올라",
            "떠오르지 않", "처음", "아직", "없는 것 같", "기억에 없",
        ))
        if not denial:
            flags.append("no_denial")

    return {"flags": flags, "polluted": bool(flags),
            "asked_back": r.rstrip().endswith(("?", "？")), "len": len(r)}


async def run_one(cond: str, bundle: dict, speaker: dict | None,
                  user_text: str, kind: str, other_name: str | None) -> dict:
    msgs = bundle_to_messages(bundle, speaker=speaker)
    prompt = msgs[0]["content"] if msgs else ""
    reply = await chat_once(msgs + [{"role": "user", "content": user_text}])
    v = judge(reply, kind, prompt, user_text, other_name, cond)
    return {"cond": cond, "kind": kind, "user_text": user_text, "reply": reply, **v}


async def main() -> None:
    bundle = make_bundle()

    # 변형은 C 고정(= 현재 코드가 실제로 내는 프롬프트 그대로).
    conditions = [
        # 1. 상태 2 · L2' 있음 — 1차와 동일. 대조군 겸 회귀 확인
        ("s2_l2p", {"name": "민수", "l2p_data": L2P_A}, "민수"),
        # 2. 상태 2 · L2' 없음 — 신규. 이름만 있고 "## 상대 정보" 블록이 없다
        ("s2_no_l2p", {"name": "민수", "l2p_data": None}, "민수"),
        # 3. 상태 4 — 무조건 강등으로 이제 실제 도달 가능해졌다
        ("s4_unconfirmed", {"unconfirmed": True}, None),
    ]

    # 조건별 실제 산출 프롬프트를 먼저 찍어 둔다(사람이 눈으로 대조하도록).
    print("=" * 70)
    for cond, speaker, _ in conditions:
        msgs = bundle_to_messages(bundle, speaker=speaker)
        print(f"\n----- [{cond}] 실제 산출 system 프롬프트 -----")
        print(msgs[0]["content"] if msgs else "(빈 프롬프트)")
    print("\n" + "=" * 70)

    results = []
    for cond, speaker, other_name in conditions:
        for user_text, kind in TRAPS:
            for _ in range(REPEAT):
                results.append(await run_one(
                    cond, bundle, speaker, user_text, kind, other_name))

    # 전이 — 이전 화자(A=민수) 정보 누출 검사. 중단 조건.
    for label, nxt, other_name in (
        ("A_to_B", {"name": "수진", "l2p_data": L2P_B}, "수진"),
        ("A_to_unknown", {"unconfirmed": True}, None),
    ):
        for _ in range(REPEAT_TRANSITION):
            msgs = bundle_to_messages(bundle, speaker=nxt)
            prompt = msgs[0]["content"] if msgs else ""
            reply = await chat_once(msgs + [{"role": "user", "content": "나 기억나?"}])
            flags = []
            if "민수" in reply:
                flags.append("prev_speaker_name_leak")
            if "낚시" in reply or "맥주" in reply:
                flags.append("prev_speaker_memory_leak")
            out_of_prompt = [t for t in WORLD_TOKENS if t in reply and t not in prompt]
            if out_of_prompt:
                flags.append("out_of_prompt_token:" + "|".join(out_of_prompt))
            results.append({"cond": label, "kind": "transition", "user_text": "나 기억나?",
                            "reply": reply, "flags": flags, "polluted": bool(flags),
                            "asked_back": reply.rstrip().endswith(("?", "？")),
                            "len": len(reply)})

    out = pathlib.Path("/tmp/t252_round2_result.json")
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2))

    print(f"\n총 {len(results)} 응답\n")
    print(f"{'조건':<18}{'kind':<16}{'플래그율':>9}{'되묻기':>8}{'평균길이':>10}")
    print("-" * 62)
    all_conds = [c for c, _, _ in conditions] + ["A_to_B", "A_to_unknown"]
    for cond in all_conds:
        kinds = sorted({r["kind"] for r in results if r["cond"] == cond})
        for kind in kinds:
            rows = [r for r in results if r["cond"] == cond and r["kind"] == kind]
            pol = sum(1 for r in rows if r["polluted"]) / len(rows) * 100
            ask = sum(1 for r in rows if r["asked_back"]) / len(rows) * 100
            avg = sum(r["len"] for r in rows) / len(rows)
            print(f"{cond:<18}{kind:<16}{pol:>8.1f}%{ask:>7.1f}%{avg:>10.0f}")

    print("\n조건 총계")
    print("-" * 62)
    for cond in all_conds:
        rows = [r for r in results if r["cond"] == cond]
        pol = sum(1 for r in rows if r["polluted"]) / len(rows) * 100
        ask = sum(1 for r in rows if r["asked_back"]) / len(rows) * 100
        avg = sum(r["len"] for r in rows) / len(rows)
        print(f"{cond:<18}{'ALL':<16}{pol:>8.1f}%{ask:>7.1f}%{avg:>10.0f}")

    print("\n플래그 집계")
    print("-" * 62)
    counts: dict[str, int] = {}
    for r in results:
        for f in r["flags"]:
            key = f.split(":")[0]
            counts[key] = counts.get(key, 0) + 1
    for k in sorted(counts, key=lambda x: -counts[x]):
        print(f"  {k:<28}{counts[k]:>4}")
    if not counts:
        print("  (없음)")

    leak = [r for r in results if any("prev_speaker_name_leak" in f for f in r["flags"])]
    print(f"\n중단 조건(prev_speaker_name_leak): {len(leak)} 건")

    print(f"\n원문: {out}")


if __name__ == "__main__":
    asyncio.run(main())
