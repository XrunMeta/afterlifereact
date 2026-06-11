import json
import os
import stat
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


# ── B-1: 예외 흡수 확대 ────────────────────────────────────────────────────────

def test_finalize_survives_unserializable_meta(tmp_path):
    rec = make_recorder(9051, "abc", root=str(tmp_path))
    turn = rec.begin_turn("say", "여보세요", seq=1)
    turn.append_token("응답")
    # 비직렬화 객체를 meta로 — 예외가 통화 루프로 전파되면 안 됨
    turn.finalize(weird=object())  # 예외 없이 반환해야 함
    # answer.txt는 정상 기록(meta만 실패)
    clone_dir = tmp_path / "9051"
    assert any(p.name.endswith("-answer.txt") for p in clone_dir.iterdir())


def test_finalize_survives_surrogate_answer(tmp_path):
    rec = make_recorder(9051, "abc", root=str(tmp_path))
    turn = rec.begin_turn("say", "hi", seq=1)
    turn.append_token("\ud800")  # surrogate — UTF-8 인코딩 불가
    turn.finalize(se_present=True)  # 예외 없이 반환해야 함


# ── H-1: PII 파일 권한 0o700/0o600 ───────────────────────────────────────────

def test_files_are_owner_only(tmp_path):
    rec = make_recorder(9051, "abc", root=str(tmp_path))
    turn = rec.begin_turn("say", "여보세요", seq=1)
    turn.append_token("응답")
    turn.finalize(se_present=True)
    clone_dir = tmp_path / "9051"
    for p in clone_dir.iterdir():
        perm = stat.S_IMODE(p.stat().st_mode)
        assert perm == 0o600, f"{p.name} perm={oct(perm)}"


# ── H-2: symlink 탈출 차단 ────────────────────────────────────────────────────

def test_symlink_escape_rejected(tmp_path):
    import os as _os
    outside = tmp_path / "outside"
    outside.mkdir()
    root = tmp_path / "root"
    root.mkdir()
    # root/9051 을 외부로 향하는 symlink로 심음
    _os.symlink(str(outside), str(root / "9051"))
    rec = make_recorder(9051, "abc", root=str(root))
    # symlink 탈출 → NullRecorder (외부에 기록 안 함)
    assert isinstance(rec, NullRecorder)


# ── R-1: 단조 ts — 같은 ms 두 턴 충돌 방지 ───────────────────────────────────

def test_monotonic_ts_no_collision(tmp_path):
    frozen = [1_700_000_000.0]  # 시간 정지
    rec = make_recorder(9051, "abc", root=str(tmp_path), time_fn=lambda: frozen[0])
    t1 = rec.begin_turn("say", "first", seq=1)
    t2 = rec.begin_turn("say", "second", seq=2)  # 같은 ms
    clone_dir = tmp_path / "9051"
    inputs = sorted(p.name for p in clone_dir.iterdir() if p.name.endswith("-input.txt"))
    assert len(inputs) == 2  # 충돌 없이 둘 다 보존
