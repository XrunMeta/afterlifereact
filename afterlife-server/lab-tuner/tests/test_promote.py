import os
import promote
from knobs import RunKnobs


def test_diff_only_changed():
    knobs = RunKnobs.from_dict({"tts": {"speed": 1.5}})
    def read_env(name): return {"PRETHIRD_TTS_SPEED": "1.0"}.get(name, "")
    entries = promote.diff(knobs, read_env)
    speeds = [e for e in entries if e["env"] == "PRETHIRD_TTS_SPEED"]
    assert speeds and speeds[0]["current"] == "1.0" and speeds[0]["new"] == "1.5"


def test_apply_dry_run_no_write():
    writes = []
    promote.apply(
        [{"env": "PRETHIRD_TTS_SPEED", "new": "1.5", "file": "/x.conf"}],
        write_fn=lambda f, e, v: writes.append((f, e, v)),
        backup_fn=lambda f: "bk1",
        dry_run=True,
    )
    assert writes == []   # dry-run: 미변경


def test_apply_writes_and_backs_up():
    writes, backups = [], []
    res = promote.apply(
        [{"env": "PRETHIRD_TTS_SPEED", "new": "1.5", "file": "/x.conf"}],
        write_fn=lambda f, e, v: writes.append((f, e, v)),
        backup_fn=lambda f: backups.append(f) or "bk1",
        dry_run=False,
    )
    assert writes == [("/x.conf", "PRETHIRD_TTS_SPEED", "1.5")]
    assert backups == ["/x.conf"]
    assert res["backup_ids"]


# ---------------------------------------------------------------------------
# 실 write_fn/backup_fn/restore_fn 구현 — 반드시 tmp_path 경로로만(실 systemd 경로 미접근).
# ---------------------------------------------------------------------------

def test_upsert_env_line_creates_file_when_missing(tmp_path):
    conf = tmp_path / "lab-tuner.conf"
    promote.upsert_env_line(str(conf), "PRETHIRD_TTS_SPEED", "1.5")
    content = conf.read_text()
    assert '[Service]' in content
    assert 'Environment="PRETHIRD_TTS_SPEED=1.5"' in content


def test_upsert_env_line_replaces_existing_and_preserves_others(tmp_path):
    conf = tmp_path / "lab-tuner.conf"
    conf.write_text('[Service]\nEnvironment="PRETHIRD_TTS_SPEED=1.0"\nEnvironment="PRETHIRD_FILLER=1"\n')
    promote.upsert_env_line(str(conf), "PRETHIRD_TTS_SPEED", "1.7")
    content = conf.read_text()
    assert 'Environment="PRETHIRD_TTS_SPEED=1.7"' in content
    assert 'Environment="PRETHIRD_TTS_SPEED=1.0"' not in content
    assert 'Environment="PRETHIRD_FILLER=1"' in content   # 다른 라인 보존


def test_backup_file_missing_source_returns_none(tmp_path):
    missing = tmp_path / "nope.conf"
    assert promote.backup_file(str(missing)) is None


def test_backup_file_and_restore_roundtrip(tmp_path):
    conf = tmp_path / "lab-tuner.conf"
    conf.write_text("original")
    backup_id = promote.backup_file(str(conf))
    assert backup_id is not None
    assert os.path.exists(backup_id)

    conf.write_text("changed")
    restored = promote.restore_file(backup_id)
    assert restored == str(conf)
    assert conf.read_text() == "original"


def test_restore_file_invalid_backup_id_raises():
    import pytest
    with pytest.raises(ValueError):
        promote.restore_file("not-a-backup-path")


def test_restore_file_nonexistent_backup_raises(tmp_path):
    import pytest
    fake_backup = str(tmp_path / "x.conf.bak-20260101-000000")
    with pytest.raises(ValueError):
        promote.restore_file(fake_backup)
