"""per-request FifthConfig 오버라이드 — 입싱크 파라미터를 재기동 없이 튜닝.

회귀 0 불변식: 요청에 키가 없으면 RenderService 는 self.cfg 를 **동일 객체**로
넘긴다. replace() 를 타지 않으므로 기존 동작과 바이트 단위로 같다.
"""
import pytest

from fifth_render_server import _parse_cfg_overrides


def test_빈_요청은_빈_dict():
    assert _parse_cfg_overrides({"wav_path": "a.wav", "video_path": "b.jpg"}) == {}


def test_None_값은_제외된다():
    """명시 None 은 '미지정' 과 같게 다뤄야 컨테이너 env 기본이 살아난다."""
    assert _parse_cfg_overrides({"lip_open": None}) == {}


def test_float_필드_캐스팅():
    assert _parse_cfg_overrides({"lip_open": "0.24"}) == {"lip_open": 0.24}


def test_int_필드_캐스팅():
    assert _parse_cfg_overrides({"offset": "3"}) == {"offset": 3}


def test_여러_키_동시():
    got = _parse_cfg_overrides({"lip_open": 0.3, "sigma": 1.5, "offset": 2})
    assert got == {"lip_open": 0.3, "sigma": 1.5, "offset": 2}


def test_잘못된_타입은_ValueError():
    """do_POST 가 400 으로 변환한다 — 500 방지."""
    with pytest.raises(ValueError):
        _parse_cfg_overrides({"lip_open": "너무벌려"})


def test_알려지지_않은_키는_무시():
    assert _parse_cfg_overrides({"nope": 1, "wav_path": "a"}) == {}


def test_전_필드_커버():
    """FifthConfig 의 모든 필드가 per-request 로 덮을 수 있어야 한다."""
    from dataclasses import fields
    from config import FifthConfig
    from fifth_render_server import _CFG_KEYS

    assert {f.name for f in fields(FifthConfig)} == set(_CFG_KEYS)


def test_오버라이드_없으면_동일_객체():
    """회귀 0 불변식 — 동등(==)이 아니라 동일(is) 이어야 한다."""
    from dataclasses import replace
    from config import FifthConfig

    cfg = FifthConfig()
    overrides = {}
    result = replace(cfg, **overrides) if overrides else cfg
    assert result is cfg


def test_오버라이드_있으면_원본_불변():
    """파생 cfg 를 만들어도 RenderService.self.cfg 는 안 바뀌어야 한다
    (다음 요청이 이전 요청 값을 물려받으면 안 됨)."""
    from dataclasses import replace
    from config import FifthConfig

    cfg = FifthConfig()
    derived = replace(cfg, **{"lip_open": 0.9})
    assert derived.lip_open == 0.9
    assert cfg.lip_open == 0.55      # 원본 기본값 유지
