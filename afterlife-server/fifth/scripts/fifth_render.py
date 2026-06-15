"""fifth 렌더 코어 — 통화 startup 1회 소스 준비 + 문장별 wav→프레임 스트림.

render_offline.py(오프라인 mp4 도구)의 검증된 렌더 로직을 실시간 콜백형으로
이식한다. 엔진/JoyVASA 는 인자로 주입받아 startup 1회 init 을 호출자가 책임진다.
"""
from __future__ import annotations

from typing import Callable

import numpy as np
import soundfile as sf

from audio2lip import compute_rms_envelope, rms_to_cdlip


def _load_wav_16k(wav_path: str):
    y, sr = sf.read(wav_path, dtype="float32")
    if y.ndim > 1:
        y = y.mean(axis=1)
    if sr != 16000:
        import torch
        import torchaudio
        y = torchaudio.functional.resample(torch.from_numpy(y), sr, 16000).numpy()
        sr = 16000
    return y, sr


def stream_wav_frames(
    eng,
    jp,
    cfg,
    sources: dict,
    wav_path: str,
    on_frame: Callable[[np.ndarray], None],
    blink_enabled: bool = True,
) -> int:
    """wav 한 문장 → 프레임 생성마다 on_frame(rgb) 호출. 반환: 프레임 수.

    sources["mode"] == "single": open_s 만 렌더.
    sources["mode"] == "blend":  open_s + closed_s 입마스크 블렌드.
    """
    from base_source import base_blend_weight

    y, sr = _load_wav_16k(wav_path)
    if len(y) == 0:
        return 0

    env = compute_rms_envelope(
        y, sr=sr, fps=cfg.fps, sigma=cfg.sigma,
        silence=cfg.silence, gamma=cfg.gamma,
    )

    dri = jp.gen_motion_sequence(wav_path)
    ml = dri["motion"]
    ce_raw = dri.get("c_eyes_lst", [])
    nj = dri["n_frames"]
    # JoyVASA 가 wav를 직접 처리해 n_frames를 확정하므로 nj를 기준으로 삼는다.
    # env 는 nj보다 길어질 수 있지만 인덱스 클램프로 처리된다.
    n = nj

    ce = ce_raw if ce_raw else None
    if not ce_raw and blink_enabled:
        from render_offline import make_blink_sequence
        eye_open = _eye_open_ratio(sources["open_s"])
        ce = make_blink_sequence(
            n, cfg.fps, eye_open, 0.0,
            avg_interval_sec=3.2, blink_dur_frames=6,
        )

    if sources["mode"] == "single":
        return _stream_single(eng, cfg, sources["open_s"], env, ml, ce, nj, n, on_frame)
    return _stream_blend(eng, cfg, sources, env, ml, ce, nj, n, on_frame, base_blend_weight)


def _eye_open_ratio(src_d: dict) -> float:
    try:
        from src.utils.utils import calc_eye_close_ratio as _cecr
        lmk = src_d["src_info"][0][1]
        r = _cecr(lmk[None])
        return float((r[0, 0] + r[0, 1]) / 2.0)
    except Exception:
        return 0.37


def _stream_single(eng, cfg, open_s, env, ml, ce, nj, n, on_frame) -> int:
    """단일 소스(open_s만) 렌더 루프. render_offline.py L653~668 이식."""
    lip_closed = cfg.lip_closed
    cdl = rms_to_cdlip(
        env,
        lip_closed=lip_closed,
        lip_open=cfg.lip_open,
        open_scale=cfg.open_scale,
        offset=cfg.offset,
    )
    count = 0
    for i in range(n):
        ji = min(i, nj - 1)
        c = float(cdl[min(i, len(cdl) - 1)]) if len(cdl) else lip_closed
        _ce_i = ce[min(i, len(ce) - 1)] if ce else None
        frame = eng.render(ml[ji], _ce_i, c, first_frame=(i == 0))
        if frame is not None:
            on_frame(np.ascontiguousarray(frame))
            count += 1
    return count


def _stream_blend(eng, cfg, sources, env, ml, ce, nj, n, on_frame, base_blend_weight) -> int:
    """입마스크 블렌드 렌더 루프. render_offline.py L500~556 (blend_region="mouth") 이식."""
    open_s = sources["open_s"]
    closed_s = sources["closed_s"]
    M = sources["mouth_mask"]

    def _clamp(dyn: float) -> float:
        return min(dyn, cfg.lip_open * 0.85) if dyn > 0.0 else cfg.lip_closed

    lc_open = _clamp(open_s["lip_close_ratio"])
    lc_closed = _clamp(closed_s["lip_close_ratio"])

    cdl_o = rms_to_cdlip(
        env, lip_closed=lc_open, lip_open=cfg.lip_open,
        open_scale=cfg.open_scale, offset=cfg.offset,
    )
    cdl_c = rms_to_cdlip(
        env, lip_closed=lc_closed, lip_open=cfg.lip_open,
        open_scale=cfg.open_scale, offset=cfg.offset,
    )

    w_seq = np.array(
        [base_blend_weight(float(env[min(i, len(env) - 1)]), cfg.closed_thresh, cfg.open_thresh)
         for i in range(n)],
        dtype=np.float32,
    )

    open_first = True
    closed_first = True
    count = 0

    for i in range(n):
        ji = min(i, nj - 1)
        co = float(cdl_o[min(i, len(cdl_o) - 1)])
        cc = float(cdl_c[min(i, len(cdl_c) - 1)])
        w = float(w_seq[i])
        _ce_i = ce[min(i, len(ce) - 1)] if ce else None

        # open_src: 항상 렌더 (얼굴/배경 기반)
        frame_open = eng.render(
            ml[ji], _ce_i, co,
            first_frame=open_first,
            src_img=open_s["src_img"],
            src_info=open_s["src_info"],
        )
        open_first = False

        # closed_src: w < 1.0 일 때만 (완전 발화면 입도 open_src)
        frame_closed = None
        if w < 1.0 - 1e-4 and M is not None:
            frame_closed = eng.render(
                ml[ji], _ce_i, cc,
                first_frame=closed_first,
                src_img=closed_s["src_img"],
                src_info=closed_s["src_info"],
            )
            closed_first = False

        if frame_open is None:
            continue

        fo_f32 = frame_open.astype(np.float32)

        if frame_closed is not None and M is not None:
            # 입마스크 블렌드 공식 (render_offline.py L544~547):
            # alpha = M * (1 - w)   → 무음=M, 발화=0
            # out = frame_open*(1-alpha) + frame_closed*alpha
            fc_f32 = frame_closed.astype(np.float32)
            alpha = M * (1.0 - w)
            out_f32 = fo_f32 * (1.0 - alpha) + fc_f32 * alpha
            out_u8 = np.clip(out_f32, 0, 255).astype(np.uint8)
        else:
            # w≈1 (완전 발화) → 순수 open_src
            out_u8 = fo_f32.astype(np.uint8)

        on_frame(np.ascontiguousarray(out_u8))
        count += 1

    return count


def prepare_sources(eng, selection: dict) -> dict:
    """open/closed 이미지 경로 → 렌더용 source dict (startup 1회).

    Args:
        eng: FifthFLPEngine (load_source/align_source_to_ref/build_mouth_mask).
        selection: face_source.load_or_extract_sources 결과
            {"mode", "open_path", "closed_path"|None}.

    Returns:
        single: {"mode":"single", "open_s":...}
        blend:  {"mode":"blend", "open_s", "closed_s", "mouth_mask"}
    """
    open_s = eng.load_source(selection["open_path"])

    if selection["mode"] == "single" or not selection.get("closed_path"):
        return {"mode": "single", "open_s": open_s}

    closed_s = eng.load_source(selection["closed_path"])
    closed_s = eng.align_source_to_ref(target_s=closed_s, ref_s=open_s, mode="affine")

    mouth_mask = None
    try:
        open_lmk = open_s["src_info"][0][1]
        mouth_mask = eng.build_mouth_mask(open_lmk, img_size=512, dilate_px=28, feather_sigma=22)
    except Exception:
        mouth_mask = None

    return {
        "mode": "blend",
        "open_s": open_s,
        "closed_s": closed_s,
        "mouth_mask": mouth_mask,
    }
