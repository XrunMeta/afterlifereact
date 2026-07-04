# run_testbed.py — 가비아 엔트리포인트
from __future__ import annotations
import os, sys, logging

sys.path.insert(0, "/home/afterlife/afterlife-server/prethird/scripts")
logging.basicConfig(level="INFO")

from aiohttp import web
from registry import KnobsRegistry
from artifact_store import ArtifactStore
from live_guard import LiveGuard
from harness import KnobsFifthInproc, build_say_fn
from pipeline_factory import build_knobs_pipeline_factory
from app import build_app

PORT = int(os.environ.get("LAB_TUNER_PORT", "8700"))
# D2 프로덕션 공유: 라이브 fifth 렌더 :8810 그대로 사용(전용 인스턴스 없음).
LIVE_RENDER_URL = os.environ.get("FIFTH_RENDER_URL", "http://127.0.0.1:8810")
LIVE_HEALTHZ = os.environ.get("LAB_LIVE_HEALTHZ", "http://127.0.0.1:8600/healthz")


def main():
    registry = KnobsRegistry()
    # 아티팩트 root는 공유 렌더가 접근 가능한 컨테이너 마운트 경로 하위(T-088 교훈).
    store = ArtifactStore(os.environ.get("LAB_ARTIFACTS", "/home/afterlife/afterlife-server/.lab-artifacts"))
    guard = LiveGuard(LIVE_HEALTHZ)

    ref = os.environ.get("PRETHIRD_REFERENCE_VIDEO", "")
    renderer = KnobsFifthInproc(ref, registry=registry, render_url=LIVE_RENDER_URL)
    renderer.load()   # 라이브 렌더 health 확인

    say_fn = build_say_fn(registry)   # /replay/tts 재합성용
    factory = build_knobs_pipeline_factory(registry, renderer, guard=guard)
    application = build_app(registry, factory, store,
                            say_fn=say_fn, render_url=LIVE_RENDER_URL, guard=guard)
    web.run_app(application, host="127.0.0.1", port=PORT)


if __name__ == "__main__":
    main()
