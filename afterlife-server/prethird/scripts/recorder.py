"""recorder.py — prethird 통화 턴 기록 (text/wav/mp4) + 응답누락 진단.

설계 원칙:
- NullObject 패턴: 기록 루트가 쓰기 불가하면 NullRecorder 반환 → 통화 영향 0.
- 모든 파일 I/O 실패 흡수: 기록은 부가 기능, 통화 흐름을 절대 막지 않는다.
- 턴 prefix = say 수신 unixtime ms → input/answer 짝맞춤·시간순 정렬.
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
from typing import Callable

log = logging.getLogger("prethird.recorder")

_SAFE_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


class NullTurn:
    """기록 비활성 시 무해한 no-op 턴."""

    def append_token(self, tok: str) -> None:
        pass

    def append_wav(self, wav_bytes: bytes) -> None:
        pass

    def finalize(self, **meta) -> None:
        pass


NULL_TURN = NullTurn()


class NullRecorder:
    """기록 비활성 — 모든 호출 no-op."""

    def begin_turn(self, mode: str, text: str, seq=None) -> NullTurn:
        return NULL_TURN


def make_recorder(clone_id, session_id: str, root: str | None = None,
                  time_fn: Callable[[], float] = time.time):
    """기록 루트 쓰기 가능 여부를 검사해 CallRecorder 또는 NullRecorder 반환."""
    if root is None:
        root = os.environ.get("PRETHIRD_RECORDS_ROOT", "/data/records")
    cid = str(clone_id) if clone_id is not None else "_anon"
    if cid != "_anon" and not _SAFE_RE.match(cid):
        cid = "_anon"
    sid = session_id if _SAFE_RE.match(str(session_id)) else "_nosess"
    target = os.path.join(root, cid)
    try:
        os.makedirs(target, exist_ok=True)
        probe = os.path.join(target, ".write-probe")
        with open(probe, "w") as f:
            f.write("")
        os.unlink(probe)
    except OSError as e:
        log.warning("records 비활성(쓰기 불가 %s): %s", target, e)
        return NullRecorder()
    return CallRecorder(target, sid, time_fn)


class Turn:
    """턴 1개의 기록 핸들. begin_turn에서 input.txt를 즉시 기록."""

    def __init__(self, turn_dir: str, ts_ms: int, sid: str, time_fn):
        self._dir = turn_dir
        self._ts = ts_ms
        self._sid = sid
        self._time_fn = time_fn
        self._tokens: list[str] = []
        self._wav_chunks: list[bytes] = []

    def _path(self, suffix: str) -> str:
        return os.path.join(self._dir, f"{self._ts}-{suffix}")

    def append_token(self, tok: str) -> None:
        self._tokens.append(tok)

    def append_wav(self, wav_bytes: bytes) -> None:
        self._wav_chunks.append(wav_bytes)

    def finalize(self, **meta) -> None:
        answer = "".join(self._tokens)
        try:
            with open(self._path("answer.txt"), "w", encoding="utf-8") as f:
                f.write(answer)
        except OSError as e:
            log.warning("answer.txt 기록 실패 ts=%s: %s", self._ts, e)
        m = dict(meta)
        m.update({
            "ts_ms": self._ts,
            "session": self._sid,
            "answer_chars": len(answer),
            "answer_tokens": len(self._tokens),
            "wav_chunks": len(self._wav_chunks),
            "finalized_ts_ms": int(self._time_fn() * 1000),
        })
        try:
            with open(self._path("meta.json"), "w", encoding="utf-8") as f:
                json.dump(m, f, ensure_ascii=False, indent=2)
        except OSError as e:
            log.warning("meta.json 기록 실패 ts=%s: %s", self._ts, e)


class CallRecorder:
    """클론별 디렉토리에 턴을 기록."""

    def __init__(self, target_dir: str, sid: str, time_fn):
        self._dir = target_dir
        self._sid = sid
        self._time_fn = time_fn

    def begin_turn(self, mode: str, text: str, seq=None) -> Turn:
        ts_ms = int(self._time_fn() * 1000)
        turn = Turn(self._dir, ts_ms, self._sid, self._time_fn)
        header = (
            f"mode: {mode}\nseq: {seq}\nsession: {self._sid}\n"
            f"ts_ms: {ts_ms}\n---\n{text}"
        )
        try:
            with open(turn._path("input.txt"), "w", encoding="utf-8") as f:
                f.write(header)
        except OSError as e:
            log.warning("input.txt 기록 실패 ts=%s: %s", ts_ms, e)
        return turn
