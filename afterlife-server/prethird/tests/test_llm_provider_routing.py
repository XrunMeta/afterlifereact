"""test_llm_provider_routing — llm_client 의 provider 분기 검증.

`/oth-path` 웹페이지의 model 입력칸에 접두어를 넣는 것만으로 백엔드가 갈리게 한다
(웹페이지 수정 0줄로 A/B). 접두어가 없으면 기존 ollama 그대로 — 회귀 0 이 최우선
불변식이다.
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import clone_dialog.llm_client as llm  # noqa: E402


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    monkeypatch.delenv("PRETHIRD_LLM_PROVIDER", raising=False)


# ----------------------------------------------------------------------
# 접두어 파싱
# ----------------------------------------------------------------------

@pytest.mark.parametrize("raw,provider,model", [
    ("cfai:@cf/meta/llama-3.3-70b-instruct-fp8-fast", "cfai",
     "@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
    ("ollama:gemma3:27b", "ollama", "gemma3:27b"),      # 모델명 자체의 ':' 보존
    ("gemma3:27b", "ollama", "gemma3:27b"),             # 접두어 없음 = 기존 경로
    (None, "ollama", None),                             # 미지정 = 기존 경로
    ("  cfai:@cf/m  ", "cfai", "@cf/m"),                # 사용자 입력 공백 관용
    ("CFAI:@cf/m", "cfai", "@cf/m"),                    # 대소문자 관용
])
def test_split_provider(raw, provider, model):
    assert llm.split_provider(raw) == (provider, model)


def test_unknown_prefix_is_treated_as_model_name():
    """모르는 접두어를 provider 로 오인해 조용히 엉뚱한 곳으로 보내면 안 된다."""
    assert llm.split_provider("llama3:8b") == ("ollama", "llama3:8b")


def test_env_default_provider_applies_when_no_prefix(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LLM_PROVIDER", "cfai")
    assert llm.split_provider(None) == ("cfai", None)


def test_explicit_prefix_beats_env_default(monkeypatch):
    """env 로 전역 cfai 를 켰어도 JSON 추출 경로 등은 ollama 로 되돌릴 수 있어야 한다."""
    monkeypatch.setenv("PRETHIRD_LLM_PROVIDER", "cfai")
    assert llm.split_provider("ollama:gemma3:27b") == ("ollama", "gemma3:27b")


# ----------------------------------------------------------------------
# 실제 위임 — 어느 백엔드가 불렸는가
# ----------------------------------------------------------------------

async def _drain(agen):
    return [t async for t in agen]


async def test_stream_routes_to_cfai_on_prefix(monkeypatch):
    seen = {}

    async def fake_cf(messages, model=None, temperature=None, max_tokens=None):
        seen["model"] = model
        seen["temperature"] = temperature
        seen["max_tokens"] = max_tokens
        yield "cf토큰"

    monkeypatch.setattr(llm, "chat_stream_cf", fake_cf)
    out = await _drain(llm.chat_stream(
        [{"role": "user", "content": "x"}],
        model="cfai:@cf/m", temperature=0.5, num_predict=64))
    assert out == ["cf토큰"]
    # 접두어는 벗겨서 넘긴다. num_predict(ollama 어휘) → max_tokens(OpenAI 어휘) 변환.
    assert seen == {"model": "@cf/m", "temperature": 0.5, "max_tokens": 64}


async def test_once_routes_to_cfai_on_prefix(monkeypatch):
    seen = {}

    async def fake_cf(messages, model=None, temperature=None, fmt=None, max_tokens=None):
        seen.update(model=model, fmt=fmt, max_tokens=max_tokens)
        return "cf응답"

    monkeypatch.setattr(llm, "chat_once_cf", fake_cf)
    out = await llm.chat_once(
        [{"role": "user", "content": "x"}], model="cfai:@cf/m",
        fmt="json", num_predict=256)
    assert out == "cf응답"
    assert seen == {"model": "@cf/m", "fmt": "json", "max_tokens": 256}


async def test_stream_without_prefix_still_hits_ollama(monkeypatch):
    """회귀 0 — 접두어가 없으면 ollama HTTP payload 가 예전과 똑같이 만들어진다."""
    captured = {}

    class _Resp:
        content = None
        def raise_for_status(self): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        def __aiter__(self):
            async def gen():
                yield b'{"message":{"content":"hi"},"done":true}\n'
            return gen()

    class _Sess:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        def post(self, url, json=None):
            captured["url"] = url
            captured["payload"] = json
            r = _Resp()
            r.content = r
            return r

    monkeypatch.setattr(llm.aiohttp, "ClientSession", _Sess)
    out = await _drain(llm.chat_stream([{"role": "user", "content": "x"}], model="gemma3:27b"))
    assert out == ["hi"]
    assert captured["url"].endswith("/oth-path")
    assert captured["payload"]["model"] == "gemma3:27b"   # 접두어 흔적 없음
