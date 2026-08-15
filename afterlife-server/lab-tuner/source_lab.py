"""업로드 소스(영상·사진)로 fifth 렌더를 테스트하기 위한 저장·정규화 모듈.

목소리·페르소나는 선택한 클론 것을 그대로 쓰고 **렌더 소스만** 교체한다.
설계 근거는 docs/superpowers/specs/2026-08-15-lab-tuner-upload-source.md.

경로 규약 (반드시 지킬 것)
--------------------------
저장 루트 기본값은 fifth 컨테이너의 FLP 마운트 안쪽이다.

    /data/afterlife/fifth-poc/FasterLivePortrait/lab-sources/

호스트에서는 sdb1(3.6T), 컨테이너에서는 /root/FasterLivePortrait 로 보인다.
컨테이너 안에 아래 심링크를 만들어 **양쪽 절대경로를 일치**시켜 두었다.

    docker exec fifth_poc_flp mkdir -p /data/afterlife/fifth-poc
    docker exec fifth_poc_flp ln -s /root/FasterLivePortrait \
      /data/afterlife/fifth-poc/FasterLivePortrait

이 정렬이 없으면 랩이 보내는 경로가 컨테이너 안에서 해석되지 않아
"HTTP 200 인데 프레임 0" 이 된다. 컨테이너 재생성 시 심링크도 다시 만들 것.

디렉터리는 업로드 1건당 1개다. fifth 소스 캐시 키가 부모 디렉터리 이름
(fifth_render_server._clone_key)이라, 한 디렉터리에 여러 원본을 두면 캐시가
뭉개져 이전 업로드 얼굴이 나온다.
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import time
from pathlib import Path

log = logging.getLogger("lab-tuner.source")

DEFAULT_ROOT = "/data/afterlife/fifth-poc/FasterLivePortrait/lab-sources"

# fifth 가 실제로 읽을 수 있는 확장자만 허용한다.
# 이미지 목록은 fifth_render_server._IMAGE_EXTS 와 같아야 한다(다르면 영상으로
# 오분류돼 cv2.VideoCapture 가 0프레임으로 실패).
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
VIDEO_EXTS = (".mp4", ".mov", ".webm", ".mkv", ".m4v")

MAX_BYTES = int(os.environ.get("LAB_SOURCE_MAX_MB", "300")) * 1024 * 1024

# 목록 섬네일 높이(px). 렌더 소스(항상 이미지)를 줄여서 만든다.
THUMB_H = int(os.environ.get("LAB_SOURCE_THUMB_H", "160"))

# 영상 업로드에서 렌더 소스로 쓸 대표 프레임을 뽑는 시점(초).
# 0 으로 두면 첫 프레임이 검거나 페이드인이라 얼굴 검출이 실패할 수 있다.
FACE_AT_SEC = float(os.environ.get("LAB_SOURCE_FACE_AT", "1"))

# idle 정규화 규격 — 기존 클론 idle 실측값(512x1024 / 25fps / 9.92s)에 맞춘다.
# fps: VideoTrack 은 무조건 25fps 로 재생하므로 원본 fps 를 맞추지 않으면 배속이 틀어진다.
# 길이·해상도: idle 은 전 프레임을 rgb24 로 RAM 에 올린다(idle.py:_load_idle_frames).
#   512x1024 10초 = 248프레임 ≈ 390MB. 상한 없이 두면 GB 단위로 터진다.
IDLE_SEC = float(os.environ.get("LAB_SOURCE_IDLE_SEC", "10"))
IDLE_FPS = int(os.environ.get("LAB_SOURCE_IDLE_FPS", "25"))
IDLE_W = int(os.environ.get("LAB_SOURCE_IDLE_W", "512"))
IDLE_H = int(os.environ.get("LAB_SOURCE_IDLE_H", "1024"))

_FFMPEG = os.environ.get("LAB_FFMPEG", "ffmpeg")


class SourceError(ValueError):
    """업로드 거부(확장자·용량·이름). 호출부가 4xx 로 변환한다."""


def root() -> Path:
    return Path(os.environ.get("LAB_SOURCE_ROOT", DEFAULT_ROOT))


def kind_of(name: str) -> str:
    """확장자로 image|video 판정. 허용 목록 밖이면 SourceError."""
    ext = Path(name).suffix.lower()
    if ext in IMAGE_EXTS:
        return "image"
    if ext in VIDEO_EXTS:
        return "video"
    raise SourceError(
        f"허용하지 않는 확장자: {ext or '(없음)'} — "
        f"영상 {' '.join(VIDEO_EXTS)} / 사진 {' '.join(IMAGE_EXTS)}"
    )


def make_id(now: float | None = None, exists=None) -> str:
    """업로드 id = 날짜시간(KST 서버 로컬). 같은 초 충돌 시 -2, -3 … 으로 회피.

    exists: 이름 충돌 판정 함수(테스트 주입). 기본은 실제 디렉터리 존재 확인.
    """
    if exists is None:
        _r = root()
        def exists(name):        # noqa: E306 — 지역 기본 구현
            return (_r / name).exists()
    base = time.strftime("%Y%m%d-%H%M%S", time.localtime(now))
    if not exists(base):
        return base
    for n in range(2, 100):
        cand = f"{base}-{n}"
        if not exists(cand):
            return cand
    raise SourceError(f"업로드 id 충돌 회피 실패: {base}")


def build_idle_cmd(src: str, dest: str) -> list:
    """영상 → idle 정규화 ffmpeg 인자. 순수 함수(테스트가 명령을 직접 검증)."""
    vf = (
        f"scale={IDLE_W}:{IDLE_H}:force_original_aspect_ratio=decrease,"
        f"pad={IDLE_W}:{IDLE_H}:(ow-iw)/2:(oh-ih)/2,fps={IDLE_FPS}"
    )
    return [
        _FFMPEG, "-y", "-loglevel", "error",
        "-i", src,
        "-t", str(IDLE_SEC),
        "-an",                      # idle 은 무음 — 오디오는 TTS 가 낸다
        "-vf", vf,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        dest,
    ]


def build_face_cmd(src: str, dest: str) -> list:
    """영상 → 렌더 소스로 쓸 정지 프레임 1장 추출."""
    return [
        _FFMPEG, "-y", "-loglevel", "error",
        "-ss", str(FACE_AT_SEC), "-i", src,
        "-frames:v", "1",
        dest,
    ]


def build_face(src: str, dest: str, *, run=None) -> str | None:
    """영상 업로드 → face.jpg. 실패 시 None.

    🔴 fifth 는 영상 경로를 받으면 렌더가 깨진다(2026-08-15 실측):
        render 오류: operands could not be broadcast together with
                     shapes (1024,512,3) (512,512,1)
    업로드본만의 문제가 아니라 **기존 클론 idle mp4 를 원래 자리에서 넣어도** 0프레임이다.
    라이브가 멀쩡한 이유는 fifth 에 항상 정면사진(face_path, jpg)을 주기 때문
    (prethird/scripts/server.py:_source_for_renderer). 그래서 랩도 같은 방식으로
    영상에서 프레임 1장을 뽑아 그것을 렌더 소스로 쓴다. 영상은 idle 로만 쓴다.
    """
    run = run or subprocess.run
    try:
        res = run(build_face_cmd(src, dest), capture_output=True, text=True, timeout=120)
    except Exception as exc:
        log.warning("대표 프레임 추출 실패(%s): %s", type(exc).__name__, exc)
        return None
    if getattr(res, "returncode", 1) != 0 or not os.path.isfile(dest):
        log.warning("대표 프레임 추출 실패(rc=%s): %s",
                    getattr(res, "returncode", "?"), (getattr(res, "stderr", "") or "")[:400])
        return None
    return dest


def build_thumb_cmd(src: str, dest: str) -> list:
    """렌더 소스 이미지 → 목록용 섬네일. 높이 기준 축소(가로는 비율 유지)."""
    return [
        _FFMPEG, "-y", "-loglevel", "error",
        "-i", src,
        # -2 = 짝수로 맞춘 자동 폭(홀수 폭이면 인코더가 거부한다)
        "-vf", f"scale=-2:{THUMB_H}",
        "-frames:v", "1",
        dest,
    ]


def build_thumb(src: str, dest: str, *, run=None) -> str | None:
    """섬네일 생성. 실패해도 업로드는 살린다(목록에 이미지만 안 보인다)."""
    run = run or subprocess.run
    try:
        res = run(build_thumb_cmd(src, dest), capture_output=True, text=True, timeout=60)
    except Exception as exc:
        log.warning("섬네일 생성 실패(%s): %s", type(exc).__name__, exc)
        return None
    if getattr(res, "returncode", 1) != 0 or not os.path.isfile(dest):
        log.warning("섬네일 생성 실패(rc=%s)", getattr(res, "returncode", "?"))
        return None
    return dest


def ensure_thumb(source_id: str, *, run=None) -> str | None:
    """섬네일 경로를 돌려준다. 없으면 그 자리에서 만든다.

    이 기능 이전에 올라온 업로드(meta 에 thumb 키가 없는 것)도 목록에 뜨게 하려는
    지연 생성 경로다. 매번 만들지 않도록 결과를 meta.json 에 반영한다.
    """
    meta = resolve(source_id)
    if meta is None:
        return None
    thumb = meta.get("thumb")
    if thumb and os.path.isfile(thumb):
        return thumb
    d = root() / meta["id"]
    made = build_thumb(meta["source"], str(d / "thumb.jpg"), run=run)
    if made:
        meta["thumb"] = made
        meta.pop("ok", None)          # resolve 가 붙인 표시 필드는 저장하지 않는다
        try:
            (d / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
        except OSError as exc:
            log.warning("meta 갱신 실패(섬네일은 생성됨): %s", exc)
    return made


def build_idle(src: str, dest: str, *, run=None) -> str | None:
    """영상 업로드 → idle.mp4 생성. 실패 시 None(fail-open: 클론 idle 유지).

    run 기본값을 인자에 굳히지 않고 호출 시점에 찾는다 — 기본인자로 두면 def 시점에
    묶여 monkeypatch(source_lab.subprocess.run)가 먹지 않는다.
    """
    run = run or subprocess.run
    try:
        res = run(build_idle_cmd(src, dest), capture_output=True, text=True, timeout=180)
    except Exception as exc:                      # ffmpeg 부재·타임아웃 등
        log.warning("idle 생성 실패(%s) — 클론 idle 유지: %s", type(exc).__name__, exc)
        return None
    if getattr(res, "returncode", 1) != 0:
        log.warning("idle 생성 실패(ffmpeg rc=%s): %s",
                    getattr(res, "returncode", "?"), (getattr(res, "stderr", "") or "")[:400])
        return None
    if not os.path.isfile(dest):
        log.warning("idle 생성 후 파일 없음: %s", dest)
        return None
    return dest


def save_bytes(data: bytes, filename: str, *, now: float | None = None,
               run=None) -> dict:
    """업로드 바이트를 새 디렉터리에 저장하고 meta 를 기록한다.

    영상이면 idle.mp4 도 함께 굽는다. 반환값이 곧 /sources 항목.
    """
    if not data:
        raise SourceError("빈 파일")
    if len(data) > MAX_BYTES:
        raise SourceError(f"용량 초과: {len(data)/1048576:.1f}MB > {MAX_BYTES/1048576:.0f}MB")
    kind = kind_of(filename)
    ext = Path(filename).suffix.lower()
    sid = make_id(now)
    d = root() / sid
    d.mkdir(parents=True, exist_ok=True)
    raw = d / f"source{ext}"
    raw.write_bytes(data)

    video, idle = None, None
    if kind == "video":
        video = str(raw)
        # 렌더 소스는 영상이 아니라 여기서 뽑은 정지 프레임이다(build_face docstring 참조).
        render_src = build_face(video, str(d / "face.jpg"), run=run)
        if render_src is None:
            shutil.rmtree(d, ignore_errors=True)   # 쓸 수 없는 업로드는 남기지 않는다
            raise SourceError(
                "영상에서 대표 프레임을 뽑지 못했습니다 — 손상된 파일이거나 "
                f"{FACE_AT_SEC}초보다 짧은 영상일 수 있습니다")
        idle = build_idle(video, str(d / "idle.mp4"), run=run)
    else:
        render_src = str(raw)

    thumb = build_thumb(render_src, str(d / "thumb.jpg"), run=run)

    meta = {
        "id": sid,
        "kind": kind,
        "orig_name": Path(filename).name,
        "bytes": len(data),
        "source": render_src,   # fifth 렌더 소스(항상 이미지)
        "video": video,         # 업로드 원본 영상(사진 업로드면 None)
        "idle": idle,
        "thumb": thumb,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now)),
    }
    (d / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    log.info("[source-upload] id=%s kind=%s bytes=%d src=%s idle=%s thumb=%s",
             sid, kind, len(data), render_src, bool(idle), bool(thumb))
    return meta


def _read_meta(d: Path) -> dict | None:
    try:
        meta = json.loads((d / "meta.json").read_text())
    except Exception:
        return None
    if not isinstance(meta, dict) or not meta.get("source"):
        return None
    return meta


def list_sources() -> list:
    """업로드 목록 — 최신 우선. id 가 날짜시간이라 이름 역순 = 최신순."""
    r = root()
    if not r.is_dir():
        return []
    out = []
    for d in sorted(r.iterdir(), key=lambda p: p.name, reverse=True):
        if not d.is_dir():
            continue
        meta = _read_meta(d)
        if meta is None:
            continue
        # 파일이 실제로 남아 있는지 표시 — 목록에서 죽은 항목을 눈으로 거를 수 있게.
        meta["ok"] = os.path.isfile(meta["source"])
        out.append(meta)
    return out


def resolve(source_id: str | None) -> dict | None:
    """노브의 render_source(id) → meta. 없거나 파일이 사라졌으면 None(fail-open).

    통화 경로에서 불린다 — 여기서 예외를 던지면 통화가 죽는다. 무조건 None 으로
    떨어뜨리고 경고만 남겨 클론 기본 자산으로 되돌아가게 한다.
    """
    if not source_id:
        return None
    sid = str(source_id).strip()
    if not sid or "/" in sid or sid.startswith("."):
        log.warning("[source] 잘못된 id 무시: %r", source_id)
        return None
    meta = _read_meta(root() / sid)
    if meta is None:
        log.warning("[source] id 없음 → 클론 기본 자산 사용: %s", sid)
        return None
    if not os.path.isfile(meta["source"]):
        log.warning("[source] 소스 파일 사라짐 → 클론 기본 자산 사용: %s", meta["source"])
        return None
    if meta.get("idle") and not os.path.isfile(meta["idle"]):
        meta["idle"] = None
    return meta


def delete(source_id: str) -> bool:
    """업로드 디렉터리 삭제. 존재하지 않으면 False."""
    sid = str(source_id).strip()
    if not sid or "/" in sid or sid.startswith("."):
        raise SourceError(f"잘못된 id: {source_id!r}")
    d = root() / sid
    if not d.is_dir():
        return False
    shutil.rmtree(d)
    log.info("[source-delete] id=%s", sid)
    return True
