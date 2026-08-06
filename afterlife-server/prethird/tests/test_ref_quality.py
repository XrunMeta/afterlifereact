"""tests/test_ref_quality.py — 클론 ref 음성 품질 게이트 TDD

배경: 클론 9104 의 ref voice.wav 가 목소리가 아닌 노이즈였는데도 등록이 통과했다.
STT 가 10초에서 한글 19자만 뽑았고(정상 40~85자), CosyVoice ICL 이 "19자=10초"로
학습해 짧은 문장도 길게 늘여 생성(폭주) → 통화 지연·음성 붕괴로 이어졌다.
탐지 지표 = ref_text 문자밀도(char/s). 정상 4.1~8.5, 오염 클론 1.90·3.20.
"""
import json
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import ref_quality


def test_normal_density_passes():
    """정상 클론(85자/10초 = 8.5 char/s)은 통과."""
    r = ref_quality.evaluate({"non_space_len": 85, "duration_sec": 10.0})
    assert r["density"] == 8.5
    assert r["ok"] is True


def test_noise_ref_fails():
    """9104 실측값(19자/10초 = 1.9 char/s) → 미달 판정."""
    r = ref_quality.evaluate({"non_space_len": 19, "duration_sec": 10.0})
    assert r["density"] == 1.9
    assert r["ok"] is False


def test_borderline_clone_fails():
    """9074 실측값(32자/10초 = 3.2) → 기본 임계(3.5) 미달."""
    r = ref_quality.evaluate({"non_space_len": 32, "duration_sec": 10.0})
    assert r["ok"] is False


def test_lowest_normal_clone_passes():
    """정상 최저(9086: 41자/10초 = 4.1)는 통과해야 한다 — 오탐 방지."""
    r = ref_quality.evaluate({"non_space_len": 41, "duration_sec": 10.0})
    assert r["ok"] is True


def test_zero_duration_is_undetermined():
    """duration 0 → 나눗셈 불가. 미달이 아니라 '판정 불가'(None)."""
    r = ref_quality.evaluate({"non_space_len": 10, "duration_sec": 0})
    assert r["density"] is None
    assert r["ok"] is None


def test_missing_fields_are_undetermined():
    """메타에 필드가 없어도 예외 없이 판정 불가로 처리(등록 흐름 보호)."""
    assert ref_quality.evaluate({})["ok"] is None
    assert ref_quality.evaluate(None)["ok"] is None


def test_threshold_override_via_env(monkeypatch):
    """임계는 env 로 조정 가능 — 운영 중 재튜닝 여지."""
    monkeypatch.setenv("PREBUILD_REF_MIN_CHAR_PER_SEC", "2.0")
    r = ref_quality.evaluate({"non_space_len": 25, "duration_sec": 10.0})
    assert r["threshold"] == 2.0
    assert r["ok"] is True


def test_load_meta_missing_file(tmp_path):
    """meta 파일이 없으면 None — 호출부에서 판정 불가로 이어진다."""
    assert ref_quality.load_meta(str(tmp_path), "9999") is None


def test_load_meta_reads_json(tmp_path):
    d = tmp_path / "9104"
    d.mkdir()
    (d / "ref_text.meta.json").write_text(
        json.dumps({"non_space_len": 19, "duration_sec": 10.0}), encoding="utf-8"
    )
    m = ref_quality.load_meta(str(tmp_path), "9104")
    assert m["non_space_len"] == 19


def test_write_report_creates_json(tmp_path):
    """판정 결과를 ref_quality.json 으로 남긴다(STT 가 쓰는 meta 와 파일 분리)."""
    d = tmp_path / "9104"
    d.mkdir()
    r = ref_quality.evaluate({"non_space_len": 19, "duration_sec": 10.0})
    ref_quality.write_report(str(tmp_path), "9104", r)
    saved = json.loads((d / "ref_quality.json").read_text(encoding="utf-8"))
    assert saved["ok"] is False
    assert saved["density"] == 1.9


def test_write_report_never_raises(tmp_path):
    """리포트 기록 실패가 등록 흐름을 깨면 안 된다(부가기능)."""
    r = ref_quality.evaluate({"non_space_len": 19, "duration_sec": 10.0})
    # 존재하지 않는 루트 → 디렉토리 생성 실패해도 예외 전파 없음
    ref_quality.write_report("/proc/nonexistent-root-xyz", "9104", r)
