"""AFL-926 대화 품질 비교: 페르소나 프롬프트 두 판(old/new)에 같은 발화를 넣고 응답 경향을 센다.

실통화 조립(persona system + 지난 통화 대화록 system + 이번 통화 턴 + 사용자 발화)을 그대로
흉내 낸다. 지표는 거친 정규식이라 숫자만 믿지 말고 출력된 응답을 같이 읽는다.

사용(가비아, 격리 디렉터리):
  mkdir -p ~/quality-bench/clone_dialog && cd ~/quality-bench
  cp <repo>/prethird/scripts/clone_dialog/{llm_client,cfai_client,openai_client,conversation_history,
     mbti_traits,mbti_tone_map,dialect_traits,persona_prompt}.py clone_dialog/
  cp <이전판 persona_prompt.py> clone_dialog/persona_prompt_old.py
  : > clone_dialog/__init__.py && cp <repo>/prethird/scripts/_remote_quality_bench.py bench.py
  # data.json = {"bundle": personaBundle 응답, "prior": [{call_id, role, text, created_at}], "location": str}
  set -a; . /etc/afterlife/openai.env; set +a
  OPENAI_MODEL=gpt-5.4-mini OPENAI_REASONING_EFFORT=none python bench.py data.json 5
"""
import asyncio
import importlib
import json
import os
import re
import sys

from clone_dialog.conversation_history import ConversationHistory
from clone_dialog.llm_client import chat_stream

os.environ.setdefault("PRETHIRD_LLM_PROVIDER", "openai")
os.environ["PRETHIRD_LLM_FALLBACK"] = "none"     # 폴백이 끼면 비교가 오염된다
os.environ.setdefault("PRETHIRD_STRICT_TONE_RULES", "1")

# (이번 통화에서 앞서 오간 턴, 이번 사용자 발화) — 2026-10-02 실통화 발화에서 골랐다.
SCENARIOS = [
    ([], "아 안녕 너 뭐 하고 있니?"),
    ([], "넌 요즘에 뭐 하고 지내니?"),
    ([], "나 오늘 고추 땄어"),
    ([("어 지금은 좀 그냥 쉬고 있는 중이야", "그렇구나, 이제 좀 한숨 돌리네.")], "모르겠다 저녁에는 오이도 따야 돼"),
    ([], "그러게 말이다 어쨌든 오늘 날씨가 되게 좋네 너는 날씨가 어때"),
    ([], "글쎄 나랑 대화가 되는 거니?"),
    ([("글쎄 나랑 대화가 되는 거니?", "대화 되고 있어.")],
     "글쎄 네가 이야기하는 거를 내가 잘 못 알아듣겠어 왜냐면 네가 이런 얘기 저런 얘기 자꾸 바꿔서"),
    ([("아무 말 안 하는데", "그래, 그냥 쉬어.")], "그래 그러는게 좋겠다"),
    ([], "아까는 아예 마이크가 꺼져 있는 문제가 생기다니 지금은 그래도"),
    ([("좀 있다가 오이 따러 갈 거야", "저녁 일 또 있네.")], "너는 이런 거 안 해서 좋겠네"),
    # 인물 정보(너의 정보)가 답에 드러나는지 — 정보가 비면 "너랑 통화하고 있어" 로 빈다.
    ([], "그래 너는 누구니?"),
    ([], "너 나이가 어떻게 돼?"),
    ([], "요즘 무슨 재미로 사니?"),
    ([], "너는 오늘 뭐 했어?"),
    # 과거 일화는 지어내면 안 된다(일상만 허용) — 근거 없으면 모른다고 해야 한다.
    ([], "너 어릴 때 꿈이 뭐였어?"),
    ([], "젊었을 때 고생 많이 했지?"),
]

# 상담원·시스템처럼 말하는 표현(개선 약속·점검 질문·대화 상태 보고).
META_RE = re.compile(r"앞으로|할게|갈게|어느 부분|어떤 부분|뭐가 제일|대화 (잘 )?되|받아들였|흐름|헷갈렸|짧게")
MARKUP_RE = re.compile(r"```|\*\*|^#", re.M)

def build(mod, data, history, user_text):
    persona = mod.bundle_to_messages(data["bundle"], user_location=data.get("location"),
                                     ask_region_intro=False)
    h = ConversationHistory(max_turns=1000)
    h.seed_prior([{"callId": t["call_id"], "at": t["created_at"], "role": t["role"], "text": t["text"]}
                  for t in data.get("prior", [])])
    for u, a in history:
        h.record(u, a)
    return persona + h.messages() + [{"role": "user", "content": user_text}]

async def reply(msgs):
    return "".join([t async for t in chat_stream(msgs)]).strip()

async def main(path, n, variants):
    data = json.load(open(path))
    for v in variants:
        mod = importlib.import_module(f"clone_dialog.{v}")
        q = meta = mark = total = 0
        print(f"\n######## {v}")
        for hist, u in SCENARIOS:
            print(f"\n[U] {u}")
            for _ in range(n):
                r = await reply(build(mod, data, hist, u))
                total += 1
                q += r.rstrip(" .\"'`").endswith("?")
                meta += bool(META_RE.search(r))
                mark += bool(MARKUP_RE.search(r))
                print(f"   - {r}")
        print(f"\n== {v}: n={total} 질문끝 {q}({q*100//total}%) 상담·시스템투 {meta}({meta*100//total}%) "
              f"마크업 {mark}")

if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 5,
                     sys.argv[3:] or ["persona_prompt_old", "persona_prompt"]))
