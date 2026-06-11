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

def _apply_edge_fade(
    pcm: np.ndarray, sr: int = AUDIO_OUTPUT_SR, fade_ms: float = 8.0
) -> np.ndarray:
    """청크 경계 클릭/팝 제거용 짧은 fade-in/out. overlap 아님 → 길이 불변(avsync 무영향).

    하드컷 청크 경계의 진폭 불연속이 'tick' 잡음을 만든다. 시작·끝 fade_ms 구간을
    선형 ramp 로 감싸 불연속을 없앤다. fade_ms<=0 또는 빈 배열이면 무변경.
    """
    if pcm.size == 0 or fade_ms <= 0:
        return pcm
    n = int(sr * fade_ms / 1000.0)
    n = min(n, pcm.size 
    if n <= 0:
        return pcm
    out = pcm.astype(np.float32)
    ramp = np.linspace(0.0, 1.0, n, dtype=np.float32)
    out[:n] *= ramp
    out[-n:] *= ramp[::-1]
    return np.clip(out, -32768.0, 32767.0).astype(np.int16)

def _normalize_peak(
    pcm: np.ndarray,
    target_peak: float = 0.89,
    gain_min: float = 0.7,
    gain_max: float = 1.8,
    silence_floor: int = 512,
) -> np.ndarray:
    """청크 peak 를 target_peak(≈-1dBFS)로 맞추되 gain 을 [gain_min, gain_max] 로 클램프.

    청크별 정규화는 잘못하면 음량 출렁임을 만든다(P1 악화). 세 안전장치:
      - near-silence(peak<silence_floor=512) 청크는 무변경(무음/trailing-silence 폭증 방지).
        floor 를 64→512 로 높여, silence_floor 바로 위 청크가 gain_max 로 튀는 경계 역효과를 차단.
      - 부스트는 보수적(gain_max=1.8, +5dB 상한)으로 조용한 청크 과증폭·노이즈 부각 억제.
      - 감쇠도 제한(gain_min=0.7, -3dB) — 큰 청크만 완만히 낮춤.
    TTS 출력이 균일하면 gain≈1 이라 실질 효과는 '튀는 청크 완화'.
    """
    if pcm.size == 0:
        return pcm
    peak = float(np.max(np.abs(pcm.astype(np.float32))))
    if peak < silence_floor:
        return pcm
    gain = (target_peak * 32767.0) / peak
    gain = float(np.clip(gain, gain_min, gain_max))
    if abs(gain - 1.0) < 1e-3:
        return pcm
    out = pcm.astype(np.float32) * gain
    return np.clip(out, -32768.0, 32767.0).astype(np.int16)
