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
