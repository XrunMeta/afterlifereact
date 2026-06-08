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
# se_path 미전달 시 사용할 기본 클론(OpenVoice TTS_VOICE_CLONE 패턴). 빈 값이면 400.
DEFAULT_CLONE = os.environ.get("QWEN3TTS_DEFAULT_CLONE", "halbae")
REF_CLIP_MAX_SEC = float(os.environ.get("QWEN3TTS_REF_CLIP_MAX_SEC", "10.0"))
