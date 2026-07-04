import os
from artifact_store import ArtifactStore


def test_save_load_roundtrip(tmp_path):
    s = ArtifactStore(str(tmp_path))
    rid = s.new_run()
    s.save_text(rid, "llm", "안녕하세요")
    s.save_bytes(rid, "answer.wav", b"RIFF...")
    assert s.load_text(rid, "llm") == "안녕하세요"
    assert s.load_bytes(rid, "answer.wav") == b"RIFF..."


def test_pin_and_list(tmp_path):
    s = ArtifactStore(str(tmp_path))
    r1 = s.new_run(); r2 = s.new_run()
    s.pin(r1)
    runs = {r["run_id"]: r for r in s.list_runs()}
    assert runs[r1]["pinned"] is True
    assert runs[r2]["pinned"] is False


def test_run_ids_monotonic(tmp_path):
    s = ArtifactStore(str(tmp_path))
    assert s.new_run() != s.new_run()


def test_path_returns_absolute_existing_file(tmp_path):
    s = ArtifactStore(str(tmp_path))
    rid = s.new_run()
    s.save_bytes(rid, "answer.wav", b"RIFF...")
    p = s.path(rid, "answer.wav")
    assert os.path.isabs(p)
    assert os.path.isfile(p)
    with open(p, "rb") as f:
        assert f.read() == b"RIFF..."
