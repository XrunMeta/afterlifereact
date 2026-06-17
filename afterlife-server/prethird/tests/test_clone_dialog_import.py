import ast
import os
import sys

SCRIPTS = os.path.join(os.path.dirname(__file__), "..", "scripts")
sys.path.insert(0, SCRIPTS)


def _imports_of(path):
    with open(path, encoding="utf-8") as f:
        tree = ast.parse(f.read())
    out = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            out.append((node.module, [a.name for a in node.names]))
    return out


def test_clone_dialog_package_exports_required_symbols():
    import pytest
    pytest.importorskip("aiohttp")  # clone_dialog→llm_client가 aiohttp 모듈레벨 import
    import clone_dialog
    assert hasattr(clone_dialog, "fetch_bundle")
    assert hasattr(clone_dialog, "bundle_to_messages")


def test_signaling_imports_from_clone_dialog_not_flat():
    sig = os.path.join(SCRIPTS, "signaling.py")
    imports = _imports_of(sig)
    modules = [m for m, _ in imports]
    assert "bundle_client" not in modules, "signaling이 직하 bundle_client를 import함"
    assert "persona_prompt" not in modules, "signaling이 직하 persona_prompt를 import함"
    cd_names = []
    for m, names in imports:
        if m == "clone_dialog":
            cd_names += names
    assert "fetch_bundle" in cd_names
    assert "bundle_to_messages" in cd_names
