"""filler_cache.py — 통화 필러 mp4 로컬 캐시 경로/정리 헬퍼 (stdlib only).

배경: signaling 은 필러 mp4 를 `{VIDEO_REF_ROOT}/{clone_id}/` 아래로 다운로드해 캐시한다.
기존엔 dest 파일명이 `{clone_id}-filler-{idx}.mp4` 고정이라, asset_fetch.fetch_to 의
"파일 존재 시 skip" 동작 때문에 **필러를 재생성해도 옛 캐시를 계속 사용**했다
(히즈키 실측: 통화가 이틀 옛 필러를 재생). file_id 를 파일명에 포함하면 URL 이
바뀔 때(=재생성) 새 파일명 → 재다운로드된다. signaling 의 무거운 의존성 없이
단위 테스트하기 위해 별도 모듈로 분리.
"""
from __future__ import annotations

import pathlib


def filler_cache_dest(root: str, clone_id, idx: int, url: str) -> str:
    """filler 캐시 dest 경로 — URL 의 파일 ID 를 파일명에 포함(재생성 자동 캐시버스트)."""
    fid = str(url).split("?")[0].rstrip("/").rsplit("/", 1)[-1] or "x"
    fid = "".join(c for c in fid if c.isalnum() or c in "._-") or "x"  # 파일명 안전화
    return f"{root}/{clone_id}-filler-{idx}-{fid}.mp4"


def prune_stale_fillers(root: str, clone_id, idx: int, keep: str) -> None:
    """같은 (clone_id, idx)의 다른 file_id 캐시 + legacy 무-id 캐시 제거(keep 제외).

    캐시를 idx당 1개(현재 버전)로 유지 — 재생성 누적으로 디스크가 불어나지 않게 한다.
    디렉토리 미존재/삭제 실패는 조용히 무시(다운로드 자체는 fetch_to 가 진행).
    """
    d = pathlib.Path(root)
    if not d.is_dir():
        return
    stale = list(d.glob(f"{clone_id}-filler-{idx}-*.mp4"))
    legacy = d / f"{clone_id}-filler-{idx}.mp4"
    if legacy.exists():
        stale.append(legacy)
    for p in stale:
        if str(p) != keep:
            try:
                p.unlink()
            except OSError:
                pass
