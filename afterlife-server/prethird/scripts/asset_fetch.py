"""
asset_fetch.py — prethird R2 자산 pull 모듈
SSRF·path-traversal 방어 포함.

참조: afterlife-server/testbed/orchestrator/assetFetch.js

보안:
  - SSRF: URL 파싱 후 scheme 검증(http/https만). host allowlist env 설정 시 host 비교(파싱 기반, startsWith 우회 차단).
  - Path traversal: os.path.realpath로 base 경계 밖 탈출 차단.
  - 다운로드 크기 제한: 청크 누적 > max_bytes 시 즉시 중단·예외.

환경변수:
  PRETHIRD_ASSET_HOST_ALLOWLIST — 쉼표 구분 허용 host 목록. 비면 https/http 전체 허용.
  PRETHIRD_ASSET_MAX_BYTES      — 기본 다운로드 상한 (기본 50MB).
"""

import os
import asyncio
import pathlib
from urllib.parse import urlparse

import aiohttp

# ── 환경변수 기본값 ──────────────────────────────────────────────────────────

_DEFAULT_MAX_BYTES = int(os.environ.get("PRETHIRD_ASSET_MAX_BYTES", str(50 * 1024 * 1024)))  # 50MB

# ── 내부 헬퍼 ────────────────────────────────────────────────────────────────

def _validate_url(url: str) -> None:
    """
    url이 http/https scheme인지 파싱 기반으로 검증.
    PRETHIRD_ASSET_HOST_ALLOWLIST env가 설정돼 있으면 host도 검사.

    Parameters
    ----------
    url : str
        검증할 URL 문자열.

    Raises
    ------
    ValueError
        scheme이 http/https가 아니거나, host allowlist 미포함 시.
    """
    if not url:
        raise ValueError(f"url이 비어있습니다: {url!r}")

    try:
        parsed = urlparse(url)
    except Exception as e:
        raise ValueError(f"URL 파싱 실패: {url!r} — {e}") from e

    # scheme 검사: http/https만 허용
    if parsed.scheme not in ("http", "https"):
        raise ValueError(
            f"허용되지 않는 scheme: {parsed.scheme!r} (url={url!r}). http/https만 허용."
        )

    # host 필수
    if not parsed.hostname:
        raise ValueError(f"URL에 host가 없습니다: {url!r}")

    # host allowlist 검사 (env 있을 때만)
    allowlist_raw = os.environ.get("PRETHIRD_ASSET_HOST_ALLOWLIST", "").strip()
    if allowlist_raw:
        allowed_hosts = {h.strip() for h in allowlist_raw.split(",") if h.strip()}
        if parsed.hostname not in allowed_hosts:
            raise ValueError(
                f"host allowlist 미포함: {parsed.hostname!r} (허용={allowed_hosts}, url={url!r})"
            )


def _safe_dest(base: str, rel: str) -> str:
    """
    base 디렉토리 하위에 rel 경로를 안전하게 결합. path traversal 방어.

    Parameters
    ----------
    base : str
        기준 디렉토리 절대경로.
    rel : str
        상대경로 (예: "9043/9043-idle.mp4").

    Returns
    -------
    str
        base 하위에 있는 안전한 절대경로.

    Raises
    ------
    ValueError
        rel이 절대경로이거나, 결합 결과가 base 경계 밖일 때.
    """
    # rel이 절대경로면 즉시 차단
    if os.path.isabs(rel):
        raise ValueError(f"rel이 절대경로입니다 (path traversal 차단): {rel!r}")

    resolved_base = os.path.realpath(base)
    candidate = os.path.realpath(os.path.join(base, rel))

    # candidate가 base 하위인지 확인 (sep 포함으로 prefix 스푸핑 방지)
    if candidate != resolved_base and not candidate.startswith(resolved_base + os.sep):
        raise ValueError(
            f"path traversal 차단: {rel!r} → {candidate!r} (base={resolved_base!r} 밖)"
        )

    return candidate


# ── 메인 API ─────────────────────────────────────────────────────────────────

async def fetch_to(
    url: str,
    dest: str,
    max_bytes: int = _DEFAULT_MAX_BYTES,
) -> str:
    """
    url을 dest 경로로 스트리밍 다운로드. 이미 존재하면 skip.

    Parameters
    ----------
    url : str
        다운로드할 R2/CF URL.
    dest : str
        저장할 로컬 절대경로.
    max_bytes : int
        최대 허용 바이트 수 (기본 PRETHIRD_ASSET_MAX_BYTES env, 없으면 50MB).

    Returns
    -------
    str
        저장된(또는 이미 존재하는) 파일의 절대경로.

    Raises
    ------
    ValueError
        URL scheme/host 검증 실패 또는 크기 초과 시.
    aiohttp.ClientResponseError
        HTTP 오류 응답 시.
    """
    # SSRF 방어: scheme/host 검증
    _validate_url(url)

    # 이미 존재하면 skip (orchestrator assetFetch.js 패턴 동일)
    if os.path.exists(dest):
        return dest

    # 디렉토리 생성 (mkdir -p)
    pathlib.Path(dest).parent.mkdir(parents=True, exist_ok=True)

    tmp_dest = dest + ".tmp"
    downloaded = 0

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            resp.raise_for_status()

            try:
                async for chunk in resp.iter_chunked(64 * 1024):  # 64KB 청크
                    downloaded += len(chunk)
                    if downloaded > max_bytes:
                        raise ValueError(
                            f"size_exceeded: downloaded={downloaded} > max_bytes={max_bytes} (url={url!r})"
                        )
                    # 청크 단위로 tmp 파일에 쓰기
                    mode = "ab" if os.path.exists(tmp_dest) else "wb"
                    with open(tmp_dest, mode) as f:
                        f.write(chunk)
            except ValueError:
                # 크기 초과 — tmp 파일 정리
                if os.path.exists(tmp_dest):
                    os.remove(tmp_dest)
                raise

    # 완전히 받은 후 rename (원자적 교체)
    os.replace(tmp_dest, dest)
    return dest
