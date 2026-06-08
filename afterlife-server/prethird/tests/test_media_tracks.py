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
