from metrics import TurnMetrics


def test_초기_스냅샷은_전부_None():
    s = TurnMetrics().snapshot()
    assert s["tts_ms"] is None
    assert s["ttff_ms"] is None
    assert s["n_seg"] == 0


def test_record_후_스냅샷():
    m = TurnMetrics()
    m.start_turn()
    m.record("tts", 890)
    assert m.snapshot()["tts_ms"] == 890


def test_첫_세그먼트까지가_ttff():
    m = TurnMetrics()
    m.start_turn()
    m.record("llm_first_token", 412)
    m.record("tts", 890)
    m.record("render", 380)
    assert m.snapshot()["ttff_ms"] == 412 + 890 + 380


def test_두번째_세그먼트는_ttff를_안_바꾼다():
    m = TurnMetrics()
    m.start_turn()
    m.record("llm_first_token", 400)
    m.record("tts", 800)
    m.record("render", 300)
    first = m.snapshot()["ttff_ms"]
    m.record("tts", 700)
    m.record("render", 250)
    s = m.snapshot()
    assert s["ttff_ms"] == first
    assert s["n_seg"] == 2
    assert s["tts_ms"] == 700          # 최신 세그먼트 값으로 갱신


def test_start_turn은_이전_턴을_지운다():
    m = TurnMetrics()
    m.start_turn()
    m.record("llm_first_token", 100)
    m.record("tts", 100)
    m.record("render", 50)
    m.start_turn()
    s = m.snapshot()
    assert s["ttff_ms"] is None
    assert s["n_seg"] == 0
    assert s["tts_ms"] is None


def test_알_수_없는_단계는_무시():
    """오타난 stage 로 조용히 이상한 키가 생기지 않게."""
    m = TurnMetrics()
    m.start_turn()
    m.record("nope", 999)
    assert "nope" not in m.snapshot()


def test_llm_없이도_ttff가_나온다():
    """greet 처럼 LLM 을 안 타는 경로에서도 첫 소리까지 시간은 나와야 한다."""
    m = TurnMetrics()
    m.start_turn()
    m.record("tts", 500)
    m.record("render", 200)
    assert m.snapshot()["ttff_ms"] == 700


def test_float_ms_는_정수로_저장():
    m = TurnMetrics()
    m.start_turn()
    m.record("tts", 123.7)
    assert m.snapshot()["tts_ms"] == 123
