import asyncio, numpy as np, pytest, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from media_tracks import AvatarVideoTrack, AvatarAudioTrack  # noqa: E402

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
