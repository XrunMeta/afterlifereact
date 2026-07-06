"""FIFTH_RENDER_MODE 토글 (T-111) + body render_mode per-request override (T-113).

fifth_render_server.RenderService.render() 이 프레임 청크를 언제 write()로
내보낼지 결정한다.

  partial(기본) — 프레임 생성 즉시 write (현행 스트리밍 동작, 회귀 0).
  batch         — 전체 프레임 생성 완료 후 순서 보존 일괄 write.

와이어 프레이밍([4B len][jpeg]... + [4B 0] 종료마커)은 두 모드에서 완전히
동일하다 — batch는 write() 호출 "시점"만 바꾸고 청크 내용/순서는 바꾸지 않는다.
클라이언트(prethird fifth_inproc.parse_frame_stream)는 무변경.

T-113 (Task 1): /render body 에 render_mode(str|None)를 실어 요청 단위로
partial/batch 를 오버라이드할 수 있게 한다. body 에 값이 있으면(즉 None 이
아니면) 그 값을 그대로 우선 사용하고, 없으면(None) 기존 FIFTH_RENDER_MODE env
fallback 동작을 100% 그대로 유지한다(회귀 0) — 이래야 컨테이너를 재배포하지
않고도 host 쪽 promote 만으로 partial↔batch 토글이 가능해진다.
"""
import os


def is_batch(mode: str | None = None) -> bool:
    """render_mode 가 "batch" 인지 판정.

    Args:
        mode: 요청 body 의 render_mode 값. None(기본, 키 없음/명시 null 포함)이면
            FIFTH_RENDER_MODE 환경변수 fallback(T-111 레거시 동작)을 그대로 쓴다.
            None 이 아니면 그 값을 그대로 우선 사용한다 — "batch" 인 경우에만 True,
            그 외(오탈자/미지값 포함)는 False.

    Returns:
        bool: batch 모드 여부.
    """
    if mode is not None:
        return mode == "batch"
    return os.environ.get("FIFTH_RENDER_MODE", "partial") == "batch"
