import io
import wave

from artifact_store import ArtifactStore
from store_recorder import StoreRecorder


def _make_wav(pcm_bytes: bytes, sr: int = 16000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm_bytes)
    return buf.getvalue()


def test_begin_turn_returns_new_run_and_finalize_writes_llm_and_wav(tmp_path):
    store = ArtifactStore(str(tmp_path))
    rec = StoreRecorder(store)

    turn = rec.begin_turn("say", "안녕", seq=1)
    turn.append_token("안")
    turn.append_token("녕")
    turn.append_token("하세요")
    wav_bytes = _make_wav(b"\x01\x00" * 100, sr=16000)
    turn.append_wav(wav_bytes)
    turn.finalize()

    # run_id 는 ArtifactStore.new_run() 이 만든 것과 동일 포맷이어야 함.
    runs = store.list_runs()
    assert len(runs) == 1
    rid = runs[0]["run_id"]

    assert store.load_text(rid, "llm.txt") == "안녕하세요"
    # 단일 wav_chunk → 그대로 저장(재인코딩 없음)
    assert store.load_bytes(rid, "answer.wav") == wav_bytes


def test_finalize_concats_multiple_wav_chunks_into_single_valid_wav(tmp_path):
    store = ArtifactStore(str(tmp_path))
    rec = StoreRecorder(store)

    turn = rec.begin_turn("say", "text", seq=None)
    turn.append_token("hi")
    chunk1 = _make_wav(b"\x01\x00" * 50, sr=16000)
    chunk2 = _make_wav(b"\x02\x00" * 60, sr=16000)
    turn.append_wav(chunk1)
    turn.append_wav(chunk2)
    turn.finalize()

    runs = store.list_runs()
    rid = runs[0]["run_id"]
    merged = store.load_bytes(rid, "answer.wav")

    # 결과가 단일 유효 wav 여야 함(wave 모듈로 open 가능 + 프레임수 합산).
    with wave.open(io.BytesIO(merged), "rb") as r:
        assert r.getframerate() == 16000
        assert r.getnchannels() == 1
        assert r.getnframes() == 50 + 60


def test_finalize_meta_has_mode_and_counts(tmp_path):
    store = ArtifactStore(str(tmp_path))
    rec = StoreRecorder(store)

    turn = rec.begin_turn("say", "text", seq=3)
    turn.append_token("a")
    turn.append_token("b")
    turn.append_wav(_make_wav(b"\x00\x00" * 10))
    turn.finalize(extra="x")

    runs = store.list_runs()
    meta = runs[0]
    assert meta["mode"] == "say"
    assert meta["answer_tokens"] == 2
    assert meta["answer_chars"] == 2
    assert meta["wav_chunks"] == 1
    assert meta["extra"] == "x"
    assert meta["pinned"] is False   # store.pin() 미호출 — 기본 unpinned 유지


def test_append_frames_is_noop():
    from store_recorder import StoreTurn
    from artifact_store import ArtifactStore
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        store = ArtifactStore(td)
        rid = store.new_run()
        turn = StoreTurn(store, rid, "say")
        turn.append_frames([object(), object()], pcm48=None, fps=25)  # 예외 없이 무시
        turn.finalize()
