"""fifth_render.py TDD 테스트.

실행법:
  cd afterlife-server/fifth
  PYTHONPATH=$PWD/scripts /Volumes/exDN/devExdn/afl-fifth/afterlife-server/fifth/.venv/bin/python \
    -m pytest scripts/tests/test_fifth_render.py -v
"""
import math
import numpy as np
import soundfile as sf
import pytest

from config import FifthConfig
from fifth_render import prepare_sources, stream_wav_frames


# ---------------------------------------------------------------------------
# Fake 객체
# ---------------------------------------------------------------------------

class _FakeEngine:
    def __init__(self):
        self.render_calls = 0
        self.last_src_img = "UNSET"
        self.last_src_info = "UNSET"

    def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
        self.render_calls += 1
        self.last_src_img = src_img
        self.last_src_info = src_info
        return np.full((512, 512, 3), 128, dtype=np.uint8)


class _FakeEngineMarked:
    """src_img 마커로 픽셀값 분기 — 블렌드 공식 검증용."""
    def __init__(self):
        self.render_calls = 0

    def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
        self.render_calls += 1
        val = 200 if src_img == "OPEN" else 100
        return np.full((512, 512, 3), val, dtype=np.uint8)


class _FakeJP:
    def __init__(self, n):
        self.n = n

    def gen_motion_sequence(self, wav_path):
        motion = [
            {
                "R": np.eye(3)[None].astype(np.float32),
                "t": np.zeros((1, 3), np.float32),
                "exp": np.zeros((1, 21, 3), np.float32),
            }
            for _ in range(self.n)
        ]
        return {"motion": motion, "c_eyes_lst": [], "n_frames": self.n}


def _write_wav(tmp_path, dur=0.5, sr=16000, silent=False):
    p = tmp_path / "s.wav"
    samples = int(sr * dur)
    if silent:
        y = np.zeros(samples, dtype=np.float32)
    else:
        y = (0.3 * np.sin(2 * np.pi * 200 * np.linspace(0, dur, samples))).astype(np.float32)
    sf.write(str(p), y, sr)
    return str(p)


def _env_len(dur: float, sr: int, fps: float) -> int:
    """audio2lip.compute_rms_envelope 과 동일한 프레임 수 계산."""
    return math.ceil(int(sr * dur) / (sr / fps))


# ---------------------------------------------------------------------------
# stream_wav_frames 테스트
# ---------------------------------------------------------------------------

def test_stream_single_mode_calls_on_frame_per_frame(tmp_path):
    """nj > env → n = nj (기존 케이스 유지)."""
    dur, sr, fps = 0.5, 16000, 25.0
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    env_n = _env_len(dur, sr, cfg.fps)  # ≈13 at fps=25
    nj = env_n + 4                       # nj > env → n = nj
    eng = _FakeEngine()
    sources = {
        "mode": "single",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
    }
    got = []
    n, _tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == len(got) == nj
    assert all(f.shape == (512, 512, 3) for f in got)


def test_stream_single_passes_open_src_to_render(tmp_path):
    """T-074 회귀: single 모드가 eng.render 에 src_img/src_info 를 명시 전달해야 한다.

    fifth_render_server._sources_cache HIT 시 prepare_sources(=eng.load_source)가
    스킵돼 engine.self.src_img 가 직전 통화 클론으로 잔존 → 클론간 영상 누수.
    single 렌더가 sources["open_s"] 의 src 를 명시 전달하면 잔존과 무관하게 올바른
    클론으로 렌더된다(_stream_blend 와 동일 패턴).
    """
    dur, sr, fps = 0.5, 16000, 25.0
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    nj = _env_len(dur, sr, cfg.fps) + 4
    eng = _FakeEngine()
    marker_img = object()
    marker_info = [[None, np.zeros((106, 2))]]
    sources = {
        "mode": "single",
        "open_s": {
            "src_img": marker_img,
            "src_info": marker_info,
            "lip_close_ratio": 0.0023,
        },
    }
    stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=lambda f: None,
        blink_enabled=False,
    )  # 반환값 무시 — src_img/src_info 전달 여부만 검증
    # 패치 전: src 미전달 → last_src_img is None (self.src_img 의존, 누수 경로)
    # 패치 후: open_s 의 src 가 그대로 전달돼야 한다.
    assert eng.last_src_img is marker_img
    assert eng.last_src_info is marker_info


def test_stream_blend_mode_renders_two_sources(tmp_path):
    """nj > env → n = nj (blend 케이스 유지)."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    env_n = _env_len(dur, sr, cfg.fps)
    nj = env_n + 4  # nj > env
    eng = _FakeEngine()
    sources = {
        "mode": "blend",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "closed_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "mouth_mask": np.ones((512, 512, 1), np.float32) * 0.5,
    }
    got = []
    n, _tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == len(got) == nj


# ---------------------------------------------------------------------------
# n = max(len(env), nj) 핵심 계약 테스트
# ---------------------------------------------------------------------------

def test_stream_uses_env_length_when_env_gt_nj(tmp_path):
    """env > nj 일 때 n = env 길이 → 오디오 후미 잘림 방지 회귀 테스트."""
    dur, sr = 1.0, 16000
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    env_n = _env_len(dur, sr, cfg.fps)  # fps=25 → ceil(16000/640) = 25
    nj = 3                               # 일부러 env보다 훨씬 작게
    assert env_n > nj, "테스트 전제: env_n > nj 여야 함"

    eng = _FakeEngine()
    sources = {
        "mode": "single",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
    }
    got = []
    n, _tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == len(got) == env_n, (
        f"env_n={env_n}, nj={nj} 인데 n={n} — env>nj일 때 n=env 여야 함"
    )


def test_stream_empty_wav_returns_zero(tmp_path):
    """0샘플 wav → stream_wav_frames 반환 0, on_frame 미호출."""
    p = tmp_path / "empty.wav"
    sf.write(str(p), np.zeros(0, dtype=np.float32), 16000)
    cfg = FifthConfig.from_env()
    eng = _FakeEngine()
    sources = {
        "mode": "single",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
    }
    got = []
    n, _tok = stream_wav_frames(
        eng, _FakeJP(12), cfg, sources, str(p),
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == 0
    assert got == []
    assert eng.render_calls == 0


def test_stream_blend_mask_none_falls_back_to_open(tmp_path):
    """mouth_mask=None 인 blend → 크래시 없이 open 단일로 흡수, 프레임 수 정상."""
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur, sr=sr)
    cfg = FifthConfig.from_env()
    env_n = _env_len(dur, sr, cfg.fps)
    nj = env_n + 2  # nj > env → n=nj
    eng = _FakeEngine()
    sources = {
        "mode": "blend",
        "open_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "closed_s": {
            "src_img": object(),
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "mouth_mask": None,  # 마스크 생성 실패 시나리오
    }
    got = []
    n, _tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n == len(got) == nj
    # 모든 프레임은 open 단일(값=128)이어야 함
    assert all(f.shape == (512, 512, 3) for f in got)


def test_stream_blend_pixel_formula(tmp_path):
    """블렌드 공식 alpha=M*(1-w), out=open*(1-alpha)+closed*alpha 정확성 검증.

    무음 wav(전부 0) → w=0 → alpha=M*1=M=0.5 (균일 마스크).
    out = open*(1-0.5) + closed*0.5 = 200*0.5 + 100*0.5 = 150.
    """
    dur, sr = 0.5, 16000
    wav = _write_wav(tmp_path, dur=dur, sr=sr, silent=True)  # 무음
    cfg = FifthConfig.from_env()
    env_n = _env_len(dur, sr, cfg.fps)
    nj = env_n + 2  # nj > env → n=nj (충분히 큰 값)

    eng = _FakeEngineMarked()
    M_val = 0.5
    sources = {
        "mode": "blend",
        "open_s": {
            "src_img": "OPEN",   # render → 200 채운 프레임
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "closed_s": {
            "src_img": "CLOSED",  # render → 100 채운 프레임
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.0023,
        },
        "mouth_mask": np.full((512, 512, 1), M_val, dtype=np.float32),
    }
    got = []
    n, _tok = stream_wav_frames(
        eng, _FakeJP(nj), cfg, sources, wav,
        on_frame=got.append,
        blink_enabled=False,
    )
    assert n > 0, "프레임이 1개 이상 생성돼야 함"
    # 무음 → base_blend_weight(0, ...) = 0 → w=0 → alpha=M*(1-0)=0.5
    # out = 200*(1-0.5) + 100*0.5 = 150 (±1 uint8 오차 허용)
    for frame in got:
        mid = int(frame[256, 256, 0])  # 대표 픽셀
        assert abs(mid - 150) <= 1, (
            f"픽셀값 {mid} — 블렌드 공식 오류 (기대 150±1)"
        )


# ---------------------------------------------------------------------------
# _eye_open_ratio 폴백 테스트
# ---------------------------------------------------------------------------

def test_eye_open_ratio_returns_fallback_on_exception():
    """_eye_open_ratio: import 실패 또는 예외 시 0.37 반환."""
    from fifth_render import _eye_open_ratio
    # src_info 에 없는 키 접근 → KeyError → 폴백 0.37
    result = _eye_open_ratio({"src_img": object()})  # src_info 없음
    assert result == pytest.approx(0.37)


# ---------------------------------------------------------------------------
# prepare_sources 테스트
# ---------------------------------------------------------------------------

class _FakeEngineWithSource(_FakeEngine):
    def load_source(self, path):
        return {
            "src_img": f"img:{path}",
            "src_info": [[None, np.zeros((106, 2))]],
            "lip_close_ratio": 0.01,
        }

    def align_source_to_ref(self, target_s, ref_s, mode):
        target_s["aligned"] = mode
        return target_s

    def build_mouth_mask(self, lmk, img_size, dilate_px, feather_sigma):
        return np.ones((img_size, img_size, 1), np.float32)


def test_prepare_sources_single_mode():
    eng = _FakeEngineWithSource()
    src = prepare_sources(
        eng,
        {"mode": "single", "open_path": "/o.png", "closed_path": None},
    )
    assert src["mode"] == "single"
    assert src["open_s"]["src_img"] == "img:/o.png"


def test_prepare_sources_blend_mode_aligns_and_masks():
    eng = _FakeEngineWithSource()
    src = prepare_sources(
        eng,
        {"mode": "blend", "open_path": "/o.png", "closed_path": "/c.png"},
    )
    assert src["mode"] == "blend"
    assert src["closed_s"]["aligned"] == "affine"
    assert src["mouth_mask"].shape == (512, 512, 1)


# ---------------------------------------------------------------------------
# T-120: _apply_head_sway 테스트
# ---------------------------------------------------------------------------

def _make_ml(nj):
    return [{"R": np.eye(3)[None].astype(np.float32),
             "t": np.zeros((1, 3), np.float32),
             "exp": np.zeros((1, 21, 3), np.float32)} for _ in range(nj)]


def test_head_sway_amp_zero_is_noop():
    from fifth_render import _apply_head_sway
    ml = _make_ml(30)
    before = [m["R"].copy() for m in ml]
    _apply_head_sway(ml, 30, 0.0)
    for m, b in zip(ml, before):
        assert np.array_equal(m["R"], b)


def test_head_sway_positive_deterministic_and_valid_rotation():
    from fifth_render import _apply_head_sway
    ml1, ml2 = _make_ml(30), _make_ml(30)
    _apply_head_sway(ml1, 30, 0.6)
    _apply_head_sway(ml2, 30, 0.6)
    for a, b in zip(ml1, ml2):
        assert np.array_equal(a["R"], b["R"])
    Rm = ml1[15]["R"][0]
    assert not np.allclose(Rm, np.eye(3), atol=1e-4)
    assert np.allclose(Rm @ Rm.T, np.eye(3), atol=1e-3)
    assert abs(np.linalg.det(Rm) - 1.0) < 1e-3


def test_head_sway_ramps_from_zero_at_edges():
    from fifth_render import _apply_head_sway
    ml = _make_ml(40)
    _apply_head_sway(ml, 40, 1.0)
    assert np.allclose(ml[0]["R"], np.eye(3)[None], atol=2e-2)


def test_head_sway_negative_is_noop():
    """amp<0 도 amp<=0 조건에 포함 — no-op(회귀 0)."""
    from fifth_render import _apply_head_sway
    ml = _make_ml(20)
    before = [m["R"].copy() for m in ml]
    _apply_head_sway(ml, 20, -0.5)
    for m, b in zip(ml, before):
        assert np.array_equal(m["R"], b)


def test_head_sway_large_amplitude_maintains_orthogonality():
    """amp 극값(5.0)에서도 회전각만 커질 뿐 각 프레임 R은 유효 회전행렬(직교·det=1) 유지."""
    from fifth_render import _apply_head_sway
    ml = _make_ml(30)
    _apply_head_sway(ml, 30, 5.0)
    for m in ml:
        Rm = m["R"][0]
        assert np.allclose(Rm @ Rm.T, np.eye(3), atol=1e-3)
        assert abs(np.linalg.det(Rm) - 1.0) < 1e-3


def test_head_sway_nj_less_than_ramp():
    """nj < ramp(12) 극단 케이스 — 크래시 없이 동작 + 램프가 의도대로(양끝<중앙) 적용."""
    from fifth_render import _apply_head_sway

    # nj=1: ramp=min(12,1)=1 → ZeroDivisionError 없이 동작.
    ml1 = _make_ml(1)
    _apply_head_sway(ml1, 1, 1.0)
    assert ml1[0]["R"].shape == (1, 3, 3)

    # nj=5: ramp=min(12,5)=5 → 양끝(0,4)의 회전 편차가 중앙(2)보다 작아야 함.
    ml5 = _make_ml(5)
    _apply_head_sway(ml5, 5, 1.0)
    dev = [float(np.linalg.norm(m["R"][0] - np.eye(3))) for m in ml5]
    assert dev[0] < dev[2]
    assert dev[4] < dev[2]


# T-120 슬로우모션: _apply_head_sway(slow=) — 주기·ramp 배율로 각속도 1/slow
def test_head_sway_slow_default_matches_no_arg():
    """slow=1.0(기본) == slow 미전달 — 회귀 0."""
    from fifth_render import _apply_head_sway
    a, b = _make_ml(60), _make_ml(60)
    _apply_head_sway(a, 60, 0.6)
    _apply_head_sway(b, 60, 0.6, slow=1.0)
    for x, y in zip(a, b):
        assert np.array_equal(x["R"], y["R"])


def test_head_sway_slow_le_zero_falls_back_to_one():
    """slow<=0 은 1.0으로 폴백(0 division·역주행 방지)."""
    from fifth_render import _apply_head_sway
    a, b = _make_ml(40), _make_ml(40)
    _apply_head_sway(a, 40, 0.6)
    _apply_head_sway(b, 40, 0.6, slow=0.0)
    for x, y in zip(a, b):
        assert np.array_equal(x["R"], y["R"])


# _make_ml R=I 이므로 Rm = r_sway = r_pitch@r_yaw →
#   Rm[0,2]=sin(yaw), Rm[2,1]=sin(pitch). 각 성분을 각도로 역산해 검증.
def _yaw_deg(m):
    return math.degrees(math.asin(float(np.clip(m["R"][0][0, 2], -1.0, 1.0))))


def _pitch_deg(m):
    return math.degrees(math.asin(float(np.clip(m["R"][0][2, 1], -1.0, 1.0))))


def test_head_sway_slow_reduces_oscillation_count():
    """slow=2.0 → yaw 주기 2배 → 동일 nj 중앙구간에서 부호변화(zero-crossing) 절반.

    판정 견고화(シオン MAJOR-1): 중앙구간이 최소 1사이클을 담도록 nj-80 >= 160(slow=2
    yaw 1사이클) 을 만족해야 함. slow=2 → ramp=24 → 중앙구간 [40:nj-40] 길이 nj-80.
    nj=240: 중앙 160f. fast(period80)=2사이클→zero-cross ~4, slow2(period160)=1사이클→~2.
    구체 카운트로 고정(단순 `<` 우연통과 방지).
    """
    from fifth_render import _apply_head_sway
    nj = 240
    assert nj - 80 >= 160, "중앙구간이 slow=2의 1사이클(160f) 이상을 담아야 판정 유효"
    fast, slow2 = _make_ml(nj), _make_ml(nj)
    _apply_head_sway(fast, nj, 0.8, slow=1.0)
    _apply_head_sway(slow2, nj, 0.8, slow=2.0)

    def _sign_changes(ml):
        s = [float(m["R"][0][0, 2]) for m in ml[40:nj - 40]]  # 램프 밖 중앙 구간
        return sum(1 for i in range(1, len(s)) if s[i - 1] * s[i] < 0)

    sc_fast, sc_slow = _sign_changes(fast), _sign_changes(slow2)
    assert sc_fast >= 3, f"fast 진동 부족: {sc_fast}"      # 2사이클 ≈ 4 zero-cross
    assert sc_slow <= 2, f"slow2 과다 진동: {sc_slow}"     # 1사이클 ≈ 2 zero-cross
    assert sc_slow < sc_fast


def test_head_sway_slow_preserves_per_component_amplitude():
    """slow와 무관하게 yaw/pitch 각 진폭(성분별)이 amp*base 로 보존 — 주기만 늘어남.

    シオン MAJOR-2: Frobenius norm(누적) 대신 yaw/pitch 각도를 직접 역산해 성분별로 비교.
    nj=480: slow=2의 pitch_period=220f 기준 mid-clip(sway_r=1)에 사인 극값이 여러 번 안착.
    amp=0.8 → yaw 진폭 10°*0.8=8.0°, pitch 진폭 6°*0.8=4.8°.
    """
    from fifth_render import _apply_head_sway
    nj = 480
    for slow in (1.0, 2.0):
        ml = _make_ml(nj)
        _apply_head_sway(ml, nj, 0.8, slow=slow)
        max_yaw = max(abs(_yaw_deg(m)) for m in ml)
        max_pitch = max(abs(_pitch_deg(m)) for m in ml)
        assert abs(max_yaw - 8.0) < 0.5, f"slow={slow} yaw 진폭 {max_yaw:.2f}≠8.0"
        assert abs(max_pitch - 4.8) < 0.5, f"slow={slow} pitch 진폭 {max_pitch:.2f}≠4.8"
        for m in ml:  # 유효 회전행렬 유지
            Rm = m["R"][0]
            assert np.allclose(Rm @ Rm.T, np.eye(3), atol=1e-3)
            assert abs(np.linalg.det(Rm) - 1.0) < 1e-3


def test_head_sway_slow_intermediate_1_5_monotonic():
    """중간값(slow=1.5) 검증(シオン MINOR-1): 진동 횟수가 slow=1 > 1.5 > 2 로 단조 감소."""
    from fifth_render import _apply_head_sway
    nj = 400  # slow=2 중앙구간(nj-80=320)이 1사이클(160f) 넉넉히 포함

    def _sc(slow):
        ml = _make_ml(nj)
        _apply_head_sway(ml, nj, 0.8, slow=slow)
        s = [float(m["R"][0][0, 2]) for m in ml[40:nj - 40]]
        return sum(1 for i in range(1, len(s)) if s[i - 1] * s[i] < 0)

    c1, c15, c2 = _sc(1.0), _sc(1.5), _sc(2.0)
    assert c1 >= c15 >= c2, f"단조 감소 위반: slow1={c1}, slow1.5={c15}, slow2={c2}"


def test_head_sway_slow_extreme_short_nj_no_crash():
    """극단 짧은 nj(<ramp*slow)에서 slow 적용해도 크래시/차원오류 없음(シオン MINOR-2).

    nj=10, slow=2 → ramp=min(24,10)=10 → 전 프레임 램프 구간. 주기는 못 펼쳐지지만
    ZeroDivision·shape 오류 없이 유효 회전행렬을 내야 함.
    """
    from fifth_render import _apply_head_sway
    ml = _make_ml(10)
    _apply_head_sway(ml, 10, 0.8, slow=2.0)
    for m in ml:
        Rm = m["R"][0]
        assert Rm.shape == (3, 3)
        assert np.allclose(Rm @ Rm.T, np.eye(3), atol=1e-3)


# ---------------------------------------------------------------------------
# T-120: _apply_head_sway 시선 오프셋(yaw_offset_deg/pitch_offset_deg) 확장
# ⚠️ 부호(좌/우·상/하) 방향은 코드로 확신 못 함 — 클로가 렌더 실측으로 확인/조정.
# 여기서는 "오프셋이 R을 변화시킨다"/"유효 회전행렬 유지"/"no-op 조건" 만 검증.
# ---------------------------------------------------------------------------

def test_head_sway_yaw_offset_changes_r_even_when_amp_zero():
    """amp=0 이어도 yaw_offset_deg!=0 이면 R이 변화해야 함(시선 바이어스는 amp 무관)."""
    from fifth_render import _apply_head_sway
    ml = _make_ml(20)
    _apply_head_sway(ml, 20, 0.0, yaw_offset_deg=15.0)
    Rm = ml[10]["R"][0]
    assert not np.allclose(Rm, np.eye(3), atol=1e-4)
    assert np.allclose(Rm @ Rm.T, np.eye(3), atol=1e-3)
    assert abs(np.linalg.det(Rm) - 1.0) < 1e-3


def test_head_sway_pitch_offset_changes_r_even_when_amp_zero():
    """amp=0 이어도 pitch_offset_deg!=0 이면 R이 변화해야 함."""
    from fifth_render import _apply_head_sway
    ml = _make_ml(20)
    _apply_head_sway(ml, 20, 0.0, pitch_offset_deg=8.0)
    Rm = ml[10]["R"][0]
    assert not np.allclose(Rm, np.eye(3), atol=1e-4)
    assert np.allclose(Rm @ Rm.T, np.eye(3), atol=1e-3)
    assert abs(np.linalg.det(Rm) - 1.0) < 1e-3


def test_head_sway_offset_zero_and_amp_zero_is_noop():
    """amp=0 + yaw_offset_deg=0 + pitch_offset_deg=0 → 완전 no-op(회귀 0)."""
    from fifth_render import _apply_head_sway
    ml = _make_ml(20)
    before = [m["R"].copy() for m in ml]
    _apply_head_sway(ml, 20, 0.0, yaw_offset_deg=0.0, pitch_offset_deg=0.0)
    for m, b in zip(ml, before):
        assert np.array_equal(m["R"], b)


def test_head_sway_offset_holds_after_ramp_in_no_ramp_out():
    """오프셋은 램프인(0→1) 후 유지(sway처럼 램프아웃 안 됨) — 중반과 말미 편차가 비슷해야 함."""
    from fifth_render import _apply_head_sway
    ml = _make_ml(30)
    _apply_head_sway(ml, 30, 0.0, yaw_offset_deg=10.0)
    dev_mid = np.linalg.norm(ml[15]["R"][0] - np.eye(3))
    dev_last = np.linalg.norm(ml[29]["R"][0] - np.eye(3))
    assert dev_mid > 0
    assert dev_last > 0
    assert abs(dev_mid - dev_last) < 0.05


# ---------------------------------------------------------------------------
# T-120: stream_wav_frames lip_lock / head_sway_amp / eyes_open_lock 배선 테스트
# ---------------------------------------------------------------------------

class _CdlCeCaptureEngine:
    """c_d_lip / c_eyes / motion(exp) 인자를 캡처하는 fake engine (T-120 배선 검증용)."""
    def __init__(self):
        self.cdls = []
        self.ces = []
        self.exps = []

    def render(self, motion, c_eyes, c_d_lip, first_frame, src_img=None, src_info=None):
        self.cdls.append(float(c_d_lip))
        self.ces.append(c_eyes)
        self.exps.append(np.asarray(motion["exp"]).copy())
        return np.zeros((512, 512, 3), np.uint8)


class _FakeJPWithEyes:
    """JoyVASA 네이티브 c_eyes_lst를 반환하는 fake (ce_raw truthy 분기 검증, エル 게이트).

    기존 _FakeJP는 항상 c_eyes_lst=[] 라 ce_raw truthy 분기가 미검증이었다.
    """
    def __init__(self, n=25):
        self.n = n

    def gen_motion_sequence(self, wav_path):
        motion = [
            {
                "R": np.eye(3)[None].astype(np.float32),
                "t": np.zeros((1, 3), np.float32),
                "exp": np.zeros((1, 21, 3), np.float32),
            }
            for _ in range(self.n)
        ]
        # 네이티브 눈: 중간 프레임을 "감김"(작은 값)으로 → blink:false로는 못 막음.
        # shape (1,1) — make_blink_sequence/FLP calc_combined_eye_ratio 실제 계약.
        ce = [np.array([[0.3]], np.float32) for _ in range(self.n)]
        ce[self.n // 2] = np.array([[0.02]], np.float32)
        return {"motion": motion, "c_eyes_lst": ce, "n_frames": self.n}


def _silent_wav(tmp_path, sec=1.0, sr=16000):
    p = str(tmp_path / "sil.wav")
    sf.write(p, np.zeros(int(sec * sr), np.float32), sr)
    return p


def _single_sources():
    # src_info[0][0]: x_s_info dict(exp 포함, T-120 source_face_lock 계약).
    # src_info[0][1]: source_lmk(106,2) — 기존 mouth_mask/_eye_open_ratio 경로용.
    return {
        "mode": "single",
        "open_s": {
            "src_img": object(),
            "src_info": [[{"exp": np.full((1, 21, 3), 0.42, dtype=np.float32)}, np.zeros((106, 2))]],
            "lip_close_ratio": 0.081,
        },
    }


def test_lip_lock_forces_closed_cdl(tmp_path):
    from fifth_render import stream_wav_frames
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        lip_lock=True,
    )
    assert eng.cdls and all(abs(c - cfg.lip_closed) < 1e-6 for c in eng.cdls)


def test_eyes_open_lock_overrides_native_c_eyes(tmp_path):
    """ce_raw truthy(네이티브 감김)여도 eyes_open_lock=True면 전 프레임 눈 뜸."""
    from fifth_render import stream_wav_frames
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJPWithEyes(n=25)
    sources = _single_sources()
    stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        eyes_open_lock=True,
    )
    assert all(float(np.min(c)) > 0.1 for c in eng.ces), (
        "eyes_open_lock이 네이티브 감김을 덮어야 함"
    )


def test_eyes_open_lock_none_keeps_native_c_eyes(tmp_path):
    """미전달 시 네이티브 ce_raw 그대로 소비(회귀 0) → 감김 프레임 존재."""
    from fifth_render import stream_wav_frames
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJPWithEyes(n=25)
    sources = _single_sources()
    stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
    )
    assert any(float(np.min(c)) < 0.1 for c in eng.ces), "미전달 시 네이티브 감김 유지"


def test_head_sway_amp_applied_when_positive(tmp_path, monkeypatch):
    import fifth_render
    calls = {"n": 0, "amp": None}
    monkeypatch.setattr(
        fifth_render, "_apply_head_sway",
        lambda ml, nj, amp, phase_offset=0, yaw_offset_deg=0.0, pitch_offset_deg=0.0, slow=1.0:
            calls.update(n=calls["n"] + 1, amp=amp),
    )
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    fifth_render.stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        head_sway_amp=0.6,
    )
    assert calls["n"] == 1 and calls["amp"] == 0.6


def test_head_sway_none_does_not_call(tmp_path, monkeypatch):
    """head_sway_amp/head_yaw_offset/head_pitch_offset 전부 미전달 → 호출 자체 없음(회귀 0)."""
    import fifth_render
    calls = {"n": 0}
    monkeypatch.setattr(
        fifth_render, "_apply_head_sway",
        lambda *a, **k: calls.update(n=calls["n"] + 1),
    )
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    fifth_render.stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
    )
    assert calls["n"] == 0


def test_head_yaw_offset_calls_apply_head_sway_even_when_amp_none(tmp_path, monkeypatch):
    """head_sway_amp 미전달이어도 head_yaw_offset만 있으면 _apply_head_sway 호출돼야 함."""
    import fifth_render
    calls = {"n": 0, "kwargs": None}

    def _spy(ml, nj, amp, phase_offset=0, yaw_offset_deg=0.0, pitch_offset_deg=0.0, slow=1.0):
        calls["n"] += 1
        calls["kwargs"] = dict(amp=amp, yaw_offset_deg=yaw_offset_deg, pitch_offset_deg=pitch_offset_deg)

    monkeypatch.setattr(fifth_render, "_apply_head_sway", _spy)
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    fifth_render.stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        head_yaw_offset=-12.0,
    )
    assert calls["n"] == 1
    assert calls["kwargs"]["amp"] is None
    assert calls["kwargs"]["yaw_offset_deg"] == -12.0
    assert calls["kwargs"]["pitch_offset_deg"] == 0.0


def test_head_pitch_offset_calls_apply_head_sway_even_when_amp_none(tmp_path, monkeypatch):
    """head_sway_amp 미전달이어도 head_pitch_offset만 있으면 _apply_head_sway 호출돼야 함."""
    import fifth_render
    calls = {"n": 0, "kwargs": None}

    def _spy(ml, nj, amp, phase_offset=0, yaw_offset_deg=0.0, pitch_offset_deg=0.0, slow=1.0):
        calls["n"] += 1
        calls["kwargs"] = dict(amp=amp, yaw_offset_deg=yaw_offset_deg, pitch_offset_deg=pitch_offset_deg)

    monkeypatch.setattr(fifth_render, "_apply_head_sway", _spy)
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    fifth_render.stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        head_pitch_offset=8.0,
    )
    assert calls["n"] == 1
    assert calls["kwargs"]["amp"] is None
    assert calls["kwargs"]["yaw_offset_deg"] == 0.0
    assert calls["kwargs"]["pitch_offset_deg"] == 8.0


def test_head_sway_slow_passed_through(tmp_path, monkeypatch):
    """head_sway_slow 가 _apply_head_sway(slow=)로 그대로 전달된다(필러 슬로우모션)."""
    import fifth_render
    calls = {"n": 0, "slow": None}

    def _spy(ml, nj, amp, phase_offset=0, yaw_offset_deg=0.0, pitch_offset_deg=0.0, slow=1.0):
        calls["n"] += 1
        calls["slow"] = slow

    monkeypatch.setattr(fifth_render, "_apply_head_sway", _spy)
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    fifth_render.stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        head_sway_amp=0.4, head_sway_slow=2.0,
    )
    assert calls["n"] == 1
    assert calls["slow"] == 2.0


def test_head_sway_slow_none_passes_default_one(tmp_path, monkeypatch):
    """head_sway_slow 미전달 시 _apply_head_sway 에 slow=1.0 로 전달(회귀 0)."""
    import fifth_render
    calls = {"slow": None}

    def _spy(ml, nj, amp, phase_offset=0, yaw_offset_deg=0.0, pitch_offset_deg=0.0, slow=1.0):
        calls["slow"] = slow

    monkeypatch.setattr(fifth_render, "_apply_head_sway", _spy)
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    fifth_render.stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        head_sway_amp=0.4,
    )
    assert calls["slow"] == 1.0


def test_blink_interval_sec_passed_to_make_blink_sequence(tmp_path, monkeypatch):
    """eyes_open_lock=True + blink_interval_sec 지정 시 avg_interval_sec로 그대로 전달."""
    import fifth_render
    import render_offline
    calls = {}
    orig = render_offline.make_blink_sequence

    def _spy(n, fps, eye_open, eye_closed, phase_offset=0, avg_interval_sec=3.2, blink_dur_frames=6):
        calls["avg_interval_sec"] = avg_interval_sec
        return orig(n, fps, eye_open, eye_closed, phase_offset=phase_offset,
                    avg_interval_sec=avg_interval_sec, blink_dur_frames=blink_dur_frames)

    monkeypatch.setattr(render_offline, "make_blink_sequence", _spy)
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    fifth_render.stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        eyes_open_lock=True, blink_interval_sec=3.5,
    )
    assert calls["avg_interval_sec"] == 3.5


def test_blink_interval_sec_none_defaults_to_1e9(tmp_path, monkeypatch):
    """blink_interval_sec 미전달 시 기존 동작(avg_interval_sec=1e9, 무깜빡) 유지(회귀 0)."""
    import fifth_render
    import render_offline
    calls = {}
    orig = render_offline.make_blink_sequence

    def _spy(n, fps, eye_open, eye_closed, phase_offset=0, avg_interval_sec=3.2, blink_dur_frames=6):
        calls["avg_interval_sec"] = avg_interval_sec
        return orig(n, fps, eye_open, eye_closed, phase_offset=phase_offset,
                    avg_interval_sec=avg_interval_sec, blink_dur_frames=blink_dur_frames)

    monkeypatch.setattr(render_offline, "make_blink_sequence", _spy)
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    fifth_render.stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        eyes_open_lock=True,
    )
    assert calls["avg_interval_sec"] == 1e9


# ---------------------------------------------------------------------------
# T-120: source_face_lock — exp를 소스(원본 사진) exp로 고정 + cdl=소스 립비율
# ---------------------------------------------------------------------------

class _FakeJPWithDistinctExp:
    """keypoint(21개)마다 서로 다른 exp값을 반환하는 fake — lip-only 잠금 검증용.

    히즈키 피드백: source_face_lock은 exp 전체가 아니라 lip 키포인트(6개)만
    소스로 고정 → 나머지 15개(눈·눈썹 등)는 JoyVASA 원본 유지(눈동자 움직임 확보).
    _single_sources()의 소스 exp(0.42 균일)와 겹치지 않는 값을 써서 lip/non-lip
    구분이 명확하도록 한다.
    """
    def __init__(self, n=25):
        self.n = n

    def gen_motion_sequence(self, wav_path):
        exp_template = np.zeros((1, 21, 3), np.float32)
        for k in range(21):
            exp_template[0, k, :] = 0.10 + 0.01 * k  # 0.10~0.30, keypoint별 고유
        motion = [
            {
                "R": np.eye(3)[None].astype(np.float32),
                "t": np.zeros((1, 3), np.float32),
                "exp": exp_template.copy(),
            }
            for _ in range(self.n)
        ]
        return {"motion": motion, "c_eyes_lst": [], "n_frames": self.n}


def test_source_face_lock_forces_lip_keypoints_only(tmp_path):
    """source_face_lock=True 시 lip 키포인트(_LIP_IDX, 6개)만 소스 exp로 고정,
    non-lip 키포인트(15개)는 JoyVASA 원본 유지(히즈키 피드백: 눈동자 움직임 확보)."""
    from fifth_render import stream_wav_frames, _LIP_IDX
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJPWithDistinctExp(25)
    sources = _single_sources()
    stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        source_face_lock=True,
    )
    src_exp = sources["open_s"]["src_info"][0][0]["exp"]
    non_lip_idx = [i for i in range(21) if i not in _LIP_IDX]
    assert eng.exps
    for e in eng.exps:
        # lip 키포인트: 소스 exp와 일치해야 함(입 고정)
        assert np.array_equal(e[:, _LIP_IDX, :], src_exp[:, _LIP_IDX, :])
        # non-lip 키포인트: JoyVASA 원본(소스 exp 0.42와 다른 keypoint별 고유값) 유지
        for k in non_lip_idx:
            assert not np.allclose(e[0, k, :], src_exp[0, k, :]), (
                f"non-lip keypoint {k} 가 소스 exp로 덮였음 — 전체 잠금 회귀"
            )


def test_source_face_lock_forces_cdl_to_source_lip_ratio(tmp_path):
    """source_face_lock=True 시 c_d_lip 전부 open_s["lip_close_ratio"](소스 원본 입) 고정."""
    from fifth_render import stream_wav_frames
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
        source_face_lock=True,
    )
    expected = float(sources["open_s"]["lip_close_ratio"])
    assert eng.cdls and all(abs(c - expected) < 1e-6 for c in eng.cdls)


def test_source_face_lock_none_keeps_native_exp(tmp_path):
    """미전달 시 JoyVASA 원본 exp 그대로 유지(회귀 0) — _FakeJP 는 exp=0 반환."""
    from fifth_render import stream_wav_frames
    cfg = FifthConfig.from_env()
    eng = _CdlCeCaptureEngine()
    jp = _FakeJP(25)
    sources = _single_sources()
    stream_wav_frames(
        eng, jp, cfg, sources, _silent_wav(tmp_path),
        on_frame=lambda f: None, blink_enabled=False,
    )
    zeros = np.zeros((1, 21, 3), np.float32)
    assert eng.exps and all(np.array_equal(e, zeros) for e in eng.exps)
