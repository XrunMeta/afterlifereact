import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from sentence_buffer import SentenceBuffer  # noqa: E402

def test_emits_on_terminal_punct():
    sb = SentenceBuffer(min_len=2, force_flush=30)
    out = []
    for tok in ["안녕", "하세요", ". ", "반가워요", "!"]:
        out += sb.push(tok)
    out += sb.flush()
    assert out[0].strip() == "안녕하세요."
    assert out[1].strip() == "반가워요!"

def test_force_flush_on_long_run():
    sb = SentenceBuffer(min_len=2, force_flush=10)
    out = []
    for ch in "가나다라마바사아자차카":  # 11자, 종결부호 없음
        out += sb.push(ch)
    assert len(out) >= 1  # force_flush 로 끊김


def test_no_split_on_comma():
    # 쉼표(,)·읽점(、) 에서는 분할하지 않고, 마침표류에서만 분할한다.
    sb = SentenceBuffer(min_len=2, force_flush=50)
    out = []
    for tok in ["안녕", "하세요", ", ", "반가워요", "."]:
        out += sb.push(tok)
    out += sb.flush()
    assert len(out) == 1
    assert out[0].strip() == "안녕하세요, 반가워요."


def test_still_splits_on_period():
    # 회귀 가드: 마침표 분할은 그대로 동작.
    sb = SentenceBuffer(min_len=2, force_flush=50)
    out = []
    for tok in ["가나다", ". ", "라마바", "."]:
        out += sb.push(tok)
    out += sb.flush()
    assert len(out) == 2


# --- T-120 B: 세그먼트 병합(과분절 해소) — first_min_len 첫세그 예외 ---

def test_first_segment_uses_first_min_len():
    """첫 세그는 first_min_len(작게)로 빠르게 emit — 첫 응답 지연 방지."""
    sb = SentenceBuffer(min_len=16, force_flush=100, first_min_len=6)
    out = []
    for tok in ["안녕하세요", ". ", "오늘 하루는 어떻게 보내셨나요", "?"]:
        out += sb.push(tok)
    # "안녕하세요."(strip 6자) >= first_min_len 6 → 첫 세그로 즉시 emit
    assert out, "첫 세그가 emit되어야 함"
    assert out[0].strip() == "안녕하세요."


def test_short_sentences_merge_after_first_seg():
    """짧은 문장(min_len 미달)은 병합돼 세그 수를 줄인다(과분절 해소)."""
    sb = SentenceBuffer(min_len=16, force_flush=100, first_min_len=4)
    out = []
    # "네."·"응."·"그래."·"알겠어." 모두 min_len 16 미달 → 계속 누적/병합
    for tok in ["네", ". ", "응", ". ", "그래", ". ", "알겠어", "."]:
        out += sb.push(tok)
    out += sb.flush()
    assert len(out) == 1, f"짧은 문장들이 1세그로 병합되어야 함, got {out}"
    assert out[0].strip() == "네. 응. 그래. 알겠어."


def test_first_min_len_defaults_to_min_len():
    """first_min_len 미지정 시 min_len과 동일(회귀 0)."""
    sb = SentenceBuffer(min_len=8, force_flush=100)
    assert sb.first_min_len == 8


def test_reset_clears_emitted_counter():
    """reset 시 _emitted 초기화 → 다음 턴 첫 세그가 다시 first_min_len 임계를 쓴다."""
    sb = SentenceBuffer(min_len=16, force_flush=100, first_min_len=4)
    for tok in ["가나다라마바사", "."]:  # 8자 → emit
        sb.push(tok)
    assert sb._emitted >= 1
    sb.reset()
    assert sb._emitted == 0


def test_from_env_defaults(monkeypatch):
    """env 미설정 시 현행 기본(4, 30, first=min_len) — 회귀 0."""
    for k in ("PRETHIRD_SENTENCE_MIN_LEN", "PRETHIRD_SENTENCE_FORCE_FLUSH", "PRETHIRD_SENTENCE_FIRST_MIN_LEN"):
        monkeypatch.delenv(k, raising=False)
    sb = SentenceBuffer.from_env()
    assert sb.min_len == 4
    assert sb.force_flush == 30
    assert sb.first_min_len == 4  # None → min_len


def test_from_env_override(monkeypatch):
    """env로 병합 파라미터 주입(B 튜닝값)."""
    monkeypatch.setenv("PRETHIRD_SENTENCE_MIN_LEN", "16")
    monkeypatch.setenv("PRETHIRD_SENTENCE_FORCE_FLUSH", "48")
    monkeypatch.setenv("PRETHIRD_SENTENCE_FIRST_MIN_LEN", "6")
    sb = SentenceBuffer.from_env()
    assert (sb.min_len, sb.force_flush, sb.first_min_len) == (16, 48, 6)
