"""시작 프레임 회전과 마스크 캐시 번호(2026-10-29) — 캐시는 원래 프레임 번호로 저장·조회한다."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from frame_rotation import MASK_CACHE_TAG, mask_cache_index, rotate  # noqa: E402

SCRIPTS = os.path.join(os.path.dirname(__file__), "..", "scripts")


def test_회전은_앞을_뒤로_보낸다():
    assert rotate([0, 1, 2, 3, 4], 2) == [2, 3, 4, 0, 1]
    assert rotate([0, 1, 2], 0) == [0, 1, 2]


def test_회전된_자리의_원래_프레임_번호():
    frames = list(range(10))
    for rot in range(10):
        rotated = rotate(frames, rot)
        for cyc_idx in range(10):
            assert mask_cache_index(cyc_idx, rot, 10) == rotated[cyc_idx]


def test_회전이_달라도_같은_프레임에_같은_마스크가_붙는다():
    # 턴1(rot=3)에서 채운 캐시를 턴2(rot=7)가 읽는다. 마스크는 그 프레임 것이어야 한다.
    n = 12
    frames = list(range(n))
    cache = [None] * n
    turn1 = rotate(frames, 3)
    for cyc_idx in range(n):
        cache[mask_cache_index(cyc_idx, 3, n)] = f"mask-{turn1[cyc_idx]}"
    turn2 = rotate(frames, 7)
    for cyc_idx in range(n):
        assert cache[mask_cache_index(cyc_idx, 7, n)] == f"mask-{turn2[cyc_idx]}"


def test_inference_lib_가_원래_번호로_캐시를_다룬다():
    # 회전된 번호(cyc_idx)로 직접 캐시를 읽고 쓰면 다른 프레임 마스크가 붙는다(이번 버그).
    src = open(os.path.join(SCRIPTS, "inference_lib.py"), encoding="utf-8").read()
    assert "mask_cache_list[cyc_idx]" not in src
    assert "mask_cache_index(cyc_idx, _rot," in src
    # 옛 순서로 저장된 캐시 파일을 읽지 않도록 파일 이름이 바뀌어야 한다.
    assert "MASK_CACHE_TAG" in src
    assert MASK_CACHE_TAG
