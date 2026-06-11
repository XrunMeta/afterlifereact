import asyncio
import importlib
import os
import sys

import pytest

SCRIPTS = os.path.join(os.path.dirname(__file__), "..", "scripts")
sys.path.insert(0, SCRIPTS)

pytest.importorskip("aiohttp")

def _reload_bc(monkeypatch, env_value):
    if env_value is None:
        monkeypatch.delenv("PRETHIRD_API_BASE", raising=False)
    else:
        monkeypatch.setenv("PRETHIRD_API_BASE", env_value)
    from clone_dialog import bundle_client
    return importlib.reload(bundle_client)

def test_no_hardcoded_preview_default(monkeypatch):
    bc = _reload_bc(monkeypatch, None)
    assert bc.API_BASE is None

def test_fetch_bundle_none_when_no_base(monkeypatch, caplog):
    import logging
    caplog.set_level(logging.WARNING)
    bc = _reload_bc(monkeypatch, None)
    result = asyncio.get_event_loop().run_until_complete(
        bc.fetch_bundle(None, 9051, "sometoken")
    )
    assert result is None
    assert any("PRETHIRD_API_BASE 미설정" in r.message for r in caplog.records)

def test_fetch_bundle_uses_env_base(monkeypatch):
    bc = _reload_bc(monkeypatch, "https://example.test")
    assert bc.API_BASE == "https://example.test"
