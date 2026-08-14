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


def test_every_meta_has_desc():
    """설명 누락 방지 — UI 가 desc 를 라벨 아래에 렌더하므로 빠지면 빈 줄이 된다."""
    missing = [p for p, m in KNOB_META.items() if not m.get("desc")]
    assert not missing, f"desc 누락: {missing}"


def test_latency_group_has_stage():
    """지연 구역 항목은 어느 단계를 줄이는지 반드시 표시한다."""
    for path, m in KNOB_META.items():
        if m.get("group") == "latency":
            assert m.get("stage"), f"{path} 에 stage 없음"


def test_latency_stage_values_valid():
    valid = ("LLM", "TTS", "렌더", "송출", "체감", "LLM→TTS")
    for path, m in KNOB_META.items():
        if m.get("group") == "latency":
            assert m["stage"] in valid, f"{path} stage={m['stage']!r}"


def test_per_request_knobs_are_fields():
    """PER_REQUEST 에 오타가 있으면 getattr 이 조용히 실패하므로 못 박는다."""
    from dataclasses import fields
    from knobs import FifthKnobs
    names = {f.name for f in fields(FifthKnobs)}
    assert set(FifthKnobs.PER_REQUEST) <= names
    assert set(FifthKnobs.RESTART_BAKED) <= names


def test_per_request_and_restart_baked_disjoint():
    """같은 노브가 양쪽에 있으면 반영 시점 안내가 모순된다."""
    from knobs import FifthKnobs
    assert not (set(FifthKnobs.PER_REQUEST) & set(FifthKnobs.RESTART_BAKED))
