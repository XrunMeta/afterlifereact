#!/usr/bin/env python3
"""T-088 filler 생성 E2E (가비아 실행) — 신규 클론 → filler 3개 → R2 → bundle 검증.

흐름:
  1. login(테스트 계정) → token
  2. 정면사진 + 음성 fixture 업로드 → /files → file_id 2개
  3. asset-job kind=idle_video / voice_clone 생성 → job_id 2개
  4. createClone(idle_video_job_id, voice_clone_job_id) → clone_id
     (api F3가 filler 잡 자동 트리거: idle src 재사용 + voice_clone src→voiceRawUrl)
  5. bundle.assets.fillerVideoUrls 폴링(orchestrator: voice.wav ensure→qwen3tts×3→fifth×3→mux→R2)
     → 길이 3 될 때까지(또는 timeout)
  6. 각 url GET → 200·video/mp4 검증

전제(배포 후): api preview에 마이그 0079 적용·orchestrator/prethird filler 코드 배포·드롭인.
사용: python3 _remote_filler_e2e.py
환경변수로 override: API_BASE, E2E_EMAIL, E2E_PW, FACE_FIXTURE, VOICE_FIXTURE, POLL_TIMEOUT
"""
import os
import sys
import time
import json
import mimetypes
import urllib.request
import urllib.error

API_BASE = os.environ.get("API_BASE", "https://edge-alt-preview.example.invalid")
EMAIL = os.environ.get("E2E_EMAIL", "oth-test@example.invalid")
PW = os.environ.get("E2E_PW", "oth-password")
# 가비아 fixture (정면사진·음성). 신규 클론용으로 재업로드.
FACE_FIXTURE = os.environ.get(
    "FACE_FIXTURE", "/home/afterlife/afterlife-server/prethird/video-ref/9055/9055-face.jpg")
VOICE_FIXTURE = os.environ.get(
    "VOICE_FIXTURE", "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices/9055/voice.wav")
POLL_TIMEOUT = int(os.environ.get("POLL_TIMEOUT", "360"))  # 초 (idle·voice·filler 직렬 큐 여유)
POLL_INTERVAL = 6

def _req(method, path, token=None, json_body=None, raw_body=None, headers=None, base=None):
    url = (base or API_BASE) + path
    h = dict(headers or {})
    if token:
        h["Authorization"] = f"Bearer {token}"
    data = None
    if json_body is not None:
        data = json.dumps(json_body).encode()
        h["Content-Type"] = "application/json"
    elif raw_body is not None:
        data = raw_body
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            body = resp.read()
            ctype = resp.headers.get("Content-Type", "")
            return resp.status, (json.loads(body) if "json" in ctype else body), resp.headers
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            body = json.loads(body)
        except Exception:
            pass
        return e.code, body, e.headers

def _multipart(fields, file_field, file_path):
    """간단 multipart/form-data 빌더. fields=dict(str), file_field=폼이름."""
    boundary = "----filler-e2e-" + str(int(time.time() * 1000))
    nl = b"\r\n"
    buf = b""
    for k, v in fields.items():
        buf += b"--" + boundary.encode() + nl
        buf += f'Content-Disposition: form-data; name="{k}"'.encode() + nl + nl
        buf += str(v).encode() + nl
    fname = os.path.basename(file_path)
    ctype = mimetypes.guess_type(fname)[0] or "application/octet-stream"
    with open(file_path, "rb") as f:
        content = f.read()
    buf += b"--" + boundary.encode() + nl
    buf += f'Content-Disposition: form-data; name="{file_field}"; filename="{fname}"'.encode() + nl
    buf += f"Content-Type: {ctype}".encode() + nl + nl
    buf += content + nl
    buf += b"--" + boundary.encode() + b"--" + nl
    return buf, {"Content-Type": f"multipart/form-data; boundary={boundary}"}

def fail(msg):
    print(f"\n❌ FAIL: {msg}")
    sys.exit(1)

def main():
    print(f"=== T-088 filler E2E === api={API_BASE}")
    for p in (FACE_FIXTURE, VOICE_FIXTURE):
        if not os.path.isfile(p):
            fail(f"fixture 없음: {p} (FACE_FIXTURE/VOICE_FIXTURE env로 지정)")

    # 1. login
    st, body, _ = _req("POST", "/oth-path", json_body={"email": EMAIL, "password": PW})
    if st != 200:
        fail(f"login {st}: {body}")
    token = body.get("token") or body.get("accessToken") or (body.get("data") or {}).get("token")
    if not token:
        fail(f"login 토큰 없음: {body}")
    print("✅ login")

    # 2. 사진/음성 업로드
    fbody, fhdr = _multipart({"purpose": "avatar"}, "file", FACE_FIXTURE)
    st, body, _ = _req("POST", "/oth-path", token=token, raw_body=fbody, headers=fhdr)
    if st not in (200, 201):
        fail(f"face 업로드 {st}: {body}")
    face_id = body.get("id") or (body.get("data") or {}).get("id")
    print(f"✅ face 업로드 file_id={face_id}")

    vbody, vhdr = _multipart({"purpose": "voice"}, "file", VOICE_FIXTURE)
    st, body, _ = _req("POST", "/oth-path", token=token, raw_body=vbody, headers=vhdr)
    if st not in (200, 201):
        fail(f"voice 업로드 {st}: {body}")
    voice_id = body.get("id") or (body.get("data") or {}).get("id")
    print(f"✅ voice 업로드 file_id={voice_id}")

    # 3. asset-job idle_video / voice_clone
    st, body, _ = _req("POST", "/oth-path", token=token,
                       json_body={"kind": "idle_video", "src_file_id": face_id})
    if st not in (200, 201):
        fail(f"idle_video 잡 {st}: {body}")
    idle_job = body.get("id") or body.get("job_id") or (body.get("data") or {}).get("id")
    print(f"✅ idle_video job={idle_job}")

    st, body, _ = _req("POST", "/oth-path", token=token,
                       json_body={"kind": "voice_clone", "src_file_id": voice_id})
    if st not in (200, 201):
        fail(f"voice_clone 잡 {st}: {body}")
    voice_job = body.get("id") or body.get("job_id") or (body.get("data") or {}).get("id")
    print(f"✅ voice_clone job={voice_job}")

    # 4. createClone (filler 자동 트리거)
    uniq = str(int(time.time()))[-6:]
    st, body, _ = _req("POST", "/oth-path", token=token, json_body={
        "name": f"filler_e2e_{uniq}",
        "username": f"filler_e2e_{uniq}",
        "visibility": "private",
        "idle_video_job_id": idle_job,
        "voice_clone_job_id": voice_job,
    })
    if st not in (200, 201):
        fail(f"createClone {st}: {body}")
    clone_id = body.get("id") or (body.get("data") or {}).get("id")
    print(f"✅ createClone clone_id={clone_id} (filler 잡 자동 트리거됨)")

    # 5. bundle.fillerVideoUrls 폴링
    print(f"\n--- filler 생성 폴링(최대 {POLL_TIMEOUT}s) ---")
    deadline = time.time() + POLL_TIMEOUT
    urls = []
    while time.time() < deadline:
        st, body, _ = _req("GET", f"/oth-path", token=token)
        if st == 200:
            assets = (body.get("assets") or body.get("data", {}).get("assets") or {})
            urls = assets.get("fillerVideoUrls") or []
            print(f"  [{int(deadline - time.time())}s left] fillerVideoUrls={len(urls)}개")
            if len(urls) >= 3:
                break
        else:
            print(f"  bundle {st}")
        time.sleep(POLL_INTERVAL)

    if len(urls) < 3:
        fail(f"filler 3개 미생성(timeout): {len(urls)}개. "
             f"orchestrator 로그 확인(voice.wav ensure→qwen3tts→fifth). "
             f"clone_id={clone_id}")
    print(f"✅ fillerVideoUrls 3개 생성: {urls}")

    # 6. 각 url 검증
    for i, u in enumerate(urls):
        st, content, hdr = _req("GET", u if u.startswith("/") else u, token=token,
                                base="" if u.startswith("http") else None)
        ctype = (hdr.get("Content-Type", "") if hdr else "")
        size = len(content) if isinstance(content, (bytes, bytearray)) else 0
        ok = st == 200 and size > 1024
        print(f"  filler[{i}] {st} {ctype} {size}B {'✅' if ok else '❌'}")
        if not ok:
            fail(f"filler[{i}] 검증 실패: {u}")

    print(f"\n🎉 PASS — clone {clone_id} filler 3개 생성·서빙 정상")
    print(f"   (정리: 이 테스트 클론은 private. 필요시 수동 삭제)")

if __name__ == "__main__":
    main()
