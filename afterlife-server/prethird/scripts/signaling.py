from __future__ import annotations
import asyncio, os, time, pathlib, logging
from typing import Callable, Optional
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from session import SessionManager
from bundle_client import fetch_bundle
from persona_prompt import bundle_to_messages
from asset_fetch import fetch_to
from voice_fetch import ensure_voice_wav
from prebuild import prebuild_handler

REF_VOICES_ROOT = os.environ.get(
    "PRETHIRD_REF_VOICES_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)
VIDEO_REF_ROOT = os.environ.get(
    "PRETHIRD_VIDEO_REF_ROOT",
    "/home/afterlife/afterlife-server/prethird/video-ref",
)

_START = time.time()
log = logging.getLogger("prethird.signaling")
_AVSYNC_LOG = os.environ.get("PRETHIRD_AVSYNC_LOG", "1") == "1"


async def _avsync_monitor(sess, interval: float = 0.5) -> None:
    """0.5s 주기로 video/audio 송출 카운터를 로깅한다.
    세션 종료(cancelled) 시 조용히 종료.
    """
    t0 = asyncio.get_event_loop().time()
    vt = sess.video_track
    at = sess.audio_track
    try:
        while True:
            await asyncio.sleep(interval)
            elapsed = asyncio.get_event_loop().time() - t0
            v_real = getattr(vt, "frames_real", 0)
            vq = getattr(vt, "queue_depth", lambda: 0)()
            a_real = getattr(at, "frames_yielded_real", 0)
            samples_out = getattr(at, "samples_yielded_out", 0)
            _abuf = getattr(at, "queue_depth_samples", lambda: 0)()
            v_content = v_real / 25.0
            a_content = samples_out / 48000.0
            offset_ms = int((a_content - v_content) * 1000)
            abuf_ms = int(_abuf / 48)
            log.info(
                "[avsync] t=%.1f v_real=%d a_real=%d v_content=%.2f a_content=%.2f"
                " offset_ms=%d vq=%d abuf_ms=%d",
                elapsed, v_real, a_real, v_content, a_content, offset_ms, vq, abuf_ms,
            )
    except asyncio.CancelledError:
        pass

def _make_dc_handler(sess, channel):
    """DataChannel 'message' 핸들러 클로저를 반환한다.

    say/speak 메시지 수신 시 pipeline을 통해 발화하고,
    완료(성공·실패 모두) 후 datachannel로 speech_end(seq) 신호를 보낸다.
    seq는 RN이 부여한 값을 그대로 echo — 서버는 해석하지 않는다.
    """
    import json as _json

    def _on_msg(msg):
        try:
            data = _json.loads(msg)
        except (ValueError, TypeError):
            return
        if data.get("type") in ("say", "speak") and sess.pipeline is not None:
            text = data.get("text", "")
            if not text:
                return
            mode = data["type"]
            seq = data.get("seq")   # RN이 부여(없으면 None), echo 전용
            sess.set_state("speaking")

            async def _run(mode=mode, text=text, seq=seq):
                try:
                    if mode == "speak":
                        await sess.pipeline.speak(text)
                    else:
                        await sess.pipeline.say(text)
                except Exception as e:
                    log.warning("session %s %s failed: %s", sess.session_id, mode, e)
                finally:
                    sess.set_state("idle")
                    # 발화 push 완료 → 클라에 종료 신호(say 성공·실패 모두 전송).
                    # sess.datachannel 재참조 금지 — stop()+start() 재연결로 채널이
                    # 교체되면 엉뚱한 새 채널로 전송될 수 있다. 이 say를 받은
                    # 클로저 인자 channel(캡처 시점 고정)로만 전송한다.
                    if channel is not None and getattr(channel, "readyState", None) == "open":
                        try:
                            channel.send(_json.dumps({"type": "speech_end", "seq": seq}))
                        except Exception as exc:
                            log.warning(
                                "session %s speech_end send failed: %s",
                                sess.session_id, exc,
                            )

            asyncio.ensure_future(_run())

    return _on_msg


def make_app(pipeline_factory: Optional[Callable] = None) -> web.Application:
    """aiohttp Application 생성.

    Parameters
    ----------
    pipeline_factory : callable(sess) -> DialoguePipeline | None
        세션별 DialoguePipeline 생성 콜러블.
        None 이면 시그널링/idle 전용 모드(테스트·PoC).
    """
    app = web.Application()
    mgr = SessionManager()
    app["mgr"] = mgr

    async def healthz(_req: web.Request) -> web.Response:
        return web.json_response({
            "ok": True, "service": "prethird",
            "uptime_s": round(time.time() - _START, 1),
            "sessions": mgr.count(),
        })

    async def offer(request: web.Request) -> web.Response:
        params = await request.json()
        sess = mgr.create()
        pc = RTCPeerConnection()
        sess.pc = pc
        try:
            pc.addTrack(sess.video_track)
            pc.addTrack(sess.audio_track)

            # bundle 조회: clone_id/access_token 있을 때만
            # clone_id는 정수만 수용 — 비정수/음수/None이면 None(경로주입 차단, mizu H-1)
            raw_cid = params.get("clone_id")
            clone_id = raw_cid if isinstance(raw_cid, int) and raw_cid > 0 else None
            sess.clone_id = clone_id
            if sess.clone_id is not None:
                access_token = params.get("access_token")
                bundle = await fetch_bundle(
                    os.environ.get("PRETHIRD_API_BASE"), sess.clone_id, access_token
                )
                del access_token  # 토큰 세션 저장 금지 (mizu H-2)
                if bundle:
                    sess.persona_messages = bundle_to_messages(bundle)
                    assets = bundle.get("assets") or {}
                    se_key = assets.get("voiceSeKey")
                    # voice.wav lazy fetch: voiceRawUrl(원본 음성) → reference_voices/{clone_id}/voice.wav
                    # qwen3tts(8201)는 se_path에서 parse한 clone_id로 이 voice.wav를 찾는다. 폴백 없음.
                    voice_raw_url = assets.get("voiceRawUrl")
                    if voice_raw_url and sess.clone_id is not None:
                        try:
                            await ensure_voice_wav(sess.clone_id, voice_raw_url, REF_VOICES_ROOT)
                            log.info("voice.wav fetch OK clone=%s", sess.clone_id)
                        except Exception as e:
                            log.warning(
                                "voice.wav fetch 실패 clone=%s: %s (음성 무응답 — 폴백 없음)",
                                sess.clone_id, e,
                            )
                    # 후보 디렉토리 결정: voiceSeKey 우선, 없으면 clone_id 경로
                    candidate_dir = None
                    if se_key:
                        candidate_dir = f"{REF_VOICES_ROOT}/{se_key}"
                    elif sess.clone_id is not None:
                        candidate_dir = f"{REF_VOICES_ROOT}/{sess.clone_id}"
                    # 디렉토리 존재 확인: se.pth(OpenVoice) 또는 voice.wav(qwen3tts) 중 하나라도 있으면 채택
                    # clone_ref.py 구조: ref_audio_path는 {root}/{clone_id}/voice.wav 사용
                    # → 디렉토리 존재를 기준으로 se_path 설정(없는 자산 경로 미설정)
                    if candidate_dir:
                        se_pth = os.path.join(candidate_dir, "se.pth")
                        voice_wav = os.path.join(candidate_dir, "voice.wav")
                        if os.path.isfile(se_pth) or os.path.isfile(voice_wav):
                            sess.se_path = se_pth
                        else:
                            log.info("se_path 후보 부재 → 기본 voice 사용 (dir=%s)", candidate_dir)
                    # idleVideoUrl: R2에서 클론별 idle mp4 pull → sess.video_path
                    idle_url = assets.get("idleVideoUrl")
                    if idle_url and clone_id is not None:
                        dest = f"{VIDEO_REF_ROOT}/{clone_id}/{clone_id}-idle-25fps.mp4"
                        try:
                            await fetch_to(idle_url, dest)
                            sess.video_path = dest
                            # idle 영상도 per-clone으로 교체
                            sess.video_track.set_idle_video(dest)
                            log.info("idle video pull OK clone=%s dest=%s", clone_id, dest)
                        except Exception as e:
                            log.warning("idle video pull 실패 clone=%s: %s", clone_id, e)
                            # halbae fallback — sess.video_path = None 유지
            log.info(
                "offer session=%s clone_id=%s persona=%d se=%s video_path=%s",
                sess.session_id, sess.clone_id, len(sess.persona_messages),
                bool(sess.se_path), sess.video_path,
            )

            # pipeline factory가 있으면 세션에 주입
            if pipeline_factory is not None:
                sess.pipeline = pipeline_factory(sess)

            @pc.on("datachannel")
            def _on_dc(channel):
                sess.datachannel = channel
                _on_msg = _make_dc_handler(sess, channel)
                channel.on("message")(_on_msg)

            # [avsync] 모니터 task 핸들 (connected 시 시작, closed/failed 시 cancel)
            _avsync_task: list[asyncio.Task] = []  # list 로 감싸 클로저 재할당 가능

            @pc.on("connectionstatechange")
            async def _on_state():
                log.info("session %s pc state=%s", sess.session_id, pc.connectionState)
                if pc.connectionState == "connected":
                    if _AVSYNC_LOG and not _avsync_task:
                        task = asyncio.ensure_future(_avsync_monitor(sess))
                        _avsync_task.append(task)
                        log.info("session %s [avsync] monitor started", sess.session_id)
                if pc.connectionState in ("failed", "closed", "disconnected"):
                    if _avsync_task:
                        _avsync_task[0].cancel()
                        _avsync_task.clear()
                        log.info("session %s [avsync] monitor cancelled", sess.session_id)
                    await pc.close()
                    mgr.remove(sess.session_id)

            await pc.setRemoteDescription(
                RTCSessionDescription(sdp=params["sdp"], type=params["type"]))
            answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
        except Exception:
            await pc.close()
            mgr.remove(sess.session_id)
            raise
        return web.json_response({
            "session_id": sess.session_id,
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
        })

    app.router.add_get("/healthz", healthz)
    app.router.add_post("/offer", offer)
    app.router.add_post("/prebuild", prebuild_handler)
    app.router.add_static("/static/", path=str(
        pathlib.Path(__file__).resolve().parents[1] / "static"))
    return app
