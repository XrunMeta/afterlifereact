from __future__ import annotations
import logging
import time

from pipeline import DialoguePipeline          # prethird
from audio_utils import _decode_wav            # prethird
from sentence_buffer import SentenceBuffer     # prethird
from harness import build_chat_fn, build_say_fn, apply_persona_knobs
from store_recorder import StoreRecorder

log = logging.getLogger("lab-tuner.factory")

def _apply_source_override(sess, sk, src, renderer):
    """업로드 소스가 지정돼 있으면 렌더 소스·idle·필러를 교체하고 새 src 를 반환.

    지정이 없거나 해석 실패면 src 를 그대로 돌려준다(회귀 0).

    순서 근거: signaling 이 클론 idle mp4 를 먼저 물린 뒤(signaling.py:1359)
    pipeline_factory 를 부르므로(:1426) 여기서 덮으면 그게 최종값이 된다.
    """
    import source_lab

    meta = source_lab.resolve(getattr(sk, "render_source", "") or None)
    if meta is None:
        return src

    new_src = meta["source"]
    log.info("[source-override] id=%s kind=%s src=%s (클론 기본 %s 대체)",
             meta["id"], meta["kind"], new_src, src)

    if getattr(sk, "use_idle", True):
        idle = meta.get("idle")
        if idle:
            # 영상 업로드 → ffmpeg 정규화본(25fps·상한 적용)을 idle 루프로.
            sess.video_track.set_idle_video(idle)
            sess.idle_video_applied = True
            log.info("[source-override] idle 교체: %s", idle)
        elif renderer is not None:
            # 사진 업로드(또는 idle 생성 실패) → 정지 프레임 대신 prebake(무음 렌더) 재사용.
            # 렌더 소스는 항상 이미지라(source_lab.build_face) 그대로 넘길 수 있다.
            # 실패해도 통화는 계속돼야 하므로 예외를 삼킨다.
            try:
                from idle_prebake import start_prebake   # prethird
                start_prebake(renderer, new_src, sess.video_track)
                log.info("[source-override] 사진 업로드 → idle prebake 시작")
            except Exception as exc:
                log.warning("[source-override] idle prebake 실패(클론 idle 유지): %s", exc)

    if getattr(sk, "mute_filler", True) and getattr(sess, "filler_player", None) is not None:
        # 클론 필러 영상은 클론 얼굴이라 업로드 얼굴과 섞이면 화면이 튄다.
        sess.filler_player = None
        log.info("[source-override] 클론 필러 비활성(다른 얼굴 노출 차단)")

    return new_src

def build_knobs_pipeline_factory(registry, renderer, guard=None, store=None,
                                 metrics=None):
    """공유 라이브 렌더(renderer=KnobsFifthInproc, render_url=:8810)와 registry로
    세션별 DialoguePipeline factory 생성.

    guard: LiveGuard | None — 지정 시 렌더 직전 assert_free()로 라이브 통화 중 렌더 차단.
    store: ArtifactStore | None — 지정 시 sess.recorder를 StoreRecorder(store)로 교체해
           /replay/* 가 실 데이터로 동작하게 한다(prethird 무수정, sess 속성만 교체).
           None(기본)이면 기존 recorder(prethird offer가 세팅한 것) 그대로 — 회귀 0.
    metrics: TurnMetrics | None — 지정 시 LLM/TTS/렌더 단계 소요를 수집해
           /metrics SSE 로 흘려보낸다. prethird 는 계측 콜백을 노출하지 않으므로
           랩이 이미 감싸고 있는 chat/say/infer 래퍼에서 직접 잰다.
    """
    chat_fn = build_chat_fn(registry, metrics=metrics)
    say_fn = build_say_fn(registry, metrics=metrics)

    def factory(sess):
        if store is not None:
            sess.recorder = StoreRecorder(store)   # prethird offer가 세팅한 recorder 교체
        dk = registry.get().dialogue
        base_persona = getattr(sess, "persona_messages", None) or []
        persona = apply_persona_knobs(base_persona, dk)
        # source: 정면사진(face_path) 우선, 없으면 video_path (fifth 전용)
        src = getattr(sess, "face_path", None) or getattr(sess, "video_path", None)
        # 업로드 소스 override — 목소리(se_path)·페르소나는 클론 것을 그대로 두고
        # 렌더 소스만 교체한다. resolve() 는 fail-open(없으면 None → 클론 기본).
        src = _apply_source_override(sess, registry.get().source, src, renderer)

        def _infer_fn(wav, cb, _src=src):
            if guard is not None:
                guard.assert_free()   # 라이브 통화 중이면 LiveBusyError → say 실패 처리
            if metrics is None:
                return renderer.infer(wav, cb, video_path=_src)
            _t0 = time.perf_counter()
            out = renderer.infer(wav, cb, video_path=_src)
            metrics.record("render", (time.perf_counter() - _t0) * 1000)
            return out

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
            # prethird 는 턴 진입마다(say/greet) _sb_factory 를 부른다
            # (pipeline.py:236,318) — 랩이 턴 경계를 알 수 있는 유일한 지점이라
            # 여기서 계측을 리셋한다.
            if metrics is not None:
                metrics.start_turn()
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
            # first_min_len 은 첫 소리까지 걸리는 시간에 직결돼 별도 노브로 뺐다.
            # min_len 을 따라가던 위 규약보다 나중에 적용해 명시값이 이긴다.
            fml = getattr(_dk, "first_min_len", None)
            if fml is not None:
                sb.first_min_len = int(fml)
            return sb

        pipe._sb_factory = _sb_factory
        return pipe

    return factory
