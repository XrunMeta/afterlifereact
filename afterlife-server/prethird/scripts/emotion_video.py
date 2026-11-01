"""AFL-1064 감정 영상 — 답 감정(AFL-1067 <emo=…>)에 맞는 클립을 MuseTalk 기본 영상으로 쓴다.

클론별 자산(가비아 video-ref/<clone>/emo/<clone>-emo-<clip>.mp4):
  neutral  무감정 구동영상 클립 — 보통 말하기 기본 영상
  idle     neutral 을 MuseTalk 무음(입 다물기)으로 미리 구운 사이클(정방향+역방향) — 통화 idle
  warm_calm · agreement · serious · disagreement  감정 클립(없으면 무감정으로)
클립은 fifth/scripts/build_driving_motion.py → render_emotion_clip.py 로만 만든다(보정 강제).

재생 위치("한 시계"):
  - 한 답 안의 문장 조각들은 앞 조각이 끝난 위치에서 이어 렌더한다(조각마다 랜덤이면 움직임 큰 영상이 튄다).
  - 감정 클립은 0번(중립 자세)부터. 무감정은 idle 이 재생 중인 위치부터 — idle 과 같은 영상이라 자세가 이어진다.
  - 무감정 답이 끝나면 idle 이 그 위치에서 이어서 재생한다. 감정 답 뒤에는 idle 처음(중립)부터.

켜기(둘 중 하나):
  - 허용 클론 — 관리자 「감정 설정」 영상(AFL-1072, /data/emotion_config.json 의 video.mode off·all·some)이 정본.
    파일이나 video 값이 없거나 깨졌으면 PRETHIRD_EMO_VIDEO_CLONES="9232,…" env 로(준비 표시 없이 손으로 구운 세트).
    all 이어도 자산(무감정·idle)이 없는 클론은 find_assets 가 None 이라 기존 영상 그대로.
  - PRETHIRD_EMO_VIDEO_AUTO=1 — 준비 표시(emo/ready.txt)가 있는 클론 전부. 없으면 통화 시작 때 굽기를 대기열에 넣는다(emo_bake).
  둘 다 비어 있으면 끔 — 지금 동작과 같다.

단계별 굽기(sungjius 11-01): 기본 세트(무감정·idle·찬성)를 먼저 굽고, 나머지는 뒤에 굽는다.
ready.txt 에는 MuseTalk 캐시까지 채운 클립만 한 줄씩 적힌다. 파일이 있으면 적힌 클립만 쓴다(굽는 중인 파일 제외).
바뀐 세트는 다음 통화부터 반영된다(통화 중에는 클립 목록을 바꾸지 않는다).
연결표 정본: 메모리 project_afterlife_emotion_video_map (sungjius 10-30 결정, 목소리 감정이 늘면 확장).
"""
from __future__ import annotations

import json
import logging
import os
import re
import threading

log = logging.getLogger("prethird.emotion_video")

# AFL-1067 EMOTIONS 6종 → 클립. calm 은 warm 쏠림(시뮬 64%) 때문에 무감정으로 보낸다.
CLIP_FOR_EMO = {
    "neutral": "neutral",
    "calm": "neutral",
    "warm": "warm_calm",
    "happy": "agreement",  # 임시 — 입 다문 미소 클립이 생기면 교체
    "sad": "serious",
    "angry": "disagreement",
}
CLIPS = ("neutral", "idle", "warm_calm", "agreement", "serious", "disagreement")
BASE_CLIPS = ("neutral", "idle", "agreement")  # 먼저 굽는 기본 세트
NEUTRAL = "neutral"
READY = "ready.txt"


_CLONE_RE = re.compile(r"[0-9]+|preset-[0-9]+")
_cfg_lock = threading.Lock()
_cfg_cache = {"key": None, "value": None}


def _config_path() -> str:
    return os.environ.get("EMOTION_CONFIG_PATH", "/data/emotion_config.json")


def _parse_video(raw: dict) -> tuple[str, frozenset]:
    v = raw["video"]
    mode = v["mode"]
    if mode not in ("off", "all", "some"):
        raise ValueError(f"video.mode={mode!r}")
    clones = v.get("clones") or []
    if not isinstance(clones, list) or not all(isinstance(c, str) and _CLONE_RE.fullmatch(c) for c in clones):
        raise ValueError("video.clones 형식")
    return mode, frozenset(clones)


def file_video_setting() -> tuple[str, frozenset] | None:
    """관리자 설정 파일의 영상 값 (mode, clones). 파일·video 값이 없거나 깨졌으면 None(→ env).

    통화 시작마다 불리므로 (ino, mtime_ns, size) 가 같으면 다시 읽지 않는다 — 관리자가 저장하면 다음 통화부터 반영."""
    path = _config_path()
    try:
        st = os.stat(path)
    except OSError:
        return None
    key = (st.st_ino, st.st_mtime_ns, st.st_size)
    with _cfg_lock:
        if _cfg_cache["key"] == key:
            return _cfg_cache["value"]
        try:
            with open(path, encoding="utf-8") as f:
                raw = json.load(f)
            value = _parse_video(raw) if isinstance(raw, dict) and "video" in raw else None
        except (OSError, ValueError, KeyError, TypeError) as e:
            log.warning("[AFL-1072] 감정 설정 파일 영상 값 무시(env 사용): %s", e)
            value = None
        _cfg_cache["key"], _cfg_cache["value"] = key, value
        return value


def enabled_for(clone_id) -> bool:
    if clone_id is None:
        return False
    setting = file_video_setting()
    if setting is not None:
        mode, clones = setting
        return mode == "all" or (mode == "some" and str(clone_id) in clones)
    allow = {c.strip() for c in os.environ.get("PRETHIRD_EMO_VIDEO_CLONES", "").split(",") if c.strip()}
    return str(clone_id) in allow


def auto_enabled() -> bool:
    return os.environ.get("PRETHIRD_EMO_VIDEO_AUTO", "") == "1"


def emo_dir(video_ref_root: str, clone_id) -> str:
    return os.path.join(video_ref_root, str(clone_id), "emo")


def ready_clips(d: str) -> set | None:
    """준비 표시에 적힌 클립. 표시 파일이 없으면 None(손으로 구운 옛 세트)."""
    try:
        with open(os.path.join(d, READY)) as f:
            return {ln.strip() for ln in f if ln.strip()}
    except FileNotFoundError:
        return None


def mark_ready(d: str, *clips: str) -> None:
    """클립을 준비 표시에 더한다. 통째로 새로 써서 바꿔 끼우므로 통화 쪽이 반쯤 쓴 파일을 읽지 않는다."""
    have = ready_clips(d) or set()
    have.update(clips)
    tmp = os.path.join(d, READY + ".tmp")
    with open(tmp, "w") as f:
        f.writelines(f"{c}\n" for c in CLIPS if c in have)
    os.replace(tmp, os.path.join(d, READY))


def find_assets(video_ref_root: str, clone_id) -> dict | None:
    """있는 클립만 {이름: 경로}. 무감정·idle 둘 중 하나라도 없으면 None(감정 영상 안 씀).
    준비 표시가 있으면 거기 적힌 클립만 쓴다."""
    d = emo_dir(video_ref_root, clone_id)
    ready = ready_clips(d)
    found = {}
    for c in CLIPS:
        p = os.path.join(d, f"{clone_id}-emo-{c}.mp4")
        if os.path.isfile(p) and (ready is None or c in ready):
            found[c] = p
    if NEUTRAL not in found or "idle" not in found:
        return None
    return found


class EmotionVideo:
    """한 통화의 감정 영상 상태. cycle_len = MuseTalk 사이클(클립 프레임 수 × 2, 정방향+역방향).

    cycle_len 은 무감정·idle 사이클이다. 감정 클립은 길이가 달라(193프레임 → 386) 위치를 누적값으로 주고,
    MuseTalk 가 자기 사이클 길이로 접는다(inference_lib start_rot % len). 무감정만 idle 사이클로 접는다.
    """

    def __init__(self, assets: dict, cycle_len: int):
        self.assets = assets
        self.cycle_len = max(1, int(cycle_len))
        self._seq = None
        self._clip = NEUTRAL
        self._pos = 0

    def clip_for(self, emo) -> str:
        c = CLIP_FOR_EMO.get(emo or "neutral", NEUTRAL)
        return c if c in self.assets else NEUTRAL

    def segment(self, reply_seq, emo, idle_pos: int) -> tuple[str, int]:
        """이번 문장 조각을 렌더할 (영상 경로, 시작 위치). 새 답이면 클립·위치를 다시 정한다."""
        if reply_seq != self._seq:
            self._seq = reply_seq
            self._clip = self.clip_for(emo)
            self._pos = (int(idle_pos) if self._clip == NEUTRAL else 0) % self.cycle_len
        return self.assets[self._clip], self._pos

    def advance(self, frames: int) -> None:
        self._pos += int(frames)
        if self._clip == NEUTRAL:
            self._pos %= self.cycle_len

    def idle_resume_pos(self) -> int:
        return self._pos % self.cycle_len if self._clip == NEUTRAL else 0

    @property
    def clip(self) -> str:
        return self._clip
