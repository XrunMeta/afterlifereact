from __future__ import annotations
import logging
import os
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
                import tempfile
                from idle_prebake import start_prebake   # prethird
                # 🔴 wav_dir 을 반드시 넘긴다. start_prebake 기본값은 "/tmp" 인데 fifth 는
                # 컨테이너라 호스트 /tmp 를 못 본다 — 2026-08-18 실측에서 배선은 살아 있는데
                # 렌더가 400("wav_path 미존재: /tmp/fifth_idle_silent_….wav")으로 죽어
                # 사진 업로드 idle 이 조용히 클론 얼굴로 남았다(T-088 과 같은 함정).
                # 랩 기동 env 의 TMPDIR 이 공유마운트 하위를 가리킨다(_remote_lab_deploy.sh).
                #
                # gettempdir() 이 아니라 env 를 먼저 읽는 이유: gettempdir() 은 첫 호출값을
                # 모듈에 캐시해 이후 TMPDIR 변경을 반영하지 않는다.
                wav_dir = os.environ.get("TMPDIR") or tempfile.gettempdir()
                if wav_dir.rstrip("/") in ("/tmp", "/var/tmp"):
                    # 여기로 떨어지면 렌더가 400 으로 죽고 idle 은 클론 얼굴로 남는다.
                    # 조용히 실패하지 않도록 원인을 미리 말해 둔다.
                    log.warning("[source-override] TMPDIR 이 공유마운트가 아니다(%s) — "
                                "fifth 가 못 읽어 idle prebake 가 실패한다. 랩 기동 env 확인",
                                wav_dir)
                start_prebake(renderer, new_src, sess.video_track, wav_dir=wav_dir)
                log.info("[source-override] 사진 업로드 → idle prebake 시작 (wav_dir=%s)",
                         wav_dir)
            except Exception as exc:
                log.warning("[source-override] idle prebake 실패(클론 idle 유지): %s", exc)

    if getattr(sk, "mute_filler", True) and getattr(sess, "filler_player", None) is not None:
        # 클론 필러 영상은 클론 얼굴이라 업로드 얼굴과 섞이면 화면이 튄다.
        sess.filler_player = None
        log.info("[source-override] 클론 필러 비활성(다른 얼굴 노출 차단)")

    return new_src

def _apply_voice_override(sk, se_path):
    """업로드 음성이 지정돼 있으면 se_path 를 교체하고 새 값을 반환.

    지정이 없거나 해석 실패면 se_path 를 그대로 돌려준다(회귀 0).

    얼굴 override 와 달리 sess 를 건드리지 않는다 — TTS 는 요청 body 의 se_path 만
    보고 참조 음성을 고르므로(harness.build_say_fn), 값 하나를 바꾸면 끝이다.
    """
    import voice_lab

    meta = voice_lab.resolve(getattr(sk, "voice_source", "") or None)
    if meta is None:
        return se_path

    new_se = meta.get("se_path") or voice_lab.se_path_for(meta["id"])
    log.info("[voice-override] id=%s se_path=%s (클론 기본 %s 대체) pair=%s",
             meta["id"], new_se, se_path, meta.get("prompt_pair"))
    if not meta.get("prompt_pair"):
        # 짧은 프롬프트 쌍이 없으면 긴 voice.wav 로 폴백한다 — 짧은 발화에서
        # CosyVoice 가 폭주할 수 있다(2026-08-13 실측). 통화는 되므로 막지는 않는다.
        log.warning("[voice-override] 짧은 프롬프트 쌍 없음 — 짧은 발화 폭주 가능")
    return new_se

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
        sk = registry.get().source
        src = _apply_source_override(sess, sk, src, renderer)
        # 목소리 override — 얼굴·페르소나와 독립이다(둘 중 하나만 올려도 된다).
        se_path = _apply_voice_override(sk, getattr(sess, "se_path", None))

        def _infer_fn(wav, cb, *args, _src=src, **kwargs):
            """prethird → 렌더러. 추가 인자는 **그대로 포워딩**한다.

            🔴 batch 경로는 infer_fn(wp, cb, render_mode="batch") 로 부른다
            (prethird pipeline.py:381,592). 이 래퍼가 키워드를 삼키면 매 턴
            TypeError 로 죽어 "fifth 렌더 무기한 대기"로 보인다(2026-08-18 실측).
            partial 경로는 그 인자를 안 넘겨서 드러나지 않았다 — 랩이 상위
            시그니처를 따라가지 못한 드리프트이므로, 개별 인자를 나열하지 않고
            통째로 넘겨 다음 변화에도 견디게 한다(_build_body 와 같은 원칙).

            video_path 만은 랩이 최종 결정한다 — 업로드 소스 override 가 호출자
            값에 덮이면 안 된다.
            """
            if guard is not None:
                guard.assert_free()   # 라이브 통화 중이면 LiveBusyError → say 실패 처리
            kwargs["video_path"] = _src
            if metrics is None:
                return renderer.infer(wav, cb, *args, **kwargs)
            _t0 = time.perf_counter()
            out = renderer.infer(wav, cb, *args, **kwargs)
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
            se_path=se_path,
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
