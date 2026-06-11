import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from recorder import make_recorder, CallRecorder, NullRecorder


def test_null_recorder_when_root_unwritable(tmp_path):
    bad_root = "/proc/nonexistent/records"
    rec = make_recorder(clone_id=9051, session_id="abc", root=bad_root)
    assert isinstance(rec, NullRecorder)
    turn = rec.begin_turn("say", "여보세요", seq=1)
    turn.append_token("안")
    turn.append_wav(b"RIFF")
    turn.finalize(offer_to_say_ms=100, se_present=True)


def test_begin_turn_writes_input_immediately(tmp_path):
    fake_time = [1_700_000_000.0]
    rec = make_recorder(9051, "abc123", root=str(tmp_path), time_fn=lambda: fake_time[0])
    assert isinstance(rec, CallRecorder)
    turn = rec.begin_turn("say", "여보세요", seq=3)
    clone_dir = tmp_path / "9051"
    files = sorted(p.name for p in clone_dir.iterdir())
    assert files == ["1700000000000-input.txt"]
    content = (clone_dir / "1700000000000-input.txt").read_text(encoding="utf-8")
    assert "mode: say" in content
    assert "seq: 3" in content
    assert content.endswith("여보세요")


def test_finalize_writes_answer_and_meta_matched_prefix(tmp_path):
    fake_time = [1_700_000_000.0]
    rec = make_recorder(9051, "abc123", root=str(tmp_path), time_fn=lambda: fake_time[0])
    turn = rec.begin_turn("say", "여보세요", seq=3)
    turn.append_token("안녕")
    turn.append_token("하세요")
    fake_time[0] = 1_700_000_002.5
    turn.finalize(offer_to_say_ms=44000, se_present=True)
    clone_dir = tmp_path / "9051"
    files = sorted(p.name for p in clone_dir.iterdir())
    assert files == [
        "1700000000000-answer.txt",
        "1700000000000-input.txt",
        "1700000000000-meta.json",
    ]
    assert (clone_dir / "1700000000000-answer.txt").read_text(encoding="utf-8") == "안녕하세요"
    meta = json.loads((clone_dir / "1700000000000-meta.json").read_text(encoding="utf-8"))
    assert meta["offer_to_say_ms"] == 44000
    assert meta["se_present"] is True
    assert meta["answer_chars"] == 5  # "안녕하세요" = 5글자 (원 스펙 4는 오기)
    assert meta["finalized_ts_ms"] == 1_700_000_002_500


def test_anon_dir_when_clone_id_none(tmp_path):
    rec = make_recorder(None, "abc123", root=str(tmp_path))
    assert isinstance(rec, CallRecorder)
    turn = rec.begin_turn("say", "hi", seq=None)
    assert (tmp_path / "_anon").is_dir()


def test_missing_answer_means_dropout(tmp_path):
    rec = make_recorder(9051, "abc123", root=str(tmp_path))
    rec.begin_turn("say", "여보세요", seq=1)
    clone_dir = tmp_path / "9051"
    names = [p.name for p in clone_dir.iterdir()]
    assert any(n.endswith("-input.txt") for n in names)
    assert not any(n.endswith("-answer.txt") for n in names)
