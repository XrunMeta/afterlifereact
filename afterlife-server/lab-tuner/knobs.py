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
    max_response_tokens: int = 200


@dataclass(frozen=True)
class TtsKnobs:
    # "openvoice"(8200) | "qwen"(8201) | "cosyvoice"(8203, 라이브 기본)
    engine: str = "openvoice"
    url: str | None = None            # 지정 시 engine 기본 URL override
    speed: float = 1.0
    denoise: bool = False
    # qwen generation 파라미터 — 미지정(None) 시 qwen 기본. openvoice 엔진에선 무시됨.
    temperature: float | None = None
    top_p: float | None = None
    top_k: int | None = None
    repetition_penalty: float | None = None
    max_new_tokens: int | None = None


@dataclass(frozen=True)
class FifthKnobs:
    """fifth 렌더 파라미터.

    per-request(= /render body 로 매 호출 전달) 와 restart-baked(= 컨테이너 env,
    기동 시 1회 로드) 를 구분한다. per-request 중 기본값이 None 인 것들은
    "미지정" 을 뜻하고, 그 경우 body 에 키를 싣지 않아 컨테이너 env 기본이
    그대로 살아난다(회귀 0).
    """
    # --- per-request: 기존 6종 (명시 기본값 유지) ---
    blink: bool = True
    jpeg_quality: int = 90
    idle_motion_scale: float = 0.15
    idle_rms_low: float = 0.05
    idle_rms_high: float = 0.3
    head_slew_frames: int = 5
    # --- per-request: 입모양 (None = 컨테이너 env 기본 사용) ---
    lip_open: float | None = None
    lip_closed: float | None = None
    open_scale: float | None = None
    offset: int | None = None
    sigma: float | None = None
    gamma: float | None = None
    silence: float | None = None
    closed_thresh: float | None = None
    open_thresh: float | None = None
    fps: int | None = None
    lip_lock: bool | None = None
    source_face_lock: bool | None = None
    source_face_lock_full: bool | None = None
    # --- per-request: 눈·머리 ---
    eyes_open_lock: bool | None = None
    blink_interval_sec: float | None = None
    head_sway_amp: float | None = None
    head_sway_slow: float | None = None
    head_yaw_offset: float | None = None
    head_pitch_offset: float | None = None
    # --- restart-baked: 컨테이너 env, 기동 시 1회 → 재기동 필요 ---
    cfg_scale: float = 2.0
    driving_multiplier: float = 1.0
    head_smooth: float = 3.5
    blink_dur: int = 6
    eye_source_lock: bool = True
    eye_target_scale: float = 0.8
    input_normalize: bool = True
    pasteback_output: bool = True
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
    animation_region: str = "all"
    flag_stitching: bool = True
    flag_lip_retargeting: bool = True     # 코드 강제(yaml 은 False)
    flag_eye_retargeting: bool = True     # FIFTH_BLINK=1 연동(yaml 은 False)
    flag_pasteback: bool = True
    flag_normalize_lip: bool = False      # 코드 강제(yaml 은 True)
    lip_normalize_threshold: float = 0.1
    cfg_scale: float = 1.2
    driving_multiplier: float = 1.0


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

    @classmethod
    def from_env(cls) -> "RunKnobs":
        return cls(
            dialogue=DialogueKnobs(
                model=os.environ.get("PRETHIRD_OLLAMA_MODEL") or None,
                # env 가 실제로 설정된 경우에만 값을 잡는다. 없으면 None(미지정) →
                # SentenceBuffer 의 "first_min_len 은 min_len 을 따라간다" 규약 유지.
                first_min_len=_env_i_opt("PRETHIRD_SENTENCE_FIRST_MIN_LEN"),
                max_response_tokens=_env_i("PRETHIRD_MAX_RESPONSE_TOKENS", 200),
            ),
            # 엔진 기본은 라이브 PRETHIRD_TTS_URL에서 유도(:8203→cosyvoice,
            # :8201→qwen, 그 외→openvoice). 테스트베드가 라이브와 같은 TTS 엔진으로
            # 시작하도록(웹에서 전환 가능).
            tts=TtsKnobs(
                engine=_engine_from_url(os.environ.get("PRETHIRD_TTS_URL", "")),
                speed=_env_f("PRETHIRD_TTS_SPEED", 1.0),
            ),
            fifth=FifthKnobs(
                cfg_scale=_env_f("FIFTH_CFG_SCALE", 2.0),
                driving_multiplier=_env_f("FIFTH_DRIVING_MULTIPLIER", 1.0),
                idle_motion_scale=_env_f("FIFTH_IDLE_MOTION_SCALE", 0.15),
                idle_rms_low=_env_f("FIFTH_IDLE_RMS_LOW", 0.05),
                idle_rms_high=_env_f("FIFTH_IDLE_RMS_HIGH", 0.3),
                head_slew_frames=_env_i("FIFTH_HEAD_SLEW_FRAMES", 5),
                head_smooth=_env_f("FIFTH_HEAD_SMOOTH", 3.5),
                blink_dur=_env_i("FIFTH_BLINK_DUR", 6),
                blink=_env_b("FIFTH_BLINK", True),
                eye_source_lock=_env_b("FIFTH_EYE_SOURCE_LOCK", True),
                eye_target_scale=_env_f("FIFTH_EYE_TARGET_SCALE", 0.8),
                input_normalize=_env_b("FIFTH_INPUT_NORMALIZE", True),
                pasteback_output=_env_b("FIFTH_PASTEBACK_OUTPUT", True),
                cdlip_smooth=_env_b("FIFTH_CDLIP_SMOOTH", False),
                cdlip_sigma=_env_f("FIFTH_CDLIP_SIGMA", 1.5),
                # T-113 Task3: PRETHIRD_RENDER_MODE(host, prethird pipeline이 직접 읽음)가
                # 우선, 미설정 시 기존 FIFTH_RENDER_MODE(컨테이너, T-111 호환) 폴백.
                # 기본은 batch — 라이브가 batch 로 돈다(2026-08-14 실측).
                render_mode=os.environ.get(
                    "PRETHIRD_RENDER_MODE", os.environ.get("FIFTH_RENDER_MODE", "batch")
                ),
            ),
            flp=FlpKnobs(
                animation_region=os.environ.get("FIFTH_FLP_ANIMATION_REGION", "all"),
                flag_stitching=_env_b("FIFTH_FLP_STITCHING", True),
                flag_lip_retargeting=_env_b("FIFTH_FLP_LIP_RETARGETING", True),
                # flag_eye_retargeting 은 FIFTH_BLINK 에 연동돼 기동한다.
                flag_eye_retargeting=_env_b(
                    "FIFTH_FLP_EYE_RETARGETING", _env_b("FIFTH_BLINK", True)),
                flag_pasteback=_env_b("FIFTH_FLP_PASTEBACK", True),
                flag_normalize_lip=_env_b("FIFTH_FLP_NORMALIZE_LIP", False),
                lip_normalize_threshold=_env_f("FIFTH_FLP_LIP_NORM_THRESHOLD", 0.1),
                cfg_scale=_env_f("FIFTH_FLP_CFG_SCALE", 1.2),
                driving_multiplier=_env_f("FIFTH_FLP_DRIVING_MULTIPLIER", 1.0),
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
        )


# UI 타입 힌트 + reflow(반영 성격). tuner.js 가 /knobs/meta 로 받아 컨트롤을 렌더.
# choices 는 반드시 _SAFE_ENV_VAL 문자셋 내로 정의(promote.py Global Constraints).
# UI 타입 힌트 + reflow(반영 성격) + desc(설명) + group/stage(지연 구역).
# tuner.js 가 /knobs/meta 로 받아 컨트롤과 설명을 렌더한다.
#
# reflow: next_call = 다음 발화부터 즉시 / container = 컨테이너 재기동 필요 /
#         session  = 다음 세션(재연결)부터
# group:  "latency" 인 항목은 원 섹션에서 빠지고 최상단 "응답속도" 구역에 모인다.
# stage:  지연 항목이 어느 단계를 줄이는지(LLM / LLM→TTS / TTS / 렌더 / 송출 / 체감).
# desc:   필수. 값의 의미와 올리면/내리면 어떻게 되는지 한국어로.
#
# choices 는 반드시 _SAFE_ENV_VAL 문자셋 내로 정의(promote.py Global Constraints).
KNOB_META: dict[str, dict] = {
    # ---------------- 대화(LLM) ----------------
    "dialogue.model": {
        "type": "string", "choices": None, "reflow": "session", "label": "LLM 모델",
        "desc": "응답을 생성할 ollama 모델 이름. 큰 모델일수록 답이 좋아지고 첫 토큰이 늦게 나온다",
    },
    "dialogue.temperature": {
        "type": "number", "choices": None, "reflow": "session", "label": "temperature",
        "desc": "응답의 무작위성. 0에 가까우면 매번 비슷하게, 1 이상이면 다양하지만 산만해진다",
    },
    "dialogue.system_override": {
        "type": "string", "choices": None, "reflow": "session", "label": "system override",
        "desc": "클론 페르소나 앞에 끼워 넣을 system 메시지. 비우면 원래 페르소나 그대로",
    },
    "dialogue.min_len": {
        "type": "number", "choices": None, "reflow": "session", "label": "문장 최소 길이",
        "group": "latency", "stage": "LLM→TTS",
        "desc": "두 번째 이후 문장을 몇 글자부터 TTS 로 넘길지. 작으면 반응이 빠르지만 "
                "문장이 잘게 쪼개져 부자연스럽다. 라이브 8",
    },
    "dialogue.first_min_len": {
        "type": "number", "choices": None, "reflow": "session", "label": "첫 문장 최소 길이",
        "group": "latency", "stage": "LLM→TTS",
        "desc": "첫 문장을 몇 글자부터 TTS 로 넘길지. 작을수록 첫 소리가 빨리 나온다"
                "(첫 소리까지 걸리는 시간에 가장 크게 먹힌다). 라이브 2",
    },
    "dialogue.force_flush": {
        "type": "number", "choices": None, "reflow": "session", "label": "강제 전송 길이",
        "group": "latency", "stage": "LLM→TTS",
        "desc": "문장 끝이 안 와도 이 글자 수를 넘으면 TTS 로 강제 전송. 길면 첫 소리가 늦어진다. 라이브 48",
    },
    "dialogue.max_response_tokens": {
        "type": "number", "choices": None, "reflow": "session", "label": "응답 최대 토큰",
        "group": "latency", "stage": "LLM",
        "desc": "LLM 응답 길이 상한. 짧을수록 턴이 빨리 끝나고, 너무 짧으면 말이 끊긴다. 라이브 200",
    },

    # ---------------- TTS ----------------
    "tts.engine": {
        "type": "enum", "choices": ["openvoice", "qwen", "cosyvoice"],
        "reflow": "next_call", "label": "TTS 엔진",
        "group": "latency", "stage": "TTS",
        "desc": "음성 합성 엔진. cosyvoice(:8203)가 라이브 기본 — RTF 0.43 으로 가장 빠르다. "
                "qwen(:8201)은 RTF 0.74 로 느려 통화 중 영상 멈춤의 원인이었다",
    },
    "tts.url": {
        "type": "string", "choices": None, "reflow": "next_call", "label": "TTS URL 직접 지정",
        "desc": "엔진 기본 주소 대신 쓸 TTS 서버 주소. 비우면 엔진에 맞는 기본 포트를 쓴다",
    },
    "tts.speed": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "말하기 속도",
        "group": "latency", "stage": "TTS",
        "desc": "말하는 속도 배율. 1.2면 20% 빠르게 말해 재생 시간이 준다(합성에 걸리는 시간은 그대로)",
    },
    "tts.denoise": {
        "type": "bool", "choices": None, "reflow": "next_call", "label": "잡음 제거",
        "desc": "합성된 음성에서 잡음을 한 번 걸러낸다. 켜면 깨끗해지지만 합성이 조금 느려진다",
    },
    "tts.temperature": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "temperature (qwen 전용)",
        "desc": "음성 생성의 무작위성. 높이면 억양이 다양해지고 발음이 불안정해진다. qwen 에서만 적용",
    },
    "tts.top_p": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "top_p (qwen 전용)",
        "desc": "생성 후보를 누적 확률로 제한. 낮추면 안정적이고 단조로워진다. qwen 에서만 적용",
    },
    "tts.top_k": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "top_k (qwen 전용)",
        "desc": "생성 후보 개수 제한. 낮추면 안정적이고 단조로워진다. qwen 에서만 적용",
    },
    "tts.repetition_penalty": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "반복 억제 (qwen 전용)",
        "desc": "같은 소리를 되풀이하는 것을 억제한다. 올리면 '다오~' 같은 늘어짐이 줄어든다. qwen 에서만 적용",
    },
    "tts.max_new_tokens": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "최대 오디오 토큰 (qwen 전용)",
        "group": "latency", "stage": "TTS",
        "desc": "한 문장당 생성할 오디오 토큰 상한. 줄이면 합성이 빨라지지만 문장 끝이 잘린다. qwen 에서만 적용",
    },

    # ---------------- fifth: 입모양 (per-request) ----------------
    "fifth.lip_open": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "입 벌림",
        "desc": "입을 최대로 벌리는 정도. 크면 과장되게 벌리고, 작으면 오물거린다. 라이브 0.24",
    },
    "fifth.lip_closed": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "입 닫힘",
        "desc": "무음일 때 입이 닫히는 정도. 0에 가까울수록 완전히 다문다",
    },
    "fifth.open_scale": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "벌림 배율",
        "desc": "입 벌림 전체 배율. 입 벌림 값을 안 건드리고 전체를 키우거나 줄일 때 쓴다",
    },
    "fifth.offset": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "입싱크 선행 프레임",
        "desc": "입 움직임을 소리보다 몇 프레임 앞당길지. 25fps 기준 2 = 80ms 선행. "
                "입이 소리보다 늦어 보이면 올린다",
    },
    "fifth.sigma": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "소리 스무딩",
        "desc": "소리 크기를 얼마나 부드럽게 다듬을지. 크면 입이 뭉근하게 움직이고, "
                "작으면 소리에 딱 붙어 파르르 떤다",
    },
    "fifth.gamma": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "반응 곡선",
        "desc": "소리 크기를 입 벌림으로 바꾸는 곡선. 1보다 크면 작은 소리에 덜 반응해 차분해진다",
    },
    "fifth.silence": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "무음 기준",
        "desc": "이 크기 이하는 무음으로 보고 입을 다문다. 높이면 숨소리에 입이 안 움직인다",
    },
    "fifth.closed_thresh": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "닫힘 전환점",
        "desc": "사진 2장을 섞는 모드에서, 이 이하면 입 다문 사진을 쓴다",
    },
    "fifth.open_thresh": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "벌림 전환점",
        "desc": "사진 2장을 섞는 모드에서, 이 이상이면 입 벌린 사진을 쓴다",
    },
    "fifth.lip_lock": {
        "type": "bool", "choices": None, "reflow": "next_call", "label": "입 강제 다뭄",
        "desc": "입을 강제로 다물게 고정한다. 소리와 무관하게 안 움직인다",
    },
    "fifth.source_face_lock": {
        "type": "bool", "choices": None, "reflow": "next_call", "label": "입 원본 고정",
        "desc": "입 모양을 원본 사진 그대로 잠근다(입 키포인트 6개만). 강제 다뭄보다 우선하며, "
                "억지로 다무는 게 아니라 사진의 자연스러운 입을 유지한다",
    },
    "fifth.source_face_lock_full": {
        "type": "bool", "choices": None, "reflow": "next_call", "label": "표정 전체 고정",
        "desc": "위 고정을 눈·눈썹까지 21개 전체로 넓힌다. 표정이 원본 사진 그대로 굳어 "
                "눈이 과하게 커지는 현상이 사라진다",
    },
    "fifth.fps": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "프레임레이트",
        "desc": "초당 프레임 수. 바꾸면 입싱크 선행 프레임의 실제 ms 도 함께 바뀐다. 기본 25",
    },

    # ---------------- fifth: 눈·머리 (per-request) ----------------
    "fifth.blink": {
        "type": "bool", "choices": None, "reflow": "next_call", "label": "눈 깜빡임",
        "desc": "눈 깜빡임을 넣는다. 끄면 눈을 안 감아 인형처럼 보인다",
    },
    "fifth.blink_interval_sec": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "깜빡임 간격(초)",
        "desc": "평균 몇 초에 한 번 깜빡일지. 짧으면 불안해 보인다. 기본 3.2",
    },
    "fifth.eyes_open_lock": {
        "type": "bool", "choices": None, "reflow": "next_call", "label": "눈 뜬 채 고정",
        "desc": "눈을 뜬 상태로 고정한다. 모델이 만든 눈 움직임과 깜빡임을 모두 무시한다",
    },
    "fifth.head_sway_amp": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "머리 흔들림 폭",
        "desc": "머리를 좌우로 흔드는 폭을 인위적으로 준다. 비우면 안 흔든다",
    },
    "fifth.head_sway_slow": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "흔들림 감속",
        "desc": "머리 흔들림 속도를 늦추는 배율. 1보다 크면 느긋하게 움직인다",
    },
    "fifth.head_yaw_offset": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "시선 좌우 보정(도)",
        "desc": "시선을 좌우로 상수만큼 틀어 놓는다. 클론이 카메라를 안 보고 있을 때 맞춘다",
    },
    "fifth.head_pitch_offset": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "시선 상하 보정(도)",
        "desc": "시선을 위아래로 상수만큼 틀어 놓는다",
    },
    "fifth.head_slew_frames": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "머리 이어붙임 프레임",
        "desc": "문장이 바뀔 때 머리 위치를 몇 프레임에 걸쳐 이어붙일지. 0이면 뚝 끊긴다",
    },
    "fifth.idle_motion_scale": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "가만히 있을 때 움직임",
        "desc": "말하지 않을 때 머리·표정 움직임을 얼마나 줄일지. 1.0이면 안 줄인다. 기본 0.15",
    },
    "fifth.idle_rms_low": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "정지 판정 기준",
        "desc": "이 소리 크기 이하를 '가만히 있는 중'으로 판정한다",
    },
    "fifth.idle_rms_high": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "발화 판정 기준",
        "desc": "이 소리 크기 이상을 '말하는 중'으로 판정한다",
    },
    "fifth.jpeg_quality": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "프레임 화질",
        "group": "latency", "stage": "송출",
        "desc": "프레임 JPEG 품질(1~100). 낮추면 인코딩·전송이 빨라지고 화질이 떨어진다. 기본 90",
    },
    "fifth.render_mode": {
        "type": "enum", "choices": ["partial", "batch"], "reflow": "next_call", "label": "렌더 방식",
        "group": "latency", "stage": "렌더",
        "desc": "batch 는 문장 전체를 다 만든 뒤 한 번에 보낸다(라이브 기본). "
                "partial 은 만들어지는 대로 조각내어 먼저 보낸다. 체감 지연과 끊김의 맞바꿈",
    },

    # ---------------- fifth: 기동 설정 (컨테이너 재기동) ----------------
    "fifth.cfg_scale": {
        "type": "number", "choices": None, "reflow": "container", "label": "표정 세기",
        "desc": "머리·표정 움직임의 세기. 3.5면 표정이 커지고 1.5 이하면 얼굴이 굳는다. 라이브 2.0",
    },
    "fifth.driving_multiplier": {
        "type": "number", "choices": None, "reflow": "container", "label": "움직임 배율",
        "desc": "움직임 전체 배율. 1.5 이상은 과장돼 부자연스럽다. 기본 1.0",
    },
    "fifth.head_smooth": {
        "type": "number", "choices": None, "reflow": "container", "label": "머리 속도 완화",
        "desc": "머리 움직임의 속도만 늦춘다(폭은 유지). 0이면 끄고, 3.5는 천천히, 5는 더 느리게. 라이브 3.5",
    },
    "fifth.blink_dur": {
        "type": "number", "choices": None, "reflow": "container", "label": "깜빡임 길이(프레임)",
        "desc": "한 번 깜빡이는 데 쓰는 프레임 수. 8이면 눈을 완전히 감는다. 기본 6",
    },
    "fifth.eye_source_lock": {
        "type": "bool", "choices": None, "reflow": "container", "label": "눈 원본 고정",
        "desc": "가만히 있을 때 눈을 원본 사진의 눈으로 고정해 눈이 과하게 커지는 걸 막는다. 라이브 켜짐",
    },
    "fifth.eye_target_scale": {
        "type": "number", "choices": None, "reflow": "container", "label": "눈 뜸 정도",
        "desc": "위 고정을 쓸 때 눈을 얼마나 뜰지 배율. 라이브 0.8",
    },
    "fifth.input_normalize": {
        "type": "bool", "choices": None, "reflow": "container", "label": "사진 자동 맞춤",
        "desc": "사진을 얼굴 중심으로 잘라 9:16(576×1024)으로 맞춘다. 끄면 원본 그대로 쓴다",
    },
    "fifth.pasteback_output": {
        "type": "bool", "choices": None, "reflow": "container", "label": "원본 비율 송출",
        "desc": "켜면 원본 비율(세로)로 내보내고, 끄면 512×512 정사각으로 잘라 내보낸다",
    },
    "fifth.cdlip_smooth": {
        "type": "bool", "choices": None, "reflow": "container", "label": "입 추가 다듬기",
        "desc": "입 움직임을 시간축으로 한 번 더 다듬는다. 떨림이 남을 때만 켠다",
    },
    "fifth.cdlip_sigma": {
        "type": "number", "choices": None, "reflow": "container", "label": "입 다듬기 강도",
        "desc": "위 다듬기의 강도. 기본 1.5",
    },

    # ---------------- FLP 플러그인 (3층 · 컨테이너 재기동) ----------------
    "flp.animation_region": {
        "type": "enum", "choices": ["all", "exp", "pose", "lip", "eyes"],
        "reflow": "container", "label": "움직일 영역",
        "desc": "얼굴 중 어디를 움직일지. all=전체, lip=입만, eyes=눈만, pose=머리만, exp=표정만",
    },
    "flp.flag_stitching": {
        "type": "bool", "choices": None, "reflow": "container", "label": "이음새 보정",
        "desc": "생성한 얼굴을 원본에 붙일 때 경계를 보정한다. 끄면 목·머리 경계가 튄다",
    },
    "flp.flag_lip_retargeting": {
        "type": "bool", "choices": None, "reflow": "container", "label": "입 재조정",
        "desc": "입 모양을 별도 모델로 다시 맞춘다. 코드가 켜 둔 값이라 yaml(꺼짐)과 다르다",
    },
    "flp.flag_eye_retargeting": {
        "type": "bool", "choices": None, "reflow": "container", "label": "눈 재조정",
        "desc": "눈을 별도 모델로 다시 맞춘다. 깜빡임을 넣으려면 켜져 있어야 한다",
    },
    "flp.flag_pasteback": {
        "type": "bool", "choices": None, "reflow": "container", "label": "원본에 되붙이기",
        "desc": "생성된 얼굴을 원본 프레임에 되붙인다. 끄면 잘린 얼굴만 나온다",
    },
    "flp.flag_normalize_lip": {
        "type": "bool", "choices": None, "reflow": "container", "label": "입 정규화",
        "desc": "입 파라미터를 정규화한다. 우리 입싱크와 충돌해 코드가 꺼 두는 값 — 실험용으로만 켠다",
    },
    "flp.lip_normalize_threshold": {
        "type": "number", "choices": None, "reflow": "container", "label": "입 정규화 임계",
        "desc": "위 정규화의 임계값. 입 정규화가 꺼져 있으면 아무 효과 없다",
    },
    "flp.cfg_scale": {
        "type": "number", "choices": None, "reflow": "container", "label": "FLP 생성 강도",
        "desc": "FLP 자체의 생성 강도. 위쪽 '표정 세기'와는 다른 층의 값이다. 기본 1.2",
    },
    "flp.driving_multiplier": {
        "type": "number", "choices": None, "reflow": "container", "label": "FLP 구동 배율",
        "desc": "FLP 층의 구동 배율. fifth 의 '움직임 배율'이 이 값을 덮어쓴다",
    },

    # ---------------- 송출 ----------------
    "transport.playback_buffer_ms": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "재생 버퍼(ms)",
        "group": "latency", "stage": "송출",
        "desc": "재생 전에 쌓아 둘 시간. 늘리면 끊김이 줄고 그만큼 지연이 늘어난다",
    },
    "transport.idle_grace_sec": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "정지 전환 유예(초)",
        "desc": "말이 끝난 뒤 가만히 있는 영상으로 넘어가기까지 기다리는 시간",
    },
    "transport.width": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "가로 해상도",
        "desc": "송출 영상 가로 픽셀. 올리면 선명해지고 인코딩·전송이 무거워진다. 기본 576",
    },
    "transport.height": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "세로 해상도",
        "desc": "송출 영상 세로 픽셀. 기본 1024(9:16)",
    },
    "transport.idle_source_mode": {
        "type": "enum", "choices": ["auto", "prebake", "clone_mp4", "fallback"],
        "reflow": "next_call", "label": "정지 영상 소스",
        "desc": "말하지 않을 때 보여줄 영상. auto=자동 선택, prebake=미리 만든 것, "
                "clone_mp4=클론 영상, fallback=기본 얼굴",
    },

    # ---------------- 필러 ----------------
    "filler.enabled": {
        "type": "bool", "choices": None, "reflow": "next_call", "label": "필러 사용",
        "group": "latency", "stage": "체감",
        "desc": "응답을 만드는 동안 '음…' 같은 소리를 먼저 낸다. 실제 지연은 그대로고 체감만 나아진다",
    },
    "filler.volume": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "필러 볼륨",
        "desc": "필러 소리 크기. 너무 크면 본 응답과 어색하게 이어진다",
    },
    "filler.padding_sec": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "필러 뒤 여백(초)",
        "desc": "필러가 끝나고 본 응답이 시작되기까지 두는 여백",
    },
    "filler.lookahead_sec": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "필러 대기(초)",
        "group": "latency", "stage": "체감",
        "desc": "응답이 이 시간 안에 안 오면 필러를 낸다. 짧으면 필러가 자주 끼어든다",
    },
    "filler.blend_frames": {
        "type": "number", "choices": None, "reflow": "next_call", "label": "장면 전환 프레임",
        "desc": "정지 영상과 말하는 영상 사이를 몇 프레임에 걸쳐 섞을지. 0이면 뚝 바뀐다",
    },
    "filler.idle_prebake": {
        "type": "bool", "choices": None, "reflow": "next_call", "label": "정지 영상 미리 굽기",
        "group": "latency", "stage": "렌더",
        "desc": "가만히 있는 영상을 미리 만들어 둔다. 첫 프레임이 빨라지는 대신 기동이 느려진다",
    },
    "filler.order": {
        "type": "enum", "choices": ["pre_speak", "off"], "reflow": "next_call", "label": "필러 재생 순서",
        "desc": "pre_speak 는 본 응답 직전에 필러를 낸다. off 는 필러를 내지 않는다",
    },
}
