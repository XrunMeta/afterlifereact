"""CosyVoice2 어댑터 설정 — qwen3tts config 미러(포트/디바이스만 다름). T-120 cosyvoice."""
import os

PORT = int(os.environ.get("COSYVOICE_PORT", "8203"))          # 8200 OpenVoice·8201 qwen3·8202 STT → 8203
BIND = os.environ.get("COSYVOICE_BIND", "127.0.0.1")

# CosyVoice2-0.5B 로컬 가중치 디렉터리(HF snapshot). CUDA_VISIBLE_DEVICES=1 로 GPU1 매핑.
MODEL_DIR = os.environ.get(
    "COSYVOICE_MODEL_DIR",
    "/home/afterlife/cosyvoice-poc/pretrained_models/CosyVoice2-0.5B",
)
FP16 = os.environ.get("COSYVOICE_FP16", "0") == "1"           # 0.5B는 fp32도 여유(GPU1 40GB)

# OpenVoice/qwen3 와 동일 참조 루트. se_path="reference_voices/<clone>/se.pth" → <clone>/voice.wav.
REF_ROOT = os.environ.get(
    "COSYVOICE_REF_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)
REF_CLIP_MAX_SEC = float(os.environ.get("COSYVOICE_REF_CLIP_MAX_SEC", "10.0"))  # ref_text.meta duration=10 정합

# 클론별 프롬프트 캐시(트림 10s wav 저장 → add_zero_shot_spk). 재기동 시 재생성.
PROMPT_CACHE_DIR = os.environ.get("COSYVOICE_PROMPT_CACHE", "/home/afterlife/cosyvoice-poc/prompt_cache")

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
