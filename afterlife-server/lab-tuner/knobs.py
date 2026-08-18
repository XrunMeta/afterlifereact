from __future__ import annotations
import os
from dataclasses import dataclass, asdict, field, fields


def _env_f(name, default):
    return float(os.environ.get(name, default))
def _env_i(name, default):
    return int(os.environ.get(name, default))
def _env_i_opt(name):
    """env 미설정이면 None — '미지정' 을 기본값과 구분해야 하는 노브용."""
    v = os.environ.get(name)
    return int(v) if v not in (None, "") else None


@dataclass(frozen=True)
class DialogueKnobs:
    model: str | None = None
    temperature: float | None = None
    system_override: str | None = None
    min_len: int = 4
    force_flush: int = 30
    # 첫 문장은 별도 임계 — TTFF 에 직결된다(라이브 PRETHIRD_SENTENCE_FIRST_MIN_LEN=2).
    # None = 미지정 → 기존 규약(min_len 을 따라감) 유지. 명시하면 그 값이 이긴다.
    first_min_len: int | None = None
    # None = 미지정 → ollama 서버 기본(운영 경로와 동일). 값을 넣으면 num_predict 로 간다.
    max_response_tokens: int | None = None


@dataclass(frozen=True)
class TtsKnobs:
    # "openvoice"(8200) | "qwen"(8201) | "cosyvoice"(8203, 라이브 기본)
    engine: str = "openvoice"
    url: str | None = None            # 지정 시 engine 기본 URL override
    speed: float = 1.0
    denoise: bool = False
    # qwen generation 파라미터 — 미지정(None) 시 qwen 기본. openvoice/cosyvoice 에선 무시됨.
    temperature: float | None = None
    top_p: float | None = None
    top_k: int | None = None
    repetition_penalty: float | None = None
    max_new_tokens: int | None = None
    # --- CosyVoice 전용(:8203). 미지정(None) 이면 서버 config 기본값. ---
    # 엔진별로 해석하는 파라미터가 완전히 달라 이름을 겹치지 않게 분리한다
    # (qwen 의 top_k 와 cosyvoice 의 sampling_top_k 는 다른 값이다).
    cv_sampling_top_k: int | None = None
    cv_sampling_top_p: float | None = None
    cv_ramble_base_sec: float | None = None
    cv_ramble_per_char_sec: float | None = None
    cv_ramble_retries: int | None = None
    cv_ramble_fallback_top_k: int | None = None

    # 랩 → CosyVoice 서버로 보낼 때의 키 매핑(cv_ 접두어를 뗀다).
    COSYVOICE_KEYS = {
        "cv_sampling_top_k": "sampling_top_k",
        "cv_sampling_top_p": "sampling_top_p",
        "cv_ramble_base_sec": "ramble_base_sec",
        "cv_ramble_per_char_sec": "ramble_per_char_sec",
        "cv_ramble_retries": "ramble_retries",
        "cv_ramble_fallback_top_k": "ramble_fallback_top_k",
    }


@dataclass(frozen=True)
class FifthKnobs:
    """fifth 렌더 파라미터.

    per-request(= /render body 로 매 호출 전달) 와 restart-baked(= 컨테이너 env,
    기동 시 1회 로드) 를 구분한다. 기본값이 None 인 것은 "미지정" 을 뜻하고,
    그 경우 body 에 키를 싣지 않아 컨테이너 env 기본이 그대로 살아난다.

    🔑 2026-08-18: 실통화 튜닝으로 확정한 값을 기본값으로 승격했다(히즈키 지시).
    랩 registry 는 메모리라 재기동마다 초기화되는데, 매번 손으로 다시 넣는 것은
    실수의 원인이었다 — 되돌아간 값을 모른 채 "적용했는데 안 먹는다"를 반복했다.
    확정 세팅:
      입   오디오 기반(잠금 3종 해제) · lip_open 0.5 · open_scale 0.7
      눈   고정 + 2초 간격 깜빡임(eyes_open_lock + blink_interval_sec)
      표정 animation_region=exp · cfg_scale 0.1 · driving_multiplier 0.25
      머리 흔들림 폭 0.2 · idle_motion_scale 0
    되돌릴 기준은 초기값.txt 를 본다.
    """
    # --- per-request: 기존 6종 (명시 기본값 유지) ---
    blink: bool = True
    jpeg_quality: int = 90
    idle_motion_scale: float = 0.0
    idle_rms_low: float = 0.05
    idle_rms_high: float = 0.3
    head_slew_frames: int = 5
    # --- per-request: 입모양 (None = 컨테이너 env 기본 사용) ---
    lip_open: float | None = 0.5
    lip_closed: float | None = 0.023
    open_scale: float | None = 0.7
    offset: int | None = None
    sigma: float | None = None
    gamma: float | None = None
    silence: float | None = None
    closed_thresh: float | None = None
    open_thresh: float | None = 0.13
    fps: int | None = None
    lip_lock: bool | None = False
    source_face_lock: bool | None = False
    source_face_lock_full: bool | None = False
    # --- per-request: 눈·머리 ---
    eyes_open_lock: bool | None = True
    blink_interval_sec: float | None = 2.0
    head_sway_amp: float | None = 0.2
    head_sway_slow: float | None = 0.7
    head_yaw_offset: float | None = 0.0
    head_pitch_offset: float | None = 0.0
    # --- restart-baked: 컨테이너 env, 기동 시 1회 → 재기동 필요 ---
    cfg_scale: float = 0.1
    driving_multiplier: float = 0.25
    head_smooth: float = 3.5
    blink_dur: int = 6
    eye_source_lock: bool = False
    eye_target_scale: float = 1.07
    input_normalize: bool = False
    pasteback_output: bool = False
    cdlip_smooth: bool = False
    cdlip_sigma: float = 1.5
    # --- 호스트측(prethird 가 직접 읽음) ---
    render_mode: str = "batch"  # partial|batch

    PER_REQUEST = (
        "blink", "jpeg_quality", "idle_motion_scale", "idle_rms_low",
        "idle_rms_high", "head_slew_frames",
        "lip_open", "lip_closed", "open_scale", "offset", "sigma", "gamma",
        "silence", "closed_thresh", "open_thresh", "fps",
        "lip_lock", "source_face_lock", "source_face_lock_full",
        "eyes_open_lock", "blink_interval_sec", "head_sway_amp",
        "head_sway_slow", "head_yaw_offset", "head_pitch_offset",
    )
    RESTART_BAKED = (
        "cfg_scale", "driving_multiplier", "head_smooth", "blink_dur",
        "eye_source_lock", "eye_target_scale", "input_normalize",
        "pasteback_output", "cdlip_smooth", "cdlip_sigma",
    )


@dataclass(frozen=True)
class FlpKnobs:
    """3층 — FasterLivePortrait 플러그인 infer_params. 전부 컨테이너 재기동 반영.

    기본값은 yaml 원본이 아니라 **flp_engine 이 코드로 강제한 최종값**이다.
    yaml 은 flag_normalize_lip=True / flag_lip_retargeting=False 지만 코드가
    각각 False / True 로 덮는다 — 랩이 yaml 값을 보여주면 실제와 어긋난다.
    """
    animation_region: str = "exp"
    flag_stitching: bool = True
    flag_lip_retargeting: bool = True     # 코드 강제(yaml 은 False)
    flag_eye_retargeting: bool = True     # FIFTH_BLINK=1 연동(yaml 은 False)
    flag_pasteback: bool = True
    flag_normalize_lip: bool = False      # 코드 강제(yaml 은 True)
    lip_normalize_threshold: float = 0.1
    cfg_scale: float = 1.2
    driving_multiplier: float = 1.0


@dataclass(frozen=True)
class SourceKnobs:
    """업로드 자산으로 통화를 테스트하기 위한 랩 전용 노브.

    얼굴(render_source)과 목소리(voice_source)는 **서로 독립**이다. 하나만 바꾸면
    나머지는 선택한 클론 것을 그대로 쓴다. 페르소나는 어느 쪽도 건드리지 않는다.
    promote 대상 아님(라이브에 나갈 값이 아니다).
    """
    render_source: str = ""      # 얼굴 업로드 id. 빈 값 = 클론 기본 자산(회귀 0)
    use_idle: bool = True        # 업로드본으로 idle 도 교체
    mute_filler: bool = True     # override 중 클론 필러 영상 끄기(다른 얼굴 노출 차단)
    voice_source: str = ""       # 음성 업로드 id. 빈 값 = 클론 목소리(회귀 0)


@dataclass(frozen=True)
class TransportKnobs:
    playback_buffer_ms: int = 0
    idle_grace_sec: float = 0.5
    width: int = 576
    height: int = 1024
    idle_source_mode: str = "auto"  # auto|prebake|clone_mp4|fallback


@dataclass(frozen=True)
class FillerKnobs:
    enabled: bool = False
    volume: float = 0.3
    padding_sec: float = 0.0
    lookahead_sec: float = 1.0
    blend_frames: int = 5
    idle_prebake: bool = True
    order: str = "pre_speak"  # pre_speak|off


def _dflt(cls, name):
    """dataclass 필드 기본값 — from_env 가 기본값을 따로 들고 있다가 어긋나는 것을 막는다.

    2026-08-18: 튜닝값을 dataclass 기본값으로 승격했는데 from_env 의 하드코딩 기본이
    옛값 그대로여서, 랩이 기동할 때 절반만 반영됐다("고쳤는데 안 바뀐다").
    """
    for f in fields(cls):
        if f.name == name:
            return f.default
    raise KeyError(f"{cls.__name__}.{name}")


def _env_b(name, default: bool) -> bool:
    v = os.environ.get(name)
    if v is None or v == "":
        return default
    return v not in ("0", "false", "False")


def _engine_from_url(url: str) -> str:
    """TTS URL 포트로 엔진 판정.

    라이브는 :8203 CosyVoice2 다(2026-08-14 실측). 이 판정이 없으면 랩이
    라이브를 openvoice 로 오인해 다른 엔진으로 튜닝하게 된다.
    """
    if ":8203" in url:
        return "cosyvoice"
    if ":8201" in url:
        return "qwen"
    return "openvoice"


@dataclass(frozen=True)
class RunKnobs:
    dialogue: DialogueKnobs = field(default_factory=DialogueKnobs)
    tts: TtsKnobs = field(default_factory=TtsKnobs)
    fifth: FifthKnobs = field(default_factory=FifthKnobs)
    flp: FlpKnobs = field(default_factory=FlpKnobs)
    transport: TransportKnobs = field(default_factory=TransportKnobs)
    filler: FillerKnobs = field(default_factory=FillerKnobs)
    source: SourceKnobs = field(default_factory=SourceKnobs)

    @classmethod
    def from_env(cls) -> "RunKnobs":
        return cls(
            dialogue=DialogueKnobs(
                model=os.environ.get("PRETHIRD_OLLAMA_MODEL") or None,
                # env 가 실제로 설정된 경우에만 값을 잡는다. 없으면 None(미지정) →
                # SentenceBuffer 의 "first_min_len 은 min_len 을 따라간다" 규약 유지.
                first_min_len=_env_i_opt("PRETHIRD_SENTENCE_FIRST_MIN_LEN"),
                max_response_tokens=_env_i_opt("PRETHIRD_MAX_RESPONSE_TOKENS"),
            ),
            # 엔진 기본은 라이브 PRETHIRD_TTS_URL에서 유도(:8203→cosyvoice,
            # :8201→qwen, 그 외→openvoice). 테스트베드가 라이브와 같은 TTS 엔진으로
            # 시작하도록(웹에서 전환 가능).
            tts=TtsKnobs(
                engine=_engine_from_url(os.environ.get("PRETHIRD_TTS_URL", "")),
                speed=_env_f("PRETHIRD_TTS_SPEED", 1.0),
            ),
            fifth=FifthKnobs(
                cfg_scale=_env_f("FIFTH_CFG_SCALE", _dflt(FifthKnobs, "cfg_scale")),
                driving_multiplier=_env_f("FIFTH_DRIVING_MULTIPLIER", _dflt(FifthKnobs, "driving_multiplier")),
                idle_motion_scale=_env_f("FIFTH_IDLE_MOTION_SCALE", _dflt(FifthKnobs, "idle_motion_scale")),
                idle_rms_low=_env_f("FIFTH_IDLE_RMS_LOW", _dflt(FifthKnobs, "idle_rms_low")),
                idle_rms_high=_env_f("FIFTH_IDLE_RMS_HIGH", _dflt(FifthKnobs, "idle_rms_high")),
                head_slew_frames=_env_i("FIFTH_HEAD_SLEW_FRAMES", _dflt(FifthKnobs, "head_slew_frames")),
                head_smooth=_env_f("FIFTH_HEAD_SMOOTH", _dflt(FifthKnobs, "head_smooth")),
                blink_dur=_env_i("FIFTH_BLINK_DUR", _dflt(FifthKnobs, "blink_dur")),
                blink=_env_b("FIFTH_BLINK", _dflt(FifthKnobs, "blink")),
                eye_source_lock=_env_b("FIFTH_EYE_SOURCE_LOCK", _dflt(FifthKnobs, "eye_source_lock")),
                eye_target_scale=_env_f("FIFTH_EYE_TARGET_SCALE", _dflt(FifthKnobs, "eye_target_scale")),
                input_normalize=_env_b("FIFTH_INPUT_NORMALIZE", _dflt(FifthKnobs, "input_normalize")),
                pasteback_output=_env_b("FIFTH_PASTEBACK_OUTPUT", _dflt(FifthKnobs, "pasteback_output")),
                cdlip_smooth=_env_b("FIFTH_CDLIP_SMOOTH", _dflt(FifthKnobs, "cdlip_smooth")),
                cdlip_sigma=_env_f("FIFTH_CDLIP_SIGMA", _dflt(FifthKnobs, "cdlip_sigma")),
                # T-113 Task3: PRETHIRD_RENDER_MODE(host, prethird pipeline이 직접 읽음)가
                # 우선, 미설정 시 기존 FIFTH_RENDER_MODE(컨테이너, T-111 호환) 폴백.
                # 기본은 batch — 라이브가 batch 로 돈다(2026-08-14 실측).
                render_mode=os.environ.get(
                    "PRETHIRD_RENDER_MODE",
                    os.environ.get("FIFTH_RENDER_MODE", _dflt(FifthKnobs, "render_mode"))
                ),
            ),
            flp=FlpKnobs(
                animation_region=os.environ.get("FIFTH_FLP_ANIMATION_REGION",
                                                _dflt(FlpKnobs, "animation_region")),
                flag_stitching=_env_b("FIFTH_FLP_STITCHING", _dflt(FlpKnobs, "flag_stitching")),
                flag_lip_retargeting=_env_b("FIFTH_FLP_LIP_RETARGETING", _dflt(FlpKnobs, "flag_lip_retargeting")),
                # flag_eye_retargeting 은 FIFTH_BLINK 에 연동돼 기동한다.
                flag_eye_retargeting=_env_b(
                    "FIFTH_FLP_EYE_RETARGETING",
                    _env_b("FIFTH_BLINK", _dflt(FlpKnobs, "flag_eye_retargeting"))),
                flag_pasteback=_env_b("FIFTH_FLP_PASTEBACK", _dflt(FlpKnobs, "flag_pasteback")),
                flag_normalize_lip=_env_b("FIFTH_FLP_NORMALIZE_LIP", _dflt(FlpKnobs, "flag_normalize_lip")),
                lip_normalize_threshold=_env_f("FIFTH_FLP_LIP_NORM_THRESHOLD", _dflt(FlpKnobs, "lip_normalize_threshold")),
                cfg_scale=_env_f("FIFTH_FLP_CFG_SCALE", _dflt(FlpKnobs, "cfg_scale")),
                driving_multiplier=_env_f("FIFTH_FLP_DRIVING_MULTIPLIER", _dflt(FlpKnobs, "driving_multiplier")),
            ),
            transport=TransportKnobs(
                playback_buffer_ms=_env_i("PRETHIRD_PLAYBACK_BUFFER_MS", 0),
                idle_grace_sec=_env_f("IDLE_GRACE_SEC", 0.5),
                width=_env_i("PRETHIRD_WIDTH", 576),
                height=_env_i("PRETHIRD_HEIGHT", 1024),
                idle_source_mode=os.environ.get("IDLE_SOURCE_MODE", "auto"),
            ),
            filler=FillerKnobs(
                enabled=os.environ.get("PRETHIRD_FILLER", "0") == "1",
                lookahead_sec=_env_f("FILLER_LOOKAHEAD_SEC", 1.0),
                blend_frames=_env_i("PRETHIRD_IDLE_BLEND_FRAMES", 5),
                idle_prebake=os.environ.get("FIFTH_IDLE_PREBAKE", "1") == "1",
                order=os.environ.get("PRETHIRD_FILLER_ORDER", "pre_speak"),
            ),
        )

    def to_dict(self) -> dict:
        return {
            "dialogue": asdict(self.dialogue),
            "tts": asdict(self.tts),
            "fifth": asdict(self.fifth),
            "flp": asdict(self.flp),
            "transport": asdict(self.transport),
            "filler": asdict(self.filler),
            "source": asdict(self.source),
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
            flp=_mk(FlpKnobs, d.get("flp")),
            transport=_mk(TransportKnobs, d.get("transport")),
            filler=_mk(FillerKnobs, d.get("filler")),
            source=_mk(SourceKnobs, d.get("source")),
        )



# UI 메타(라벨·설명·실제 파라미터 이름·기본값·범위·반영 시점)는 knob_meta.py 로 분리했다.
# 여기서 재노출해 기존 `from knobs import KNOB_META` 경로를 그대로 유지한다.
from knob_meta import KNOB_META  # noqa: E402,F401
