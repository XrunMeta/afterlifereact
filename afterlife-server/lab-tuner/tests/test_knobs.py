from knobs import RunKnobs, TtsKnobs, FifthKnobs

def test_defaults_roundtrip():
    k = RunKnobs.from_env()
    d = k.to_dict()
    k2 = RunKnobs.from_dict(d)
    assert k2.to_dict() == d
    assert k.tts.engine == "openvoice"
    # 값 자체가 아니라 '기본 생성 = dataclass 기본값' 계약을 본다
    # (기본값은 튜닝으로 바뀔 수 있다 — 2026-08-18 실제로 바뀌었다).
    assert k.fifth.cfg_scale == FifthKnobs().cfg_scale

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


def test_idle_source_mode_from_env(monkeypatch):
    monkeypatch.setenv("IDLE_SOURCE_MODE", "prebake")
    from knobs import RunKnobs
    assert RunKnobs.from_env().transport.idle_source_mode == "prebake"


def test_idle_source_mode_default_auto():
    from knobs import RunKnobs
    assert RunKnobs().transport.idle_source_mode == "auto"


def test_filler_lookahead_default_matches_consumer():
    """미지정 시 tuner 기본값은 실제 소비자(filler_player.py FILLER_LOOKAHEAD_SEC=1.0)와
    일치해야 한다 — 불일치 시 promote가 현재 라이브 동작(1.0s)을 0.0으로 덮어써 회귀."""
    from knobs import RunKnobs, FillerKnobs
    assert FillerKnobs().lookahead_sec == 1.0
    assert RunKnobs.from_env().filler.lookahead_sec == 1.0


def test_filler_order_default_pre_speak():
    from knobs import RunKnobs
    assert RunKnobs.from_env().filler.order == "pre_speak"
    assert RunKnobs().filler.order == "pre_speak"


def test_filler_order_off_from_env(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FILLER_ORDER", "off")
    from knobs import RunKnobs
    assert RunKnobs.from_env().filler.order == "off"


# ---------------------------------------------------------------------------
# 2026-08-18: 기본값이 dataclass 와 from_env() 두 곳에 따로 있었다
#
# 튜닝값을 dataclass 기본값으로 승격했는데, 랩은 기동 시 from_env() 를 쓰므로
# 절반만 반영됐다(표정세기 0.1 로 고쳤는데 랩은 2.0 으로 시작). 기본값의 정본은
# 한 곳이어야 한다.
# ---------------------------------------------------------------------------

def test_from_env_는_env가_없으면_dataclass_기본값과_같다(monkeypatch):
    """두 곳이 어긋나면 "고쳤는데 안 바뀐다"가 된다 — 실제로 그랬다."""
    from dataclasses import fields
    from knobs import RunKnobs, FifthKnobs, FlpKnobs
    for f in list(fields(FifthKnobs)) + list(fields(FlpKnobs)):
        monkeypatch.delenv(f"FIFTH_{f.name.upper()}", raising=False)
        monkeypatch.delenv(f"FIFTH_FLP_{f.name.upper()}", raising=False)
    for extra in ("FIFTH_BLINK", "PRETHIRD_RENDER_MODE", "FIFTH_RENDER_MODE"):
        monkeypatch.delenv(extra, raising=False)

    env_knobs = RunKnobs.from_env()
    plain = RunKnobs()
    for sec in ("fifth", "flp"):
        got, want = getattr(env_knobs, sec), getattr(plain, sec)
        for f in fields(want):
            assert getattr(got, f.name) == getattr(want, f.name), (
                f"{sec}.{f.name}: from_env={getattr(got, f.name)!r} "
                f"dataclass={getattr(want, f.name)!r} — 기본값이 두 곳에 어긋나 있다")


# --- 통화 렌더러 노브 (fifth|musetalk) --------------------------------------
# prethird server._select_renderer_name() 과 같은 규칙을 랩에서도 지킨다.
# UI 에는 fifth 로 보이는데 실제로는 musetalk 이 도는 어긋남을 막기 위함이다.

def test_renderer_from_env(monkeypatch):
    monkeypatch.setenv("PRETHIRD_RENDERER", "fifth")
    assert RunKnobs.from_env().transport.renderer == "fifth"


def test_renderer_default_is_musetalk_like_prethird():
    # 코드 기본은 prethird 와 동일하게 musetalk (배포 env 가 항상 fifth 를 준다).
    assert RunKnobs().transport.renderer == "musetalk"


def test_renderer_unsupported_value_falls_back(monkeypatch):
    # prethird 가 조용히 musetalk 으로 떨어뜨리므로 랩도 같은 값을 보여줘야 한다.
    monkeypatch.setenv("PRETHIRD_RENDERER", "ditto")
    assert RunKnobs.from_env().transport.renderer == "musetalk"


def test_renderer_env_is_case_insensitive(monkeypatch):
    monkeypatch.setenv("PRETHIRD_RENDERER", " FIFTH ")
    assert RunKnobs.from_env().transport.renderer == "fifth"
