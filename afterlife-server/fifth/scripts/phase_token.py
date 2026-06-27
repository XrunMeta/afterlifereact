"""PhaseToken — fifth 렌더 위상 상태 운반체.

stream_wav_frames 에 in/out으로 전달해 청크 간 모션 위상(frame_offset,
blink_phase, head_last, first_frame)을 이어받는다.

불변식: phase_token=None(또는 미전달) 시 PhaseToken() 기본값과 동일 →
기존 stateless 렌더와 100% 동일 경로 보장.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict


@dataclass(eq=True)
class PhaseToken:
    frame_offset: int = 0
    blink_phase: int = 0
    first_frame: bool = True
    head_last: list | None = None  # JoyVASA 마지막 head 모션(연속화 후보, 게이트0서 사용여부 결정)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict | None) -> "PhaseToken":
        if not d:
            return cls()
        return cls(**{k: d[k] for k in d if k in cls.__dataclass_fields__})
