"""DialoguePipeline이 SentenceBuffer 파라미터를 env로 배선하는지 검증. T-120 B.

_sb_factory()가 env(PRETHIRD_SENTENCE_*)를 반영해야 라이브에서 런타임 튜닝이 가능하다.
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import pipeline  # noqa: E402


def _mk():
    # __init__은 인자를 self에 저장만 하므로 None으로 생성 가능(팩토리만 검증).
    return pipeline.DialoguePipeline(None, None, None, None, None, None)


def test_sb_factory_reads_env(monkeypatch):
    monkeypatch.setenv("PRETHIRD_SENTENCE_MIN_LEN", "16")
    monkeypatch.setenv("PRETHIRD_SENTENCE_FORCE_FLUSH", "48")
    monkeypatch.setenv("PRETHIRD_SENTENCE_FIRST_MIN_LEN", "6")
    sb = _mk()._sb_factory()
    assert sb.min_len == 16
    assert sb.force_flush == 48
    assert sb.first_min_len == 6


def test_sb_factory_defaults(monkeypatch):
    for k in ("PRETHIRD_SENTENCE_MIN_LEN", "PRETHIRD_SENTENCE_FORCE_FLUSH", "PRETHIRD_SENTENCE_FIRST_MIN_LEN"):
        monkeypatch.delenv(k, raising=False)
    sb = _mk()._sb_factory()
    assert sb.min_len == 4
    assert sb.force_flush == 30
    assert sb.first_min_len == 4  # None → min_len (회귀 0)
