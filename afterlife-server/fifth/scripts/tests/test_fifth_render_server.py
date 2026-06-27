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

    def _stream_no_blink(engine, jp, cfg, sources, wav_path, on_frame, blink_enabled):
        """blink 강제 off — render_offline import 방지."""
        return stream_wav_frames(
            engine, jp, cfg, sources, wav_path,
            on_frame=on_frame,
            blink_enabled=False,
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
    """정상 JSON(wav_path+video_path) → (wav_path, video_path) 반환."""
    import json
    from fifth_render_server import _parse_render_body

    body = json.dumps({"wav_path": "/tmp/a.wav", "video_path": "/ref/idle.mp4"}).encode()
    wav, vid = _parse_render_body(body)
    assert wav == "/tmp/a.wav"
    assert vid == "/ref/idle.mp4"


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
    wav, vid = _parse_render_body(body)

    assert wav == "/home/afterlife/afterlife-server/tmp/x.wav"
    assert vid == "/ref/idle.mp4"


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

    def fake_stream(engine, jp, cfg, sources, wav_path, on_frame, blink_enabled):
        # 프레임 2개 고정 — stream_wav_frames 와 동일 tuple 반환
        from phase_token import PhaseToken
        for _ in range(2):
            on_frame(np.zeros((8, 8, 3), dtype=np.uint8))
        return 2, PhaseToken(frame_offset=2, first_frame=False)

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

    def fake_load_image(image_path, cache_root, clone_id):
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
