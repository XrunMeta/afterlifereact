"""fifth 렌더 HTTP 서버 (컨테이너 fifth_poc_flp).

호스트 prethird FifthInproc 가 POST /oth-path 로 wav 를 보내면, 프레임을
[4B big-endian length][jpeg bytes] 청크로 즉시 스트리밍한다. 종료는 length=0.
GPU(엔진/JoyVASA/detect_landmarks)는 startup 1회 로드.

응답 프로토콜 (POST /oth-path):
  body = [4B big-endian len][jpeg] 반복 + [4B 0] 종료마커.
  HTTP chunked 전송 인코딩이 아님 — Connection: close + raw framing.
  Task3' 클라이언트(FifthInproc)는 연결 끝까지 read하며 len=0까지 프레임 파싱.

설계 v3 (공유 볼륨):
  wav_path/video_path는 호스트-컨테이너 공유 볼륨(/home/afterlife/afterlife-server)
  경로로 직접 전달한다. wav_b64 base64 전송은 사용하지 않는다.
"""
from __future__ import annotations

import json
import logging
import os
import struct
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Callable, Iterator, Optional

import numpy as np

try:
    import cv2
except ModuleNotFoundError:
    cv2 = None  # type: ignore[assignment]  # 테스트 환경 — mock으로 주입

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Step 1~4: encode_frame_chunk / write_frames_to_stream (순수, TDD)
# ---------------------------------------------------------------------------


def encode_frame_chunk(frame_rgb: np.ndarray, quality: int = 90) -> bytes:
    """RGB 프레임 → [4B 길이][jpeg] 청크. (cv2 는 BGR 인코딩이라 변환)"""
    if cv2 is None:
        raise RuntimeError("cv2 미설치 — 렌더서버는 컨테이너에서 실행")
    bgr = frame_rgb[:, :, ::-1]
    ok, enc = cv2.imencode(".jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("jpeg 인코딩 실패")
    data = enc.tobytes()
    return struct.pack(">I", len(data)) + data


def write_frames_to_stream(
    frames: Iterator[np.ndarray], write: Callable[[bytes], None]
) -> int:
    """프레임 iterator → write(청크). 끝에 length=0 종료마커. 반환: 프레임 수."""
    count = 0
    for f in frames:
        write(encode_frame_chunk(f))
        count += 1
    write(struct.pack(">I", 0))
    return count


# ---------------------------------------------------------------------------
# Step 5: RenderService (소스 캐시 라우팅 + stream)
# ---------------------------------------------------------------------------


def _clone_key(video_path: str) -> str:
    """video_path → clone_id 키 (prethird 자산 관례: .../VIDEO_REF_ROOT/{clone_id}/...)."""
    p = Path(video_path)
    parent_name = p.parent.name
    # parent가 clone_id처럼 보이면(숫자이거나 의미있는 디렉토리명) 사용, 아니면 stem
    if parent_name and parent_name not in (".", "", "/"):
        return parent_name
    return p.stem


class RenderService:
    """wav_path + video_path → 프레임 청크 스트림.

    소스(open/closed 이미지)는 video_path 별로 메모리 캐싱하며,
    렌더는 threading.Lock 으로 직렬화한다(GPU 단일 스트림).
    """

    def __init__(
        self,
        engine,
        jp,
        cfg,
        cache_root: str,
        detect_lmk: Callable | None = None,
        *,
        # 테스트 주입용 훅: None이면 실제 face_source/fifth_render 함수 사용
        _load_or_extract_fn: Callable | None = None,
        _prepare_sources_fn: Callable | None = None,
        _stream_wav_fn: Callable | None = None,
    ):
        self.engine = engine
        self.jp = jp
        self.cfg = cfg
        self.cache_root = cache_root
        self.detect_lmk = detect_lmk

        # 테스트 주입 훅
        self._load_or_extract_fn = _load_or_extract_fn
        self._prepare_sources_fn = _prepare_sources_fn
        self._stream_wav_fn = _stream_wav_fn

        self._sources_cache: dict[str, dict] = {}
        self._lock = threading.Lock()       # GPU 렌더 직렬화 (단일 스트림)
        self._cache_lock = threading.Lock() # 소스 캐시 생성 직렬화 (double-checked)

    def _get_sources(self, video_path: str) -> dict:
        """캐시 hit → 반환 (lock-free fast path), miss → GPU 직렬화 후 준비·캐시 저장.

        double-checked locking:
          fast path: 캐시에 있으면 즉시 반환 (lock 없음).
          slow path: _lock(GPU 단일 직렬화) 안에서 재확인 후 없으면 생성.
          prepare_sources(load_source)도 GPU를 사용하므로 렌더용 _lock으로 통합
          보호한다 — 별도 _cache_lock으로 분리하면 캐시 생성과 렌더가 동시 GPU
          접근 가능해 VRAM 충돌이 생기기 때문.
        """
        # fast path (lock 없음)
        if video_path in self._sources_cache:
            return self._sources_cache[video_path]

        # slow path — GPU 직렬화 lock 안에서 double-check
        with self._lock:
            if video_path in self._sources_cache:
                return self._sources_cache[video_path]

            # load_or_extract_sources 호출
            if self._load_or_extract_fn is not None:
                selection = self._load_or_extract_fn(video_path)
            else:
                from face_source import load_or_extract_sources, make_extract_fn
                extract_fn = make_extract_fn(self.detect_lmk)
                clone_key = _clone_key(video_path)
                selection = load_or_extract_sources(
                    video_path, self.cache_root, clone_key, extract_fn
                )

            # prepare_sources 호출
            if self._prepare_sources_fn is not None:
                sources = self._prepare_sources_fn(selection)
            else:
                from fifth_render import prepare_sources
                sources = prepare_sources(self.engine, selection)

            self._sources_cache[video_path] = sources
            return sources

    def render(
        self,
        wav_path: str,
        video_path: str,
        write: Callable[[bytes], None],
        blink_enabled: bool = True,
    ) -> int:
        """wav → 프레임 청크 write. 반환: 프레임 수.

        write는 bytes → None 콜백 (wfile.write 또는 BytesIO.write).
        종료마커(length=0)는 호출자(do_POST finally)가 정확히 1회 씀.
        render()는 프레임 청크만 write하고 종료마커는 쓰지 않는다.
        """
        sources = self._get_sources(video_path)

        count = 0
        # _get_sources 의 slow path가 이미 _lock을 취득 후 반환했으므로,
        # 여기서는 캐시 hit이 보장된 상태. GPU 렌더 직렬화를 위해 _lock 재취득.
        with self._lock:
            if self._stream_wav_fn is not None:
                count = self._stream_wav_fn(
                    self.engine, self.jp, self.cfg, sources, wav_path,
                    lambda f: write(encode_frame_chunk(f)),
                    blink_enabled,
                )
            else:
                from fifth_render import stream_wav_frames
                count = stream_wav_frames(
                    self.engine, self.jp, self.cfg, sources, wav_path,
                    on_frame=lambda f: write(encode_frame_chunk(f)),
                    blink_enabled=blink_enabled,
                )
        return count


# ---------------------------------------------------------------------------
# Step 6: HTTP 라우팅 (stdlib http.server)
# ---------------------------------------------------------------------------

_service: RenderService | None = None


def _parse_render_body(raw: bytes) -> tuple[str, str]:
    """POST /oth-path body(JSON) → (wav_path, video_path).

    설계 v3(공유 볼륨): wav_path/video_path 모두 필수.
    호스트-컨테이너가 /home/afterlife/afterlife-server 를 공유 마운트하므로
    경로를 직접 전달하면 서버가 파일을 읽을 수 있다.

    Returns:
        (wav_path, video_path)

    Raises:
        ValueError: wav_path 또는 video_path 누락.
        json.JSONDecodeError: 잘못된 JSON.
    """
    req = json.loads(raw)
    video_path = req.get("video_path")
    if not video_path:
        raise ValueError("video_path 필수")

    wav_path_raw: str | None = req.get("wav_path")
    if not wav_path_raw:
        raise ValueError("wav_path 필수")

    return str(wav_path_raw), str(video_path)


class _RenderHandler(BaseHTTPRequestHandler):
    """fifth 렌더 HTTP 핸들러."""

    def log_message(self, fmt, *args):  # stdlib 로그 → logger로 리다이렉트
        logger.info(fmt, *args)

    def _send_json(self, code: int, obj: dict):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._send_json(200, {"status": "ok"})
        else:
            self._send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/render":
            self._send_json(404, {"error": "not found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else b""

        try:
            wav_path, video_path = _parse_render_body(body)
        except (ValueError, KeyError, json.JSONDecodeError) as exc:
            self._send_json(400, {"error": str(exc)})
            return

        # wav_path 존재 검사 — 200 헤더 전송 전에 차단.
        # 공유 볼륨 마운트 누락 또는 경로 오류를 조기 발견한다.
        if not os.path.exists(wav_path):
            logger.warning("wav_path 미존재: %s", wav_path)
            self._send_json(400, {"error": f"wav_path 미존재: {wav_path}"})
            return

        if _service is None:
            self._send_json(503, {"error": "RenderService 미초기화"})
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/octet-stream")
        self.send_header("Connection", "close")
        self.end_headers()

        # 종료마커는 finally에서 정확히 1회 — 정상/예외 모든 경로 보장.
        # render()는 프레임 청크만 write하고 종료마커를 쓰지 않는다.
        try:
            _service.render(
                wav_path=wav_path,
                video_path=video_path,
                write=self.wfile.write,
            )
        except Exception as exc:
            logger.exception("render 오류: %s", exc)
        finally:
            try:
                self.wfile.write(struct.pack(">I", 0))
            except Exception:
                pass


def main():
    global _service

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [fifth_render_server] %(levelname)s %(message)s",
    )

    port = int(os.environ.get("FIFTH_RENDER_PORT", "8810"))
    cache_root = os.environ.get("FIFTH_CACHE_ROOT", "/tmp/fifth_cache")
    video_path_default = os.environ.get("FIFTH_VIDEO_PATH", "")

    logger.info("fifth 렌더 서버 startup (port=%d)", port)

    # GPU 객체 지연 import (컨테이너에서만 사용 가능)
    try:
        from flp_engine import FifthFLPEngine
        from config import FifthConfig
    except ImportError as exc:
        logger.error("flp_engine import 실패: %s", exc)
        raise

    cfg = FifthConfig.from_env()
    logger.info("FifthConfig: %s", cfg)

    cfg_yaml = os.environ.get("FIFTH_CFG_YAML", "configs/trt_infer.yaml")
    logger.info("FifthFLPEngine 로드 중... (cfg=%s)", cfg_yaml)
    eng = FifthFLPEngine(cfg_yaml)

    # detect_landmarks 가드
    if not hasattr(eng, "detect_landmarks"):
        raise AttributeError(
            "FifthFLPEngine.detect_landmarks 미구현 — Task5에서 보강 필요"
        )

    logger.info("JoyVASA 로드 중...")
    try:
        from omegaconf import OmegaConf
        from src.pipelines.joyvasa_audio_to_motion_pipeline import JoyVASAAudio2MotionPipeline
    except ImportError as exc:
        logger.error("JoyVASAAudio2MotionPipeline import 실패: %s", exc)
        raise
    jcfg = OmegaConf.load(cfg_yaml)
    _cfg_scale = float(os.environ.get("FIFTH_CFG_SCALE", "2.0"))
    jp = JoyVASAAudio2MotionPipeline(
        motion_model_path=jcfg.joyvasa_models.motion_model_path,
        audio_model_path=jcfg.joyvasa_models.audio_model_path,
        motion_template_path=jcfg.joyvasa_models.motion_template_path,
        cfg_mode=jcfg.infer_params.cfg_mode,
        cfg_scale=_cfg_scale,
    )
    logger.info("JoyVASA 로드 완료 (cfg_scale=%.1f)", _cfg_scale)

    detect_lmk = eng.detect_landmarks

    _service = RenderService(
        engine=eng,
        jp=jp,
        cfg=cfg,
        cache_root=cache_root,
        detect_lmk=detect_lmk,
    )

    server = HTTPServer(("0.0.0.0", port), _RenderHandler)
    logger.info("fifth 렌더 서버 기동: http://0.0.0.0:%d", port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("fifth 렌더 서버 종료")


if __name__ == "__main__":
    main()
