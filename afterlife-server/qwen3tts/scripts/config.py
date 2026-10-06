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

# --- 폭주 차단 상한 (2026-10-03 실통화) -------------------------------------------
# 한 문장이 끝(EOS)을 못 내고 모델 기본 상한(generation_config.json 8192토큰)까지
# 8분 넘게 생성하며 _SYNTH_LOCK 을 쥐어, 그 뒤 모든 통화의 합성이 줄을 섰다.
# 상한은 prethird 의 한 문장 대기 상한(PRETHIRD_TTS_TIMEOUT_S=60)과 맞춘다 — prethird 가
# 포기할 때 여기서도 생성이 끝나야 잠금이 풀린다. qwen_tts 는 시간 기준 중단(max_time)을
# 넘겨주지 않아 토큰으로 환산: 가비아 GPU0 실측 16.5토큰/초 × 58초 ≈ 960토큰.
MAX_NEW_TOKENS = int(os.environ.get("QWEN3TTS_MAX_NEW_TOKENS", "960"))
MAX_TEXT_CHARS = int(os.environ.get("QWEN3TTS_MAX_TEXT_CHARS", "500"))

# 글자 수 비례 상한 — 짧은 문장이 폭주하면 1분이 아니라 몇 초 만에 끊는다.
# 상한(초) = 글자 수(공백·문장부호 제외) / RAMBLE_CHARS_PER_SEC + RAMBLE_BASE_SEC.
# 근거: 가비아 /data/records 실통화 503건(앞뒤 무음 포함)의 가장 느린 정상 발화도
# 이 식 안에 든다(유일한 예외 13자 10.9초는 견본 누출로 의심되는 출력).
RAMBLE_CHARS_PER_SEC = float(os.environ.get("QWEN3TTS_RAMBLE_CHARS_PER_SEC", "2.0"))
RAMBLE_BASE_SEC = float(os.environ.get("QWEN3TTS_RAMBLE_BASE_SEC", "3.0"))
# 상한에 걸린 출력은 길이가 상한의 0.93~0.96 이 된다(실측). 이 비율 이상이면 폭주로 본다.
RAMBLE_HIT_RATIO = float(os.environ.get("QWEN3TTS_RAMBLE_HIT_RATIO", "0.9"))
# 폭주 판정 시 다른 seed 로 다시 생성할 횟수. 모두 폭주면 503(웅얼거림을 내보내지 않는다).
RAMBLE_RETRIES = int(os.environ.get("QWEN3TTS_RAMBLE_RETRIES", "1"))

# attention 구현. flash-attn 미설치 환경 기본 sdpa. 설치 시 QWEN3TTS_ATTN=flash_attention_2.
ATTN_IMPL = os.environ.get("QWEN3TTS_ATTN", "sdpa")

# --- 화자 검증 가드 (경계 화자의 짧은 발화 화자 붕괴 출력단 차단) ----------------
# 배경: 낮은 톤 여성 등 경계 화자(예: 9055 ~180Hz)는 qwen 짧은 발화에서 확률적으로
#   남성으로 붕괴(speaker embedding cos 측정: 정상 >=0.98, 붕괴 0.91~0.95).
# 동작: 합성 wav 의 speaker embedding 이 ref 와 cos<SPK_GUARD_COS 면 다른 seed 로
#   재합성(최대 SPK_GUARD_RETRIES 회). 모두 미달이면 최선(best cos) 반환(무한루프 방지).
# RETRIES=0 또는 COS<=0 이면 가드 off(회귀). 재합성은 붕괴 시에만 발생(병합으로 드묾).
SPK_GUARD_COS = float(os.environ.get("QWEN3TTS_SPK_GUARD_COS", "0.95"))
SPK_GUARD_RETRIES = int(os.environ.get("QWEN3TTS_SPK_GUARD_RETRIES", "2"))
