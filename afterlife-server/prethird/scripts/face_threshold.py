"""AFL-1071 통화 렌더 얼굴 기준 자동 재시도.

MuseTalk 얼굴 좌표 추출(get_landmark_and_bbox)은 S3FD 점수 0.5 초과만 얼굴로 본다.
만화풍 클론은 0.5 로 전 프레임 얼굴을 못 찾는 일이 있어, 그때만 0.2 로 한 번 더 추출한다.
0.5 로 얼굴을 하나라도 찾은 클론은 첫 결과를 그대로 돌려주므로 결과가 바이트 단위로 같다.

S3FD 기준은 MuseTalk 소스에 박혀 있어(SFDDetector.detect_from_batch 의 `> 0.5`),
같은 계산에 숫자만 다른 함수로 잠깐 바꿔 끼웠다가 되돌린다. MuseTalk 소스 파일은 고치지 않는다.
같은 파일이 `face_detection.` 과 `musetalk.utils.face_detection.` 두 이름으로 따로 로드되므로
두 경로 모두 바꾼다(10-29 실측).

face_check.py 의 `_sfd_from_detector` 는 재사용하지 않는다. face_check 는 aiohttp·asset_fetch 를
import 하는 HTTP 서버 모듈이라 렌더 경로(inference_lib)에 끌어오기 무겁고, 여기서는 인스턴스가 아니라
모듈 이름으로 찾기 때문에 필요한 코드가 몇 줄뿐이다.

동시성: 패치는 클래스 속성이라 프로세스 전역이다. 두 겹으로 막는다.
  1. 모듈 전역 Lock — 재시도끼리 겹치지 않게(패치·복구 순서가 꼬이지 않게).
  2. 바꿔 끼운 함수는 패치를 건 스레드에서만 낮은 기준을 쓰고, 다른 스레드가 부르면 원래 함수를 그대로 부른다.
     → 같은 시각 다른 클론의 좌표 추출에 0.2 가 새지 않는다.
"""
import contextlib
import importlib
import os
import sys
import threading

RENDER_SCORE_DEFAULT = 0.5  # MuseTalk 원래 기준(참고용 — 기본 경로는 원래 함수를 그대로 쓴다)


def _env_fallback_thr() -> float:
    raw = os.environ.get("MUSETALK_FACE_FALLBACK_THR")
    if raw is None or raw.strip() == "":
        return 0.2
    try:
        return float(raw)
    except ValueError:
        print(f"[face-thr] MUSETALK_FACE_FALLBACK_THR={raw!r} 해석 불가 → 0.2", flush=True)
        return 0.2


# 0 이하이면 재시도 끔.
RENDER_SCORE_FALLBACK = _env_fallback_thr()

_PREFIXES = ("face_detection.", "musetalk.utils.face_detection.")
_SFD_MOD = "detection.sfd.sfd_detector"
_NMS_THR = 0.3  # MuseTalk SFDDetector.detect_from_batch 와 동일

_retry_lock = threading.Lock()


def _make_detect(orig, bd, nms, thr: float, owner: int):
    def _detect_from_batch(self, images):
        if threading.get_ident() != owner:
            return orig(self, images)
        b = bd(self.face_detector, images, device=self.device)
        keeps = [nms(b[:, i, :], _NMS_THR) for i in range(b.shape[1])]
        lists = [b[keep, i, :] for i, keep in enumerate(keeps)]
        return [[x for x in bl if x[-1] > thr] for bl in lists]

    return _detect_from_batch


@contextlib.contextmanager
def lowered_threshold(thr: float):
    """두 모듈 경로의 SFDDetector.detect_from_batch 를 `thr` 필터 버전으로 바꾸고 나갈 때 되돌린다.

    import 안 된 경로는 건너뛴다. 바꾼 경로 수를 yield 한다(0 이면 아무것도 안 바꿈).
    """
    owner = threading.get_ident()
    restore = []  # (cls, 클래스 dict 에 원래 있던 값 or None)
    try:
        for prefix in _PREFIXES:
            mod = sys.modules.get(prefix + _SFD_MOD)
            cls = getattr(mod, "SFDDetector", None) if mod is not None else None
            if cls is None:
                continue
            try:
                bd = importlib.import_module(prefix + "detection.sfd.detect").batch_detect
                nms = importlib.import_module(prefix + "detection.sfd.bbox").nms
            except Exception as e:  # noqa: BLE001 — 이 경로만 건너뛴다
                print(f"[face-thr] {prefix} batch_detect/nms 못 찾음 → 건너뜀: {e}", flush=True)
                continue
            orig = cls.detect_from_batch
            restore.append((cls, vars(cls).get("detect_from_batch")))
            cls.detect_from_batch = _make_detect(orig, bd, nms, thr, owner)
        yield len(restore)
    finally:
        for cls, saved in reversed(restore):
            if saved is None:
                with contextlib.suppress(AttributeError):
                    delattr(cls, "detect_from_batch")
            else:
                cls.detect_from_batch = saved


def landmarks_with_fallback(get_fn, imgs, bbox_shift, placeholder):
    """get_fn(imgs, bbox_shift) 의 bbox 가 전부 placeholder 면 낮은 기준으로 한 번 더 부른다.

    첫 결과에 얼굴이 하나라도 있으면(실사 클론) 첫 결과 객체를 그대로 돌려준다.
    """
    first = get_fn(imgs, bbox_shift)
    coords = first[0]
    thr = RENDER_SCORE_FALLBACK
    if thr <= 0 or not coords or any(c != placeholder for c in coords):
        return first
    with _retry_lock:
        with lowered_threshold(thr) as n_patched:
            if n_patched == 0:
                print("[face-thr] S3FD 모듈을 못 찾아 기준 재시도 생략 — 첫 결과 사용", flush=True)
                return first
            second = get_fn(imgs, bbox_shift)
    hit = sum(1 for c in second[0] if c != placeholder)
    print(f"[face-thr] fallback {thr:g} hit={hit}/{len(second[0])}", flush=True)
    return second
