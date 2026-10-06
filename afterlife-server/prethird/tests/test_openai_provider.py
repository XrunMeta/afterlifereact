"""test_openai_provider — AFL-926 `openai:` provider + ollama 1회 폴백.

네트워크 없이 검증한다:
  - split_provider 가 openai 접두어·env 기본값을 인식하는지
  - openai payload 가 OpenAI 어휘(max_completion_tokens·response_format)로 바뀌는지
  - 추론(reasoning) 모델에는 temperature 를 싣지 않는지 (API 400 회피)
  - openai 가 첫 토큰 전에 죽으면 ollama 로 1회 넘어가는지 / 토큰이 나간 뒤엔 안 넘어가는지
"""
import sys, pathlib, asyncio
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import clone_dialog.llm_client as llm  # noqa: E402
import clone_dialog.openai_client as oai  # noqa: E402

MSGS = [{"role": "user", "content": "x"}]


async def _drain(agen):
    return [t async for t in agen]


# ---------------------------------------------------------------- split_provider

def test_split_provider_openai_prefix(monkeypatch):
    monkeypatch.delenv("PRETHIRD_LLM_PROVIDER", raising=False)
    assert llm.split_provider("openai:gpt-4.1-mini") == ("openai", "gpt-4.1-mini")


def test_split_provider_env_default_openai(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LLM_PROVIDER", "openai")
    assert llm.split_provider(None) == ("openai", None)
    # 탈출구: ollama 접두어는 전역 openai 여도 ollama
    assert llm.split_provider("ollama:gemma3:27b") == ("ollama", "gemma3:27b")


# ---------------------------------------------------------------- payload

def test_payload_maps_max_tokens_and_temperature(monkeypatch):
    monkeypatch.delenv("OPENAI_REASONING_EFFORT", raising=False)
    body = oai._payload(MSGS, "gpt-4.1-mini", 0.7, 200, stream=True)
    assert body["model"] == "gpt-4.1-mini"
    assert body["max_completion_tokens"] == 200
    assert "max_tokens" not in body
    assert body["temperature"] == 0.7
    assert body["stream"] is True


def test_payload_reasoning_model_drops_temperature(monkeypatch):
    monkeypatch.setenv("OPENAI_REASONING_EFFORT", "minimal")
    body = oai._payload(MSGS, "gpt-5-mini", 0.7, None, stream=False)
    assert "temperature" not in body
    assert body["reasoning_effort"] == "minimal"
    # chat 계열(비추론)은 temperature 를 그대로 받고 reasoning_effort 는 안 싣는다
    body2 = oai._payload(MSGS, "gpt-5.1-chat-latest", 0.7, None, stream=False)
    assert body2["temperature"] == 0.7
    assert "reasoning_effort" not in body2


def test_payload_default_model_from_env(monkeypatch):
    monkeypatch.setenv("OPENAI_MODEL", "gpt-4.1-nano")
    assert oai._payload(MSGS, None, None, None, stream=False)["model"] == "gpt-4.1-nano"


def test_missing_key_raises_config_error(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(oai.OpenAiConfigError):
        oai._headers()


# ---------------------------------------------------------------- fallback

def _fake_ollama_stream(tokens, calls):
    async def _ollama(messages, model=None, temperature=None, num_predict=None):
        calls.append(model)
        for t in tokens:
            yield t
    return _ollama


@pytest.mark.asyncio
async def test_stream_falls_back_to_ollama_before_first_token(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LLM_PROVIDER", "openai")
    monkeypatch.delenv("PRETHIRD_LLM_FALLBACK", raising=False)

    async def _boom(*a, **kw):
        raise RuntimeError("openai down")
        yield  # pragma: no cover  (async generator 로 만들기 위함)

    calls = []
    monkeypatch.setattr(llm, "chat_stream_openai", _boom)
    monkeypatch.setattr(llm, "_ollama_stream", _fake_ollama_stream(["안", "녕"], calls))
    assert await _drain(llm.chat_stream(MSGS, model="openai:gpt-4.1-mini")) == ["안", "녕"]
    # 폴백은 openai 모델명을 ollama 에 넘기지 않는다(기본 모델 사용)
    assert calls == [None]


@pytest.mark.asyncio
async def test_stream_first_token_timeout_falls_back(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LLM_PROVIDER", "openai")
    monkeypatch.setenv("PRETHIRD_LLM_FIRST_TOKEN_TIMEOUT_S", "0.05")

    async def _slow(*a, **kw):
        await asyncio.sleep(1)
        yield "늦음"

    calls = []
    monkeypatch.setattr(llm, "chat_stream_openai", _slow)
    monkeypatch.setattr(llm, "_ollama_stream", _fake_ollama_stream(["빠름"], calls))
    assert await _drain(llm.chat_stream(MSGS)) == ["빠름"]


@pytest.mark.asyncio
async def test_stream_no_fallback_after_tokens_sent(monkeypatch):
    """이미 말을 내보낸 뒤 끊기면 ollama 로 이어 붙이지 않는다 — 문장이 두 목소리로 섞인다."""
    monkeypatch.setenv("PRETHIRD_LLM_PROVIDER", "openai")

    async def _half(*a, **kw):
        yield "반쪽"
        raise RuntimeError("mid-stream")

    calls = []
    monkeypatch.setattr(llm, "chat_stream_openai", _half)
    monkeypatch.setattr(llm, "_ollama_stream", _fake_ollama_stream(["x"], calls))
    out = []
    with pytest.raises(RuntimeError):
        async for t in llm.chat_stream(MSGS):
            out.append(t)
    assert out == ["반쪽"] and calls == []


@pytest.mark.asyncio
async def test_stream_fallback_disabled(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LLM_PROVIDER", "openai")
    monkeypatch.setenv("PRETHIRD_LLM_FALLBACK", "none")

    async def _boom(*a, **kw):
        raise RuntimeError("openai down")
        yield  # pragma: no cover

    monkeypatch.setattr(llm, "chat_stream_openai", _boom)
    with pytest.raises(RuntimeError):
        await _drain(llm.chat_stream(MSGS))


@pytest.mark.asyncio
async def test_once_falls_back_to_ollama(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LLM_PROVIDER", "openai")
    monkeypatch.delenv("PRETHIRD_LLM_FALLBACK", raising=False)

    async def _boom(*a, **kw):
        raise RuntimeError("openai down")

    seen = {}

    async def _ollama_once(messages, model=None, temperature=None, fmt=None, num_predict=None):
        seen.update(model=model, fmt=fmt)
        return '{"ok": 1}'

    monkeypatch.setattr(llm, "chat_once_openai", _boom)
    monkeypatch.setattr(llm, "_ollama_once", _ollama_once)
    assert await llm.chat_once(MSGS, fmt="json") == '{"ok": 1}'
    assert seen == {"model": None, "fmt": "json"}


@pytest.mark.asyncio
async def test_ollama_provider_has_no_fallback_path(monkeypatch):
    """기본(ollama) 경로는 지금과 동일 — 실패하면 그대로 올라간다."""
    monkeypatch.delenv("PRETHIRD_LLM_PROVIDER", raising=False)

    async def _boom(*a, **kw):
        raise RuntimeError("ollama down")
        yield  # pragma: no cover

    monkeypatch.setattr(llm, "_ollama_stream", _boom)
    with pytest.raises(RuntimeError):
        await _drain(llm.chat_stream(MSGS))


def test_error_summary_masks_key_and_drops_body():
    """mizu M-1: 에러 본문(입력 인용·키 에코)을 로그로 흘리지 않는다."""
    body = '{"error": {"type": "invalid_request_error", "code": "invalid_api_key", ' \
           '"message": "Incorrect API key provided: sk-proj-ABCDEF1234567890. 사용자 대화 원문 ' + "가" * 300 + '"}}'
    s = oai._error_summary(401, body)
    assert "sk-proj-ABCDEF" not in s and "sk-***" in s
    assert "invalid_request_error/invalid_api_key" in s
    assert len(s) < 200
    assert "openai http 500" in oai._error_summary(500, "not json sk-abcdefghijklmnop")
    assert "sk-abcdef" not in oai._error_summary(500, "not json sk-abcdefghijklmnop")


@pytest.mark.asyncio
async def test_empty_remote_stream_falls_back(monkeypatch):
    """(el) 토큰 0개로 끝난 원격 응답 → 무음 대신 ollama 폴백."""
    monkeypatch.setenv("PRETHIRD_LLM_PROVIDER", "openai")
    monkeypatch.delenv("PRETHIRD_LLM_FALLBACK", raising=False)

    async def _empty(*a, **kw):
        return
        yield  # pragma: no cover

    calls = []
    monkeypatch.setattr(llm, "chat_stream_openai", _empty)
    monkeypatch.setattr(llm, "_ollama_stream", _fake_ollama_stream(["대체"], calls))
    assert await _drain(llm.chat_stream(MSGS)) == ["대체"]
