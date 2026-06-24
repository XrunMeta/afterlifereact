from fractions import Fraction
import os

# 송출 캔버스(dummy/초기 프레임용). 발화·idle 프레임은 fifth 출력(576×1024) 추종.
# 세로 정합(T-078): drop-in 으로 PRETHIRD_WIDTH=576 PRETHIRD_HEIGHT=1024 적용 → 전 구간 9:16(안드로이드 표준).
WIDTH = int(os.environ.get("PRETHIRD_WIDTH", "640"))
HEIGHT = int(os.environ.get("PRETHIRD_HEIGHT", "480"))

QUEUE_MAX_DEFAULT = int(os.environ.get("PRETHIRD_QUEUE_MAX", "360"))
AUDIO_QUEUE_MAX_DEFAULT = int(os.environ.get("PRETHIRD_AUDIO_QUEUE_MAX", "600"))

AUDIO_OUTPUT_SR = 48000
AUDIO_OUTPUT_CHANNELS = 1
AUDIO_FRAME_MS = 20
AUDIO_FRAME_SAMPLES = AUDIO_OUTPUT_SR * AUDIO_FRAME_MS // 1000  # 960

VIDEO_TARGET_FPS = 25
VIDEO_CLOCK_RATE = 90000
VIDEO_PTS_INCREMENT = VIDEO_CLOCK_RATE // VIDEO_TARGET_FPS  # 3600
VIDEO_TIME_BASE = Fraction(1, VIDEO_CLOCK_RATE)

BIND = os.environ.get("PRETHIRD_BIND", "127.0.0.1")
PORT = int(os.environ.get("PRETHIRD_PORT", "8600"))

IDLE_MP4_PATH = os.environ.get("PRETHIRD_IDLE_MP4", "")
IDLE_GRACE_SEC = float(os.environ.get("IDLE_GRACE_SEC", "0.5"))

# T-070 재생 전 초기 버퍼링. 0 = 현행 동일(즉시 gate set, 회귀 0).
# K프레임 = PLAYBACK_BUFFER_MS // 40 (40ms = 25fps 1프레임)
PLAYBACK_BUFFER_MS = int(os.environ.get("PRETHIRD_PLAYBACK_BUFFER_MS", "0"))
