import asyncio, numpy as np, pytest, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from pipeline import DialoguePipeline  # noqa: E402

class FakeVideoTrack:
    def __init__(self): self.frames = []
    def push_ndarray(self, arr): self.frames.append(arr); return {"queued": len(self.frames), "dropped": False}
    def signal_end(self): return 0

class FakeAudioTrack:
    def __init__(self): self.pcm = []
    def push_pcm_int16(self, pcm): self.pcm.append(pcm); return {"queued": pcm.size, "dropped": False}
    def signal_end(self): return 0

@pytest.mark.asyncio
async def test_pipeline_say_streams_frames_and_audio():
    async def fake_chat(messages):
        for tok in ["안녕", "하세요", ". "]:
            yield tok

    async def fake_say(text, se_path=None): return b"WAVfake"

    def fake_decode(b): return np.zeros(1920, dtype=np.int16), 48000, 1

    def fake_infer(wav_path, on_frame):
        for _ in range(3): on_frame(np.zeros((8, 8, 3), np.uint8))
        return 3

    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    await p.say("안녕 할배")
    # call_soon_threadsafe 콜백은 다음 루프 틱에 실행 → 한 틱 양보
    await asyncio.sleep(0)

    assert len(vt.frames) >= 3      # musetalk 프레임 적재
    assert len(at.pcm) >= 1         # 오디오 PCM 적재

@pytest.mark.asyncio
async def test_pipeline_signal_end_called():
    """say() 완료 후 video·audio 트랙 모두 signal_end 호출 확인."""
    end_calls = {"video": 0, "audio": 0}

    async def fake_chat(messages):
        for tok in ["테스트. "]:
            yield tok

    async def fake_say(text, se_path=None): return b"WAVfake"
    def fake_decode(b): return np.zeros(960, dtype=np.int16), 48000, 1
    def fake_infer(wav_path, on_frame):
        on_frame(np.zeros((4, 4, 3), np.uint8))
        return 1

    class TrackWithEnd:
        def __init__(self, key):
            self.key = key
            self.frames_or_pcm = []
        def push_ndarray(self, arr): self.frames_or_pcm.append(arr)
        def push_pcm_int16(self, pcm): self.frames_or_pcm.append(pcm)
        def signal_end(self): end_calls[self.key] += 1; return 0

    vt = TrackWithEnd("video")
    at = TrackWithEnd("audio")
    p = DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    await p.say("테스트")
    # call_soon_threadsafe 콜백은 다음 루프 틱에 실행 → 한 틱 양보
    await asyncio.sleep(0)
    assert end_calls["video"] == 1
    assert end_calls["audio"] == 1

def test_infer_stage_applies_audio_postprocess(monkeypatch):
    import numpy as np
    import asyncio
    monkeypatch.setenv("PRETHIRD_AUDIO_FADE_MS", "8")
    monkeypatch.setenv("PRETHIRD_AUDIO_NORM", "1")

    pushed = {}

    class VT:
        def push_ndarray(self, arr): pass
        def signal_end(self): pass
    class AT:
        def push_pcm_int16(self, pcm): pushed["pcm"] = pcm
        def signal_end(self): pass

    async def chat_fn(messages):
        if False:
            yield ""
    async def say_fn(text, se): return b""
    def decode_wav_fn(b): return (np.zeros(0, dtype=np.int16), 48000, 1)
    def infer_fn(path, on_frame):
        for _ in range(10):
            on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 10

    from pipeline import DialoguePipeline
    p = DialoguePipeline(VT(), AT(), chat_fn, say_fn, decode_wav_fn, infer_fn)
    pcm48 = np.full(48000, 12000, dtype=np.int16)
    # Python 3.12+ 에서 get_event_loop().run_until_complete 는 RuntimeError → asyncio.run 사용
    asyncio.run(p._infer_stage(b"", pcm48))
    out = pushed["pcm"]
    # fade 적용 → 시작/끝 진폭이 중앙보다 작아짐
    assert abs(int(out[0])) < abs(int(out[len(out) 
    assert abs(int(out[-1])) < abs(int(out[len(out) 

@pytest.mark.asyncio
async def test_pipeline_real_video_track_threadsafe():
    """실제 AvatarVideoTrack + executor 스레드 push → recv 안전성 (call_soon_threadsafe 경로).

    BLOCKER-1 수정 검증: on_frame이 call_soon_threadsafe로 루프에 위임하므로
    executor 스레드의 asyncio.Queue 직접 접근 race가 발생하지 않아야 한다.
    say() + asyncio.sleep(0.05) 후 queue_depth() == 5 (5프레임 유실·충돌 없음).
    """
    import asyncio as _a
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
    from media_tracks import AvatarVideoTrack

    vt = AvatarVideoTrack()
    vt.set_mode("queue")
    at = FakeAudioTrack()

    async def fake_chat(messages):
        yield "안녕."

    async def fake_say(text, se_path=None): return b"WAVfake"

    def fake_decode(b): return np.zeros(1920, dtype=np.int16), 48000, 1

    def fake_infer(wav_path, on_frame):
        for _ in range(5):
            on_frame(np.zeros((8, 8, 3), np.uint8))
        return 5

    p = DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    await p.say("안녕")
    # call_soon_threadsafe 로 큐잉된 콜백은 다음 루프 틱에 실행되므로 양보
    await _a.sleep(0.05)
    assert vt.queue_depth() == 5, (
        f"executor 스레드 push 5개가 race 없이 큐에 적재돼야 함. 실제: {vt.queue_depth()}"
    )

@pytest.mark.asyncio
async def test_pipeline_speak_bypasses_llm():
    # speak()는 chat_fn(LLM)을 호출하지 않고 입력 텍스트를 그대로 _emit_sentence
    llm_called = {"n": 0}

    async def fake_chat(messages):
        llm_called["n"] += 1
        yield "LLM응답"

    async def fake_say(text, se_path=None): return b"WAVfake"
    def fake_decode(b): return np.zeros(1920, dtype=np.int16), 48000, 1
    def fake_infer(wav_path, on_frame):
        on_frame(np.zeros((8, 8, 3), np.uint8))
        return 1

    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    await p.speak("오늘 날씨가 좋다.")
    await asyncio.sleep(0)
    assert llm_called["n"] == 0          # LLM 우회됨
    assert len(vt.frames) >= 1           # 발화 프레임 생성됨

def test_emit_sentence_batches_frames_after_infer():
    """on_frame은 infer 중 list에 모으고, infer 완료 후 일괄 push.
    push 순서: 모든 video frame 적재 → 그 다음 audio 1회."""
    order = []

    class VT:
        def __init__(self): self.frames = []
        def push_ndarray(self, arr): self.frames.append(arr); order.append("v")
        def signal_end(self): return 0
    class AT:
        def __init__(self): self.pcm = []
        def push_pcm_int16(self, pcm): self.pcm.append(pcm); order.append("a")
        def signal_end(self): return 0

    async def fake_chat(messages):
        for t in ["문장하나."]:
            yield t
    async def fake_say(text, se_path=None):
        return b"WAVfake"
    def fake_decode(b):
        return np.zeros(1920, dtype=np.int16), 48000, 1
    def fake_infer(wav_path, on_frame):
        for _ in range(5):
            on_frame(np.zeros((8, 8, 3), np.uint8))
        return 5

    vt, at = VT(), AT()
    p = DialoguePipeline(video_track=vt, audio_track=at,
                         chat_fn=fake_chat, say_fn=fake_say,
                         decode_wav_fn=fake_decode, infer_fn=fake_infer)
    asyncio.run(p.speak("문장하나."))
    assert len(vt.frames) == 5
    assert len(at.pcm) == 1
    assert order == ["v", "v", "v", "v", "v", "a"]

def test_pipeline_preserves_order_and_overlaps():
    """파이프라인: 문장 순서대로 infer push, TTS/infer 분리 워커."""
    import asyncio, numpy as np
    pushed = []

    class VT:
        def push_ndarray(self, arr): pushed.append(("v", int(arr[0, 0, 0])))
        def signal_end(self): pushed.append(("vend", 0))
    class AT:
        def push_pcm_int16(self, pcm): pushed.append(("a", int(pcm[0])))
        def signal_end(self): pushed.append(("aend", 0))

    async def fake_chat(messages):
        for t in ["첫째.", "둘째.", "셋째."]:
            yield t
    async def fake_say(text, se_path=None):
        idx = {"첫째.": 1, "둘째.": 2, "셋째.": 3}[text]
        return bytes([idx]) + b"WAV"
    def fake_decode(b):
        idx = b[0]
        return np.full(1920, idx, dtype=np.int16), 48000, 1
    def fake_infer(wav_path, on_frame):
        with open(wav_path, "rb") as f:
            idx = f.read(1)[0]
        on_frame(np.full((4, 4, 3), idx, np.uint8))
        return 1

    p = DialoguePipeline(video_track=VT(), audio_track=AT(),
                         chat_fn=fake_chat, say_fn=fake_say,
                         decode_wav_fn=fake_decode, infer_fn=fake_infer,
                         min_len=1)
    asyncio.run(p.say("안녕"))
    v_order = [val for kind, val in pushed if kind == "v"]
    assert v_order == [1, 2, 3]
    assert ("vend", 0) in pushed and ("aend", 0) in pushed

def test_pipeline_speak_order():
    import asyncio, numpy as np
    pushed = []

    class VT:
        def push_ndarray(self, arr): pushed.append(int(arr[0, 0, 0]))
        def signal_end(self): pass
    class AT:
        def push_pcm_int16(self, pcm): pass
        def signal_end(self): pass

    async def fake_chat(messages):
        if False: yield ""
    seq = {"하나.": 1, "둘.": 2}
    async def fake_say(text, se_path=None):
        return bytes([seq[text]]) + b"WAV"
    def fake_decode(b):
        return np.full(10, b[0], dtype=np.int16), 48000, 1
    def fake_infer(wav_path, on_frame):
        with open(wav_path, "rb") as f:
            idx = f.read(1)[0]
        on_frame(np.full((4, 4, 3), idx, np.uint8))
        return 1

    p = DialoguePipeline(video_track=VT(), audio_track=AT(),
                         chat_fn=fake_chat, say_fn=fake_say,
                         decode_wav_fn=fake_decode, infer_fn=fake_infer)
    asyncio.run(p.speak("하나. 둘."))
    assert pushed == [1, 2]

def test_pipeline_exception_still_signals_end():
    """워커 예외(say_fn 실패)여도 signal_end 가 호출되고 예외가 전파된다(B-2)."""
    import asyncio, numpy as np, pytest
    ended = []

    class VT:
        def push_ndarray(self, arr): pass
        def signal_end(self): ended.append("v")
    class AT:
        def push_pcm_int16(self, pcm): pass
        def signal_end(self): ended.append("a")

    async def fake_chat(messages):
        yield "문장."
    async def fake_say(text, se_path=None):
        raise RuntimeError("TTS down")
    def fake_decode(b):
        return np.zeros(10, dtype=np.int16), 48000, 1
    def fake_infer(wav_path, on_frame):
        return 0

    p = DialoguePipeline(video_track=VT(), audio_track=AT(),
                         chat_fn=fake_chat, say_fn=fake_say,
                         decode_wav_fn=fake_decode, infer_fn=fake_infer, min_len=1)
    with pytest.raises(RuntimeError):
        asyncio.run(p.say("x"))
    assert "v" in ended and "a" in ended  # finally 로 signal_end 보장

@pytest.mark.asyncio
async def test_pipeline_empty_stream():
    """LLM 스트림이 아무 토큰도 안 내면 트랙 큐가 비고 signal_end만 호출."""
    async def fake_chat(messages):
        return
        yield  # noqa: unreachable — make this an async generator

    async def fake_say(text, se_path=None): return b"WAVfake"
    def fake_decode(b): return np.zeros(960, dtype=np.int16), 48000, 1
    def fake_infer(wav_path, on_frame): return 0

    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    await p.say("")
    assert len(vt.frames) == 0
    assert len(at.pcm) == 0
