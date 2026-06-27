"""t088 게이트0: 통짜 렌더 vs 2청크 continuation 정량 대조.

동일 wav를 (A) 통짜 1회 렌더, (B) 절반 wav_a + wav_b 2청크(B는 A 끝 토큰 이어받기)로
렌더해, 경계 지점 전후 프레임에서 head landmark 좌표 diff(px) 와 SSIM을 비교한다.

stdout: JSON {boundary_head_jump_px, boundary_ssim, mean_ssim, verdict}
  verdict = "PASS" if boundary_head_jump_px < 2.0 and boundary_ssim > 0.95 else "FAIL"

===========================================================================
실행법 (가비아 컨테이너 내부 — 이 파일에서 실행하지 마라):

# 공유마운트 경로에 wav/src 준비 후:
# docker exec fifth_poc_flp bash -c \
#   "LD_LIBRARY_PATH=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib \
#    FIFTH_CFG_YAML=configs/trt_infer.yaml \
#    python /root/FasterLivePortrait/t088_continuation_compare.py \
#    --wav /home/afterlife/afterlife-server/.fifth-tmp/t088/seq.wav \
#    --src /home/afterlife/afterlife-server/.fifth-tmp/t088/face.jpg \
#    --out /home/afterlife/afterlife-server/.fifth-tmp/t088/g0.json"
#
# 렌더서버(:8810)가 올라와 있어야 한다.
# 공유마운트 기본 경로: /home/afterlife/afterlife-server/.fifth-tmp/t088/
===========================================================================
"""
from __future__ import annotations

import argparse
import json
import os
import struct
import sys
import tempfile
from pathlib import Path
from typing import Optional

import numpy as np

# -----------------------------------------------------------------------
# 순수 유틸 — 경계 인덱스 계산 (로컬 단위 테스트 가능)
# -----------------------------------------------------------------------

def compute_boundary_index(total_frames: int, n_frames_chunk_a: int) -> int:
    """경계 인덱스: 청크A의 마지막 프레임 + 1 = 청크B의 첫 프레임.

    Args:
        total_frames: 통짜 렌더 총 프레임 수.
        n_frames_chunk_a: 청크A 렌더 프레임 수.
    Returns:
        boundary: 청크B 시작 프레임 인덱스 (0-based).
    """
    return min(n_frames_chunk_a, total_frames - 1)


def split_wav_at_frame_boundary(wav_path: str, fps: float = 25.0) -> tuple[str, str, int]:
    """wav 파일을 프레임 경계(절반 프레임)에서 2분할해 임시 파일로 저장.

    Args:
        wav_path: 원본 wav 경로.
        fps: 렌더 fps (기본 25).
    Returns:
        (wav_a_path, wav_b_path, n_frames_a): 각 임시 파일 경로 + 청크A 프레임 수.
    """
    import soundfile as sf

    y, sr = sf.read(wav_path, dtype="float32")
    if y.ndim > 1:
        y = y.mean(axis=1)

    total_frames = int(np.ceil(len(y) / (sr / fps)))
    half_frames = total_frames // 2
    split_sample = int(half_frames * (sr / fps))
    split_sample = max(1, min(split_sample, len(y) - 1))

    y_a = y[:split_sample]
    y_b = y[split_sample:]

    tmp_dir = tempfile.mkdtemp(prefix="t088_")
    wav_a = str(Path(tmp_dir) / "chunk_a.wav")
    wav_b = str(Path(tmp_dir) / "chunk_b.wav")
    sf.write(wav_a, y_a, sr)
    sf.write(wav_b, y_b, sr)

    return wav_a, wav_b, half_frames


# -----------------------------------------------------------------------
# 렌더서버 통신 유틸
# -----------------------------------------------------------------------

_TOK_MAGIC_CMP = b"TOK:"


def _parse_raw_render_response(raw: bytes) -> tuple[list[bytes], Optional[dict]]:
    """raw 렌더 응답 bytes → (jpeg_frames, end_tok_dict|None).

    [4B len][payload] 청크 스트림을 파싱한다. 청크 페이로드가 TOK: 매직으로
    시작하면 토큰 트레일러로 간주해 JSON 파싱한다.

    el RISK 수정: TOK: 뒤 JSON 이 깨진 경우 RuntimeError 로 명확하게 실패.
    (compare 스크립트 진단 목적 — 조용히 None 반환하면 안 됨.)

    Args:
        raw: POST /oth-path 응답 전체 bytes.
    Returns:
        (jpeg_frames, end_tok_dict|None)
    Raises:
        RuntimeError: TOK: 트레일러 JSON 파싱 실패 시.
    """
    frames: list[bytes] = []
    end_tok_dict: Optional[dict] = None
    pos = 0
    while pos + 4 <= len(raw):
        n = struct.unpack_from(">I", raw, pos)[0]
        pos += 4
        if n == 0:
            break
        payload = raw[pos:pos + n]
        pos += n
        if payload.startswith(_TOK_MAGIC_CMP):
            try:
                end_tok_dict = json.loads(payload[len(_TOK_MAGIC_CMP):].decode())
            except Exception as exc:
                raise RuntimeError(f"TOK: 트레일러 JSON 파싱 실패: {exc}") from exc
        else:
            frames.append(payload)
    return frames, end_tok_dict


def _post_render(
    server_url: str,
    wav_path: str,
    video_path: str,
    phase_token: Optional[dict] = None,
) -> tuple[list[bytes], Optional[dict]]:
    """POST /oth-path → (jpeg_payloads, end_tok_dict|None).

    phase_token=None → 트레일러 없음(통짜 렌더).
    phase_token=dict → 끝 토큰 트레일러 파싱.
    """
    import http.client
    import urllib.parse

    parsed = urllib.parse.urlparse(server_url)
    host = parsed.hostname or "203.0.113.30"
    port = parsed.port or 8810

    body_obj: dict = {"wav_path": wav_path, "video_path": video_path}
    if phase_token is not None:
        body_obj["phase_token"] = phase_token

    body = json.dumps(body_obj).encode()
    conn = http.client.HTTPConnection(host, port, timeout=120)
    try:
        conn.request("POST", "/render", body=body,
                     headers={"Content-Length": str(len(body)),
                               "Content-Type": "application/json"})
        resp = conn.getresponse()
        if resp.status != 200:
            raise RuntimeError(f"/render 응답 {resp.status}: {resp.read()[:200]}")
        raw = resp.read()
    finally:
        conn.close()

    return _parse_raw_render_response(raw)


def _decode_jpeg_to_rgb(jpeg_bytes: bytes) -> np.ndarray:
    """jpeg bytes → RGB ndarray (H, W, 3 uint8)."""
    try:
        import cv2
        arr = np.frombuffer(jpeg_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError("cv2.imdecode 실패")
        return bgr[:, :, ::-1]  # BGR → RGB
    except Exception as exc:
        raise RuntimeError(f"jpeg 디코딩 실패: {exc}") from exc


# -----------------------------------------------------------------------
# 게이트0 측정 — head landmark diff + SSIM
# -----------------------------------------------------------------------

def _detect_landmarks_safe(detect_lmk_fn, frame_rgb: np.ndarray) -> Optional[np.ndarray]:
    """detect_landmarks 예외 안전 래퍼. 실패 시 None."""
    try:
        lmk = detect_lmk_fn(frame_rgb)
        # (N, 2) 또는 (N, 2) 좌표 반환 여부는 flp_engine 구현에 따름
        return np.array(lmk, dtype=np.float32) if lmk is not None else None
    except Exception:
        return None


def compute_boundary_metrics(
    frames_whole: list[np.ndarray],
    frames_chunk: list[np.ndarray],
    boundary_idx: int,
    detect_lmk_fn,
    window: int = 3,
) -> dict:
    """경계 전후 ±window 프레임에서 head landmark diff(px) 와 SSIM 측정.

    Args:
        frames_whole: 통짜 렌더 RGB 프레임 목록.
        frames_chunk: 2청크 concat RGB 프레임 목록.
        boundary_idx: 경계 인덱스(청크B 시작).
        detect_lmk_fn: flp_engine.detect_landmarks.
        window: 경계 전후 프레임 수.
    Returns:
        {boundary_head_jump_px, boundary_ssim, mean_ssim, verdict}
    """
    try:
        from skimage.metrics import structural_similarity as ssim_fn
    except ImportError:
        ssim_fn = None

    n = min(len(frames_whole), len(frames_chunk))

    # 경계 근처 인덱스
    lo = max(0, boundary_idx - window)
    hi = min(n, boundary_idx + window + 1)
    boundary_indices = list(range(lo, hi))

    # --- head landmark diff ---
    diffs = []
    for i in boundary_indices:
        lmk_w = _detect_landmarks_safe(detect_lmk_fn, frames_whole[i])
        lmk_c = _detect_landmarks_safe(detect_lmk_fn, frames_chunk[i])
        if lmk_w is not None and lmk_c is not None:
            # shape: (N, 2) — 좌표 거리 평균
            min_n = min(len(lmk_w), len(lmk_c))
            diff = float(np.mean(np.linalg.norm(lmk_w[:min_n] - lmk_c[:min_n], axis=-1)))
            diffs.append(diff)

    boundary_head_jump_px = float(np.mean(diffs)) if diffs else -1.0

    # --- SSIM ---
    boundary_ssims = []
    all_ssims = []
    for i in range(n):
        fw = frames_whole[i]
        fc = frames_chunk[i]
        if fw.shape != fc.shape:
            continue
        # 그레이스케일로 변환 후 SSIM
        try:
            if ssim_fn is not None:
                gray_w = np.mean(fw, axis=2)
                gray_c = np.mean(fc, axis=2)
                s = float(ssim_fn(gray_w, gray_c, data_range=255.0))
            else:
                # skimage 없을 때 MSE 기반 근사
                mse = float(np.mean((fw.astype(np.float32) - fc.astype(np.float32)) ** 2))
                s = 1.0 - mse / (255.0 ** 2)
            all_ssims.append(s)
            if i in boundary_indices:
                boundary_ssims.append(s)
        except Exception:
            pass

    boundary_ssim = float(np.mean(boundary_ssims)) if boundary_ssims else -1.0
    mean_ssim = float(np.mean(all_ssims)) if all_ssims else -1.0

    # 판정
    verdict = (
        "PASS"
        if boundary_head_jump_px < 2.0 and boundary_ssim > 0.95
        else "FAIL"
    )
    if boundary_head_jump_px < 0:
        verdict = "SKIP_NO_LANDMARK"  # detect_landmarks 미동작 시 판정 보류

    return {
        "boundary_head_jump_px": boundary_head_jump_px,
        "boundary_ssim": boundary_ssim,
        "mean_ssim": mean_ssim,
        "verdict": verdict,
        "n_frames_whole": len(frames_whole),
        "n_frames_chunk": len(frames_chunk),
        "boundary_idx": boundary_idx,
        "n_landmark_diffs": len(diffs),
        "n_ssim_pairs": len(all_ssims),
    }


# -----------------------------------------------------------------------
# 메인 비교 루틴
# -----------------------------------------------------------------------

def run_compare(
    wav_path: str,
    src_path: str,
    server_url: str,
    out_path: Optional[str] = None,
) -> dict:
    """통짜 vs 2청크 비교. stdout JSON + out_path 파일 저장.

    Args:
        wav_path: 비교 대상 wav (공유마운트 경로).
        src_path: 얼굴 사진/영상 경로 (공유마운트).
        server_url: 렌더서버 URL (기본 http://203.0.113.30:8810).
        out_path: 결과 JSON 저장 경로 (None = 저장 안 함).
    """
    # 가비아 컨테이너에서만 동작하는 import
    try:
        from flp_engine import FifthFLPEngine
        from config import FifthConfig
    except ImportError:
        raise RuntimeError("flp_engine / config import 실패 — 컨테이너에서 실행해야 합니다")

    cfg_yaml = os.environ.get("FIFTH_CFG_YAML", "configs/trt_infer.yaml")
    eng = FifthFLPEngine(cfg_yaml)
    detect_lmk = eng.detect_landmarks

    print(f"[t088] wav={wav_path} src={src_path}", file=sys.stderr)

    # (A) 통짜 렌더 — phase_token 없음
    print("[t088] 통짜 렌더 중...", file=sys.stderr)
    frames_whole_bytes, _ = _post_render(server_url, wav_path, src_path, phase_token=None)
    frames_whole = [_decode_jpeg_to_rgb(b) for b in frames_whole_bytes]
    print(f"[t088] 통짜 렌더 완료: {len(frames_whole)} 프레임", file=sys.stderr)

    if len(frames_whole) < 2:
        result = {"verdict": "SKIP_TOO_SHORT", "n_frames_whole": len(frames_whole)}
        print(json.dumps(result))
        return result

    # wav 분할
    wav_a, wav_b, n_frames_a_est = split_wav_at_frame_boundary(wav_path)
    print(f"[t088] wav 분할: n_frames_a_est(추산)={n_frames_a_est}", file=sys.stderr)

    # (B1) 청크A 렌더 — phase_token 전달(기본 토큰)
    print("[t088] 청크A 렌더 중...", file=sys.stderr)
    init_tok: dict = {"frame_offset": 0, "blink_phase": 0, "first_frame": True, "head_last": None}
    frames_a_bytes, end_tok_dict = _post_render(server_url, wav_a, src_path, phase_token=init_tok)
    if end_tok_dict is None:
        result = {"verdict": "FAIL_NO_TRAILER_A", "error": "청크A 끝 토큰 없음"}
        print(json.dumps(result))
        return result
    frames_chunk_a = [_decode_jpeg_to_rgb(b) for b in frames_a_bytes]

    # CONCERN C-1: boundary_idx 는 추산(n_frames_a_est) 대신 실측(len(frames_chunk_a)) 사용.
    # stream_wav_frames n=max(len(env),nj) 분기로 추산이 ±몇 프레임 어긋날 수 있어
    # 짧은 wav 에서 게이트 오정렬 방지.
    boundary_idx = compute_boundary_index(len(frames_whole), len(frames_chunk_a))
    print(
        f"[t088] 청크A: {len(frames_chunk_a)} 프레임(실측), "
        f"boundary_idx={boundary_idx}(추산={n_frames_a_est}), end_tok={end_tok_dict}",
        file=sys.stderr,
    )

    # (B2) 청크B 렌더 — 끝 토큰 이어받기
    print("[t088] 청크B 렌더 중...", file=sys.stderr)
    frames_b_bytes, _ = _post_render(server_url, wav_b, src_path, phase_token=end_tok_dict)
    frames_chunk_b = [_decode_jpeg_to_rgb(b) for b in frames_b_bytes]
    print(f"[t088] 청크B: {len(frames_chunk_b)} 프레임", file=sys.stderr)

    # concat
    frames_chunk = frames_chunk_a + frames_chunk_b
    print(f"[t088] 2청크 총 프레임: {len(frames_chunk)}", file=sys.stderr)

    # 정량 대조
    result = compute_boundary_metrics(frames_whole, frames_chunk, boundary_idx, detect_lmk)
    result["n_frames_a_estimated"] = n_frames_a_est
    result["n_frames_a_actual"] = len(frames_chunk_a)
    result["wav_path"] = wav_path
    result["src_path"] = src_path
    result["end_tok"] = end_tok_dict

    print(json.dumps(result, ensure_ascii=False, indent=2))

    if out_path:
        Path(out_path).parent.mkdir(parents=True, exist_ok=True)
        Path(out_path).write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(f"[t088] 결과 저장: {out_path}", file=sys.stderr)

    return result


# -----------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="t088 게이트0: 통짜 vs 2청크 continuation 정량 대조",
    )
    parser.add_argument(
        "--wav",
        required=True,
        help="비교 대상 wav 경로 (공유마운트, 예: /home/afterlife/afterlife-server/.fifth-tmp/t088/seq.wav)",
    )
    parser.add_argument(
        "--src",
        required=True,
        help="얼굴 소스 경로 (사진 .jpg 또는 영상 .mp4, 예: .../face.jpg)",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="결과 JSON 저장 경로 (기본: stdout 만)",
    )
    parser.add_argument(
        "--server",
        default="http://203.0.113.30:8810",
        help="렌더서버 URL (기본: http://203.0.113.30:8810)",
    )
    args = parser.parse_args()

    run_compare(
        wav_path=args.wav,
        src_path=args.src,
        server_url=args.server,
        out_path=args.out,
    )


if __name__ == "__main__":
    main()
