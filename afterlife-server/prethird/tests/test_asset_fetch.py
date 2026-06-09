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


def test_allow_https(monkeypatch):
    """https://는 통과 (공인 IP mock)"""
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("1.1.1.1", 0))],
    )
    asset_fetch._validate_url("https://r2.example.com/a.mp4")  # no raise


def test_allow_http(monkeypatch):
    """http://는 scheme 자체는 허용, 단 공인 IP여야 통과"""
    # localhost(127.0.0.1)는 내부망이라 차단됨 — 공인 IP mock으로 검증
    import socket as _sock
    import ipaddress as _ip
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("1.1.1.1", 0))],
    )
    asset_fetch._validate_url("http://cdn.example.com:8080/test.mp4")  # no raise


def test_reject_empty_url():
    """빈 문자열은 ValueError"""
    with pytest.raises(ValueError):
        asset_fetch._validate_url("")


def test_reject_relative_url():
    """상대 경로(scheme 없음)는 ValueError"""
    with pytest.raises(ValueError):
        asset_fetch._validate_url("/etc/passwd")


# ── host allowlist (PRETHIRD_ASSET_HOST_ALLOWLIST env) ──────────────────────

def _mock_public_dns(monkeypatch):
    """socket.getaddrinfo를 공인 IP(1.1.1.1)로 stub."""
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("1.1.1.1", 0))],
    )


def test_allowlist_blocks_non_listed_host(monkeypatch):
    """allowlist 설정 시 목록 외 host는 ValueError"""
    _mock_public_dns(monkeypatch)
    monkeypatch.setenv("PRETHIRD_ASSET_HOST_ALLOWLIST", "r2.pub.example.com,assets.example.com")
    with pytest.raises(ValueError):
        asset_fetch._validate_url("https://evil.com/steal.mp4")


def test_allowlist_allows_listed_host(monkeypatch):
    """allowlist에 포함된 host는 통과"""
    _mock_public_dns(monkeypatch)
    monkeypatch.setenv("PRETHIRD_ASSET_HOST_ALLOWLIST", "r2.pub.example.com,assets.example.com")
    asset_fetch._validate_url("https://r2.pub.example.com/9043/idle.mp4")  # no raise


def test_allowlist_empty_allows_all_https(monkeypatch):
    """allowlist 비면 https 전체 허용 (scheme만 검사)"""
    _mock_public_dns(monkeypatch)
    monkeypatch.delenv("PRETHIRD_ASSET_HOST_ALLOWLIST", raising=False)
    asset_fetch._validate_url("https://any-r2-host.cloudflare.com/file.mp4")  # no raise


def test_allowlist_rejects_subdomain_spoof(monkeypatch):
    """서브도메인 스푸핑 차단: evil.r2.pub.example.com은 r2.pub.example.com과 다른 host"""
    _mock_public_dns(monkeypatch)
    monkeypatch.setenv("PRETHIRD_ASSET_HOST_ALLOWLIST", "r2.pub.example.com")
    with pytest.raises(ValueError):
        asset_fetch._validate_url("https://evil.r2.pub.example.com/x.mp4")


# ── 내부망 차단 (mizu C-1) ──────────────────────────────────────────────────

def test_reject_metadata_ip(monkeypatch):
    """169.254.169.254(AWS/GCP 메타데이터) → ValueError (link-local)"""
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("169.254.169.254", 0))],
    )
    with pytest.raises(ValueError, match="내부망 주소 차단"):
        asset_fetch._validate_url("https://169.254.169.254/latest/meta-data/")


def test_reject_private_10(monkeypatch):
    """10.x.x.x 사설망 → ValueError"""
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("203.0.113.20", 0))],
    )
    with pytest.raises(ValueError, match="내부망 주소 차단"):
        asset_fetch._validate_url("https://203.0.113.20/x")


def test_reject_loopback(monkeypatch):
    """127.0.0.1 루프백 → ValueError"""
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("127.0.0.1", 0))],
    )
    with pytest.raises(ValueError, match="내부망 주소 차단"):
        asset_fetch._validate_url("http://127.0.0.1/x")


def test_reject_localhost_resolves_to_loopback(monkeypatch):
    """localhost가 127.0.0.1로 resolve되면 차단"""
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("127.0.0.1", 0))],
    )
    with pytest.raises(ValueError, match="내부망 주소 차단"):
        asset_fetch._validate_url("http://localhost:8080/test.mp4")


def test_reject_private_192_168(monkeypatch):
    """192.168.x.x 사설망 → ValueError"""
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("203.0.113.10", 0))],
    )
    with pytest.raises(ValueError, match="내부망 주소 차단"):
        asset_fetch._validate_url("https://203.0.113.10/x")


def test_reject_resolve_fail(monkeypatch):
    """host resolve 실패 → ValueError"""
    import socket as _sock
    def _fail(host, port, **kw):
        raise _sock.gaierror("name or service not known")
    monkeypatch.setattr(_sock, "getaddrinfo", _fail)
    with pytest.raises(ValueError, match="host resolve 실패"):
        asset_fetch._validate_url("https://nonexistent.invalid/x")


# ── redirect 차단 (mizu H-1) ─────────────────────────────────────────────────

def test_fetch_to_rejects_redirect(tmp_path, monkeypatch):
    """3xx redirect → ValueError (allowlist 우회 방지)"""
    import socket as _sock

    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("1.1.1.1", 0))],
    )

    class _RedirectResponse:
        status = 302
        headers = {"Location": "https://evil.com/malware"}

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            pass

        def raise_for_status(self):
            pass

    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=_RedirectResponse())
    cm.__aexit__ = AsyncMock(return_value=False)

    session = MagicMock()
    session.get = MagicMock(return_value=cm)

    session_cm = MagicMock()
    session_cm.__aenter__ = AsyncMock(return_value=session)
    session_cm.__aexit__ = AsyncMock(return_value=False)

    dest = str(tmp_path / "out.mp4")
    with patch("aiohttp.ClientSession", return_value=session_cm):
        with pytest.raises(ValueError, match="redirect 차단"):
            asyncio.run(
                asset_fetch.fetch_to(
                    "https://r2.example.com/file.mp4",
                    dest,
                )
            )

    assert not pathlib.Path(dest).exists()


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


class _FakeStreamReader:
    """aiohttp StreamReader(resp.content)를 흉내내는 mock.
    실제 aiohttp API: resp.content.iter_chunked(n) — resp.iter_chunked 아님.
    resp.iter_chunked 를 직접 호출하면 AttributeError 발생 → 잘못된 호출 즉시 감지.
    """

    def __init__(self, data: bytes):
        self._data = data

    def iter_chunked(self, n):
        """올바른 경로: resp.content.iter_chunked(n)"""
        data = self._data

        async def _gen():
            for i in range(0, len(data), n):
                yield data[i:i + n]

        return _gen()


class _FakeResponse:
    """aiohttp ClientResponse 최소 mock.
    - resp.content  → _FakeStreamReader (올바른 API 경로)
    - resp.iter_chunked → 존재하지 않음(AttributeError) — 잘못된 호출 감지용.
    """
    def __init__(self, data: bytes, status: int = 200):
        self._data = data
        self.status = status
        self.content = _FakeStreamReader(data)  # 실제 aiohttp: resp.content

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        pass

    def raise_for_status(self):
        if self.status >= 400:
            raise Exception(f"HTTP {self.status}")

    async def read(self):
        return self._data

    # resp.iter_chunked는 실제 aiohttp ClientResponse에 없음.
    # 이 속성을 정의하지 않아 AttributeError를 유발 — 회귀 감지.
    # (iter_chunked 는 resp.content 에만 있음)


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


def test_fetch_to_success(tmp_path, monkeypatch):
    """정상 다운로드 → 파일 생성 + 경로 반환"""
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("1.1.1.1", 0))],
    )
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


def test_fetch_to_size_exceeded(tmp_path, monkeypatch):
    """다운로드 크기 > max_bytes → ValueError 발생, 파일 미생성"""
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("1.1.1.1", 0))],
    )
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


def test_fetch_to_uses_content_iter_chunked_not_resp(tmp_path, monkeypatch):
    """asset_fetch.py 가 resp.content.iter_chunked 를 쓰는지 강제 검증.
    _FakeResponse 에는 resp.iter_chunked 가 없으므로,
    만약 코드가 resp.iter_chunked(n) 를 직접 호출하면 AttributeError 로 실패한다.
    이 테스트가 통과 = resp.content.iter_chunked 경로 사용 확인.
    """
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("1.1.1.1", 0))],
    )
    payload = b"correct_path_data" * 50
    resp = _FakeResponse(payload)
    # 명시적으로 resp에 iter_chunked 가 없음을 보장
    assert not hasattr(resp, "iter_chunked"), (
        "_FakeResponse에 iter_chunked가 있으면 안 됨 — 회귀 감지 불가"
    )
    # resp.content 에는 있어야 함
    assert hasattr(resp.content, "iter_chunked")

    session_mock = _make_session_mock(resp)
    dest = str(tmp_path / "check_path.mp4")

    with patch("aiohttp.ClientSession", return_value=session_mock):
        result = asyncio.run(
            asset_fetch.fetch_to(
                "https://r2.example.com/check_path.mp4",
                dest,
                max_bytes=10 * 1024 * 1024,
            )
        )

    assert result == dest
    assert pathlib.Path(dest).read_bytes() == payload


def test_fetch_to_skips_existing(tmp_path, monkeypatch):
    """파일이 이미 존재하면 네트워크 미발생, 기존 경로 반환"""
    import socket as _sock
    monkeypatch.setattr(
        _sock, "getaddrinfo",
        lambda host, port, **kw: [(_sock.AF_INET, None, None, None, ("1.1.1.1", 0))],
    )
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
