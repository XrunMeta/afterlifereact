#!/usr/bin/env python3
"""_remote_cfai_bench — ollama vs Cloudflare Workers AI 지연 실측 (가비아에서 실행).

무엇을 재는가
-------------
1. **TTFT**(첫 토큰까지) — 통화 실시간성을 좌우하는 유일한 지표. 총 생성시간이
   아니라 이것이 "클론이 언제 입을 떼는가"를 결정한다.
2. **총 지연**·응답 길이 — 같은 프롬프트에 각 백엔드가 얼마나 길게 답하는지.
3. **히스토리 턴 수의 영향** — 멀티턴을 켜면 프롬프트가 길어져 TTFT 가 는다.
   "몇 턴까지 통화에서 감당 가능한가"를 숫자로 뽑는 것이 이 스크립트의 핵심 목적.

왜 5회 반복이 기본인가
----------------------
LLM 지연은 확률적이다. 1회 측정으로 정상/비정상을 판단했다가 오진한 전례가 있다
(2026-08 TTS 폭주 진단). 중앙값과 p95 를 같이 본다.

사용 예
-------
    # 기준선 (로컬 ollama, 히스토리 없음)
    python3 _remote_cfai_bench.py --model gemma3:27b --history-turns 0

    # CF Workers AI
    export CF_ACCOUNT_ID=... CF_AI_TOKEN=...
    python3 _remote_cfai_bench.py --model cfai:@cf/meta/llama-3.3-70b-instruct-fp8-fast

    # 히스토리 턴 수 스윕 — 통화 감당 한계 찾기
    python3 _remote_cfai_bench.py --model gemma3:27b --sweep-history 0,3,6

경로 주의
---------
prethird `scripts/` 를 import 한다. 가비아에서는 이 파일을 prethird/scripts 와
같은 트리에 두고 실행할 것(`_remote_prompt_ab_harness.py` 와 같은 관례).
"""
from __future__ import annotations

import argparse
import asyncio
import os
import statistics
import sys
import time
from pathlib import Path

_HERE = Path(__file__).resolve().parent
for cand in (_HERE / "prethird" / "scripts", _HERE.parent / "prethird" / "scripts"):
    if cand.is_dir():
        sys.path.insert(0, str(cand))
        break

from clone_dialog.llm_client import chat_stream, split_provider  # noqa: E402

# 통화에서 실제로 오갈 법한 짧은 한국어 발화. 턴이 이어질수록 앞 맥락을 참조하게
# 짜 두었다 — 히스토리가 실제로 효과를 내는지 사람이 눈으로 볼 수 있도록.
_DEFAULT_SCENARIO = [
    "할아버지, 저 왔어요.",
    "요즘 무릎은 좀 어떠세요?",
    "아까 말씀하신 그거요, 언제 적 얘기예요?",
    "그때 같이 갔던 사람은 누구였어요?",
    "다음에 또 그 얘기 해주실 거죠?",
]

_SYSTEM = (
    "너는 70대 한국인 할아버지다. 손주와 통화 중이다. "
    "짧고 다정하게, 두 문장 이내로 답한다."
)


async def _one_turn(messages: list[dict], model: str, temperature: float | None,
                    max_tokens: int | None) -> tuple[float, float, str]:
    """(TTFT ms, 총 ms, 응답문자열)."""
    t0 = time.perf_counter()
    ttft = None
    acc: list[str] = []
    async for tok in chat_stream(messages, model=model, temperature=temperature,
                                 num_predict=max_tokens):
        if ttft is None:
            ttft = (time.perf_counter() - t0) * 1000
        acc.append(tok)
    total = (time.perf_counter() - t0) * 1000
    return (ttft if ttft is not None else total), total, "".join(acc)


async def _one_session(scenario: list[str], model: str, history_turns: int,
                       temperature: float | None, max_tokens: int | None,
                       verbose: bool) -> list[dict]:
    """시나리오 한 바퀴 = 통화 1회. 세션 히스토리는 이 함수 안에서만 산다."""
    history: list[dict] = []
    rows: list[dict] = []
    for idx, utterance in enumerate(scenario, start=1):
        # 통화 파이프라인과 같은 조립: persona → 히스토리(최근 N턴) → 이번 발화
        kept = history[-(history_turns * 2):] if history_turns else []
        messages = ([{"role": "system", "content": _SYSTEM}] + kept
                    + [{"role": "user", "content": utterance}])
        ttft, total, reply = await _one_turn(messages, model, temperature, max_tokens)
        rows.append({"turn": idx, "ttft": ttft, "total": total,
                     "chars": len(reply), "prompt_chars": sum(len(m["content"]) for m in messages)})
        if verbose:
            print(f"    [{idx}] TTFT {ttft:7.0f}ms  총 {total:7.0f}ms  "
                  f"프롬프트 {rows[-1]['prompt_chars']:5d}자 → {reply[:40]!r}")
        if history_turns:
            history.append({"role": "user", "content": utterance})
            history.append({"role": "assistant", "content": reply})
    return rows


def _summarize(label: str, rows: list[dict]) -> dict:
    ttfts = sorted(r["ttft"] for r in rows)
    totals = [r["total"] for r in rows]
    p95 = ttfts[min(len(ttfts) - 1, int(len(ttfts) * 0.95))]
    return {
        "label": label,
        "n": len(rows),
        "ttft_med": statistics.median(ttfts),
        "ttft_p95": p95,
        "total_med": statistics.median(totals),
        "chars_med": statistics.median(r["chars"] for r in rows),
        "prompt_med": statistics.median(r["prompt_chars"] for r in rows),
    }


def _print_table(summaries: list[dict]) -> None:
    print()
    print(f"{'설정':<28} {'n':>3} {'TTFT중앙':>9} {'TTFT p95':>9} "
          f"{'총중앙':>8} {'응답자':>6} {'프롬프트자':>9}")
    print("-" * 78)
    for s in summaries:
        print(f"{s['label']:<28} {s['n']:>3} {s['ttft_med']:>8.0f}ms {s['ttft_p95']:>8.0f}ms "
              f"{s['total_med']:>7.0f}ms {s['chars_med']:>6.0f} {s['prompt_med']:>9.0f}")
    print()


async def _main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", default=os.environ.get("PRETHIRD_OLLAMA_MODEL", "gemma3:27b"),
                    help="모델. 'cfai:' 접두어면 Cloudflare Workers AI (예: cfai:@cf/meta/...)")
    ap.add_argument("--history-turns", type=int, default=0, help="유지할 히스토리 턴 수 (기본 0)")
    ap.add_argument("--sweep-history", default=None,
                    help="쉼표 목록으로 턴 수를 스윕 (예: 0,3,6). --history-turns 를 무시한다")
    ap.add_argument("--repeat", type=int, default=5,
                    help="세션 반복 횟수 (기본 5 — 1회 측정으로 판단하지 않기 위함)")
    ap.add_argument("--temperature", type=float, default=None)
    ap.add_argument("--max-tokens", type=int, default=None)
    ap.add_argument("--quiet", action="store_true", help="턴별 출력 생략")
    args = ap.parse_args()

    provider, real = split_provider(args.model)
    print(f"provider={provider}  model={real}  repeat={args.repeat}  "
          f"시나리오 {len(_DEFAULT_SCENARIO)}턴")
    if provider == "cfai" and not os.environ.get("CF_AI_TOKEN"):
        print("!! CF_AI_TOKEN 미설정 — Workers AI 권한 API 토큰이 필요하다", file=sys.stderr)
        return 2

    sweep = ([int(x) for x in args.sweep_history.split(",")]
             if args.sweep_history else [args.history_turns])

    summaries = []
    for ht in sweep:
        all_rows: list[dict] = []
        print(f"\n== history_turns={ht} ==")
        for rep in range(args.repeat):
            if not args.quiet:
                print(f"  세션 {rep + 1}/{args.repeat}")
            all_rows += await _one_session(_DEFAULT_SCENARIO, args.model, ht,
                                           args.temperature, args.max_tokens,
                                           verbose=not args.quiet)
        summaries.append(_summarize(f"{provider} / history={ht}", all_rows))

    _print_table(summaries)
    if len(summaries) > 1:
        base, last = summaries[0], summaries[-1]
        delta = last["ttft_med"] - base["ttft_med"]
        print(f"히스토리 {sweep[0]}→{sweep[-1]}턴: TTFT 중앙값 {delta:+.0f}ms "
              f"({base['ttft_med']:.0f} → {last['ttft_med']:.0f})")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_main()))
