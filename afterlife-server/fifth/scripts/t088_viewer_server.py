"""T-088 PoC: 가비아 호스트 MJPEG 뷰어 서버.

컨테이너 렌더서버(POST /oth-path, raw [4B BE len][jpeg]...[4B 0])를 호출해
MJPEG(multipart/x-mixed-replace)로 재전송. 로컬 브라우저는 SSH 터널로 접근.

기존 fifth_inproc.parse_frame_stream 로직을 재사용한다(미수정).
"""
import os
import sys
import json
import time
import struct
import argparse
import http.client
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# prethird/scripts 의 fifth_inproc.parse_frame_stream 재사용
_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(_HERE, "..", "..", "prethird", "scripts")))
from fifth_inproc import parse_frame_stream  # noqa: E402

RENDER_URL = os.environ.get("FIFTH_RENDER_URL", "http://203.0.113.30:8810")
WAV_PATH = os.environ.get("T088_WAV", "/tmp/t088/seq.wav")
META_PATH = os.environ.get("T088_META", "/tmp/t088/seq.meta.json")
VIDEO_PATH = os.environ.get("T088_SOURCE", "")  # 사진(.jpg/.png) 또는 영상
FPS = float(os.environ.get("T088_FPS") or "25")

def parse_render_socket(read_exactly):
    """fifth_inproc.parse_frame_stream 재사용 — jpeg payload yield."""
    return parse_frame_stream(read_exactly)

def iter_render_jpegs(render_url, wav_path, video_path):
    u = urllib.parse.urlparse(render_url)
    conn = http.client.HTTPConnection(u.hostname, u.port or 80, timeout=900)
    body = json.dumps({"wav_path": wav_path, "video_path": video_path})
    conn.request("POST", "/render", body, {"Content-Type": "application/json"})
    resp = conn.getresponse()
    if resp.status != 200:
        detail = resp.read()[:200]
        conn.close()
        raise RuntimeError(f"render {resp.status}: {detail!r}")

    def read_exactly(n):
        buf = b""
        while len(buf) < n:
            c = resp.read(n - len(buf))
            if not c:
                break
            buf += c
        return buf

    try:
        for jpeg in parse_render_socket(read_exactly):
            yield jpeg
    finally:
        conn.close()

def mjpeg_part(jpeg: bytes) -> bytes:
    return (
        b"--frame\r\n"
        b"Content-Type: image/jpeg\r\n"
        + f"Content-Length: {len(jpeg)}\r\n\r\n".encode()
        + jpeg
        + b"\r\n"
    )

HTML = """<!doctype html><html><head><meta charset="utf-8"><title>T-088 뜸모션 전환 PoC</title>
<style>body{background:#111;color:#eee;font-family:sans-serif;text-align:center}
#wrap{position:relative;display:inline-block}#stream{max-width:90vw}
#tag{position:absolute;top:8px;left:8px;padding:4px 8px;background:rgba(0,0,0,.6);font-size:14px}
button{margin:8px;padding:6px 12px}</style></head><body>
<h3>T-088 무음→발화 연속 전환 (단일 렌더 위상연속 상한)</h3>
<div id="wrap"><img id="stream" src="/stream"><div id="tag">loading…</div></div>
<div><button onclick="cap()">현재 프레임 캡처</button>
<button onclick="document.getElementById('stream').src='/stream?'+Date.now()">스트림 재시작</button></div>
<canvas id="cap" style="display:none"></canvas><div id="shots"></div>
<script>
let meta=null;
fetch('/meta').then(r=>r.json()).then(m=>{meta=m;tick();});
function tick(){
  if(!meta){return;}
  const tag=document.getElementById('tag');
  tag.textContent='dur '+(meta.duration ?? 0).toFixed(1)+'s | segs: '+(meta.segments||[]).map(s=>s.kind[0]).join('');
}
function cap(){
  const img=document.getElementById('stream'),c=document.getElementById('cap');
  c.width=img.naturalWidth;c.height=img.naturalHeight;
  c.getContext('2d').drawImage(img,0,0);
  const im=new Image();im.src=c.toDataURL('image/png');im.style.width='180px';im.style.margin='4px';
  document.getElementById('shots').appendChild(im);
}
</script></body></html>"""

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):  # 콘솔 소음 억제
        pass

    def do_GET(self):
        if self.path == "/":
            data = HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        elif self.path == "/meta":
            try:
                with open(META_PATH, "rb") as f:
                    data = f.read()
            except OSError:
                data = b"{}"
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        elif self.path.startswith("/stream"):
            self.send_response(200)
            self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            interval = 1.0 / FPS if FPS > 0 else 0.0
            try:
                for jpeg in iter_render_jpegs(RENDER_URL, WAV_PATH, VIDEO_PATH):
                    self.wfile.write(mjpeg_part(jpeg))
                    self.wfile.flush()
                    if interval:
                        time.sleep(interval)
            except (BrokenPipeError, ConnectionResetError):
                pass
            except Exception as e:  # 렌더 실패 표면화
                sys.stderr.write(f"[t088] stream error: {e}\n")
        else:
            self.send_response(404)
            self.end_headers()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=int(os.environ.get("T088_PORT", "8088")))
    args = ap.parse_args()
    srv = ThreadingHTTPServer(("0.0.0.0", args.port), Handler)
    print(f"[t088] viewer on :{args.port}  render={RENDER_URL}  src={VIDEO_PATH}  wav={WAV_PATH}")
    srv.serve_forever()

if __name__ == "__main__":
    main()
