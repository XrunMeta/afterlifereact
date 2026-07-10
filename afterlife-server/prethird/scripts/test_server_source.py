"""TDD: server._pick_source 우선순위 로직 검증.

GPU/torch import 없이 순수 함수만 테스트.
"""
import sys
import types

# --- 무거운 의존성 stub (GPU 없는 환경) ---
# 자신이 새로 주입한 모듈만 추적해 import 후 즉시 제거 → 다른 테스트 파일 오염 방지
_INJECTED: list[str] = []
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
        _INJECTED.append(_mod)

import server

# server는 import 시점에 필요한 참조를 이미 캡처했으므로
# sys.modules 에서 스텁을 제거해도 server 동작에 영향 없음.
# 다른 테스트 파일이 real 모듈을 새로 import할 수 있도록 정리.
for _mod in _INJECTED:
    sys.modules.pop(_mod, None)


def test_pick_source_prefers_face():
    assert server._pick_source("/a/face.jpg", "/b/idle.mp4", lambda p: True) == "/a/face.jpg"


def test_pick_source_falls_back_to_video_when_no_face():
    assert server._pick_source(None, "/b/idle.mp4", lambda p: True) == "/b/idle.mp4"


def test_pick_source_skips_missing_face_file():
    isfile = lambda p: p == "/b/idle.mp4"
    assert server._pick_source("/a/face.jpg", "/b/idle.mp4", isfile) == "/b/idle.mp4"


def test_pick_source_none_when_nothing():
    assert server._pick_source(None, None, lambda p: False) is None


def test_is_image_source_edges():
    assert server._is_image_source("/a/face.JPG") is True    # 대문자
    assert server._is_image_source("/a/face.jpeg") is True
    assert server._is_image_source("/a/idle.mp4") is False
    assert server._is_image_source("/a/noext") is False
    assert server._is_image_source(None) is False
    assert server._is_image_source("") is False


def test_source_for_renderer_fifth_prefers_face():
    assert server._source_for_renderer("fifth", "/a/face.jpg", "/b/idle.mp4", lambda p: True) == "/a/face.jpg"


def test_source_for_renderer_musetalk_ignores_face():
    # musetalk: 사진 무시, 영상만
    assert server._source_for_renderer("musetalk", "/a/face.jpg", "/b/idle.mp4", lambda p: True) == "/b/idle.mp4"


def test_source_for_renderer_musetalk_no_video_none():
    assert server._source_for_renderer("musetalk", "/a/face.jpg", None, lambda p: False) is None


# --- _should_prebake: prebake를 "clone idle mp4 미적용 시에만" 폴백으로 실행 ---

def test_should_prebake_runs_when_no_clone_idle():
    # clone idle mp4 미확보 → prebake 폴백(클론 얼굴)로 실행
    assert server._should_prebake(
        "fifth", "/a/face.jpg",
        prebake_env_on=True, prebake_policy_on=True, idle_video_applied=False,
    ) is True


def test_should_prebake_skips_when_clone_idle_applied():
    # 핵심 회귀 방지: clone idle mp4가 이미 적용됐으면 prebake 스킵
    # (좋은 clone mp4를 무음 prebake 나쁜 표정으로 덮지 않는다)
    assert server._should_prebake(
        "fifth", "/a/face.jpg",
        prebake_env_on=True, prebake_policy_on=True, idle_video_applied=True,
    ) is False


def test_should_prebake_false_when_not_fifth():
    assert server._should_prebake(
        "musetalk", "/a/face.jpg",
        prebake_env_on=True, prebake_policy_on=True, idle_video_applied=False,
    ) is False


def test_should_prebake_false_when_env_off():
    assert server._should_prebake(
        "fifth", "/a/face.jpg",
        prebake_env_on=False, prebake_policy_on=True, idle_video_applied=False,
    ) is False


def test_should_prebake_false_when_policy_off():
    assert server._should_prebake(
        "fifth", "/a/face.jpg",
        prebake_env_on=True, prebake_policy_on=False, idle_video_applied=False,
    ) is False


def test_should_prebake_false_when_src_not_image():
    assert server._should_prebake(
        "fifth", "/b/idle.mp4",
        prebake_env_on=True, prebake_policy_on=True, idle_video_applied=False,
    ) is False


def test_should_prebake_false_when_no_src():
    assert server._should_prebake(
        "fifth", None,
        prebake_env_on=True, prebake_policy_on=True, idle_video_applied=False,
    ) is False
