"""CosyVoice2 어댑터 설정 — qwen3tts config 미러(포트/디바이스만 다름). T-120 cosyvoice."""
import os

PORT = int(os.environ.get("COSYVOICE_PORT", "8203"))          # 8200 OpenVoice·8201 qwen3·8202 STT → 8203
BIND = os.environ.get("COSYVOICE_BIND", "127.0.0.1")

# AFL-1034: 같은 어댑터로 CosyVoice2(v2, :8203 · 기본) / Fun-CosyVoice3(v3, :8205 · 스페인어) 를 띄운다.
VARIANT = os.environ.get("COSYVOICE_VARIANT", "v2").strip().lower()
IS_V3 = VARIANT == "v3"
ENGINE_NAME = "cosyvoice3" if IS_V3 else "cosyvoice2"
# v3 는 프롬프트 텍스트 앞에 이 접두어를 붙인다(공식 예제 · AFL-1033 README 8절).
PROMPT_TEXT_PREFIX = os.environ.get(
    "COSYVOICE_PROMPT_TEXT_PREFIX",
    "You are a helpful assistant.<|endofprompt|>" if IS_V3 else "",
)

# 로컬 가중치 디렉터리(HF snapshot). CUDA_VISIBLE_DEVICES=1 로 GPU1 매핑.
MODEL_DIR = os.environ.get(
    "COSYVOICE_MODEL_DIR",
    "/home/afterlife/cosyvoice-poc/pretrained_models/"
    + ("Fun-CosyVoice3-0.5B" if IS_V3 else "CosyVoice2-0.5B"),
)
FP16 = os.environ.get("COSYVOICE_FP16", "0") == "1"           # 0.5B는 fp32도 여유(GPU1 40GB)

# OpenVoice/qwen3 와 동일 참조 루트. se_path="reference_voices/<clone>/se.pth" → <clone>/voice.wav.
REF_ROOT = os.environ.get(
    "COSYVOICE_REF_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)
REF_CLIP_MAX_SEC = float(os.environ.get("COSYVOICE_REF_CLIP_MAX_SEC", "10.0"))  # ref_text.meta duration=10 정합

# 클론별 프롬프트 캐시(트림 10s wav 저장 → add_zero_shot_spk). 재기동 시 재생성.
PROMPT_CACHE_DIR = os.environ.get(
    "COSYVOICE_PROMPT_CACHE",
    "/home/afterlife/cosyvoice-poc/prompt_cache" + ("_v3" if IS_V3 else ""),
)

# warmup 전용 클론(cold 흡수). 합성 경로에서는 사용 안 함. 없으면 skip.
WARMUP_CLONE = os.environ.get("COSYVOICE_WARMUP_CLONE", "9075")

# CV2 기본 발화속도. 벤치상 CV2가 천천히 말해(dur 큼) 통화 톤에 speed>1.0 튜닝 여지.
DEFAULT_SPEED = float(os.environ.get("COSYVOICE_DEFAULT_SPEED", "1.0"))

# 정규화 후 빈 텍스트(문장부호만·이모지)로 CV2가 무음일 때 반환할 무음 길이(ms).
# 503 드롭 대신 짧은 멈춤으로 처리 → 스트리밍 파이프라인 무중단.
EMPTY_SILENCE_MS = int(os.environ.get("COSYVOICE_EMPTY_SILENCE_MS", "120"))

# 프롬프트 끝 무음 패딩(ms) — 하드컷 경계로 인한 선행 아티팩트("똥" 환청) 제거.
# 0 이면 비활성. 실측 최적 300ms(lead-RMS 1607→16).
PROMPT_TAIL_SILENCE_MS = int(os.environ.get("COSYVOICE_PROMPT_TAIL_SILENCE_MS", "300"))

# 합성 결과 문장 앞 무음 상한(ms) — 견본의 머뭇거림을 따라 생기는 0.2~1.2초 앞 무음을 이 길이로 줄인다.
# 0 이면 비활성. lead_trim.py 참조.
LEAD_SILENCE_MAX_MS = int(os.environ.get("COSYVOICE_LEAD_SILENCE_MAX_MS", "300"))

# 문장 안 정적 상한(초) — 첫 소리와 마지막 소리 사이 조용한 구간이 이보다 길면 폭주처럼 다시 합성한다.
# CosyVoice 가 드물게 단어 중간에서 끊고 0.7초쯤 쉬었다 잇는다("말 이어가." → "마…리오가", AFL-1059).
# 문장 중간에 문장부호(쉼표·마침표)가 있으면 그 자리 쉼은 자연스러워 더 길게 허용한다 — 프리셋도 쉼표에서
# 0.6~0.75초 쉰다. 2026-10-27 스캔(문장 176개): 0.7/1.0 이면 프리셋 재합성 0.3%, 문장부호 넣은 사용자 견본 12%.
# 0 이면 끔.
INNER_GAP_MAX_SEC = float(os.environ.get("COSYVOICE_INNER_GAP_MAX_SEC", "0.7"))
# 말 앞 잡음 가드(AFL-1072 실통화): 첫 말소리 앞 '쉬익' 잡음이 이보다 길면 재합성, 끝까지 남으면 잘라낸다.
# 감정 은행 섞기에서 드물게 3초쯤 붙는다. 0 이면 끔.
LEAD_HISS_MAX_SEC = float(os.environ.get("COSYVOICE_LEAD_HISS_MAX_SEC", "0.5"))
INNER_GAP_PUNCT_MAX_SEC = float(os.environ.get("COSYVOICE_INNER_GAP_PUNCT_MAX_SEC", "1.0"))

# 폭주(hallucination) 가드: 합성 길이가 예상(가산식 = BASE + 문자수×PER_CHAR)을 초과하면
# CV2 과생성으로 보고 재합성(RETRIES회). 실측(20회): 정상 클러스터 2.4~5.7s / 폭주 8~10.4s.
# BASE 1.8 + 0.28/자 → 20자=7.4s(두 클러스터 사이). 고정합성 오버헤드는 BASE, 길이비례는 PER_CHAR.
RAMBLE_BASE_SEC = float(os.environ.get("COSYVOICE_RAMBLE_BASE_SEC", "1.8"))
RAMBLE_PER_CHAR_SEC = float(os.environ.get("COSYVOICE_RAMBLE_PER_CHAR_SEC", "0.28"))
RAMBLE_RETRIES = int(os.environ.get("COSYVOICE_RAMBLE_RETRIES", "3"))

# LLM 샘플링 — 1차(자연성): 히즈키 청취로 top_k=5 확정(자연성↑). 폭주율 ~50%지만 폭주분은
# 아래 FALLBACK 으로 재합성. >0 적용, <=0 yaml 기본. 실측 폭주율: 25→60%·10→40%·5→50%·1→20%.
SAMPLING_TOP_K = int(os.environ.get("COSYVOICE_SAMPLING_TOP_K", "5"))
SAMPLING_TOP_P = float(os.environ.get("COSYVOICE_SAMPLING_TOP_P", "0.8"))
# 폭주 재합성 시 폴백 top_k — greedy(1)=폭주 20%로 가장 안정. 재합성만 이 값 사용(밋밋하나 노이즈 아님).
# 조합 escape ≈ P(top5 폭주)×P(greedy 폭주)^retries = 0.5×0.2^3 ≈ 0.4%.
RAMBLE_FALLBACK_TOP_K = int(os.environ.get("COSYVOICE_RAMBLE_FALLBACK_TOP_K", "1"))

# 감정 은행(AFL-1069) — TTS 요청의 emotion(AFL-1067 LLM 감정 태그)으로 은행 견본을 골라
# 말투(LLM 단계)는 은행 견본, 음색(flow 단계)은 클론 견본으로 합성한다. 기본 OFF.
# 은행 = EMO_BANK_DIR 의 <이름>.wav + <이름>.txt(대사 원문). 맵에 없는 감정(neutral·calm 등)은 클론만.
EMO_BANK_ENABLED = os.environ.get("COSYVOICE_EMO_BANK", "0") == "1"
EMO_BANK_DIR = os.environ.get("COSYVOICE_EMO_BANK_DIR", "/data/emo_bank_20261030")


def parse_emo_bank_map(spec: str) -> dict:
    """'happy=happy_ainsley,sad=sad_hana' → {감정: 은행 이름}. 빈 칸·잘못된 조각은 버린다."""
    out = {}
    for part in spec.split(","):
        emo, _, name = part.partition("=")
        emo, name = emo.strip().lower(), name.strip()
        if emo and name:
            out[emo] = name
    return out


# 2026-10-30 sungjius 청취로 확정: 기쁨·다정·화남=Ainsley, 슬픔=Hana(ElevenLabs 한국어).
EMO_BANK_MAP = parse_emo_bank_map(os.environ.get(
    "COSYVOICE_EMO_BANK_MAP", "happy=happy_ainsley,sad=sad_hana,warm=warm_ainsley,angry=angry_ainsley"))

# 관리자 화면(AFL-1072)이 쓰는 공용 설정 파일 — 있으면 은행 스위치·맵을 env 대신 이 파일에서 읽는다.
# prethird 관리자 endpoint 가 원자적으로 써 두면 mtime 이 바뀐 다음 요청부터 재시작 없이 반영된다.
EMOTION_CONFIG_PATH = os.environ.get("EMOTION_CONFIG_PATH", "/data/emotion_config.json")
_emo_cfg_cache = {"key": None, "path": None, "value": None}


def _read_emo_cfg(path: str):
    """파일 → (enabled, mapping). 구조가 틀리면 ValueError. choice 의 null 은 맵에서 뺀다."""
    import json
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    voice = data["voice"]
    enabled = voice["enabled"]
    choice = voice["choice"]
    if not isinstance(enabled, bool) or not isinstance(choice, dict):
        raise ValueError("voice.enabled/choice 형식 오류")
    mapping = {}
    for emo, name in choice.items():
        if name is None:
            continue
        if not isinstance(emo, str) or not isinstance(name, str):
            raise ValueError("voice.choice 값 형식 오류")
        emo, name = emo.strip().lower(), name.strip()
        if emo and name:
            mapping[emo] = name
    return enabled, mapping


def emo_bank_settings():
    """(은행 켜짐, {감정: 은행 이름}). 설정 파일이 있으면 그것을(파일이 바뀔 때만 재파싱),
    없거나 깨졌으면 env 값(EMO_BANK_ENABLED·EMO_BANK_MAP)으로 폴백한다. 깨진 경우 경고는 1회."""
    c = _emo_cfg_cache
    path = EMOTION_CONFIG_PATH
    try:
        st = os.stat(path)
    except OSError:
        c.update(key=None, path=path, value=None)
        return EMO_BANK_ENABLED, EMO_BANK_MAP
    # 같은 mtime 으로 os.replace 된 새 파일도 잡도록 inode·크기까지 키에 넣는다.
    key = (st.st_ino, st.st_mtime_ns, st.st_size)
    if c["path"] != path or c["key"] != key:
        try:
            c["value"] = _read_emo_cfg(path)
        except Exception as e:  # 깨진 JSON·스키마 위반 — 합성을 멈추지 않고 env 로
            c["value"] = None
            import logging
            logging.getLogger(__name__).warning("[emo-bank] 설정 파일 %s 읽기 실패 → env 폴백: %s", path, e)
        c["key"], c["path"] = key, path
    if c["value"] is None:
        return EMO_BANK_ENABLED, EMO_BANK_MAP
    return c["value"]


# 시드 고정(AFL-746, 2026-09-18 라이브에서 직접 추가된 것을 AFL-1002 에서 repo 로 흡수).
# 같은 (clone_id, text, 재시도 회차)는 늘 같은 소리 → 발음 문제를 재현할 수 있다. 0 이면 끔.
SEED_LOCK = os.environ.get("COSYVOICE_SEED_LOCK", "1") == "1"
SEED_OFFSET = int(os.environ.get("COSYVOICE_SEED_OFFSET", "0"))
