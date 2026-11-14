# AFL-1096 영상 A/B — 같은 음성·같은 시작 프레임으로 MuseTalk 입싱크를 BiSeNet 마스크 / MediaPipe 마스크로 각각 렌더해
# 나란히 붙인다. 라이브 무변경: 결과·캐시·설정 파일은 전부 /tmp/afl1096-render/ (라이브 캐시는 읽어서 복사만).
# 가비아 호스트 musetalk env, CUDA_VISIBLE_DEVICES=0, PYTHONDONTWRITEBYTECODE=1 로 실행.
import os
import shutil
import subprocess
import sys
from pathlib import Path

PRETHIRD = "/home/afterlife/afterlife-server/prethird/scripts"
LIVE_CACHE = Path("/data/character/cache/musetalk-outputs")
REF = Path("/home/afterlife/afterlife-server/prethird/video-ref")
WORK = Path("/tmp/afl1096-render")
WAV_SRC = os.environ.get("AB_WAV", "/data/records/9194/1792197004693-answer.wav")
STEMS = os.environ.get("AB_STEMS", "9236-emo-neutral,9068-idle-25fps,9245-idle-25fps,9194-idle-25fps").split(",")
SECS = float(os.environ.get("AB_SECS", "6"))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PRETHIRD)
WORK.mkdir(parents=True, exist_ok=True)
(WORK / "configs").mkdir(exist_ok=True)
(WORK / "out").mkdir(exist_ok=True)

import musetalk_inproc as mi  # noqa: E402

mi.CONFIG_DIR = WORK / "configs"  # runtime yaml 을 라이브 configs 폴더에 쓰지 않게


def video_for(stem):
    c = stem.split("-")[0]
    for p in (REF / c / f"{stem}.mp4", REF / c / "emo" / f"{stem}.mp4"):
        if p.exists():
            return p
    raise FileNotFoundError(stem)


wav = WORK / "speech.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", WAV_SRC, "-t", str(SECS), "-ac", "1", "-ar", "16000", str(wav)], check=True)

mt = mi.MuseTalkInproc(video_path=str(video_for(STEMS[0])))
mt.load()
os.chdir(mi.SOURCE_DIR)
from mp_face_parsing import MediaPipeFaceParsing  # noqa: E402  (musetalk 경로가 잡힌 뒤 import)

parsers = {"bisenet": mt._models["fp"], "mediapipe": MediaPipeFaceParsing(left_cheek_width=90, right_cheek_width=90)}

import cv2  # noqa: E402

for stem in STEMS:
    vp = video_for(stem)
    outs = {}
    for name, fp in parsers.items():
        root = WORK / name
        (root / "v15").mkdir(parents=True, exist_ok=True)
        for suffix in (".pkl", ".latents_vv15_em10.pkl"):  # 좌표·latent 만 복사(마스크 캐시는 각자 새로 만든다)
            src = LIVE_CACHE / f"{stem}{suffix}"
            if src.exists() and not (root / src.name).exists():
                shutil.copy2(src, root / src.name)
        mi.RESULT_DIR = root / "v15"
        mt._models["fp"] = fp
        frames = []
        n = mt.infer(str(wav), frames.append, video_path=str(vp), start_rot=0)
        raw = WORK / "out" / f"{stem}_{name}_raw.mp4"
        h, w = frames[0].shape[:2]
        vw = cv2.VideoWriter(str(raw), cv2.VideoWriter_fourcc(*"mp4v"), 25, (w, h))
        for f in frames:
            vw.write(cv2.cvtColor(f, cv2.COLOR_RGB2BGR))
        vw.release()
        outs[name] = raw
        print(f"[render_ab] {stem} {name} frames={n}", flush=True)
    cmp_path = WORK / "out" / f"{stem}_cmp.mp4"
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-i", str(outs["bisenet"]), "-i", str(outs["mediapipe"]), "-i", str(wav),
        "-filter_complex",
        "[0:v]scale=480:-2,drawtext=text='BiSeNet (now)':x=10:y=10:fontsize=24:fontcolor=white:box=1:boxcolor=black[a];"
        "[1:v]scale=480:-2,drawtext=text='MediaPipe':x=10:y=10:fontsize=24:fontcolor=white:box=1:boxcolor=black[b];"
        "[a][b]hstack[v]",
        "-map", "[v]", "-map", "2:a", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
        str(cmp_path)], check=True)
    print(f"[render_ab] saved {cmp_path}", flush=True)
print("[render_ab] DONE", flush=True)
