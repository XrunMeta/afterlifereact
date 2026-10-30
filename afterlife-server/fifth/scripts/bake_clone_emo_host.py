"""클론 감정 영상 세트 — 호스트(MuseTalk) 단계 (AFL-1064). bake_clone_emo.sh 가 부른다.

  python bake_clone_emo_host.py <clone_id> <out_dir>

1. idle = 무감정 클립 사이클 전체(정방향+역방향)를 무음 + 무음 입 다물기로 MuseTalk 렌더 → <clone>-emo-idle.mp4
   idle·말하기 입 질감이 같아져 말끝 입 변화가 줄고, 무음 입 다물기로 idle 우물거림이 없다.
   이 렌더가 무감정 클립의 MuseTalk 캐시(좌표·latent·마스크)도 사이클 전체로 채운다.
2. 감정 클립마다 사이클 전체를 무음 렌더해 MuseTalk 캐시를 채운다.
   비어 있으면 통화 중 그 구간을 처음 쓰는 조각이 9~13초 걸린다(2026-10-30 준식이 실통화).

라이브 prethird 코드(MuseTalkInproc · inference_lib)와 라이브 캐시 폴더를 그대로 쓴다. 시작 위치는 start_rot=0.
무음 입 다물기 기준은 closed_mouth_pad2.pt — 라이브 silence_mouth.py 가 옛 판이면 기본값(closed_mouth.pt)이
모양 불일치로 건너뛰므로 PRETHIRD_SILENT_MOUTH_REF 로 직접 준다.
"""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path

import numpy as np

PRETHIRD = Path(os.environ.get("PRETHIRD_DIR", "/home/afterlife/afterlife-server/prethird"))
CLIPS = ("warm_calm", "agreement", "serious", "disagreement")
FPS = 25


def _silent_wav(frames: int, tmp: Path) -> Path:
    w = tmp / f"silent_{frames}.wav"
    if not w.exists():
        with wave.open(str(w), "wb") as f:
            f.setnchannels(1)
            f.setsampwidth(2)
            f.setframerate(16000)
            f.writeframes(b"\x00\x00" * int(16000 * frames / FPS))
    return w


def main() -> None:
    clone, out = sys.argv[1], Path(sys.argv[2])
    os.environ["PRETHIRD_SILENT_MOUTH"] = "1"
    os.environ.setdefault("PRETHIRD_SILENT_MOUTH_REF", str(PRETHIRD / "assets" / "closed_mouth_pad2.pt"))
    sys.path.insert(0, str(PRETHIRD / "scripts"))
    from idle import _load_idle_frames  # noqa: PLC0415
    from musetalk_inproc import MuseTalkInproc  # noqa: PLC0415

    t0 = time.time()
    neutral = out / f"{clone}-emo-neutral.mp4"
    mt = MuseTalkInproc(video_path=str(neutral))
    mt.load()
    print(f"[시간] MuseTalk 모델 로드 {time.time() - t0:.1f}s (생성 서버에 상주하면 0)", flush=True)

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        t = time.time()
        cycle = 2 * len(_load_idle_frames(str(neutral)))
        idle: list = []
        mt.infer(str(_silent_wav(cycle, tmp)), on_frame=idle.append, video_path=str(neutral), start_rot=0)
        h, w, _ = idle[0].shape
        dst = out / f"{clone}-emo-idle.mp4"
        p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
                              "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p",
                              str(dst)], stdin=subprocess.PIPE)
        for f in idle:
            p.stdin.write(np.ascontiguousarray(f).tobytes())
        p.stdin.close()
        if p.wait() != 0:
            raise RuntimeError(f"idle 인코딩 실패: {dst}")
        print(f"[시간] idle 굽기(무감정 {cycle}프레임 + 캐시) {time.time() - t:.1f}s", flush=True)

        for clip in CLIPS:
            v = out / f"{clone}-emo-{clip}.mp4"
            if not v.exists():
                continue
            t = time.time()
            c = 2 * len(_load_idle_frames(str(v)))
            mt.infer(str(_silent_wav(c, tmp)), on_frame=lambda *_: None, video_path=str(v), start_rot=0)
            print(f"[시간] 캐시 {clip}({c}프레임) {time.time() - t:.1f}s", flush=True)
    print(f"[시간] 호스트 단계 합계 {time.time() - t0:.1f}s", flush=True)


if __name__ == "__main__":
    main()
