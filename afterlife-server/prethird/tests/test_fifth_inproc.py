"""tests/test_fifth_inproc.py — FifthInproc v2 HTTP 클라이언트 단위 테스트.

GPU·cv2·requests 없이 훅(_check_health / _open_render_stream / _decode_jpeg)
오버라이드로 계약을 검증한다.
"""
from __future__ import annotations

import io
import logging
import pathlib
import struct
import sys

import numpy as np
import pytest

# prethird scripts 경로 추가
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from fifth_inproc import FifthInproc, parse_frame_stream  # noqa: E402


# ---------------------------------------------------------------------------
# parse_frame_stream — 순수 함수 테스트
# ---------------------------------------------------------------------------

def _make_stream(jpegs: list[bytes]) -> io.BytesIO:
    buf = b"".join(struct.pack(">I", len(j)) + j for j in jpegs)
    buf += struct.pack(">I", 0)  # 종료마커
    return io.BytesIO(buf)


def test_parse_frame_stream_yields_jpegs_until_terminator():
    jpegs = [b"\xff\xd8jpeg1", b"\xff\xd8jpeg2longer"]
    stream = _make_stream(jpegs)
    out = list(parse_frame_stream(lambda n: stream.read(n)))
    assert out == jpegs


def test_parse_frame_stream_empty_terminator_only():
    stream = io.BytesIO(struct.pack(">I", 0))
    out = list(parse_frame_stream(lambda n: stream.read(n)))
    assert out == []


def test_parse_frame_stream_truncated_raises():
    # 길이 헤더는 10인데 payload 5바이트만 존재
    bad = struct.pack(">I", 10) + b"short"
    stream = io.BytesIO(bad)
    with pytest.raises(Exception):
        list(parse_frame_stream(lambda n: stream.read(n)))


def test_parse_frame_stream_header_truncated_raises():
    # 헤더 4바이트 중 2바이트만
    bad = struct.pack(">H", 0)  # 2바이트
    stream = io.BytesIO(bad)
    with pytest.raises(Exception):
        list(parse_frame_stream(lambda n: stream.read(n)))


def test_parse_frame_stream_multiple_frames():
    jpegs = [b"A" * 100, b"B" * 200, b"C" * 50]
    stream = _make_stream(jpegs)
    out = list(parse_frame_stream(lambda n: stream.read(n)))
    assert out == jpegs


# ---------------------------------------------------------------------------
# FifthInproc — 계약 테스트
# ---------------------------------------------------------------------------

def test_infer_before_load_raises():
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    with pytest.raises(RuntimeError, match="load"):
        f.infer("/s.wav", on_frame=lambda x: None)


def test_load_health_failure_raises():
    f = FifthInproc(video_path="/idle.mp4", render_url="http://127.0.0.1:9")
    f._check_health = lambda: False
    with pytest.raises(RuntimeError):
        f.load()


def test_load_idempotent():
    """load() 2회 호출 — _check_health 1회만."""
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    calls = []
    f._check_health = lambda: calls.append(1) or True
    f.load()
    f.load()
    assert len(calls) == 1


class _NoopConn:
    """테스트용 더미 conn — close()가 no-op."""
    def close(self):
        pass


def test_infer_posts_parses_decodes_frames():
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    f._check_health = lambda: True
    f.load()

    jpegs = [b"J1", b"J2", b"J3"]
    buf = io.BytesIO(
        b"".join(struct.pack(">I", len(j)) + j for j in jpegs)
        + struct.pack(">I", 0)
    )
    f._open_render_stream = lambda wav, vp: (lambda n: buf.read(n), _NoopConn())
    f._decode_jpeg = lambda b: np.zeros((4, 4, 3), np.uint8)

    got = []
    n = f.infer("/s.wav", on_frame=got.append)
    assert n == 3 == len(got)


def test_infer_on_frame_receives_rgb_ndarray():
    """on_frame 에 전달되는 값이 ndarray인지 확인."""
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    f._check_health = lambda: True
    f.load()

    jpegs = [b"FAKE_JPEG"]
    buf = io.BytesIO(
        b"".join(struct.pack(">I", len(j)) + j for j in jpegs)
        + struct.pack(">I", 0)
    )
    f._open_render_stream = lambda wav, vp: (lambda n: buf.read(n), _NoopConn())
    expected = np.ones((8, 8, 3), np.uint8) * 42
    f._decode_jpeg = lambda b: expected

    received = []
    f.infer("/s.wav", on_frame=received.append)
    assert len(received) == 1
    np.testing.assert_array_equal(received[0], expected)


def test_infer_uses_self_video_path_when_none():
    """video_path 생략 시 self.video_path 사용."""
    f = FifthInproc(video_path="/default.mp4", render_url="http://x")
    f._check_health = lambda: True
    f.load()

    captured_vp = []

    def fake_open(wav, vp):
        captured_vp.append(vp)
        buf = io.BytesIO(struct.pack(">I", 0))
        return lambda n: buf.read(n), _NoopConn()

    f._open_render_stream = fake_open
    f._decode_jpeg = lambda b: np.zeros((1, 1, 3), np.uint8)
    f.infer("/s.wav", on_frame=lambda x: None)
    assert captured_vp == ["/default.mp4"]


def test_infer_uses_override_video_path():
    """video_path 명시 시 그것을 전달."""
    f = FifthInproc(video_path="/default.mp4", render_url="http://x")
    f._check_health = lambda: True
    f.load()

    captured_vp = []

    def fake_open(wav, vp):
        captured_vp.append(vp)
        buf = io.BytesIO(struct.pack(">I", 0))
        return lambda n: buf.read(n), _NoopConn()

    f._open_render_stream = fake_open
    f._decode_jpeg = lambda b: np.zeros((1, 1, 3), np.uint8)
    f.infer("/s.wav", on_frame=lambda x: None, video_path="/override.mp4")
    assert captured_vp == ["/override.mp4"]


def test_infer_returns_zero_frames_on_empty_stream():
    """렌더서버가 종료마커만 보내면 프레임 0 반환."""
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    f._check_health = lambda: True
    f.load()

    buf = io.BytesIO(struct.pack(">I", 0))
    f._open_render_stream = lambda wav, vp: (lambda n: buf.read(n), _NoopConn())
    f._decode_jpeg = lambda b: np.zeros((1, 1, 3), np.uint8)

    got = []
    n = f.infer("/s.wav", on_frame=got.append)
    assert n == 0
    assert got == []


def test_infer_zero_frames_emits_warning(caplog):
    """프레임 0개 반환 시 WARNING 로그 발생."""
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    f._check_health = lambda: True
    f.load()

    buf = io.BytesIO(struct.pack(">I", 0))
    f._open_render_stream = lambda wav, vp: (lambda n: buf.read(n), _NoopConn())
    f._decode_jpeg = lambda b: np.zeros((1, 1, 3), np.uint8)

    with caplog.at_level(logging.WARNING, logger="fifth_inproc"):
        f.infer("/s.wav", on_frame=lambda x: None)

    assert any("프레임 0개" in r.message for r in caplog.records), (
        f"WARNING 로그 미발생. 기록된 로그: {[r.message for r in caplog.records]}"
    )


def test_infer_conn_closed_after_stream(monkeypatch):
    """infer() 완료 후 conn.close() 정확히 1회 호출."""
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    f._check_health = lambda: True
    f.load()

    jpegs = [b"J1"]
    buf = io.BytesIO(
        b"".join(struct.pack(">I", len(j)) + j for j in jpegs)
        + struct.pack(">I", 0)
    )

    close_count = []

    class _CountingConn:
        def close(self):
            close_count.append(1)

    f._open_render_stream = lambda wav, vp: (lambda n: buf.read(n), _CountingConn())
    f._decode_jpeg = lambda b: np.zeros((4, 4, 3), np.uint8)

    f.infer("/s.wav", on_frame=lambda x: None)
    assert len(close_count) == 1, f"conn.close() 호출 횟수 기대 1, 실제 {len(close_count)}"


def test_infer_conn_closed_on_parse_error():
    """스트림 파싱 중 예외 발생해도 conn.close() 호출."""
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    f._check_health = lambda: True
    f.load()

    # 헤더는 length=10인데 데이터 2바이트만 — ValueError 유발
    bad = struct.pack(">I", 10) + b"sh"
    buf = io.BytesIO(bad)

    close_count = []

    class _CountingConn:
        def close(self):
            close_count.append(1)

    f._open_render_stream = lambda wav, vp: (lambda n: buf.read(n), _CountingConn())
    f._decode_jpeg = lambda b: np.zeros((4, 4, 3), np.uint8)

    with pytest.raises(Exception):
        f.infer("/s.wav", on_frame=lambda x: None)

    assert len(close_count) == 1, "예외 경로에서도 conn.close() 1회 필수"


def test_infer_signature_matches_musetalk():
    import inspect
    params = list(inspect.signature(FifthInproc.infer).parameters)
    assert params[:4] == ["self", "wav_path", "on_frame", "video_path"]


# ---------------------------------------------------------------------------
# _build_body wav_path 직접 전달 테스트 (공유 볼륨 설계 v3)
# ---------------------------------------------------------------------------

def test_build_body_sends_wav_path_directly(tmp_path):
    """_build_body: wav_path 키로 경로 직접 전달 (b64 인코딩 없음)."""
    wav_content = b"RIFF\x00\x00\x00\x00WAVEfmt " + b"\x00" * 32
    wav_file = tmp_path / "test.wav"
    wav_file.write_bytes(wav_content)

    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    body = f._build_body(str(wav_file), "/ref/idle.mp4")

    assert "wav_path" in body, "wav_path 키 필수"
    assert "wav_b64" not in body, "wav_b64 키는 사용하지 않음"
    assert body["wav_path"] == str(wav_file)
    assert body["video_path"] == "/ref/idle.mp4"


def test_build_body_wav_path_contract_matches_server(tmp_path):
    """클라 wav_path ↔ 서버 wav_path 키 계약 일치 검증."""
    import json as _json

    wav_file = tmp_path / "rnd.wav"
    wav_file.write_bytes(b"\x00\x01\x02\x03" * 100)

    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    body = f._build_body(str(wav_file), "/ref/idle.mp4")

    # 서버 _parse_render_body 계약: wav_path 키로 읽음
    serialized = _json.dumps(body).encode()
    parsed_back = _json.loads(serialized)
    assert parsed_back["wav_path"] == str(wav_file), "서버 파싱 키 불일치"
    assert parsed_back["video_path"] == "/ref/idle.mp4"


def test_build_body_no_file_io(tmp_path):
    """_build_body가 파일을 열지 않아도 동작 — 경로 문자열만 반환."""
    # 존재하지 않는 경로도 _build_body는 성공해야 함 (경로 문자열만 담음)
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    body = f._build_body("/nonexistent/path/x.wav", "/ref/idle.mp4")

    assert body["wav_path"] == "/nonexistent/path/x.wav"
    assert "wav_b64" not in body
