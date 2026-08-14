"""3층(FasterLivePortrait yaml) infer_params 를 env 로 덮는다.

yaml 파일 자체는 수정하지 않는다 — 로드 직후 덮어써서 컨테이너 재기동만으로
반영되게 한다. 잘못된 값은 기동을 막지 않고 경고 후 기본값을 유지한다
(렌더서버가 안 뜨면 통화 전체가 죽으므로 fail-open 이 맞다).
"""
from types import SimpleNamespace

from flp_engine import apply_flp_env_overrides


def _ip():
    """trt_infer.yaml 의 infer_params 실측 기본값."""
    return SimpleNamespace(
        animation_region="all",
        flag_stitching=True,
        flag_lip_retargeting=False,
        flag_eye_retargeting=False,
        flag_pasteback=True,
        flag_normalize_lip=False,
        lip_normalize_threshold=0.1,
        cfg_scale=1.2,
        driving_multiplier=1.0,
    )


def test_env_없으면_무변경():
    ip = _ip()
    assert apply_flp_env_overrides(ip, {}) == []
    assert ip.animation_region == "all"
    assert ip.flag_stitching is True


def test_빈_문자열은_미지정_취급():
    ip = _ip()
    assert apply_flp_env_overrides(ip, {"FIFTH_FLP_ANIMATION_REGION": ""}) == []
    assert ip.animation_region == "all"


def test_enum_적용():
    ip = _ip()
    applied = apply_flp_env_overrides(ip, {"FIFTH_FLP_ANIMATION_REGION": "lip"})
    assert ip.animation_region == "lip"
    assert applied == ["animation_region=lip"]


def test_enum_화이트리스트_위반은_무시하고_기동_계속():
    ip = _ip()
    applied = apply_flp_env_overrides(ip, {"FIFTH_FLP_ANIMATION_REGION": "mouth"})
    assert ip.animation_region == "all"
    assert applied == []


def test_bool_off():
    ip = _ip()
    apply_flp_env_overrides(ip, {"FIFTH_FLP_STITCHING": "0"})
    assert ip.flag_stitching is False


def test_bool_on():
    ip = _ip()
    apply_flp_env_overrides(ip, {"FIFTH_FLP_LIP_RETARGETING": "1"})
    assert ip.flag_lip_retargeting is True


def test_float_적용():
    ip = _ip()
    apply_flp_env_overrides(ip, {"FIFTH_FLP_CFG_SCALE": "1.8"})
    assert ip.cfg_scale == 1.8


def test_잘못된_숫자는_무시():
    ip = _ip()
    applied = apply_flp_env_overrides(ip, {"FIFTH_FLP_CFG_SCALE": "빠르게"})
    assert ip.cfg_scale == 1.2
    assert applied == []


def test_여러_항목_동시():
    ip = _ip()
    applied = apply_flp_env_overrides(ip, {
        "FIFTH_FLP_ANIMATION_REGION": "lip",
        "FIFTH_FLP_STITCHING": "0",
        "FIFTH_FLP_DRIVING_MULTIPLIER": "1.3",
    })
    assert ip.animation_region == "lip"
    assert ip.flag_stitching is False
    assert ip.driving_multiplier == 1.3
    assert len(applied) == 3


def test_normalize_lip_은_env로만_켤_수_있다():
    """코드가 기동 시 False 로 강제하는 값 — 실험용 오버라이드 경로가 살아 있어야 한다."""
    ip = _ip()
    apply_flp_env_overrides(ip, {"FIFTH_FLP_NORMALIZE_LIP": "1"})
    assert ip.flag_normalize_lip is True
