import os

PORT = int(os.environ.get("QWEN3TTS_PORT", "8201"))
BIND = os.environ.get("QWEN3TTS_BIND", "127.0.0.1")

MODEL_NAME = os.environ.get("QWEN3TTS_MODEL", "Qwen/Qwen3-TTS-12Hz-1.7B-Base")
DEVICE = os.environ.get("QWEN3TTS_DEVICE", "cuda:0")  # CUDA_VISIBLE_DEVICES=1 로 GPU1 매핑
LANGUAGE = os.environ.get("QWEN3TTS_LANG", "Korean")

# OpenVoice se_path 와 동일 루트. se_path="reference_voices/<clone>/se.pth" 의 <clone> 디렉토리에서 voice.wav 사용.
REF_ROOT = os.environ.get(
    "QWEN3TTS_REF_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)
# [DEPRECATED: 합성 경로에서는 더 이상 사용하지 않음. warmup 전용으로만 분리됨]
# se_path + clone_id 둘 다 없으면 400 을 반환. 이 값은 warmup_clone 으로 대체.
DEFAULT_CLONE = os.environ.get("QWEN3TTS_DEFAULT_CLONE", "halbae")
# warmup 전용 클론. 서비스 시작 시 cold 흡수용. 합성 경로에서는 절대 사용하지 않음.
WARMUP_CLONE = os.environ.get("QWEN3TTS_WARMUP_CLONE", "halbae")
REF_CLIP_MAX_SEC = float(os.environ.get("QWEN3TTS_REF_CLIP_MAX_SEC", "10.0"))

# attention 구현. flash-attn 미설치 환경 기본 sdpa. 설치 시 QWEN3TTS_ATTN=flash_attention_2.
ATTN_IMPL = os.environ.get("QWEN3TTS_ATTN", "sdpa")
