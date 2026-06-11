import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from recorder import make_recorder
from records_report import report


def test_multi_turn_chronological_and_3way(tmp_path, capsys):
    clock = [1_700_000_000.0]
    rec = make_recorder(9051, "sessX", root=str(tmp_path), time_fn=lambda: clock[0])

    # 턴1 정상
    t1 = rec.begin_turn("say", "여보세요", seq=1)
    t1.append_token("네 안녕하세요")
    clock[0] += 2.0
    t1.finalize(mode="say", seq=1, se_present=True, offer_to_say_ms=44000)

    # 턴2 처리실패(토큰 0개로 finalize)
    clock[0] += 5.0
    t2 = rec.begin_turn("say", "들리세요?", seq=2)
    clock[0] += 1.0
    t2.finalize(mode="say", seq=2, se_present=True, offer_to_say_ms=None)

    # 턴3 미응답(finalize 안 함)
    clock[0] += 3.0
    rec.begin_turn("say", "거기 있어요?", seq=3)

    # 턴4 정상
    clock[0] += 2.0
    t4 = rec.begin_turn("say", "반가워요", seq=4)
    t4.append_token("저도 반갑습니다")
    clock[0] += 1.5
    t4.finalize(mode="say", seq=4, se_present=True)

    clone_dir = tmp_path / "9051"
    inputs = sorted(p.name for p in clone_dir.iterdir() if p.name.endswith("-input.txt"))
    assert len(inputs) == 4
    assert inputs == sorted(inputs)  # 시간순(prefix 오름차순)

    # 리포트 3분류 검증
    rc = report(str(tmp_path), "9051")
    assert rc == 0
    out = capsys.readouterr().out
    assert "정상 2" in out
    assert "처리실패 1" in out
    assert "미응답 1" in out


def test_report_missing_root(tmp_path, capsys):
    rc = report(str(tmp_path / "nope"))
    assert rc == 1


# ── MAJOR 4: meta 없이 answer.txt 내용 있으면 정상 분류 ──────────────────────

def test_report_answer_without_meta_is_ok(tmp_path, capsys):
    clone_dir = tmp_path / "9051"
    clone_dir.mkdir(parents=True)
    (clone_dir / "1700000000000-input.txt").write_text("mode: say\n---\nhi", encoding="utf-8")
    (clone_dir / "1700000000000-answer.txt").write_text("정상 응답", encoding="utf-8")
    # meta.json 의도적 부재(meta write 실패 시뮬)
    rc = report(str(tmp_path), "9051")
    out = capsys.readouterr().out
    assert "정상 1" in out
    assert "미응답 0" in out
