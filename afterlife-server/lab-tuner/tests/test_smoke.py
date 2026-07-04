def test_prethird_importable():
    import config as prethird_config  # prethird/scripts/config.py
    assert hasattr(prethird_config, "VIDEO_TARGET_FPS")
