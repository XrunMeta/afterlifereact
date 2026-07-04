from __future__ import annotations
import os
from dataclasses import dataclass, asdict, field, fields


def _env_f(name, default):
    return float(os.environ.get(name, default))
def _env_i(name, default):
    return int(os.environ.get(name, default))


@dataclass(frozen=True)
class DialogueKnobs:
    model: str | None = None
    temperature: float | None = None
    system_override: str | None = None
    min_len: int = 4
    force_flush: int = 30


@dataclass(frozen=True)
class TtsKnobs:
    engine: str = "openvoice"        # "openvoice"(8200) | "qwen"(8201)
    url: str | None = None            # 지정 시 engine 기본 URL override
    speed: float = 1.0
    denoise: bool = False


@dataclass(frozen=True)
class FifthKnobs:
    # per-request: fifth_render.py 렌더 함수가 매 호출 env 재독 → /render body override
    blink: bool = True
    jpeg_quality: int = 90
    idle_motion_scale: float = 0.15
    idle_rms_low: float = 0.05
    idle_rms_high: float = 0.3
    head_slew_frames: int = 5
    # restart-baked: flp_engine.__init__ startup 1회 → 렌더 재기동 필요(coarse)
    cfg_scale: float = 2.0
    driving_multiplier: float = 1.0
    PER_REQUEST = ("blink", "jpeg_quality", "idle_motion_scale",
                   "idle_rms_low", "idle_rms_high", "head_slew_frames")
    RESTART_BAKED = ("cfg_scale", "driving_multiplier")


@dataclass(frozen=True)
class TransportKnobs:
    playback_buffer_ms: int = 0
    idle_grace_sec: float = 0.5
    width: int = 576
    height: int = 1024


@dataclass(frozen=True)
class FillerKnobs:
    enabled: bool = False
    volume: float = 0.3
    padding_sec: float = 0.0


@dataclass(frozen=True)
class RunKnobs:
    dialogue: DialogueKnobs = field(default_factory=DialogueKnobs)
    tts: TtsKnobs = field(default_factory=TtsKnobs)
    fifth: FifthKnobs = field(default_factory=FifthKnobs)
    transport: TransportKnobs = field(default_factory=TransportKnobs)
    filler: FillerKnobs = field(default_factory=FillerKnobs)

    @classmethod
    def from_env(cls) -> "RunKnobs":
        return cls(
            dialogue=DialogueKnobs(
                model=os.environ.get("PRETHIRD_OLLAMA_MODEL") or None,
            ),
            # 엔진 기본은 라이브 PRETHIRD_TTS_URL에서 유도(:8201→qwen, 그 외→openvoice).
            # 테스트베드가 라이브와 같은 TTS 엔진으로 시작하도록(웹에서 전환 가능).
            tts=TtsKnobs(
                engine=("qwen" if ":8201" in os.environ.get("PRETHIRD_TTS_URL", "")
                        else "openvoice"),
                speed=_env_f("PRETHIRD_TTS_SPEED", 1.0),
            ),
            fifth=FifthKnobs(
                cfg_scale=_env_f("FIFTH_CFG_SCALE", 2.0),
                driving_multiplier=_env_f("FIFTH_DRIVING_MULTIPLIER", 1.0),
                idle_motion_scale=_env_f("FIFTH_IDLE_MOTION_SCALE", 0.15),
                idle_rms_low=_env_f("FIFTH_IDLE_RMS_LOW", 0.05),
                idle_rms_high=_env_f("FIFTH_IDLE_RMS_HIGH", 0.3),
                head_slew_frames=_env_i("FIFTH_HEAD_SLEW_FRAMES", 5),
            ),
            transport=TransportKnobs(
                playback_buffer_ms=_env_i("PRETHIRD_PLAYBACK_BUFFER_MS", 0),
                idle_grace_sec=_env_f("IDLE_GRACE_SEC", 0.5),
                width=_env_i("PRETHIRD_WIDTH", 576),
                height=_env_i("PRETHIRD_HEIGHT", 1024),
            ),
            filler=FillerKnobs(enabled=os.environ.get("PRETHIRD_FILLER", "0") == "1"),
        )

    def to_dict(self) -> dict:
        return {
            "dialogue": asdict(self.dialogue),
            "tts": asdict(self.tts),
            "fifth": asdict(self.fifth),
            "transport": asdict(self.transport),
            "filler": asdict(self.filler),
        }

    @classmethod
    def from_dict(cls, d: dict) -> "RunKnobs":
        def _mk(klass, sub):
            valid = {f.name for f in fields(klass)}
            return klass(**{k: v for k, v in (sub or {}).items() if k in valid})
        return cls(
            dialogue=_mk(DialogueKnobs, d.get("dialogue")),
            tts=_mk(TtsKnobs, d.get("tts")),
            fifth=_mk(FifthKnobs, d.get("fifth")),
            transport=_mk(TransportKnobs, d.get("transport")),
            filler=_mk(FillerKnobs, d.get("filler")),
        )
