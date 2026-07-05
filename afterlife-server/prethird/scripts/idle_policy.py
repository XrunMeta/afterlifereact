"""scripts/idle_policy.py — IDLE_SOURCE_MODE 게이트 순수함수 (T-111 Task9)

idle 프레임 소스 3종(halbae 폴백 / clone idle mp4 / fifth prebake)의
활성 여부를 env 하나로 통제하기 위한 순수 정책 함수.

기본값 auto 는 clone_mp4/prebake 둘 다 True → 현재 순차 override 동작과
동일(회귀 0). 다른 값을 명시했을 때만 특정 소스를 스킵한다.

- auto        : 현행 그대로(둘 다 활성, 실제 우선순위는 호출측 순서가 결정)
- clone_mp4   : per-clone idle mp4 교체만 활성, fifth prebake 스킵
- prebake     : fifth prebake만 활성, clone idle mp4 교체 스킵
- fallback    : 둘 다 비활성 — media_tracks.py 초기 halbae 폴백만 유지
"""
import os


def _mode() -> str:
    return os.environ.get("IDLE_SOURCE_MODE", "auto")


def clone_mp4_enabled() -> bool:
    return _mode() in ("auto", "clone_mp4")


def prebake_enabled() -> bool:
    return _mode() in ("auto", "prebake")
