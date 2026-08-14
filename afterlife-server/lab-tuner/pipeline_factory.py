from __future__ import annotations
import logging

from pipeline import DialoguePipeline          # prethird
from audio_utils import _decode_wav            # prethird
from sentence_buffer import SentenceBuffer     # prethird
from harness import build_chat_fn, build_say_fn, apply_persona_knobs
from store_recorder import StoreRecorder

log = logging.getLogger("lab-tuner.factory")

def build_knobs_pipeline_factory(registry, renderer, guard=None, store=None):
    """공유 라이브 렌더(renderer=KnobsFifthInproc, render_url=:8810)와 registry로
    세션별 DialoguePipeline factory 생성.

    guard: LiveGuard | None — 지정 시 렌더 직전 assert_free()로 라이브 통화 중 렌더 차단.
    store: ArtifactStore | None — 지정 시 sess.recorder를 StoreRecorder(store)로 교체해
           /replay/* 가 실 데이터로 동작하게 한다(prethird 무수정, sess 속성만 교체).
           None(기본)이면 기존 recorder(prethird offer가 세팅한 것) 그대로 — 회귀 0.
    """
    chat_fn = build_chat_fn(registry)
    say_fn = build_say_fn(registry)

    def factory(sess):
        if store is not None:
            sess.recorder = StoreRecorder(store)   # prethird offer가 세팅한 recorder 교체
        dk = registry.get().dialogue
        base_persona = getattr(sess, "persona_messages", None) or []
        persona = apply_persona_knobs(base_persona, dk)
        # source: 정면사진(face_path) 우선, 없으면 video_path (fifth 전용)
        src = getattr(sess, "face_path", None) or getattr(sess, "video_path", None)

        def _infer_fn(wav, cb, _src=src):
            if guard is not None:
                guard.assert_free()   # 라이브 통화 중이면 LiveBusyError → say 실패 처리
            return renderer.infer(wav, cb, video_path=_src)

        pipe = DialoguePipeline(
            video_track=sess.video_track,
            audio_track=sess.audio_track,
            chat_fn=chat_fn,
            say_fn=say_fn,
            decode_wav_fn=_decode_wav,
            infer_fn=_infer_fn,
            persona_messages=persona,
            se_path=getattr(sess, "se_path", None),
            clone_locked=getattr(sess, "clone_id", None) is not None,
        )

        # min_len/force_flush 는 T-120 B 에서 DialoguePipeline 생성자 인자가 아니라
        # SentenceBuffer.from_env() 로 옮겨갔다(env PRETHIRD_SENTENCE_*). 그래서 랩은
        # 생성자 대신 _sb_factory 를 갈아끼워 노브를 주입한다 — prethird 무수정 원칙
        # (sess.recorder 교체와 같은 패턴).
        def _sb_factory(_dk=dk):
            sb = SentenceBuffer.from_env()       # env 기본값을 먼저 존중
            ml = getattr(_dk, "min_len", None)
            ff = getattr(_dk, "force_flush", None)
            if ml is not None:
                # env 로 first_min_len 을 명시하지 않았으면 min_len 을 따라가던 규약 유지
                follows_min = sb.first_min_len == sb.min_len
                sb.min_len = int(ml)
                if follows_min:
                    sb.first_min_len = int(ml)
            if ff is not None:
                sb.force_flush = int(ff)
            return sb

        pipe._sb_factory = _sb_factory
        return pipe

    return factory
