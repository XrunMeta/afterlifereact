"""렌더서버 로그 링버퍼 — GET /oth-path 로 최근 로그를 조회한다.

왜 필요한가:
렌더서버는 systemd(afterlife-fifth-render.service)가 `docker exec` 로 띄우는데,
stdout 이 파이프로 빠져 journal 에도 파일에도 안 남는 경우가 있다(2026-08-14 실측).
"파라미터가 실제 LivePortrait 까지 갔는가" 를 확인할 수단이 없어져서, 서버가
자기 로그를 메모리에 들고 있다가 HTTP 로 내주게 한다.
"""
import logging

from fifth_render_server import RingLogHandler


def test_최근_로그를_보관한다():
    h = RingLogHandler(capacity=10)
    lg = logging.getLogger("t1")
    lg.addHandler(h)
    lg.setLevel(logging.INFO)
    lg.info("첫 줄")
    lg.info("둘째 줄")
    lines = h.snapshot()
    assert len(lines) == 2
    assert "첫 줄" in lines[0]["msg"]
    assert lines[1]["level"] == "INFO"


def test_용량을_넘으면_오래된_것부터_버린다():
    h = RingLogHandler(capacity=3)
    lg = logging.getLogger("t2")
    lg.addHandler(h)
    lg.setLevel(logging.INFO)
    for i in range(5):
        lg.info("줄 %d", i)
    lines = h.snapshot()
    assert len(lines) == 3
    assert "줄 2" in lines[0]["msg"]
    assert "줄 4" in lines[-1]["msg"]


def test_타임스탬프와_레벨을_담는다():
    h = RingLogHandler(capacity=5)
    lg = logging.getLogger("t3")
    lg.addHandler(h)
    lg.setLevel(logging.INFO)
    lg.warning("경고다")
    line = h.snapshot()[0]
    assert line["level"] == "WARNING"
    assert line["ts"] > 0
    assert "경고다" in line["msg"]


def test_since_로_새_줄만_받는다():
    """UI 가 폴링할 때 매번 전량을 받지 않도록 증분 조회를 지원한다."""
    h = RingLogHandler(capacity=10)
    lg = logging.getLogger("t4")
    lg.addHandler(h)
    lg.setLevel(logging.INFO)
    lg.info("A")
    first = h.snapshot()
    cursor = first[-1]["seq"]
    lg.info("B")
    new = h.snapshot(since=cursor)
    assert len(new) == 1
    assert "B" in new[0]["msg"]


def test_포맷_실패해도_죽지_않는다():
    """로그 핸들러가 예외를 던지면 렌더 자체가 죽는다 — 절대 안 된다.

    propagate=False 로 두어 이 핸들러만 통과시킨다(pytest 기본 핸들러가 먼저
    포맷하다 터지면 이 테스트의 의미가 사라진다).
    """
    h = RingLogHandler(capacity=5)
    lg = logging.getLogger("t5")
    lg.handlers = [h]
    lg.propagate = False
    lg.setLevel(logging.INFO)
    lg.info("잘못된 포맷 %d %d", 1)      # 인자 부족 → 포맷 에러
    rows = h.snapshot()
    assert isinstance(rows, list)
    assert len(rows) == 1                 # 버려지지 않고 대체 문구로 기록된다
