"""tests/test_fallback_lock.py — clone 세션 halbae 폴백 차단 TDD (el BLOCKER)"""
import sys
import pathlib
import types
import pytest

# 로컬 단위테스트: 무거운 의존성(aiortc, PyAV 기반) 미설치 환경 대비 stub.
# 실환경(가비아)엔 진짜 모듈이 있어 try-import로 덮지 않는다. 이 테스트는
# _resolve_persona_se / DialoguePipeline 가드의 순수 로직만 검증한다.
try:  # pragma: no cover
    import aiortc  # noqa: F401
except ImportError:  # pragma: no cover
    _aiortc_stub = types.ModuleType("aiortc")
    _aiortc_stub.__path__ = []  # 패키지로 인식 (서브모듈 import 허용)
    _aiortc_stub.RTCPeerConnection = object
    _aiortc_stub.RTCSessionDescription = object
    sys.modules["aiortc"] = _aiortc_stub
    _ms_stub = types.ModuleType("aiortc.mediastreams")
    _ms_stub.MediaStreamTrack = object
    _ms_stub.AudioStreamTrack = object
    _ms_stub.VideoStreamTrack = object
    sys.modules["aiortc.mediastreams"] = _ms_stub
    _av_stub = types.ModuleType("av")
    _av_stub.AudioFrame = object
    _av_stub.VideoFrame = object
    sys.modules["av"] = _av_stub

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import server
import pipeline as pl


def _sess(clone_id, se_path):
    s = types.SimpleNamespace()
    s.clone_id = clone_id
    s.se_path = se_path
    s.persona_messages = []
    return s


# ── _resolve_persona_se 폴백 차단 ────────────────────────────────────
def test_clone_session_blocks_halbae_fallback():
    """clone_id 세션 + se_path None → default_se(halbae) 폴백 안 함 → None."""
    _, se = server._resolve_persona_se(_sess(9001, None), "/ref/halbae/se.pth")
    assert se is None


def test_clone_session_uses_own_se():
    """clone_id 세션 + 자기 se_path 있으면 그대로 사용."""
    _, se = server._resolve_persona_se(_sess(9001, "/ref/9001/se.pth"), "/ref/halbae/se.pth")
    assert se == "/ref/9001/se.pth"


def test_system_session_keeps_fallback():
    """clone_id 없는(halbae 단독) 세션은 default_se 폴백 유지(기존 동작)."""
    _, se = server._resolve_persona_se(_sess(None, None), "/ref/halbae/se.pth")
    assert se == "/ref/halbae/se.pth"


# ── DialoguePipeline say/speak 가드 ──────────────────────────────────
async def test_say_skips_when_locked_and_no_se():
    """clone_locked=True + se_path None → say_fn 미호출(발화 skip)."""
    called = []

    async def fake_say(t, se):
        called.append(t)
        return b""

    dp = pl.DialoguePipeline(
        video_track=None, audio_track=None,
        chat_fn=None, say_fn=fake_say, decode_wav_fn=None, infer_fn=None,
        persona_messages=[], se_path=None, clone_locked=True,
    )
    await dp.say("안녕")
    await dp.speak("안녕")
    assert called == []


async def test_say_proceeds_when_locked_with_se(monkeypatch):
    """clone_locked=True + se_path 있으면 가드 통과(파이프라인 진입)."""
    entered = []

    async def fake_run(produce):
        entered.append(True)

    dp = pl.DialoguePipeline(
        video_track=None, audio_track=None,
        chat_fn=None, say_fn=None, decode_wav_fn=None, infer_fn=None,
        persona_messages=[], se_path="/ref/9001/se.pth", clone_locked=True,
    )
    monkeypatch.setattr(dp, "_run_pipeline", fake_run)
    await dp.speak("안녕")
    assert entered == [True]
