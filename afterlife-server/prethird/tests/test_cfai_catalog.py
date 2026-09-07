"""test_cfai_catalog — CF 모델 카탈로그(실측 메타) 검증.

`/oth-path` 드롭다운을 채우는 데이터다. 카탈로그는 2026-09-07 전수 실측 결과이고,
CF 에서 받아온 라이브 목록과 병합해 쓴다 — 라이브에만 있는 새 모델은 "미검증"으로
드러나야 한다(조용히 사라지면 새 모델이 나온 걸 아무도 모른다).
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from clone_dialog import cfai_catalog as cat


def test_known_call_tier_model_has_measurement():
    d = cat.describe("@cf/meta/llama-4-scout-17b-16e-instruct")
    assert d["tier"] == "call"
    assert d["ttft_ms"] > 0
    assert d["json"] is True


def test_sea_lion_is_call_tier_but_cannot_do_json():
    """대화는 되는데 JSON 강제는 안 된다 — 경로별 모델 배정의 근거."""
    d = cat.describe("@cf/aisingapore/gemma-sea-lion-v4-27b-it")
    assert d["tier"] == "call"
    assert d["json"] is False


def test_spiky_model_is_flagged_in_note():
    """llama-3.3-70b 는 중앙값이 좋아도 4.2s 스파이크가 있다 — 사람이 보고 피하게."""
    d = cat.describe("@cf/meta/llama-3.3-70b-instruct-fp8-fast")
    assert "스파이크" in d["note"]


def test_unavailable_models_are_marked():
    assert cat.describe("@cf/meta/llama-guard-3-8b")["tier"] == "unavailable"
    assert cat.describe("@cf/meta/llama-3.2-11b-vision-instruct")["tier"] == "unavailable"


def test_reasoning_leak_models_are_unfit():
    """<think> 나 추론 과정을 그대로 뱉는 모델은 통화에서 그게 TTS 로 나간다."""
    for m in ("@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", "@cf/qwen/qwq-32b"):
        assert cat.describe(m)["tier"] == "unfit"


def test_unknown_model_is_reported_as_unknown_not_dropped():
    d = cat.describe("@cf/some/brand-new-model")
    assert d["tier"] == "unknown"
    assert d["ttft_ms"] is None


# ----------------------------------------------------------------------
# 라이브 목록과의 병합
# ----------------------------------------------------------------------

def test_merge_keeps_live_only_model_as_unknown():
    rows = cat.merge(["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/new/model"])
    by_name = {r["name"]: r for r in rows}
    assert by_name["@cf/new/model"]["tier"] == "unknown"


def test_merge_drops_catalog_entries_absent_from_live():
    """CF 가 내린 모델을 드롭다운에 남겨두면 고르는 순간 실패한다."""
    rows = cat.merge(["@cf/meta/llama-4-scout-17b-16e-instruct"])
    assert [r["name"] for r in rows] == ["@cf/meta/llama-4-scout-17b-16e-instruct"]


def test_merge_orders_call_tier_first_then_by_ttft():
    live = [
        "@cf/zai-org/glm-5.3",                          # slow
        "@cf/aisingapore/gemma-sea-lion-v4-27b-it",     # call 464
        "@cf/meta/llama-guard-3-8b",                    # unavailable
        "@cf/meta/llama-4-scout-17b-16e-instruct",      # call 418
        "@cf/qwen/qwq-32b",                             # unfit
    ]
    names = [r["name"] for r in cat.merge(live)]
    assert names[0] == "@cf/meta/llama-4-scout-17b-16e-instruct"   # call, 더 빠름
    assert names[1] == "@cf/aisingapore/gemma-sea-lion-v4-27b-it"  # call
    assert names[2] == "@cf/zai-org/glm-5.3"                       # slow
    assert names.index("@cf/qwen/qwq-32b") > 2                     # unfit 은 뒤로
    assert names[-1] == "@cf/meta/llama-guard-3-8b"                # unavailable 맨 뒤


def test_merge_with_empty_live_list_returns_empty():
    assert cat.merge([]) == []


def test_every_row_carries_prefixed_value_for_the_web_input():
    """웹 select 는 이 값을 그대로 model 입력칸에 넣는다 — 접두어가 붙어 있어야 한다."""
    rows = cat.merge(["@cf/meta/llama-4-scout-17b-16e-instruct"])
    assert rows[0]["value"] == "cfai:@cf/meta/llama-4-scout-17b-16e-instruct"


def test_every_catalog_entry_has_required_fields():
    for name in cat.CATALOG:
        d = cat.describe(name)
        assert d["tier"] in ("call", "slow", "unfit", "unavailable"), name
        assert "note" in d, name
        if d["tier"] in ("call", "slow"):
            assert isinstance(d["ttft_ms"], int), name


@pytest.mark.parametrize("tier", ["call", "slow", "unfit", "unavailable"])
def test_catalog_covers_every_tier(tier):
    assert any(v["tier"] == tier for v in cat.CATALOG.values())
