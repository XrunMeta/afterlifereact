"""무음 idle 모션 prebake — 정면사진 + 무음 wav 를 fifth 로 1회 렌더해
idle 루프 버퍼에 주입한다. idle 동안 GPU 점유 0(루프 재생).

무음 입력 → 입 다묾 + 머리(JoyVASA)·눈깜빡임만 움직이는 대기 화면.
프레임 0개/렌더 실패면 주입하지 않아 기존 idle 폴백.
"""
from __future__ import annotations

import logging
import os
import threading
import wave

import numpy as np

log = logging.getLogger(__name__)


def make_silent_wav(path: str, seconds: int = 6, sr: int = 16000) -> str:
    """seconds 길이 16-bit mono 무음 wav 생성. 경로 반환."""
    if seconds <= 0 or sr <= 0:
        raise ValueError(
            f"make_silent_wav: seconds>0, sr>0 필요 (seconds={seconds}, sr={sr})"
        )
    n = int(seconds * sr)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(np.zeros(n, dtype=np.int16).tobytes())
    return path


def run_prebake(renderer, face_path: str, video_track, *,
                wav_dir: str = "/tmp", seconds: int | None = None) -> int:
    """동기: 무음 wav 렌더 → 프레임 수집 → set_idle_frames 주입. 반환: 프레임 수."""
    if seconds is not None:
        secs = seconds
    else:
        try:
            secs = int(os.environ.get("FIFTH_IDLE_SEC", "6"))
            if secs <= 0:
                secs = 6
        except (TypeError, ValueError):
            secs = 6
    wav_name = f"fifth_idle_silent_{id(renderer):x}.wav"
    wav_path = make_silent_wav(os.path.join(wav_dir, wav_name), seconds=secs)
    frames: list = []
    try:
        renderer.infer(wav_path, lambda f: frames.append(np.ascontiguousarray(f)),
                       video_path=face_path)
    except Exception as exc:
        log.warning("idle prebake 렌더 실패(기존 idle 유지): %s", exc)
        return 0
    if frames:
        video_track.set_idle_frames(frames)
    else:
        log.warning("idle prebake 프레임 0개 — 기존 idle 유지")
    return len(frames)


def start_prebake(renderer, face_path: str, video_track, *, wav_dir: str = "/tmp") -> None:
    """백그라운드 스레드로 run_prebake(통화 setup 블로킹 방지)."""
    if not (renderer and face_path and video_track):
        return
    t = threading.Thread(
        target=run_prebake, args=(renderer, face_path, video_track),
        kwargs={"wav_dir": wav_dir}, daemon=True, name="fifth-idle-prebake",
    )
    t.start()
