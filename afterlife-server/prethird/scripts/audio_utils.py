"""audio_utils — wav decode / resample / avsync balance 유틸.

원본: afterlife-server/sync-mirror/publisher.deployed.py (390~470행)
변경점: import·상수 경로만 조정. 로직·시그니처·기본값은 원본과 100% 동일.
"""
from __future__ import annotations

import io
import wave

import numpy as np

from config import AUDIO_OUTPUT_SR, VIDEO_TARGET_FPS

def _decode_wav(body: bytes) -> tuple[np.ndarray, int, int]:
    """wav bytes → (int16 mono ndarray, sample_rate, channels).

    multi-channel 은 mono 로 mix.
    PCM 이외 codec 은 ValueError.
    """
    with wave.open(io.BytesIO(body), "rb") as wf:
        sr = wf.getframerate()
        ch = wf.getnchannels()
        sw = wf.getsampwidth()
        nframes = wf.getnframes()
        raw = wf.readframes(nframes)
    if sw == 2:
        arr = np.frombuffer(raw, dtype=np.int16)
    elif sw == 1:
        # u8 → s16
        u8 = np.frombuffer(raw, dtype=np.uint8).astype(np.int16)
        arr = ((u8 - 128) * 256).astype(np.int16)
    elif sw == 4:
        # int32 → int16 (downscale)
        i32 = np.frombuffer(raw, dtype=np.int32)
        arr = (i32 >> 16).astype(np.int16)
    else:
        raise ValueError(f"unsupported_wav_sampwidth: {sw}")
    if ch > 1:
        arr = arr.reshape(-1, ch).mean(axis=1).astype(np.int16)
    return arr, sr, 1

def _resample_int16(
    pcm: np.ndarray, src_sr: int, dst_sr: int = AUDIO_OUTPUT_SR
) -> np.ndarray:
    """linear interpolation resample (가벼운 의존성). mono 만 처리.

    av.audio.resampler.AudioResampler 도 사용 가능하지만, AudioFrame 변환 왕복이
    오버헤드라 PCM int16 mono 한정 빠른 linear resampler 를 직접 구현.
    품질이 부족하면 향후 av.AudioResampler 로 교체.
    """
    if src_sr == dst_sr or pcm.size == 0:
        return pcm.astype(np.int16, copy=False)
    src_n = pcm.size
    dst_n = int(round(src_n * dst_sr / src_sr))
    if dst_n <= 0:
        return np.zeros(0, dtype=np.int16)
    # 위치 인덱스 (dst frame 의 src 좌표)
    x_src = np.arange(src_n, dtype=np.float64)
    x_dst = np.linspace(0, src_n - 1, num=dst_n, dtype=np.float64)
    y = np.interp(x_dst, x_src, pcm.astype(np.float64))
    return np.clip(y, -32768.0, 32767.0).astype(np.int16)

def _balance_pcm_to_video(
    pcm: np.ndarray,
    video_frames: int,
    sr: int = AUDIO_OUTPUT_SR,
    fps: int = VIDEO_TARGET_FPS,
) -> tuple[np.ndarray, int]:
    """회차 029-D-3d-avsync-fix: 청크 audio 길이를 video 프레임 길이에 정확히 맞춤.

    근본원인: musetalk mux 가 audio(실제 TTS 길이) > video(nbf/25 양자화) 로 청크당
    ~9~30ms audio 초과분을 냄. audio 는 push_mp4 가 buffer 에 통째 burst 적재(잉여 누적),
    video 는 25fps just-in-time 페이싱(잉여 0)이라 청크 경계 starve 구간을 audio 잉여가
    메우며 content-time 이 앞서나감 → avsync offset(audio_ahead) 단조 누적.

    audio 를 video 프레임수(nbf)에 대응하는 정확한 sample 수로 맞추면(초과=tail trim,
    부족=silence pad) per-chunk a_content == v_content → audio 버퍼가 video 큐와 동시에
    비어 틈에 둘 다 정지(synced) → 누적 0. trim 분량은 sub-frame(≤40ms) tail.

    반환: (balanced_pcm, delta) delta>0=trim 한 sample 수, <0=pad 한 sample 수, 0=무변경.
    video_frames<=0 (메타 누락) 면 audio 손실 금지 위해 passthrough.
    """
    if video_frames <= 0 or pcm.size == 0:
        return pcm, 0
    target = video_frames * sr 
    cur = int(pcm.size)
    if cur > target:
        return pcm[:target], cur - target
    if cur < target:
        pad = np.zeros(target - cur, dtype=np.int16)
        return np.concatenate([pcm, pad]), cur - target
    return pcm, 0
