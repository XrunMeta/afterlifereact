from __future__ import annotations
import logging, os
from typing import Any
from aiohttp import web
import config
from idle_policy import prebake_enabled
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


_VALID_RENDERERS = ("musetalk", "fifth")


def _select_renderer_name() -> str:
    """PRETHIRD_RENDERER env 해석. 미설정/미지원 값은 musetalk(기본)."""
    name = os.environ.get("PRETHIRD_RENDERER", "musetalk").strip().lower()
    return name if name in _VALID_RENDERERS else "musetalk"


def _make_musetalk(video_path: str):
    from musetalk_inproc import MuseTalkInproc
    mt = MuseTalkInproc(video_path)
    mt.load()
    log.info("musetalk in-process loaded (ref=%s)", video_path)
    return mt


def _make_fifth(video_path: str):
    from fifth_inproc import FifthInproc
    f5 = FifthInproc(video_path)
    f5.load()
    log.info("fifth in-process loaded (ref=%s)", video_path)
    return f5


def _build_renderer(name: str, video_path: str):
    return _make_fifth(video_path) if name == "fifth" else _make_musetalk(video_path)


_IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")


def _is_image_source(path: str) -> bool:
    return bool(path) and os.path.splitext(path)[1].lower() in _IMAGE_EXTS


def _pick_source(face_path, video_path, isfile=os.path.isfile):
    """발화/렌더 source 선택: 존재하는 face_path(정면사진) 우선, 없으면 video_path.

    둘 다 없거나 미존재면 None(renderer 기본 halbae).
    """
    if face_path and isfile(face_path):
        return face_path
    if video_path and isfile(video_path):
        return video_path
    return None


def _source_for_renderer(renderer_name, face_path, video_path, isfile=os.path.isfile):
    """정면사진(이미지) source는 fifth 렌더러에서만 사용. musetalk 등은 영상(mp4)만.

    musetalk에 사진(.jpg)을 video_path로 넘기면 cv2.VideoCapture가 0프레임으로 실패하기 때문.
    """
    face = face_path if renderer_name == "fifth" else None
    return _pick_source(face, video_path, isfile)


def _build_pipeline_factory():
    """렌더러(musetalk/fifth) 1회 load + 세션별 DialoguePipeline factory.

    PRETHIRD_REFERENCE_VIDEO 미설정 또는 GPU 없으면 None 반환 → 시그널링/idle만.
    import는 video_path 확인 후에만 실행(GPU 없는 환경에서 torch import 방지).
    PRETHIRD_RENDERER=fifth 로 fifth 렌더러 opt-in. 기본 musetalk.
    """
    video_path = os.environ.get("PRETHIRD_REFERENCE_VIDEO", "")
    if not video_path:
        log.warning("PRETHIRD_REFERENCE_VIDEO 미설정 — 파이프라인 비활성(시그널링/idle만)")
        return None

    from clone_dialog import chat_stream
    from tts_client import say as tts_say
    from audio_utils import _decode_wav
    from pipeline import DialoguePipeline

    renderer_name = _select_renderer_name()
    renderer = _build_renderer(renderer_name, video_path)
    log.info("renderer=%s loaded", renderer_name)
    if prebake_enabled() and renderer_name != "fifth":
        log.warning(
            "IDLE_SOURCE_MODE=prebake 이나 renderer=%s(fifth 아님) — prebake 무효과, idle halbae 고착 위험",
            renderer_name,
        )

    default_se = os.environ.get("PRETHIRD_TTS_SE_PATH", "") or None

    def factory(sess):
        persona_messages, se_path = _resolve_persona_se(sess, default_se)
        # source 우선순위: renderer별로 가드 — 사진은 fifth 전용, musetalk은 영상(mp4)만
        _src = _source_for_renderer(
            renderer_name,
            getattr(sess, "face_path", None),
            getattr(sess, "video_path", None),
        )
        if renderer_name == "fifth" and getattr(sess, "face_path", None) and _src != getattr(sess, "face_path", None):
            log.warning("face_path 파일 없음, 영상/halbae fallback: %s", sess.face_path)

        def _infer_fn(wav, cb, _src=_src, render_mode: str | None = None):
            """[T-113 Task6] pipeline._infer_stage 가 넘기는 render_mode 를
            fifth 렌더러에만 포워딩한다(batch 는 fifth 전용).

            - renderer=fifth: FifthInproc.infer(..., render_mode=render_mode)
              로 그대로 전달. render_mode=None(partial 경로 — pipeline이 이
              kwarg 자체를 안 넘겨 이 파라미터 기본값 None 이 쓰이는 경우)이면
              fifth_inproc 계약(Task2)상 body 에 키가 생략돼 현행과
              byte-identical(회귀 0).
            - renderer=musetalk 등: MuseTalkInproc.infer 는 render_mode 인자를
              받지 않으므로(TypeError 방지) 절대 전달하지 않고 무시한다.
              batch 로 설정돼 있었다면 안전하게 무시됨을 로그로 남긴다.
            """
            if renderer_name == "fifth":
                return renderer.infer(wav, cb, video_path=_src, render_mode=render_mode)
            if render_mode is not None:
                log.warning(
                    "PRETHIRD_RENDER_MODE=%s 이나 renderer=%s(fifth 아님) — "
                    "render_mode 무시(fifth 전용)",
                    render_mode, renderer_name,
                )
            return renderer.infer(wav, cb, video_path=_src)

        # idle prebake: fifth 렌더러 + 정면사진 source일 때만 실행
        if renderer_name == "fifth" and _src and _is_image_source(_src) and os.environ.get("FIFTH_IDLE_PREBAKE", "1") == "1" and prebake_enabled():
            from idle_prebake import start_prebake
            _tmp = os.environ.get("TMPDIR", "/tmp")
            start_prebake(renderer, _src, sess.video_track, wav_dir=_tmp)

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
