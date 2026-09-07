from __future__ import annotations

"""Cloudflare Workers AI 모델 카탈로그 — 2026-09-07 전수 실측.

`/oth-path` 의 모델 드롭다운을 채운다. CF 의 라이브 목록(`merge`)과 병합해서,
**CF 가 내린 모델은 빼고, 새로 나온 모델은 "미검증"으로 드러나게** 한다.

tier
----
call        통화에 쓸 수 있다 — TTFT 가 대화 흐름을 끊지 않고 페르소나가 유지된다
slow        동작은 하지만 느려서 통화엔 못 쓴다 (텍스트 검증엔 써도 된다)
unfit       추론 과정 누출·역할 붕괴·언어 깨짐 — 그대로 TTS 로 나가면 사고다
unavailable 이 계정 토큰으로 호출 자체가 안 된다 (403/400)
unknown     카탈로그에 없다 (CF 가 새로 추가한 모델)

측정 조건: 개발 맥(한국)→CF, 시스템 "너는 70대 한국인 할아버지다…" + "할아버지, 저 왔어요."
`ttft_ms` 는 상위 후보만 5회 중앙값이고 나머지는 1회값이다 — 순서 감각용이지
정밀 비교용이 아니다. 상세: `prethird/deploy/cfai_llm_탐색_실측.md`
"""

_TIER_ORDER = {"call": 0, "slow": 1, "unknown": 2, "unfit": 3, "unavailable": 4}

CATALOG: dict[str, dict] = {
    # ---- 통화 가능 ------------------------------------------------------
    "@cf/meta/llama-4-scout-17b-16e-instruct": {
        "tier": "call", "ttft_ms": 418, "json": True,
        "note": "편차가 가장 작다(409~440). JSON 강제도 된다. 응답이 짧은 편"},
    "@cf/aisingapore/gemma-sea-lion-v4-27b-it": {
        "tier": "call", "ttft_ms": 464, "json": False,
        "note": "한국어 표현이 가장 자연스럽고 응답이 풍부하다. JSON 강제는 안 된다"},
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
        "tier": "call", "ttft_ms": 540, "json": True,
        "note": "중앙값은 좋지만 4.2s 스파이크를 봤다 — 통화엔 위험"},
    "@cf/mistralai/mistral-small-3.1-24b-instruct": {
        "tier": "call", "ttft_ms": 629, "json": None,
        "note": "표현이 다소 어색(\"우리 집까지 무사했니?\")"},
    "@cf/meta/llama-3.1-8b-instruct-fp8": {
        "tier": "call", "ttft_ms": 740, "json": None,
        "note": "빠르지만 응답이 짧고 밋밋하다"},
    "@cf/qwen/qwen3-30b-a3b-fp8": {
        "tier": "call", "ttft_ms": 1261, "json": False,
        "note": "손주를 \"내 아들\"로 부른 적 있다 — 관계 혼동 주의"},
    "@cf/openai/gpt-oss-20b": {
        "tier": "call", "ttft_ms": 1487, "json": None,
        "note": "할아버지가 손주에게 존댓말을 쓴 적 있다 — 페르소나 붕괴 주의"},

    # ---- 동작하지만 느림 -------------------------------------------------
    "@cf/openai/gpt-oss-120b": {
        "tier": "slow", "ttft_ms": 2170, "json": None, "note": ""},
    "@cf/moonshotai/kimi-k2.7-code": {
        "tier": "slow", "ttft_ms": 2186, "json": None, "note": "코드용 모델"},
    "@cf/deepseek-ai/deepseek-v4-flash-0731": {
        "tier": "slow", "ttft_ms": 2954, "json": None,
        "note": "표현은 좋으나 편차가 크다(1.8~6.4s)"},
    "@cf/deepseek-ai/deepseek-v4-pro-0813": {
        "tier": "slow", "ttft_ms": 3422, "json": None, "note": ""},
    "@cf/zai-org/glm-5.2": {
        "tier": "slow", "ttft_ms": 4637, "json": None, "note": ""},
    "@cf/zai-org/glm-5.3-flash": {
        "tier": "slow", "ttft_ms": 4798, "json": None, "note": ""},
    "@cf/moonshotai/kimi-k2.6": {
        "tier": "slow", "ttft_ms": 5987, "json": None, "note": ""},
    "@cf/google/gemma-4-26b-a4b-it": {
        "tier": "slow", "ttft_ms": 7569, "json": None,
        "note": "표현은 좋다 — 통화 말고 텍스트 검증용"},
    "@cf/zai-org/glm-5.3": {
        "tier": "slow", "ttft_ms": 7939, "json": None, "note": ""},
    "@cf/nvidia/nemotron-3-120b-a12b": {
        "tier": "slow", "ttft_ms": 10666, "json": None, "note": ""},
    "@cf/zai-org/glm-4.7-flash": {
        "tier": "slow", "ttft_ms": 13584, "json": None,
        "note": "한국어가 깨진 적 있다(\"오늘히 오늘 치구나\")"},
    "@cf/qwen/qwen3.8-27b": {
        "tier": "slow", "ttft_ms": 41288, "json": None, "note": "41초 — 사실상 사용 불가"},

    # ---- 통화에 부적합 ---------------------------------------------------
    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": {
        "tier": "unfit", "ttft_ms": 425, "json": None,
        "note": "<think> 추론 과정을 그대로 뱉는다 — TTS 로 새어 나간다"},
    "@cf/qwen/qwq-32b": {
        "tier": "unfit", "ttft_ms": 371, "json": None,
        "note": "추론 과정 누출(\"좋아요, 사용자가…\")"},
    "@cf/meta/llama-3.2-3b-instruct": {
        "tier": "unfit", "ttft_ms": 345, "json": None,
        "note": "역할 붕괴 — \"아니요, 나중에 오세요\""},
    "@cf/meta/llama-3.2-1b-instruct": {
        "tier": "unfit", "ttft_ms": 580, "json": None,
        "note": "손주 시점으로 답한다"},
    "@cf/ibm-granite/granite-4.0-h-micro": {
        "tier": "unfit", "ttft_ms": 649, "json": None,
        "note": "\"손주님\" 존댓말 — 페르소나 붕괴"},
    "@cf/qwen/qwen2.5-coder-32b-instruct": {
        "tier": "unfit", "ttft_ms": 938, "json": None,
        "note": "코드용. 존댓말로 붕괴"},
    "@cf/google/gemma-2b-it-lora": {
        "tier": "unfit", "ttft_ms": 602, "json": None, "note": "\"답: 감사합니다\""},
    "@cf/google/gemma-7b-it-lora": {
        "tier": "unfit", "ttft_ms": 633, "json": None, "note": "역할 혼동"},
    "@cf/meta-llama/llama-2-7b-chat-hf-lora": {
        "tier": "unfit", "ttft_ms": 676, "json": None,
        "note": "출력이 깨진다(\"Spiel Quart Exit…\")"},
    "@cf/mistral/mistral-7b-instruct-v0.2-lora": {
        "tier": "unfit", "ttft_ms": 617, "json": None, "note": "영어가 섞인다"},

    # ---- 호출 불가 -------------------------------------------------------
    "@cf/meta/llama-3.2-11b-vision-instruct": {
        "tier": "unavailable", "ttft_ms": None, "json": None, "note": "403 Forbidden"},
    "@cf/meta/llama-guard-3-8b": {
        "tier": "unavailable", "ttft_ms": None, "json": None,
        "note": "400 — 안전 분류 전용이라 chat 형식이 아니다"},
}

_UNKNOWN = {"tier": "unknown", "ttft_ms": None, "json": None,
            "note": "카탈로그에 없다 — 아직 안 재본 모델"}


def describe(name: str) -> dict:
    """모델 1개의 실측 메타. 카탈로그에 없으면 unknown(누락이 아니라 미검증)."""
    return dict(CATALOG.get(name, _UNKNOWN))


def merge(live_names: list[str]) -> list[dict]:
    """CF 라이브 목록에 실측 메타를 얹어 드롭다운용 행으로 만든다.

    라이브에 없는 카탈로그 항목은 버린다 — CF 가 내린 모델을 드롭다운에 남겨두면
    고르는 순간 실패한다. 반대로 라이브에만 있는 모델은 unknown 으로 남겨
    "새 모델이 나왔다"는 사실이 화면에 드러나게 한다.

    정렬: tier(call → slow → unknown → unfit → unavailable) → TTFT 오름차순.
    """
    rows = []
    for name in live_names:
        meta = describe(name)
        rows.append({
            "name": name,
            # 웹 select 가 이 값을 model 입력칸에 그대로 넣는다 — 접두어 포함.
            "value": f"cfai:{name}",
            **meta,
        })
    rows.sort(key=lambda r: (_TIER_ORDER.get(r["tier"], 9),
                             r["ttft_ms"] if r["ttft_ms"] is not None else 10 ** 9,
                             r["name"]))
    return rows
