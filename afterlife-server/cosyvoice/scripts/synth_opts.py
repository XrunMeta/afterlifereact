"""per-request 합성 파라미터 해석.

지금까지 /tts/kr 은 sampling/ramble 값을 스키마로 받기만 하고 버렸다
(server.py 가 eng.synth 에 speed 만 넘겼다). lab-tuner 에서 튜닝하려면
요청마다 바꿀 수 있어야 하므로, fifth 의 cfg_overrides 와 같은 방식으로 연다.

회귀 0 규약: 값이 없거나(None) 잘못되면 config 기본값을 그대로 쓴다.
합성이 죽는 것보다 기본값으로 도는 편이 낫다(fail-open) — TTS 가 실패하면
통화 자체가 멈춘다.
"""
from __future__ import annotations

import logging

log = logging.getLogger(__name__)

# 키 → (config 속성명, 캐스터)
_SPEC = {
    "sampling_top_k":        ("SAMPLING_TOP_K", int),
    "sampling_top_p":        ("SAMPLING_TOP_P", float),
    "ramble_base_sec":       ("RAMBLE_BASE_SEC", float),
    "ramble_per_char_sec":   ("RAMBLE_PER_CHAR_SEC", float),
    "ramble_retries":        ("RAMBLE_RETRIES", int),
    "ramble_fallback_top_k": ("RAMBLE_FALLBACK_TOP_K", int),
}

SYNTH_OPT_KEYS = tuple(_SPEC)


def resolve_opts(opts: dict | None, cfg) -> dict:
    """요청 opts + config 기본값 → 이번 합성에 쓸 최종 파라미터.

    Args:
        opts: 요청에 실려 온 값(없거나 None 인 키는 기본값 사용).
        cfg:  config 모듈(또는 같은 속성을 가진 객체).
    """
    src = opts or {}
    out: dict = {}
    for key, (attr, cast) in _SPEC.items():
        default = getattr(cfg, attr)
        raw = src.get(key)
        if raw is None:
            out[key] = default
            continue
        try:
            out[key] = cast(raw)
        except (TypeError, ValueError):
            log.warning("합성 파라미터 %s=%r 해석 실패 → 기본값 %r", key, raw, default)
            out[key] = default
    # 음수 재시도는 for 루프가 아예 안 돌아 audio 가 None 이 된다.
    if out["ramble_retries"] < 0:
        out["ramble_retries"] = 0
    return out
