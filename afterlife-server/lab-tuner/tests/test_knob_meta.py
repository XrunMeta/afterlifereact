from knobs import RunKnobs, KNOB_META

def _all_knob_paths():
    d = RunKnobs().to_dict()
    return {f"{s}.{k}" for s, vals in d.items() for k in vals}

def test_every_knob_has_meta():
    # 모든 노브가 메타를 갖는다(UI 렌더 누락 방지).
    missing = _all_knob_paths() - set(KNOB_META)
    assert not missing, f"메타 누락: {missing}"

def test_meta_has_no_orphans():
    # 존재하지 않는 노브 메타가 없다(오타 방지).
    orphans = set(KNOB_META) - _all_knob_paths()
    assert not orphans, f"고아 메타: {orphans}"

def test_enum_meta_has_choices():
    for path, m in KNOB_META.items():
        if m["type"] == "enum":
            assert m.get("choices"), f"{path} enum 인데 choices 없음"

def test_meta_type_valid():
    for path, m in KNOB_META.items():
        assert m["type"] in ("bool", "enum", "number", "string"), path
        assert m["reflow"] in ("next_call", "container", "session"), path
