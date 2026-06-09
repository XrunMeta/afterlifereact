"""test_llm_client — chat_stream payload 구성(model/temperature) 단위 검증.

aiohttp.ClientSession.post 를 가짜로 대체해 실제 네트워크 없이
chat_stream 이 만드는 payload만 캡처한다.
"""
import sys, pathlib, types, json
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import clone_dialog.llm_client as llm  # noqa: E402


class _FakeResp:
    def __init__(self, lines):
        self._lines = lines
        self.content = self  # async-iter 대상

    def raise_for_status(self):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    def __aiter__(self):
        async def gen():
            for ln in self._lines:
                yield ln
        return gen()


class _FakeSession:
    captured = {}

    def __init__(self, *a, **kw):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    def post(self, url, json=None):
        _FakeSession.captured["url"] = url
        _FakeSession.captured["payload"] = json
        # done=True 한 줄로 즉시 종료되는 스트림
        line = (b'{"message": {"content": "hi"}, "done": true}\n')
        return _FakeResp([line])


async def _drain(agen):
    out = []
    async for t in agen:
        out.append(t)
    return out


@pytest.mark.asyncio
async def test_default_payload_has_no_options(monkeypatch):
    monkeypatch.setattr(llm.aiohttp, "ClientSession", _FakeSession)
    _FakeSession.captured = {}
    toks = await _drain(llm.chat_stream([{"role": "user", "content": "x"}]))
    assert toks == ["hi"]
    p = _FakeSession.captured["payload"]
    assert p["model"] == llm.MODEL          # 기본 모델
    assert "options" not in p               # temperature 미지정 → options 없음


@pytest.mark.asyncio
async def test_model_and_temperature_override(monkeypatch):
    monkeypatch.setattr(llm.aiohttp, "ClientSession", _FakeSession)
    _FakeSession.captured = {}
    await _drain(llm.chat_stream(
        [{"role": "user", "content": "x"}], model="llama3:8b", temperature=0.2))
    p = _FakeSession.captured["payload"]
    assert p["model"] == "llama3:8b"
    assert p["options"] == {"temperature": 0.2}
