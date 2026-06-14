import os
from dataclasses import dataclass


@dataclass
class FifthConfig:
    fps: int = 25
    lip_open: float = 0.55       # 입 최대 벌림 c_d_lip
    lip_closed: float = 0.0023   # 입 닫힘 c_d_lip (raw RMS silence와 단위 분리)
    open_scale: float = 1.0
    offset: int = 2              # 싱크 보정(프레임)
    sigma: float = 1.0           # RMS 스무딩
    gamma: float = 1.0           # 반응 곡선
    silence: float = 0.05        # 무음 게이트 (raw RMS 절대 임계값)
    closed_thresh: float = 0.1   # base 블렌드: 이하 입다문
    open_thresh: float = 0.4     # base 블렌드: 이상 입벌림

    @classmethod
    def from_env(cls):
        def f(name, default, cast):
            v = os.environ.get(name)
            return cast(v) if v is not None else default

        return cls(
            fps=f("FIFTH_FPS", 25, int),
            lip_open=f("FIFTH_LIP_OPEN", 0.55, float),
            lip_closed=f("FIFTH_LIP_CLOSED", 0.0023, float),
            open_scale=f("FIFTH_OPEN_SCALE", 1.0, float),
            offset=f("FIFTH_OFFSET", 2, int),
            sigma=f("FIFTH_SIGMA", 1.0, float),
            gamma=f("FIFTH_GAMMA", 1.0, float),
            silence=f("FIFTH_SILENCE", 0.05, float),
            closed_thresh=f("FIFTH_CLOSED_THRESH", 0.1, float),
            open_thresh=f("FIFTH_OPEN_THRESH", 0.4, float),
        )
