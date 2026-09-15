#!/usr/bin/env python3
"""음성 패키지 배포 서버 (가비아 8204).

가비아 `/data/afterlife/tts-finetune/` 에서 돌린다.

  GET /oth-path                        서버 상태 + 보유 음성 목록
  GET /oth-path<cloneId>/manifest.json 패키지 매니페스트
  GET /oth-path<cloneId>/<file>        모델 파일 (Range 지원 — 중단된 다운로드 재개)

🔴 방화벽은 열지 않는다. TTS(8203)와 같이 SSH 터널로만 닿는다.
   여기 올라가는 것은 특정 인물의 목소리로 학습된 모델 = 생체 파생 데이터다.
"""
from __future__ import annotations

import argparse
import json
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SAFE_NAME = re.compile(r"^[A-Za-z0-9._-]+$")


class VoiceHandler(SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler 에 healthz 와 Range 지원을 얹는다."""

    def __init__(self, *args, root: Path, **kwargs):
        self.voice_root = root
        super().__init__(*args, directory=str(root), **kwargs)

    def log_message(self, fmt: str, *args) -> None:  # 접근 로그를 한 줄로
        print(f"{self.address_string()} {fmt % args}", flush=True)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.rstrip("/") == "/healthz":
            voices = sorted(
                d.name for d in (self.voice_root / "voices").glob("*") if d.is_dir()
            )
            body = json.dumps({"ok": True, "service": "voice-dist", "voices": voices}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # 경로 화이트리스트 — /voices/<id>/<file> 만 허용한다.
        parts = [p for p in self.path.split("?")[0].split("/") if p]
        if len(parts) != 3 or parts[0] != "voices" or not all(SAFE_NAME.match(p) for p in parts[1:]):
            self.send_error(404, "not found")
            return

        target = self.voice_root / "voices" / parts[1] / parts[2]
        if not target.is_file():
            self.send_error(404, "not found")
            return

        self.serve_range(target)

    def serve_range(self, target: Path) -> None:
        """Range 요청을 처리한다. 105MB 를 모바일에서 받다 끊기면 이어받아야 한다."""
        size = target.stat().st_size
        header = self.headers.get("Range")
        start, end = 0, size - 1
        partial_request = False

        if header:
            match = re.match(r"bytes=(\d*)-(\d*)", header)
            if match:
                if match.group(1):
                    start = int(match.group(1))
                if match.group(2):
                    end = int(match.group(2))
                if start >= size:
                    self.send_error(416, "range not satisfiable")
                    return
                end = min(end, size - 1)
                partial_request = True

        length = end - start + 1
        self.send_response(206 if partial_request else 200)
        self.send_header("Content-Type", "application/octet-stream")
        self.send_header("Content-Length", str(length))
        self.send_header("Accept-Ranges", "bytes")
        if partial_request:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()

        with target.open("rb") as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                chunk = f.read(min(1 << 20, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True, help="voices/ 를 담은 디렉토리")
    p.add_argument("--port", type=int, default=8204)
    # 기본이 루프백인 이유: 이 포트는 SSH 터널로만 닿아야 한다.
    p.add_argument("--host", default="127.0.0.1")
    args = p.parse_args()

    root = Path(args.root).resolve()
    (root / "voices").mkdir(parents=True, exist_ok=True)

    handler = partial(VoiceHandler, root=root)
    server = ThreadingHTTPServer((args.host, args.port), handler)
    voices = sorted(d.name for d in (root / "voices").glob("*") if d.is_dir())
    print(f"voice-dist on {args.host}:{args.port} · root {root} · voices {voices}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
