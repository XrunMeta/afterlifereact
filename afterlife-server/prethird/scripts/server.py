from __future__ import annotations
import logging, os
from typing import Any
from aiohttp import web
import config
from signaling import make_app

log = logging.getLogger("prethird.server")

logging.basicConfig(level=os.environ.get("PRETHIRD_LOG_LEVEL", "INFO"),
                    format="%(asctime)s %(levelname)s %(name)s %(message)s")


def _resolve_persona_se(sess: Any, default_se: str | None) -> tuple[list, str | None]:
    """세션별 persona_messages/se_path 를 해석해 반환한다.

    - sess.persona_messages 가 비어있지 않으면 그것을 사용, 아니면 []
    - clone_id 세션: sess.se_path 그대로(없으면 None). default_se(halbae) 폴백 금지 — 폴백 없음.
    - clone_id 없는 세션: sess.se_path 없으면 default_se 폴백(기존 동작).
    """
    persona = getattr(sess, "persona_messages", None) or []
    se_self = getattr(sess, "se_path", None)
    clone_locked = getattr(sess, "clone_id", None) is not None
    se = se_self if clone_locked else (se_self or default_se)
    return persona, se


def _build_pipeline_factory():
    """musetalk 1회 load + 세션별 DialoguePipeline factory.

    PRETHIRD_REFERENCE_VIDEO 미설정 또는 GPU 없으면 None 반환 → 시그널링/idle만.
    import는 video_path 확인 후에만 실행(GPU 없는 환경에서 torch import 방지).
    """
    video_path = os.environ.get("PRETHIRD_REFERENCE_VIDEO", "")
    if not video_path:
        log.warning("PRETHIRD_REFERENCE_VIDEO 미설정 — 파이프라인 비활성(시그널링/idle만)")
        return None

    from musetalk_inproc import MuseTalkInproc
    from clone_dialog import chat_stream
    from tts_client import say as tts_say
    from audio_utils import _decode_wav
    from pipeline import DialoguePipeline

    mt = MuseTalkInproc(video_path)
    mt.load()
    log.info("musetalk in-process loaded (ref=%s)", video_path)

    default_se = os.environ.get("PRETHIRD_TTS_SE_PATH", "") or None

    def factory(sess):
        persona_messages, se_path = _resolve_persona_se(sess, default_se)
        # 클론별 video_path를 infer_fn 클로저로 주입 (None이면 mt 기본 halbae)
        # 파일이 실제 존재할 때만 사용 — 없으면 None → halbae fallback (turn 사망 방지)
        _raw_vp = getattr(sess, "video_path", None)
        _vp = _raw_vp if (_raw_vp and os.path.isfile(_raw_vp)) else None
        if _raw_vp and not _vp:
            log.warning("video_path 파일 없음, halbae fallback: %s", _raw_vp)

        def _infer_fn(wav, cb, _vp=_vp):
            return mt.infer(wav, cb, video_path=_vp)
        return DialoguePipeline(
            video_track=sess.video_track,
            audio_track=sess.audio_track,
            chat_fn=chat_stream,
            say_fn=tts_say,
            decode_wav_fn=_decode_wav,
            infer_fn=_infer_fn,
            persona_messages=persona_messages,
            se_path=se_path,
            clone_locked=getattr(sess, "clone_id", None) is not None,
        )

    return factory


def main() -> None:
    factory = _build_pipeline_factory()
    app = make_app(pipeline_factory=factory)
    web.run_app(app, host=config.BIND, port=config.PORT)


if __name__ == "__main__":
    main()
