"""test_cfai_client — Cloudflare Workers AI 어댑터 단위 검증.

OpenAI 호환 엔드포인트(`/accounts/{id}/ai/v1/chat/completions`)를 쓴다.
네트워크 없이 payload/헤더/URL 과 SSE 파싱만 확인한다.
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import clone_dialog.cfai_client as cf  # noqa: E402


class _FakeResp:
    def __init__(self, lines):
        self._lines = lines
        self.content = self
        self.status = 200

    def raise_for_status(self): pass
    async def __aenter__(self): return self
    async def __aexit__(self, *a): return False

    def __aiter__(self):
        async def gen():
            for ln in self._lines:
                yield ln
        return gen()

    async def json(self):
        return self._json


class _FakeSession:
    captured = {}
    lines = []
    json_body = None

    def __init__(self, *a, **kw): pass
    async def __aenter__(self): return self
    async def __aexit__(self, *a): return False

    def post(self, url, json=None, headers=None):
        _FakeSession.captured = {"url": url, "payload": json, "headers": headers}
        r = _FakeResp(_FakeSession.lines)
        r._json = _FakeSession.json_body
        return r


@pytest.fixture(autouse=True)
def _creds(monkeypatch):
    monkeypatch.setenv("CF_ACCOUNT_ID", "acct123")
    monkeypatch.setenv("CF_AI_TOKEN", "tok456")
    monkeypatch.delenv("CF_AI_MODEL", raising=False)
    monkeypatch.delenv("CF_AI_BASE_URL", raising=False)
    monkeypatch.setattr(cf.aiohttp, "ClientSession", _FakeSession)
    _FakeSession.captured = {}


async def _drain(agen):
    return [t async for t in agen]


def _sse(*chunks):
    out = [b'data: {"choices":[{"delta":{"content":"%s"}}]}\n' % c.encode()
           for c in chunks]
    out.append(b"data: [DONE]\n")
    return out


# ----------------------------------------------------------------------
# URL / 인증 / payload
# ----------------------------------------------------------------------

async def test_stream_targets_openai_compatible_endpoint():
    _FakeSession.lines = _sse("안녕")
    await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert _FakeSession.captured["url"] == (
        "https://oth-path.cloudflare.com/client/v4/accounts/acct123/ai/v1/chat/completions"
    )


async def test_stream_sends_bearer_token():
    _FakeSession.lines = _sse("안녕")
    await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert _FakeSession.captured["headers"]["Authorization"] == "Bearer tok456"


async def test_base_url_override_for_ai_gateway(monkeypatch):
    """AI Gateway 를 앞에 두고 싶을 때 base 만 갈아끼울 수 있어야 한다."""
    monkeypatch.setenv("CF_AI_BASE_URL", "https://oth-path.ai.cloudflare.com/v1/acct/gw")
    _FakeSession.lines = _sse("hi")
    await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert _FakeSession.captured["url"] == (
        "https://oth-path.ai.cloudflare.com/v1/acct/gw/chat/completions"
    )


async def test_stream_payload_shape():
    _FakeSession.lines = _sse("안녕")
    await _drain(cf.chat_stream_cf(
        [{"role": "user", "content": "x"}], model="@cf/m",
        temperature=0.7, max_tokens=128))
    p = _FakeSession.captured["payload"]
    assert p["model"] == "@cf/m"
    assert p["stream"] is True
    assert p["temperature"] == 0.7
    assert p["max_tokens"] == 128
    assert p["messages"] == [{"role": "user", "content": "x"}]


async def test_unset_optional_params_are_omitted():
    """미지정 파라미터는 키 자체를 안 싣는다 — 모델별 기본값 경로를 그대로 탄다."""
    _FakeSession.lines = _sse("안녕")
    await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    p = _FakeSession.captured["payload"]
    assert "temperature" not in p
    assert "max_tokens" not in p


async def test_default_model_from_env(monkeypatch):
    monkeypatch.setenv("CF_AI_MODEL", "@cf/meta/llama-3.3-70b-instruct-fp8-fast")
    _FakeSession.lines = _sse("안녕")
    await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}]))
    assert _FakeSession.captured["payload"]["model"] == (
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast")


# ----------------------------------------------------------------------
# SSE 파싱
# ----------------------------------------------------------------------

async def test_stream_yields_delta_content_in_order():
    _FakeSession.lines = _sse("안", "녕", "하세요")
    toks = await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert toks == ["안", "녕", "하세요"]


async def test_stream_stops_at_done_sentinel():
    _FakeSession.lines = [
        b'data: {"choices":[{"delta":{"content":"A"}}]}\n',
        b"data: [DONE]\n",
        b'data: {"choices":[{"delta":{"content":"B"}}]}\n',
    ]
    toks = await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert toks == ["A"]


async def test_stream_skips_blank_and_non_data_lines():
    """SSE 는 빈 줄·주석(:)·이벤트 라인이 섞여 온다 — 토큰만 골라낸다."""
    _FakeSession.lines = [
        b"\n",
        b": keep-alive\n",
        b"event: message\n",
        b'data: {"choices":[{"delta":{"content":"A"}}]}\n',
        b"data: [DONE]\n",
    ]
    toks = await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert toks == ["A"]


async def test_stream_ignores_empty_delta():
    """role 만 실린 첫 청크처럼 content 가 없는 델타는 건너뛴다."""
    _FakeSession.lines = [
        b'data: {"choices":[{"delta":{"role":"assistant"}}]}\n',
        b'data: {"choices":[{"delta":{"content":"A"}}]}\n',
        b"data: [DONE]\n",
    ]
    toks = await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert toks == ["A"]


async def test_stream_coerces_non_string_delta_to_str():
    """일부 모델이 content 를 숫자로 보낸다 — 실호출에서 확인된 동작.

    @cf/meta/llama-4-scout-17b-16e-instruct 가 델타 content 로 int 를 실어 보내
    상위의 "".join(...) 이 TypeError 로 죽었다. 목킹만으로는 안 잡히는 종류라
    실측으로 발견했다. 토큰은 항상 str 로 정규화해 내보낸다.
    """
    _FakeSession.lines = [
        b'data: {"choices":[{"delta":{"content":7}}]}\n',
        'data: {"choices":[{"delta":{"content":"번"}}]}\n'.encode(),
        b"data: [DONE]\n",
    ]
    toks = await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert toks == ["7", "번"]
    assert all(isinstance(t, str) for t in toks)


async def test_once_coerces_non_string_content_to_str():
    _FakeSession.json_body = {"choices": [{"message": {"content": 42}}]}
    out = await cf.chat_once_cf([{"role": "user", "content": "x"}], model="@cf/m")
    assert out == "42"


async def test_stream_survives_malformed_json_line():
    """중간에 깨진 줄 하나로 통화 전체가 죽으면 안 된다 — 그 줄만 버린다."""
    _FakeSession.lines = [
        b'data: {"choices":[{"delta":{"content":"A"}}]}\n',
        b"data: {broken\n",
        b'data: {"choices":[{"delta":{"content":"B"}}]}\n',
        b"data: [DONE]\n",
    ]
    toks = await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert toks == ["A", "B"]


# ----------------------------------------------------------------------
# 비스트리밍 (chat_once 대응)
# ----------------------------------------------------------------------

async def test_once_returns_message_content():
    _FakeSession.json_body = {"choices": [{"message": {"content": '{"k":"v"}'}}]}
    out = await cf.chat_once_cf([{"role": "user", "content": "x"}], model="@cf/m")
    assert out == '{"k":"v"}'
    assert _FakeSession.captured["payload"]["stream"] is False


async def test_once_json_format_maps_to_response_format():
    """ollama 의 format="json" 에 대응 — CF 는 response_format 을 쓴다."""
    _FakeSession.json_body = {"choices": [{"message": {"content": "{}"}}]}
    await cf.chat_once_cf([{"role": "user", "content": "x"}], model="@cf/m", fmt="json")
    assert _FakeSession.captured["payload"]["response_format"] == {"type": "json_object"}


async def test_once_returns_empty_string_on_missing_choices():
    """응답 형태가 예상과 달라도 KeyError 로 죽지 않는다."""
    _FakeSession.json_body = {"result": "unexpected"}
    assert await cf.chat_once_cf([{"role": "user", "content": "x"}], model="@cf/m") == ""


# ----------------------------------------------------------------------
# 자격증명 누락 — 조용한 실패 금지
# ----------------------------------------------------------------------

async def test_missing_token_raises_named_error(monkeypatch):
    monkeypatch.delenv("CF_AI_TOKEN", raising=False)
    with pytest.raises(cf.CfAiConfigError) as e:
        await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert "CF_AI_TOKEN" in str(e.value)


async def test_missing_account_id_raises_named_error(monkeypatch):
    monkeypatch.delenv("CF_ACCOUNT_ID", raising=False)
    with pytest.raises(cf.CfAiConfigError) as e:
        await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}], model="@cf/m"))
    assert "CF_ACCOUNT_ID" in str(e.value)


async def test_missing_model_raises_named_error(monkeypatch):
    """모델 미지정이면 CF 기본 모델을 임의로 고르지 않고 명시적으로 실패한다."""
    monkeypatch.delenv("CF_AI_MODEL", raising=False)
    with pytest.raises(cf.CfAiConfigError) as e:
        await _drain(cf.chat_stream_cf([{"role": "user", "content": "x"}]))
    assert "CF_AI_MODEL" in str(e.value)
