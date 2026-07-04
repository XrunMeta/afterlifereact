from registry import KnobsRegistry

def test_get_returns_default():
    r = KnobsRegistry()
    assert r.get().tts.speed == 1.0

def test_update_partial_merges():
    r = KnobsRegistry()
    merged = r.update({"tts": {"speed": 1.5}})
    assert merged.tts.speed == 1.5
    assert r.get().tts.speed == 1.5
    assert r.get().dialogue.min_len == 4  # 미변경 유지

def test_update_preserves_other_sections():
    r = KnobsRegistry()
    r.update({"fifth": {"cfg_scale": 3.0}})
    r.update({"tts": {"speed": 2.0}})
    assert r.get().fifth.cfg_scale == 3.0  # 이전 업데이트 보존
    assert r.get().tts.speed == 2.0
