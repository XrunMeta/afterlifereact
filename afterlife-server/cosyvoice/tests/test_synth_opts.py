"""CosyVoice per-request 파라미터 오버라이드.

지금까지 /tts/kr 은 sampling/ramble 파라미터를 스키마로 받기만 하고 버렸다
(server.py 가 eng.synth 에 speed 만 넘겼다). 랩에서 튜닝하려면 요청마다
바꿀 수 있어야 하므로, fifth 의 cfg_overrides 와 같은 방식으로 연다.

회귀 0: opts 가 비면 전부 config 기본값을 그대로 쓴다.
"""
import sys
import types
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from synth_opts import resolve_opts, SYNTH_OPT_KEYS  # noqa: E402


class _Cfg:
    """config 모듈 대역 — 실제 config 는 GPU 경로를 건드려 import 가 무겁다."""
    SAMPLING_TOP_K = 5
    SAMPLING_TOP_P = 0.8
    RAMBLE_BASE_SEC = 1.8
    RAMBLE_PER_CHAR_SEC = 0.28
    RAMBLE_RETRIES = 3
    RAMBLE_FALLBACK_TOP_K = 1


def test_비었으면_전부_기본값():
    r = resolve_opts(None, _Cfg)
    assert r["sampling_top_k"] == 5
    assert r["sampling_top_p"] == 0.8
    assert r["ramble_base_sec"] == 1.8
    assert r["ramble_per_char_sec"] == 0.28
    assert r["ramble_retries"] == 3
    assert r["ramble_fallback_top_k"] == 1


def test_빈_dict도_기본값():
    assert resolve_opts({}, _Cfg) == resolve_opts(None, _Cfg)


def test_지정한_값만_덮는다():
    r = resolve_opts({"sampling_top_k": 1}, _Cfg)
    assert r["sampling_top_k"] == 1
    assert r["sampling_top_p"] == 0.8        # 안 건드린 건 기본 유지


def test_None은_미지정_취급():
    r = resolve_opts({"sampling_top_k": None}, _Cfg)
    assert r["sampling_top_k"] == 5


def test_타입_캐스팅():
    r = resolve_opts({"sampling_top_k": "3", "ramble_base_sec": "2.5"}, _Cfg)
    assert r["sampling_top_k"] == 3 and isinstance(r["sampling_top_k"], int)
    assert r["ramble_base_sec"] == 2.5 and isinstance(r["ramble_base_sec"], float)


def test_잘못된_값은_기본값_유지():
    """합성이 죽는 것보다 기본값으로 도는 게 낫다(fail-open)."""
    r = resolve_opts({"sampling_top_k": "다섯"}, _Cfg)
    assert r["sampling_top_k"] == 5


def test_알려지지_않은_키는_무시():
    r = resolve_opts({"nope": 1}, _Cfg)
    assert "nope" not in r


def test_키_목록이_전부_해석된다():
    r = resolve_opts({}, _Cfg)
    assert set(r) == set(SYNTH_OPT_KEYS)


def test_retries_는_음수를_허용하지_않는다():
    """음수면 for 루프가 아예 안 돌아 audio 가 None 이 된다."""
    r = resolve_opts({"ramble_retries": -1}, _Cfg)
    assert r["ramble_retries"] == 0
