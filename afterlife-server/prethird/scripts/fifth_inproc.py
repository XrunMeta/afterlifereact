"""fifth_inproc.py — prethird 입싱크 HTTP 클라이언트 래퍼 (v2, 렌더 분리).

컨테이너 렌더서버(fifth_render_server.py)에 HTTP POST /oth-path 요청을 보내고
프레임 스트림을 파싱해 on_frame(rgb_ndarray)을 호출한다.

musetalk_inproc.py 와 동일 계약:
  load() 1회, infer(wav_path, on_frame, video_path) -> int.

프로토콜:
  - POST {render_url}/render  body={"wav_path": "...", "video_path": "..."}
  - 응답 body: [4바이트 big-endian 길이][jpeg bytes] 반복, [4바이트 0] 종료.
  - GET {render_url}/health → 200.

환경변수:
  FIFTH_RENDER_URL   — 렌더서버 URL 기본값 (default: http://127.0.0.1:8810)

HTTP: 표준라이브러리 http.client 사용 (requests 의존 제거).
cv2: 가비아 musetalk conda env에 존재하나 prethird-venv에 미설치 가능성 대비.
     _decode_jpeg(bytes) -> rgb_ndarray 훅을 분리해 테스트에서 오버라이드 가능.
"""
from __future__ import annotations

import base64
import http.client
import json
import logging
import os
import struct
import threading
import urllib.parse
from typing import Callable

logger = logging.getLogger(__name__)

def _read_exactly(read_fn: Callable[[int], bytes], n: int) -> bytes:
    """소켓 부분 read 대비 정확히 n바이트를 모으는 헬퍼."""
    buf = b""
    while len(buf) < n:
        chunk = read_fn(n - len(buf))
        if not chunk:
            break
        buf += chunk
    return buf

def parse_frame_stream(read_exactly: Callable[[int], bytes]):
    """프레임 스트림 파서 — 순수 함수, read_exactly 콜백 주입.

    Args:
        read_exactly: 정확히 n바이트를 반환하는 콜백.
                      소켓/HTTP response.read 등 추상화.

    Yields:
        jpeg bytes (각 프레임).

    Raises:
        EOFError: 헤더 도중 스트림 종료.
        ValueError: payload가 헤더 길이보다 짧음(truncated).
    """
    while True:
        header = read_exactly(4)
        if len(header) < 4:
            if len(header) == 0:
                return  # 스트림 정상 종료
            raise EOFError(f"프레임 헤더 truncated: 기대 4바이트, 수신 {len(header)}바이트")
        (length,) = struct.unpack(">I", header)
        if length == 0:
            return  # 종료마커
        payload = read_exactly(length)
        if len(payload) < length:
            raise ValueError(
                f"프레임 payload truncated: 기대 {length}바이트, 수신 {len(payload)}바이트"
            )
        yield payload

class FifthInproc:
    """fifth 렌더서버 HTTP 클라이언트.

    musetalk_inproc.FifthInproc(=MuseTalkInproc)과 동일 계약으로 server.py 토글 무변경.
    """

    def __init__(
        self,
        video_path: str,
        clone_id: int | None = None,
        render_url: str | None = None,
    ) -> None:
        self.video_path = video_path
        self.clone_id = clone_id
        self.render_url = render_url or os.environ.get(
            "FIFTH_RENDER_URL", "http://127.0.0.1:8810"
        )
        self._loaded = False
        self._infer_lock = threading.Lock()

    # ------------------------------------------------------------------
    # 훅 메서드 (테스트에서 오버라이드)
    # ------------------------------------------------------------------

    def _check_health(self) -> bool:
        """GET {render_url}/health → True(200) / False(그 외)."""
        parsed = urllib.parse.urlparse(self.render_url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 80
        path = "/health"
        try:
            conn = http.client.HTTPConnection(host, port, timeout=5)
            conn.request("GET", path)
            resp = conn.getresponse()
            return resp.status == 200
        except Exception:
            return False

    def _open_render_stream(
        self, wav_path: str, video_path: str
    ) -> tuple[Callable[[int], bytes], http.client.HTTPConnection]:
        """POST /oth-path 요청 후 (read_exactly, conn) 반환.

        conn 수명: infer()가 스트림 전체를 소비하는 동안 유지돼야 한다.
        호출자(infer)가 finally 에서 conn.close()를 반드시 호출해야 함.

        status != 200 이면 그 자리에서 conn.close() 후 RuntimeError — 이 경우만
        _open_render_stream 내부에서 닫는다(람다 반환이 없으므로 안전).
        """
        body = self._build_body(wav_path, video_path)
        parsed = urllib.parse.urlparse(self.render_url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 80
        conn = http.client.HTTPConnection(host, port, timeout=120)
        conn.request(
            "POST",
            "/render",
            body=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
        )
        resp = conn.getresponse()
        if resp.status != 200:
            err_body = resp.read(256)
            conn.close()  # status!=200: 람다 반환 안 하므로 즉시 닫음
            raise RuntimeError(
                f"렌더서버 /render 오류: HTTP {resp.status} — {err_body!r}"
            )
        raw_read = resp.read  # http.client response.read(n)
        return lambda n: _read_exactly(raw_read, n), conn

    def _build_body(self, wav_path: str, video_path: str) -> dict:
        """렌더 요청 body 구성. wav 파일을 base64 인코딩해 wav_b64로 전송.

        컨테이너(렌더서버)와 호스트(prethird)는 파일시스템이 분리돼 있으므로
        wav_path 를 직접 전달하면 서버가 파일을 읽을 수 없다.
        wav 바이너리를 base64로 body에 실어 전송한다.
        """
        with open(wav_path, "rb") as f:
            wav_b64 = base64.b64encode(f.read()).decode("ascii")
        return {"wav_b64": wav_b64, "video_path": video_path}

    def _decode_jpeg(self, jpeg_bytes: bytes):
        """jpeg bytes → RGB ndarray. cv2 없으면 ImportError."""
        import cv2  # type: ignore
        import numpy as np

        buf = np.frombuffer(jpeg_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError("cv2.imdecode 실패 — jpeg 손상 가능성")
        rgb = bgr[:, :, ::-1]
        return np.ascontiguousarray(rgb)

    # ------------------------------------------------------------------
    # 공개 API
    # ------------------------------------------------------------------

    def load(self) -> None:
        """렌더서버 health 확인. 실패 시 RuntimeError. 멱등성 보장."""
        if self._loaded:
            return
        ok = self._check_health()
        if not ok:
            raise RuntimeError(
                f"FifthInproc.load() 실패 — 렌더서버 응답 없음: {self.render_url}/health"
            )
        self._loaded = True

    def infer(
        self,
        wav_path: str,
        on_frame: Callable,
        video_path: str | None = None,
    ) -> int:
        """wav → 프레임 생성마다 on_frame(rgb_ndarray) 호출. 반환: 프레임 수.

        Args:
            wav_path:   추론할 wav 파일 경로 (렌더서버가 접근 가능한 공유 경로).
            on_frame:   RGB ndarray 콜백. AvatarVideoTrack.push_ndarray 호환.
            video_path: 이 호출에서만 사용할 클론 영상 경로. 생략 시 self.video_path.

        Returns:
            총 프레임 수.

        Raises:
            RuntimeError: load() 미호출.
        """
        if not self._loaded:
            raise RuntimeError("FifthInproc.load() 를 먼저 호출하세요.")
        vp = video_path if video_path is not None else self.video_path
        with self._infer_lock:
            read_exactly, conn = self._open_render_stream(wav_path, vp)
            count = 0
            try:
                for jpeg_bytes in parse_frame_stream(read_exactly):
                    rgb = self._decode_jpeg(jpeg_bytes)
                    on_frame(rgb)
                    count += 1
            finally:
                conn.close()
            if count == 0:
                logger.warning(
                    "FifthInproc.infer: 프레임 0개 반환 — wav_path=%s video_path=%s. "
                    "렌더서버 silent 실패 가능성. 상위에서 무음 fallback 처리 권장.",
                    wav_path,
                    vp,
                )
            return count
