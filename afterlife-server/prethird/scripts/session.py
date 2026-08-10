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
        self.bundle = None           # T-252: offer 수신 원본 번들. 화자 교대 시 프롬프트 재조립에 쓴다.
        self.se_path = None          # 클론별 voice se 경로(None이면 기본)
        self.video_path = None       # 클론별 idle/musetalk reference video(None이면 halbae 기본)
        self.idle_video_applied = False  # clone idle mp4가 idle_track에 적용됐는지. server.py factory가 읽어 prebake 스킵 판단(적용됐으면 좋은 mp4 유지). signaling set_idle_video 성공 시 True.
        self.face_path = None        # 클론 정면사진(faceUrl) 로컬 경로. fifth source 우선.
        self.recorder = None         # CallRecorder | NullRecorder (offer에서 부착)
        self.offer_time = None       # offer 수신 unixtime(첫턴 지연 측정용)
        self.user_id = None          # offer JWT sub 추출 userId (Phase B 자동학습)
        self.filler_player = None    # FillerPlayer (F7, PRETHIRD_FILLER on일 때만 생성·close는 cleanup)
        # --- T-067 face-speaker-id (Task 10~13) ---
        self.reacted_keys = {}       # face_event 쿨다운: key(personId str|"unknown")→마지막 react 단조시각
        self.pending_enroll = False  # unknown_face/multi_face 이후 등록 대기 플래그(Task 11이 소비)
        self.current_speaker = None  # (personId:int, displayName:str|None) | None — 최근 확인된 화자
        # [T-252 fix / mizu H-1 · el B-2] 프롬프트가 지금 상태 4(얼굴 미확정)로 조립돼
        # 있는가. current_speaker 에 상태를 암묵 인코딩하면 "확정된 적이 없는데
        # unknown_face 가 온" 경우(얼굴 벡터 0행인 현재 실운영의 유일한 경로)에
        # 상태 4 로 강등할 수단이 없다. 강등은 current_speaker 와 무관하게 수행하고
        # 중복 재조립만 이 플래그로 막는다. speaker_confirmed 로 화자가 확정되면
        # False 로 리셋한다(다시 unknown 이 오면 또 강등해야 한다).
        self.prompt_unconfirmed = False
        # [T-252 fix / el I-2] 화자 상태가 바뀔 때마다 1씩 오르는 단조 카운터.
        # _maybe_swap_l2p 는 스케줄 시점의 값을 closure 로 얼려 두고 적용 직전에
        # 비교한다 — pid 만 비교하면 `2(A) → 4 → 2(A)` 복귀에서 in-flight 중이던
        # 구 스왑이 `current[0] == pid` 가 여전히 참이라 통과해, frozen name 과
        # 낡은 L2' 로 최신 판정을 덮어쓴다.
        self.speaker_epoch = 0
        # [T-252 Task 8] 상태 4(얼굴 미확정) 유지 타임아웃 핸들(asyncio.TimerHandle|None).
        # 상태 4 에서 나가는 간선은 `speaker_confirmed` 뿐인데, `clone_person_faces` 가
        # 0행이면 `/oth-path` 가 구조적으로 매칭될 수 없어 그 이벤트가 영영
        # 오지 않는다 — 얼굴이 카메라에 잡히는 순간부터 통화가 끝날 때까지 이름을 한 번도
        # 못 부르는 고착이 된다. 그렇다고 "벡터 0 이면 화자식별 off" 로 막으면 등록 요청
        # (enroll_suggest)까지 함께 죽어 벡터가 영영 0 인 데드락이 되므로, 상태 4 자체에
        # 수명(PRETHIRD_UNCONFIRMED_TTL_S, 기본 10초)을 준다. 만료되면 상태 1 로 돌아가
        # 다시 이름을 부르고, 그 뒤 unknown_face 가 또 오면 다시 강등한다(반복).
        # 얼굴 검출과 enroll_suggest 는 그동안 계속 돌므로 결국 벡터가 생기고, 생기면
        # speaker_confirmed 경로가 살아나 이 타이머는 자연히 무의미해진다.
        # 통화 종료(cleanup)에서 반드시 cancel — 죽은 세션의 pipeline 을 건드리면 안 된다.
        self.unconfirmed_timer = None
        # T-126 Task8 — 이번 통화에서 이미 이름 추출을 시도한 personId 집합(1인당 1회만 LLM 호출).
        # current_speaker[1](displayName)이 채워지면 자연히 더 이상 필요 없어지지만, RN의 PATCH가
        # 이 세션에 반영되지 않으므로(별도 프로세스) 세션 로컬 가드로 중복 호출만 억제한다.
        self.name_extract_sent = set()
        # --- T-167 크레딧 과금 ---
        self.allowed_sec = 0        # bundle allowedSec (fail-closed 0 = 통화 불가)
        self.credit_guard = None    # CreditGuard | None — greet 시점에 부착, cleanup에서 cancel
        self.max_end_at_ms = 0      # 서버가 준 절대 데드라인(epoch ms). 로컬 재계산 금지.
        self.busy_lock = asyncio.Lock()  # say/speak/greet/react 상호배제(동시 트랙 push 방지, §6.2)
        self.pending_react = None    # 발화 중 도착한 react 단일 대기 슬롯(dict|None, latest-wins)

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
