"""
tests/test_asset_fetch.py — asset_fetch R2 pull TDD
Step 1: 실패 테스트 먼저 작성, Step 2에서 구현 후 통과
"""
import sys
import pathlib
import os
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asset_fetch


# ── _validate_url ────────────────────────────────────────────────────────────

def test_reject_non_http():
    """file:// scheme은 ValueError"""
    with pytest.raises(ValueError):
        asset_fetch._validate_url("file:///etc/passwd")


def test_reject_non_http_ftp():
    """ftp:// scheme은 ValueError"""
    with pytest.raises(ValueError):
        asset_fetch._validate_url("ftp://x/y")


def test_reject_javascript_scheme():
    """javascript: scheme은 ValueError"""
    with pytest.raises(ValueError):
        asset_fetch._validate_url("javascript:alert(1)")


def test_reject_data_scheme():
    """data: scheme은 ValueError"""
    with pytest.raises(ValueError):
        asset_fetch._validate_url("data:text/plain;base64,abc")


def test_allow_https():
    """https://는 통과 (예외 없음)"""
    asset_fetch._validate_url("https://r2.example.com/a.mp4")  # no raise


def test_allow_http():
    """http://는 통과 (예외 없음) — 개발/내부망 허용"""
    asset_fetch._validate_url("http://localhost:8080/test.mp4")  # no raise


def test_reject_empty_url():
    """빈 문자열은 ValueError"""
    with pytest.raises(ValueError):
        asset_fetch._validate_url("")


def test_reject_relative_url():
    """상대 경로(scheme 없음)는 ValueError"""
    with pytest.raises(ValueError):
        asset_fetch._validate_url("/etc/passwd")


# ── host allowlist (PRETHIRD_ASSET_HOST_ALLOWLIST env) ──────────────────────

def test_allowlist_blocks_non_listed_host(monkeypatch):
    """allowlist 설정 시 목록 외 host는 ValueError"""
    monkeypatch.setenv("PRETHIRD_ASSET_HOST_ALLOWLIST", "r2.pub.example.com,assets.example.com")
    with pytest.raises(ValueError):
        asset_fetch._validate_url("https://evil.com/steal.mp4")


def test_allowlist_allows_listed_host(monkeypatch):
    """allowlist에 포함된 host는 통과"""
    monkeypatch.setenv("PRETHIRD_ASSET_HOST_ALLOWLIST", "r2.pub.example.com,assets.example.com")
    asset_fetch._validate_url("https://r2.pub.example.com/9043/idle.mp4")  # no raise


def test_allowlist_empty_allows_all_https(monkeypatch):
    """allowlist 비면 https 전체 허용 (scheme만 검사)"""
    monkeypatch.delenv("PRETHIRD_ASSET_HOST_ALLOWLIST", raising=False)
    asset_fetch._validate_url("https://any-r2-host.cloudflare.com/file.mp4")  # no raise


def test_allowlist_rejects_subdomain_spoof(monkeypatch):
    """서브도메인 스푸핑 차단: evil.r2.pub.example.com은 r2.pub.example.com과 다른 host"""
    monkeypatch.setenv("PRETHIRD_ASSET_HOST_ALLOWLIST", "r2.pub.example.com")
    with pytest.raises(ValueError):
        asset_fetch._validate_url("https://evil.r2.pub.example.com/x.mp4")


# ── _safe_dest ───────────────────────────────────────────────────────────────

def test_safe_dest_rejects_traversal():
    """../로 base 바깥 탈출 시도 → ValueError"""
    with pytest.raises(ValueError):
        asset_fetch._safe_dest("/base", "../../etc/x")


def test_safe_dest_rejects_absolute_rel():
    """rel이 절대경로면 ValueError"""
    with pytest.raises(ValueError):
        asset_fetch._safe_dest("/base", "/etc/passwd")


def test_safe_dest_ok():
    """정상 상대경로 → /base/ 하위 절대경로 반환"""
    d = asset_fetch._safe_dest("/base", "9043/9043-idle.mp4")
    assert d.startswith("/base/")


def test_safe_dest_nested_ok():
    """중첩 디렉토리 정상 경로 → /base/ 하위 반환"""
    d = asset_fetch._safe_dest("/base", "clones/abc123/idle.mp4")
    assert d == "/base/clones/abc123/idle.mp4"


def test_safe_dest_traversal_with_encoded(tmp_path):
    """null byte나 인코딩 포함 시도도 차단"""
    with pytest.raises(ValueError):
        asset_fetch._safe_dest(str(tmp_path), "../outside/file.mp4")


# ── fetch_to (async, 실제 네트워크 없이 mock) ────────────────────────────────

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch


class _FakeResponse:
    """aiohttp ClientResponse 최소 mock"""
    def __init__(self, data: bytes, status: int = 200):
        self._data = data
        self.status = status

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        pass

    def raise_for_status(self):
        if self.status >= 400:
            raise Exception(f"HTTP {self.status}")

    async def read(self):
        return self._data

    def iter_chunked(self, n):
        """청크 단위 비동기 이터레이터 mock"""
        data = self._data

        async def _gen():
            for i in range(0, len(data), n):
                yield data[i:i + n]

        return _gen()


def _make_session_mock(resp: _FakeResponse):
    """aiohttp.ClientSession.get() context manager mock"""
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=resp)
    cm.__aexit__ = AsyncMock(return_value=False)

    session = MagicMock()
    session.get = MagicMock(return_value=cm)

    session_cm = MagicMock()
    session_cm.__aenter__ = AsyncMock(return_value=session)
    session_cm.__aexit__ = AsyncMock(return_value=False)
    return session_cm


def test_fetch_to_success(tmp_path):
    """정상 다운로드 → 파일 생성 + 경로 반환"""
    payload = b"fake_video_data" * 100
    resp = _FakeResponse(payload)
    session_mock = _make_session_mock(resp)

    dest = str(tmp_path / "9043" / "idle.mp4")

    with patch("aiohttp.ClientSession", return_value=session_mock):
        result = asyncio.run(
            asset_fetch.fetch_to(
                "https://r2.example.com/9043/idle.mp4",
                dest,
                max_bytes=10 * 1024 * 1024,
            )
        )

    assert result == dest
    assert pathlib.Path(dest).exists()
    assert pathlib.Path(dest).read_bytes() == payload


def test_fetch_to_size_exceeded(tmp_path):
    """다운로드 크기 > max_bytes → ValueError 발생, 파일 미생성"""
    payload = b"x" * 200
    resp = _FakeResponse(payload)
    session_mock = _make_session_mock(resp)

    dest = str(tmp_path / "big.mp4")

    with patch("aiohttp.ClientSession", return_value=session_mock):
        with pytest.raises(ValueError, match="size_exceeded"):
            asyncio.run(
                asset_fetch.fetch_to(
                    "https://r2.example.com/big.mp4",
                    dest,
                    max_bytes=100,  # 100 bytes limit
                )
            )

    assert not pathlib.Path(dest).exists()


def test_fetch_to_rejects_bad_scheme(tmp_path):
    """잘못된 scheme → _validate_url에서 ValueError (네트워크 전혀 미발생)"""
    dest = str(tmp_path / "out.mp4")
    with pytest.raises(ValueError):
        asyncio.run(
            asset_fetch.fetch_to(
                "file:///etc/passwd",
                dest,
                max_bytes=10 * 1024 * 1024,
            )
        )


def test_fetch_to_skips_existing(tmp_path):
    """파일이 이미 존재하면 네트워크 미발생, 기존 경로 반환"""
    dest = tmp_path / "existing.mp4"
    dest.write_bytes(b"already_there")

    with patch("aiohttp.ClientSession") as mock_session:
        result = asyncio.run(
            asset_fetch.fetch_to(
                "https://r2.example.com/existing.mp4",
                str(dest),
                max_bytes=10 * 1024 * 1024,
            )
        )

    mock_session.assert_not_called()
    assert result == str(dest)
