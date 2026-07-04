"""store_recorder.py — ArtifactStore 기반 recorder(T-109 lab-tuner).

prethird recorder.py의 Recorder/Turn 계약(참고: prethird/scripts/recorder.py)과
동일한 인터페이스를 구현해, pipeline_factory가 세션의 sess.recorder를
prethird 기본 recorder(NullRecorder/CallRecorder) 대신 이걸로 교체할 수 있게 한다.
prethird 코드는 무수정 — 계약(begin_turn/append_token/append_wav/append_frames/
finalize)만 그대로 흉내낸다.

  Recorder.begin_turn(mode, text, seq=None) -> Turn
  Turn.append_token(tok) / append_wav(wav_bytes) / append_frames(frames, pcm48=None, fps=25)
  Turn.finalize(**meta)

결과: 정상 say 1턴 → ArtifactStore에 run 1개(llm.txt=응답 전문, answer.wav=단일
유효 wav, meta.json=mode·토큰수·wav수) → /replay/tts·/replay/fifth가 실데이터로 동작.
"""
from __future__ import annotations

import io
import json
import wave

import numpy as np

from audio_utils import _decode_wav   # prethird


def _concat_wavs(chunks: list[bytes]) -> bytes | None:
    """여러 완전한 wav bytes → PCM 디코드 후 concat → 단일 유효 wav(bytes) 재인코딩.

    깨진 청크는 개별 skip(정상 청크만으로 조립). 전부 실패하면 None.
    같은 sr 가정(첫 유효 청크의 sr을 기준으로 사용).
    """
    pcm_list = []
    sr = None
    for chunk in chunks:
        try:
            arr, chunk_sr, _ch = _decode_wav(chunk)
        except Exception:
            continue
        if sr is None:
            sr = chunk_sr
        pcm_list.append(arr)
    if sr is None or not pcm_list:
        return None
    merged = np.concatenate(pcm_list).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(merged.tobytes())
    return buf.getvalue()


class StoreTurn:
    """턴 1개 — ArtifactStore run 1개에 대응."""

    def __init__(self, store, run_id: str, mode: str):
        self._store = store
        self._run_id = run_id
        self._mode = mode
        self._tokens: list[str] = []
        self._wav_chunks: list[bytes] = []

    def append_token(self, tok) -> None:
        self._tokens.append(str(tok))

    def append_wav(self, wav_bytes: bytes) -> None:
        self._wav_chunks.append(wav_bytes)

    def append_frames(self, frames, pcm48=None, fps: int = 25) -> None:
        # lab-tuner는 프레임 저장 불필요 — /replay/fifth가 answer.wav로부터
        # 공유 라이브 렌더를 직접 재호출하므로 프레임 자체를 보관할 필요 없음.
        pass

    def finalize(self, **meta) -> None:
        answer = "".join(self._tokens)
        self._store.save_text(self._run_id, "llm.txt", answer)

        wav_count = len(self._wav_chunks)
        if wav_count == 1:
            self._store.save_bytes(self._run_id, "answer.wav", self._wav_chunks[0])
        elif wav_count > 1:
            merged = _concat_wavs(self._wav_chunks)
            if merged is not None:
                self._store.save_bytes(self._run_id, "answer.wav", merged)

        # meta.json 부가정보 병합(store.pin()은 호출하지 않음 — 기본 unpinned 유지).
        try:
            existing = json.loads(self._store.load_text(self._run_id, "meta.json"))
        except Exception:
            existing = {"run_id": self._run_id, "pinned": False}
        m = dict(meta)
        m.update({
            "mode": self._mode,
            "answer_chars": len(answer),
            "answer_tokens": len(self._tokens),
            "wav_chunks": wav_count,
        })
        existing.update(m)
        self._store.save_text(self._run_id, "meta.json", json.dumps(existing, ensure_ascii=False))


class StoreRecorder:
    """ArtifactStore 기반 recorder. prethird Recorder와 동일한 begin_turn 계약."""

    def __init__(self, store):
        self._store = store

    def begin_turn(self, mode: str, text: str, seq=None) -> StoreTurn:
        run_id = self._store.new_run()
        return StoreTurn(self._store, run_id, mode)
