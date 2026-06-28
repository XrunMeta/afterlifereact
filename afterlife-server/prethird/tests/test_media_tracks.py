import asyncio, numpy as np, pytest, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import idle as _idle_mod
from media_tracks import AvatarVideoTrack, AvatarAudioTrack  # noqa: E402


# ── idle 배선 테스트 ──────────────────────────────────────────────────
def test_avatar_video_track_calls_get_idle_frames(monkeypatch):
    """AvatarVideoTrack.__init__이 get_idle_frames 경로를 통해 _idle_frames를 받는지 검증.
    monkeypatch로 get_idle_frames를 교체 → 호출 여부 + 반환값 반영 확인."""
    _idle_mod._IDLE_CACHE = None  # 캐시 리셋
    dummy_frames = [np.zeros((4, 4, 3), dtype=np.uint8)]
    called_with = []

    def fake_get_idle_frames(path):
        called_with.append(path)
        return dummy_frames

    monkeypatch.setattr(_idle_mod, "get_idle_frames", fake_get_idle_frames)
    # media_tracks는 idle 모듈을 직접 참조하므로 media_tracks 내 참조도 패치
    import media_tracks as _mt_mod
    monkeypatch.setattr(_mt_mod, "get_idle_frames", fake_get_idle_frames)

    track = AvatarVideoTrack()
    assert len(called_with) == 1, "get_idle_frames가 __init__에서 1회 호출되어야 함"
    assert track._idle_frames is dummy_frames, "_idle_frames가 get_idle_frames 반환값이어야 함"


def test_avatar_video_track_idle_frames_empty_when_no_path(monkeypatch):
    """IDLE_MP4_PATH가 빈 값이면 _idle_frames가 빈 리스트."""
    _idle_mod._IDLE_CACHE = None
    import media_tracks as _mt_mod
    import config as _cfg
    monkeypatch.setattr(_cfg, "IDLE_MP4_PATH", "")
    monkeypatch.setattr(_mt_mod, "IDLE_MP4_PATH", "")

    track = AvatarVideoTrack()
    assert track._idle_frames == []


@pytest.mark.asyncio
async def test_recv_uses_idle_frame_after_grace(monkeypatch):
    """recv() 큐 빔 + grace 경과 시, idle_frames가 있으면 idle frame 반환 (last_frame hold 아님)."""
    import time as _time
    _idle_mod._IDLE_CACHE = None

    # idle_frames 2프레임 주입
    idle_f0 = np.full((8, 8, 3), 42, dtype=np.uint8)
    idle_f1 = np.full((8, 8, 3), 84, dtype=np.uint8)
    dummy_frames = [idle_f0, idle_f1]

    import media_tracks as _mt_mod
    monkeypatch.setattr(_mt_mod, "get_idle_frames", lambda p: dummy_frames)
    monkeypatch.setattr(_idle_mod, "get_idle_frames", lambda p: dummy_frames)

    track = AvatarVideoTrack()
    track.set_mode("queue")
    # last_frame 세팅 (발화 후 상태 시뮬)
    last = np.full((8, 8, 3), 99, dtype=np.uint8)
    track._last_frame = last
    # grace 이미 경과된 상태로 _last_real_ts 조작
    track._last_real_ts = _time.time() - 2.0
    track._idle_grace = 0.5

    # recv()는 큐가 비어있으므로 timeout → _select_idle_frame 경로
    frame = await track.recv()
    arr = frame.to_ndarray(format="rgb24")
    # idle frame이 반환되었어야 함 (last 99 아님, idle 42 or 84)
    assert arr[0, 0, 0] in (42, 84), f"idle frame이어야 함, 실제값: {arr[0, 0, 0]}"

def test_video_push_and_depth():
    t = AvatarVideoTrack()
    t.set_mode("queue")
    arr = np.zeros((8, 8, 3), dtype=np.uint8)
    res = t.push_ndarray(arr)
    assert res["queued"] == 1 and res["dropped"] is False
    assert t.queue_depth() == 1

@pytest.mark.asyncio
async def test_video_recv_pops_real_frame():
    ev = asyncio.Event()
    t = AvatarVideoTrack(sync_event=ev)
    t.set_mode("queue")
    arr = np.full((8, 8, 3), 5, dtype=np.uint8)
    t.push_ndarray(arr)
    frame = await t.recv()
    assert frame.width == 8 and frame.height == 8
    assert ev.is_set()  # 첫 real frame → audio gate open
    assert t.frames_real == 1

def test_audio_push_pcm():
    a = AvatarAudioTrack()
    pcm = np.zeros(960, dtype=np.int16)
    res = a.push_pcm_int16(pcm)
    assert res["queued"] == 960
    assert a.queue_depth() == 1  # 960 samples = 1 frame(20ms)

@pytest.mark.asyncio
async def test_audio_gate_closed_yields_silence_and_preserves_buffer():
    ev = asyncio.Event()  # set 안 함 = gate 닫힘
    a = AvatarAudioTrack(video_sync_event=ev)
    a.push_pcm_int16(np.full(960, 100, dtype=np.int16))
    frame = await a.recv()
    assert a.frames_yielded_silence == 1          # silence 송출
    assert a.frames_yielded_real == 0
    assert a.queue_depth_samples() == 960          # buffer 보존(소비 안 함)

@pytest.mark.asyncio
async def test_audio_recv_frame_is_960_samples():
    a = AvatarAudioTrack()  # gate 없음 = 항상 open
    a.push_pcm_int16(np.zeros(960, dtype=np.int16))
    frame = await a.recv()
    assert frame.samples == 960                    # 20ms @ 48kHz


# ── idle 진입 cross-dissolve 테스트 (가비아 검증 대기 — 로컬 실행 불가) ──
def test_idle_entry_blends_from_last_frame(monkeypatch):
    import numpy as np
    monkeypatch.setenv("PRETHIRD_IDLE_BLEND_FRAMES", "4")
    from media_tracks import AvatarVideoTrack
    vt = AvatarVideoTrack()
    vt.set_mode("queue")
    vt._last_frame = np.full((480, 640, 3), 255, dtype=np.uint8)  # 발화 마지막(흰)
    idle = np.zeros((480, 640, 3), dtype=np.uint8)                 # idle(검)
    # 진입 직후 첫 blend: 흰↔검 중간
    arr = vt._apply_idle_blend(idle, was_idle=False)
    assert 0 < int(arr[0, 0, 0]) < 255


# ── F5: flush() 테스트 ────────────────────────────────────────────────
# Task F5 (T-088 라운드3): AvatarVideoTrack.flush() / AvatarAudioTrack.flush()
# "즉시 컷" — 필러 잔여를 버리고 응답을 이어 push하기 위한 최소 additive.

def test_video_flush_clears_queue():
    """flush() 후 queue_depth() == 0."""
    t = AvatarVideoTrack()
    t.set_mode("queue")
    arr = np.zeros((8, 8, 3), dtype=np.uint8)
    for _ in range(5):
        t.push_ndarray(arr)
    assert t.queue_depth() == 5
    dropped = t.flush()
    assert dropped == 5
    assert t.queue_depth() == 0


def test_video_flush_on_empty_queue_no_exception():
    """빈 큐에 flush() 호출 시 예외 없음, 반환값 0."""
    t = AvatarVideoTrack()
    t.set_mode("queue")
    assert t.queue_depth() == 0
    dropped = t.flush()  # 예외 없어야 함
    assert dropped == 0


def test_video_flush_does_not_touch_idle_state():
    """flush()는 _last_frame·_idle_t0·_idle_frames를 변경하지 않는다.
    flush 후 recv()가 idle/last_frame 폴백으로 정상 동작하는 것을 보장."""
    import time as _time
    t = AvatarVideoTrack()
    t.set_mode("queue")
    sentinel = np.full((8, 8, 3), 77, dtype=np.uint8)
    t._last_frame = sentinel
    t._idle_t0 = 1.23
    idle_before = t._idle_frames  # 동일 객체 참조 유지 확인

    arr = np.zeros((8, 8, 3), dtype=np.uint8)
    t.push_ndarray(arr)
    t.flush()

    assert t._last_frame is sentinel, "_last_frame이 flush로 바뀌면 안 됨"
    assert t._idle_t0 == 1.23, "_idle_t0이 flush로 바뀌면 안 됨"
    assert t._idle_frames is idle_before, "_idle_frames가 flush로 바뀌면 안 됨"


@pytest.mark.asyncio
async def test_video_flush_then_recv_falls_back_to_last_frame(monkeypatch):
    """flush() 후 recv()는 빈 큐 → last_frame hold(idle grace 전)를 반환해야 함."""
    import time as _time
    import media_tracks as _mt_mod
    dummy_frames = [np.zeros((8, 8, 3), dtype=np.uint8)]
    monkeypatch.setattr(_mt_mod, "get_idle_frames", lambda p: dummy_frames)

    t = AvatarVideoTrack()
    t.set_mode("queue")
    # last_frame에 식별값 세팅
    last = np.full((8, 8, 3), 42, dtype=np.uint8)
    t._last_frame = last
    # grace가 경과하지 않은 상태로 유지 (idle 진입 금지)
    t._last_real_ts = _time.time()
    t._idle_grace = 9999.0

    # 프레임 push 후 flush
    arr = np.full((8, 8, 3), 99, dtype=np.uint8)
    t.push_ndarray(arr)
    t.flush()

    frame = await t.recv()
    arr_out = frame.to_ndarray(format="rgb24")
    # idle grace 미경과 → last_frame(42) hold
    assert arr_out[0, 0, 0] == 42, f"last_frame hold 기대값 42, 실제: {arr_out[0, 0, 0]}"


def test_audio_flush_clears_buffer():
    """flush() 후 _buffer.size == 0, queue_depth() == 0."""
    a = AvatarAudioTrack()
    pcm = np.full(4800, 50, dtype=np.int16)  # 100ms
    a.push_pcm_int16(pcm)
    assert a.queue_depth_samples() == 4800
    dropped = a.flush()
    assert dropped == 4800
    assert a._buffer.size == 0
    assert a.queue_depth() == 0
    assert a.queue_depth_samples() == 0


def test_audio_flush_on_empty_buffer_no_exception():
    """빈 버퍼에 flush() 호출 시 예외 없음, 반환값 0."""
    a = AvatarAudioTrack()
    assert a._buffer.size == 0
    dropped = a.flush()
    assert dropped == 0
    assert a._buffer.size == 0


@pytest.mark.asyncio
async def test_audio_flush_then_recv_yields_silence():
    """flush() 후 recv()는 buffer 부족 → silence frame(960 zeros)을 반환해야 함."""
    a = AvatarAudioTrack()  # gate 없음 = 항상 open
    pcm = np.full(9600, 100, dtype=np.int16)
    a.push_pcm_int16(pcm)
    a.flush()
    assert a._buffer.size == 0

    frame = await a.recv()
    arr = frame.to_ndarray()
    # silence: 값이 전부 0
    assert np.all(arr == 0), "flush 후 recv는 silence(zeros) 여야 함"
    assert a.frames_yielded_silence == 1
    assert a.frames_yielded_real == 0


# ── T-088 el C-1 / sion #1~4 게이트 보강 테스트 ─────────────────────────
# F5 flush()의 경계 동작 4가지를 구체적으로 고정한다.


@pytest.mark.asyncio
async def test_video_flush_only_removes_current_queue_post_push_survives():
    """flush()는 호출 시점 큐만 비우고, flush 이후 push한 프레임은 보존됨을 고정.

    push frame_A → flush() → push frame_B → recv()가 frame_B 반환(frame_A 아님).
    flush가 "그 시점 잔여만" 제거함을 명시한다.
    (sion #1)
    """
    t = AvatarVideoTrack()
    t.set_mode("queue")

    frame_A = np.full((8, 8, 3), 10, dtype=np.uint8)
    frame_B = np.full((8, 8, 3), 20, dtype=np.uint8)

    t.push_ndarray(frame_A)
    dropped = t.flush()           # frame_A 만 제거
    assert dropped == 1
    assert t.queue_depth() == 0

    t.push_ndarray(frame_B)       # flush 이후 push → 보존되어야 함
    assert t.queue_depth() == 1

    frame = await t.recv()
    arr = frame.to_ndarray(format="rgb24")
    assert arr[0, 0, 0] == 20, f"frame_B(20) 기대, 실제: {arr[0, 0, 0]}"


@pytest.mark.asyncio
async def test_video_flush_after_grace_expired_idle_fallback_intact(monkeypatch):
    """grace 경과 + 이미 idle 상태에서 flush → recv가 idle frame 폴백(예외 없음).

    flush는 _idle_t0를 건드리지 않으므로 idle 루프가 계속 유지되어야 함.
    (sion #2)
    """
    import time as _time
    import media_tracks as _mt_mod

    _idle_mod._IDLE_CACHE = None
    idle_f = np.full((8, 8, 3), 55, dtype=np.uint8)
    monkeypatch.setattr(_mt_mod, "get_idle_frames", lambda p: [idle_f])
    monkeypatch.setattr(_idle_mod, "get_idle_frames", lambda p: [idle_f])

    t = AvatarVideoTrack()
    t.set_mode("queue")
    # idle grace 이미 경과 + idle 루프 이미 진입 상태 시뮬
    t._last_real_ts = _time.time() - 5.0
    t._idle_grace = 0.1
    t._idle_t0 = _time.time() - 1.0   # idle 진입 1초 전 (_idle_t0 > 0)
    idle_t0_before = t._idle_t0

    arr = np.zeros((8, 8, 3), dtype=np.uint8)
    t.push_ndarray(arr)
    t.flush()
    # flush가 _idle_t0을 변경하지 않았는지 명시 확인
    assert t._idle_t0 == idle_t0_before, "flush가 _idle_t0을 바꾸면 안 됨"

    # recv → idle frame 반환, 예외 없음
    frame = await t.recv()
    result = frame.to_ndarray(format="rgb24")
    assert result[0, 0, 0] == 55, f"idle frame(55) 기대, 실제: {result[0, 0, 0]}"


@pytest.mark.asyncio
async def test_audio_gate_closed_flush_then_open_recv_real():
    """gate closed 상태 push → flush → recv → silence.
    그 후 gate open → push → recv → real PCM.

    flush가 버퍼만 비우고 gate 상태는 건드리지 않음을 검증한다.
    (sion #3)
    """
    ev = asyncio.Event()  # gate 닫힘 (not set)
    a = AvatarAudioTrack(video_sync_event=ev)

    # gate 닫힌 채 push → flush
    a.push_pcm_int16(np.full(960, 77, dtype=np.int16))
    a.flush()
    assert a._buffer.size == 0

    # recv: gate closed → silence
    frame1 = await a.recv()
    arr1 = frame1.to_ndarray()
    assert np.all(arr1 == 0), "gate closed + flush 후 recv는 silence여야 함"
    assert a.frames_yielded_silence == 1
    assert a.frames_yielded_real == 0

    # gate open 후 push → recv → real
    ev.set()
    a.push_pcm_int16(np.full(960, 33, dtype=np.int16))
    frame2 = await a.recv()
    arr2 = frame2.to_ndarray()
    assert arr2[0, 0] == 33, f"gate open 후 real PCM(33) 기대, 실제: {arr2[0, 0]}"
    assert a.frames_yielded_real == 1


@pytest.mark.asyncio
async def test_audio_pts_continuous_after_flush():
    """flush()가 _pts·_next_send_at을 건드리지 않아 pts가 연속임을 고정.

    push → recv(pts=0) → flush → push → recv(pts=960) 순으로 pts 단절 없음.
    (el C-1, sion #4)
    """
    a = AvatarAudioTrack()  # gate 없음 = 항상 open

    # 첫 recv: pts == 0
    a.push_pcm_int16(np.zeros(960, dtype=np.int16))
    frame1 = await a.recv()
    assert frame1.pts == 0, f"첫 frame pts 기대 0, 실제 {frame1.pts}"

    # flush 전 _pts·_next_send_at 스냅샷
    pts_snap = a._pts
    next_snap = a._next_send_at

    # flush 대상 push 후 flush
    a.push_pcm_int16(np.full(960, 50, dtype=np.int16))
    a.flush()
    # flush가 내부 타이밍 상태를 변경하지 않았는지 확인
    assert a._pts == pts_snap, "flush가 _pts를 변경하면 안 됨"
    assert a._next_send_at == next_snap, "flush가 _next_send_at을 변경하면 안 됨"

    # 새 pcm push 후 두 번째 recv: pts == 960 (연속)
    a.push_pcm_int16(np.full(960, 20, dtype=np.int16))
    frame2 = await a.recv()
    assert frame2.pts == 960, f"두 번째 frame pts 기대 960(연속), 실제 {frame2.pts}"
