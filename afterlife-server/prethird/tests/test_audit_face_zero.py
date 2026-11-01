"""AFL-1071 기존 클론 얼굴 0 점검 — 순수 집계 함수 시험(torch/GPU 불필요)."""
import _audit_face_zero as a


def test_summarize_counts_and_flags():
    rows = [
        {"clone": "1", "video": "1-idle-25fps.mp4", "scores": [0.9, 0.8, 0.1]},
        {"clone": "2", "video": "2-idle-25fps.mp4", "scores": [0.3, 0.45, 0.5, 0.0]},  # 0.5 는 초과 아님
        {"clone": "3", "video": "3-idle-25fps.mp4", "scores": [0.0, 0.05]},
        {"clone": "4", "video": "4-idle-25fps.mp4", "scores": []},  # 읽기 실패
    ]
    out = {r["clone"]: r for r in a.summarize(rows)}
    assert out["1"]["n"] == 3 and out["1"]["hit_05"] == 2 and out["1"]["hit_02"] == 2
    assert out["1"]["zero"] is False
    assert out["2"]["hit_05"] == 0 and out["2"]["hit_02"] == 3 and out["2"]["zero"] is True
    assert out["3"]["hit_05"] == 0 and out["3"]["hit_02"] == 0 and out["3"]["zero"] is True
    assert out["3"]["rescued"] is False and out["2"]["rescued"] is True
    assert out["4"]["n"] == 0 and out["4"]["zero"] is False and out["4"]["error"] is True
