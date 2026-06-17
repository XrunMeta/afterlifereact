import os

PORT = int(os.environ.get("STT_PORT", "8202"))
BIND = os.environ.get("STT_BIND", "127.0.0.1")

MODEL = os.environ.get("STT_MODEL", "large-v3")
DEVICE = os.environ.get("STT_DEVICE", "cpu")       # GPU 경합 회피 기본 cpu
COMPUTE_TYPE = os.environ.get("STT_COMPUTE_TYPE", "int8")
LANG = os.environ.get("STT_LANG", "ko")

# clone 참조음성 루트 (OpenVoice/qwen3tts 와 공유)
REF_ROOT = os.environ.get(
    "REF_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)

# 전사할 ref_audio 앞부분 최대 초 (물리 cut).
# ⚠️ qwen3tts 엔진 REF_CLIP_MAX_SEC(=10.0, qwen3tts/scripts/config.py)와 **반드시 일치**해야 한다.
# 엔진은 voice.wav 앞 REF_CLIP_MAX_SEC 초를 ref_audio 로, STT 는 앞 STT_MAX_SEC 초를 전사해
# ref_text 로 쓴다. 두 값이 어긋나면 ref_text 가 ref_audio 보다 길어져 ICL 합성 출력 앞에
# 누설된다(클론이 참조 대본을 먼저 읊는 버그). 운영 unit 에도 STT_MAX_SEC=10 명시.
STT_MAX_SEC = float(os.environ.get("STT_MAX_SEC", "10"))

# path traversal 허용 prefix 목록 (; 구분). REF_ROOT 는 항상 포함.
ALLOWED_PREFIXES_EXTRA = os.environ.get("STT_ALLOWED_PREFIXES", "")

# 전사 sanity: 한글 음절 최소 개수 / 한글 비율 하한
MIN_HANGUL = int(os.environ.get("STT_MIN_HANGUL", "5"))
MIN_HANGUL_RATIO = float(os.environ.get("STT_MIN_HANGUL_RATIO", "0.4"))
