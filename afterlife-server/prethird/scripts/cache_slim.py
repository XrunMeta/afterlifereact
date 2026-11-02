"""MuseTalk 캐시 줄이기 (AFL-1064, sungjius 2026-11-02 "끔찍한 용량").

쿄카 감정 영상 세트 하나에 캐시 4.7GB — 프레임 PNG 2.5GB(영상과 픽셀이 같은 사본) + 입 마스크 2.2GB(584×584 uint8 무압축).
1. 프레임: 좌표 캐시가 있으면 PNG 폴더 대신 mp4 를 ffmpeg 로 바로 풀어 메모리로 읽는다(PNG 추출과 같은 ffmpeg 변환이라
   픽셀이 같다). 좌표를 처음 뽑을 때만 PNG 로 풀고, 렌더가 끝나면 지운다.
2. 마스크: zlib 으로 압축해 저장(실측 22.6MB → 1.4MB). 같은 파일 이름 — 읽을 때 머리 표시로 옛 무압축 pkl 도 읽는다.
끄기: PRETHIRD_MT_CACHE_SLIM=0 (예전과 같이 PNG 유지·무압축 저장).

mp4 를 매 렌더마다 풀면 조각당 0.2초(무감정 294프레임은 0.8초) 늦어진다(가비아 실측 11-02) → 푼 프레임을 프로세스
메모리에 LRU 로 둔다(PRETHIRD_MT_FRAME_CACHE_MB, 기본 16384 — 클론 하나 감정 세트 전체가 6.9GB, 11-02 실측). 예전 PNG 도 OS 페이지 캐시에 올라 있어서 빨랐던 것이라
메모리 사용은 비슷하다. 렌더는 프레임을 .copy() 해서 쓰므로(inference_lib ori_frame) 공유해도 안전하다.
"""
from __future__ import annotations

import logging
import os
import pickle
import subprocess
import threading
import time
import zlib
from concurrent.futures import ThreadPoolExecutor
from collections import OrderedDict

import numpy as np

log = logging.getLogger("prethird.cache_slim")

MAGIC = b"AFLZ1\n"

def enabled() -> bool:
    return os.environ.get("PRETHIRD_MT_CACHE_SLIM", "1") != "0"

def video_size(path: str) -> tuple[int, int]:
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                          "-of", "csv=p=0:s=x", path], capture_output=True, text=True, check=True).stdout.strip()
    w, h = out.split("x")[:2]
    return int(w), int(h)

_lock = threading.Lock()
_frames: "OrderedDict[tuple, list]" = OrderedDict()
_frames_bytes = 0

def _cap_bytes() -> int:
    return int(float(os.environ.get("PRETHIRD_MT_FRAME_CACHE_MB", "16384")) * 1024 * 1024)

def read_video_frames(path: str) -> list:
    """mp4 → BGR 프레임 목록. 같은 파일(경로·mtime·크기)이면 메모리에 둔 것을 돌려준다(읽기 전용으로 쓸 것)."""
    global _frames_bytes
    st = os.stat(path)
    key = (os.path.abspath(path), st.st_mtime_ns, st.st_size)
    with _lock:
        hit = _frames.get(key)
        if hit is not None:
            _frames.move_to_end(key)
            return hit
    frames = decode_video_frames(path)
    size = sum(f.nbytes for f in frames)
    with _lock:
        if key not in _frames:
            _frames[key] = frames
            _frames_bytes += size
        cap = _cap_bytes()
        while _frames_bytes > cap and len(_frames) > 1:
            _, old = _frames.popitem(last=False)
            _frames_bytes -= sum(f.nbytes for f in old)
    return frames

def decode_video_frames(path: str) -> list:
    """mp4 → BGR 프레임 목록(cv2.imread(PNG) 와 같은 모양). ffmpeg 기본 변환이라 PNG 추출 결과와 픽셀이 같다."""
    w, h = video_size(path)
    raw = subprocess.run(["ffmpeg", "-v", "fatal", "-i", path, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                         capture_output=True, check=True).stdout
    n = len(raw) 
    arr = np.frombuffer(raw[: n * w * h * 3], dtype=np.uint8).reshape(n, h, w, 3)
    return [arr[i].copy() for i in range(n)]

def load_masks(path: str):
    with open(path, "rb") as f:
        data = f.read()
    if data.startswith(MAGIC):
        return pickle.loads(zlib.decompress(data[len(MAGIC):]))
    return pickle.loads(data)

def dump_masks(path: str, masks) -> None:
    """압축 저장. tmp 에 쓰고 바꿔 끼워 읽는 쪽이 반쯤 쓴 파일을 보지 않게 한다."""
    raw = pickle.dumps(masks, protocol=pickle.HIGHEST_PROTOCOL)
    data = MAGIC + zlib.compress(raw, 6) if enabled() else raw
    tmp = f"{path}.tmp{os.getpid()}"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)

def prewarm(paths, workers: int = 4, tag: str = "") -> None:
    """영상들을 미리 풀어 메모리 캐시에 올린다(앞쪽부터 — 자주 쓰는 것을 앞에). 통화 시작 때 뒤 스레드에서 부른다.
    클론을 처음 쓸 때 영상 풀기로 감정 답 첫 소리가 0.9~1.2초 늦던 것(11-02 실통화)을 광고·인사 동안 미리 치른다.
    쿄카 33개(4694프레임) 4스레드 6.2초. 실패한 영상은 건너뛴다(렌더 때 다시 푼다)."""
    paths = [p for p in paths if p and os.path.isfile(p)]
    if not paths:
        return
    t = time.time()

    def one(p):
        try:
            read_video_frames(p)
        except Exception as e:  # noqa: BLE001 — 예열은 부가 작업
            log.warning("[AFL-1064] 예열 실패 %s: %s", p, e)

    with ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
        list(ex.map(one, paths))
    log.info("[AFL-1064] 예열 %s 영상 %d개 %.1fs 메모리 캐시 %.1fGB", tag, len(paths), time.time() - t,
             _frames_bytes / 2**30)
