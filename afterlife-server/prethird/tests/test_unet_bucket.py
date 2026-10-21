"""unet 배치 크기 버킷(2026-10-21) — cudnn 자동튜닝을 응답마다 다시 하지 않게 크기 고정."""
import importlib
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import unet_bucket  # noqa: E402
from unet_bucket import bucket_size, bucket_sizes  # noqa: E402


def test_마지막_배치는_16배수로_올린다():
    assert bucket_size(34, 64, 16) == 48
    assert bucket_size(3, 64, 16) == 16
    assert bucket_size(16, 64, 16) == 16
    assert bucket_size(49, 64, 16) == 64


def test_배치_크기를_넘지_않는다():
    assert bucket_size(64, 64, 16) == 64
    assert bucket_size(60, 50, 16) == 50


def test_bucket_0_이면_그대로():
    assert bucket_size(34, 64, 0) == 34
    assert bucket_sizes(64, 0) == []


def test_나올_수_있는_크기_목록():
    assert bucket_sizes(64, 16) == [16, 32, 48, 64]
    # 1~64 어떤 프레임 수도 이 목록 안의 크기로만 렌더된다.
    sizes = set(bucket_sizes(64, 16))
    assert {bucket_size(n, 64, 16) for n in range(1, 65)} == sizes


def test_env_로_끌_수_있다(monkeypatch):
    monkeypatch.setenv("MUSETALK_PAD_BUCKET", "0")
    mod = importlib.reload(unet_bucket)
    try:
        assert mod.PAD_BUCKET == 0
        assert mod.bucket_size(34, 64) == 34
    finally:
        monkeypatch.delenv("MUSETALK_PAD_BUCKET")
        importlib.reload(unet_bucket)
