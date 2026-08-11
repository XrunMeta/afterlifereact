"""echomimic_inproc.py — prethird EchoMimicV3 HTTP 클라이언트 래퍼.

fifth_inproc.py 와 동일 계약 (musetalk_inproc.MuseTalkInproc 계약):
    load()   — health check
    infer(wav_path, on_frame, video_path) -> int (프레임 수)

렌더서버 (:8750) 에 POST /oth-path 요청, 응답으로 프레임 스트림을 파싱.
프로토콜: [4byte BE length][jpeg bytes] 반복, [4byte 0] 종료.

환경변수:
    ECHOMIMIC_RENDER_URL   — 렌더서버 URL (default: http://127.0.0.1:8750)
    ECHOMIMIC_STEPS        — num_inference_steps (default: 4)
    ECHOMIMIC_SIZE         — sample_size square (default: 512)
    ECHOMIMIC_SEED         — seed (default: 43)
    ECHOMIMIC_PROMPT       — text prompt (default: "A person is speaking.")

T-483: 감정 태그 → prompt 매핑. infer(emotion="happy") 호출 시 EMOTION_PROMPTS
lookup 해서 이 턴 한정 prompt 를 동적 조합해 렌더서버로 보낸다. 감정 미지정
또는 매핑 없음이면 self.prompt (env 기본값) 그대로.
"""
from __future__ import annotations

import http.client
import json
import logging
import os
import struct
import threading
import urllib.parse
from typing import Callable

logger = logging.getLogger(__name__)


# T-483: 5개 감정별 EchoMimicV3 prompt 매핑.
# 원본 EchoMimicV3 는 diffusion prompt 로 표정 조건화가 가능하나 실측 감도는
# 케이스에 따라 다르다 — 실기 통화로 반영도 확인 후 문구 튜닝 여지 있음.
# 미매핑 감정·None 은 EMOTION_PROMPT_DEFAULT 로 fallback.
EMOTION_PROMPTS: dict[str, str] = {
    "happy":    "A person is speaking with a bright smile, cheerful expression, warm eyes.",
    "sad":      "A person is speaking with a sad, melancholic expression, downturned mouth, soft eyes.",
    "angry":    "A person is speaking with an angry, frowning expression, furrowed brows, tense jaw.",
    "surprise": "A person is speaking with a surprised expression, wide eyes, raised eyebrows, open mouth.",
    "neutral":  "A person is speaking with a calm, neutral expression.",
}
EMOTION_PROMPT_DEFAULT = "A person is speaking."


def _read_exactly(read_fn: Callable[[int], bytes], n: int) -> bytes:
    buf = b""
    while len(buf) < n:
        chunk = read_fn(n - len(buf))
        if not chunk:
            break
        buf += chunk
    return buf


def parse_frame_stream(read_exactly: Callable[[int], bytes]):
    """fifth_inproc.parse_frame_stream 과 동일 파서."""
    while True:
        header = read_exactly(4)
        if len(header) < 4:
            if len(header) == 0:
                return
            raise EOFError(f"프레임 헤더 truncated: 기대 4바이트, 수신 {len(header)}바이트")
        (length,) = struct.unpack(">I", header)
        if length == 0:
            return
        payload = read_exactly(length)
        if len(payload) < length:
            raise ValueError(
                f"프레임 payload truncated: 기대 {length}바이트, 수신 {len(payload)}바이트"
            )
        yield payload


class EchoMimicInproc:
    """EchoMimicV3 render_server HTTP 클라이언트.

    MuseTalkInproc / FifthInproc 과 동일 계약. server.py 의 renderer 토글에서 사용.

    video_path 인자는 fifth 와의 계약 호환을 위해 유지하되, EchoMimic 은 정면 사진
    (jpg/png) 을 요구하므로 image_path 로 해석한다. video_path 가 mp4 이면 상위에서
    첫 프레임 추출 등 별도 처리가 필요 (초안에서는 그대로 전달, 렌더서버가 검증).
    """

    def __init__(
        self,
        video_path: str,
        clone_id: int | None = None,
        render_url: str | None = None,
    ) -> None:
        self.video_path = video_path  # 실제로는 이미지 경로 (정면 사진)
        self.clone_id = clone_id
        self.render_url = render_url or os.environ.get(
            "ECHOMIMIC_RENDER_URL", "http://127.0.0.1:8750"
        )
        self.num_inference_steps = int(os.environ.get("ECHOMIMIC_STEPS", "4"))
        self.sample_size = int(os.environ.get("ECHOMIMIC_SIZE", "512"))
        self.seed = int(os.environ.get("ECHOMIMIC_SEED", "43"))
        self.prompt = os.environ.get("ECHOMIMIC_PROMPT", "A person is speaking.")
        self._loaded = False
        self._infer_lock = threading.Lock()

    def _check_health(self) -> bool:
        parsed = urllib.parse.urlparse(self.render_url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 80
        try:
            conn = http.client.HTTPConnection(host, port, timeout=5)
            conn.request("GET", "/health")
            resp = conn.getresponse()
            if resp.status != 200:
                return False
            body = resp.read()
            try:
                data = json.loads(body)
                return bool(data.get("ok"))
            except Exception:
                return True
        except Exception:
            return False

    def _resolve_prompt(self, emotion: str | None) -> str:
        """T-483: 이 턴 감정 태그 → 렌더 prompt. 미매핑/None 은 self.prompt fallback."""
        if not emotion:
            return self.prompt
        return EMOTION_PROMPTS.get(str(emotion).strip().lower(), self.prompt)

    def _open_render_stream(
        self, wav_path: str, image_path: str, emotion: str | None = None,
    ) -> tuple[Callable[[int], bytes], http.client.HTTPConnection]:
        body = {
            "image_path": image_path,
            "audio_path": wav_path,
            "prompt": self._resolve_prompt(emotion),
            "num_inference_steps": self.num_inference_steps,
            "sample_size": self.sample_size,
            "seed": self.seed,
        }
        parsed = urllib.parse.urlparse(self.render_url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 80
        conn = http.client.HTTPConnection(host, port, timeout=300)  # 큰 wav 대응
        conn.request(
            "POST",
            "/render_frames",
            body=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
        )
        resp = conn.getresponse()
        if resp.status != 200:
            err_body = resp.read(256)
            conn.close()
            raise RuntimeError(
                f"echomimic 렌더서버 /render_frames 오류: HTTP {resp.status} — {err_body!r}"
            )
        raw_read = resp.read
        return lambda n: _read_exactly(raw_read, n), conn

    def _decode_jpeg(self, jpeg_bytes: bytes):
        import cv2  # type: ignore
        import numpy as np

        buf = np.frombuffer(jpeg_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError("cv2.imdecode 실패 — jpeg 손상 가능성")
        rgb = bgr[:, :, ::-1]
        return np.ascontiguousarray(rgb)

    def load(self) -> None:
        """렌더서버 health 확인. 실패 시 RuntimeError. 멱등."""
        if self._loaded:
            return
        if not self._check_health():
            raise RuntimeError(
                f"EchoMimicInproc.load() 실패 — 렌더서버 응답 없음: {self.render_url}/health"
            )
        self._loaded = True
        logger.info("EchoMimicInproc loaded (render_url=%s)", self.render_url)

    def infer(
        self,
        wav_path: str,
        on_frame: Callable,
        video_path: str | None = None,
        emotion: str | None = None,  # T-483: 감정 태그(happy/sad/angry/surprise/neutral)
        **_ignored,  # render_mode 등 fifth-only 파라미터 무시
    ) -> int:
        """wav → 프레임 생성마다 on_frame(rgb_ndarray) 호출. 반환: 프레임 수.

        Args:
            wav_path:   추론 wav 파일 경로 (렌더서버가 접근 가능한 공유 경로).
            on_frame:   RGB ndarray 콜백. AvatarVideoTrack.push_ndarray 호환.
            video_path: 이 호출에서만 사용할 정면 사진 경로. 생략 시 self.video_path.
            emotion:    T-483 이번 턴 감정 태그. EMOTION_PROMPTS 매핑으로 prompt 동적 선택.
                        None/미매핑 이면 self.prompt (env 기본) 그대로.
        """
        if not self._loaded:
            raise RuntimeError("EchoMimicInproc.load() 를 먼저 호출하세요.")
        img = video_path if video_path is not None else self.video_path
        with self._infer_lock:
            read_exactly, conn = self._open_render_stream(wav_path, img, emotion=emotion)
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
                    "EchoMimicInproc.infer: 프레임 0개 반환 — wav_path=%s image=%s. "
                    "렌더서버 silent 실패 가능성.",
                    wav_path,
                    img,
                )
            return count
