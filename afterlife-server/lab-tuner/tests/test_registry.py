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

def test_update_unknown_section_ignored():
    r = KnobsRegistry()
    before = r.get().to_dict()
    merged = r.update({"unknown_section": {"x": 1}})
    assert merged.to_dict() == before   # 예외 없이 현상유지

def test_update_none_section_value_ignored():
    r = KnobsRegistry()
    before = r.get().to_dict()
    merged = r.update({"tts": None})    # isinstance dict 가드 → 무시
    assert merged.to_dict() == before

def test_dirty_starts_empty():
    r = KnobsRegistry()
    assert r.dirty() == set()

def test_dirty_tracks_updated_keys():
    r = KnobsRegistry()
    r.update({"tts": {"speed": 1.5}})
    assert r.dirty() == {"tts.speed"}

def test_dirty_accumulates_across_updates():
    r = KnobsRegistry()
    r.update({"tts": {"speed": 1.5}})
    r.update({"fifth": {"cfg_scale": 3.0}})
    assert r.dirty() == {"tts.speed", "fifth.cfg_scale"}

def test_dirty_ignores_unknown_section_and_field():
    r = KnobsRegistry()
    r.update({"unknown_section": {"x": 1}})
    r.update({"tts": {"unknown_field": 999}})
    assert r.dirty() == set()

def test_dirty_returns_defensive_copy():
    r = KnobsRegistry()
    r.update({"tts": {"speed": 1.5}})
    d = r.dirty()
    d.add("fake.key")
    assert r.dirty() == {"tts.speed"}   # 외부에서 변경해도 내부 상태 불변

def test_replace_resets_dirty():
    from knobs import RunKnobs
    r = KnobsRegistry()
    r.update({"tts": {"speed": 1.5}})
    assert r.dirty() == {"tts.speed"}
    r.replace(RunKnobs())
    assert r.dirty() == set()
