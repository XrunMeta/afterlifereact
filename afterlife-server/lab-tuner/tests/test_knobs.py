from knobs import RunKnobs, TtsKnobs, FifthKnobs

def test_defaults_roundtrip():
    k = RunKnobs.from_env()
    d = k.to_dict()
    k2 = RunKnobs.from_dict(d)
    assert k2.to_dict() == d
    assert k.tts.engine == "openvoice"
    assert k.fifth.cfg_scale == 2.0

def test_from_dict_partial_uses_defaults():
    k = RunKnobs.from_dict({"tts": {"speed": 1.4}})
    assert k.tts.speed == 1.4
    assert k.tts.engine == "openvoice"       # 미지정 → 기본
    assert k.dialogue.min_len == 4

def test_param_classification():
    assert "idle_motion_scale" in FifthKnobs.PER_REQUEST
    assert "cfg_scale" in FifthKnobs.RESTART_BAKED
    assert "cfg_scale" not in FifthKnobs.PER_REQUEST

def test_from_dict_empty_uses_all_defaults():
    k = RunKnobs.from_dict({})
    assert k.to_dict() == RunKnobs().to_dict()

def test_from_dict_unknown_field_ignored():
    k = RunKnobs.from_dict({"tts": {"unknown_field": 999}})
    assert not hasattr(k.tts, "unknown_field")
    assert k.tts.engine == "openvoice"
    assert k.tts.speed == 1.0

def test_from_dict_none_temperature_roundtrip():
    k = RunKnobs()
    assert k.dialogue.temperature is None
    d = k.to_dict()
    k2 = RunKnobs.from_dict(d)
    assert k2.dialogue.temperature is None

def test_from_env_derives_qwen_engine_from_tts_url(monkeypatch):
    # 라이브 PRETHIRD_TTS_URL(:8201)이면 기본 엔진 qwen (E2E: 클론 음성 정합).
    monkeypatch.setenv("PRETHIRD_TTS_URL", "http://127.0.0.1:8201")
    assert RunKnobs.from_env().tts.engine == "qwen"
    monkeypatch.setenv("PRETHIRD_TTS_URL", "http://127.0.0.1:8200")
    assert RunKnobs.from_env().tts.engine == "openvoice"
    monkeypatch.delenv("PRETHIRD_TTS_URL", raising=False)
    assert RunKnobs.from_env().tts.engine == "openvoice"

def test_tts_knobs_gen_params_roundtrip():
    from knobs import RunKnobs
    r = RunKnobs.from_dict({"tts": {"engine": "qwen", "temperature": 0.7, "top_k": 40}})
    assert r.tts.temperature == 0.7
    assert r.tts.top_k == 40
    assert r.tts.top_p is None            # 미지정 필드는 None 유지
    assert r.to_dict()["tts"]["temperature"] == 0.7

def test_tts_knobs_gen_params_default_none():
    from knobs import TtsKnobs
    t = TtsKnobs()
    assert t.temperature is None and t.top_p is None and t.max_new_tokens is None

def test_filler_extended_from_env(monkeypatch):
    monkeypatch.setenv("FILLER_LOOKAHEAD_SEC", "1.5")
    monkeypatch.setenv("PRETHIRD_IDLE_BLEND_FRAMES", "8")
    monkeypatch.setenv("FIFTH_IDLE_PREBAKE", "0")
    from knobs import RunKnobs
    k = RunKnobs.from_env()
    assert k.filler.lookahead_sec == 1.5
    assert k.filler.blend_frames == 8
    assert k.filler.idle_prebake is False
