"""t088 연속 시뮬레이션: 무음↔발화 패턴 → 단일 연속 mp4.

phase_token 위상 이어가기로 무음 청크와 발화 청크를 연속 렌더한다.
slew on/off(FIFTH_HEAD_SLEW_FRAMES=0|5) 서버 기동 환경에 따라 두 버전 mp4를 생성해
무음↔발화 전환 매끄러움을 육안 비교한다.

===========================================================================
실행법 (가비아 컨테이너 내부 — 직접 실행 말고 _remote_t088_sim_run.sh 사용 권장):

  docker exec fifth_poc_flp bash -c \\
    "LD_LIBRARY_PATH=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib \\
     PYTHONPATH=/root/FasterLivePortrait \\
     FIFTH_CFG_YAML=/root/FasterLivePortrait/configs/trt_infer.yaml \\
     /root/miniconda3/bin/python /root/FasterLivePortrait/t088_cont/t088_continuation_sim.py \\
       --answer  /home/afterlife/afterlife-server/.fifth-tmp/t088/seq.wav \\
       --src     /home/afterlife/afterlife-server/.fifth-tmp/t088/face.jpg \\
       --out     /home/afterlife/afterlife-server/.fifth-tmp/t088/seq_slewoff.mp4 \\
       --pattern silence,speech,silence,speech \\
       --server  http://127.0.0.1:8811"

  stdout: JSON {out_path, slew_frames_server, n_frames_total, total_sec, frame_counts, timestamps}
  stderr: 진행 로그
===========================================================================
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional

import numpy as np
import soundfile as sf

from t088_continuation_compare import _parse_raw_render_response


# ---------------------------------------------------------------------------
# 순수 유틸 — 로컬 단위 테스트 가능 (GPU/HTTP 불필요)
# ---------------------------------------------------------------------------

def make_silence_wav(out_path: str, duration_sec: float, sr: int = 16000) -> str:
    """무음 wav 파일 생성.

    Args:
        out_path: 저장 경로.
        duration_sec: 길이(초). 0 이하이면 0샘플 wav.
        sr: 샘플레이트 (기본 16000).
    Returns:
        out_path (편의 반환).
    """
    n_samples = max(0, int(round(duration_sec * sr)))
    sf.write(out_path, np.zeros(n_samples, dtype=np.float32), sr)
    return out_path


def parse_pattern(
    pattern_str: str,
    answer_wav: str,
    silence_wav: str,
) -> list[dict]:
    """패턴 문자열 파싱 → 청크 목록.

    Args:
        pattern_str: "silence,speech,silence,speech" 형식.
        answer_wav: speech 청크 wav 경로.
        silence_wav: silence 청크 wav 경로.
    Returns:
        [{"type": "silence"|"speech", "wav": str}, ...]
    Raises:
        ValueError: 패턴 요소가 'silence' 또는 'speech' 가 아닌 경우.
    """
    chunks: list[dict] = []
    for token in pattern_str.split(","):
        t = token.strip().lower()
        if t == "silence":
            chunks.append({"type": "silence", "wav": silence_wav})
        elif t == "speech":
            chunks.append({"type": "speech", "wav": answer_wav})
        else:
            raise ValueError(
                f"패턴 요소는 'silence' 또는 'speech' 여야 함, got: {t!r}"
            )
    return chunks


def compute_chunk_timestamps(
    frame_counts: list[int],
    fps: float = 25.0,
) -> list[dict]:
    """청크별 시작/끝 타임스탬프 계산(초).

    Args:
        frame_counts: 각 청크 실측 렌더 프레임 수.
        fps: 영상 프레임레이트.
    Returns:
        [{"chunk": int, "start_sec": float, "end_sec": float, "n_frames": int}, ...]
    """
    timestamps: list[dict] = []
    elapsed = 0.0
    for i, n in enumerate(frame_counts):
        dur = n / fps
        timestamps.append({
            "chunk": i,
            "start_sec": round(elapsed, 3),
            "end_sec": round(elapsed + dur, 3),
            "n_frames": n,
        })
        elapsed += dur
    return timestamps


def build_audio_track_array(
    chunks: list[dict],
    frame_counts: list[int],
    fps: float = 25.0,
    sr: int = 16000,
) -> np.ndarray:
    """청크 wav를 프레임 수 기준 타임라인으로 concat → 모노 float32 배열.

    각 청크 오디오를 (n_frames / fps * sr) 샘플 길이로 자르거나 zero-pad한다.
    무음 청크 wav는 이미 전부 0이므로 별도 처리 불필요.

    Args:
        chunks: parse_pattern 반환값.
        frame_counts: 각 청크 실측 렌더 프레임 수.
        fps: 영상 프레임레이트.
        sr: 출력 샘플레이트.
    Returns:
        모노 float32 numpy 배열.
    """
    segments: list[np.ndarray] = []
    for chunk, n_frames in zip(chunks, frame_counts):
        target_samples = max(0, int(round(n_frames / fps * sr)))
        if target_samples == 0:
            segments.append(np.zeros(0, dtype=np.float32))
            continue
        y, sr_file = sf.read(chunk["wav"], dtype="float32")
        if y.ndim > 1:
            y = y.mean(axis=1)
        # sr 불일치 시 선형 리샘플 (resampy 미설치 환경 대응)
        if sr_file != sr:
            new_len = int(len(y) * sr / sr_file)
            if new_len > 0:
                xp = np.linspace(0.0, float(len(y) - 1), new_len)
                y = np.interp(xp, np.arange(len(y), dtype=np.float64), y).astype(np.float32)
            else:
                y = np.zeros(0, dtype=np.float32)
        # 길이 맞춤 (자르거나 zero-pad)
        if len(y) >= target_samples:
            y = y[:target_samples]
        else:
            y = np.pad(y, (0, target_samples - len(y)))
        segments.append(y)
    return np.concatenate(segments) if segments else np.zeros(0, dtype=np.float32)


# ---------------------------------------------------------------------------
# HTTP 렌더 — 컨테이너 의존 (테스트 대상 제외)
# ---------------------------------------------------------------------------

def _post_render_chunk(
    server_url: str,
    wav_path: str,
    src_path: str,
    phase_token: Optional[dict] = None,
) -> tuple[list[bytes], Optional[dict]]:
    """POST /oth-path → (jpeg_frames, end_tok_dict|None).

    _parse_raw_render_response 는 t088_continuation_compare.py 에서 재사용.

    Args:
        server_url: 렌더서버 URL.
        wav_path: wav 경로 (컨테이너 내).
        src_path: 얼굴 소스 경로 (컨테이너 내).
        phase_token: 이전 청크 end_tok dict (None = 첫 청크 stateless).
    Returns:
        (jpeg_frames_bytes, end_tok_dict|None)
    Raises:
        RuntimeError: /render 비-200 응답 또는 TOK: 파싱 실패.
    """
    import http.client
    import urllib.parse

    parsed = urllib.parse.urlparse(server_url)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 8811

    body_obj: dict = {"wav_path": wav_path, "video_path": src_path}
    if phase_token is not None:
        body_obj["phase_token"] = phase_token

    body = json.dumps(body_obj).encode()
    conn = http.client.HTTPConnection(host, port, timeout=180)
    try:
        conn.request(
            "POST", "/render", body=body,
            headers={
                "Content-Length": str(len(body)),
                "Content-Type": "application/json",
            },
        )
        resp = conn.getresponse()
        if resp.status != 200:
            raise RuntimeError(
                f"/render 응답 {resp.status}: "
                + resp.read()[:300].decode(errors="replace")
            )
        raw = resp.read()
    finally:
        conn.close()

    return _parse_raw_render_response(raw)


# ---------------------------------------------------------------------------
# ffmpeg mp4 인코딩
# ---------------------------------------------------------------------------

def encode_mp4(
    jpeg_frames: list[bytes],
    audio_array: np.ndarray,
    out_path: str,
    fps: float = 25.0,
    sr: int = 16000,
) -> None:
    """JPEG 프레임 목록 + 오디오 배열 → mp4(H.264 + AAC).

    JPEG bytes 를 ffmpeg stdin pipe 로 주입.
    오디오는 임시 wav 파일로 저장 후 -i 로 입력.

    Args:
        jpeg_frames: 렌더된 JPEG bytes 목록.
        audio_array: 모노 float32 오디오 배열.
        out_path: 출력 mp4 경로.
        fps: 영상 프레임레이트.
        sr: 오디오 샘플레이트.
    Raises:
        RuntimeError: ffmpeg 비-0 종료 코드.
    """
    with tempfile.TemporaryDirectory(prefix="t088sim_") as tmp:
        audio_path = str(Path(tmp) / "audio.wav")
        sf.write(audio_path, audio_array, sr)

        cmd = [
            "ffmpeg", "-y",
            "-f", "image2pipe", "-r", str(fps), "-vcodec", "mjpeg", "-i", "pipe:0",
            "-i", audio_path,
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-ar", str(sr),
            "-shortest",
            out_path,
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        assert proc.stdin is not None
        for frame in jpeg_frames:
            proc.stdin.write(frame)
        proc.stdin.close()
        _, stderr = proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(
                f"ffmpeg 종료 코드 {proc.returncode}:\n"
                + stderr.decode(errors="replace")[-600:]
            )


# ---------------------------------------------------------------------------
# 메인 시뮬 루틴
# ---------------------------------------------------------------------------

def run_sim(
    answer_wav: str,
    silence_sec: float,
    pattern_str: str,
    src_path: str,
    out_path: str,
    server_url: str,
    slew_frames: Optional[int] = None,
    fps: float = 25.0,
    sr: int = 16000,
) -> dict:
    """무음↔발화 패턴 연속 렌더 → mp4 출력.

    서버 FIFTH_HEAD_SLEW_FRAMES 는 서버 기동 env 로 제어(이 함수는 HTTP 클라이언트).
    slew_frames 인자는 메타데이터 JSON 기록용.

    Args:
        answer_wav: 발화 청크 wav (컨테이너/공유마운트 경로).
        silence_sec: 무음 청크 길이(초).
        pattern_str: "silence,speech,silence,speech" 형식.
        src_path: 얼굴 사진 경로 (컨테이너 내).
        out_path: 출력 mp4 경로.
        server_url: 렌더서버 URL.
        slew_frames: 서버 FIFTH_HEAD_SLEW_FRAMES 값 (메타 기록용, None=env 참조).
        fps: 영상 프레임레이트.
        sr: 오디오 샘플레이트.
    Returns:
        결과 메타 dict (JSON 은 stdout 에도 출력).
    """
    _slew = slew_frames if slew_frames is not None else int(
        os.environ.get("FIFTH_HEAD_SLEW_FRAMES", "5")
    )
    print(f"[sim] FIFTH_HEAD_SLEW_FRAMES(서버)={_slew}", file=sys.stderr)
    print(f"[sim] pattern={pattern_str}", file=sys.stderr)
    print(f"[sim] silence_sec={silence_sec}", file=sys.stderr)

    with tempfile.TemporaryDirectory(prefix="t088sim_") as tmp:
        silence_wav = make_silence_wav(str(Path(tmp) / "silence.wav"), silence_sec, sr)

        chunks = parse_pattern(pattern_str, answer_wav, silence_wav)
        print(
            f"[sim] {len(chunks)} 청크: {[c['type'] for c in chunks]}",
            file=sys.stderr,
        )

        # ---- 연속 렌더 (phase_token 위상 이어가기) ---
        all_frames: list[bytes] = []
        frame_counts: list[int] = []
        phase_token: Optional[dict] = None  # 첫 청크 = stateless (이전 상태 없음)

        for i, chunk in enumerate(chunks):
            ctype = chunk["type"]
            print(f"[sim] [{i+1}/{len(chunks)}] {ctype} 렌더 중...", file=sys.stderr)
            frames, end_tok = _post_render_chunk(
                server_url, chunk["wav"], src_path, phase_token
            )
            all_frames.extend(frames)
            frame_counts.append(len(frames))
            phase_token = end_tok  # None이면 다음 청크도 stateless
            print(
                f"[sim]   -> {len(frames)} frames, tok={end_tok}",
                file=sys.stderr,
            )

        total_frames = len(all_frames)
        print(f"[sim] 총 {total_frames} 프레임", file=sys.stderr)

        # ---- 타임스탬프 ---
        timestamps = compute_chunk_timestamps(frame_counts, fps)
        for ts in timestamps:
            ctype = chunks[ts["chunk"]]["type"]
            print(
                f"[sim]   chunk[{ts['chunk']}] {ctype:7s} "
                f"{ts['start_sec']:.2f}s ~ {ts['end_sec']:.2f}s "
                f"({ts['n_frames']} frames)",
                file=sys.stderr,
            )

        # ---- 오디오 트랙 ---
        audio = build_audio_track_array(chunks, frame_counts, fps=fps, sr=sr)

        # ---- mp4 인코딩 ---
        Path(out_path).parent.mkdir(parents=True, exist_ok=True)
        print(f"[sim] mp4 인코딩 -> {out_path}", file=sys.stderr)
        encode_mp4(all_frames, audio, out_path, fps=fps, sr=sr)
        print(f"[sim] 완료: {out_path}", file=sys.stderr)

    result: dict = {
        "out_path": out_path,
        "slew_frames_server": _slew,
        "n_frames_total": total_frames,
        "total_sec": round(total_frames / fps, 2),
        "frame_counts": frame_counts,
        "chunk_types": [c["type"] for c in chunks],
        "timestamps": timestamps,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="t088 연속 시뮬: 무음↔발화 패턴 -> 연속 mp4 (slew on/off 육안 비교용)",
    )
    parser.add_argument("--answer", required=True, help="발화 wav 경로 (컨테이너/공유마운트)")
    parser.add_argument("--src", required=True, help="얼굴 사진 경로 (컨테이너/공유마운트)")
    parser.add_argument("--out", required=True, help="출력 mp4 경로")
    parser.add_argument(
        "--silence-sec", type=float, default=2.0,
        help="무음 청크 길이(초, 기본 2.0)",
    )
    parser.add_argument(
        "--pattern", default="silence,speech,silence,speech",
        help="청크 패턴 (기본: silence,speech,silence,speech)",
    )
    parser.add_argument(
        "--server", default="http://127.0.0.1:8811",
        help="렌더서버 URL (기본: http://127.0.0.1:8811)",
    )
    parser.add_argument(
        "--slew-frames", type=int, default=None,
        help="서버 FIFTH_HEAD_SLEW_FRAMES 값 (메타데이터 기록용, 실제 제어는 서버 env)",
    )
    args = parser.parse_args()

    run_sim(
        answer_wav=args.answer,
        silence_sec=args.silence_sec,
        pattern_str=args.pattern,
        src_path=args.src,
        out_path=args.out,
        server_url=args.server,
        slew_frames=args.slew_frames,
    )


if __name__ == "__main__":
    main()
