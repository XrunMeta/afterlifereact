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
