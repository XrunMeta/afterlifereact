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
