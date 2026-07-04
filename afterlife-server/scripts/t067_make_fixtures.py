#!/usr/bin/env python3
"""t067_make_fixtures.py — 동일 인물 변형 샷 생성 (T-067 Task 8, Step 1).

가비아 호스트에서 실행(stdlib 전용, 의존성 설치 불필요).

소스: /home/afterlife/afterlife-server/prethird/video-ref/<cloneId>/<cloneId>-face.jpg
      (테스트 클론 정면사진들 = 서로 다른 인물)
방법: fifth 렌더서버(:8810, 컨테이너 fifth_poc_flp)에 무음 wav + 소스 사진(video_path)으로
      /render POST → 프레임 스트림(JoyVASA idle 모션이 포즈·눈깜빡임 변형을 만들어
      동일인물의 '다른 샷'이 됨 — T-088 PoC①에서 입증된 경로) → 6프레임 균등 샘플.

주의:
  - wav는 컨테이너 공유마운트 하위(.fifth-tmp/t067/<id>/)에 둘 것. /tmp는 컨테이너가 못 봄
    (T-088 함정). video_path(소스 사진)는 prethird/video-ref 그대로 사용
    (해당 경로도 공유마운트 안이라 컨테이너에서 직접 보임 — _remote_t088_viewer_run.sh와 동일 전제).
  - 프레임 파싱은 prethird/scripts/fifth_inproc.parse_frame_stream 재사용
    (t088_viewer_server.py와 동일 상대경로 삽입 수법: 이 스크립트가
    <afterlife-server>/fifth/scripts/ 에 배포된다는 전제로 ../../prethird/scripts 를 path에 추가).

흐름:
  ① video-ref 하위에서 <id>-face.jpg 존재하는 클론 id glob (4개 미만이면 에러로 중단)
  ② 인물별: 무음 wav(stdlib wave 모듈, 16kHz mono PCM16) 생성 → POST /oth-path
     → parse_frame_stream 으로 프레임 전부 버퍼링 → [0.15,0.3,0.45,0.6,0.75,0.9] 지점 6장 jpg 저장
  ③ fixtures/t067-faces/<cloneId>/shot_k.jpg + 최상위 manifest.json(인물·샷·원본경로·총프레임수) 기록
"""
from __future__ import annotations

import argparse
import glob
import http.client
import json
import os
import struct
import sys
import time
import urllib.parse
import wave

_HERE = os.path.dirname(os.path.abspath(__file__))
# t088_viewer_server.py 와 동일 관례: 이 스크립트가 <afterlife-server>/fifth/scripts/ 에
# 배포된다는 전제로 prethird/scripts 를 상대경로로 찾는다.
sys.path.insert(0, os.path.abspath(os.path.join(_HERE, "..", "..", "prethird", "scripts")))
try:
    from fifth_inproc import parse_frame_stream  # noqa: E402
except ImportError as e:  # pragma: no cover - 배포 경로 오류를 즉시 표면화
    sys.stderr.write(
        f"FATAL: fifth_inproc import 실패({e}) — 이 스크립트는 "
        "<afterlife-server>/fifth/scripts/ 에 배포되어야 합니다 "
        "(prethird/scripts 상대경로 의존).\n"
    )
    raise

DEFAULT_VIDEO_REF = "/home/afterlife/afterlife-server/prethird/video-ref"
DEFAULT_RENDER_URL = os.environ.get("FIFTH_RENDER_URL", "http://203.0.113.30:8810")
SAMPLE_FRACTIONS = [0.15, 0.30, 0.45, 0.60, 0.75, 0.90]
MIN_IDENTITIES = 4
SR = 16000

def discover_identities(video_ref_dir: str, max_identities: int | None, explicit_ids: list[str] | None):
    """video-ref/<id>/<id>-face.jpg 존재하는 id 목록. explicit_ids 지정 시 그것만 검증."""
    if explicit_ids:
        ids = []
        for cid in explicit_ids:
            face = os.path.join(video_ref_dir, cid, f"{cid}-face.jpg")
            if os.path.isfile(face):
                ids.append(cid)
            else:
                sys.stderr.write(f"WARN: 지정 id={cid} 의 face.jpg 없음 — 스킵: {face}\n")
        return sorted(ids)

    ids = []
    for d in sorted(glob.glob(os.path.join(video_ref_dir, "*"))):
        if not os.path.isdir(d):
            continue
        cid = os.path.basename(d)
        face = os.path.join(d, f"{cid}-face.jpg")
        if os.path.isfile(face):
            ids.append(cid)
    ids = sorted(ids)
    if max_identities:
        ids = ids[:max_identities]
    return ids

def write_silence_wav(path: str, seconds: float, sr: int = SR) -> None:
    """stdlib wave 모듈만으로 무음 PCM16 mono wav 생성 (numpy/soundfile 불필요)."""
    n_frames = int(round(seconds * sr))
    silence = b"\x00\x00" * n_frames
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(silence)

def check_health(render_url: str) -> bool:
    parsed = urllib.parse.urlparse(render_url)
    try:
        conn = http.client.HTTPConnection(parsed.hostname, parsed.port or 80, timeout=5)
        conn.request("GET", "/health")
        resp = conn.getresponse()
        ok = resp.status == 200
        resp.read()
        conn.close()
        return ok
    except Exception as e:
        sys.stderr.write(f"health check 실패: {e}\n")
        return False

def render_frames(render_url: str, wav_path: str, video_path: str) -> list[bytes]:
    """POST /oth-path → 프레임 스트림 전부 버퍼링해 리스트로 반환."""
    parsed = urllib.parse.urlparse(render_url)
    conn = http.client.HTTPConnection(parsed.hostname, parsed.port or 80, timeout=900)
    body = json.dumps({"wav_path": wav_path, "video_path": video_path})
    conn.request("POST", "/render", body, {"Content-Type": "application/json"})
    resp = conn.getresponse()
    if resp.status != 200:
        detail = resp.read()[:300]
        conn.close()
        raise RuntimeError(f"render {resp.status}: {detail!r}")

    def read_exactly(n):
        buf = b""
        while len(buf) < n:
            c = resp.read(n - len(buf))
            if not c:
                break
            buf += c
        return buf

    try:
        result = parse_frame_stream(read_exactly)
    finally:
        conn.close()
    # 가비아 실배포본 fifth_inproc.parse_frame_stream (T-088 continuation, phase_token 지원)은
    # (frames: list[bytes], end_tok: dict|None) 튜플을 반환한다(TOK 트레일러 프레임은 이미 제외됨).
    # 로컬 워크트리의 구버전은 jpeg bytes 를 하나씩 yield 하는 제너레이터였다 — 양쪽 계약 모두 수용.
    if isinstance(result, tuple):
        frames, _end_tok = result
    else:
        frames = list(result)
    return frames

def sample_shots(frames: list[bytes], fractions: list[float]) -> list[bytes]:
    n = len(frames)
    if n == 0:
        return []
    picked = []
    for f in fractions:
        idx = min(n - 1, max(0, int(round(f * (n - 1)))))
        picked.append(frames[idx])
    return picked

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video-ref-dir", default=DEFAULT_VIDEO_REF)
    ap.add_argument("--out-dir", default="/home/afterlife/afterlife-server/fixtures/t067-faces")
    ap.add_argument("--shared-tmp", default="/home/afterlife/afterlife-server/.fifth-tmp/t067")
    ap.add_argument("--render-url", default=DEFAULT_RENDER_URL)
    ap.add_argument("--silence-sec", type=float, default=8.0)
    ap.add_argument("--max-identities", type=int, default=8)
    ap.add_argument("--ids", default="", help="쉼표구분 명시적 클론id 목록 (생략 시 자동 discover)")
    args = ap.parse_args()

    explicit_ids = [x.strip() for x in args.ids.split(",") if x.strip()] or None

    print(f"[t067-fixtures] render_url={args.render_url}")
    if not check_health(args.render_url):
        print(f"FATAL: 렌더서버 health 실패 — {args.render_url}/health", file=sys.stderr)
        sys.exit(1)
    print("[t067-fixtures] render health OK")

    ids = discover_identities(args.video_ref_dir, args.max_identities, explicit_ids)
    if len(ids) < MIN_IDENTITIES:
        print(
            f"BLOCKED: 인물 수 부족 (found={len(ids)}, need>={MIN_IDENTITIES}) — 발견 목록: {ids}",
            file=sys.stderr,
        )
        sys.exit(1)
    print(f"[t067-fixtures] identities({len(ids)}): {ids}")

    os.makedirs(args.out_dir, exist_ok=True)
    os.makedirs(args.shared_tmp, exist_ok=True)

    manifest = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "render_url": args.render_url,
        "silence_sec": args.silence_sec,
        "sample_fractions": SAMPLE_FRACTIONS,
        "identities": {},
    }

    for cid in ids:
        src = os.path.join(args.video_ref_dir, cid, f"{cid}-face.jpg")
        wav_path = os.path.join(args.shared_tmp, cid, "silence.wav")
        write_silence_wav(wav_path, args.silence_sec)

        print(f"[t067-fixtures] {cid}: render 요청 중 (src={src})...")
        t0 = time.time()
        frames = render_frames(args.render_url, wav_path, src)
        dt = time.time() - t0
        if not frames:
            print(f"FATAL: {cid} 렌더 결과 프레임 0개 — 중단", file=sys.stderr)
            sys.exit(1)
        print(f"[t067-fixtures] {cid}: {len(frames)} frames ({dt:.1f}s)")

        shots = sample_shots(frames, SAMPLE_FRACTIONS)
        id_dir = os.path.join(args.out_dir, cid)
        os.makedirs(id_dir, exist_ok=True)
        shot_files = []
        for k, jpeg in enumerate(shots):
            fname = f"shot_{k}.jpg"
            with open(os.path.join(id_dir, fname), "wb") as f:
                f.write(jpeg)
            shot_files.append(fname)

        manifest["identities"][cid] = {
            "source": src,
            "total_frames": len(frames),
            "shots": shot_files,
        }

    manifest_path = os.path.join(args.out_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"OK: identities={len(ids)} shots=6 each -> {args.out_dir}")

if __name__ == "__main__":
    main()
