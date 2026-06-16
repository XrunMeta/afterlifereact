"""TDD: server._pick_source 우선순위 로직 검증.

GPU/torch import 없이 순수 함수만 테스트.
"""
import sys
import types

# --- 무거운 의존성 stub (GPU 없는 환경) ---
for _mod in ("aiohttp", "config", "signaling"):
    if _mod not in sys.modules:
        stub = types.ModuleType(_mod)
        # config 속성 최소 stub
        if _mod == "config":
            stub.BIND = "0.0.0.0"
            stub.PORT = 8600
        # aiohttp.web stub
        if _mod == "aiohttp":
            web_stub = types.ModuleType("aiohttp.web")
            stub.web = web_stub
        # signaling.make_app stub
        if _mod == "signaling":
            stub.make_app = lambda **kw: None
        sys.modules[_mod] = stub

import server


def test_pick_source_prefers_face():
    assert server._pick_source("/a/face.jpg", "/b/idle.mp4", lambda p: True) == "/a/face.jpg"


def test_pick_source_falls_back_to_video_when_no_face():
    assert server._pick_source(None, "/b/idle.mp4", lambda p: True) == "/b/idle.mp4"


def test_pick_source_skips_missing_face_file():
    isfile = lambda p: p == "/b/idle.mp4"
    assert server._pick_source("/a/face.jpg", "/b/idle.mp4", isfile) == "/b/idle.mp4"


def test_pick_source_none_when_nothing():
    assert server._pick_source(None, None, lambda p: False) is None
