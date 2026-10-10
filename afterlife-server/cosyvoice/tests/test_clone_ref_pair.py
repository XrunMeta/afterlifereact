"""ref_pair — CosyVoice 프롬프트 오디오·텍스트의 짝 계약.

핵심은 "짝"이다. 오디오는 짧은 프롬프트를 쓰면서 텍스트는 긴 ref_text 를 쓰면
"이 텍스트가 이 오디오"라는 ICL 전제가 깨져 폭주가 오히려 심해진다. 그래서
개별 접근자 대신 ref_pair() 하나만 노출하고, 여기서 그 불변식을 고정한다.

배경(2026-08-13 실측, clone 9128 "안녕하세요" 8회):
  ref 70.1초 / 46자 →  1.76 2.28 2.24 2.08 2.04 2.00 2.20 2.20
  ref  3.2초 / 13자 →  0.92 1.80 1.24 1.00 1.08 1.24 1.16 1.08
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import clone_ref  # noqa: E402


def _mk(root, clone_id, *, voice=None, ref_text=None, prompt_wav=None, prompt_txt=None):
    d = root / clone_id
    d.mkdir(parents=True, exist_ok=True)
    if voice is not None:
        (d / "voice.wav").write_bytes(voice)
    if ref_text is not None:
        (d / "ref_text.txt").write_text(ref_text, encoding="utf-8")
    if prompt_wav is not None:
        (d / clone_ref.PROMPT_WAV).write_bytes(prompt_wav)
    if prompt_txt is not None:
        (d / clone_ref.PROMPT_TXT).write_text(prompt_txt, encoding="utf-8")
    return d


def test_쌍이_완비되면_짧은_프롬프트를_쓴다(tmp_path):
    _mk(tmp_path, "c1", voice=b"LONG", ref_text="긴 참조 텍스트 46자 분량",
        prompt_wav=b"SHORT", prompt_txt="안녕하세요. 박영미입니다.")
    wav, text = clone_ref.ref_pair("c1", str(tmp_path))
    assert wav.endswith(clone_ref.PROMPT_WAV)
    assert text == "안녕하세요. 박영미입니다."


def test_프롬프트_wav만_있으면_통째로_폴백한다(tmp_path):
    """텍스트 없이 오디오만 바꾸면 짝이 깨진다 — 그럴 바엔 기존 쌍이 낫다."""
    _mk(tmp_path, "c2", voice=b"LONG", ref_text="긴 참조 텍스트", prompt_wav=b"SHORT")
    wav, text = clone_ref.ref_pair("c2", str(tmp_path))
    assert wav.endswith("voice.wav")
    assert text == "긴 참조 텍스트"


def test_프롬프트_텍스트만_있으면_통째로_폴백한다(tmp_path):
    _mk(tmp_path, "c3", voice=b"LONG", ref_text="긴 참조 텍스트", prompt_txt="짧은 텍스트")
    wav, text = clone_ref.ref_pair("c3", str(tmp_path))
    assert wav.endswith("voice.wav")
    assert text == "긴 참조 텍스트"


def test_프롬프트_텍스트가_비면_폴백한다(tmp_path):
    """빈 파일로 남은 중간 상태가 ICL 을 끄지 않도록."""
    _mk(tmp_path, "c4", voice=b"LONG", ref_text="긴 참조 텍스트",
        prompt_wav=b"SHORT", prompt_txt="   \n")
    wav, text = clone_ref.ref_pair("c4", str(tmp_path))
    assert wav.endswith("voice.wav")
    assert text == "긴 참조 텍스트"


def test_프롬프트가_아예_없으면_기존_동작_그대로(tmp_path):
    """회귀 0 — 아직 프롬프트를 안 만든 클론은 종전과 같이 동작해야 한다."""
    _mk(tmp_path, "c5", voice=b"LONG", ref_text="긴 참조 텍스트")
    wav, text = clone_ref.ref_pair("c5", str(tmp_path))
    assert wav.endswith("voice.wav")
    assert text == "긴 참조 텍스트"


def test_ref_text도_없으면_None_반환(tmp_path):
    """cross-lingual 폴백 경로 유지."""
    _mk(tmp_path, "c6", voice=b"LONG")
    wav, text = clone_ref.ref_pair("c6", str(tmp_path))
    assert wav.endswith("voice.wav")
    assert text is None


# ─────────────────────────────────────────────────────────────────────────────
# 프롬프트 텍스트 정제 — 끝의 말줄임표 제거.
#
# 목표 길이에서 자르면 문장 중간에서 끊기고 STT 가 "..." 를 붙인다. CosyVoice 는
# 프롬프트 텍스트를 그대로 조건으로 받아 말줄임표를 늘어짐으로 해석한다.
# 실측: 이것만 떼도 같은 문장이 3.20초 → 1.88초.
# ─────────────────────────────────────────────────────────────────────────────
import make_prompt_ref  # noqa: E402


def test_끝의_말줄임표를_뗀다():
    assert make_prompt_ref.clean_prompt_text("안녕하세요. 오늘 하루는 다...") == "안녕하세요. 오늘 하루는 다"


def test_유니코드_말줄임표도_뗀다():
    assert make_prompt_ref.clean_prompt_text("반갑습니다…") == "반갑습니다"


def test_마침표_섞인_꼬리도_뗀다():
    assert make_prompt_ref.clean_prompt_text("그래서 말인데.... ") == "그래서 말인데"


def test_정상_문장은_마침표를_남긴다():
    """문장 끝 마침표 하나는 정상 표기다 — 이것까지 떼면 억양이 달라진다."""
    assert make_prompt_ref.clean_prompt_text("안녕하세요. 박영미입니다.") == "안녕하세요. 박영미입니다."


def test_문장_중간의_말줄임표는_건드리지_않는다():
    assert make_prompt_ref.clean_prompt_text("음... 그러니까 말이야") == "음... 그러니까 말이야"


def test_빈_문자열은_None():
    assert make_prompt_ref.clean_prompt_text("   ") is None
    assert make_prompt_ref.clean_prompt_text("...") is None


# ─────────────────────────────────────────────────────────────────────────────
# 자를 지점 고르기 — 문장 경계(무음)에서 끊는다.
#
# 규칙(AFL-1002, 히즈키 결정 2026-10-10):
#   - 녹음(발화)은 RECORD_MIN_SEC(15초) 이상이어야 한다. 짧으면 too_short.
#   - 통화용 견본은 발화 CUT_AFTER_SEC(8초)가 지난 뒤 **처음 나오는 쉼**에서 자른다.
#     15초 기준으로 잘랐더니 문장마다 응답이 0.5~0.6초 느려져(A/B 3회차) 8초로 줄였다.
#   - MAX_PROMPT_SEC(30초)까지 쉼이 없으면 자르지 않고 no_pause.
#
# 🔴 기계 절단 금지. 예전 규칙은 쉼을 못 찾으면 목표 길이(4초)에서 그냥 잘랐고,
# 프리셋 9520 견본이 "…되었네요 오늘따라 당신과" 처럼 말 중간에서 끊겨 텍스트와
# 어긋났다 → 통화에서 "잘 잘 잘…" 단어 반복(9177 문장의 32%). 같은 절단 견본 48/97.
# ─────────────────────────────────────────────────────────────────────────────

REC = make_prompt_ref.RECORD_MIN_SEC
CUT = make_prompt_ref.CUT_AFTER_SEC
MAX = make_prompt_ref.MAX_PROMPT_SEC
TAIL = make_prompt_ref.TAIL_SILENCE_SEC


def test_8초_이후_첫_쉼에서_끊는다(monkeypatch):
    """8초 전의 쉼은 건너뛰고, 8초 이후 처음 나오는 쉼을 고른다(마지막 쉼이 아니라)."""
    monkeypatch.setattr(make_prompt_ref, "silences",
                        lambda p: ([3.0, 9.2, 13.0], [3.5, 9.8, 13.6]))
    assert make_prompt_ref.pick_end("x", 0.0, 20.0) == (9.2 + TAIL, "ok")


def test_정확히_8초에서_시작하는_쉼도_인정한다(monkeypatch):
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([8.0], [8.6]))
    assert make_prompt_ref.pick_end("x", 0.0, 20.0) == (8.0 + TAIL, "ok")


def test_발화_시작점부터_센다(monkeypatch):
    """앞 무음은 길이에 넣지 않는다 — 실제 말을 기준으로 센다."""
    monkeypatch.setattr(make_prompt_ref, "silences",
                        lambda p: ([0.0, 9.0, 11.5], [2.0, 9.5, 12.0]))
    # start=2.0 → 기준 10.0. 9.0 은 너무 이르고 11.5 를 고른다.
    assert make_prompt_ref.pick_end("x", 2.0, 20.0) == (11.5 + TAIL, "ok")


def test_쉼이_짧으면_꼬리를_쉼_길이만큼만_문다(monkeypatch):
    """꼬리를 쉼보다 길게 물면 다음 문장 첫소리가 섞인다 — 9520 쉼은 0.25~0.34초였다."""
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([9.0], [9.22]))
    end, reason = make_prompt_ref.pick_end("x", 0.0, 20.0)
    assert reason == "ok"
    assert abs(end - 9.22) < 1e-9


def test_문장_끝_무음을_물고_간다(monkeypatch):
    """마지막 음절 바로 뒤에서 끊으면 모델이 그 음절을 이어받는다(2026-08-13 "다" 누출)."""
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([9.0], [10.0]))
    end, _ = make_prompt_ref.pick_end("x", 0.0, 20.0)
    assert end > 9.0, "무음 시작점에서 딱 끊으면 안 된다"


def test_녹음이_15초보다_짧으면_실패(monkeypatch):
    """8초 이후 쉼이 있어도 녹음 자체가 15초 미만이면 받지 않는다."""
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([9.0], [9.5]))
    assert make_prompt_ref.pick_end("x", 0.0, 14.9) == (None, "too_short")


def test_녹음_길이도_발화_시작점부터_센다(monkeypatch):
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([0.0, 9.0], [1.0, 9.5]))
    assert make_prompt_ref.pick_end("x", 1.0, 15.5) == (None, "too_short")


def test_30초까지_쉼이_없으면_실패하고_자르지_않는다(monkeypatch):
    """예전처럼 목표 길이에서 기계적으로 자르지 않는다."""
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([5.0, 31.0], [5.5, 31.5]))
    assert make_prompt_ref.pick_end("x", 0.0, 40.0) == (None, "no_pause")


def test_쉼이_전혀_없으면_실패(monkeypatch):
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([], []))
    assert make_prompt_ref.pick_end("x", 0.0, 25.0) == (None, "no_pause")


def test_30초_상한은_발화_시작점_기준(monkeypatch):
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([0.0, 31.0], [1.0, 31.5]))
    # start=1.0 → 상한 31.0. 31.0 에서 시작하는 쉼은 인정.
    assert make_prompt_ref.pick_end("x", 1.0, 40.0) == (31.0 + TAIL, "ok")


def test_기본값은_결정된_규칙():
    assert REC == 15.0
    assert CUT == 8.0
    assert MAX == 30.0
