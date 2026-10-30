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

켜기: PRETHIRD_EMO_VIDEO_CLONES="9232,…"(허용 클론). 비어 있으면 끔 — 지금 동작과 같다.
연결표 정본: 메모리 project_afterlife_emotion_video_map (sungjius 10-30 결정, 목소리 감정이 늘면 확장).
"""
from __future__ import annotations

import os

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
NEUTRAL = "neutral"


def enabled_for(clone_id) -> bool:
    allow = {c.strip() for c in os.environ.get("PRETHIRD_EMO_VIDEO_CLONES", "").split(",") if c.strip()}
    return clone_id is not None and str(clone_id) in allow


def find_assets(video_ref_root: str, clone_id) -> dict | None:
    """있는 클립만 {이름: 경로}. 무감정·idle 둘 중 하나라도 없으면 None(감정 영상 안 씀)."""
    d = os.path.join(video_ref_root, str(clone_id), "emo")
    found = {}
    for c in CLIPS:
        p = os.path.join(d, f"{clone_id}-emo-{c}.mp4")
        if os.path.isfile(p):
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
