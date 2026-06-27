import io
import struct
import sys
import os

# prethird/scripts 를 import path에 추가(fifth_inproc 재사용)
HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "..", "..", "prethird", "scripts")))

from t088_viewer_server import mjpeg_part, parse_render_socket


def test_mjpeg_part_framing():
    jpeg = b"\xff\xd8jpegbytes\xff\xd9"
    part = mjpeg_part(jpeg)
    assert part.startswith(b"--frame\r\n")
    assert b"Content-Type: image/jpeg\r\n" in part
    assert f"Content-Length: {len(jpeg)}".encode() in part
    assert part.endswith(jpeg + b"\r\n")


def test_parse_render_socket_reads_chunks_until_zero_marker():
    # 서버 포맷 모사: [4B len][jpeg]...[4B 0]
    frames = [b"AAAA", b"BBBBBB"]
    blob = b""
    for f in frames:
        blob += struct.pack(">I", len(f)) + f
    blob += struct.pack(">I", 0)  # 종료마커

    stream = io.BytesIO(blob)

    def read_exactly(n):
        buf = b""
        while len(buf) < n:
            c = stream.read(n - len(buf))
            if not c:
                break
            buf += c
        return buf

    got = list(parse_render_socket(read_exactly))
    assert got == frames


def _make_read_exactly(blob: bytes):
    """BytesIO 기반 read_exactly 헬퍼."""
    stream = io.BytesIO(blob)

    def read_exactly(n):
        buf = b""
        while len(buf) < n:
            c = stream.read(n - len(buf))
            if not c:
                break
            buf += c
        return buf

    return read_exactly


def test_parse_render_socket_empty_stream():
    """종료마커만 있는 스트림 → 빈 리스트."""
    blob = struct.pack(">I", 0)
    got = list(parse_render_socket(_make_read_exactly(blob)))
    assert got == []


def test_parse_render_socket_single_frame():
    """프레임 1개 + 종료마커 → [그 jpeg]."""
    jpeg = b"\xff\xd8single\xff\xd9"
    blob = struct.pack(">I", len(jpeg)) + jpeg + struct.pack(">I", 0)
    got = list(parse_render_socket(_make_read_exactly(blob)))
    assert got == [jpeg]


def test_parse_render_socket_truncated_payload_raises():
    """헤더 len=10 이지만 payload 5바이트만 → ValueError."""
    blob = struct.pack(">I", 10) + b"x" * 5  # 종료마커 없음, payload 부족
    import pytest
    with pytest.raises(ValueError):
        list(parse_render_socket(_make_read_exactly(blob)))
