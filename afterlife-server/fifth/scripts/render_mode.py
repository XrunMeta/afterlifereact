"""FIFTH_RENDER_MODE 토글 (T-111).

fifth_render_server.RenderService.render() 이 프레임 청크를 언제 write()로
내보낼지 결정한다.

  partial(기본) — 프레임 생성 즉시 write (현행 스트리밍 동작, 회귀 0).
  batch         — 전체 프레임 생성 완료 후 순서 보존 일괄 write.

와이어 프레이밍([4B len][jpeg]... + [4B 0] 종료마커)은 두 모드에서 완전히
동일하다 — batch는 write() 호출 "시점"만 바꾸고 청크 내용/순서는 바꾸지 않는다.
클라이언트(prethird fifth_inproc.parse_frame_stream)는 무변경.
"""
import os


def is_batch() -> bool:
    """FIFTH_RENDER_MODE 환경변수가 "batch"이면 True, 그 외(미설정 포함)는 False."""
    return os.environ.get("FIFTH_RENDER_MODE", "partial") == "batch"
