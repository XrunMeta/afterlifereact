"""T-088 continuation 뷰어 서버: phase_token 위상 이어가기 → MJPEG 스트림.

렌더서버(:8811)에 패턴(silence,speech,...) 청크를 위상 토큰 이어가며
POST → 받은 JPEG 프레임을 MJPEG multipart/x-mixed-replace로 재전송.
로컬 브라우저는 SSH 터널로 접근.

===========================================================================
실행 (가비아 호스트 — 직접 실행 말고 _remote_t088_viewer_run.sh 권장):

  T088_WAV=/home/afterlife/afterlife-server/.fifth-tmp/t088/seq.wav \\
  T088_SOURCE=/home/afterlife/afterlife-server/.fifth-tmp/t088/face.jpg \\
  T088_RENDER_URL=http://203.0.113.30:8811 \\
  FIFTH_HEAD_SLEW_FRAMES=0 \\
  python t088_continuation_viewer_server.py --port 8812

SSH 터널 (로컬 Mac):
  ssh -N -L 8812:localhost:8812 afterlife-gabia
  브라우저: http://localhost:8812

환경 변수:
  T088_RENDER_URL   렌더서버 URL (기본: http://203.0.113.30:8811)
  T088_WAV          발화 wav 경로 — 렌더서버가 읽을 수 있는 공유마운트 경로 (필수)
  T088_SOURCE       얼굴 사진/영상 경로 — 공유마운트 경로 (필수)
  T088_PATTERN      청크 패턴 (기본: silence,speech,silence,speech,silence)
  T088_SILENCE_SEC  무음 청크 길이 초 (기본: 2.0)
  T088_SHARED_TMP   무음 wav 임시 경로 기준 (기본: /home/afterlife/afterlife-server/.fifth-tmp/t088)
  T088_FPS          영상 프레임레이트 (기본: 25)
  T088_LOOP         1 이면 패턴 완료 후 재시작 반복 (기본: 0 = 1회만)
  FIFTH_HEAD_SLEW_FRAMES  (정보용 로그 — 실제 슬루는 렌더서버 env)
===========================================================================
"""
from __future__ import annotations

import argparse
import http.client
import json
import os
import struct
import sys
import tempfile
import threading
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Generator, Optional


# ---------------------------------------------------------------------------
# 설정 (환경 변수)
# ---------------------------------------------------------------------------

RENDER_URL   = os.environ.get("T088_RENDER_URL",   "http://203.0.113.30:8811")
ANSWER_WAV   = os.environ.get("T088_WAV",          "")
SRC_PATH     = os.environ.get("T088_SOURCE",       "")
PATTERN      = os.environ.get("T088_PATTERN",      "silence,speech,silence,speech,silence")
SILENCE_SEC  = float(os.environ.get("T088_SILENCE_SEC",  "2.0"))
SHARED_TMP   = os.environ.get("T088_SHARED_TMP",   "/home/afterlife/afterlife-server/.fifth-tmp/t088")
FPS          = float(os.environ.get("T088_FPS",    "25"))
LOOP         = os.environ.get("T088_LOOP",         "0") == "1"
SLEW_K       = os.environ.get("FIFTH_HEAD_SLEW_FRAMES", "?")  # 정보용

# 무음 wav 를 렌더서버가 읽을 수 있는 공유마운트 경로에 저장
_SILENCE_WAV_PATH = str(Path(SHARED_TMP) / "viewer_silence.wav")

# 토큰 매직 — fifth_render_server.py 와 동일
_TOK_MAGIC = b"TOK:"


# ---------------------------------------------------------------------------
# 무음 WAV 생성 (순수 Python — 외부 의존성 없음)
# ---------------------------------------------------------------------------

def _write_silence_wav(path: str, duration_sec: float, sr: int = 16000) -> None:
    """soundfile 없이 WAV 무음 생성 (struct 모듈만 사용).

    렌더서버가 읽을 수 있는 공유마운트 경로에 작성.
    """
    n_samples = max(0, int(round(duration_sec * sr)))
    data_size = n_samples * 2  # 16-bit PCM mono
    with open(path, "wb") as f:
        # RIFF 헤더
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + data_size))
        f.write(b"WAVE")
        # fmt 청크
        f.write(b"fmt ")
        f.write(struct.pack("<I", 16))         # 청크 크기
        f.write(struct.pack("<H", 1))          # PCM
        f.write(struct.pack("<H", 1))          # 모노
        f.write(struct.pack("<I", sr))         # 샘플레이트
        f.write(struct.pack("<I", sr * 2))     # 바이트레이트
        f.write(struct.pack("<H", 2))          # 블록 정렬
        f.write(struct.pack("<H", 16))         # 비트 깊이
        # data 청크
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        f.write(b"\x00" * data_size)


def ensure_silence_wav() -> str:
    """무음 wav 를 공유마운트에 생성(또는 재사용)하고 경로 반환."""
    Path(SHARED_TMP).mkdir(parents=True, exist_ok=True)
    p = _SILENCE_WAV_PATH
    _write_silence_wav(p, SILENCE_SEC)
    print(f"[viewer] silence.wav 생성: {p} ({SILENCE_SEC}s)", file=sys.stderr)
    return p


# ---------------------------------------------------------------------------
# 패턴 파싱 (순수 함수)
# ---------------------------------------------------------------------------

def parse_pattern_to_wavs(pattern_str: str, answer_wav: str, silence_wav: str) -> list[dict]:
    """패턴 문자열 → 청크 dict list.

    Returns:
        [{"type": "silence"|"speech", "wav": str}, ...]
    Raises:
        ValueError: 알 수 없는 패턴 토큰.
    """
    result = []
    for tok in pattern_str.split(","):
        t = tok.strip().lower()
        if t == "silence":
            result.append({"type": "silence", "wav": silence_wav})
        elif t == "speech":
            result.append({"type": "speech", "wav": answer_wav})
        else:
            raise ValueError(f"패턴 요소는 silence/speech 여야 함, got: {t!r}")
    return result


# ---------------------------------------------------------------------------
# 청크 스트리밍 렌더 (JPEG 즉시 yield, 끝 tok StopIteration.value 반환)
# ---------------------------------------------------------------------------

def stream_render_chunk(
    render_url: str,
    wav_path: str,
    src_path: str,
    phase_token: dict,
) -> Generator[bytes, None, Optional[dict]]:
    """POST /oth-path → JPEG 프레임 yield + 끝 tok dict 반환.

    JPEG 를 버퍼링 없이 즉시 yield 해 MJPEG 스트리밍 지연을 최소화한다.
    TOK: 트레일러를 만나면 JSON 파싱해 end_tok 로 저장.

    Usage:
        gen = stream_render_chunk(...)
        try:
            while True:
                jpeg = next(gen)
                send_mjpeg(jpeg)
        except StopIteration as e:
            end_tok = e.value  # dict or None

    Args:
        render_url: 렌더서버 URL (http://203.0.113.30:8811).
        wav_path: wav 경로 (렌더서버 접근 가능 경로).
        src_path: 얼굴 소스 경로 (렌더서버 접근 가능 경로).
        phase_token: 현재 위상 토큰 dict (첫 청크 = PhaseToken() 기본값).
    Yields:
        jpeg bytes (MJPEG 프레임).
    Returns (via StopIteration.value):
        end_tok dict or None.
    """
    u = urllib.parse.urlparse(render_url)
    host = u.hostname or "203.0.113.30"
    port = u.port or 8811

    body_obj = {
        "wav_path": wav_path,
        "video_path": src_path,
        "phase_token": phase_token,
    }
    body = json.dumps(body_obj).encode()

    end_tok: Optional[dict] = None
    conn = http.client.HTTPConnection(host, port, timeout=180)
    try:
        conn.request(
            "POST", "/render", body=body,
            headers={
                "Content-Length": str(len(body)),
                "Content-Type": "application/json",
            },
        )
        resp = conn.getresponse()
        if resp.status != 200:
            err = resp.read()[:200].decode(errors="replace")
            raise RuntimeError(f"/render {resp.status}: {err}")

        def read_exactly(n: int) -> bytes:
            buf = bytearray()
            while len(buf) < n:
                c = resp.read(n - len(buf))
                if not c:
                    break
                buf.extend(c)
            return bytes(buf)

        while True:
            hdr = read_exactly(4)
            if len(hdr) < 4:
                break
            n = struct.unpack(">I", hdr)[0]
            if n == 0:
                break
            payload = read_exactly(n)
            if payload.startswith(_TOK_MAGIC):
                try:
                    end_tok = json.loads(payload[len(_TOK_MAGIC):].decode())
                except Exception as exc:
                    print(f"[viewer] TOK: 파싱 실패: {exc}", file=sys.stderr)
            else:
                yield payload
    finally:
        conn.close()

    return end_tok


# ---------------------------------------------------------------------------
# MJPEG 파트 직렬화
# ---------------------------------------------------------------------------

def mjpeg_part(jpeg: bytes) -> bytes:
    return (
        b"--frame\r\n"
        b"Content-Type: image/jpeg\r\n"
        + f"Content-Length: {len(jpeg)}\r\n\r\n".encode()
        + jpeg
        + b"\r\n"
    )


# ---------------------------------------------------------------------------
# HTML
# ---------------------------------------------------------------------------

_HTML = """<!doctype html><html><head>
<meta charset="utf-8">
<title>T-088 위상연속 뷰어 (무음↔발화 전환)</title>
<style>
body{background:#111;color:#eee;font-family:sans-serif;text-align:center;margin:0;padding:16px}
h3{margin-bottom:8px}
#wrap{position:relative;display:inline-block}
#stream{max-width:90vw;max-height:80vh;border:2px solid #444}
#info{margin-top:8px;font-size:13px;color:#aaa}
#badge{position:absolute;top:8px;left:8px;padding:4px 10px;
       background:rgba(0,0,0,.7);font-size:13px;border-radius:4px}
button{margin:6px 4px;padding:6px 14px;background:#333;color:#eee;
       border:1px solid #555;cursor:pointer;border-radius:4px}
button:hover{background:#444}
</style></head><body>
<h3>T-088 연속 렌더 뷰어 — 무음↔발화 head 전환 확인</h3>
<div id="wrap">
  <img id="stream" src="/stream">
  <div id="badge">스트림 중...</div>
</div>
<div>
  <button onclick="reload()">다시 재생</button>
  <button onclick="cap()">현재 프레임 캡처</button>
</div>
<div id="info">FIFTH_HEAD_SLEW_FRAMES=__SLEW__  pattern=__PATTERN__  silence=__SILENCE__s</div>
<canvas id="cap" style="display:none"></canvas>
<div id="shots"></div>
<script>
function reload(){
  document.getElementById('stream').src='/stream?t='+Date.now();
  document.getElementById('badge').textContent='스트림 중...';
}
document.getElementById('stream').onload=function(){
  document.getElementById('badge').textContent='재생 완료(마지막 프레임)';
};
document.getElementById('stream').onerror=function(){
  document.getElementById('badge').textContent='스트림 오류 — 다시 재생 클릭';
};
function cap(){
  var img=document.getElementById('stream');
  var c=document.getElementById('cap');
  c.width=img.naturalWidth||512;c.height=img.naturalHeight||512;
  c.getContext('2d').drawImage(img,0,0);
  var im=new Image();
  im.src=c.toDataURL('image/png');
  im.style.cssText='width:180px;margin:4px;border:1px solid #555';
  document.getElementById('shots').prepend(im);
}
</script></body></html>"""


def _html_page() -> bytes:
    h = _HTML.replace("__SLEW__", SLEW_K)
    h = h.replace("__PATTERN__", PATTERN)
    h = h.replace("__SILENCE__", str(SILENCE_SEC))
    return h.encode("utf-8")


# ---------------------------------------------------------------------------
# HTTP 핸들러
# ---------------------------------------------------------------------------

class ViewerHandler(BaseHTTPRequestHandler):
    """MJPEG 뷰어 HTTP 핸들러."""

    def log_message(self, *a) -> None:  # 콘솔 소음 억제
        pass

    def do_GET(self) -> None:
        path = self.path.split("?")[0]

        if path == "/":
            data = _html_page()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        elif path == "/health":
            data = b'{"status":"ok"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        elif path == "/stream":
            self._serve_stream()

        else:
            self.send_response(404)
            self.end_headers()

    def _serve_stream(self) -> None:
        """phase_token 이어가며 패턴 청크 연속 렌더 → MJPEG 전송."""
        if not ANSWER_WAV or not SRC_PATH:
            self.send_response(503)
            self.end_headers()
            self.wfile.write(b"T088_WAV / T088_SOURCE 환경변수 미설정")
            return

        self.send_response(200)
        self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        interval = 1.0 / FPS if FPS > 0 else 0.0
        loop_n = 0

        try:
            silence_wav = ensure_silence_wav()
            chunks = parse_pattern_to_wavs(PATTERN, ANSWER_WAV, silence_wav)

            while True:
                loop_n += 1
                # 첫 청크부터 빈 PhaseToken dict 전달 — 서버가 TOK: 트레일러 발송하게 함.
                phase_token: dict = {
                    "frame_offset": 0,
                    "blink_phase": 0,
                    "first_frame": True,
                    "head_last": None,
                }

                for ci, chunk in enumerate(chunks):
                    ctype = chunk["type"]
                    t0 = time.monotonic()
                    print(
                        f"[viewer] loop={loop_n} chunk[{ci}] {ctype} 렌더 시작 "
                        f"tok.frame_offset={phase_token['frame_offset']}",
                        file=sys.stderr,
                    )

                    n_frames = 0
                    gen = stream_render_chunk(
                        RENDER_URL, chunk["wav"], SRC_PATH, phase_token
                    )
                    end_tok: Optional[dict] = None
                    try:
                        while True:
                            jpeg = next(gen)
                            self.wfile.write(mjpeg_part(jpeg))
                            self.wfile.flush()
                            n_frames += 1
                            if interval:
                                time.sleep(interval)
                    except StopIteration as exc:
                        end_tok = exc.value

                    elapsed = time.monotonic() - t0
                    print(
                        f"[viewer]   -> {n_frames} frames in {elapsed:.1f}s, end_tok={end_tok}",
                        file=sys.stderr,
                    )

                    if end_tok is None:
                        print(
                            f"[viewer] WARN: chunk[{ci}] end_tok=None — "
                            "렌더서버가 TOK: 트레일러 미전송. 위상 연속 끊김.",
                            file=sys.stderr,
                        )
                        # 연속 가능한 최후 상태를 유지 (frame_offset만 누적)
                        phase_token = {
                            "frame_offset": phase_token["frame_offset"] + n_frames,
                            "blink_phase": phase_token["blink_phase"],
                            "first_frame": False,
                            "head_last": phase_token.get("head_last"),
                        }
                    else:
                        phase_token = end_tok

                print(f"[viewer] loop={loop_n} 패턴 완료", file=sys.stderr)

                if not LOOP:
                    break

        except (BrokenPipeError, ConnectionResetError):
            # 브라우저 연결 끊김 — 정상 종료
            pass
        except Exception as exc:
            print(f"[viewer] stream error: {exc}", file=sys.stderr)


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(
        description="T-088 continuation 뷰어 서버 (MJPEG, phase_token 위상 이어가기)",
    )
    ap.add_argument(
        "--port", type=int,
        default=int(os.environ.get("T088_VIEWER_PORT", "8812")),
        help="뷰어 서버 포트 (기본: 8812)",
    )
    args = ap.parse_args()

    port = args.port

    # 환경 변수 검증
    if not ANSWER_WAV:
        print("[viewer] WARNING: T088_WAV 미설정 — /stream 이 실패합니다", file=sys.stderr)
    if not SRC_PATH:
        print("[viewer] WARNING: T088_SOURCE 미설정 — /stream 이 실패합니다", file=sys.stderr)

    print(f"[viewer] ===========================", file=sys.stderr)
    print(f"[viewer] T-088 continuation 뷰어 서버", file=sys.stderr)
    print(f"[viewer]   port          = :{port}", file=sys.stderr)
    print(f"[viewer]   render_url    = {RENDER_URL}", file=sys.stderr)
    print(f"[viewer]   answer_wav    = {ANSWER_WAV or '(미설정)'}", file=sys.stderr)
    print(f"[viewer]   source        = {SRC_PATH or '(미설정)'}", file=sys.stderr)
    print(f"[viewer]   pattern       = {PATTERN}", file=sys.stderr)
    print(f"[viewer]   silence_sec   = {SILENCE_SEC}", file=sys.stderr)
    print(f"[viewer]   slew_frames   = {SLEW_K} (렌더서버 env)", file=sys.stderr)
    print(f"[viewer]   loop          = {LOOP}", file=sys.stderr)
    print(f"[viewer]   silence_wav   -> {_SILENCE_WAV_PATH}", file=sys.stderr)
    print(f"[viewer] ===========================", file=sys.stderr)
    print(f"[viewer] 브라우저 접속 (SSH 터널 후):", file=sys.stderr)
    print(f"[viewer]   ssh -N -L {port}:localhost:{port} afterlife-gabia", file=sys.stderr)
    print(f"[viewer]   http://localhost:{port}", file=sys.stderr)
    print(f"[viewer] ===========================", file=sys.stderr)

    srv = ThreadingHTTPServer(("0.0.0.0", port), ViewerHandler)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("[viewer] 종료", file=sys.stderr)


if __name__ == "__main__":
    main()
