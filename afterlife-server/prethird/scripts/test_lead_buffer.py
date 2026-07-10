"""TDD: 리드 버퍼(pre-roll) 해제 판정 순수 로직.

목적: 응답 시작 시 비디오 큐에 목표 프레임이 쌓일 때까지 드레인을 보류(문장 사이
갭을 버퍼로 흡수)하고, 목표 도달 또는 스트림 종료 시 재생을 시작한다.
GPU/torch/asyncio 없이 순수 함수만 테스트.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from media_tracks import prebuffer_should_release


def test_target_0_always_release():
    # 비활성(기본) — 회귀 0: 즉시 재생(기존 동작).
    assert prebuffer_should_release(qsize=0, target=0, stream_ended=False) is True
    assert prebuffer_should_release(qsize=5, target=0, stream_ended=False) is True


def test_below_target_keep_buffering():
    assert prebuffer_should_release(qsize=10, target=40, stream_ended=False) is False
    assert prebuffer_should_release(qsize=39, target=40, stream_ended=False) is False


def test_reach_target_release():
    assert prebuffer_should_release(qsize=40, target=40, stream_ended=False) is True
    assert prebuffer_should_release(qsize=50, target=40, stream_ended=False) is True


def test_stream_ended_releases_even_if_short():
    # 짧은 응답(목표 미달)이라도 스트림 종료면 즉시 재생(무한 대기 방지).
    assert prebuffer_should_release(qsize=10, target=40, stream_ended=True) is True
    assert prebuffer_should_release(qsize=0, target=40, stream_ended=True) is True


def test_negative_target_treated_as_disabled():
    assert prebuffer_should_release(qsize=0, target=-1, stream_ended=False) is True
