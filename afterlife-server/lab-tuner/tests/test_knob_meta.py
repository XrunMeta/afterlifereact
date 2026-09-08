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
        assert m["reflow"] in ("immediate", "session", "container", "lab_restart"), path


def test_every_meta_has_param_and_default():
    """실제 파라미터 이름과 기본값은 로그·문서 대조에 쓰이므로 전 항목 필수."""
    no_param = [p for p, m in KNOB_META.items() if not m.get("param")]
    no_default = [p for p, m in KNOB_META.items() if m.get("default") in (None, "")]
    assert no_param == [], f"param 누락: {no_param}"
    assert no_default == [], f"default 누락: {no_default}"


def test_number_knobs_have_range():
    """숫자 노브는 권장 범위가 있어야 UI 가 스텝퍼/검증을 걸 수 있다."""
    missing = [p for p, m in KNOB_META.items()
               if m["type"] == "number" and (m.get("min") is None or m.get("max") is None)]
    assert missing == [], f"범위 누락: {missing}"


def test_range_is_sane():
    for path, m in KNOB_META.items():
        if m["type"] != "number":
            continue
        assert m["min"] < m["max"], f"{path}: min >= max"


def test_per_request_knobs_are_immediate():
    """PER_REQUEST 는 매 렌더마다 body 로 실려 가므로 반드시 즉시 반영이어야 한다.

    여기가 어긋나면 UI 가 "재기동 필요" 라고 거짓 안내하게 된다.
    """
    from knobs import FifthKnobs
    for name in FifthKnobs.PER_REQUEST:
        assert KNOB_META[f"fifth.{name}"]["reflow"] == "immediate", name


def test_restart_baked_knobs_are_container():
    """RESTART_BAKED 는 렌더서버 기동 시 1회 로드 → 컨테이너 재기동."""
    from knobs import FifthKnobs
    for name in FifthKnobs.RESTART_BAKED:
        assert KNOB_META[f"fifth.{name}"]["reflow"] == "container", name


def test_flp_knobs_are_container():
    from dataclasses import fields
    from knobs import FlpKnobs
    for f in fields(FlpKnobs):
        assert KNOB_META[f"flp.{f.name}"]["reflow"] == "container", f.name


def test_transport_filler_are_lab_restart():
    """prethird 가 config.py 모듈 상수로 굳혀 읽어 랩 registry 를 안 본다.

    "적용" 만으로는 통화에 영향이 없으므로 그렇게 안내해야 한다.
    """
    for path, m in KNOB_META.items():
        if path.startswith(("transport.", "filler.")):
            assert m["reflow"] == "lab_restart", path


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
