"""
stt-afterlife 단위테스트.
faster-whisper 모델을 mock 해서 실제 GPU/모델 없이 검증.
실행: python -m pytest tests/ -q  (afterlife-server/stt-afterlife/ 에서)
"""
from __future__ import annotations
import os
import sys
import json
import types
import tempfile
import shutil
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import pytest

# ── scripts/ 를 import path 에 추가 ──────────────────────────────────────────
SCRIPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "scripts")
sys.path.insert(0, os.path.abspath(SCRIPTS_DIR))


# ── faster_whisper stub ───────────────────────────────────────────────────────
# 실제 패키지 없이도 테스트 가능하도록 가짜 모듈 주입

class _FakeSegment:
    def __init__(self, text: str, start: float = 0.0):
        self.text = text
        self.start = start


class _FakeInfo:
    def __init__(self, duration: float = 5.0):
        self.duration = duration


class _FakeWhisperModel:
    """테스트용 가짜 WhisperModel. transcribe_result 클래스 변수로 제어."""
    transcribe_result: list[_FakeSegment] = [_FakeSegment(" 안녕하세요 반갑습니다")]
    transcribe_info: _FakeInfo = _FakeInfo(duration=5.0)

    def __init__(self, *args, **kwargs):
        pass

    def transcribe(self, *args, **kwargs):
        return iter(self.transcribe_result), self.transcribe_info


_fw_stub = types.ModuleType("faster_whisper")
_fw_stub.WhisperModel = _FakeWhisperModel  # type: ignore[attr-defined]
sys.modules.setdefault("faster_whisper", _fw_stub)

# ── app 임포트 (stub 주입 후) ─────────────────────────────────────────────────
import config
from fastapi.testclient import TestClient

# startup 이 실제 모델 로드를 시도하므로 직접 주입
import server as srv
app = srv.app
app.state.model = _FakeWhisperModel()
app.state.model_error = None

client = TestClient(app, raise_server_exceptions=False)


# ── fixture: 임시 REF_ROOT ────────────────────────────────────────────────────

@pytest.fixture()
def tmp_ref_root(monkeypatch, tmp_path):
    """임시 REF_ROOT 를 config 에 주입하고 테스트 후 정리."""
    monkeypatch.setattr(config, "REF_ROOT", str(tmp_path))
    # clone_stt 모듈도 동일 config 객체를 참조하므로 같이 패치
    import clone_stt
    monkeypatch.setattr(clone_stt.config, "REF_ROOT", str(tmp_path))
    return tmp_path


def _make_voice_wav(ref_root, clone_id: str, content: bytes = b"RIFF....") -> str:
    """테스트용 voice.wav 더미 파일 생성."""
    clone_dir = os.path.join(str(ref_root), clone_id)
    os.makedirs(clone_dir, exist_ok=True)
    wav_path = os.path.join(clone_dir, "voice.wav")
    with open(wav_path, "wb") as f:
        f.write(content)
    return wav_path


# ── 테스트 케이스 ─────────────────────────────────────────────────────────────

class TestTranscribeNormal:
    def test_ref_text_created(self, tmp_ref_root):
        """정상 전사 → ref_text.txt + meta.json 생성, 임시파일 잔존 없음."""
        _make_voice_wav(tmp_ref_root, "test-clone-01")
        _FakeWhisperModel.transcribe_result = [_FakeSegment(" 안녕하세요 반갑습니다")]
        _FakeWhisperModel.transcribe_info = _FakeInfo(duration=4.5)

        res = client.post("/transcribe", json={"clone_id": "test-clone-01"})
        assert res.status_code == 200
        body = res.json()
        assert body["ok"] is True
        assert body["ref_text"] == "안녕하세요 반갑습니다"
        assert body["chars"] == len("안녕하세요 반갑습니다")
        assert body["model"] == config.MODEL

        # ref_text.txt 내용 확인
        txt_path = os.path.join(str(tmp_ref_root), "test-clone-01", "ref_text.txt")
        assert os.path.isfile(txt_path)
        assert open(txt_path, encoding="utf-8").read() == "안녕하세요 반갑습니다"

        # meta.json 내용 확인
        meta_path = os.path.join(str(tmp_ref_root), "test-clone-01", "ref_text.meta.json")
        assert os.path.isfile(meta_path)
        meta = json.loads(open(meta_path, encoding="utf-8").read())
        assert meta["model"] == config.MODEL
        assert meta["lang"] == config.LANG
        assert "transcribed_at" in meta

        # 임시파일 잔존 없음
        clone_dir = os.path.join(str(tmp_ref_root), "test-clone-01")
        tmp_files = [f for f in os.listdir(clone_dir) if f.startswith(".tmp.")]
        assert tmp_files == [], f"임시파일 잔존: {tmp_files}"

    def test_x_stt_ms_header(self, tmp_ref_root):
        """X-STT-Ms 헤더 존재."""
        _make_voice_wav(tmp_ref_root, "test-clone-02")
        _FakeWhisperModel.transcribe_result = [_FakeSegment(" 테스트입니다 반갑습니다")]
        res = client.post("/transcribe", json={"clone_id": "test-clone-02"})
        assert res.status_code == 200
        assert "X-STT-Ms" in res.headers


class TestTranscribeEmpty:
    def test_empty_transcript_returns_422(self, tmp_ref_root):
        """빈 전사 → 422, ref_text.txt 미생성."""
        _make_voice_wav(tmp_ref_root, "silent-clone")
        _FakeWhisperModel.transcribe_result = [_FakeSegment("   ")]  # 공백만
        _FakeWhisperModel.transcribe_info = _FakeInfo(duration=2.0)

        res = client.post("/transcribe", json={"clone_id": "silent-clone"})
        assert res.status_code == 422

        # ref_text.txt 미생성
        txt_path = os.path.join(str(tmp_ref_root), "silent-clone", "ref_text.txt")
        assert not os.path.isfile(txt_path)


class TestCloneNotFound:
    def test_missing_clone_returns_404(self, tmp_ref_root):
        """존재하지 않는 clone_id → 404."""
        res = client.post("/transcribe", json={"clone_id": "nonexistent-clone-xyz"})
        assert res.status_code == 404


class TestPathTraversal:
    def test_dotdot_clone_id_rejected(self, tmp_ref_root):
        """.. 포함 clone_id → 400."""
        res = client.post("/transcribe", json={"clone_id": "../etc/passwd"})
        assert res.status_code == 400

    def test_absolute_clone_id_rejected(self, tmp_ref_root):
        """/etc 같은 절대경로 형식 clone_id → 400."""
        res = client.post("/transcribe", json={"clone_id": "/etc/passwd"})
        assert res.status_code == 400

    def test_slash_in_clone_id_rejected(self, tmp_ref_root):
        """슬래시 포함 clone_id → 400."""
        res = client.post("/transcribe", json={"clone_id": "foo/bar"})
        assert res.status_code == 400

    def test_transcribe_path_traversal_blocked(self, tmp_ref_root, monkeypatch):
        """transcribe_path: REF_ROOT 외부 경로 → 400."""
        import clone_stt
        # /tmp 등 외부 경로는 허용 prefix 아님
        res = client.post("/transcribe_path", json={
            "wav_path": "/etc/passwd",
            "out_clone_id": "legit-clone",
        })
        assert res.status_code == 400


class TestSanityCheck:
    def test_korean_passes_and_meta_has_hangul_ratio(self, tmp_ref_root):
        """정상 한국어 전사 → 통과, 파일 생성, meta에 hangul_ratio 포함."""
        _make_voice_wav(tmp_ref_root, "sanity-ko-ok")
        _FakeWhisperModel.transcribe_result = [_FakeSegment(" 오늘 날씨가 정말 좋네요 내일도 맑을 것 같아요")]
        _FakeWhisperModel.transcribe_info = _FakeInfo(duration=5.0)

        res = client.post("/transcribe", json={"clone_id": "sanity-ko-ok"})
        assert res.status_code == 200

        meta_path = os.path.join(str(tmp_ref_root), "sanity-ko-ok", "ref_text.meta.json")
        assert os.path.isfile(meta_path)
        meta = json.loads(open(meta_path, encoding="utf-8").read())
        assert "hangul_ratio" in meta
        assert "hangul_count" in meta
        assert "non_space_len" in meta
        assert meta["hangul_ratio"] >= config.MIN_HANGUL_RATIO

    def test_english_only_fails_sanity(self, tmp_ref_root):
        """영어만 전사 → 422, ref_text.txt 미생성."""
        _make_voice_wav(tmp_ref_root, "sanity-eng-fail")
        _FakeWhisperModel.transcribe_result = [_FakeSegment(" Hello my name is John nice to meet you")]
        _FakeWhisperModel.transcribe_info = _FakeInfo(duration=3.0)

        res = client.post("/transcribe", json={"clone_id": "sanity-eng-fail"})
        assert res.status_code == 422
        body = res.json()
        assert "transcript failed sanity" in str(body)

        txt_path = os.path.join(str(tmp_ref_root), "sanity-eng-fail", "ref_text.txt")
        assert not os.path.isfile(txt_path)

    def test_too_few_hangul_fails_sanity(self, tmp_ref_root):
        """한글 3자(MIN_HANGUL=5 미만) → 422, ref_text.txt 미생성."""
        _make_voice_wav(tmp_ref_root, "sanity-short-fail")
        # 한글 3자 + 영어로 채워 ratio는 애매하게 맞출 수 있지만 count 하한 미달
        _FakeWhisperModel.transcribe_result = [_FakeSegment(" 안녕 hi")]
        _FakeWhisperModel.transcribe_info = _FakeInfo(duration=1.0)

        res = client.post("/transcribe", json={"clone_id": "sanity-short-fail"})
        assert res.status_code == 422

        txt_path = os.path.join(str(tmp_ref_root), "sanity-short-fail", "ref_text.txt")
        assert not os.path.isfile(txt_path)

    def test_mixed_korean_english_above_ratio_passes(self, tmp_ref_root):
        """한글+영어 혼용이지만 한글 비율 ≥ MIN_HANGUL_RATIO → 통과."""
        _make_voice_wav(tmp_ref_root, "sanity-mixed-ok")
        # 한글 10자 + 영어 5자 → ratio = 10/15 ≈ 0.667 > 0.4
        _FakeWhisperModel.transcribe_result = [_FakeSegment(" 안녕하세요반갑습니다 hello")]
        _FakeWhisperModel.transcribe_info = _FakeInfo(duration=3.0)

        res = client.post("/transcribe", json={"clone_id": "sanity-mixed-ok"})
        assert res.status_code == 200
        txt_path = os.path.join(str(tmp_ref_root), "sanity-mixed-ok", "ref_text.txt")
        assert os.path.isfile(txt_path)

    def test_boundary_ratio_exactly_04_passes(self, tmp_ref_root):
        """경계값: 한글 비율 정확히 0.4, 한글 5자 → 통과 (MIN_HANGUL_RATIO=0.4 경계 포함).

        "안녕하세요1hello1" → 한글5 / 비공백13 = 0.384... 로 미달이라
        더 깔끔한 구성: 한글5 + 비한글7 = 12자 비공백 → ratio=5/12=0.4166.
        정확히 0.4를 만들려면 한글5 + 비한글7.5 는 불가(정수). 대신
        한글2 + 비한글3 = 5자 → ratio=0.4 정확히(가장 작은 정수쌍): 한글2/5=0.4 이지만
        hangul_count=2 < MIN_HANGUL=5 이라 탈락. hangul_count 5 AND ratio 0.4 동시충족:
        한글5 / 비공백12(=5+7) → 0.4166 → 통과. 정확히 0.4: 한글5/비공백12.5=불가.
        가장 가까운 "정확히 0.4 이상 최소": 한글5/12 = 0.4166 ≥ 0.4 → 통과 확인.
        """
        _make_voice_wav(tmp_ref_root, "sanity-boundary-pass")
        # 한글 5자 "가나다라마" + 영어 7자 "abcdefg" → non_space=12, ratio=5/12≈0.4167
        _FakeWhisperModel.transcribe_result = [_FakeSegment("가나다라마 abcdefg")]
        _FakeWhisperModel.transcribe_info = _FakeInfo(duration=2.0)

        res = client.post("/transcribe", json={"clone_id": "sanity-boundary-pass"})
        assert res.status_code == 200

    def test_boundary_ratio_below_04_fails(self, tmp_ref_root):
        """경계값: 한글 비율 0.4 미만 → 422. '안녕하세요1hello1'=한글5/13≈0.384."""
        _make_voice_wav(tmp_ref_root, "sanity-boundary-fail")
        # 한글 5자 + 영어·숫자 8자 → non_space=13, ratio=5/13≈0.384 < 0.4
        _FakeWhisperModel.transcribe_result = [_FakeSegment("안녕하세요 hello123")]
        _FakeWhisperModel.transcribe_info = _FakeInfo(duration=2.0)

        res = client.post("/transcribe", json={"clone_id": "sanity-boundary-fail"})
        assert res.status_code == 422

    def test_english_only_still_fails_at_04(self, tmp_ref_root):
        """영어 전용은 0.4 기준으로도 여전히 422 탈락."""
        _make_voice_wav(tmp_ref_root, "sanity-eng-fail-04")
        _FakeWhisperModel.transcribe_result = [_FakeSegment(" Hello my name is John nice to meet you")]
        _FakeWhisperModel.transcribe_info = _FakeInfo(duration=3.0)

        res = client.post("/transcribe", json={"clone_id": "sanity-eng-fail-04"})
        assert res.status_code == 422


class TestAtomicWriteConcurrency:
    """BLOCKER 보정: 동일 clone_id 동시 write_ref_text → race-free 검증."""

    def test_concurrent_write_ref_text_no_tmp_leftover(self, tmp_ref_root):
        """N=8 스레드가 같은 clone_id에 동시 write_ref_text 호출.

        검증:
          - 전부 성공(예외 없음)
          - 최종 ref_text.txt 파일 1개 존재
          - .tmp.* 임시파일 잔존 0개
        """
        import clone_stt

        clone_id = "concurrent-clone"
        clone_dir = os.path.join(str(tmp_ref_root), clone_id)
        os.makedirs(clone_dir, exist_ok=True)

        # 더미 voice.wav (os.stat 대상)
        wav_path = os.path.join(clone_dir, "voice.wav")
        with open(wav_path, "wb") as f:
            f.write(b"RIFF....")

        n_threads = 8
        errors: list[Exception] = []
        lock = threading.Lock()

        def _write(i: int):
            try:
                clone_stt.write_ref_text(
                    clone_id=clone_id,
                    text=f"안녕하세요 동시테스트{i}",
                    wav_path=wav_path,
                    model="test-model",
                    lang="ko",
                    duration_sec=3.0,
                    segments_count=1,
                    ref_root=str(tmp_ref_root),
                )
            except Exception as e:
                with lock:
                    errors.append(e)

        with ThreadPoolExecutor(max_workers=n_threads) as pool:
            futures = [pool.submit(_write, i) for i in range(n_threads)]
            for f in as_completed(futures):
                pass  # 결과 수집 (예외는 _write 안에서 수집)

        # 예외 없음
        assert errors == [], f"동시 쓰기 중 예외 발생: {errors}"

        # 최종 파일 존재
        txt_path = os.path.join(clone_dir, "ref_text.txt")
        assert os.path.isfile(txt_path), "ref_text.txt 미생성"

        meta_path = os.path.join(clone_dir, "ref_text.meta.json")
        assert os.path.isfile(meta_path), "ref_text.meta.json 미생성"

        # tmp 잔존 없음
        tmp_files = [f for f in os.listdir(clone_dir) if f.startswith(".tmp.")]
        assert tmp_files == [], f"임시파일 잔존: {tmp_files}"

    def test_concurrent_different_clones_no_cross_contamination(self, tmp_ref_root):
        """서로 다른 clone_id N개 동시 write → 각자 파일에 올바른 내용."""
        import clone_stt

        n = 6
        clones = [f"clone-cc-{i:02d}" for i in range(n)]
        for clone_id in clones:
            d = os.path.join(str(tmp_ref_root), clone_id)
            os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, "voice.wav"), "wb") as f:
                f.write(b"RIFF....")

        errors: list[Exception] = []
        lock = threading.Lock()

        def _write(clone_id: str):
            try:
                clone_stt.write_ref_text(
                    clone_id=clone_id,
                    text=f"식별텍스트_{clone_id}",
                    wav_path=os.path.join(str(tmp_ref_root), clone_id, "voice.wav"),
                    model="test-model",
                    lang="ko",
                    duration_sec=2.0,
                    segments_count=1,
                    ref_root=str(tmp_ref_root),
                )
            except Exception as e:
                with lock:
                    errors.append(e)

        with ThreadPoolExecutor(max_workers=n) as pool:
            futures = [pool.submit(_write, c) for c in clones]
            for f in as_completed(futures):
                pass

        assert errors == [], f"예외 발생: {errors}"

        for clone_id in clones:
            txt_path = os.path.join(str(tmp_ref_root), clone_id, "ref_text.txt")
            content = open(txt_path, encoding="utf-8").read()
            assert content == f"식별텍스트_{clone_id}", \
                f"{clone_id} 내용 오염: {content!r}"


class TestHealthz:
    def test_healthz_ok(self):
        res = client.get("/healthz")
        assert res.status_code == 200
        body = res.json()
        assert body["ok"] is True
        assert body["service"] == "stt-afterlife"
        assert "model" in body
        assert "device" in body
        assert "lang" in body

    def test_healthz_model_not_loaded(self):
        """모델 없을 때 ok:false 이지만 200 응답(서비스 뜸)."""
        original = app.state.model
        app.state.model = None
        app.state.model_error = "test error"
        try:
            res = client.get("/healthz")
            assert res.status_code == 200
            assert res.json()["ok"] is False
        finally:
            app.state.model = original
            app.state.model_error = None
