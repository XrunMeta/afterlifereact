# run_testbed.py — 가비아 엔트리포인트
from __future__ import annotations
import os, sys, logging

sys.path.insert(0, "/home/afterlife/afterlife-server/prethird/scripts")
logging.basicConfig(level="INFO")

# el S12b CRITICAL RISK: 테스트베드 say가 call_lifecycle/learn_writeback 경로를 타면
# 실클론 L2 학습(D1 clone_ont)이 튜닝 발화로 오염될 수 있다. learn_writeback은
# PRETHIRD_LEARN_ENABLED != "1" 이면 no-op(기본 안전)이지만, 오퍼레이터가 라이브
# systemd env(EnvironmentFile 등)를 그대로 source해 실수로 "1"이 섞여 들어와도
# 테스트베드 프로세스 안에서는 무조건 "0"으로 강제 override — 오염을 원천 차단한다.
os.environ["PRETHIRD_LEARN_ENABLED"] = "0"   # 테스트베드 say가 실클론 L2 학습 오염 방지(el S12b CRITICAL RISK)

from aiohttp import web
from registry import KnobsRegistry
from artifact_store import ArtifactStore
from live_guard import LiveGuard
from harness import KnobsFifthInproc, build_say_fn
from metrics import TurnMetrics
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

    # 턴 단위 지연 계측 — /metrics SSE 로 흘러가 UI 응답속도 구역에 표시된다.
    # /replay/tts 재합성은 턴이 아니므로 계측에서 제외(say_fn 에 metrics 미주입).
    metrics = TurnMetrics()

    say_fn = build_say_fn(registry)   # /replay/tts 재합성용
    factory = build_knobs_pipeline_factory(registry, renderer, guard=guard, store=store,
                                           metrics=metrics)
    application = build_app(registry, factory, store,
                            say_fn=say_fn, render_url=LIVE_RENDER_URL, guard=guard,
                            metrics=metrics)
    web.run_app(application, host="127.0.0.1", port=PORT)


if __name__ == "__main__":
    main()
