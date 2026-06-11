"""recorder.py — prethird 통화 턴 기록 (text/wav/mp4) + 응답누락 진단.

설계 원칙:
- NullObject 패턴: 기록 루트가 쓰기 불가하면 NullRecorder 반환 → 통화 영향 0.
- 모든 파일 I/O 실패 흡수: 기록은 부가 기능, 통화 흐름을 절대 막지 않는다.
- 턴 prefix = say 수신 unixtime ms → input/answer 짝맞춤·시간순 정렬.
"""
from __future__ import annotations

import io
import json
import logging
import os
import re
import time
import wave
from typing import Callable

log = logging.getLogger("prethird.recorder")

_SAFE_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


class NullTurn:
    """기록 비활성 시 무해한 no-op 턴."""

    def append_token(self, tok: str) -> None:
        pass

    def append_wav(self, wav_bytes: bytes) -> None:
        pass

    def append_frames(self, frames, pcm48=None, fps: int = 25) -> None:
        pass

    def finalize(self, **meta) -> None:
        pass


NULL_TURN = NullTurn()


class NullRecorder:
    """기록 비활성 — 모든 호출 no-op."""

    def begin_turn(self, mode: str, text: str, seq=None) -> NullTurn:
        return NULL_TURN


def _secure_write(path: str, data: str) -> None:
    """0o600 권한으로 텍스트 파일 생성·쓰기. 실패 시 OSError 전파 (호출부에서 except)."""
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(data)


def make_recorder(clone_id, session_id: str, root: str | None = None,
                  time_fn: Callable[[], float] = time.time):
    """기록 루트 쓰기 가능 여부를 검사해 CallRecorder 또는 NullRecorder 반환."""
    if root is None:
        root = os.environ.get("PRETHIRD_RECORDS_ROOT", "/data/records")
    # H-2: realpath로 정규화 — symlink 탈출 방지
    root = os.path.realpath(root)
    cid = str(clone_id) if clone_id is not None else "_anon"
    if cid != "_anon" and not _SAFE_RE.match(cid):
        cid = "_anon"
    sid = session_id if _SAFE_RE.match(str(session_id)) else "_nosess"
    target = os.path.join(root, cid)
    try:
        # H-1: 디렉토리 0o700 권한
        os.makedirs(target, mode=0o700, exist_ok=True)
        # H-2: makedirs 후 실제 경로가 root 하위인지 검증
        real_target = os.path.realpath(target)
        if os.path.commonpath([real_target, root]) != root:
            log.warning("records 비활성(symlink 탈출 감지 %s → %s)", target, real_target)
            return NullRecorder()
        # H-2: probe 파일 TOCTOU 제거 → os.access 로 쓰기 가능 확인
        if not os.access(target, os.W_OK):
            log.warning("records 비활성(쓰기 불가 %s)", target)
            return NullRecorder()
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
        self._frames: list = []
        self._fps = 25
        self._record_mp4 = os.environ.get("PRETHIRD_RECORD_MP4", "0") == "1"

    def _path(self, suffix: str) -> str:
        return os.path.join(self._dir, f"{self._ts}-{suffix}")

    def append_token(self, tok: str) -> None:
        # B-1: 비-str 방어
        self._tokens.append(str(tok))

    def append_wav(self, wav_bytes: bytes) -> None:
        self._wav_chunks.append(wav_bytes)

    def append_frames(self, frames, pcm48=None, fps: int = 25) -> None:
        if not self._record_mp4:
            return
        self._frames.extend(frames)
        self._fps = fps

    def finalize(self, **meta) -> None:
        answer = "".join(self._tokens)
        # B-1: OSError → Exception (surrogate 등 UnicodeEncodeError 흡수)
        try:
            _secure_write(self._path("answer.txt"), answer)
        except Exception as e:
            log.warning("answer.txt 기록 실패 ts=%s: %s", self._ts, e)
        # answer.wav 합본 — 청크별 완전 wav를 PCM 이어붙여 단일 wav 재조립 (0o600)
        if self._wav_chunks:
            try:
                params = None
                frames = bytearray()
                for chunk in self._wav_chunks:
                    with wave.open(io.BytesIO(chunk), "rb") as r:
                        if params is None:
                            params = r.getparams()
                        frames += r.readframes(r.getnframes())
                if params is not None:
                    wpath = self._path("answer.wav")
                    fd = os.open(wpath, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
                    with os.fdopen(fd, "wb") as raw:
                        with wave.open(raw, "wb") as w:
                            w.setnchannels(params.nchannels)
                            w.setsampwidth(params.sampwidth)
                            w.setframerate(params.framerate)
                            w.writeframes(bytes(frames))
            except Exception as e:
                log.warning("answer.wav 합본 실패 ts=%s: %s", self._ts, e)
        # answer.mp4 인코딩 — PRETHIRD_RECORD_MP4=1 일 때만 (RAM·디스크 비용)
        if self._record_mp4 and self._frames:
            try:
                import imageio
                mpath = self._path("answer.mp4")
                imageio.mimwrite(mpath, self._frames, fps=self._fps,
                                 codec="libx264", quality=8)
                try:
                    os.chmod(mpath, 0o600)
                except OSError:
                    pass
            except Exception as e:
                log.warning("answer.mp4 인코딩 실패 ts=%s: %s", self._ts, e)
            finally:
                self._frames = []  # RAM 즉시 회수
        m = dict(meta)
        m.update({
            "ts_ms": self._ts,
            "session": self._sid,
            "answer_chars": len(answer),
            "answer_tokens": len(self._tokens),
            "wav_chunks": len(self._wav_chunks),
            "finalized_ts_ms": int(self._time_fn() * 1000),
        })
        # B-1: OSError → Exception (TypeError from json.dump 흡수)
        try:
            fd = os.open(self._path("meta.json"), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(m, f, ensure_ascii=False, indent=2)
        except Exception as e:
            log.warning("meta.json 기록 실패 ts=%s: %s", self._ts, e)


class CallRecorder:
    """클론별 디렉토리에 턴을 기록."""

    def __init__(self, target_dir: str, sid: str, time_fn):
        self._dir = target_dir
        self._sid = sid
        self._time_fn = time_fn
        # R-1: 단조 ts 보정용
        self._last_ts: int | None = None

    def begin_turn(self, mode: str, text: str, seq=None) -> Turn:
        # R-1: 같은 ms 두 턴 → prefix 충돌 방지
        ts_ms = int(self._time_fn() * 1000)
        if self._last_ts is not None and ts_ms <= self._last_ts:
            ts_ms = self._last_ts + 1
        self._last_ts = ts_ms

        turn = Turn(self._dir, ts_ms, self._sid, self._time_fn)
        header = (
            f"mode: {mode}\nseq: {seq}\nsession: {self._sid}\n"
            f"ts_ms: {ts_ms}\n---\n{text}"
        )
        # B-1: OSError → Exception
        try:
            _secure_write(turn._path("input.txt"), header)
        except Exception as e:
            log.warning("input.txt 기록 실패 ts=%s: %s", ts_ms, e)
        return turn
