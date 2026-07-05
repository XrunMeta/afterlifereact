"""render_mode.is_batch() + RenderService FIFTH_RENDER_MODE 배선 테스트 (T-111).

실행법:
  cd afterlife-server/fifth
  PYTHONPATH=$PWD/scripts python3 -m pytest scripts/tests/test_render_mode.py -v

partial(기본)은 현행 프레임별 즉시 write와 byte-identical 이어야 한다(회귀 0).
batch는 write() 호출 "시점"만 바뀔 뿐 청크 내용/순서/종료마커 위치는 동일하다.
"""
from __future__ import annotations

import io
import struct
import types

import numpy as np
import pytest

from render_mode import is_batch


@pytest.fixture(autouse=True)
def mock_cv2(monkeypatch):
    """cv2 없는 로컬 환경 → encode_frame_chunk가 ndarray를 반환하는 가짜 cv2 주입.

    test_fifth_render_server.py의 동명 fixture와 동일 패턴(모듈 스코프라 공유되지
    않으므로 여기서도 정의) — imencode가 실제 ndarray를 반환해야 enc.tobytes()가
    동작한다(conftest의 전역 bytes 반환 스텁과는 다름).
    """
    import fifth_render_server as srv

    fake_cv2 = types.ModuleType("cv2")

    def fake_imencode(ext, bgr, params=None):
        data = bgr.tobytes()
        arr = np.frombuffer(data, dtype=np.uint8)
        return True, arr

    fake_cv2.imencode = fake_imencode
    fake_cv2.IMWRITE_JPEG_QUALITY = 1

    monkeypatch.setattr(srv, "cv2", fake_cv2)
    yield fake_cv2


# ---------------------------------------------------------------------------
# Step 1~2: is_batch() 단위 테스트 (브리프 최소 스펙)
# ---------------------------------------------------------------------------


def test_default_partial(monkeypatch):
    monkeypatch.delenv("FIFTH_RENDER_MODE", raising=False)
    assert is_batch() is False


def test_batch(monkeypatch):
    monkeypatch.setenv("FIFTH_RENDER_MODE", "batch")
    assert is_batch() is True


def test_unknown_value_falls_back_to_partial(monkeypatch):
    """오탈자/미지값 → partial 취급(회귀 안전 기본값)."""
    monkeypatch.setenv("FIFTH_RENDER_MODE", "BATCH")  # 대소문자 다름 → 무효
    assert is_batch() is False


# ---------------------------------------------------------------------------
# Step 4: RenderService.render() 통합 — batch가 partial과 byte-identical한지,
# 프레임 순서/종료마커 위치가 보존되는지 검증.
# ---------------------------------------------------------------------------


def test_render_batch_output_byte_identical_to_partial(tmp_path, monkeypatch):
    """FIFTH_RENDER_MODE=batch 의 최종 write 바이트열은 partial(기본)과 완전히 동일."""
    from test_fifth_render_server import _make_service, _make_wav

    wav = _make_wav(tmp_path)

    monkeypatch.delenv("FIFTH_RENDER_MODE", raising=False)
    svc_partial, _, _ = _make_service(tmp_path / "partial")
    buf_partial = io.BytesIO()
    count_partial = svc_partial.render(
        wav_path=wav, video_path="/fake/9055/idle.mp4", write=buf_partial.write
    )

    monkeypatch.setenv("FIFTH_RENDER_MODE", "batch")
    svc_batch, _, _ = _make_service(tmp_path / "batch")
    buf_batch = io.BytesIO()
    count_batch = svc_batch.render(
        wav_path=wav, video_path="/fake/9055/idle.mp4", write=buf_batch.write
    )

    assert count_batch == count_partial
    assert count_partial > 0
    assert buf_batch.getvalue() == buf_partial.getvalue()


def test_render_batch_writes_nothing_until_generation_complete(tmp_path, monkeypatch):
    """batch 모드: render() 실행 도중 write가 호출되지 않고, 반환 시점에 일괄 write.

    _stream_wav_fn을 감싸 on_frame 콜백이 프레임마다 호출되는 도중 buf가
    비어 있는지(스트리밍되지 않음) 확인 → 마지막에만 채워짐을 검증.
    """
    from test_fifth_render_server import _make_service, _make_wav

    wav = _make_wav(tmp_path)
    monkeypatch.setenv("FIFTH_RENDER_MODE", "batch")
    svc, _, _ = _make_service(tmp_path)

    buf = io.BytesIO()
    observed_mid_render_lengths = []

    orig_stream_wav_fn = svc._stream_wav_fn

    def _spying_stream_wav_fn(engine, jp, cfg, sources, wav_path, on_frame, blink_enabled, phase_token=None, **kw):
        def _spy_on_frame(f):
            on_frame(f)
            # on_frame 호출 직후(=이 프레임의 write 처리 후) buf 길이를 관찰.
            observed_mid_render_lengths.append(len(buf.getvalue()))

        return orig_stream_wav_fn(
            engine, jp, cfg, sources, wav_path, _spy_on_frame, blink_enabled, phase_token, **kw
        )

    svc._stream_wav_fn = _spying_stream_wav_fn

    count = svc.render(wav_path=wav, video_path="/fake/9055/idle.mp4", write=buf.write)

    assert count > 0
    # 마지막 프레임 전까지는 buf에 아무것도 안 써짐(버퍼링만 됨) → 전부 0
    assert observed_mid_render_lengths == [0] * len(observed_mid_render_lengths)
    # render() 반환 후에는 실제로 flush되어 있어야 함
    assert len(buf.getvalue()) > 0


def test_render_batch_preserves_frame_order_and_terminator_position():
    """저수준: batch류 버퍼링이 청크 순서를 보존하고, 종료마커가 항상 맨 끝에 오는지.

    RenderService 전체를 띄우지 않고, render()가 실제로 사용하는 패턴
    (버퍼 리스트에 append 후 순서대로 flush + 종료마커는 별도 후행 write)을
    최소 재현해 프레이밍 계약을 고정한다.
    """
    written: list[bytes] = []

    def fake_write(chunk: bytes) -> None:
        written.append(chunk)

    # render() 내부와 동일한 패턴: batch=True → 버퍼링, 프레임 3개 + 트레일러 1개.
    buffer: list[bytes] = []

    def _write(chunk: bytes) -> None:
        buffer.append(chunk)

    frame_chunks = [struct.pack(">I", 1) + bytes([i]) for i in range(3)]
    trailer_chunk = struct.pack(">I", 4) + b"TOK:"

    for c in frame_chunks:
        _write(c)
    _write(trailer_chunk)

    # render() 종료 직전 flush (do_POST finally의 종료마커보다 항상 먼저 실행됨)
    for c in buffer:
        fake_write(c)

    # do_POST finally가 render() 반환 후 종료마커를 1회 씀
    fake_write(struct.pack(">I", 0))

    assert written == frame_chunks + [trailer_chunk, struct.pack(">I", 0)]
