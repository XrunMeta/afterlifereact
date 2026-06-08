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
