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
# 목표 길이에서 기계적으로 자르면 문장 한복판에서 끊기고, 프롬프트가 미완으로 끝난다.
# CosyVoice 는 프롬프트의 연속으로 생성하므로 그 뒷말을 이어붙인다 — 실사용에서
# 클론이 말 앞에 "다오~" 같은 추임새를 붙였다(히즈키 보고 2026-08-13).
# ─────────────────────────────────────────────────────────────────────────────

def test_목표_이내의_마지막_무음에서_끊는다(monkeypatch):
    # 발화 0.0~ 시작, 무음이 1.5 / 3.0 / 4.5 초에 시작
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([1.5, 3.0, 4.5], [1.9, 3.4, 4.9]))
    # target 4.0 → 4.5 는 넘고 3.0 이 마지막 후보
    assert make_prompt_ref.pick_end("x", 0.0, 4.0) == 3.0 + make_prompt_ref.TAIL_SILENCE_SEC


def test_쓸만한_무음이_없으면_목표_길이를_그대로_쓴다(monkeypatch):
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([], []))
    assert make_prompt_ref.pick_end("x", 0.0, 4.0) == 4.0


def test_너무_이른_무음은_후보가_아니다(monkeypatch):
    """시작 직후 0.5초짜리 프롬프트가 나오면 음색 학습이 안 된다."""
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([0.4], [0.8]))
    assert make_prompt_ref.pick_end("x", 0.0, 4.0) == 4.0


def test_발화_시작점_이후만_후보로_본다(monkeypatch):
    """앞부분 무음(발화 전)을 끝점으로 고르면 빈 오디오가 된다."""
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([0.1, 6.0], [2.0, 6.5]))
    # start=2.0 이므로 0.1 은 무시, 6.0 은 start+1.0 < 6.0 <= 6.0 이라 채택
    assert make_prompt_ref.pick_end("x", 2.0, 4.0) == 6.0 + make_prompt_ref.TAIL_SILENCE_SEC


def test_문장_끝_무음을_물고_간다(monkeypatch):
    """마지막 음절 바로 뒤에서 끊으면 모델이 그 음절을 이어받는다.

    실청(2026-08-13 샘플2): 프롬프트가 "박영미입니다." 로 끝나자 생성 앞에 "다" 가
    새어 나왔다. 무음이 곧 "여기서 끝났다"는 종결 신호이므로 조금 물고 가야 한다.
    """
    monkeypatch.setattr(make_prompt_ref, "silences", lambda p: ([2.0], [2.6]))
    end = make_prompt_ref.pick_end("x", 0.0, 4.0)
    assert end > 2.0, "무음 시작점에서 딱 끊으면 안 된다"
    assert end == 2.0 + make_prompt_ref.TAIL_SILENCE_SEC
