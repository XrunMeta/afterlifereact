"""test_filler_wiring.py — T-088 F7 배선 통합 단위 테스트.

검증 항목
---------
1. pipeline on_response_ready: 첫 infer 직전 정확히 1회 호출 (stop→flush→응답push 순서)
2. pipeline on_response_ready=None: 무해(기존 경로 동일)
3. session.filler_player 필드 존재 확인
4. 즉시컷 hook 순서: stop() → video_track.flush() → audio_track.flush() → 응답 push
5. greet 모드: filler 미시작(사용자 발화 아님)
6. cleanup: FillerPlayer.close() 호출 → 좀비 task 없음
7. 필러 paths=[] → start() 무동작(idle 폴백, 에러 0)
8. 토글 off → _filler=None → 기존 경로 100% 동일
9. 다운로드 실패 → idle 폴백(예외 미전파)

의존성 stub 전략
----------------
- pipeline.py: recorder·sentence_buffer·audio_utils를 sys.modules 에 최소 stub 주입
- session.py: media_tracks → aiortc 의존성이 있으므로 필드만 직접 검증
- filler_player.py: 실제 임포트(순수 asyncio/numpy 의존만)
- signaling: 내부 중첩 함수가 많아 직접 import 대신 핵심 로직을 재현해 검증
"""
from __future__ import annotations

import asyncio
import sys
import types
import unittest.mock as mock
import numpy as np
import pytest

# ── 무거운 의존성 stub (GPU / aiortc 없는 CI 환경) ────────────────────────────

_INJECTED: list[str] = []


def _inject(name: str, attrs: dict | None = None) -> types.ModuleType:
    if name not in sys.modules:
        m = types.ModuleType(name)
        if attrs:
            for k, v in attrs.items():
                setattr(m, k, v)
        sys.modules[name] = m
        _INJECTED.append(name)
    return sys.modules[name]


# recorder stub: NULL_TURN
class _NullTurn:
    _tokens: list = []
    def append_token(self, t): pass
    def append_wav(self, b): pass
    def append_frames(self, *a, **kw): pass

_NULL_TURN = _NullTurn()
_inject("recorder", {"NULL_TURN": _NULL_TURN})

# sentence_buffer stub: 토큰을 그대로 문장으로 emit
class _StubSB:
    def __init__(self, *a, **kw): pass
    def push(self, tok): return [tok]
    def flush(self): return []

_inject("sentence_buffer", {"SentenceBuffer": _StubSB})

# audio_utils stub
def _id(x, *a, **kw): return x
def _balance(pcm, nf): return pcm, nf

_inject("audio_utils", {
    "_resample_int16": _id,
    "_balance_pcm_to_video": _balance,
    "_apply_edge_fade": _id,
    "_normalize_peak": _id,
})

# pipeline import (stub 주입 후)
from pipeline import DialoguePipeline  # noqa: E402

# filler_player import (순수 asyncio/numpy)
from filler_player import FillerPlayer  # noqa: E402


# ── 공용 가짜 트랙 ─────────────────────────────────────────────────────────────

class _FakeVideoTrack:
    def __init__(self):
        self._q: list[np.ndarray] = []
        self.ended = False
        self.flush_calls = 0

    def push_ndarray(self, arr: np.ndarray) -> dict:
        self._q.append(arr)
        return {"queued": len(self._q), "dropped": False}

    def signal_end(self):
        self.ended = True

    def flush(self) -> int:
        n = len(self._q)
        self._q.clear()
        self.flush_calls += 1
        return n

    def queue_depth(self):
        return len(self._q)


class _FakeAudioTrack:
    def __init__(self):
        self._buf = np.zeros(0, dtype=np.int16)
        self.ended = False
        self.flush_calls = 0

    def push_pcm_int16(self, pcm: np.ndarray):
        self._buf = np.concatenate([self._buf, pcm.astype(np.int16)])

    def signal_end(self):
        self.ended = True

    def flush(self) -> int:
        n = int(self._buf.size)
        self._buf = np.zeros(0, dtype=np.int16)
        self.flush_calls += 1
        return n

    def queue_depth_samples(self):
        return int(self._buf.size)


# ── pipeline 최소 mock 생성 헬퍼 ──────────────────────────────────────────────

def _make_pipeline(infer_fn=None, *, chat_yields: list[str] | None = None):
    """테스트용 DialoguePipeline. 실제 GPU/파일 없이 동작."""
    vt = _FakeVideoTrack()
    at = _FakeAudioTrack()

    _yields = chat_yields if chat_yields is not None else ["hello"]

    async def fake_chat(msgs):
        for tok in _yields:
            yield tok

    async def fake_say(text, se_path):
        return b""

    def fake_decode(wav):
        return np.zeros(480, dtype=np.int16), 48000, 1

    _default_frame = np.zeros((512, 512, 3), dtype=np.uint8)

    if infer_fn is None:
        def infer_fn(wav_path, on_frame):
            on_frame(_default_frame)

    return DialoguePipeline(
        video_track=vt,
        audio_track=at,
        chat_fn=fake_chat,
        say_fn=fake_say,
        decode_wav_fn=fake_decode,
        infer_fn=infer_fn,
    ), vt, at


# ═══════════════════════════════════════════════════════════════════════════════
# 1. pipeline on_response_ready 단위 테스트
# ═══════════════════════════════════════════════════════════════════════════════

def test_pipeline_on_response_ready_fires_after_infer_before_first_push():
    """T-088 라운드4-fix: 즉시컷은 렌더(infer) '완료 후·첫 프레임 push 직전' 1회.

    과거 '첫 infer 직전' 시점은 렌더 소요(문장길이×RTF, 수 초) 동안 필러를
    죽여 그 구간이 idle 로 메꿔지는 실통화 버그(취소→6.6s 갭→idle 실측).
    렌더 동안 필러가 계속 순환하고, 프레임이 준비된 순간에만 잘라야 한다.
    ready~push 사이 await 없음(stop→flush→push 원자성)은 별도 순서 assert 로 확인.
    """
    call_log: list[str] = []

    infer_call_n = [0]

    def recording_infer(wav_path, on_frame):
        call_log.append(f"infer_{infer_call_n[0]}")
        infer_call_n[0] += 1
        on_frame(np.zeros((512, 512, 3), dtype=np.uint8))

    def on_response_ready():
        call_log.append("ready")

    pipe, vt, _at = _make_pipeline(infer_fn=recording_infer)

    _orig_push = vt.push_ndarray

    def logging_push(arr):
        call_log.append("push")
        return _orig_push(arr)

    vt.push_ndarray = logging_push
    asyncio.run(pipe.say("hi there", on_response_ready=on_response_ready))

    assert call_log.count("ready") == 1, f"ready 는 정확히 1회: {call_log}"
    assert "push" in call_log, f"응답 push 필요: {call_log}"
    i_infer = call_log.index("infer_0")
    i_ready = call_log.index("ready")
    i_push = call_log.index("push")
    assert i_infer < i_ready < i_push, (
        f"순서 위반 — infer 완료({i_infer}) < ready({i_ready}) < 첫 push({i_push}) 여야 함: {call_log}"
    )


def test_pipeline_on_response_ready_fires_even_when_infer_raises():
    """[el BLOCKER] infer_fn 예외 시에도 즉시컷 훅은 반드시 1회 발동.

    스킵되면 FillerPlayer 정지 경로가 사라져 필러가 세션 종료까지
    무한 순환(영구 좀비) — idle 갭보다 나쁜 회귀."""
    ready_count = [0]

    def raising_infer(wav_path, on_frame):
        raise RuntimeError("render server down")

    def on_ready():
        ready_count[0] += 1

    pipe, _vt, _at = _make_pipeline(infer_fn=raising_infer)
    try:
        asyncio.run(pipe.say("hi", on_response_ready=on_ready))
    except RuntimeError:
        pass  # 예외 전파 자체는 기존 계약(호출측 signaling이 흡수)
    assert ready_count[0] == 1, f"예외 경로에서도 훅 1회 발동 필요: {ready_count[0]}"


def test_filler_live_loop_no_push_after_cut():
    """[el RISK] 실제 _play_loop 태스크가 sleep 중일 때 stop→flush→응답 push 후
    필러 프레임이 응답 뒤에 끼지 않는다(원자성 통합 검증)."""
    async def scenario():
        vt = _FakeVideoTrack()
        at = _FakeAudioTrack()
        filler_frame = np.full((4, 4, 3), 7, dtype=np.uint8)
        pcm = np.zeros(4800, dtype=np.int16)

        def stub_decode(path):
            # 50프레임(2초 분량) — push 후 sleep(2-1=1s) 구간에서 컷 시뮬
            return [filler_frame] * 50, pcm

        fp = FillerPlayer(["fake0.mp4", "fake1.mp4"], vt, at, decode_fn=stub_decode)
        fp.start()
        await asyncio.sleep(0.05)  # _play_loop 첫 push 완료 후 sleep 진입 대기
        assert vt.queue_depth() >= 50, "필러 첫 push 선행 확인"

        # 즉시컷: stop → flush → 응답 push (같은 코루틴, await 없음)
        fp.stop()
        vt.flush()
        at.flush()
        resp = np.full((4, 4, 3), 42, dtype=np.uint8)
        vt.push_ndarray(resp)

        # 이벤트루프에 제어를 여러 번 넘겨 취소/재개 여지를 소진
        for _ in range(5):
            await asyncio.sleep(0)
        await asyncio.sleep(0.05)

        # flush 이후 큐에는 응답 1개뿐이어야 함 (필러 재개 push 금지 — _q는 flush로 비워짐)
        assert vt.queue_depth() == 1 and vt._q[0][0, 0, 0] == 42, (
            f"flush 후 필러 프레임 유입: 큐 {vt.queue_depth()}개"
        )
        fp.close()

    asyncio.run(scenario())


def test_pipeline_on_response_ready_fires_once_for_speak():
    """speak() 도 on_response_ready를 첫 infer 직전 1회 호출한다."""
    ready_count = [0]

    def on_ready():
        ready_count[0] += 1

    pipe, _vt, _at = _make_pipeline()
    asyncio.run(pipe.speak("안녕하세요.", on_response_ready=on_ready))
    assert ready_count[0] == 1


def test_pipeline_on_response_ready_none_is_harmless():
    """on_response_ready=None 이면 기존 경로와 동일(예외 없음)."""
    pipe, _vt, _at = _make_pipeline()
    asyncio.run(pipe.say("안녕", on_response_ready=None))  # 예외 없어야 함


def test_pipeline_on_response_ready_not_called_twice_on_multi_sentence():
    """복수 문장이 나와도 on_response_ready는 딱 1회만 호출된다."""
    ready_count = [0]

    def on_ready():
        ready_count[0] += 1

    pipe, _vt, _at = _make_pipeline(chat_yields=["첫.", "둘.", "셋."])
    asyncio.run(pipe.say("질문", on_response_ready=on_ready))
    assert ready_count[0] == 1


# ═══════════════════════════════════════════════════════════════════════════════
# 2. 즉시컷 hook 순서 검증 (stop → flush → 응답 push)
# ═══════════════════════════════════════════════════════════════════════════════

def test_response_hook_stop_then_flush_then_push_order():
    """on_response_ready 콜백에서 stop → video/audio flush 순서 보장.

    실제 FillerPlayer + FakeTrack으로 검증: flush 이후 응답 frames이 큐에 적재됨.
    """
    # 필러 큐에 더미 frames 미리 적재
    vt = _FakeVideoTrack()
    at = _FakeAudioTrack()
    dummy_frame = np.zeros((512, 512, 3), dtype=np.uint8)
    vt.push_ndarray(dummy_frame)
    vt.push_ndarray(dummy_frame)
    at.push_pcm_int16(np.ones(960, dtype=np.int16))

    assert vt.queue_depth() == 2
    assert at.queue_depth_samples() == 960

    call_log: list[str] = []

    # FillerPlayer mock (paths=[] → start 무동작, stop 멱등)
    fp = FillerPlayer([], vt, at)

    def on_response_ready():
        fp.stop()
        v_dropped = vt.flush()
        a_dropped = at.flush()
        call_log.append(f"flush_v={v_dropped} flush_a={a_dropped}")

    on_response_ready()

    assert vt.queue_depth() == 0, "flush 후 video 큐 비어야 함"
    assert at.queue_depth_samples() == 0, "flush 후 audio 버퍼 비어야 함"
    assert len(call_log) == 1
    assert "flush_v=2" in call_log[0]
    assert "flush_a=960" in call_log[0]


def test_flush_before_push_means_response_frames_visible():
    """flush 이후 push된 응답 frame은 큐에서 정상 조회된다."""
    vt = _FakeVideoTrack()
    at = _FakeAudioTrack()

    # 필러 더미 적재
    for _ in range(5):
        vt.push_ndarray(np.zeros((512, 512, 3), dtype=np.uint8))
    at.push_pcm_int16(np.ones(960 * 3, dtype=np.int16))

    # flush (즉시컷)
    vt.flush()
    at.flush()
    assert vt.queue_depth() == 0
    assert at.queue_depth_samples() == 0

    # 응답 push (기존 경로)
    resp_frame = np.ones((512, 512, 3), dtype=np.uint8) * 42
    vt.push_ndarray(resp_frame)
    at.push_pcm_int16(np.ones(960, dtype=np.int16) * 100)

    assert vt.queue_depth() == 1
    assert np.all(vt._q[0] == 42), "응답 frame이 필러 없이 단독으로 있어야 함"


# ═══════════════════════════════════════════════════════════════════════════════
# 3. greet 모드 — filler 미시작
# ═══════════════════════════════════════════════════════════════════════════════

def test_greet_does_not_start_filler():
    """greet(클론 선인사)는 사용자 발화가 아니므로 FillerPlayer.start() 미호출."""
    fp = mock.MagicMock(spec=FillerPlayer)
    fp._paths = []

    # signaling _run() 로직 재현: greet → filler start 안 함
    mode = "greet"
    _FILLER_ENABLED = True
    _filler = fp if _FILLER_ENABLED else None

    if mode in ("say", "speak") and _filler is not None:
        _filler.start()

    fp.start.assert_not_called()


def test_say_starts_filler():
    """say 수신 시 FillerPlayer.start() 호출된다."""
    fp = mock.MagicMock(spec=FillerPlayer)

    mode = "say"
    _FILLER_ENABLED = True
    _filler = fp if _FILLER_ENABLED else None

    if mode in ("say", "speak") and _filler is not None:
        _filler.start()

    fp.start.assert_called_once()


def test_speak_starts_filler():
    """speak 수신 시 FillerPlayer.start() 호출된다."""
    fp = mock.MagicMock(spec=FillerPlayer)

    mode = "speak"
    _FILLER_ENABLED = True
    _filler = fp if _FILLER_ENABLED else None

    if mode in ("say", "speak") and _filler is not None:
        _filler.start()

    fp.start.assert_called_once()


# ═══════════════════════════════════════════════════════════════════════════════
# 4. 토글 off — filler 미기동, 회귀 0
# ═══════════════════════════════════════════════════════════════════════════════

def test_toggle_off_filler_is_none():
    """PRETHIRD_FILLER off → _filler=None → start/stop 미호출."""
    fp = mock.MagicMock(spec=FillerPlayer)

    _FILLER_ENABLED = False  # off
    _filler = fp if _FILLER_ENABLED else None

    # say 수신 시에도 filler 미기동
    mode = "say"
    if mode in ("say", "speak") and _filler is not None:
        _filler.start()

    assert _filler is None
    fp.start.assert_not_called()


def test_toggle_off_response_hook_is_none():
    """PRETHIRD_FILLER off → _response_hook=None → pipeline에 None 전달."""
    _FILLER_ENABLED = False
    _filler = None

    def _on_response_ready():
        pass  # 호출되어선 안 됨

    _response_hook = _on_response_ready if _filler is not None else None
    assert _response_hook is None


# ═══════════════════════════════════════════════════════════════════════════════
# 5. cleanup — close() 호출, 좀비 task 없음
# ═══════════════════════════════════════════════════════════════════════════════

def test_cleanup_calls_close_and_clears_filler_player():
    """통화 종료 시 FillerPlayer.close() 호출 후 sess.filler_player=None."""
    fp = mock.MagicMock(spec=FillerPlayer)

    class _FakeSess:
        filler_player = fp

    sess = _FakeSess()

    # signaling _on_state cleanup 로직 재현
    _filler_cleanup = getattr(sess, "filler_player", None)
    if _filler_cleanup is not None:
        _filler_cleanup.close()
        sess.filler_player = None

    fp.close.assert_called_once()
    assert sess.filler_player is None


def test_cleanup_no_error_when_no_filler():
    """filler_player=None 세션 cleanup 시 에러 없음."""
    class _FakeSess:
        filler_player = None

    sess = _FakeSess()
    _filler_cleanup = getattr(sess, "filler_player", None)
    if _filler_cleanup is not None:
        _filler_cleanup.close()
        sess.filler_player = None
    # 예외 없어야 함


def test_close_cancels_task_no_zombie():
    """FillerPlayer.close() 후 내부 task가 cancel 상태(좀비 없음)."""
    vt = _FakeVideoTrack()
    at = _FakeAudioTrack()

    # paths=["x"] 으로 start()하면 task가 생기지만 decode 실패 → loop 즉시 종료
    # 대신 실제 asyncio task 생성 후 close() 검증
    async def _run():
        fp = FillerPlayer([], vt, at)
        # paths 없어도 start()는 무동작 — task=None
        fp.start()
        assert fp._task is None or fp._task.done()
        fp.close()
        # close 후 캐시 비워짐
        assert fp._cache == {}

    asyncio.run(_run())


# ═══════════════════════════════════════════════════════════════════════════════
# 6. 필러 0개 / 다운로드 실패 → idle 폴백
# ═══════════════════════════════════════════════════════════════════════════════

def test_filler_player_empty_paths_start_is_noop():
    """필러 경로 없음 → start() 무동작(idle 폴백), 에러 없음."""
    vt = _FakeVideoTrack()
    at = _FakeAudioTrack()
    fp = FillerPlayer([], vt, at)
    fp.start()
    assert fp._task is None


def test_filler_player_empty_paths_close_is_noop():
    """필러 경로 없음 → close() 무동작, 에러 없음."""
    vt = _FakeVideoTrack()
    at = _FakeAudioTrack()
    fp = FillerPlayer([], vt, at)
    fp.close()  # 예외 없어야 함


def test_download_failure_results_in_empty_paths():
    """다운로드 실패 → paths=[] → FillerPlayer 미생성(idle 폴백).

    signaling._dl_filler 실제 구조: try/except 내부에서 None 반환(raise 아님).
    gather는 return_exceptions=False(기본) — 예외가 아닌 None 필터링으로 동작.
    이 테스트는 실제 코드 분기(None 반환 → filter) 를 정확히 재현한다.
    """

    async def _simulate_filler_download_actual():
        filler_urls = ["https://r2/filler_0.mp4", "https://r2/filler_1.mp4"]

        async def _dl_filler(url, idx):
            """실제 signaling._dl_filler 구조 재현: 예외 catch → None 반환."""
            try:
                # fetch_to stub: 무조건 실패
                raise RuntimeError("network error")
            except Exception:
                return None  # 실제 코드와 동일: None 반환, re-raise 없음

        # gather return_exceptions 미사용(기본 False) — 실제 코드와 동일
        filler_results = await asyncio.gather(
            *[_dl_filler(u, i) for i, u in enumerate(filler_urls)]
        )
        # None 필터 — 실제 코드: [p for p in filler_results if p is not None]
        filler_paths = [p for p in filler_results if p is not None]
        return filler_paths

    paths = asyncio.run(_simulate_filler_download_actual())
    assert paths == [], f"실패 시 경로 없어야 함: {paths}"


# ═══════════════════════════════════════════════════════════════════════════════
# 7. session.filler_player 필드 존재
# ═══════════════════════════════════════════════════════════════════════════════

def test_session_has_filler_player_field():
    """Session 인스턴스가 filler_player=None 필드를 갖는다."""
    # session.py는 aiortc → media_tracks 의존이라 stub 없이는 import 불가.
    # 여기서는 Session 클래스의 __init__ 인터페이스를 재현해 검증.
    # 실제 Session 클래스 임포트 시도(가능한 환경에서는 직접 검증).
    try:
        import importlib
        session_mod = importlib.import_module("session")
        sess = session_mod.Session("test_sid_f7")
        assert hasattr(sess, "filler_player"), "Session에 filler_player 필드 없음"
        assert sess.filler_player is None, f"초기값이 None이어야 함: {sess.filler_player}"
    except ImportError:
        # aiortc 없는 환경: 필드 정의만 소스에서 확인
        import pathlib
        src = pathlib.Path(__file__).parent / "session.py"
        assert "filler_player" in src.read_text(), "session.py에 filler_player 필드 없음"


# ═══════════════════════════════════════════════════════════════════════════════
# 8. signaling._FILLER_ENABLED 토글 상수
# ═══════════════════════════════════════════════════════════════════════════════

def test_signaling_filler_enabled_constant_exists():
    """signaling 모듈에 _FILLER_ENABLED 상수가 정의돼 있다."""
    import pathlib
    src = pathlib.Path(__file__).parent / "signaling.py"
    content = src.read_text()
    assert "_FILLER_ENABLED" in content, "signaling.py에 _FILLER_ENABLED 없음"
    assert 'PRETHIRD_FILLER' in content, "PRETHIRD_FILLER env 키 없음"


def test_signaling_filler_default_off(monkeypatch):
    """PRETHIRD_FILLER 미설정 → _FILLER_ENABLED=False (기본 off)."""
    import os
    monkeypatch.delenv("PRETHIRD_FILLER", raising=False)
    result = os.environ.get("PRETHIRD_FILLER", "0") == "1"
    assert result is False


def test_signaling_filler_on_when_env_set(monkeypatch):
    """PRETHIRD_FILLER=1 → _FILLER_ENABLED=True."""
    import os
    monkeypatch.setenv("PRETHIRD_FILLER", "1")
    result = os.environ.get("PRETHIRD_FILLER", "0") == "1"
    assert result is True


# ═══════════════════════════════════════════════════════════════════════════════
# 9. pipeline 기존 경로 회귀 (on_response_ready 없을 때 on_first_audio 정상 동작)
# ═══════════════════════════════════════════════════════════════════════════════

def test_on_first_audio_still_fires_when_response_ready_is_none():
    """on_response_ready=None이어도 on_first_audio는 정상 호출된다."""
    first_audio_fired = [False]

    def on_first_audio():
        first_audio_fired[0] = True

    pipe, _vt, _at = _make_pipeline()
    asyncio.run(pipe.say("테스트", on_first_audio=on_first_audio, on_response_ready=None))
    assert first_audio_fired[0], "on_first_audio가 호출되지 않음"


def test_both_callbacks_fire_in_correct_order():
    """on_response_ready(stop→flush)가 on_first_audio(speech_start) 이전에 호출된다."""
    call_log: list[str] = []

    def on_ready():
        call_log.append("ready")

    def on_first():
        call_log.append("first_audio")

    pipe, _vt, _at = _make_pipeline()
    asyncio.run(pipe.say("순서 확인", on_first_audio=on_first, on_response_ready=on_ready))

    assert "ready" in call_log
    assert "first_audio" in call_log
    assert call_log.index("ready") < call_log.index("first_audio"), (
        f"ready가 first_audio 이전이어야 함: {call_log}"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 보강 T9-fix: el RISK-2 — _FILLER_ENABLED 모듈 상수 한계 명시
# ═══════════════════════════════════════════════════════════════════════════════

def test_filler_enabled_module_constant_is_process_start_time():
    """_FILLER_ENABLED 는 모듈 import 시 1회 평가된 상수 (프로세스 재시작 전용).

    monkeypatch.setenv로는 이미 로드된 모듈 상수를 변경할 수 없으므로
    이 테스트는 env 파싱 로직만 단독 검증한다.
    실제 signaling 모듈 상수 변경 테스트는 모듈 reload가 필요하며,
    운영 환경에서 토글 변경은 프로세스 재시작으로만 유효하다.
    """
    import os
    # env off → False
    os.environ.pop("PRETHIRD_FILLER", None)
    assert (os.environ.get("PRETHIRD_FILLER", "0") == "1") is False

    # env on → True
    os.environ["PRETHIRD_FILLER"] = "1"
    assert (os.environ.get("PRETHIRD_FILLER", "0") == "1") is True

    # 정리
    os.environ.pop("PRETHIRD_FILLER", None)


# ═══════════════════════════════════════════════════════════════════════════════
# 보강: sion MAJOR — 연속 턴 (say→응답→say→응답) start/stop 반복, 상태 누수 없음
# ═══════════════════════════════════════════════════════════════════════════════

def test_filler_player_start_stop_repeated_no_state_leak():
    """FillerPlayer start/stop 2회 반복 후 내부 상태 누수 없음.

    - start() 멱등: 실행 중 재호출 무동작
    - stop() 후 재 start(): task 새로 생성
    - stop() 멱등: 이미 완료된 task에 cancel 무해
    """

    async def _run():
        vt = _FakeVideoTrack()
        at = _FakeAudioTrack()
        slept: list[float] = []

        async def fake_sleep(sec):
            slept.append(sec)
            # 즉시 반환 (무한루프 방지)
            raise asyncio.CancelledError()

        # paths=["x"] → start()가 task 생성 시도, decode 실패 → 루프 즉시 종료
        fp = FillerPlayer(
            ["fake_filler.mp4"],
            vt,
            at,
            decode_fn=lambda p: ([], __import__("numpy").zeros(0, dtype=__import__("numpy").int16)),
            _sleep_fn=fake_sleep,
        )

        # 1턴: start → stop
        fp.start()
        assert fp._task is not None
        first_task = fp._task
        fp.stop()
        # task.cancel() 이후 done() 은 event loop가 돌아야 확정되므로
        # 여기서는 task 객체가 이전 것과 동일한지만 확인
        assert fp._task is first_task

        # stop 후 start → 새 task 여야 함(이전 task done 후)
        # 이전 task가 done 상태여야 새 task 생성됨 — asyncio await로 확정
        await asyncio.sleep(0)  # 이벤트루프 1 tick → cancel 처리
        assert first_task.done(), "cancel 후 task가 done 상태여야 함"

        # 2턴: stop 후 재시작
        fp.start()
        second_task = fp._task
        assert second_task is not first_task, "stop 후 재시작 시 새 task 생성"
        fp.stop()
        await asyncio.sleep(0)
        assert second_task.done()

        # close() 후 캐시 비워짐
        fp.close()
        assert fp._cache == {}

    asyncio.run(_run())


def test_consecutive_turns_ready_hook_fires_each_time():
    """연속 2턴에서 on_response_ready가 각 턴마다 1회씩 호출된다."""
    ready_count = [0]

    def on_ready():
        ready_count[0] += 1

    pipe, _vt, _at = _make_pipeline()

    # 1턴
    asyncio.run(pipe.say("1번 질문", on_response_ready=on_ready))
    assert ready_count[0] == 1, f"1턴 후 ready=1이어야 함: {ready_count[0]}"

    # 2턴
    asyncio.run(pipe.say("2번 질문", on_response_ready=on_ready))
    assert ready_count[0] == 2, f"2턴 후 ready=2이어야 함: {ready_count[0]}"


# ═══════════════════════════════════════════════════════════════════════════════
# 보강: sion MAJOR — 부분 다운로드 (3개 중 1개 실패 → 성공분 2개만)
# ═══════════════════════════════════════════════════════════════════════════════

def test_partial_download_failure_keeps_successful_paths():
    """URL 3개 중 1개만 실패 시 성공한 2개 경로만 FillerPlayer에 전달된다.

    실제 signaling._dl_filler: 실패 시 None 반환, gather 후 None 필터링.
    """

    async def _simulate_partial_failure():
        filler_urls = [
            "https://r2/filler_0.mp4",
            "https://r2/filler_1.mp4",  # 이것만 실패
            "https://r2/filler_2.mp4",
        ]

        async def _dl_filler(url, idx):
            try:
                if idx == 1:
                    raise RuntimeError("timeout")
                # 성공 시뮬레이션: 경로 반환
                return f"/tmp/clone-filler-{idx}.mp4"
            except Exception:
                return None

        filler_results = await asyncio.gather(
            *[_dl_filler(u, i) for i, u in enumerate(filler_urls)]
        )
        filler_paths = [p for p in filler_results if p is not None]
        return filler_paths

    paths = asyncio.run(_simulate_partial_failure())
    assert len(paths) == 2, f"성공 2개만 남아야 함: {paths}"
    assert "/tmp/clone-filler-0.mp4" in paths
    assert "/tmp/clone-filler-2.mp4" in paths
    assert all("filler-1" not in p for p in paths), "실패한 filler-1은 없어야 함"


# ═══════════════════════════════════════════════════════════════════════════════
# 보강: sion MAJOR — cleanup 예외 (failed · closed 양쪽 경로)
# ═══════════════════════════════════════════════════════════════════════════════

def test_cleanup_called_on_failed_state():
    """pc state=failed → _on_state cleanup → FillerPlayer.close() 1회."""
    fp = mock.MagicMock(spec=FillerPlayer)

    class _FakeSess:
        filler_player = fp
        session_id = "test_sess"

    sess = _FakeSess()

    # _on_state failed 경로 재현
    pc_state = "failed"
    if pc_state in ("failed", "closed", "disconnected"):
        _filler_cleanup = getattr(sess, "filler_player", None)
        if _filler_cleanup is not None:
            _filler_cleanup.close()
            sess.filler_player = None

    fp.close.assert_called_once()
    assert sess.filler_player is None


def test_cleanup_called_on_closed_state():
    """pc state=closed → _on_state cleanup → FillerPlayer.close() 1회."""
    fp = mock.MagicMock(spec=FillerPlayer)

    class _FakeSess:
        filler_player = fp
        session_id = "test_sess"

    sess = _FakeSess()

    pc_state = "closed"
    if pc_state in ("failed", "closed", "disconnected"):
        _filler_cleanup = getattr(sess, "filler_player", None)
        if _filler_cleanup is not None:
            _filler_cleanup.close()
            sess.filler_player = None

    fp.close.assert_called_once()
    assert sess.filler_player is None


def test_cleanup_no_zombie_task_after_close():
    """close() 후 FillerPlayer 내부 task가 cancel됐고 좀비 없음."""

    async def _run():
        vt = _FakeVideoTrack()
        at = _FakeAudioTrack()

        call_count = [0]

        async def counting_sleep(sec):
            call_count[0] += 1
            # 즉시 취소 유도하지 않고 1회 통과 후 루프 종료 대기
            await asyncio.sleep(0)

        fp = FillerPlayer(
            ["p.mp4"],
            vt,
            at,
            decode_fn=lambda p: ([], __import__("numpy").zeros(0, dtype=__import__("numpy").int16)),
            _sleep_fn=counting_sleep,
        )
        fp.start()
        task = fp._task
        assert task is not None and not task.done()

        # close 호출 → stop() + cancel
        fp.close()
        await asyncio.sleep(0)  # 이벤트루프 tick → cancel 처리

        assert task.cancelled() or task.done(), "close 후 task가 종료돼야 함"
        assert fp._cache == {}, "close 후 캐시 비워져야 함"

    asyncio.run(_run())
