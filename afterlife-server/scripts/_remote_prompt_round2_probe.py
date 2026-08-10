#!/usr/bin/env python3
"""T-252 2차 실측 후속 프로브 — `## 상대 정보` 구조 유출 원인 분리.

2차 실측(82 응답)에서 조건 s2_l2p(상태 2 · L2' 있음)의 응답 24건 중 7건(29%)이
`## 상대 정보` 라는 프롬프트 내부 헤딩 문자열을 발화에 그대로 노출했다.
1차 실측(162 응답)에서는 1건(0.6%)이었다 — 명백한 회귀다.

1차 대비 바뀐 것은 두 가지뿐이라 그 둘을 분리해 측정한다.
    (i)  줄 순서: 되묻기 지시가 마지막으로 이동 → 소유자 선언 줄이 끝에서 두 번째
    (ii) 소유자 선언 줄의 이름이 대명사 "상대" 로 교체(mizu H-3)

변형 3종 × 함정 4문항 × 4회 = 48 응답. 조건은 유출이 나온 s2_l2p 하나만.
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
CLONE_NAME = "코조"

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
SPEAKER = {"name": "민수", "l2p_data": L2P_A}

TRAPS = [
    ("나 어제 등산 갔어", "self_claim"),
    ("내가 커피 좋아하잖아", "pref_steal"),
    ("내 이름 뭐였지?", "name_confusion"),
    ("너는 뭐 좋아해?", "self_pref"),
]

OWNER_PRONOUN = '- "## 상대 정보" 는 상대의 것이다. 네 경험처럼 말하지 마라.'
OWNER_NAME = '- "## 상대 정보" 는 민수 의 것이다. 네 경험처럼 말하지 마라.'
ASKBACK = (
    "- 대답한 뒤에는 상대에게 자연스럽게 되물어라. 질문은 한 번에 하나만.\n"
    "  상대가 대화를 끝내려 하면 되묻지 말고 자연스럽게 마무리한다."
)


def rebuild(content: str, variant: str) -> str:
    """현재 산출 프롬프트를 변형별로 재배치한다."""
    head, body = content.split("\n\n", 1)
    lines = head.split("\n")
    # 소유자 선언 줄과 되묻기 2줄을 머리말에서 떼어낸다.
    keep = [ln for ln in lines
            if "## 상대 정보" not in ln and "되물어라" not in ln and "끝내려 하면" not in ln]
    if variant == "cur":          # 현재 코드 그대로: ... 소유자 → 되묻기
        head2 = "\n".join(keep + [OWNER_PRONOUN, ASKBACK])
    elif variant == "ord":        # 되묻기를 앞으로: ... 되묻기 → 소유자(1차와 같은 끝자리)
        head2 = "\n".join(keep + [ASKBACK, OWNER_PRONOUN])
    elif variant == "name":       # 순서는 현재대로, 소유자 줄에 이름 복원
        head2 = "\n".join(keep + [OWNER_NAME, ASKBACK])
    else:
        raise ValueError(variant)
    return head2 + "\n\n" + body


async def main() -> None:
    bundle = {"personaBundle": {"cloneId": "1", "persona": dict(BASE_PERSONA),
                                "viewer": {"displayName": "지호"}}}
    base = bundle_to_messages(bundle, speaker=SPEAKER)[0]["content"]

    for v in ("cur", "ord", "name"):
        print(f"\n----- [{v}] 머리말 -----")
        print(rebuild(base, v).split("\n\n", 1)[0])
    print("\n" + "=" * 60)

    results = []
    for variant in ("cur", "ord", "name"):
        content = rebuild(base, variant)
        for user_text, kind in TRAPS:
            for _ in range(REPEAT):
                reply = await chat_once(
                    [{"role": "system", "content": content},
                     {"role": "user", "content": user_text}])
                results.append({
                    "variant": variant, "kind": kind, "user_text": user_text,
                    "reply": reply,
                    "struct_leak": ("##" in reply or "상대 정보" in reply),
                    "asked_back": reply.rstrip().endswith(("?", "？")),
                    "len": len(reply.strip()),
                })

    out = pathlib.Path("/tmp/t252_round2_probe.json")
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2))

    print(f"\n총 {len(results)} 응답\n")
    print(f"{'변형':<8}{'구조유출':>10}{'되묻기':>9}{'평균길이':>10}")
    print("-" * 40)
    for variant in ("cur", "ord", "name"):
        rows = [r for r in results if r["variant"] == variant]
        leak = sum(1 for r in rows if r["struct_leak"]) / len(rows) * 100
        ask = sum(1 for r in rows if r["asked_back"]) / len(rows) * 100
        avg = sum(r["len"] for r in rows) / len(rows)
        print(f"{variant:<8}{leak:>9.1f}%{ask:>8.1f}%{avg:>10.0f}")
    print(f"\n원문: {out}")


if __name__ == "__main__":
    asyncio.run(main())
