#!/usr/bin/env python3
"""t067_e2e_match.py — T-067 Task 8 Phase 1 자율 E2E (preview api 대상).

⚠️ 실행 전 배포 선행 필요 (아직 preview 미배포 — 이 스크립트는 지금 실행하지 말 것):
  1) wrangler vectorize create afl-face-512 --dimensions=512 --metric=cosine
  2) wrangler d1 migrations apply <DB> --remote          # 0082 (persons/consent_log/face_embeddings 등)
  3) wrangler deploy --env preview                        # afterlifeapi persons 라우트 배포
  4) wrangler d1 execute <DB> --remote --command \
       "INSERT INTO app_config(key,value) VALUES('face.match_threshold','<t067_calibration.json threshold>') \
        ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=unixepoch()" --env preview

env:
  T067_API_BASE      preview api base url (예: https://afterlifeapi-preview.xxx.workers.dev)
  T067_ACCESS_TOKEN  로그인 액세스 토큰 (Authorization: Bearer)

실행:
  T067_API_BASE=https://<preview api> T067_ACCESS_TOKEN=<tok> \
    python3 t067_e2e_match.py fixtures/t067-faces/

의존: t067_model_parity.embed_onnx + t067_calibrate.py 의 얼굴 crop 로직(cv2 Haar cascade) 재사용.
      onnxruntime/opencv-python-headless/pillow/numpy 설치된 인터프리터로 실행
      (scripts/.t067-model/venv/bin/python3 권장).

흐름 (브리프 Step 4):
  ① POST /oth-path {displayName:'t067-fx-<ts>'} → personId
  ② POST /oth-path {state:'granted'}
  ③ shot_0..2 임베딩 → POST /oth-path {vectors:[...]} (3개)
  ④ shot_4 임베딩(같은 인물) → POST /oth-path 를 5s 간격 재시도(최대 120s,
     Vectorize insert 비동기 반영 대기) → best.personId==personId, score>=threshold 단언
  ⑤ 다른 인물 shot 임베딩 → match → best가 None 이거나 다른 personId (해당 personId 아님) 단언
  ⑥ DELETE /oth-path → match 재시도(반영까지 재시도) → best None 단언 → PASS 출력

실패 시 어느 단계·응답 본문 출력하고 exit 1.
"""
from __future__ import annotations

import glob
import json
import os
import sys
import time
import urllib.error
import urllib.request

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _HERE)
from t067_calibrate import embed_shot, DEFAULT_ONNX  # noqa: E402 — cv2 Haar crop + embed 재사용

API_BASE = os.environ.get("T067_API_BASE", "").rstrip("/")
TOKEN = os.environ.get("T067_ACCESS_TOKEN", "")
MATCH_RETRY_INTERVAL_SEC = 5
MATCH_RETRY_MAX_SEC = 120

def _fail(step: str, msg: str, resp_body=None):
    print(f"FAIL @ {step}: {msg}", file=sys.stderr)
    if resp_body is not None:
        print(f"  response body: {resp_body!r}", file=sys.stderr)
    sys.exit(1)

def _request(method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if TOKEN:
        req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {"raw": raw.decode(errors="replace")}
        return e.code, parsed

def embed_face_of(identity_dir: str, shot_name: str, onnx_path: str, cascade) -> list[float]:
    path = os.path.join(identity_dir, shot_name)
    vec = embed_shot(path, onnx_path, cascade)
    if vec is None:
        _fail("embed", f"임베딩 실패: {path}")
    return vec.tolist()

def wait_match_condition(vector: list[float], predicate, step_label: str, max_sec: int = MATCH_RETRY_MAX_SEC):
    """POST /oth-path 를 재시도하며 predicate(resp_json) True 될 때까지 대기.
    Vectorize insert/delete 는 비동기 반영이라 즉시 반영 보장 없음(브리프 명시)."""
    deadline = time.time() + max_sec
    last = None
    while time.time() < deadline:
        status, resp = _request("POST", "/oth-path", {"vector": vector})
        if status != 200:
            _fail(step_label, f"match HTTP {status}", resp)
        last = resp
        if predicate(resp):
            return resp
        time.sleep(MATCH_RETRY_INTERVAL_SEC)
    _fail(step_label, f"{max_sec}s 내 조건 미충족 — 마지막 응답: {last}")

def main():
    if len(sys.argv) < 2:
        print("usage: t067_e2e_match.py <fixtures_dir>", file=sys.stderr)
        sys.exit(1)
    fixtures_dir = sys.argv[1]

    if not API_BASE or not TOKEN:
        _fail("setup", "T067_API_BASE / T067_ACCESS_TOKEN 환경변수 필요")

    import cv2  # 로컬 import — 실행 인터프리터에 opencv 없으면 여기서 즉시 실패 표면화

    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    cascade = cv2.CascadeClassifier(cascade_path)
    if cascade.empty():
        _fail("setup", f"Haar cascade 로드 실패: {cascade_path}")

    identities = sorted(d for d in glob.glob(os.path.join(fixtures_dir, "*")) if os.path.isdir(d))
    if len(identities) < 2:
        _fail("setup", f"인물 최소 2명 필요(본인 + 타인) — found={len(identities)}")

    id_a_dir, id_b_dir = identities[0], identities[1]
    print(f"[t067-e2e] identity A={id_a_dir} identity B(타인)={id_b_dir}")

    # ① person 생성
    ts = int(time.time())
    status, resp = _request("POST", "/oth-path", {"displayName": f"t067-fx-{ts}"})
    if status != 201:
        _fail("① POST /oth-path", f"HTTP {status}", resp)
    person_id = resp.get("id")
    if not person_id:
        _fail("① POST /oth-path", "id 없음", resp)
    print(f"[t067-e2e] ① personId={person_id}")

    # ② consent granted
    status, resp = _request(
        "POST", f"/oth-path", {"state": "granted", "termsVersion": "t067-e2e", "channel": "e2e"}
    )
    if status != 200 or resp.get("consentState") != "granted":
        _fail("② consent", f"HTTP {status}", resp)
    print("[t067-e2e] ② consent granted")

    # ③ shot_0..2 임베딩 → enroll
    vectors = [
        embed_face_of(id_a_dir, f"shot_{k}.jpg", DEFAULT_ONNX, cascade) for k in range(3)
    ]
    status, resp = _request("POST", f"/oth-path", {"vectors": vectors})
    if status != 200 or resp.get("enrolled") != 3:
        _fail("③ enroll faces", f"HTTP {status}", resp)
    print(f"[t067-e2e] ③ enrolled={resp.get('enrolled')}")

    # ④ shot_4(같은 인물) → match → best.personId == person_id
    same_vec = embed_face_of(id_a_dir, "shot_4.jpg", DEFAULT_ONNX, cascade)

    def _matched_self(resp_json):
        best = resp_json.get("best")
        return bool(best) and best.get("personId") == person_id

    resp = wait_match_condition(same_vec, _matched_self, "④ match(self)")
    best = resp["best"]
    threshold = resp.get("threshold")
    print(f"[t067-e2e] ④ matched self: score={best['score']:.4f} threshold={threshold}")
    assert best["score"] >= threshold, f"best.score({best['score']}) < threshold({threshold})"

    # ⑤ 다른 인물 → match → best가 None 이거나 personId가 다름 (오탐 없음 단언)
    diff_vec = embed_face_of(id_b_dir, "shot_0.jpg", DEFAULT_ONNX, cascade)
    status, resp = _request("POST", "/oth-path", {"vector": diff_vec})
    if status != 200:
        _fail("⑤ match(diff)", f"HTTP {status}", resp)
    best_diff = resp.get("best")
    if best_diff and best_diff.get("personId") == person_id:
        _fail("⑤ match(diff)", f"타인 얼굴이 person_id={person_id} 로 오매칭됨: {resp}")
    print(f"[t067-e2e] ⑤ diff-person no false-match OK (best={best_diff})")

    # ⑥ delete → cascade-delete 반영 대기 → match(self) → best None
    status, resp = _request("DELETE", f"/oth-path")
    if status != 200 or not resp.get("deleted"):
        _fail("⑥ delete", f"HTTP {status}", resp)
    print("[t067-e2e] ⑥ person deleted, match 재검증 대기...")

    def _no_longer_matched(resp_json):
        best = resp_json.get("best")
        return best is None or best.get("personId") != person_id

    wait_match_condition(same_vec, _no_longer_matched, "⑥ match(post-delete)")
    print("[t067-e2e] ⑥ cascade-delete confirmed (더 이상 매칭 안 됨)")

    print("")
    print("E2E PASS (enroll→match→negative→cascade-delete)")

if __name__ == "__main__":
    main()
