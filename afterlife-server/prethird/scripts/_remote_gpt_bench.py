"""AFL-926 가비아 실측: OpenAI 후보 vs ollama 기준선 — TTFT·총지연 중앙/p95.

사용(가비아, 격리 디렉터리 — 무거운 clone_dialog/__init__ 우회):
  mkdir -p /home/afterlife/gpt-bench/clone_dialog && cd /home/afterlife/gpt-bench
  cp <repo>/prethird/scripts/clone_dialog/{llm_client,cfai_client,openai_client}.py clone_dialog/
  : > clone_dialog/__init__.py && cp <repo>/prethird/scripts/_remote_gpt_bench.py bench.py
  set -a; . ./openai.env; set +a          # OPENAI_API_KEY=... (chmod 600)
  /home/afterlife/miniconda3/envs/musetalk/bin/python bench.py 5                       # 기본 후보
  /home/afterlife/miniconda3/envs/musetalk/bin/python bench.py 5 "openai:gpt-4.1-mini"  # 개별
후보 표기: "provider:model" 또는 "openai:model|reasoning_effort".
첫 회는 워밍업(연결·캐시)이라 집계에서 뺀다. 지연은 확률적 — 5회 이상으로 판단.
"""
import asyncio
import os
import statistics
import sys
import time

from clone_dialog.llm_client import chat_stream

os.environ["PRETHIRD_LLM_FALLBACK"] = "none"     # 폴백이 끼면 측정이 오염된다

# 페르소나 프롬프트 길이 흉내(~2k자) + 이전 3턴 — 실통화 조립과 비슷한 크기.
PERSONA = ("너는 일흔여덟 살 할아버지 '김철수'야. 경상도 출신이고 손주 민수를 아주 아낀다. "
           "젊을 때 부산에서 배를 탔고, 은퇴 후엔 텃밭을 가꾼다. 말투는 다정한 반말, 한두 문장으로 짧게. "
           "모르는 건 지어내지 말고 되물어라. ") * 12
HIST = []
for u, a in [("할아버지 잘 지내셨어요?", "그래 민수야, 나야 잘 지냈지. 니는 밥은 묵었나?"),
             ("네 먹었어요. 요즘 텃밭엔 뭐 심으셨어요?", "고추랑 상추 심었다. 올해는 고추가 실하다."),
             ("저번에 말씀하신 배 이야기 더 해주세요", "부산항에서 처음 배 탔을 때 멀미를 얼마나 했는지 모른다.")]:
    HIST += [{"role": "user", "content": u}, {"role": "assistant", "content": a}]
MSGS = ([{"role": "system", "content": PERSONA}] + HIST
        + [{"role": "user", "content": "아까 고추 얘기하셨잖아요, 언제 따요?"}])

DEFAULT_CANDS = ["ollama:gemma3:27b", "openai:gpt-4.1-mini",
                 "openai:gpt-5.4-mini|none", "openai:gpt-5.6-luna"]


def p95(xs):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(round(0.95 * (len(xs) - 1))))]


async def main(n: int, cands: list[str]) -> None:
    for c in cands:
        model, _, effort = c.partition("|")
        if effort:
            os.environ["OPENAI_REASONING_EFFORT"] = effort
        else:
            os.environ.pop("OPENAI_REASONING_EFFORT", None)
        ttft, total, last, errs = [], [], "", 0
        for i in range(n + 1):
            t = time.time()
            first = None
            out = ""
            try:
                async for tok in chat_stream(MSGS, model=model, temperature=0.8, num_predict=120):
                    if first is None:
                        first = time.time() - t
                    out += tok
            except Exception as e:  # noqa: BLE001
                errs += 1
                print("  ERR", c, str(e)[:120])
                continue
            if i == 0 or first is None:
                continue
            ttft.append(first * 1000)
            total.append((time.time() - t) * 1000)
            last = out
        if ttft:
            print(f"{c:28s} TTFT med {statistics.median(ttft):5.0f} p95 {p95(ttft):5.0f} | "
                  f"total med {statistics.median(total):5.0f} p95 {p95(total):5.0f} ms | "
                  f"n={len(ttft)} err={errs} | {last[:40]!r}")


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    asyncio.run(main(n, sys.argv[2:] or DEFAULT_CANDS))
