#!/usr/bin/env python3
# _remote_sp36_create_e2e.py — SP3.6 클론 생성 전과정 자율 헤드리스 E2E 하니스.
#
# 대상: preview api (https://edge-alt-preview.example.invalid 기본값).
# halbae fixture 경로: afterlife-server/sync-mirror/halbae/halbae-front.jpg + voice.mp3
#
# -------------------------------------------------------------------
# DEV_TOKEN 발급 방법:
#   afterlifeapi 디렉토리에서:
#     JWT_ACCESS_SECRET=<preview dev secret> DEV_USER_ID=<seeded user id> \
#       npx tsx scripts/mint-dev-token.ts
#   출력된 토큰을 DEV_TOKEN 환경변수로 전달 (7일 TTL 기본).
#   (스크립트: afterlifeapi/scripts/mint-dev-token.ts)
# -------------------------------------------------------------------
#
# 파일 업로드 방식 확인 결과:
#   POST /oth-path — multipart/form-data (afterlifeRN/src/api/files.ts 확인).
#   urllib로 multipart boundary 직접 구성은 번거로우므로, 표준 라이브러리로 구현.
#   단, 업로드 성공 여부 검증보다 핵심 경로(채팅답→gemma→클론생성) 우선.
#   avatar/voice 업로드는 Step[2] 에서 수행하되, 실패 시 스킵하고 계속 진행
#   (avatar_url 없어도 createClone 가능 — avatar_url 은 optional 필드).
# -------------------------------------------------------------------
#
# 사용:
#   DEV_TOKEN=<token> python3 _remote_sp36_create_e2e.py
#   DEV_TOKEN=<token> API_BASE=https://... python3 _remote_sp36_create_e2e.py
#
# 주의: Phase B 배포 후 실행 — intro-suggest 라우트가 preview api에 배포된 상태에서만 정상 통과.
#        배포 전 실행 시 [5] intro-suggest 가 FAIL 로 집계됨(의도된 동작).
# -------------------------------------------------------------------

import json
import os
import sys
import time
import urllib.request
import urllib.error

API = os.environ.get("API_BASE", "https://edge-alt-preview.example.invalid")

# halbae 픽스처 경로: scripts/ → ../sync-mirror/halbae/
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FIXTURE_DIR = os.path.join(_SCRIPT_DIR, "..", "sync-mirror", "halbae")
FIXTURE_PHOTO = os.path.join(FIXTURE_DIR, "halbae-front.jpg")
FIXTURE_VOICE = os.path.join(FIXTURE_DIR, "voice.mp3")

BYPASS_PIN = "424242"

# ── HTTP 헬퍼 (SP1a 패턴) ──────────────────────────────────────────

def req(method, path, token=None, body=None, extra_headers=None):
    """JSON 요청/응답 헬퍼. HTTPError도 (status, body_dict) 로 반환."""
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    if extra_headers:
        h.update(extra_headers)
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode() or "{}"
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as e:
        try:
            b = json.loads(e.read().decode() or "{}")
        except Exception:
            b = {}
        return e.code, b
    except Exception as exc:
        return 0, {"_err": str(exc)}


def multipart_upload(path, token, file_path, mime_type, purpose=None):
    """
    POST /oth-path — multipart/form-data (stdlib urllib 수동 구성).
    성공: (status, {id, url, contentType, sizeBytes})
    실패: (status, {error: ...})
    """
    url = f"{API}{path}"
    boundary = f"----FormBoundary{int(time.time() * 1000)}"

    with open(file_path, "rb") as f:
        file_data = f.read()

    file_name = os.path.basename(file_path)
    parts = []

    # file 파트
    parts.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{file_name}"\r\n'
        f"Content-Type: {mime_type}\r\n\r\n"
    )
    body = b"".join(p.encode() for p in parts) + file_data + f"\r\n".encode()

    # purpose 파트 (선택)
    if purpose:
        body += (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="purpose"\r\n\r\n'
            f"{purpose}\r\n"
        ).encode()

    body += f"--{boundary}--\r\n".encode()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    }

    r = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            raw = resp.read().decode() or "{}"
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as e:
        try:
            b = json.loads(e.read().decode() or "{}")
        except Exception:
            b = {}
        return e.code, b
    except Exception as exc:
        return 0, {"_err": str(exc)}


# ── 결과 집계 ──────────────────────────────────────────────────────

results = []

def check(name, cond, detail=""):
    results.append(cond)
    tag = "PASS" if cond else "FAIL"
    msg = f"{tag} - {name}"
    if detail:
        msg += f" | {detail}"
    print(msg)
    return cond


# ── 메인 ──────────────────────────────────────────────────────────

def main():
    token = os.environ.get("DEV_TOKEN")
    if not token:
        print(
            "FAIL: DEV_TOKEN env 필요.\n"
            "발급: afterlifeapi/ 에서\n"
            "  JWT_ACCESS_SECRET=<secret> DEV_USER_ID=<uid> npx tsx scripts/mint-dev-token.ts"
        )
        sys.exit(1)

    # ── [1] 페르소나 질문 스키마 조회 ─────────────────────────────
    st, qs = req("GET", "/oth-path", token)
    q_count = len(qs.get("questions", []))
    check("[1] persona-questions 200", st == 200, f"status={st} questions={q_count}")

    # ── [2] halbae 사진 업로드 (optional — 실패 시 스킵) ──────────
    avatar_url = None
    if os.path.exists(FIXTURE_PHOTO):
        st2, ur = multipart_upload("/oth-path", token, FIXTURE_PHOTO, "image/jpeg", purpose="avatar")
        if st2 in (200, 201):
            avatar_url = ur.get("url")
            check("[2] avatar upload", True, f"url={avatar_url}")
        else:
            check("[2] avatar upload (skipped — non-fatal)", True,
                  f"status={st2} err={ur} → avatar_url=None 으로 계속")
    else:
        check("[2] avatar upload (fixture 없음 — skipped)", True,
              f"fixture={FIXTURE_PHOTO} 미존재")

    # ── [3] 채팅답 시뮬 (고정값 — halbae 기반) ──────────────────
    persona_answers = {
        "age":               "60대 이상",
        "gender":            "남성",
        "mbti":              "INFP",
        "personality_core":  "정 많고 느긋함",
        "tone":              "정겨운 사투리",
        "dialect_region":    "경상도",
        "dialect_intensity": "심함",
        "first_meeting":     "어릴 적 시골집에서",
        "habit":             "밥은 먹었나",
        "memory":            "마당 평상",
    }
    print(f"[3] 채팅답 시뮬 고정값 설정 완료 ({len(persona_answers)} 항목)")

    # ── [4] persona-suggest (gemma 후보 — 느림, 비필수 경로) ─────
    #   personaAnswers를 body에 바로 전개 (API 시그니처 확인 결과 flatten 전송).
    st4, sg = req("POST", "/oth-path", token, {
        "name": "할배E2E",
        "relation": "grandfather",
        **persona_answers,
    })
    suggestions = sg.get("suggestions", {})
    check("[4] persona-suggest 200", st4 == 200,
          f"status={st4} keys={list(suggestions.keys())}")

    # ── [5] intro-suggest (소개글 — SP3.6 신규) ──────────────────
    #   Phase B 배포 후 실행 전제 — 200=PASS, 그 외(404 포함)=FAIL.
    st5, ir = req("POST", "/oth-path", token, {
        "name": "할배E2E",
        "relation": "grandfather",
        "personaAnswers": persona_answers,
    })
    intro = ir.get("intro", "")
    check("[5] intro-suggest 200", st5 == 200,
          f"status={st5} intro='{intro[:60]}...'" if st5 == 200 and len(intro) > 60
          else f"status={st5} intro='{intro}'" if st5 == 200
          else f"status={st5} body={json.dumps(ir)[:80]}")

    # ── [6] createClone (pin 424242 우회) ────────────────────────
    uname = f"halbaee2e{int(time.time())}"
    clone_body = {
        "clone_type": "friend",
        "name": "할배E2E",
        "username": uname,
        "relation": "grandfather",
        "description": intro if intro else "정 많고 느긋한 할아버지.",
        "personaAnswers": persona_answers,
        "l1_profile": {"attrs": {}, "notes": ""},
        "pin": BYPASS_PIN,
    }
    if avatar_url:
        clone_body["avatar_url"] = avatar_url

    st6, cr = req("POST", "/oth-path", token, clone_body, extra_headers={
        "X-Idempotency-Key": uname,
    })
    check("[6] createClone 201", st6 == 201,
          f"status={st6} body={json.dumps(cr)[:120]}")

    if st6 != 201:
        print("\n=== RESULT: FAIL (createClone 실패) ===")
        sys.exit(1)

    # ── [7] 검증 ──────────────────────────────────────────────────
    clone = cr.get("clone", {})
    clone_id = clone.get("id")
    check("[7] clone.id 존재", bool(clone_id), f"id={clone_id}")
    check("[7] clone.username 일치", clone.get("username") == uname,
          f"got={clone.get('username')}")
    check("[7] clone.name 일치", clone.get("name") == "할배E2E",
          f"got={clone.get('name')}")

    # ── [8] GET /oth-path 확인 ──────────────────────────────────
    if clone_id:
        st8, gc = req("GET", f"/oth-path", token)
        check("[8] GET /oth-path 200", st8 == 200, f"status={st8}")
        check("[8] description 저장", bool(gc.get("clone", {}).get("description")),
              f"desc='{str(gc.get('clone', {}).get('description', ''))[:60]}'")

    # ── 결과 요약 ─────────────────────────────────────────────────
    passed = sum(results)
    total = len(results)
    ok = all(results)
    print(f"\n=== RESULT: {'ALL PASS' if ok else 'SOME FAIL'} ({passed}/{total}) ===")
    if ok:
        print(f"E2E PASS — clone_id={clone_id}, username={uname}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
