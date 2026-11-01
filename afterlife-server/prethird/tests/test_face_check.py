"""AFL-1071 만화풍 사진 얼굴 검사 — 5변형 판정 순수 로직."""
import numpy as np

from face_check import judge, make_variants


def test_judge_three_of_five_passes():
    assert judge([0.9, 0.25, 0.21, 0.1, 0.0]) == {"ok": True}


def test_judge_two_of_five_fails():
    assert judge([0.9, 0.25, 0.1, 0.1, 0.0]) == {"ok": False, "reason": "NO_FACE"}


def test_judge_boundary_inclusive():
    assert judge([0.2] * 3 + [0, 0])["ok"] is True


def _img():
    rng = np.random.default_rng(0)
    return rng.integers(0, 256, (100, 80, 3), dtype=np.uint8)


def test_make_variants_count_and_shape():
    vs = make_variants(_img())
    assert len(vs) == 5
    for v in vs:
        assert v.shape == (100, 80, 3)
        assert v.dtype == np.uint8


def test_variant_flip_is_mirror():
    img = _img()
    vs = make_variants(img)
    assert np.array_equal(vs[1], vs[0][:, ::-1])


def test_variant_brightness_adds_25_saturating():
    img = _img()
    img[0, 0] = 240
    vs = make_variants(img)
    expected = np.clip(img.astype(int) + 25, 0, 255).astype(np.uint8)
    assert np.array_equal(vs[4], expected)


def test_variant_zoom_is_1_1x_center_crop():
    import cv2

    img = _img()
    h, w = img.shape[:2]
    ch, cw = round(h / 1.1), round(w / 1.1)
    y0, x0 = (h - ch) // 2, (w - cw) // 2
    expected = cv2.resize(img[y0:y0 + ch, x0:x0 + cw], (w, h), interpolation=cv2.INTER_LINEAR)
    assert np.array_equal(make_variants(img)[2], expected)


def test_variant_shrink_is_0_9x_with_replicated_border():
    import cv2

    img = _img()
    h, w = img.shape[:2]
    nh, nw = round(h * 0.9), round(w * 0.9)
    top, left = (h - nh) // 2, (w - nw) // 2
    small = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    expected = cv2.copyMakeBorder(
        small, top, h - nh - top, left, w - nw - left, cv2.BORDER_REPLICATE
    )
    assert np.array_equal(make_variants(img)[3], expected)


# ---------------------------------------------------------------------------
# Task 2: /face-check 입구 (detector 주입·다운로드 monkeypatch)
# ---------------------------------------------------------------------------
import sys
import threading

import cv2
import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

import face_check as fc

_AUTH = {"Authorization": "Bearer test-secret"}
_BODY = {"imageUrl": "https://img.example.com/a.png"}


def _png_bytes() -> bytes:
    ok, buf = cv2.imencode(".png", _img())
    assert ok
    return buf.tobytes()


@pytest.fixture
def _secret(monkeypatch):
    monkeypatch.setenv("PREBUILD_SECRET", "test-secret")


@pytest.fixture(autouse=True)
def _reset_detector():
    yield
    fc.set_detector(None)


@pytest.fixture(autouse=True)
def _allowlist(monkeypatch):
    """P5: allowlist 가 비면 다운로드를 거부하므로 기본으로 채워 둔다(거부 동작은 개별 시험이 지운다)."""
    monkeypatch.setenv("PRETHIRD_ASSET_HOST_ALLOWLIST", "img.example.com,127.0.0.1")


def _app():
    app = web.Application()
    app.router.add_post("/face-check", fc.face_check_handler)
    return app


def _fake_download(data: bytes):
    async def _dl(url):
        return data
    return _dl


def _seq_detector(values):
    it = iter(values)
    return lambda img: next(it)


async def _post(body=_BODY, headers=_AUTH):
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/face-check", json=body, headers=headers)
        return resp.status, await resp.json()


async def test_handler_requires_bearer(_secret):
    status, _ = await _post(headers={})
    assert status == 401
    status, _ = await _post(headers={"Authorization": "Bearer wrong"})
    assert status == 401


async def test_handler_401_when_secret_unset(monkeypatch):
    monkeypatch.delenv("PREBUILD_SECRET", raising=False)
    status, _ = await _post(headers={"Authorization": "Bearer "})
    assert status == 401


async def test_handler_400_without_url(_secret):
    status, _ = await _post(body={})
    assert status == 400


async def test_handler_pass(monkeypatch, _secret):
    monkeypatch.setattr(fc, "_download", _fake_download(_png_bytes()))
    fc.set_detector(_seq_detector([0.9, 0.9, 0.9, 0.0, 0.0]))
    status, body = await _post()
    assert status == 200
    assert body == {"ok": True}


async def test_handler_no_face(monkeypatch, _secret):
    monkeypatch.setattr(fc, "_download", _fake_download(_png_bytes()))
    fc.set_detector(lambda img: 0.0)
    status, body = await _post()
    assert status == 200
    assert body == {"ok": False, "reason": "NO_FACE"}


async def test_handler_bad_image(monkeypatch, _secret):
    monkeypatch.setattr(fc, "_download", _fake_download(b"not an image"))
    fc.set_detector(lambda img: 0.9)
    status, body = await _post()
    assert status == 200
    assert body == {"ok": False, "reason": "CHECK_FAILED"}


async def test_handler_too_large(monkeypatch, _secret):
    """실제 _download 의 스트리밍 상한을 로컬 서버로 검증 (URL 검증만 우회)."""
    big = web.Application()

    async def _big(request):
        return web.Response(body=b"\0" * (10 * 1024 * 1024 + 1))

    big.router.add_get("/big", _big)
    async with TestServer(big) as srv:
        monkeypatch.setattr(fc, "_validate_url", lambda url: None)
        fc.set_detector(lambda img: 0.9)
        status, body = await _post(body={"imageUrl": str(srv.make_url("/big"))})
    assert status == 200
    assert body == {"ok": False, "reason": "CHECK_FAILED"}


async def test_download_rejects_over_limit_directly(monkeypatch):
    big = web.Application()

    async def _big(request):
        return web.Response(body=b"\0" * (fc.MAX_BYTES + 1))

    big.router.add_get("/big", _big)
    async with TestServer(big) as srv:
        monkeypatch.setattr(fc, "_validate_url", lambda url: None)
        with pytest.raises(ValueError):
            await fc._download(str(srv.make_url("/big")))


async def test_download_validates_url_ssrf(_secret):
    """내부망 주소는 asset_fetch._validate_url 에서 막혀 CHECK_FAILED."""
    fc.set_detector(lambda img: 0.9)
    status, body = await _post(body={"imageUrl": "http://127.0.0.1/a.png"})
    assert status == 200
    assert body == {"ok": False, "reason": "CHECK_FAILED"}


def test_limits_are_10mb_10s():
    assert fc.MAX_BYTES == 10 * 1024 * 1024
    assert fc.FETCH_TIMEOUT_SEC == 10.0


async def test_handler_detector_raises(monkeypatch, _secret):
    monkeypatch.setattr(fc, "_download", _fake_download(_png_bytes()))

    def _boom(img):
        raise RuntimeError("cuda oom")

    fc.set_detector(_boom)
    status, body = await _post()
    assert status == 200
    assert body == {"ok": False, "reason": "CHECK_FAILED"}


async def test_handler_runs_detector_in_executor(monkeypatch, _secret):
    monkeypatch.setattr(fc, "_download", _fake_download(_png_bytes()))
    loop_thread = threading.get_ident()
    seen = []

    def _det(img):
        seen.append(threading.get_ident())
        return 0.9

    fc.set_detector(_det)
    status, body = await _post()
    assert body == {"ok": True}
    assert len(seen) == 5
    assert all(t != loop_thread for t in seen)


def test_max_face_score_default_path_failure_raises(monkeypatch):
    """기본 S3FD 로드가 실패하면 예외 → 핸들러에서 CHECK_FAILED 로 떨어진다."""
    fc.set_detector(None)
    monkeypatch.setattr(fc, "_s3fd", None)

    def _fail():
        raise ImportError("no face_detection")

    monkeypatch.setattr(fc, "_load_s3fd", _fail)
    with pytest.raises(ImportError):
        fc.max_face_score(_img())


async def test_signaling_registers_face_check_route(monkeypatch):
    """signaling.make_app 에 /face-check 가 붙어 있고 인증 없으면 401."""
    monkeypatch.setenv("PREBUILD_SECRET", "test-secret")
    from signaling import make_app

    async with TestClient(TestServer(make_app())) as client:
        resp = await client.post("/face-check", json=_BODY)
        assert resp.status == 401


def test_s3fd_score_uses_raw_scores_after_nms(monkeypatch):
    """batch_detect+nms 원점수 경로: RGB 배치 1장 입력, nms 남은 것 중 최고 점수(0.2 미만도 그대로)."""
    seen = {}

    def _bd(net, imgs, device):
        seen["shape"], seen["px"], seen["device"] = imgs.shape, imgs[0, 0, 0].copy(), device
        return np.array([[[0, 0, 1, 1, 0.15]], [[0, 0, 2, 2, 0.9]], [[0, 0, 3, 3, 0.05]]])

    def _nms(boxes, thr):
        assert thr == 0.3
        return [0, 2]  # 0.9 는 nms 에서 빠졌다고 가정

    monkeypatch.setattr(fc, "_s3fd", ("net", "cuda", _bd, _nms))
    img = _img()
    assert fc.max_face_score(img) == pytest.approx(0.15)
    assert seen["shape"] == (1, 100, 80, 3)
    assert np.array_equal(seen["px"], img[0, 0, ::-1])  # BGR→RGB
    assert seen["device"] == "cuda"


def test_s3fd_score_zero_when_no_box(monkeypatch):
    bd = lambda net, imgs, device: np.zeros((1, 1, 5))
    monkeypatch.setattr(fc, "_s3fd", ("net", "cpu", bd, lambda b, t: [0]))
    assert fc.max_face_score(_img()) == 0.0


def test_sfd_from_detector_resolves_same_package(monkeypatch):
    """SFDDetector 가 속한 패키지 이름(face_detection. / musetalk.utils.face_detection.)으로 detect·bbox 를 찾는다."""
    import types

    for prefix in ("face_detection.", "musetalk.utils.face_detection."):
        det_mod = types.ModuleType(prefix + "detection.sfd.detect")
        det_mod.batch_detect = object()
        bbox_mod = types.ModuleType(prefix + "detection.sfd.bbox")
        bbox_mod.nms = object()
        monkeypatch.setitem(sys.modules, det_mod.__name__, det_mod)
        monkeypatch.setitem(sys.modules, bbox_mod.__name__, bbox_mod)
        cls = type("SFDDetector", (), {"__module__": prefix + "detection.sfd.sfd_detector"})
        d = cls()
        d.face_detector, d.device = "net", "cuda"
        assert fc._sfd_from_detector(d) == ("net", "cuda", det_mod.batch_detect, bbox_mod.nms)


def test_find_existing_detector_from_preprocessing_fa(monkeypatch):
    import types

    det = types.SimpleNamespace(face_detector="net", device="cuda")
    mod = types.ModuleType("musetalk.utils.preprocessing")
    mod.fa = types.SimpleNamespace(face_detector=det)
    monkeypatch.setitem(sys.modules, "musetalk.utils.preprocessing", mod)
    assert fc._find_existing_detector() is det


# ---------------------------------------------------------------------------
# 최종 수정(P1~P7): 전용 풀·대기 상한·import 격리·DNS 오프루프·디코드 전 화소 상한·allowlist·인증 bytes
# ---------------------------------------------------------------------------
import ast
import asyncio
import importlib.util
import logging
import os
import pathlib
import struct
import zlib

from aiohttp.test_utils import make_mocked_request

_SCRIPTS = pathlib.Path(__file__).resolve().parents[1] / "scripts"


def _load_isolated(name: str, filename: str):
    """같은 소스를 다른 모듈 이름으로 새로 로드(진짜 모듈·다른 시험에 영향 없음)."""
    spec = importlib.util.spec_from_file_location(name, str(_SCRIPTS / filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# --- P1: 전용 ThreadPoolExecutor + 대기 상한 ---

def test_dedicated_executor_single_worker():
    import concurrent.futures

    assert isinstance(fc._EXECUTOR, concurrent.futures.ThreadPoolExecutor)
    assert fc._EXECUTOR._max_workers == 1
    assert fc.MAX_PENDING == 2
    assert not hasattr(fc, "_infer_lock")


async def test_handler_runs_in_dedicated_pool_thread(monkeypatch, _secret):
    monkeypatch.setattr(fc, "_download", _fake_download(_png_bytes()))
    names = []

    def _det(img):
        names.append(threading.current_thread().name)
        return 0.9

    fc.set_detector(_det)
    _, body = await _post()
    assert body == {"ok": True}
    assert names and all(n.startswith("face-check") for n in names)


async def test_handler_rejects_when_pending_over_cap(monkeypatch, _secret):
    gate = asyncio.Event()
    entered = []

    async def _slow(url):
        entered.append(url)
        await gate.wait()
        return _png_bytes()

    monkeypatch.setattr(fc, "_download", _slow)
    fc.set_detector(lambda img: 0.9)
    async with TestClient(TestServer(_app())) as client:
        t1 = asyncio.ensure_future(client.post("/face-check", json=_BODY, headers=_AUTH))
        t2 = asyncio.ensure_future(client.post("/face-check", json=_BODY, headers=_AUTH))
        for _ in range(200):
            if len(entered) >= 2:
                break
            await asyncio.sleep(0.01)
        assert fc._pending == 2
        r3 = await client.post("/face-check", json=_BODY, headers=_AUTH)
        assert await r3.json() == {"ok": False, "reason": "CHECK_FAILED"}
        assert len(entered) == 2  # 세 번째는 다운로드조차 하지 않는다
        gate.set()
        r1, r2 = await t1, await t2
        assert await r1.json() == {"ok": True}
        assert await r2.json() == {"ok": True}
    assert fc._pending == 0


async def test_pending_released_on_failure(monkeypatch, _secret):
    async def _boom(url):
        raise RuntimeError("x")

    monkeypatch.setattr(fc, "_download", _boom)
    _, body = await _post()
    assert body == {"ok": False, "reason": "CHECK_FAILED"}
    assert fc._pending == 0


# --- P2: env 안전 해석 + import 격리 ---

def test_env_parsers_fall_back_on_bad_values(monkeypatch, caplog):
    monkeypatch.setenv("X_FLOAT", "abc")
    monkeypatch.setenv("X_INT", "3.5x")
    monkeypatch.setenv("X_NAN", "nan")
    with caplog.at_level(logging.WARNING):
        assert fc._env_float("X_FLOAT", 0.2) == 0.2
        assert fc._env_int("X_INT", 3) == 3
        assert fc._env_float("X_NAN", 0.2) == 0.2
    assert "X_FLOAT" in caplog.text
    monkeypatch.setenv("X_FLOAT", " 0.35 ")
    monkeypatch.setenv("X_INT", "4")
    assert fc._env_float("X_FLOAT", 0.2) == 0.35
    assert fc._env_int("X_INT", 3) == 4
    monkeypatch.delenv("X_FLOAT")
    assert fc._env_float("X_FLOAT", 0.2) == 0.2


def test_module_import_survives_bad_env(monkeypatch):
    monkeypatch.setenv("FACE_CHECK_SCORE_MIN", "oops")
    monkeypatch.setenv("FACE_CHECK_PASS_MIN", "")
    monkeypatch.setenv("FACE_CHECK_MAX_SIDE", "big")
    mod = _load_isolated("face_check_badenv", "face_check.py")
    try:
        assert mod.FACE_SCORE_MIN == 0.2
        assert mod.PASS_MIN == 3
        assert mod.MAX_SIDE == 1280
    finally:
        mod._EXECUTOR.shutdown(wait=False)


async def test_signaling_skips_route_when_face_check_import_fails(monkeypatch):
    monkeypatch.setenv("PREBUILD_SECRET", "test-secret")
    monkeypatch.setitem(sys.modules, "face_check", None)  # import 시 ImportError
    mod = _load_isolated("signaling_facecheck_off", "signaling.py")
    assert mod.face_check_handler is None
    async with TestClient(TestServer(mod.make_app())) as client:
        resp = await client.post("/face-check", json=_BODY)
        assert resp.status in (404, 405)
        assert (await client.get("/healthz")).status != 404


def _try_guarded_import(path: pathlib.Path, module: str) -> bool:
    """module 의 import 가 try/except Exception(이상) 안에 있는지."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.Try):
            imports = [n for n in node.body if isinstance(n, ast.ImportFrom) and n.module == module]
            if imports and node.handlers:
                return True
    return False


def test_signaling_face_check_import_is_guarded():
    assert _try_guarded_import(_SCRIPTS / "signaling.py", "face_check")


def test_inference_lib_face_threshold_import_is_guarded_with_passthrough():
    """inference_lib 는 torch·MuseTalk 를 import 해서 여기서 못 불러온다 → 소스에서 except 블록만 떼어 실행."""
    src = (_SCRIPTS / "inference_lib.py").read_text(encoding="utf-8")
    tree = ast.parse(src)
    target = None
    for node in ast.walk(tree):
        if isinstance(node, ast.Try) and any(
            isinstance(n, ast.ImportFrom) and n.module == "face_threshold" for n in node.body
        ):
            target = node
    assert target is not None, "face_threshold import 가 try 로 감싸여 있지 않음"
    h = target.handlers[0]
    ns = {"sys": sys, (h.name or "_e"): ImportError("simulated")}
    exec(compile(ast.Module(body=target.handlers[0].body, type_ignores=[]), "x", "exec"), ns)
    fn = ns["landmarks_with_fallback"]
    calls = []

    def get_fn(imgs, shift):
        calls.append((imgs, shift))
        return ("coords", "frames")

    assert fn(get_fn, ["a"], 3, (0, 0, 0, 0)) == ("coords", "frames")
    assert calls == [(["a"], 3)]


# --- P3: SSRF 검증(DNS)은 루프 밖에서 ---

async def test_download_validates_url_off_loop(monkeypatch):
    monkeypatch.setenv("PRETHIRD_ASSET_HOST_ALLOWLIST", "img.example.com")
    loop_thread = threading.get_ident()
    seen = []

    def _v(url):
        seen.append(threading.get_ident())
        raise ValueError("blocked")

    monkeypatch.setattr(fc, "_validate_url", _v)
    with pytest.raises(ValueError):
        await fc._download("https://img.example.com/a.png")
    assert seen and seen[0] != loop_thread


# --- P4: 디코드 전 화소 상한 ---

def _png_header(w: int, h: int) -> bytes:
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    chunk = struct.pack(">I", len(ihdr)) + b"IHDR" + ihdr
    return b"\x89PNG\r\n\x1a\n" + chunk + struct.pack(">I", zlib.crc32(b"IHDR" + ihdr))


def _jpeg_header(w: int, h: int, sof: int = 0xC0) -> bytes:
    app0 = b"\xff\xe0" + struct.pack(">H", 16) + b"JFIF\x00" + b"\x01\x01\x00\x00\x01\x00\x01\x00\x00"
    sofseg = bytes([0xFF, sof]) + struct.pack(">HBHHB", 11, 8, h, w, 1) + b"\x01\x11\x00"
    return b"\xff\xd8" + app0 + b"\xff\xff" + sofseg + b"\xff\xda\x00\x02"


def _riff(fourcc: bytes, payload: bytes) -> bytes:
    chunk = fourcc + struct.pack("<I", len(payload)) + payload
    return b"RIFF" + struct.pack("<I", 4 + len(chunk)) + b"WEBP" + chunk


def _webp_vp8(w, h):
    return _riff(b"VP8 ", b"\x00\x00\x00" + b"\x9d\x01\x2a" + struct.pack("<HH", w, h) + b"\0" * 4)


def _webp_vp8l(w, h):
    bits = (w - 1) | ((h - 1) << 14)
    return _riff(b"VP8L", b"\x2f" + struct.pack("<I", bits) + b"\0" * 4)


def _webp_vp8x(w, h):
    wb = (w - 1).to_bytes(3, "little")
    hb = (h - 1).to_bytes(3, "little")
    return _riff(b"VP8X", b"\0\0\0\0" + wb + hb)


def test_image_dims_png():
    assert fc.image_dims(_png_header(640, 480)) == (640, 480)
    assert fc.image_dims(_png_bytes()) == (80, 100)


def test_image_dims_jpeg_sof_variants():
    assert fc.image_dims(_jpeg_header(1920, 1080)) == (1920, 1080)
    assert fc.image_dims(_jpeg_header(300, 200, 0xC2)) == (300, 200)  # progressive
    ok, buf = cv2.imencode(".jpg", _img())
    assert fc.image_dims(buf.tobytes()) == (80, 100)


def test_image_dims_jpeg_ignores_dht_c4():
    dht = b"\xff\xc4" + struct.pack(">H", 5) + b"\x00\x00\x00"
    data = b"\xff\xd8" + dht + _jpeg_header(10, 20)[2:]
    assert fc.image_dims(data) == (10, 20)


def test_image_dims_webp_all_three():
    assert fc.image_dims(_webp_vp8(640, 480)) == (640, 480)
    assert fc.image_dims(_webp_vp8l(16383, 2)) == (16383, 2)
    assert fc.image_dims(_webp_vp8x(16777216, 3)) == (16777216, 3)


def test_image_dims_unknown_or_truncated_returns_none():
    assert fc.image_dims(b"") is None
    assert fc.image_dims(b"not an image") is None
    assert fc.image_dims(_png_header(10, 10)[:20]) is None
    assert fc.image_dims(b"\xff\xd8\xff\xe0\x00") is None
    assert fc.image_dims(b"\xff\xd8\xff\xda\x00\x02") is None  # SOF 전에 SOS
    assert fc.image_dims(_webp_vp8(640, 480)[:24]) is None


def test_decode_rejects_huge_pixels_before_imdecode(monkeypatch):
    called = []
    monkeypatch.setattr(fc.cv2, "imdecode", lambda *a, **k: called.append(1))
    with pytest.raises(ValueError, match="pixels"):
        fc._decode(_png_header(10000, 4001))  # 40,010,000 > 40,000,000
    with pytest.raises(ValueError, match="pixels"):
        fc._decode(_webp_vp8x(20000, 20000))
    assert called == []


def test_decode_allows_limit_boundary_and_unknown(monkeypatch):
    seen = []

    def _imdecode(arr, flag):
        seen.append(arr.size)
        return np.zeros((2, 2, 3), np.uint8)

    monkeypatch.setattr(fc.cv2, "imdecode", _imdecode)
    fc._decode(_png_header(10000, 4000))  # 정확히 40,000,000 은 허용
    fc._decode(b"mystery-format-bytes")   # 형식 모름 → imdecode 로 넘긴다
    assert len(seen) == 2


def test_pixel_limits():
    assert fc.MAX_PIXELS == 40_000_000
    assert os.environ.get("OPENCV_IO_MAX_IMAGE_PIXELS") is not None


def test_opencv_pixel_env_set_before_cv2_import():
    src = (_SCRIPTS / "face_check.py").read_text(encoding="utf-8")
    assert src.index('setdefault("OPENCV_IO_MAX_IMAGE_PIXELS"') < src.index("import cv2")


async def test_handler_huge_png_check_failed(monkeypatch, _secret):
    monkeypatch.setattr(fc, "_download", _fake_download(_png_header(50000, 50000)))
    fc.set_detector(lambda img: 0.9)
    _, body = await _post()
    assert body == {"ok": False, "reason": "CHECK_FAILED"}


# --- P5: allowlist 비면 거부 ---

async def test_download_refuses_without_allowlist(monkeypatch, caplog):
    monkeypatch.delenv("PRETHIRD_ASSET_HOST_ALLOWLIST", raising=False)
    called = []
    monkeypatch.setattr(fc, "_validate_url", lambda url: called.append(url))
    with caplog.at_level(logging.WARNING):
        with pytest.raises(ValueError, match="allowlist"):
            await fc._download("https://img.example.com/a.png")
    assert called == []
    assert "PRETHIRD_ASSET_HOST_ALLOWLIST" in caplog.text


async def test_handler_check_failed_without_allowlist(monkeypatch, _secret):
    monkeypatch.setenv("PRETHIRD_ASSET_HOST_ALLOWLIST", "  ")
    fc.set_detector(lambda img: 0.9)
    _, body = await _post()
    assert body == {"ok": False, "reason": "CHECK_FAILED"}


# --- P6: 비ASCII 인증 헤더는 401 ---

def test_authorized_non_ascii_header_false(monkeypatch):
    monkeypatch.setenv("PREBUILD_SECRET", "test-secret")
    req = make_mocked_request("POST", "/face-check", headers={"Authorization": "Bearer 비밀번호"})
    assert fc._authorized(req) is False
    req2 = make_mocked_request("POST", "/face-check", headers={"Authorization": "Bearer test-secret"})
    assert fc._authorized(req2) is True


def test_authorized_non_ascii_secret_matches(monkeypatch):
    monkeypatch.setenv("PREBUILD_SECRET", "비밀")
    req = make_mocked_request("POST", "/face-check", headers={"Authorization": "Bearer 비밀"})
    assert fc._authorized(req) is True


async def test_handler_non_ascii_bearer_401(monkeypatch):
    monkeypatch.setenv("PREBUILD_SECRET", "test-secret")
    req = make_mocked_request("POST", "/face-check", headers={"Authorization": "Bearer 한글"})
    resp = await fc.face_check_handler(req)
    assert resp.status == 401


# --- P7: 예외 로그는 %r ---

async def test_failure_log_uses_repr(monkeypatch, _secret, caplog):
    async def _boom(url):
        raise ValueError("line1\nline2")

    monkeypatch.setattr(fc, "_download", _boom)
    with caplog.at_level(logging.WARNING, logger="prethird.face_check"):
        await _post()
    assert "line1\\nline2" in caplog.text
