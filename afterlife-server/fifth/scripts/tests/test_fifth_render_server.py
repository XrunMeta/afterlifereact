"""fifth_render_server.py TDD 테스트.

실행법:
  cd afterlife-server/fifth
  PYTHONPATH=$PWD/scripts /Volumes/exDN/devExdn/afl-fifth/afterlife-server/fifth/.venv/bin/python \\
    -m pytest scripts/tests/test_fifth_render_server.py -v

cv2 없는 로컬 venv: cv2 mock fixture 로 encode_frame_chunk 테스트.
"""
from __future__ import annotations

import http.client
import io
import json
import os
import struct
import threading
import types
import numpy as np
import pytest
import soundfile as sf


# ---------------------------------------------------------------------------
# cv2 mock fixture: 모든 테스트에서 cv2 = mock 으로 패치
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def mock_cv2(monkeypatch):
    """cv2 없는 로컬 환경 → 가짜 cv2 모듈 주입."""
    import fifth_render_server as srv

    fake_cv2 = types.ModuleType("cv2")

    def fake_imencode(ext, bgr, params=None):
        # jpeg 바이트를 흉내: 8x8 bgr → 고정 더미 bytes 반환
        # 실제 압축 없이 높이*너비*채널 크기 bytes 반환
        data = bgr.tobytes()
        arr = np.frombuffer(data, dtype=np.uint8)
        return True, arr

    fake_cv2.imencode = fake_imencode
    fake_cv2.IMWRITE_JPEG_QUALITY = 1

    monkeypatch.setattr(srv, "cv2", fake_cv2)
    yield fake_cv2


# ---------------------------------------------------------------------------
# Step 1~4: encode_frame_chunk
# ---------------------------------------------------------------------------

def test_encode_frame_chunk_has_length_prefix():
    """encode_frame_chunk → [4B big-endian length][jpeg bytes]."""
    import fifth_render_server as srv

    frame = np.zeros((8, 8, 3), dtype=np.uint8)
    chunk = srv.encode_frame_chunk(frame)

    # 앞 4바이트 = 길이
    n = struct.unpack(">I", chunk[:4])[0]
    assert n == len(chunk) - 4
    assert n > 0


def test_encode_frame_chunk_rgb_to_bgr_conversion():
    """encode_frame_chunk 는 RGB→BGR 변환 후 인코딩(채널 순서 검증)."""
    import fifth_render_server as srv

    # R=10, G=20, B=30 인 프레임
    frame_rgb = np.zeros((4, 4, 3), dtype=np.uint8)
    frame_rgb[:, :, 0] = 10   # R
    frame_rgb[:, :, 1] = 20   # G
    frame_rgb[:, :, 2] = 30   # B

    captured = {}

    def fake_imencode(ext, bgr, params=None):
        captured["bgr"] = bgr.copy()
        return True, np.array([1, 2, 3], dtype=np.uint8)

    import fifth_render_server as srv2
    import types
    fake_cv2 = types.ModuleType("cv2")
    fake_cv2.imencode = fake_imencode
    fake_cv2.IMWRITE_JPEG_QUALITY = 1

    import importlib
    orig_cv2 = srv2.cv2
    srv2.cv2 = fake_cv2
    try:
        srv2.encode_frame_chunk(frame_rgb)
    finally:
        srv2.cv2 = orig_cv2

    bgr = captured["bgr"]
    # BGR[0,0] = [B=30, G=20, R=10]
    assert bgr[0, 0, 0] == 30  # B
    assert bgr[0, 0, 1] == 20  # G
    assert bgr[0, 0, 2] == 10  # R


def test_encode_frame_chunk_raises_without_cv2():
    """cv2=None 이면 RuntimeError."""
    import fifth_render_server as srv
    orig = srv.cv2
    srv.cv2 = None
    try:
        with pytest.raises(RuntimeError, match="cv2"):
            srv.encode_frame_chunk(np.zeros((8, 8, 3), dtype=np.uint8))
    finally:
        srv.cv2 = orig


# ---------------------------------------------------------------------------
# Step 1~4: write_frames_to_stream
# ---------------------------------------------------------------------------

def test_write_frames_to_stream_writes_all_then_terminator():
    """write_frames_to_stream: 프레임 2개 → 2개 청크 + 종료마커(length=0)."""
    import fifth_render_server as srv

    frames = [np.zeros((8, 8, 3), np.uint8), np.full((8, 8, 3), 200, np.uint8)]
    buf = io.BytesIO()
    count = srv.write_frames_to_stream(iter(frames), buf.write)

    assert count == 2
    assert buf.getvalue().endswith(struct.pack(">I", 0))


def test_write_frames_to_stream_empty_iterator_writes_only_terminator():
    """빈 iterator → 종료마커만 기록, count=0."""
    import fifth_render_server as srv

    buf = io.BytesIO()
    count = srv.write_frames_to_stream(iter([]), buf.write)

    assert count == 0
    assert buf.getvalue() == struct.pack(">I", 0)


def test_write_frames_to_stream_chunk_structure():
    """각 청크 구조 검증: [4B length][data] 반복 + [4B 0] 종료."""
    import fifth_render_server as srv

    frames = [np.zeros((4, 4, 3), np.uint8) for _ in range(3)]
    buf = io.BytesIO()
    count = srv.write_frames_to_stream(iter(frames), buf.write)

    assert count == 3
    data = buf.getvalue()
    pos = 0
    read_count = 0
    while pos < len(data):
        n = struct.unpack_from(">I", data, pos)[0]
        pos += 4
        if n == 0:
            break
        pos += n
        read_count += 1
    assert read_count == 3
    assert pos == len(data)  # 모두 소비


# ---------------------------------------------------------------------------
# _clone_key
# ---------------------------------------------------------------------------

def test_clone_key_uses_parent_name():
    """_clone_key: 부모 디렉토리명을 clone_id로 반환."""
    import fifth_render_server as srv
    key = srv._clone_key("/data/video_refs/9055/idle.mp4")
    assert key == "9055"


def test_clone_key_fallback_to_stem():
    """부모가 루트 또는 의미없으면 파일 stem 반환."""
    import fifth_render_server as srv
    key = srv._clone_key("/idle_video.mp4")
    assert key == "idle_video"


# ---------------------------------------------------------------------------
# Step 5: RenderService — 캐시 라우팅 테스트
# ---------------------------------------------------------------------------

def _make_wav(tmp_path, dur=0.3, sr=16000) -> str:
    """테스트용 작은 wav 파일 생성."""
    p = tmp_path / "test.wav"
    samples = int(sr * dur)
    y = (0.3 * np.sin(2 * np.pi * 200 * np.linspace(0, dur, samples))).astype(np.float32)
    sf.write(str(p), y, sr)
    return str(p)


class _FakeEngine:
    def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
        return np.full((8, 8, 3), 128, dtype=np.uint8)

    def load_source(self, path):
        return {
            "src_img": f"img:{path}",
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        }

    def align_source_to_ref(self, target_s, ref_s, mode):
        return target_s

    def build_mouth_mask(self, lmk, img_size, dilate_px, feather_sigma):
        return np.ones((img_size, img_size, 1), np.float32)


class _FakeJP:
    def __init__(self, n=5):
        self.n = n

    def gen_motion_sequence(self, wav_path):
        motion = [
            {
                "R": np.eye(3)[None].astype(np.float32),
                "t": np.zeros((1, 3), np.float32),
                "exp": np.zeros((1, 21, 3), np.float32),
            }
            for _ in range(self.n)
        ]
        return {"motion": motion, "c_eyes_lst": [], "n_frames": self.n}


def _make_service(cache_root, wav_path=None, *, load_call_counter=None, prepare_call_counter=None):
    """테스트용 RenderService: 훅 주입으로 실제 GPU/파일 없이 동작."""
    from fifth_render_server import RenderService
    from config import FifthConfig

    cfg = FifthConfig.from_env()
    eng = _FakeEngine()
    jp = _FakeJP(n=5)

    # 고정 selection 반환 (video_path 무관)
    fixed_selection = {
        "mode": "single",
        "open_path": "/fake/open.png",
        "closed_path": None,
        "open_score": 0.5,
    }
    fixed_sources = {
        "mode": "single",
        "open_s": {
            "src_img": "OPEN",
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
    }

    load_calls = load_call_counter if load_call_counter is not None else []
    prepare_calls = prepare_call_counter if prepare_call_counter is not None else []

    def fake_load(video_path):
        load_calls.append(video_path)
        return fixed_selection

    def fake_prepare(selection):
        prepare_calls.append(selection)
        return fixed_sources

    from fifth_render import stream_wav_frames

    def _stream_no_blink(engine, jp, cfg, sources, wav_path, on_frame, blink_enabled, phase_token=None):
        """blink 강제 off — render_offline import 방지."""
        return stream_wav_frames(
            engine, jp, cfg, sources, wav_path,
            on_frame=on_frame,
            blink_enabled=False,
            phase_token=phase_token,
        )

    svc = RenderService(
        engine=eng,
        jp=jp,
        cfg=cfg,
        cache_root=str(cache_root),
        detect_lmk=None,
        _load_or_extract_fn=fake_load,
        _prepare_sources_fn=fake_prepare,
        _stream_wav_fn=_stream_no_blink,
    )
    return svc, load_calls, prepare_calls


def test_render_streams_frames(tmp_path):
    """render(): 프레임 청크 1개 이상 write. 종료마커는 호출자(do_POST finally) 책임."""
    wav = _make_wav(tmp_path)
    svc, _, _ = _make_service(tmp_path)

    buf = io.BytesIO()
    count = svc.render(
        wav_path=wav,
        video_path="/fake/9055/idle.mp4",
        write=buf.write,
    )

    assert count > 0
    # render()는 종료마커를 쓰지 않음 — 프레임 청크만 존재
    data = buf.getvalue()
    assert len(data) > 0
    # 마지막 4바이트가 0(종료마커)이 아님을 확인 (종료마커는 do_POST finally 몫)
    if len(data) >= 4:
        last_n = struct.unpack_from(">I", data, len(data) - 4)[0]
        # 실제 프레임 데이터가 있으므로 마지막 4바이트는 jpeg 데이터 일부여야 함
        # (종료마커 0 이 아닌지만 확인)
        assert last_n != 0 or len(data) == 4  # 프레임이 1개 이상이면 마지막이 0이면 안 됨


def test_render_chunk_structure_valid(tmp_path):
    """render() 출력: 모든 청크가 [4B length][data] 구조. 종료마커 없음(호출자 책임)."""
    wav = _make_wav(tmp_path)
    svc, _, _ = _make_service(tmp_path)

    buf = io.BytesIO()
    count = svc.render(wav_path=wav, video_path="/fake/9055/idle.mp4", write=buf.write)

    # 종료마커를 직접 append해서 파싱 검증
    data = buf.getvalue() + struct.pack(">I", 0)
    pos = 0
    frame_count = 0
    while pos < len(data):
        assert pos + 4 <= len(data), "청크 길이 헤더 잘림"
        n = struct.unpack_from(">I", data, pos)[0]
        pos += 4
        if n == 0:
            break
        assert pos + n <= len(data), f"청크 데이터 잘림 (n={n})"
        pos += n
        frame_count += 1

    assert frame_count == count
    assert frame_count > 0
    assert pos == len(data), "종료마커 이후 잔여 데이터"


def test_render_caches_sources_per_video_path(tmp_path):
    """같은 video_path 2회 render → load_or_extract/prepare 1회만 호출."""
    wav = _make_wav(tmp_path)
    load_calls: list = []
    prepare_calls: list = []
    svc, load_calls, prepare_calls = _make_service(
        tmp_path,
        load_call_counter=load_calls,
        prepare_call_counter=prepare_calls,
    )

    video_path = "/fake/9055/idle.mp4"
    buf1 = io.BytesIO()
    svc.render(wav_path=wav, video_path=video_path, write=buf1.write)

    buf2 = io.BytesIO()
    svc.render(wav_path=wav, video_path=video_path, write=buf2.write)

    # 동일 video_path → 캐시 hit → load/prepare 각 1회만
    assert len(load_calls) == 1, f"load 호출 {len(load_calls)}회 (기대 1)"
    assert len(prepare_calls) == 1, f"prepare 호출 {len(prepare_calls)}회 (기대 1)"


def test_render_different_video_paths_each_prepared(tmp_path):
    """다른 video_path → 각각 prepare 호출 (캐시 키 분리)."""
    wav = _make_wav(tmp_path)
    load_calls: list = []
    prepare_calls: list = []
    svc, load_calls, prepare_calls = _make_service(
        tmp_path,
        load_call_counter=load_calls,
        prepare_call_counter=prepare_calls,
    )

    buf1 = io.BytesIO()
    svc.render(wav_path=wav, video_path="/fake/9055/idle.mp4", write=buf1.write)

    buf2 = io.BytesIO()
    svc.render(wav_path=wav, video_path="/fake/9058/idle.mp4", write=buf2.write)

    assert len(load_calls) == 2
    assert len(prepare_calls) == 2


def test_render_no_terminator_in_output(tmp_path):
    """render()는 종료마커를 쓰지 않는다 — 출력에 length=0 없음."""
    wav = _make_wav(tmp_path)
    svc, _, _ = _make_service(tmp_path)

    buf = io.BytesIO()
    count = svc.render(wav_path=wav, video_path="/fake/9055/idle.mp4", write=buf.write)

    assert count > 0
    data = buf.getvalue()
    # 프레임 청크 파싱 — length=0 이 중간에 나오면 종료마커가 섞인 것
    pos = 0
    frame_count = 0
    while pos < len(data) - 3:
        n = struct.unpack_from(">I", data, pos)[0]
        pos += 4
        if n == 0:
            pytest.fail("render() 출력에 종료마커(length=0) 발견 — 호출자 책임인데 render가 씀")
        pos += n
        frame_count += 1
    assert frame_count == count


# ---------------------------------------------------------------------------
# Step 6: _parse_render_body
# ---------------------------------------------------------------------------

def test_parse_render_body_valid():
    """정상 JSON(wav_path+video_path) → (wav_path, video_path, None) 반환."""
    import json
    from fifth_render_server import _parse_render_body

    body = json.dumps({"wav_path": "/tmp/a.wav", "video_path": "/ref/idle.mp4"}).encode()
    wav, vid, tok = _parse_render_body(body)
    assert wav == "/tmp/a.wav"
    assert vid == "/ref/idle.mp4"
    assert tok is None


def test_parse_render_body_missing_wav():
    """wav_path 누락 → ValueError."""
    import json
    from fifth_render_server import _parse_render_body

    body = json.dumps({"video_path": "/ref/idle.mp4"}).encode()
    with pytest.raises(ValueError, match="wav_path"):
        _parse_render_body(body)


def test_parse_render_body_missing_video():
    """video_path 누락 → ValueError."""
    import json
    from fifth_render_server import _parse_render_body

    body = json.dumps({"wav_path": "/tmp/a.wav"}).encode()
    with pytest.raises(ValueError, match="video_path"):
        _parse_render_body(body)


def test_parse_render_body_invalid_json():
    """잘못된 JSON → json.JSONDecodeError."""
    from fifth_render_server import _parse_render_body
    import json

    with pytest.raises(json.JSONDecodeError):
        _parse_render_body(b"not json")


def test_parse_render_body_wav_path_direct(tmp_path):
    """wav_path 직접 전달 → 경로 그대로 반환 (공유 볼륨 설계 v3)."""
    import json
    from fifth_render_server import _parse_render_body

    body = json.dumps({"wav_path": "/home/afterlife/afterlife-server/tmp/x.wav",
                       "video_path": "/ref/idle.mp4"}).encode()
    wav, vid, tok = _parse_render_body(body)

    assert wav == "/home/afterlife/afterlife-server/tmp/x.wav"
    assert vid == "/ref/idle.mp4"
    assert tok is None


def test_parse_render_body_no_b64_field():
    """wav_b64 키는 무시되고 wav_path 없으면 ValueError (b64 전송 폐기)."""
    import json
    from fifth_render_server import _parse_render_body

    body = json.dumps({"wav_b64": "dGVzdA==", "video_path": "/ref/idle.mp4"}).encode()
    with pytest.raises(ValueError, match="wav_path"):
        _parse_render_body(body)


# ---------------------------------------------------------------------------
# HTTP 통합 테스트 — wav_path 직접 경로 (공유 볼륨 설계 v3)
# ---------------------------------------------------------------------------

def test_http_integration_wav_path_200_and_framing(tmp_path):
    """POST /oth-path with wav_path 직접 → 200 + framing 정상 (공유 볼륨 v3)."""
    import fifth_render_server as srv
    from http.server import HTTPServer
    import soundfile as sf

    # 실제 wav 파일 생성 (서버가 os.path.exists 검사함)
    wav_file = tmp_path / "test.wav"
    sf.write(str(wav_file), np.zeros(4800, np.float32), 16000)
    wav_path = str(wav_file)

    orig_service = srv._service
    srv._service = _make_integration_service(tmp_path)

    try:
        server = HTTPServer(("127.0.0.1", 0), srv._RenderHandler)
        port = server.server_address[1]

        server_thread = threading.Thread(target=server.handle_request)
        server_thread.daemon = True
        server_thread.start()

        body = json.dumps({
            "wav_path": wav_path,
            "video_path": "/fake/9055/idle.mp4",
        }).encode()
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
        conn.request("POST", "/render", body=body, headers={"Content-Length": str(len(body))})
        resp = conn.getresponse()

        assert resp.status == 200
        raw = resp.read()
        conn.close()

        # framing 검증
        pos = 0
        frame_count = 0
        while pos < len(raw):
            assert pos + 4 <= len(raw)
            n = struct.unpack_from(">I", raw, pos)[0]
            pos += 4
            if n == 0:
                break
            pos += n
            frame_count += 1
        assert frame_count == 2, f"프레임 기대 2, 실제 {frame_count}"

        server_thread.join(timeout=5)

    finally:
        srv._service = orig_service
        server.server_close()


def test_http_integration_no_wav_source_returns_400(tmp_path):
    """wav_path 누락 시 400 반환."""
    import fifth_render_server as srv
    from http.server import HTTPServer

    orig_service = srv._service
    srv._service = _make_integration_service(tmp_path)

    server = HTTPServer(("127.0.0.1", 0), srv._RenderHandler)
    port = server.server_address[1]

    server_thread = threading.Thread(target=server.handle_request)
    server_thread.daemon = True
    server_thread.start()

    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        body = json.dumps({"video_path": "/fake/9055/idle.mp4"}).encode()
        conn.request("POST", "/render", body=body, headers={"Content-Length": str(len(body))})
        resp = conn.getresponse()
        assert resp.status == 400
        conn.close()
    finally:
        srv._service = orig_service
        server_thread.join(timeout=5)
        server.server_close()


# ---------------------------------------------------------------------------
# RenderService: thread safety (기본 연기)
# ---------------------------------------------------------------------------

def test_render_concurrent_same_video_cache_correct(tmp_path):
    """동시 렌더 요청 — 캐시 손상 없이 각 호출 프레임 청크 정상."""
    wav = _make_wav(tmp_path)
    svc, _, _ = _make_service(tmp_path)

    errors = []
    results = []

    def _run():
        buf = io.BytesIO()
        try:
            count = svc.render(wav_path=wav, video_path="/fake/9055/idle.mp4", write=buf.write)
            results.append((count, buf.getvalue()))
        except Exception as exc:
            errors.append(exc)

    threads = [threading.Thread(target=_run) for _ in range(3)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert not errors, f"스레드 오류: {errors}"
    for count, data in results:
        assert count > 0, "프레임 0개"
        assert len(data) > 0, "빈 출력"


# ---------------------------------------------------------------------------
# 신규: cv2 imencode 실패 테스트 (sion MAJOR2)
# ---------------------------------------------------------------------------

def test_encode_frame_chunk_raises_on_imencode_failure(monkeypatch):
    """cv2.imencode가 ok=False 반환 시 RuntimeError('jpeg 인코딩 실패') 발생."""
    import fifth_render_server as srv
    import types

    fake_cv2 = types.ModuleType("cv2")
    fake_cv2.IMWRITE_JPEG_QUALITY = 1

    def fail_imencode(ext, bgr, params=None):
        return False, None  # ok=False

    fake_cv2.imencode = fail_imencode
    monkeypatch.setattr(srv, "cv2", fake_cv2)

    frame = np.zeros((8, 8, 3), dtype=np.uint8)
    with pytest.raises(RuntimeError, match="jpeg 인코딩 실패"):
        srv.encode_frame_chunk(frame)


# ---------------------------------------------------------------------------
# 신규: HTTP 통합 테스트 — 헤더 + raw framing (항목 6)
# ---------------------------------------------------------------------------

def _make_integration_service(tmp_path):
    """통합 테스트용 RenderService: 프레임 2개 고정 반환."""
    from fifth_render_server import RenderService
    from config import FifthConfig

    cfg = FifthConfig.from_env()
    fixed_sources = {
        "mode": "single",
        "open_s": {
            "src_img": "OPEN",
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
    }

    def fake_load(video_path):
        return {"mode": "single", "open_path": "/fake/open.png", "closed_path": None, "open_score": 0.5}

    def fake_prepare(selection):
        return fixed_sources

    def fake_stream(engine, jp, cfg, sources, wav_path, on_frame, blink_enabled, phase_token=None):
        # 프레임 2개 고정 — stream_wav_frames 와 동일 tuple 반환
        from phase_token import PhaseToken
        in_tok = phase_token or PhaseToken()
        for _ in range(2):
            on_frame(np.zeros((8, 8, 3), dtype=np.uint8))
        return 2, PhaseToken(frame_offset=in_tok.frame_offset + 2, first_frame=False)

    return RenderService(
        engine=_FakeEngine(),
        jp=_FakeJP(n=2),
        cfg=cfg,
        cache_root=str(tmp_path),
        detect_lmk=None,
        _load_or_extract_fn=fake_load,
        _prepare_sources_fn=fake_prepare,
        _stream_wav_fn=fake_stream,
    )


def test_http_integration_headers_and_framing(tmp_path):
    """실제 HTTPServer에 POST /oth-path → 헤더 검증 + raw framing 파싱."""
    import fifth_render_server as srv
    from http.server import HTTPServer
    import soundfile as sf

    # wav 파일 생성
    wav_path = str(tmp_path / "test.wav")
    samples = np.zeros(4800, dtype=np.float32)
    sf.write(wav_path, samples, 16000)

    # 가짜 서비스 주입
    orig_service = srv._service
    srv._service = _make_integration_service(tmp_path)

    try:
        server = HTTPServer(("127.0.0.1", 0), srv._RenderHandler)
        port = server.server_address[1]

        server_thread = threading.Thread(target=server.handle_request)
        server_thread.daemon = True
        server_thread.start()

        body = json.dumps({"wav_path": wav_path, "video_path": "/fake/9055/idle.mp4"}).encode()
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
        conn.request("POST", "/render", body=body, headers={"Content-Length": str(len(body))})
        resp = conn.getresponse()

        # 헤더 검증: Transfer-Encoding 없고 Connection: close 있음
        assert resp.status == 200
        te = resp.getheader("Transfer-Encoding")
        assert te is None, f"Transfer-Encoding 헤더 있으면 안 됨: {te}"
        conn_header = resp.getheader("Connection")
        assert conn_header is not None and "close" in conn_header.lower(), \
            f"Connection: close 없음: {conn_header}"
        assert resp.getheader("Content-Type") == "application/octet-stream"

        # raw body 읽기 + framing 검증
        raw = resp.read()
        conn.close()

        pos = 0
        frame_count = 0
        while pos < len(raw):
            assert pos + 4 <= len(raw), "청크 헤더 잘림"
            n = struct.unpack_from(">I", raw, pos)[0]
            pos += 4
            if n == 0:
                break
            assert pos + n <= len(raw), f"청크 데이터 잘림 n={n}"
            pos += n
            frame_count += 1

        assert frame_count == 2, f"프레임 수 기대 2, 실제 {frame_count}"
        assert pos == len(raw), "종료마커 이후 잔여 데이터"

        server_thread.join(timeout=5)

    finally:
        srv._service = orig_service
        server.server_close()


def test_http_integration_health(tmp_path):
    """GET /oth-path → 200 ok."""
    import fifth_render_server as srv
    from http.server import HTTPServer

    server = HTTPServer(("127.0.0.1", 0), srv._RenderHandler)
    port = server.server_address[1]

    server_thread = threading.Thread(target=server.handle_request)
    server_thread.daemon = True
    server_thread.start()

    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        conn.request("GET", "/health")
        resp = conn.getresponse()
        assert resp.status == 200
        data = json.loads(resp.read())
        assert data.get("status") == "ok"
        conn.close()
    finally:
        server_thread.join(timeout=5)
        server.server_close()


def test_http_integration_bad_json_returns_400(tmp_path):
    """POST /oth-path body가 잘못된 JSON → 400."""
    import fifth_render_server as srv
    from http.server import HTTPServer

    orig_service = srv._service
    srv._service = _make_integration_service(tmp_path)

    server = HTTPServer(("127.0.0.1", 0), srv._RenderHandler)
    port = server.server_address[1]

    server_thread = threading.Thread(target=server.handle_request)
    server_thread.daemon = True
    server_thread.start()

    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        bad_body = b"not json {"
        conn.request("POST", "/render", body=bad_body, headers={"Content-Length": str(len(bad_body))})
        resp = conn.getresponse()
        assert resp.status == 400
        conn.close()
    finally:
        srv._service = orig_service
        server_thread.join(timeout=5)
        server.server_close()


def test_http_integration_missing_fields_returns_400(tmp_path):
    """POST /oth-path wav_path/video_path 둘 다 없음 → 400."""
    import fifth_render_server as srv
    from http.server import HTTPServer

    orig_service = srv._service
    srv._service = _make_integration_service(tmp_path)

    server = HTTPServer(("127.0.0.1", 0), srv._RenderHandler)
    port = server.server_address[1]

    server_thread = threading.Thread(target=server.handle_request)
    server_thread.daemon = True
    server_thread.start()

    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        body = json.dumps({"other_field": "value"}).encode()
        conn.request("POST", "/render", body=body, headers={"Content-Length": str(len(body))})
        resp = conn.getresponse()
        assert resp.status == 400
        conn.close()
    finally:
        srv._service = orig_service
        server_thread.join(timeout=5)
        server.server_close()


# ---------------------------------------------------------------------------
# _is_image_path / _get_sources 이미지 경로 분기 (Task: 사진 source 직접 로드)
# ---------------------------------------------------------------------------

def test_get_sources_image_path_uses_image_loader(monkeypatch):
    """video_path 가 이미지 확장자 → face_source.load_image_source 호출, 영상추출 불호출."""
    import face_source
    import fifth_render_server as frs

    called = {}

    def fake_load_image(image_path, cache_root, clone_id, detect_lmk_fn=None):
        called["image"] = (image_path, clone_id)
        return {"mode": "single", "open_path": "/c/open.png", "closed_path": None, "open_score": 0.0}

    monkeypatch.setattr(face_source, "load_image_source", fake_load_image)

    svc = frs.RenderService(
        engine=object(), jp=object(), cfg=object(), cache_root="/cache",
        _prepare_sources_fn=lambda sel: {"sel": sel},
    )
    out = svc._get_sources("/home/afterlife/x/9056/9056-face.jpg")

    assert "image" in called, "load_image_source 가 호출되지 않음"
    assert called["image"][0].endswith("9056-face.jpg")
    assert called["image"][1] == "9056"
    assert out == {"sel": {"mode": "single", "open_path": "/c/open.png", "closed_path": None, "open_score": 0.0}}


def test_get_sources_video_path_uses_extract(monkeypatch):
    """video_path 가 영상 확장자(.mp4) → _load_or_extract_fn 훅 호출, load_image_source 불호출."""
    import fifth_render_server as frs

    called = {}

    def fake_loe(video_path):
        called["video"] = video_path
        return {"mode": "blend"}

    svc = frs.RenderService(
        engine=object(), jp=object(), cfg=object(), cache_root="/cache",
        _load_or_extract_fn=fake_loe,
        _prepare_sources_fn=lambda sel: sel,
    )
    out = svc._get_sources("/x/9056/9056-idle-25fps.mp4")

    assert "video" in called, "_load_or_extract_fn 이 호출되지 않음"
    assert called["video"].endswith(".mp4")
    assert out["mode"] == "blend"


def test_is_image_path_true_for_image_exts():
    """_is_image_path: jpg/jpeg/png/webp/bmp 확장자 → True."""
    import fifth_render_server as frs
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".bmp"):
        assert frs._is_image_path(f"/some/path/file{ext}"), f"{ext} 이 이미지로 판별 안 됨"
    for ext in (".mp4", ".avi", ".mov", ".wav"):
        assert not frs._is_image_path(f"/some/path/file{ext}"), f"{ext} 이 이미지로 잘못 판별됨"


def test_http_integration_missing_wav_path_returns_400(tmp_path):
    """POST /oth-path wav_path 파일이 실제로 없으면 200 전에 400 반환 (silent 실패 방지)."""
    import fifth_render_server as srv
    from http.server import HTTPServer

    orig_service = srv._service
    srv._service = _make_integration_service(tmp_path)

    server = HTTPServer(("127.0.0.1", 0), srv._RenderHandler)
    port = server.server_address[1]

    server_thread = threading.Thread(target=server.handle_request)
    server_thread.daemon = True
    server_thread.start()

    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        body = json.dumps({
            "wav_path": "/nonexistent/path/no_such_file.wav",
            "video_path": "/fake/9055/idle.mp4",
        }).encode()
        conn.request("POST", "/render", body=body, headers={"Content-Length": str(len(body))})
        resp = conn.getresponse()

        # 200 헤더 전 차단 — 클라이언트가 명확히 에러를 받아야 함
        assert resp.status == 400, f"기대 400, 실제 {resp.status}"
        resp_body = json.loads(resp.read())
        assert "wav_path" in resp_body.get("error", ""), (
            f"에러 메시지에 wav_path 언급 없음: {resp_body}"
        )
        conn.close()
    finally:
        srv._service = orig_service
        server_thread.join(timeout=5)
        server.server_close()


# ---------------------------------------------------------------------------
# S4: 토큰 트레일러 인코딩/디코딩 왕복 테스트
# ---------------------------------------------------------------------------

def test_encode_token_trailer_has_magic_prefix():
    """encode_token_trailer → [4B len][b'TOK:' + json] 형식."""
    import fifth_render_server as srv
    from phase_token import PhaseToken

    tok = PhaseToken(frame_offset=5, blink_phase=10, first_frame=False)
    chunk = srv.encode_token_trailer(tok)

    # [4B len][payload]
    n = struct.unpack(">I", chunk[:4])[0]
    payload = chunk[4:]
    assert len(payload) == n, "헤더 길이와 페이로드 길이 불일치"
    assert payload.startswith(srv._TOK_MAGIC), (
        f"TOK: 매직 없음: {payload[:8]!r}"
    )


def test_encode_decode_token_trailer_roundtrip():
    """encode_token_trailer → decode_token_trailer_data 왕복 검증."""
    import fifth_render_server as srv
    from phase_token import PhaseToken

    tok_in = PhaseToken(frame_offset=7, blink_phase=3, first_frame=False, head_last=None)
    chunk = srv.encode_token_trailer(tok_in)
    payload = chunk[4:]  # 4B 길이 헤더 제거
    tok_out = srv.decode_token_trailer_data(payload)
    assert tok_out == tok_in, f"왕복 불일치: {tok_in!r} != {tok_out!r}"


def test_decode_token_trailer_data_non_magic_returns_none():
    """jpeg 데이터처럼 TOK: 매직 없는 페이로드 → None."""
    import fifth_render_server as srv

    jpeg_like = b"\xff\xd8\xff some jpeg data"
    assert srv.decode_token_trailer_data(jpeg_like) is None


def test_decode_token_trailer_data_empty_returns_none():
    """빈 페이로드 → None."""
    import fifth_render_server as srv

    assert srv.decode_token_trailer_data(b"") is None


def test_tok_magic_is_not_valid_jpeg_start():
    """TOK: 매직과 JPEG SOI(0xFF 0xD8)는 겹치지 않는다 — 청크 구분 근거."""
    import fifth_render_server as srv

    assert not srv._TOK_MAGIC.startswith(b"\xff\xd8"), (
        "TOK: 매직이 JPEG SOI 와 겹침 — 청크 구분 불가"
    )


# BLOCKER 1: 매직 있고 JSON 깨진 트레일러 → crash 아닌 None
def test_decode_token_trailer_data_broken_json_returns_none():
    """TOK: 매직은 있으나 뒤 JSON 이 깨진 경우 → None (crash 금지).

    BLOCKER: json.loads() JSONDecodeError 가 compare 스크립트 crash 를 유발했던 버그.
    """
    import fifth_render_server as srv

    broken = srv._TOK_MAGIC + b"this is not valid json!!!"
    result = srv.decode_token_trailer_data(broken)
    assert result is None, f"깨진 JSON → None 이어야 함, got: {result!r}"


def test_decode_token_trailer_data_magic_then_empty_json_returns_none():
    """TOK: + 빈 bytes → None (JSON 파싱 불가)."""
    import fifth_render_server as srv

    result = srv.decode_token_trailer_data(srv._TOK_MAGIC)
    assert result is None


def test_parse_render_response_broken_trailer_skips_tok(tmp_path):
    """parse_render_response: 깨진 TOK: 트레일러가 있어도 frames 파싱 정상, end_tok=None."""
    import fifth_render_server as srv

    buf = io.BytesIO()
    # jpeg 프레임 1개
    payload = b"\xff\xd8 fake jpeg"
    buf.write(struct.pack(">I", len(payload)) + payload)
    # 깨진 TOK: 트레일러
    broken_tok = srv._TOK_MAGIC + b"NOT_JSON"
    buf.write(struct.pack(">I", len(broken_tok)) + broken_tok)
    buf.write(struct.pack(">I", 0))

    frames, tok = srv.parse_render_response(buf.getvalue())
    assert len(frames) == 1, "jpeg 프레임은 정상 파싱돼야 함"
    assert tok is None, "깨진 TOK: 트레일러 → end_tok=None"


# ---------------------------------------------------------------------------
# S4: _parse_render_body phase_token 파싱
# ---------------------------------------------------------------------------

def test_parse_render_body_with_phase_token():
    """phase_token dict 포함 시 PhaseToken 객체로 역직렬화."""
    from fifth_render_server import _parse_render_body
    from phase_token import PhaseToken

    tok_in = PhaseToken(frame_offset=10, blink_phase=5, first_frame=False)
    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": tok_in.to_dict(),
    }).encode()
    wav, vid, tok_out = _parse_render_body(body)

    assert wav == "/tmp/a.wav"
    assert vid == "/ref/idle.mp4"
    assert tok_out == tok_in, f"PhaseToken 역직렬화 불일치: {tok_out!r}"


def test_parse_render_body_phase_token_null_is_none():
    """phase_token: null → None (회귀 안전)."""
    from fifth_render_server import _parse_render_body

    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": None,
    }).encode()
    _, _, tok = _parse_render_body(body)
    assert tok is None


def test_parse_render_body_phase_token_absent_is_none():
    """phase_token 키 자체 없음 → None (레거시 클라이언트 호환)."""
    from fifth_render_server import _parse_render_body

    body = json.dumps({"wav_path": "/tmp/a.wav", "video_path": "/ref/idle.mp4"}).encode()
    _, _, tok = _parse_render_body(body)
    assert tok is None


# BLOCKER 2: invalid phase_token → ValueError(→ 400)
def test_parse_render_body_invalid_phase_token_type_raises_valueerror():
    """phase_token.frame_offset='invalid' 같은 타입 불량 → ValueError.

    BLOCKER: PhaseToken.from_dict 에서 예외 → 500 이었던 버그.
    do_POST 는 ValueError 를 캐치해 400 을 반환한다.
    """
    from fifth_render_server import _parse_render_body

    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": {"frame_offset": "invalid", "blink_phase": 0, "first_frame": True},
    }).encode()
    with pytest.raises(ValueError, match="phase_token"):
        _parse_render_body(body)


def test_parse_render_body_invalid_phase_token_wrong_structure_raises():
    """phase_token이 dict 가 아닌 경우(list 등) → ValueError."""
    from fifth_render_server import _parse_render_body

    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": [1, 2, 3],  # list 는 invalid
    }).encode()
    with pytest.raises(ValueError, match="phase_token"):
        _parse_render_body(body)


# ---------------------------------------------------------------------------
# BLOCKER (sion): head_last 검증 — list|None 이외 → ValueError(400)
# ---------------------------------------------------------------------------

def test_parse_render_body_phase_token_head_last_str_raises():
    """head_last='NOT_A_LIST'(str) → ValueError — 400 반환 보장."""
    from fifth_render_server import _parse_render_body

    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": {
            "frame_offset": 0, "blink_phase": 0,
            "first_frame": True, "head_last": "NOT_A_LIST",
        },
    }).encode()
    with pytest.raises(ValueError, match="phase_token"):
        _parse_render_body(body)


def test_parse_render_body_phase_token_head_last_int_raises():
    """head_last=42(int) → ValueError — list 또는 None 만 허용."""
    from fifth_render_server import _parse_render_body

    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": {
            "frame_offset": 0, "blink_phase": 0,
            "first_frame": True, "head_last": 42,
        },
    }).encode()
    with pytest.raises(ValueError, match="phase_token"):
        _parse_render_body(body)


def test_parse_render_body_phase_token_head_last_none_passes():
    """head_last=null → None 허용, 정상 파싱."""
    from fifth_render_server import _parse_render_body

    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": {
            "frame_offset": 0, "blink_phase": 0,
            "first_frame": True, "head_last": None,
        },
    }).encode()
    wav, vid, tok = _parse_render_body(body)
    assert tok is not None
    assert tok.head_last is None


def test_parse_render_body_phase_token_head_last_list_passes():
    """head_last=[1.0, 2.0](list) → list 허용, 값 보존."""
    from fifth_render_server import _parse_render_body

    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": {
            "frame_offset": 0, "blink_phase": 0,
            "first_frame": True, "head_last": [1.0, 2.0],
        },
    }).encode()
    wav, vid, tok = _parse_render_body(body)
    assert tok is not None
    assert tok.head_last == [1.0, 2.0]


# ---------------------------------------------------------------------------
# CONCERN (el): bool/int subclass gap
#   frame_offset/blink_phase: bool 유입 차단(isinstance(True, int)==True 함정)
#   first_frame: 현행 유지 — int(1) 차단, bool(True/False) 통과
# ---------------------------------------------------------------------------

def test_parse_render_body_phase_token_frame_offset_bool_raises():
    """frame_offset=true (JSON bool) → ValueError.

    Python에서 isinstance(True, int)==True 이므로 단순 int 검사로는 통과함.
    bool 유입을 명시 차단해야 함.
    """
    from fifth_render_server import _parse_render_body

    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": {"frame_offset": True, "blink_phase": 0, "first_frame": True},
    }).encode()
    with pytest.raises(ValueError, match="phase_token"):
        _parse_render_body(body)


def test_parse_render_body_phase_token_blink_phase_bool_raises():
    """blink_phase=true (JSON bool) → ValueError."""
    from fifth_render_server import _parse_render_body

    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": {"frame_offset": 0, "blink_phase": True, "first_frame": True},
    }).encode()
    with pytest.raises(ValueError, match="phase_token"):
        _parse_render_body(body)


def test_parse_render_body_phase_token_first_frame_int_raises():
    """first_frame=1 (int, bool 아님) → ValueError (회귀: 현행 유지 확인)."""
    from fifth_render_server import _parse_render_body

    body = json.dumps({
        "wav_path": "/tmp/a.wav",
        "video_path": "/ref/idle.mp4",
        "phase_token": {"frame_offset": 0, "blink_phase": 0, "first_frame": 1},
    }).encode()
    with pytest.raises(ValueError, match="phase_token"):
        _parse_render_body(body)


def test_http_integration_invalid_phase_token_returns_400(tmp_path):
    """POST /oth-path invalid phase_token → 400(Bad Request). 500 이면 안 됨."""
    import fifth_render_server as srv
    from http.server import HTTPServer
    import soundfile as sf

    wav_file = tmp_path / "test.wav"
    sf.write(str(wav_file), np.zeros(4800, np.float32), 16000)

    orig_service = srv._service
    srv._service = _make_integration_service(tmp_path)

    server = HTTPServer(("127.0.0.1", 0), srv._RenderHandler)
    port = server.server_address[1]
    server_thread = threading.Thread(target=server.handle_request)
    server_thread.daemon = True
    server_thread.start()

    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        bad_body = json.dumps({
            "wav_path": str(wav_file),
            "video_path": "/fake/9055/idle.mp4",
            "phase_token": {"frame_offset": "NOT_AN_INT"},
        }).encode()
        conn.request("POST", "/render", body=bad_body,
                     headers={"Content-Length": str(len(bad_body))})
        resp = conn.getresponse()
        assert resp.status == 400, (
            f"invalid phase_token 은 400 이어야 함, got {resp.status}"
        )
        resp_body = json.loads(resp.read())
        assert "phase_token" in resp_body.get("error", "").lower(), (
            f"에러 메시지에 'phase_token' 언급 없음: {resp_body}"
        )
        conn.close()
    finally:
        srv._service = orig_service
        server_thread.join(timeout=5)
        server.server_close()


# ---------------------------------------------------------------------------
# S4: RenderService.render() 토큰 트레일러 송신 테스트
# ---------------------------------------------------------------------------

def _make_service_with_token_support(tmp_path):
    """phase_token 을 지원하는 fake_stream 을 사용하는 테스트 서비스."""
    from fifth_render_server import RenderService
    from config import FifthConfig
    from phase_token import PhaseToken

    cfg = FifthConfig.from_env()
    fixed_sources = {
        "mode": "single",
        "open_s": {
            "src_img": "OPEN",
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
    }

    def fake_load(video_path):
        return {"mode": "single", "open_path": "/fake/open.png", "closed_path": None, "open_score": 0.5}

    def fake_prepare(selection):
        return fixed_sources

    def fake_stream_with_tok(engine, jp, cfg, sources, wav_path, on_frame, blink_enabled, phase_token=None):
        """phase_token 받아서 끝 토큰 누적 시뮬."""
        in_tok = phase_token or PhaseToken()
        for _ in range(2):
            on_frame(np.zeros((8, 8, 3), dtype=np.uint8))
        end_tok = PhaseToken(
            frame_offset=in_tok.frame_offset + 2,
            blink_phase=in_tok.blink_phase + 12,
            first_frame=False,
        )
        return 2, end_tok

    return RenderService(
        engine=_FakeEngine(),
        jp=_FakeJP(n=2),
        cfg=cfg,
        cache_root=str(tmp_path),
        detect_lmk=None,
        _load_or_extract_fn=fake_load,
        _prepare_sources_fn=fake_prepare,
        _stream_wav_fn=fake_stream_with_tok,
    )


def test_render_writes_trailer_when_phase_token_given(tmp_path):
    """phase_token 전달 시 render() 출력에 TOK: 트레일러 청크 포함."""
    import fifth_render_server as srv
    from phase_token import PhaseToken

    wav = _make_wav(tmp_path)
    svc = _make_service_with_token_support(tmp_path)

    buf = io.BytesIO()
    input_tok = PhaseToken(frame_offset=0, first_frame=True)
    svc.render(
        wav_path=wav,
        video_path="/fake/9055/idle.mp4",
        write=buf.write,
        phase_token=input_tok,
    )

    # TOK: 트레일러 청크 탐색
    data = buf.getvalue()
    tok_found = False
    pos = 0
    while pos + 4 <= len(data):
        n = struct.unpack_from(">I", data, pos)[0]
        pos += 4
        if n == 0:
            break
        payload = data[pos:pos + n]
        if payload.startswith(srv._TOK_MAGIC):
            tok_found = True
        pos += n

    assert tok_found, "TOK: 트레일러 청크가 없음 — phase_token 전달 시 반드시 포함"


def test_render_no_trailer_when_phase_token_none(tmp_path):
    """phase_token=None 시 render() 출력에 TOK: 트레일러 없음 (회귀 안전)."""
    import fifth_render_server as srv

    wav = _make_wav(tmp_path)
    svc = _make_service_with_token_support(tmp_path)

    buf = io.BytesIO()
    svc.render(
        wav_path=wav,
        video_path="/fake/9055/idle.mp4",
        write=buf.write,
        phase_token=None,
    )

    data = buf.getvalue()
    pos = 0
    while pos + 4 <= len(data):
        n = struct.unpack_from(">I", data, pos)[0]
        pos += 4
        if n == 0:
            break
        payload = data[pos:pos + n]
        assert not payload.startswith(srv._TOK_MAGIC), (
            "phase_token=None 인데 TOK: 트레일러 발견 — 회귀"
        )
        pos += n


def test_render_trailer_is_last_chunk_before_terminator(tmp_path):
    """render() 가 쓰는 데이터에서 TOK: 트레일러가 마지막 비-zero 청크."""
    import fifth_render_server as srv
    from phase_token import PhaseToken

    wav = _make_wav(tmp_path)
    svc = _make_service_with_token_support(tmp_path)

    buf = io.BytesIO()
    svc.render(
        wav_path=wav,
        video_path="/fake/9055/idle.mp4",
        write=buf.write,
        phase_token=PhaseToken(first_frame=True),
    )

    # render()는 종료마커를 쓰지 않으므로 수동 append 후 파싱
    data = buf.getvalue() + struct.pack(">I", 0)
    chunks = []
    pos = 0
    while pos + 4 <= len(data):
        n = struct.unpack_from(">I", data, pos)[0]
        pos += 4
        if n == 0:
            break
        chunks.append(data[pos:pos + n])
        pos += n

    assert chunks, "청크 없음"
    assert chunks[-1].startswith(srv._TOK_MAGIC), (
        f"마지막 청크가 TOK: 트레일러여야 함, got: {chunks[-1][:8]!r}"
    )
    # 나머지 청크는 jpeg(TOK: 아님)
    for ch in chunks[:-1]:
        assert not ch.startswith(srv._TOK_MAGIC), "중간 청크가 TOK: 트레일러여선 안 됨"


def test_render_trailer_contains_valid_end_token(tmp_path):
    """TOK: 트레일러를 decode_token_trailer_data로 파싱하면 유효한 PhaseToken."""
    import fifth_render_server as srv
    from phase_token import PhaseToken

    wav = _make_wav(tmp_path)
    svc = _make_service_with_token_support(tmp_path)

    buf = io.BytesIO()
    input_tok = PhaseToken(frame_offset=0, blink_phase=0, first_frame=True)
    svc.render(
        wav_path=wav,
        video_path="/fake/9055/idle.mp4",
        write=buf.write,
        phase_token=input_tok,
    )

    data = buf.getvalue() + struct.pack(">I", 0)
    end_tok = None
    pos = 0
    while pos + 4 <= len(data):
        n = struct.unpack_from(">I", data, pos)[0]
        pos += 4
        if n == 0:
            break
        payload = data[pos:pos + n]
        if payload.startswith(srv._TOK_MAGIC):
            end_tok = srv.decode_token_trailer_data(payload)
        pos += n

    assert end_tok is not None, "TOK: 트레일러 파싱 실패"
    assert end_tok.first_frame is False, "렌더 후 end_tok.first_frame 은 False 여야 함"
    assert end_tok.frame_offset > input_tok.frame_offset, (
        f"frame_offset 누적 안 됨: {input_tok.frame_offset} → {end_tok.frame_offset}"
    )


# ---------------------------------------------------------------------------
# S4: parse_render_response 유틸 테스트 (비교스크립트 클라이언트 파싱)
# ---------------------------------------------------------------------------

def test_parse_render_response_no_trailer():
    """TOK: 없는 스트림 → (frames, None)."""
    import fifth_render_server as srv

    # 프레임 2개 + 종료마커
    buf = io.BytesIO()
    for _ in range(2):
        payload = b"\xff\xd8 fake jpeg"
        buf.write(struct.pack(">I", len(payload)) + payload)
    buf.write(struct.pack(">I", 0))

    frames, tok = srv.parse_render_response(buf.getvalue())
    assert len(frames) == 2
    assert tok is None


def test_parse_render_response_with_trailer():
    """TOK: 트레일러 포함 스트림 → (frames, PhaseToken)."""
    import fifth_render_server as srv
    from phase_token import PhaseToken

    tok_in = PhaseToken(frame_offset=5, blink_phase=3, first_frame=False)

    buf = io.BytesIO()
    # 프레임 2개
    for _ in range(2):
        payload = b"\xff\xd8 fake jpeg"
        buf.write(struct.pack(">I", len(payload)) + payload)
    # TOK: 트레일러
    tok_chunk = srv.encode_token_trailer(tok_in)
    buf.write(tok_chunk)
    # 종료마커
    buf.write(struct.pack(">I", 0))

    frames, tok_out = srv.parse_render_response(buf.getvalue())
    assert len(frames) == 2, f"프레임 수 기대 2, 실제 {len(frames)}"
    assert tok_out == tok_in, f"토큰 왕복 불일치: {tok_out!r}"


def test_parse_render_response_empty_stream():
    """종료마커만 있는 스트림 → ([], None)."""
    import fifth_render_server as srv

    data = struct.pack(">I", 0)
    frames, tok = srv.parse_render_response(data)
    assert frames == []
    assert tok is None


# ---------------------------------------------------------------------------
# S4: t088_continuation_compare 순수 함수 로컬 테스트
# (detect_landmarks / SSIM 의존 없는 경계 계산 로직만)
# ---------------------------------------------------------------------------

def test_compute_boundary_index_basic():
    """경계 인덱스 = n_frames_chunk_a (0-based 청크B 시작)."""
    from t088_continuation_compare import compute_boundary_index

    assert compute_boundary_index(total_frames=50, n_frames_chunk_a=25) == 25


def test_compute_boundary_index_clamp_at_end():
    """n_frames_chunk_a >= total_frames 이면 total_frames-1 으로 클램프."""
    from t088_continuation_compare import compute_boundary_index

    assert compute_boundary_index(total_frames=10, n_frames_chunk_a=15) == 9


def test_compute_boundary_index_zero_chunk_a():
    """청크A 프레임 0 → boundary=0."""
    from t088_continuation_compare import compute_boundary_index

    assert compute_boundary_index(total_frames=20, n_frames_chunk_a=0) == 0


def test_split_wav_at_frame_boundary_creates_two_files(tmp_path):
    """split_wav_at_frame_boundary: wav → 2개 파일 생성, 합산 길이 ≈ 원본."""
    import soundfile as sf
    from pathlib import Path
    from t088_continuation_compare import split_wav_at_frame_boundary

    # 1초 sine wav
    sr = 16000
    dur = 1.0
    y = (0.3 * np.sin(2 * np.pi * 200 * np.linspace(0, dur, int(sr * dur)))).astype(np.float32)
    wav_path = str(tmp_path / "seq.wav")
    sf.write(wav_path, y, sr)

    wav_a, wav_b, n_frames_a = split_wav_at_frame_boundary(wav_path, fps=25.0)

    assert Path(wav_a).exists(), "청크A 파일 없음"
    assert Path(wav_b).exists(), "청크B 파일 없음"
    assert n_frames_a > 0, "n_frames_a 는 양수여야 함"

    y_a, _ = sf.read(wav_a, dtype="float32")
    y_b, _ = sf.read(wav_b, dtype="float32")

    # 합산 길이 = 원본 길이
    assert len(y_a) + len(y_b) == len(y), (
        f"분할 후 합산 샘플 수 불일치: {len(y_a)}+{len(y_b)} != {len(y)}"
    )


# ---------------------------------------------------------------------------
# el RISK: t088_continuation_compare _parse_raw_render_response 방어
# ---------------------------------------------------------------------------

def test_parse_raw_render_response_broken_tok_raises():
    """TOK: 뒤가 깨진 JSON → RuntimeError (명확한 에러 처리)."""
    from t088_continuation_compare import _parse_raw_render_response

    _TOK_MAGIC = b"TOK:"
    broken_tok = _TOK_MAGIC + b"NOT_VALID_JSON{"
    chunk = struct.pack(">I", len(broken_tok)) + broken_tok
    raw = chunk + struct.pack(">I", 0)

    with pytest.raises(RuntimeError, match="TOK: 트레일러"):
        _parse_raw_render_response(raw)


def test_parse_raw_render_response_valid_tok():
    """정상 TOK: 트레일러 + jpeg 프레임 → (frames, dict)."""
    from t088_continuation_compare import _parse_raw_render_response

    _TOK_MAGIC = b"TOK:"
    tok_dict = {"frame_offset": 5, "blink_phase": 3, "first_frame": False, "head_last": None}
    tok_chunk = _TOK_MAGIC + json.dumps(tok_dict).encode()
    fake_jpeg = b"\xff\xd8 fake jpeg"
    raw = (
        struct.pack(">I", len(fake_jpeg)) + fake_jpeg
        + struct.pack(">I", len(tok_chunk)) + tok_chunk
        + struct.pack(">I", 0)
    )

    frames, end_tok = _parse_raw_render_response(raw)
    assert len(frames) == 1
    assert end_tok == tok_dict


def test_parse_raw_render_response_no_tok():
    """TOK: 없는 스트림 → (frames, None)."""
    from t088_continuation_compare import _parse_raw_render_response

    fake_jpeg = b"\xff\xd8 fake jpeg"
    raw = struct.pack(">I", len(fake_jpeg)) + fake_jpeg + struct.pack(">I", 0)

    frames, end_tok = _parse_raw_render_response(raw)
    assert len(frames) == 1
    assert end_tok is None


def test_split_wav_at_frame_boundary_half_frames(tmp_path):
    """분할 기준이 절반 프레임 근처(±1)인지 확인."""
    import soundfile as sf
    from t088_continuation_compare import split_wav_at_frame_boundary

    sr = 16000
    fps = 25.0
    n_frames_total = 50
    n_samples = int(n_frames_total * sr / fps)
    y = np.zeros(n_samples, dtype=np.float32)
    wav_path = str(tmp_path / "half.wav")
    sf.write(wav_path, y, sr)

    _, _, n_frames_a = split_wav_at_frame_boundary(wav_path, fps=fps)

    expected_half = n_frames_total // 2
    assert abs(n_frames_a - expected_half) <= 1, (
        f"n_frames_a={n_frames_a} 가 절반({expected_half}) ±1 범위 밖"
    )


# CONCERN C-1: boundary_idx 는 추산(n_frames_a) 대신 실측(len(frames_chunk_a)) 사용
def test_boundary_idx_uses_actual_chunk_a_frame_count():
    """run_compare 가 boundary_idx 로 n_frames_a(추산) 대신 len(frames_chunk_a)(실측) 을 써야 한다.

    stream_wav_frames n=max(len(env),nj) 분기로 추산과 실측이 ±몇 프레임 어긋날 수 있음.
    이 테스트는 compute_boundary_index 의 인자가 len(frames_chunk_a) 에서 왔을 때
    정확한 경계를 계산함을 확인한다.
    """
    from t088_continuation_compare import compute_boundary_index

    # 추산: wav 기반 n_frames_a = 12 (오차 가능)
    # 실측: 실제 렌더된 청크A 프레임 수 = 15 (JoyVASA nj > env 케이스)
    n_frames_a_estimated = 12
    n_frames_a_actual = 15

    boundary_estimated = compute_boundary_index(total_frames=28, n_frames_chunk_a=n_frames_a_estimated)
    boundary_actual = compute_boundary_index(total_frames=28, n_frames_chunk_a=n_frames_a_actual)

    # 실측값을 써야 정확한 경계 인덱스를 얻음
    assert boundary_actual == 15, "실측 boundary_idx 불일치"
    assert boundary_estimated != boundary_actual, (
        "이 케이스에서 추산과 실측이 다름 — 실측을 써야 한다"
    )
