from __future__ import annotations
import asyncio, uuid
from typing import Optional, Dict
from media_tracks import AvatarVideoTrack, AvatarAudioTrack


class Session:
    """직결 PC 하나에 대응. video/audio 트랙 + 대화 상태 소유."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.state = "idle"  # idle | speaking
        self.sync_event = asyncio.Event()
        self.video_track = AvatarVideoTrack(sync_event=self.sync_event)
        self.audio_track = AvatarAudioTrack(video_sync_event=self.sync_event)
        self.video_track.set_mode("queue")
        self.pc = None           # signaling 에서 RTCPeerConnection 주입(T6)
        self.datachannel = None  # DataChannel "say" 수신(T11)
        self.pipeline = None     # DialoguePipeline 주입(T10/T11)
        self.clone_id = None         # /offer 수신 clone_id
        self.persona_messages = []   # bundle_to_messages 결과
        self.se_path = None          # 클론별 voice se 경로(None이면 기본)
        self.video_path = None       # 클론별 idle/musetalk reference video(None이면 halbae 기본)
        self.face_path = None        # 클론 정면사진(faceUrl) 로컬 경로. fifth source 우선.
        self.recorder = None         # CallRecorder | NullRecorder (offer에서 부착)
        self.offer_time = None       # offer 수신 unixtime(첫턴 지연 측정용)
        self.user_id = None          # offer JWT sub 추출 userId (Phase B 자동학습)
        self.filler_player = None    # FillerPlayer (F7, PRETHIRD_FILLER on일 때만 생성·close는 cleanup)
        # --- T-067 face-speaker-id (Task 10~13) ---
        self.reacted_keys = {}       # face_event 쿨다운: key(personId str|"unknown")→마지막 react 단조시각
        self.pending_enroll = False  # unknown_face/multi_face 이후 등록 대기 플래그(Task 11이 소비)
        self.current_speaker = None  # (personId:int, displayName:str|None) | None — 최근 확인된 화자
        self.base_persona_messages = None  # L2 화자별 스왑 전 원본 persona_messages 백업(Task 12가 소비)

    def set_state(self, state: str) -> None:
        if state not in ("idle", "speaking"):
            raise ValueError(f"invalid state: {state}")
        self.state = state


class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, Session] = {}

    def create(self) -> Session:
        sid = uuid.uuid4().hex[:12]
        s = Session(sid)
        self._sessions[sid] = s
        return s

    def get(self, sid: str) -> Optional[Session]:
        return self._sessions.get(sid)

    def remove(self, sid: str) -> None:
        self._sessions.pop(sid, None)

    def count(self) -> int:
        return len(self._sessions)
