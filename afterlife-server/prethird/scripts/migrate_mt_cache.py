"""MuseTalk 캐시를 /data(HDD)로 옮기며 줄이기 (AFL-1064, sungjius 2026-11-02).

  python migrate_mt_cache.py <src musetalk-outputs> <dst 예: /data/character/cache/musetalk-outputs>

- <stem>.pkl(좌표)·latents → 그대로 복사
- 입 마스크(_rot1) → cache_slim 압축 형식으로(22.6MB → 1.4MB 꼴)
- 옛 마스크(_rot1 없는 것, PR #2072 이전 형식 — 읽는 코드 없음) → 건너뜀
- v15/ 아래(PNG 프레임 폴더·렌더 찌꺼기 _tmp 폴더) → 건너뜀(cache_slim 이 mp4 에서 바로 읽는다)
이미 같은 크기·시각으로 옮겨진 파일은 건너뛴다(다시 돌려도 된다). 원본은 건드리지 않는다.
"""
from __future__ import annotations

import os
import shutil
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cache_slim  # noqa: E402
from frame_rotation import MASK_CACHE_TAG  # noqa: E402


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(os.path.join(dst, "v15", "v15"), exist_ok=True)
    t0 = time.time()
    n = {"copy": 0, "mask": 0, "skip_old_mask": 0, "same": 0}
    size_in = size_out = 0
    for name in sorted(os.listdir(src)):
        p = os.path.join(src, name)
        if not os.path.isfile(p) or not name.endswith(".pkl") or ".tmp" in name:
            continue
        q = os.path.join(dst, name)
        st = os.stat(p)
        if ".mask_" in name:
            if not name.endswith(f"_{MASK_CACHE_TAG}.pkl"):
                n["skip_old_mask"] += 1
                continue
            if os.path.exists(q) and os.stat(q).st_mtime_ns >= st.st_mtime_ns:
                n["same"] += 1
                continue
            cache_slim.dump_masks(q, cache_slim.load_masks(p))
            os.utime(q, ns=(st.st_atime_ns, st.st_mtime_ns))
            n["mask"] += 1
        else:
            if os.path.exists(q) and os.stat(q).st_size == st.st_size and os.stat(q).st_mtime_ns == st.st_mtime_ns:
                n["same"] += 1
                continue
            shutil.copy2(p, q)
            n["copy"] += 1
        size_in += st.st_size
        size_out += os.path.getsize(q)
    print(f"[migrate] {n} · {size_in / 2**30:.2f}GB → {size_out / 2**30:.2f}GB · {time.time() - t0:.0f}s", flush=True)


if __name__ == "__main__":
    os.environ.setdefault("PRETHIRD_MT_CACHE_SLIM", "1")
    main()
