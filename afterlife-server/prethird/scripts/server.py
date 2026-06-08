from __future__ import annotations
import logging, os
from aiohttp import web
import config
from signaling import make_app

logging.basicConfig(level=os.environ.get("PRETHIRD_LOG_LEVEL", "INFO"),
                    format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("prethird.server")


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
    from llm_client import chat_stream
    from tts_client import say as tts_say
    from audio_utils import _decode_wav
    from pipeline import DialoguePipeline

    mt = MuseTalkInproc(video_path)
    mt.load()
    log.info("musetalk in-process loaded (ref=%s)", video_path)

    se_path = os.environ.get("PRETHIRD_TTS_SE_PATH", "") or None
    persona: list = []  # 추후 페르소나 주입(별도)

    def factory(sess):
        return DialoguePipeline(
            video_track=sess.video_track,
            audio_track=sess.audio_track,
            chat_fn=chat_stream,
            say_fn=tts_say,
            decode_wav_fn=_decode_wav,
            infer_fn=mt.infer,
            persona_messages=persona,
            se_path=se_path,
        )

    return factory


def main() -> None:
    factory = _build_pipeline_factory()
    app = make_app(pipeline_factory=factory)
    web.run_app(app, host=config.BIND, port=config.PORT)


if __name__ == "__main__":
    main()
