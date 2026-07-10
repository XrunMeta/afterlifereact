"""fifth 렌더 코어 — 통화 startup 1회 소스 준비 + 문장별 wav→프레임 스트림.

render_offline.py(오프라인 mp4 도구)의 검증된 렌더 로직을 실시간 콜백형으로
이식한다. 엔진/JoyVASA 는 인자로 주입받아 startup 1회 init 을 호출자가 책임진다.
"""
from __future__ import annotations

import math
import os
from typing import Callable

import numpy as np
import soundfile as sf

from audio2lip import compute_rms_envelope, rms_to_cdlip
from phase_token import PhaseToken


def _tok_passthrough(tok: PhaseToken) -> PhaseToken:
    """출력 프레임 0장(count==0) — 위상 불진전 토큰 반환.

    len(y)==0 early-return 과 render 전부 None(count==0) 경계에서 동일 로직을 공유한다.
    "프레임을 한 장도 내지 않은 청크는 위상을 진전시키지 않는다."
    """
    return PhaseToken(
        frame_offset=tok.frame_offset,
        blink_phase=tok.blink_phase,
        first_frame=tok.first_frame,  # 입력 tok 그대로 패스스루
        head_last=tok.head_last,
    )


def _serialize_head_last(ml: list, nj: int) -> list | None:
    """청크 마지막 head pose (R, t) → [R_list, t_list] 직렬화.

    §6 head-carryover: 다음 청크의 슬루 보간을 위해 PhaseToken.head_last 에 저장한다.
    슬루 전 원본 ml[nj-1] 을 직렬화해야 하므로 _apply_head_slew 호출 전에 실행한다.

    Args:
        ml: JoyVASA motion list. ml[i]["R"]: (1,3,3), ml[i]["t"]: (1,3).
        nj: ml 유효 프레임 수.
    Returns:
        [R_list, t_list] (직렬화 성공) 또는 None (빈 시퀀스 / 직렬화 실패).
        R_list: 3×3 nested list (float).
        t_list: 3-element list (float).
    """
    if not ml or nj == 0:
        return None
    try:
        last = ml[min(nj - 1, len(ml) - 1)]
        R_list = np.asarray(last["R"]).reshape(3, 3).tolist()
        t_list = np.asarray(last["t"]).reshape(3).tolist()
        return [R_list, t_list]
    except Exception:
        return None


def _apply_idle_suppression(
    ml: list,
    env: np.ndarray,
    nj: int,
    idle_scale: float,
    rms_low: float,
    rms_high: float,
) -> None:
    """RMS 연속 스케일로 무음 구간 head(R·t)·표정(exp) 모션 억제 (in-place).

    §7 idle motion suppression: 무음일수록 ml을 ml[0](neutral, source 근접)으로 감쇠.
    발화 구간(rms >= rms_high)은 ml 원본 유지 → 입싱크/head 영향 없음.

    c_eyes(blink)는 ml 밖의 ce 배열 → 절대 영향 없음.
    c_d_lip(입)은 env→rms_to_cdlip 경로 → 절대 영향 없음.

    감쇠식:
        w = clamp((rms - rms_low) / (rms_high - rms_low), 0, 1)  # 0=무음, 1=발화
        idle_w = idle_scale + (1 - idle_scale) * w               # [idle_scale, 1.0]
        ml[i][R] = lerp(ml[0][R], ml[i][R], idle_w)
        (R, t, exp 동일)

    회귀 안전: idle_scale=1.0 → idle_w=1.0 → ml 원본 유지 (no-op).

    Args:
        ml: JoyVASA motion list (ml[i] = {"R": (1,3,3), "t": (1,3), "exp": (1,21,3), ...}).
        env: RMS 프레임 엔벨로프 (0~1 범위, len=렌더 프레임 수).
        nj: ml 유효 프레임 수.
        idle_scale: 무음 구간 최소 모션 가중치 (0.0=완전 고정, 1.0=억제 없음/회귀).
        rms_low:  이 RMS 미만 → idle_scale 적용.
        rms_high: 이 RMS 초과 → 억제 없음(idle_w=1.0).
    """
    if not ml or nj == 0 or idle_scale >= 1.0 - 1e-6:
        return  # 회귀 안전: idle_scale=1.0 또는 빈 ml → no-op

    # neutral 기준: ml[0] (첫 프레임, source 근접 pose)
    # flag_relative_motion=False(절대 pose) 환경에서 ml[0]은 source head와 가장 가까움.
    n0 = ml[0]
    n0_R = np.asarray(n0["R"]).astype(np.float32)    # (1,3,3)
    n0_t = np.asarray(n0["t"]).astype(np.float32)    # (1,3)
    n0_e = np.asarray(n0["exp"]).astype(np.float32)  # (1,21,3)

    rng = max(float(rms_high) - float(rms_low), 1e-6)
    n_env = len(env)

    for i in range(nj):
        rms_i = float(env[min(i, n_env - 1)]) if n_env > 0 else 1.0
        # w: 0=무음(완전억제), 1=발화(억제없음)
        w = float(np.clip((rms_i - rms_low) / rng, 0.0, 1.0))
        # idle_w: [idle_scale, 1.0]
        idle_w = idle_scale + (1.0 - idle_scale) * w

        if idle_w >= 1.0 - 1e-6:
            continue  # 발화 구간 → ml 원본 유지

        m_orig = ml[i]
        m_new = dict(m_orig)  # shallow copy: R/t/exp 만 교체, 다른 키 참조 유지

        R_o = np.asarray(m_orig["R"]).astype(np.float32)
        t_o = np.asarray(m_orig["t"]).astype(np.float32)
        e_o = np.asarray(m_orig["exp"]).astype(np.float32)

        # 선형 보간: (1-idle_w)*neutral + idle_w*orig
        m_new["R"]   = ((1.0 - idle_w) * n0_R + idle_w * R_o).astype(np.float32)
        m_new["t"]   = ((1.0 - idle_w) * n0_t + idle_w * t_o).astype(np.float32)
        m_new["exp"] = ((1.0 - idle_w) * n0_e + idle_w * e_o).astype(np.float32)

        ml[i] = m_new


def _apply_head_slew(ml: list, nj: int, head_last: list, slew_k: int) -> None:
    """ml 처음 min(slew_k, nj) 프레임의 R·t를 head_last → 원본 선형보간(in-place).

    §6 head-carryover slew: 청크 경계 head 점프(boundary_head_jump_px)를 완화한다.
    head 성분(R, t)만 보간. c_d_lip(입), c_eyes(눈/blink), exp(표정) 등은 unchanged.
    입싱크·눈깜빡 타이밍에 영향 없음.

    보간식: R_new[i] = (1 - alpha) * R_last + alpha * R_orig
             alpha = i / slew_k  (i=0 → 0%신규, i=slew_k-1 → (K-1)/K 신규)

    Args:
        ml: JoyVASA motion list. 첫 k_actual 원소를 shallow-copy 후 R·t 교체.
        nj: ml 유효 프레임 수.
        head_last: [R_list, t_list] 이전 청크 마지막 head pose.
            R_list: 3×3 nested list, t_list: 3-element list.
        slew_k: 보간 구간 프레임 수. 0이면 호출하지 말 것.
    """
    head_R_last = np.array(head_last[0], dtype=np.float32).reshape(1, 3, 3)
    head_t_last = np.array(head_last[1], dtype=np.float32).reshape(1, 3)
    k_actual = min(slew_k, nj)
    for i in range(k_actual):
        alpha = float(i) / slew_k
        m_orig = ml[i]
        m_new = dict(m_orig)   # shallow copy: R·t 만 교체, exp 등 참조 유지
        m_new["R"] = ((1 - alpha) * head_R_last
                      + alpha * np.asarray(m_orig["R"])).astype(np.float32)
        m_new["t"] = ((1 - alpha) * head_t_last
                      + alpha * np.asarray(m_orig["t"])).astype(np.float32)
        ml[i] = m_new


def _apply_head_sway(ml: list, nj: int, amp: float, phase_offset: int = 0) -> None:
    """절차적 머리 흔들림 — ml[i]["R"]에 저주파 yaw/pitch 회전 주입(in-place).

    T-120: 오디오·라이브와 무관, 프레임 인덱스 기반 결정론. 무음/lip_lock 필러에서
    자연스러운 머리 움직임을 만든다. amp<=0 또는 nj<=0이면 no-op(회귀 0).
    램프인/아웃(앞뒤 RAMP 프레임)으로 경계 튐을 방지한다. amp 1에서 yaw ±10°, pitch ±6°.
    """
    if not amp or amp <= 0 or nj <= 0:
        return
    max_yaw = math.radians(10.0) * float(amp)
    max_pitch = math.radians(6.0) * float(amp)
    yaw_period, pitch_period = 80.0, 110.0   # frames (~3.2s/4.4s @ 25fps)
    ramp = min(12, nj)
    for i in range(nj):
        t = i + phase_offset
        yaw = max_yaw * math.sin(2.0 * math.pi * t / yaw_period)
        pitch = max_pitch * math.sin(2.0 * math.pi * t / pitch_period + 1.3)
        r = min(i + 1, nj - i, ramp) / ramp   # 0→1→0 램프
        yaw *= r
        pitch *= r
        cy, sy = math.cos(yaw), math.sin(yaw)
        cp, sp = math.cos(pitch), math.sin(pitch)
        r_yaw = np.array([[cy, 0.0, sy], [0.0, 1.0, 0.0], [-sy, 0.0, cy]], dtype=np.float32)
        r_pitch = np.array([[1.0, 0.0, 0.0], [0.0, cp, -sp], [0.0, sp, cp]], dtype=np.float32)
        r_sway = (r_pitch @ r_yaw).astype(np.float32)
        m_new = dict(ml[i])
        r_o = np.asarray(m_new["R"]).astype(np.float32)   # (1,3,3)
        m_new["R"] = (r_sway @ r_o[0])[None].astype(np.float32)
        ml[i] = m_new


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
    phase_token: PhaseToken | None = None,
    idle_motion_scale: float | None = None,
    idle_rms_low: float | None = None,
    idle_rms_high: float | None = None,
    head_slew_frames: int | None = None,
    lip_lock: bool | None = None,
    head_sway_amp: float | None = None,
    eyes_open_lock: bool | None = None,
    source_face_lock: bool | None = None,
) -> tuple[int, PhaseToken]:
    """wav 한 문장 → 프레임 생성마다 on_frame(rgb) 호출. 반환: (프레임 수, 끝 위상 토큰).

    sources["mode"] == "single": open_s 만 렌더.
    sources["mode"] == "blend":  open_s + closed_s 입마스크 블렌드.

    phase_token=None(기본) 시 PhaseToken() 기본값을 사용해 기존 stateless 렌더와
    100% 동일 경로를 보장한다(회귀 불변식).

    T-109 lab-tuner: idle_motion_scale/idle_rms_low/idle_rms_high/head_slew_frames
    인자 우선, None(기본, 미지정)이면 기존 env(FIFTH_IDLE_MOTION_SCALE 등) 사용
    → 인자 미지정 시 기존 동작 100% 동일(회귀 0).

    T-120 필러 표정: lip_lock/head_sway_amp/eyes_open_lock/source_face_lock 은 모두
    None(기본)이면 no-op — 기존 동작과 100% 동일(회귀 0). lip_lock=True 시 c_d_lip 를
    cfg.lip_closed 로 고정, head_sway_amp>0 시 절차적 머리 흔들림 주입,
    eyes_open_lock=True 시 c_eyes 를 열림값으로 고정(JoyVASA 네이티브 c_eyes_lst와
    합성 blink 모두 무시). source_face_lock=True 시 exp 를 소스(원본 사진) exp로,
    c_d_lip 를 소스 lip_close_ratio 로 고정 — 입이 오디오와 무관하게 원본 사진
    그대로 유지된다(lip_lock의 c_d_lip 강제 닫힘보다 강함; exp 자체를 잠근다).
    """
    from base_source import base_blend_weight

    # 회귀 불변식: None → 기본값 토큰 = 기존 stateless 동작과 동일
    tok = phase_token or PhaseToken()

    y, sr = _load_wav_16k(wav_path)
    if len(y) == 0:
        # 출력 프레임 0장 — 위상 불진전(_tok_passthrough 공통 로직)
        return 0, _tok_passthrough(tok)

    env = compute_rms_envelope(
        y, sr=sr, fps=cfg.fps, sigma=cfg.sigma,
        silence=cfg.silence, gamma=cfg.gamma,
    )

    dri = jp.gen_motion_sequence(wav_path)
    ml = dri["motion"]
    ce_raw = dri.get("c_eyes_lst", [])
    nj = dri["n_frames"]

    # §6 head-carryover: 슬루 보간 (head_last → 현재 head motion 선형전환)
    # 회귀 안전: head_last=None(첫 청크) 또는 FIFTH_HEAD_SLEW_FRAMES=0 → 보간 없음.
    # phase_token=None(통화 회귀) → tok=PhaseToken(head_last=None) → 보간 없음.
    # T-109: 인자 우선, None(미지정)이면 기존 env 재독 → 회귀 0.
    _slew_k = head_slew_frames if head_slew_frames is not None \
        else int(os.environ.get("FIFTH_HEAD_SLEW_FRAMES", "5"))
    if tok.head_last is not None and _slew_k > 0 and nj > 0:
        _apply_head_slew(ml, nj, tok.head_last, _slew_k)

    # §7 idle motion suppression: 무음 구간 head(R·t)·표정(exp) 감쇠
    # c_eyes(blink)는 ce 배열 / c_d_lip(입)은 cdl 배열 → 둘 다 ml 밖 → 절대 영향 없음.
    # 회귀 안전: FIFTH_IDLE_MOTION_SCALE=1.0 (기본 off=1.0 아님=0.15 적용 주의) → no-op.
    # T-109: 인자 우선, None(미지정)이면 기존 env 재독 → 회귀 0.
    _idle_scale = idle_motion_scale if idle_motion_scale is not None \
        else float(os.environ.get("FIFTH_IDLE_MOTION_SCALE", "0.15"))
    _rms_low = idle_rms_low if idle_rms_low is not None \
        else float(os.environ.get("FIFTH_IDLE_RMS_LOW", "0.05"))
    _rms_high = idle_rms_high if idle_rms_high is not None \
        else float(os.environ.get("FIFTH_IDLE_RMS_HIGH", "0.3"))
    _apply_idle_suppression(ml, env, nj, _idle_scale, _rms_low, _rms_high)

    # T-120: 절차적 머리 흔들림(필러 전용). None/0이면 no-op(회귀 0).
    if head_sway_amp is not None:
        _apply_head_sway(ml, nj, float(head_sway_amp), phase_offset=tok.blink_phase)

    # T-120: source_face_lock — exp를 소스(원본 사진) exp로 고정(오디오·JoyVASA 무관).
    # head_sway는 R만 건드리므로 순서는 무관하나, exp 최종 확정을 위해 head_sway 뒤에 적용.
    if source_face_lock:
        src_exp = np.asarray(sources["open_s"]["src_info"][0][0]["exp"]).astype(np.float32)
        for i in range(nj):
            m = dict(ml[i])
            m["exp"] = src_exp.copy()
            ml[i] = m

    # §6+§7 후 실제 시각 상태를 head_last 로 직렬화 (다음 청크 slew 출발점).
    # 슬루는 첫 K 프레임만 수정 → 마지막 프레임(nj-1)은 idle 억제만 반영.
    # head_last가 실제 렌더된 마지막 head pose를 가리켜야 다음 청크 slew가 자연스럽게 연결됨.
    _head_last_new = _serialize_head_last(ml, nj)

    # render_offline.py L443/L647 과 동일 계약:
    # env(RMS 프레임 수)와 nj(JoyVASA n_frames)는 독립 계산이라 다를 수 있다.
    # env > nj일 때 n=nj로 자르면 오디오 후미 입싱크가 렌더 안 됨 → max 로 보장.
    # 루프 내 ji = min(i, nj-1) 클램프로 motion 인덱스 안전.
    n = max(len(env), nj)

    if eyes_open_lock:
        # T-120: 눈 강제 오픈 — 네이티브 ce_raw·합성 blink 모두 무시(エル BLOCKER 해소).
        # avg_interval_sec을 매우 크게 → blink_starts 가 생기지 않아 전프레임 오픈.
        from render_offline import make_blink_sequence
        eye_open = _eye_open_ratio(sources["open_s"])
        ce = make_blink_sequence(
            n, cfg.fps, eye_open, 0.0,
            phase_offset=0, avg_interval_sec=1e9, blink_dur_frames=6,
        )
    else:
        ce = ce_raw if ce_raw else None
        if not ce_raw and blink_enabled:
            from render_offline import make_blink_sequence
            eye_open = _eye_open_ratio(sources["open_s"])
            ce = make_blink_sequence(
                n, cfg.fps, eye_open, 0.0,
                phase_offset=tok.blink_phase,
                avg_interval_sec=3.2, blink_dur_frames=6,
            )

    if sources["mode"] == "single":
        count = _stream_single(eng, cfg, sources["open_s"], env, ml, ce, nj, n, on_frame, tok,
                                lip_lock=bool(lip_lock), source_face_lock=bool(source_face_lock))
    else:
        count = _stream_blend(eng, cfg, sources, env, ml, ce, nj, n, on_frame, base_blend_weight, tok,
                               lip_lock=bool(lip_lock), source_face_lock=bool(source_face_lock))

    if count == 0:
        # wav 는 있으나 eng.render() 가 전부 None → 출력 0장 → 위상 불진전.
        # len(y)==0 early-return 과 동일 의미론(_tok_passthrough 공통 로직).
        end_tok = _tok_passthrough(tok)
    else:
        # count > 0: 부분 출력이라도 시간이 흘렀으므로 위상 진전.
        # C-2: blink_phase 는 시간축(n) 기준 누적. count(출력 프레임 수)가 아닌 n(blink 타임라인
        # 길이)을 사용해야 엔진 render() 가 None 을 일부 반환해 count < n 이 되더라도
        # 다음 청크의 blink 타임라인이 앞당겨지지 않는다.
        end_tok = PhaseToken(
            frame_offset=tok.frame_offset + count,
            blink_phase=tok.blink_phase + n,
            first_frame=False,
            head_last=_head_last_new,    # §6: 원본 ml[-1] head pose 직렬화 저장
        )
    return count, end_tok


def _eye_open_ratio(src_d: dict) -> float:
    try:
        from src.utils.utils import calc_eye_close_ratio as _cecr
        lmk = src_d["src_info"][0][1]
        r = _cecr(lmk[None])
        return float((r[0, 0] + r[0, 1]) / 2.0)
    except Exception:
        return 0.37


def _stream_single(eng, cfg, open_s, env, ml, ce, nj, n, on_frame, tok: PhaseToken,
                    lip_lock: bool = False, source_face_lock: bool = False) -> int:
    """단일 소스(open_s만) 렌더 루프. render_offline.py L653~668 이식.

    T-120: lip_lock=True 시 c_d_lip 전체를 cfg.lip_closed 로 고정(오디오 무관).
    source_face_lock=True 시 c_d_lip 전체를 open_s["lip_close_ratio"](소스 원본 입
    비율)로 고정 — exp 잠금(stream_wav_frames)과 짝을 이뤄 원본 사진 입을 그대로
    유지한다. lip_lock 보다 우선(source_face_lock이 exp까지 잠그는 상위 개념).
    """
    lip_closed = cfg.lip_closed
    if source_face_lock:
        cdl = np.full(max(n, 1), float(open_s["lip_close_ratio"]), dtype=np.float32)
    elif lip_lock:
        cdl = np.full(max(n, 1), lip_closed, dtype=np.float32)
    else:
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
        # Task 1: first_frame 은 tok.first_frame 기반.
        # phase_token=None(기본) → tok=PhaseToken() → tok.first_frame=True →
        # 첫 프레임만 True = 기존 동작과 동일 (회귀 불변식).
        # Task 3에서 두 번째 청크는 tok.first_frame=False 로 전달돼 stitching 연속.
        # T-074: src_img/src_info 명시 전달 — engine.self.src_img(직전 load_source) 잔존으로
        # 인한 클론간 영상 누수 방지. _sources_cache HIT 시 load_source 가 스킵돼도
        # 올바른 클론 source 로 렌더(_stream_blend 와 동일 패턴).
        frame = eng.render(
            ml[ji], _ce_i, c, first_frame=(i == 0 and tok.first_frame),
            src_img=open_s["src_img"], src_info=open_s["src_info"],
        )
        if frame is not None:
            on_frame(np.ascontiguousarray(frame))
            count += 1
    return count


def _stream_blend(eng, cfg, sources, env, ml, ce, nj, n, on_frame, base_blend_weight, tok: PhaseToken,
                   lip_lock: bool = False, source_face_lock: bool = False) -> int:
    """입마스크 블렌드 렌더 루프. render_offline.py L500~556 (blend_region="mouth") 이식.

    T-120: lip_lock=True 시 cdl_o/cdl_c 를 각각 lc_open/lc_closed 로 고정(오디오 무관).
    주의(エル 게이트): blend 모드의 lip_lock은 cfg.lip_closed 완전닫힘이 아니라
    source 의 lip_close_ratio 기준값 — 완전 닫힘이 보장되지 않을 수 있다. 필러는
    항상 single 모드로만 렌더되므로 이 경로는 실질적으로 도달하지 않는다(무해).

    source_face_lock=True 시 cdl_o/cdl_c 를 각각 open_s/closed_s 의 원본
    lip_close_ratio(비클램프)로 고정 — exp 잠금과 동일 개념. 필러는 항상 single
    모드이므로 이 분기도 실질적으로 도달하지 않는다(무해, single 우선 구현).
    """
    open_s = sources["open_s"]
    closed_s = sources["closed_s"]
    M = sources["mouth_mask"]

    def _clamp(dyn: float) -> float:
        return min(dyn, cfg.lip_open * 0.85) if dyn > 0.0 else cfg.lip_closed

    lc_open = _clamp(open_s["lip_close_ratio"])
    lc_closed = _clamp(closed_s["lip_close_ratio"])

    if source_face_lock:
        cdl_o = np.full(max(n, 1), float(open_s["lip_close_ratio"]), dtype=np.float32)
        cdl_c = np.full(max(n, 1), float(closed_s["lip_close_ratio"]), dtype=np.float32)
    elif lip_lock:
        cdl_o = np.full(max(n, 1), lc_open, dtype=np.float32)
        cdl_c = np.full(max(n, 1), lc_closed, dtype=np.float32)
    else:
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

    # Task 1: first_frame 은 tok.first_frame 기반.
    # phase_token=None(기본) → tok=PhaseToken() → tok.first_frame=True = 기존 동작.
    # Task 3에서 두 번째 청크는 tok.first_frame=False.
    open_first = tok.first_frame
    closed_first = tok.first_frame
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
        # render_offline.py L522 와 동일 구조: 렌더 게이트는 w만 체크.
        # M=None 처리는 합성 단계(frame_closed is not None and M is not None)에서.
        frame_closed = None
        if w < 1.0 - 1e-4:
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
