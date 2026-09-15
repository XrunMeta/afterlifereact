"""AFL-734 멀티턴 실측 (가비아에서: python scripts/_history_bench.py <prethird/scripts> 0,3,6,10) — 가비아 ollama(gemma3:27b) 에 실제 통화와 같은 조립으로 보낸다.

  persona system(bundle_to_messages) + ConversationHistory(N).messages() + 이번 발화
턴 수 N 별로 같은 10턴 대본을 흘려 TTFT·총지연을 재고, 마지막 턴에서 앞 대화를 기억하는지 본다.
"""
import asyncio, json, os, statistics, sys, time
sys.path.insert(0, sys.argv[1])  # prethird/scripts
os.environ.setdefault("PRETHIRD_STRICT_TONE_RULES", "1")
from clone_dialog import bundle_to_messages, chat_stream
from clone_dialog.conversation_history import ConversationHistory

MAXTOK = int(os.environ.get("PRETHIRD_MAX_RESPONSE_TOKENS", "200"))
BUNDLE = {"personaBundle": {
    "cloneId": "9148",
    "l0": {"rules_text": "너는 영상통화 속 클론이다. 짧게 구어체로 말한다. 이모지·목록·마크다운 금지. 불법·위험 정보 금지.", "blocklist": []},
    "persona": {
        "displayName": "페이커", "relation": "친구", "age": 30, "gender": "남성", "mbti": "INTJ",
        "tone": "차분하고 담백한 반말", "personality_core": "승부욕이 강하지만 겸손하고 침착함",
        "background": "프로게이머. 리그 오브 레전드 미드라이너로 오래 활동했다.",
        "hobbies": "독서, 경기 복기", "values": "꾸준함과 자기관리",
    },
    "viewer": {"displayName": "지호", "ownerPersonId": None},
}}
SCRIPT = [
    "안녕 오랜만이다",
    "요즘 뭐하고 지내?",
    "나는 요즘 클라이밍에 빠졌어. 주말마다 가",
    "너는 운동 뭐해?",
    "아 그리고 나 다음 주에 부산 여행 가",
    "부산에서 뭐 먹으면 좋을까",
    "좋다. 너 책 좋아한다며, 요즘 뭐 읽어?",
    "나도 그거 읽어볼게",
    "근데 너 MBTI 뭐였지?",
    "아까 내가 요즘 무슨 운동 빠졌다고 했지? 그리고 다음 주에 어디 간다고 했는지 기억나?",
]

async def one(messages):
    t0 = time.perf_counter(); ttft = None; out = []
    async for tok in chat_stream(messages, num_predict=MAXTOK):
        if ttft is None: ttft = time.perf_counter() - t0
        out.append(tok)
    return ttft or 0.0, time.perf_counter() - t0, "".join(out)

async def run(n):
    persona = bundle_to_messages(BUNDLE)
    h = ConversationHistory(n)
    rows = []
    for i, text in enumerate(SCRIPT):
        msgs = persona + h.messages() + [{"role": "user", "content": text}]
        ttft, total, reply = await one(msgs)
        h.record(text, reply)
        rows.append({"turn": i + 1, "ttft": ttft, "total": total, "hist_msgs": len(msgs) - len(persona) - 1, "reply": reply})
    return rows

async def shapes():
    """5-7: gemma3 템플릿이 system→assistant→user, assistant,assistant 모양에서 무너지는지."""
    persona = bundle_to_messages(BUNDLE)
    res = {}
    greet = persona + [{"role": "assistant", "content": "여보세요?"}, {"role": "user", "content": "어 나야, 뭐해?"}]
    res["greet_first"] = (await one(greet))[2]
    double = persona + [
        {"role": "user", "content": "나 요즘 클라이밍 해"},
        {"role": "assistant", "content": "오 클라이밍? 재밌겠다."},
        {"role": "assistant", "content": "어, 누구 왔어? 반가워요."},
        {"role": "assistant", "content": "처음 뵙네요, 편하게 계세요."},
        {"role": "user", "content": "아까 내가 무슨 운동 한다고 했지?"},
    ]
    res["assistant_x3"] = (await one(double))[2]
    return res

async def main():
    sweep = [int(x) for x in sys.argv[2].split(",")]
    report = {"sweep": {}, "shapes": await shapes()}
    for n in sweep:
        await one(bundle_to_messages(BUNDLE) + [{"role": "user", "content": "워밍업"}])
        rows = await run(n)
        report["sweep"][n] = rows
        tt = [r["ttft"] for r in rows]; tot = [r["total"] for r in rows]
        p95 = lambda v: sorted(v)[max(0, int(round(0.95 * len(v))) - 1)]
        print(f"N={n:>2}  TTFT med {statistics.median(tt)*1000:.0f}ms p95 {p95(tt)*1000:.0f}ms | total med {statistics.median(tot)*1000:.0f}ms p95 {p95(tot)*1000:.0f}ms | 마지막턴: {rows[-1]['reply'][:90]!r}", flush=True)
    json.dump(report, open(os.environ.get("BENCH_OUT", "/tmp/history_bench.json"), "w"), ensure_ascii=False, indent=1)
    print("shapes:", json.dumps(report["shapes"], ensure_ascii=False))

asyncio.run(main())
