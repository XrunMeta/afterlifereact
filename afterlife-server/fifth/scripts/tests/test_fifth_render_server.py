"""fifth_render_server.py TDD 테스트.

실행법:
  cd afterlife-server/fifth
  PYTHONPATH=$PWD/scripts /Volumes/exDN/devExdn/afl-fifth/afterlife-server/fifth/.venv/bin/python \\
    -m pytest scripts/tests/test_fifth_render_server.py -v

cv2 없는 로컬 venv: cv2 mock fixture 로 encode_frame_chunk 테스트.
"""
from __future__ import annotations

import io
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


def test_render_streams_frames_and_terminator(tmp_path):
    """render(): 프레임 청크 1개 이상 + 종료마커로 끝남."""
    wav = _make_wav(tmp_path)
    svc, _, _ = _make_service(tmp_path)

    buf = io.BytesIO()
    count = svc.render(
        wav_path=wav,
        video_path="/fake/9055/idle.mp4",
        write=buf.write,
    )

    assert count > 0
    assert buf.getvalue().endswith(struct.pack(">I", 0))


def test_render_chunk_structure_valid(tmp_path):
    """render() 출력: 모든 청크가 [4B length][data] 구조 + 마지막 length=0."""
    wav = _make_wav(tmp_path)
    svc, _, _ = _make_service(tmp_path)

    buf = io.BytesIO()
    svc.render(wav_path=wav, video_path="/fake/9055/idle.mp4", write=buf.write)

    data = buf.getvalue()
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


def test_render_terminator_appears_exactly_once(tmp_path):
    """render(): 종료마커(length=0) 이 정확히 1회만 등장."""
    wav = _make_wav(tmp_path)
    svc, _, _ = _make_service(tmp_path)

    buf = io.BytesIO()
    svc.render(wav_path=wav, video_path="/fake/9055/idle.mp4", write=buf.write)

    data = buf.getvalue()
    zero_marker = struct.pack(">I", 0)
    # 마지막 4바이트만 0이어야 함
    count_zeros = 0
    pos = 0
    while pos < len(data):
        n = struct.unpack_from(">I", data, pos)[0]
        pos += 4
        if n == 0:
            count_zeros += 1
            break
        pos += n

    assert count_zeros == 1, "종료마커 중복"
    assert pos == len(data), "종료마커 이후 잔여 데이터"


# ---------------------------------------------------------------------------
# Step 6: _parse_render_body
# ---------------------------------------------------------------------------

def test_parse_render_body_valid():
    """정상 JSON → (wav_path, video_path) 반환."""
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


# ---------------------------------------------------------------------------
# RenderService: thread safety (기본 연기)
# ---------------------------------------------------------------------------

def test_render_concurrent_same_video_cache_correct(tmp_path):
    """동시 렌더 요청 — 캐시 손상 없이 각 호출 정상 종료마커."""
    wav = _make_wav(tmp_path)
    svc, _, _ = _make_service(tmp_path)

    errors = []
    results = []

    def _run():
        buf = io.BytesIO()
        try:
            svc.render(wav_path=wav, video_path="/fake/9055/idle.mp4", write=buf.write)
            results.append(buf.getvalue())
        except Exception as exc:
            errors.append(exc)

    threads = [threading.Thread(target=_run) for _ in range(3)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert not errors, f"스레드 오류: {errors}"
    for r in results:
        assert r.endswith(struct.pack(">I", 0)), "종료마커 누락"
