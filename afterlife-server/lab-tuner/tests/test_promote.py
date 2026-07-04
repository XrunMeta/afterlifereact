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
# mizu VETO(CRITICAL 1): systemd 값 인젝션(RCE) 화이트리스트 거부
# ---------------------------------------------------------------------------

def test_upsert_env_line_rejects_newline(tmp_path):
    import pytest
    conf = tmp_path / "x.conf"
    with pytest.raises(promote.UnsafeEnvValueError):
        promote.upsert_env_line(str(conf), "PRETHIRD_OLLAMA_MODEL", "a\nb")
    assert not conf.exists()   # 거부 시 파일 자체가 생성되지 않아야 함


def test_upsert_env_line_rejects_quote(tmp_path):
    import pytest
    conf = tmp_path / "x.conf"
    with pytest.raises(promote.UnsafeEnvValueError):
        promote.upsert_env_line(str(conf), "PRETHIRD_OLLAMA_MODEL", 'a"b')
    assert not conf.exists()


def test_upsert_env_line_rejects_bracket_open(tmp_path):
    import pytest
    conf = tmp_path / "x.conf"
    with pytest.raises(promote.UnsafeEnvValueError):
        promote.upsert_env_line(str(conf), "PRETHIRD_OLLAMA_MODEL", "a[b")
    assert not conf.exists()


def test_upsert_env_line_rejects_bracket_close(tmp_path):
    import pytest
    conf = tmp_path / "x.conf"
    with pytest.raises(promote.UnsafeEnvValueError):
        promote.upsert_env_line(str(conf), "PRETHIRD_OLLAMA_MODEL", "a]b")
    assert not conf.exists()


def test_apply_rejects_malicious_value_before_any_write():
    # mizu VETO CRITICAL 1 재현: model="a\"\n[Service]\nExecStart=..." 형태의 systemd
    # 지시문 인젝션 시도 → apply()가 write_fn/backup_fn을 단 한 번도 부르지 않고 abort.
    import pytest
    writes, backups = [], []
    malicious = 'a"\n[Service]\nExecStart=/bin/evil'
    entries = [
        {"env": "PRETHIRD_TTS_SPEED", "new": "1.5", "file": "/x.conf"},   # 정상 항목도 섞음
        {"env": "PRETHIRD_OLLAMA_MODEL", "new": malicious, "file": "/y.conf"},
    ]
    with pytest.raises(promote.UnsafeEnvValueError):
        promote.apply(
            entries,
            write_fn=lambda f, e, v: writes.append((f, e, v)),
            backup_fn=lambda f: backups.append(f) or "bk1",
            dry_run=False,
        )
    assert writes == []      # 정상 항목조차 부분 write 되지 않아야 함
    assert backups == []


def test_apply_validates_even_in_dry_run():
    import pytest
    malicious = "a\nb"
    with pytest.raises(promote.UnsafeEnvValueError):
        promote.apply(
            [{"env": "PRETHIRD_OLLAMA_MODEL", "new": malicious, "file": "/x.conf"}],
            write_fn=lambda f, e, v: None,
            backup_fn=lambda f: "bk1",
            dry_run=True,
        )


# ---------------------------------------------------------------------------
# el BLOCKER 2: dirty-set diff — 미변경 knob 오탐·None→"None" 방지
# ---------------------------------------------------------------------------

def test_diff_with_dirty_only_shows_touched_knob():
    knobs = RunKnobs.from_dict({"tts": {"speed": 1.5}, "transport": {"width": 999}})
    def read_env(name): return ""
    entries = promote.diff(knobs, read_env, dirty={"tts.speed"})
    envs = {e["env"] for e in entries}
    assert envs == {"PRETHIRD_TTS_SPEED"}   # transport.width는 dirty에 없으므로 미등장


def test_diff_with_empty_dirty_returns_empty():
    knobs = RunKnobs.from_dict({"tts": {"speed": 1.5}})
    def read_env(name): return ""
    assert promote.diff(knobs, read_env, dirty=set()) == []


def test_diff_skips_none_valued_knob_even_when_dirty():
    knobs = RunKnobs()   # dialogue.model 기본 None
    def read_env(name): return ""
    entries = promote.diff(knobs, read_env, dirty={"dialogue.model"})
    assert entries == []   # None 값은 dirty여도 promote 후보에서 제외
    assert all(e["new"] != "None" for e in promote.diff(knobs, read_env))  # 전체비교에서도 리터럴 "None" 없음


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
    # allowed_root=tmp_path 로 테스트 격리(실 systemd 경로 미접근). 기본값(허용root
    # 미지정)은 프로덕션 드롭인 디렉토리를 강제하므로 프로덕션 호출에서만 쓰인다.
    restored = promote.restore_file(backup_id, allowed_root=str(tmp_path))
    assert restored == str(conf)
    assert conf.read_text() == "original"


def test_backup_file_has_0600_permission(tmp_path):
    conf = tmp_path / "lab-tuner.conf"
    conf.write_text("original")
    backup_id = promote.backup_file(str(conf))
    mode = os.stat(backup_id).st_mode & 0o777
    assert mode == 0o600


def test_restore_file_invalid_backup_id_raises():
    import pytest
    with pytest.raises(ValueError):
        promote.restore_file("not-a-backup-path")


def test_restore_file_nonexistent_backup_raises(tmp_path):
    import pytest
    fake_backup = str(tmp_path / "x.conf.bak-20260101-000000")
    with pytest.raises(ValueError):
        promote.restore_file(fake_backup, allowed_root=str(tmp_path))


def test_restore_file_rejects_path_outside_allowed_root(tmp_path):
    # mizu HIGH 4: backup_id가 허용 디렉토리 밖(경로탈출) → 거부.
    import pytest
    outside_dir = tmp_path.parent / "outside_lab_tuner_test"
    outside_dir.mkdir(exist_ok=True)
    real_target = outside_dir / "secret.conf"
    real_target.write_text("x")
    fake_backup = outside_dir / "secret.conf.bak-20260101-000000"
    fake_backup.write_text("x")
    with pytest.raises(ValueError):
        promote.restore_file(str(fake_backup), allowed_root=str(tmp_path))
    with pytest.raises(ValueError):
        promote.restore_file(str(tmp_path / "../etc/x.bak-20260101-000000"), allowed_root=str(tmp_path))


def test_restore_file_rejects_bad_filename_format(tmp_path):
    # 허용 디렉토리 안이어도 파일명이 "<원본>.bak-<타임스탬프>" 형식이 아니면 거부.
    import pytest
    bad = tmp_path / "not-a-backup-file.txt"
    bad.write_text("x")
    with pytest.raises(ValueError):
        promote.restore_file(str(bad), allowed_root=str(tmp_path))
