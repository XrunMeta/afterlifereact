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
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Callable, Iterator, Optional

import numpy as np

from render_mode import is_batch

try:
    import cv2
except ModuleNotFoundError:
    cv2 = None  # type: ignore[assignment]  # 테스트 환경 — mock으로 주입

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# S4: 토큰 트레일러 프로토콜
# ---------------------------------------------------------------------------

# 매직 프리픽스 — jpeg SOI(0xFF 0xD8)와 겹치지 않아 청크 타입 구분 가능.
_TOK_MAGIC = b"TOK:"

def encode_token_trailer(tok) -> bytes:
    """끝 위상 토큰 → [4B big-endian length][b'TOK:' + json_bytes] 트레일러 청크.

    클라이언트는 청크 페이로드가 _TOK_MAGIC으로 시작하면 jpeg 프레임이 아닌
    토큰 트레일러로 간주한다. 종료마커(length=0)는 별도 do_POST finally 에서 씀.

    phase_token=None(미전달) 시에는 이 함수를 호출하지 않으므로 회귀 안전.
    """
    payload = _TOK_MAGIC + json.dumps(tok.to_dict()).encode()
    return struct.pack(">I", len(payload)) + payload


def decode_token_trailer_data(chunk_data: bytes) -> Optional[object]:
    """청크 데이터부(4B 길이 헤더 제외) → PhaseToken. 매직 없거나 JSON 깨지면 None.

    Args:
        chunk_data: [4B len] 이후의 페이로드 bytes.
    Returns:
        PhaseToken 또는 None(매직 불일치 / JSON 파싱 실패).

    BLOCKER 1 수정: JSON 이 깨진 경우 crash 대신 None 반환.
    parse_render_response / compare 스크립트가 None 을 안전 처리(end_tok=None).
    """
    if not chunk_data or not chunk_data.startswith(_TOK_MAGIC):
        return None
    try:
        from phase_token import PhaseToken
        json_bytes = chunk_data[len(_TOK_MAGIC):]
        return PhaseToken.from_dict(json.loads(json_bytes.decode()))
    except Exception:
        # JSON 깨짐 / PhaseToken 역직렬화 실패 — 안전하게 None 반환.
        # 호출부(parse_render_response 등)가 None → end_tok 없음으로 처리.
        logger.warning("decode_token_trailer_data: 파싱 실패, None 반환")
        return None


def parse_render_response(data: bytes) -> tuple[list[bytes], Optional[object]]:
    """렌더 응답 raw bytes → (jpeg_payloads, end_tok|None).

    청크 스트림 파싱:
      [4B len][payload] 반복 + [4B 0] 종료마커
      payload.startswith(_TOK_MAGIC) → 토큰 트레일러 → end_tok 추출
      else → jpeg 프레임 페이로드 목록에 추가

    compare 스크립트 / 단위 테스트에서 렌더 응답을 검증할 때 사용.
    prethird fifth_inproc(통화 경로)는 별도 대상 — 이번 S4 비목표.
    """
    frames: list[bytes] = []
    end_tok = None
    pos = 0
    while pos + 4 <= len(data):
        n = struct.unpack_from(">I", data, pos)[0]
        pos += 4
        if n == 0:
            break
        payload = data[pos:pos + n]
        pos += n
        if payload.startswith(_TOK_MAGIC):
            end_tok = decode_token_trailer_data(payload)
        else:
            frames.append(payload)
    return frames, end_tok


# ---------------------------------------------------------------------------
# Step 1~4: encode_frame_chunk / write_frames_to_stream (순수, TDD)
# ---------------------------------------------------------------------------


def encode_frame_chunk(
    frame_rgb: np.ndarray,
    quality: int = 90,
    _timing_out: list | None = None,
) -> bytes:
    """RGB 프레임 → [4B 길이][jpeg] 청크. (cv2 는 BGR 인코딩이라 변환)

    Args:
        _timing_out: FIFTH_RENDER_TIMING ON 시 encode 소요 ms를 append할 list.
                     None(기본) 이면 계측 없음(회귀안전).
    """
    if cv2 is None:
        raise RuntimeError("cv2 미설치 — 렌더서버는 컨테이너에서 실행")
    bgr = frame_rgb[:, :, ::-1]
    if _timing_out is not None:
        _t0 = time.perf_counter()
    ok, enc = cv2.imencode(".jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if _timing_out is not None:
        _timing_out.append((time.perf_counter() - _t0) * 1000)
    if not ok:
        raise RuntimeError("jpeg 인코딩 실패")
    data = enc.tobytes()
    return struct.pack(">I", len(data)) + data


def _idle_kwargs(idle_opts: dict | None) -> dict:
    """render_opts(dict|None) → stream_wav_frames에 전달할 idle_* kwargs.

    None 값(키 없음/명시 None)은 제외해 stream_wav_frames가 env 기본을
    사용하게 한다(회귀 0). idle_opts 자체가 None/빈 dict면 빈 dict 반환.
    """
    if not idle_opts:
        return {}
    keys = ("idle_motion_scale", "idle_rms_low", "idle_rms_high", "head_slew_frames")
    return {k: idle_opts[k] for k in keys if idle_opts.get(k) is not None}


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


_IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")


def _is_image_path(path: str) -> bool:
    return Path(path).suffix.lower() in _IMAGE_EXTS


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

    타이밍 계측 (FIFTH_RENDER_TIMING=1 시 활성):
      ① 렌더 구간: stream_wav_frames 내 프레임 1개 생성 소요 ms (render_ms_list)
      ② jpeg 인코딩 구간: encode_frame_chunk 내 cv2.imencode 소요 ms (encode_ms_list)
      스트림(문장) 종료 시 1줄 로그:
        [render-timing] frames=N render_avg_ms=X.X encode_avg_ms=X.X
      OFF 시 perf_counter 호출 포함 계측 코드 전혀 실행되지 않음 (회귀안전).
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

        # 타이밍 계측 토글: FIFTH_RENDER_TIMING=1 또는 true (대소문자 무시, 기본 OFF=회귀안전)
        self._render_timing = os.environ.get("FIFTH_RENDER_TIMING", "").lower() not in ("", "0", "false")

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

            # source 선택: 경로가 이미지면 사진 직접(추출·crop 없음), 영상이면 프레임 추출
            if self._load_or_extract_fn is not None:
                selection = self._load_or_extract_fn(video_path)
            elif _is_image_path(video_path):
                from face_source import load_image_source
                clone_key = _clone_key(video_path)
                selection = load_image_source(
                    video_path, self.cache_root, clone_key,
                    detect_lmk_fn=self.detect_lmk,
                )
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
        phase_token=None,
        jpeg_quality: int = 90,
        idle_opts: dict | None = None,
    ) -> int:
        """wav → 프레임 청크 write. 반환: 프레임 수.

        write는 bytes → None 콜백 (wfile.write 또는 BytesIO.write).
        종료마커(length=0)는 호출자(do_POST finally)가 정확히 1회 씀.
        render()는 프레임 청크 [+ S4 토큰 트레일러]만 write하고 종료마커는 쓰지 않는다.

        S4 토큰 트레일러:
          phase_token 전달 시 → 프레임 청크 마지막에 [4B len][TOK:+json] 트레일러를 씀.
          phase_token=None(기본) → 트레일러 없음 = 레거시 동작 100% 동일(회귀 안전).

        T-109 lab-tuner per-request 파라미터(additive, 회귀 0):
          jpeg_quality=90(기본) → encode_frame_chunk(quality=) 그대로 전달.
          idle_opts=None(기본) → _idle_kwargs가 {} 반환 → stream_wav_frames에
          idle_* 인자 미전달 → fifth_render.py가 env 기본값 사용(기존 동작 100% 동일).

        FIFTH_RENDER_TIMING=1 시 4구간 중 서버측 2구간 계측:
          ① render_ms:  on_frame 호출 간격 = 순수 GPU 프레임 생성 시간.
                        on_frame 진입 시각을 "GPU 완료 시각"으로 보고,
                        [이전 on_frame 진입 시각 ~ 현재 on_frame 진입 시각] 간격을 측정.
                        최초 프레임은 기준 없으므로 스킵 → measured = frames - 1.
                        (encode/write 시간은 GPU 추론과 겹치지 않으므로 포함되지 않음:
                         stream_wav_frames 루프는 on_frame 완료 후 다음 프레임 GPU 추론 시작)
          ② encode_ms:  encode_frame_chunk 내 cv2.imencode 소요 ms (순수 CPU 인코딩).
          → 스트림 종료 시 "[render-timing] frames=N measured=M render_avg_ms=X encode_avg_ms=X" 1줄.
            measured = render_ms를 평균 낸 실제 프레임 수(= frames - 1, 최초 스킵).
            encode/decode 구간은 전체 frames 기준.
          OFF 시 perf_counter 포함 계측 코드 전혀 실행 안 됨.

        T-111 FIFTH_RENDER_MODE batch/partial 토글 (회귀 0):
          partial(기본) → write는 그대로 즉시 전달(현행 스트리밍, byte-identical).
          batch → 내부 _write가 write() 호출을 그대로 순서대로 리스트에 버퍼링만 하고,
          render() 종료 직전(반환 전) 버퍼를 순서대로 실제 write에 flush한다.
          와이어 프레이밍([4B len][jpeg]... 및 S4 토큰 트레일러)은 청크 내용/순서가
          동일하므로 변경 없음 — 종료마커([4B 0])는 여전히 do_POST finally에서
          render() 반환 후 1회 쓰여, batch에서도 프레임(+트레일러) 다음에 위치한다.
        """
        sources = self._get_sources(video_path)
        # idle_opts=None(기본) → {} → stream_wav_frames 인자 미전달(env 기본, 회귀 0).
        _idle = _idle_kwargs(idle_opts)

        _batch = is_batch()
        _buffer: list[bytes] = []

        def _write(chunk: bytes) -> None:
            if _batch:
                _buffer.append(chunk)
            else:
                write(chunk)

        count = 0
        # _get_sources 의 slow path가 이미 _lock을 취득 후 반환했으므로,
        # 여기서는 캐시 hit이 보장된 상태. GPU 렌더 직렬화를 위해 _lock 재취득.
        with self._lock:
            end_tok = None

            if self._render_timing:
                # 계측 활성: render/encode 각각 프레임당 ms 누적
                render_ms_list: list[float] = []
                encode_ms_list: list[float] = []

                # ① render 구간 측정법 (방향 A):
                #   on_frame 진입 시각 = "GPU가 이 프레임을 완성한 시각".
                #   현재 진입 시각 − 직전 진입 시각 = GPU가 직전→현재 프레임을 생성한 시간.
                #   encode/write는 on_frame 내부에서 진행되고, stream_wav_frames 루프는
                #   on_frame 반환 후 다음 GPU 추론을 시작하므로, render_ms에 encode/write가
                #   포함되지 않는다. 따라서 render_avg − encode_avg = 순수 GPU 시간이 성립함.
                #   최초 프레임: _render_t_last[0] == 0.0 → 스킵(_first_frame 가드).
                _render_t_last: list[float] = [0.0]
                _first_frame: list[bool] = [True]

                def _on_frame_render_timed(f: np.ndarray) -> None:
                    # on_frame 진입 즉시 시각 기록 (GPU 완료 시각)
                    _now = time.perf_counter()
                    if not _first_frame[0]:
                        render_ms_list.append((_now - _render_t_last[0]) * 1000)
                    _first_frame[0] = False
                    _render_t_last[0] = _now  # encode/write 전에 갱신 (겹침 방지)
                    chunk = encode_frame_chunk(f, quality=jpeg_quality, _timing_out=encode_ms_list)
                    _write(chunk)

                if self._stream_wav_fn is not None:
                    count, end_tok = self._stream_wav_fn(
                        self.engine, self.jp, self.cfg, sources, wav_path,
                        _on_frame_render_timed,
                        blink_enabled,
                        phase_token,
                        **_idle,
                    )
                else:
                    from fifth_render import stream_wav_frames
                    count, end_tok = stream_wav_frames(
                        self.engine, self.jp, self.cfg, sources, wav_path,
                        on_frame=_on_frame_render_timed,
                        blink_enabled=blink_enabled,
                        phase_token=phase_token,
                        **_idle,
                    )

                # 스트림 종료 후 1줄 요약 로그 (프레임마다 로그 금지)
                n_render = len(render_ms_list)   # = count - 1 (최초 스킵)
                n_encode = len(encode_ms_list)   # = count (전체)
                render_avg = (sum(render_ms_list) / n_render) if n_render > 0 else 0.0
                encode_avg = (sum(encode_ms_list) / n_encode) if n_encode > 0 else 0.0
                logger.info(
                    "[render-timing] frames=%d measured=%d render_avg_ms=%.2f encode_avg_ms=%.2f",
                    count, n_render, render_avg, encode_avg,
                )
            else:
                # 계측 OFF: 기존 동작 완전 동일 (perf_counter 호출 0)
                if self._stream_wav_fn is not None:
                    count, end_tok = self._stream_wav_fn(
                        self.engine, self.jp, self.cfg, sources, wav_path,
                        lambda f: _write(encode_frame_chunk(f, quality=jpeg_quality)),
                        blink_enabled,
                        phase_token,
                        **_idle,
                    )
                else:
                    from fifth_render import stream_wav_frames
                    count, end_tok = stream_wav_frames(
                        self.engine, self.jp, self.cfg, sources, wav_path,
                        on_frame=lambda f: _write(encode_frame_chunk(f, quality=jpeg_quality)),
                        blink_enabled=blink_enabled,
                        phase_token=phase_token,
                        **_idle,
                    )

            # S4 토큰 트레일러: phase_token 전달 시에만 씀(회귀 안전).
            # do_POST finally 의 종료마커([4B 0]) 전에 위치.
            if phase_token is not None and end_tok is not None:
                _write(encode_token_trailer(end_tok))

            # T-111 batch flush: 프레임(+트레일러) 전체 생성 완료 후 순서 보존 일괄 write.
            # partial(기본)은 _buffer가 비어있어(항상 즉시 write) 아래 루프가 무동작.
            if _batch:
                for _chunk in _buffer:
                    write(_chunk)

        return count


# ---------------------------------------------------------------------------
# Step 6: HTTP 라우팅 (stdlib http.server)
# ---------------------------------------------------------------------------

_service: RenderService | None = None


def _validate_int_not_bool(val: object, name: str) -> None:
    """val 이 bool 아닌 int 인지 검증. 그외 → TypeError.

    Python에서 isinstance(True, int)==True 이므로 단순 int 검사로는 bool 유입을
    걸러내지 못한다. bool 서브클래스를 명시 차단한다.

    Args:
        val: 검증 대상 값.
        name: 에러 메시지에 표기할 필드명.

    Raises:
        TypeError: val 이 bool 이거나 int 가 아닌 경우.
    """
    if not isinstance(val, int) or isinstance(val, bool):
        raise TypeError(
            f"phase_token.{name} 은 int(bool 제외) 여야 함, got {type(val).__name__!r}"
        )


def _validate_phase_tok_fields(tok) -> None:
    """PhaseToken 필드 타입 전수 검증. 불량 시 TypeError.

    PhaseToken dataclass 는 타입을 강제하지 않으므로 from_dict 후 반드시 호출.

    검증 규칙:
      frame_offset : int, bool 제외
      blink_phase  : int, bool 제외
      first_frame  : bool (int 1/0 차단)
      head_last    : list 또는 None
    """
    _validate_int_not_bool(tok.frame_offset, "frame_offset")
    _validate_int_not_bool(tok.blink_phase, "blink_phase")
    if not isinstance(tok.first_frame, bool):
        raise TypeError(
            f"phase_token.first_frame 은 bool 여야 함, got {type(tok.first_frame).__name__!r}"
        )
    if tok.head_last is not None and not isinstance(tok.head_last, list):
        raise TypeError(
            f"phase_token.head_last 는 list 또는 None 여야 함, got {type(tok.head_last).__name__!r}"
        )


def _parse_render_body(raw: bytes) -> tuple[str, str, Optional[object], dict]:
    """POST /oth-path body(JSON) → (wav_path, video_path, phase_token|None, render_opts).

    설계 v3(공유 볼륨): wav_path/video_path 모두 필수.
    호스트-컨테이너가 /home/afterlife/afterlife-server 를 공유 마운트하므로
    경로를 직접 전달하면 서버가 파일을 읽을 수 있다.

    S4: phase_token(dict|null|키없음) → PhaseToken 또는 None(레거시 회귀).

    T-109 lab-tuner: render_opts(dict) — per-request 렌더 파라미터(additive).
    blink/jpeg_quality는 명시 기본(True/90), idle_* 4종은 키 없으면 None
    (= stream_wav_frames가 env 기본 사용 → 회귀 0).

    Returns:
        (wav_path, video_path, phase_token|None, render_opts)

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

    # phase_token: 키 없음 또는 null → None(레거시), dict → PhaseToken
    # BLOCKER 2: 역직렬화 실패 또는 타입 불량 시 ValueError → do_POST 가 400 반환(500 방지).
    # PhaseToken dataclass 는 타입을 강제하지 않으므로 여기서 명시적으로 검증한다.
    phase_token_data = req.get("phase_token")
    phase_token = None
    if phase_token_data is not None:
        try:
            from phase_token import PhaseToken
            if not isinstance(phase_token_data, dict):
                raise TypeError(f"phase_token 은 dict 여야 함, got {type(phase_token_data).__name__}")
            tok = PhaseToken.from_dict(phase_token_data)
            _validate_phase_tok_fields(tok)
            phase_token = tok
        except Exception as exc:
            raise ValueError(f"phase_token 역직렬화 실패: {exc}") from exc

    # per-request 렌더 옵션 (lab-tuner). blink/jpeg_quality는 명시 기본,
    # idle_* 는 키 없으면 None → stream_wav_frames가 env 기본 사용(회귀 0).
    blink = req.get("blink")
    render_opts = {
        "blink": True if blink is None else bool(blink),
        "jpeg_quality": int(req.get("jpeg_quality", 90)),
        "idle_motion_scale": req.get("idle_motion_scale"),
        "idle_rms_low": req.get("idle_rms_low"),
        "idle_rms_high": req.get("idle_rms_high"),
        "head_slew_frames": req.get("head_slew_frames"),
    }

    return str(wav_path_raw), str(video_path), phase_token, render_opts


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
            wav_path, video_path, phase_token, render_opts = _parse_render_body(body)
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
        # render()는 프레임 청크 [+S4 토큰 트레일러]만 write하고 종료마커는 쓰지 않는다.
        try:
            _service.render(
                wav_path=wav_path,
                video_path=video_path,
                write=self.wfile.write,
                blink_enabled=render_opts["blink"],
                jpeg_quality=render_opts["jpeg_quality"],
                phase_token=phase_token,
                idle_opts=render_opts,   # idle_* 4종 전달(None이면 env)
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
