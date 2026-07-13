"""tests/test_filler_cache.py — 필러 캐시 file_id 캐시버스트 (히즈키: 통화가 옛 필러 재생).

filler_cache_dest 는 URL의 file_id를 파일명에 넣어 재생성(=URL 변경) 시 새 파일명→재다운로드.
prune_stale_fillers 는 같은 idx의 옛 file_id/legacy 캐시를 정리(idx당 1개 유지).
"""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from filler_cache import filler_cache_dest, prune_stale_fillers  # noqa: E402

def test_dest_includes_file_id():
    url = "https://oth-path.example/oth-path"
    dest = filler_cache_dest("/ref/9075", 9075, 0, url)
    assert dest == "/ref/9075/9075-filler-0-9967.mp4"

def test_dest_changes_when_url_file_id_changes():
    """재생성으로 URL의 file_id가 바뀌면 dest 파일명이 달라져 재다운로드 유발."""
    old = filler_cache_dest("/ref/9075", 9075, 3, "https://x/oth-path")
    new = filler_cache_dest("/ref/9075", 9075, 3, "https://x/oth-path")
    assert old != new
    assert old.endswith("-9970.mp4") and new.endswith("-10970.mp4")

def test_dest_sanitizes_and_strips_query():
    dest = filler_cache_dest("/ref/1", 1, 2, "https://x/oth-path?token=ab/cd")
    # query 제거 + 경로문자 없는 안전한 파일명
    assert dest == "/ref/1/1-filler-2-55.mp4"

def test_dest_empty_url_falls_back():
    dest = filler_cache_dest("/ref/1", 1, 0, "")
    assert dest == "/ref/1/1-filler-0-x.mp4"

def test_prune_removes_other_file_id_and_legacy(tmp_path):
    root = tmp_path
    keep = root / "9075-filler-0-9967.mp4"
    other = root / "9075-filler-0-9770.mp4"       # 옛 file_id
    legacy = root / "9075-filler-0.mp4"            # legacy 무-id
    other_idx = root / "9075-filler-1-9968.mp4"    # 다른 idx — 보존돼야
    for p in (keep, other, legacy, other_idx):
        p.write_bytes(b"x")

    prune_stale_fillers(str(root), 9075, 0, str(keep))

    assert keep.exists(), "현재 버전은 보존"
    assert not other.exists(), "옛 file_id 제거"
    assert not legacy.exists(), "legacy 무-id 제거"
    assert other_idx.exists(), "다른 idx는 영향 없음"

def test_prune_missing_dir_is_noop(tmp_path):
    # 디렉토리 미존재 시 예외 없이 no-op
    prune_stale_fillers(str(tmp_path / "nope"), 9075, 0, "x")

def test_prune_keeps_only_current_across_regen(tmp_path):
    """재생성 시 dest 계산 후 prune → 새 파일 다운로드 전 옛 캐시가 사라져 idx당 1개 유지."""
    root = tmp_path
    (root / "9075-filler-0-1000.mp4").write_bytes(b"old")
    url = "https://x/oth-path"
    dest = filler_cache_dest(str(root), 9075, 0, url)
    prune_stale_fillers(str(root), 9075, 0, dest)
    remaining = sorted(p.name for p in root.glob("9075-filler-0-*.mp4"))
    assert remaining == [], "옛 캐시 제거됨(새 dest는 아직 미다운로드)"
