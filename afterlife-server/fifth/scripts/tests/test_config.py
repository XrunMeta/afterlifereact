from config import FifthConfig


def test_defaults():
    c = FifthConfig()
    assert c.fps == 25
    assert c.lip_open == 0.55
    assert c.lip_closed == 0.0023      # c_d_lip 입닫힘 계수(silence와 단위 분리)
    assert c.offset == 2
    assert c.sigma == 1.0
    assert c.gamma == 1.0
    assert c.silence == 0.05           # raw RMS 게이트(lip_closed와 별개)
    assert c.closed_thresh == 0.1
    assert c.open_thresh == 0.4


def test_env_override(monkeypatch):
    monkeypatch.setenv("FIFTH_LIP_OPEN", "0.65")
    monkeypatch.setenv("FIFTH_OFFSET", "3")
    monkeypatch.setenv("FIFTH_LIP_CLOSED", "0.005")
    c = FifthConfig.from_env()
    assert c.lip_open == 0.65
    assert c.offset == 3
    assert c.lip_closed == 0.005
