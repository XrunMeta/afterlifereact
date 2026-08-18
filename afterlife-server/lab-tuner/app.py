from __future__ import annotations
import asyncio
import json
import logging
import os
import pathlib
import re

import aiohttp
from aiohttp import web
from html import escape as _html_escape
from signaling import make_app          # prethird
from live_guard import LiveBusyError
from knobs import KNOB_META
import promote
import prod_status

log = logging.getLogger("lab-tuner.app")

_STATIC = pathlib.Path(__file__).resolve().parent / "static"

# clone+login UI — prethird chat_endpoint.py의 verify_login/verify_clones와 동일 패턴
# (api 프록시). 라이브 chat_endpoint.py는 무수정 — 패턴만 참고.
_API_BASE = os.environ.get(
    "PRETHIRD_API_BASE",
    "https://edge-alt-preview.example.invalid",
)
_API_TIMEOUT_S = float(os.environ.get("PRETHIRD_LOGIN_API_TIMEOUT", "5.0"))
_BROWSER_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
               "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")


def _bearer(req) -> str | None:
    h = req.headers.get("Authorization", "")
    return h[7:] if h.startswith("Bearer ") else None

# el RISK: run_id는 ArtifactStore._next_id()가 생성하는 "run{n:05d}" 형식만 허용.
# store.path()/load_text() 등에 넘기기 전 반드시 이 가드를 통과해야 한다
# (경로탈출 방지 — "/", ".." 등 포함 값은 전부 거부).
_RUN_ID_RE = re.compile(r"^run\d+$")


def _validate_run_id(rid) -> str | None:
    """rid가 유효한 run_id 형식이 아니면 에러 메시지, 유효하면 None."""
    if not isinstance(rid, str) or not _RUN_ID_RE.match(rid):
        return f"invalid run_id: {rid!r}"
    return None


# T-113: /dev-token — LAB_TUNER_TOKEN(admin 토큰, sudo restart 게이트) 자동주입.
# ssh -L 터널로 접근하면 원격 서버 입장에서 요청이 127.0.0.1/::1로 도착하므로
# 터널 전용 접근만 통과시킨다. X-Forwarded-For 등 프록시 헤더는 클라이언트가
# 임의로 실어보낼 수 있어(스푸핑) 절대 신뢰하지 않고, aiohttp가 TCP 소켓에서
# 직접 얻는 request.remote(peername)만 판정 기준으로 삼는다.
#
# opus 최종리뷰 Important: 공유 호스트에서는 loopback 판정만으로는 부족하다
# (같은 머신의 다른 로컬 프로세스·다른 SSH 터널 유저가 curl localhost/dev-token
# 으로 관리자 토큰을 탈취 가능). 이 엔드포인트는 **단일테넌트 SSH-터널 호스트
# 전용**이다 — env LAB_TUNER_DEV_TOKEN_ENABLE="1" 을 명시적으로 설정해야만
# 활성화되며(opt-in), 미설정 시 라우트 자체가 404(존재 자체를 감춘다).
# ⚠️ 공유/멀티테넌트 호스트에서는 LAB_TUNER_DEV_TOKEN_ENABLE 을 절대 설정하지 말 것.
_LOOPBACK_REMOTES = {"127.0.0.1", "::1"}
_DEV_TOKEN_ENABLE_ENV = "LAB_TUNER_DEV_TOKEN_ENABLE"


def _dev_token_enabled() -> bool:
    return os.environ.get(_DEV_TOKEN_ENABLE_ENV) == "1"


def _is_loopback_remote(remote: str | None) -> bool:
    return remote in _LOOPBACK_REMOTES


def _dev_token_response(remote: str | None, token: str | None) -> web.Response:
    """순수 함수 — request 객체 없이도 단위테스트 가능하게 반환 로직만 분리."""
    if not _is_loopback_remote(remote):
        return web.json_response({"error": "loopback 전용"}, status=403)
    # LAB_TUNER_TOKEN 미설정(로컬 개발, 인증우회 모드)이면 token=null만 반환.
    return web.json_response({"token": token})


def _sh(cmd, timeout=30):
    """systemctl 등 외부 명령 1회 실행. 테스트가 통째로 갈아끼운다."""
    import subprocess
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def _render_healthy(url, tries=45, delay=2.0) -> bool:
    """렌더서버가 다시 응답할 때까지 폴링. 임의 sleep 대신 조건으로 기다린다.

    상한을 넉넉히(90초) 잡는 이유: fifth 는 TensorRT 엔진과 JoyVASA 모델을 다시
    올린다. 너무 일찍 포기하면 **정상 기동 중인 서버를 실패로 보고 롤백**하고,
    그 롤백이 또 한 번의 재기동을 부른다 — 거짓 실패가 진짜 중단보다 나쁘다.
    """
    import time
    import urllib.request
    for i in range(tries):
        try:
            with urllib.request.urlopen(f"{url}/health", timeout=3) as r:
                if r.status == 200:
                    return True
        except Exception:
            pass
        if i < tries - 1:
            time.sleep(delay)
    return False


def build_app(registry, factory, store, say_fn=None, render_url=None, guard=None,
              metrics=None, renderer=None) -> web.Application:
    # say_fn/render_url/guard는 Task 9·12에서 사용(초기 Task 11 단계는 None 허용).
    app = make_app(pipeline_factory=factory)   # /offer /healthz /static/ /prebuild
    app["lab_registry"] = registry
    app["lab_store"] = store
    app["lab_guard"] = guard
    # metrics: TurnMetrics | None. None 이면 /metrics 는 빈 dict 를 흘려보낸다
    # (기존 동작 — 이 키는 하위호환을 위해 남긴다).
    app["lab_metrics"] = {"last": {}}
    app["lab_turn_metrics"] = metrics
    app["lab_renderer"] = renderer     # last_sent(마지막 /render 전송값) 조회용

    # mizu HIGH 3: promote mutating 엔드포인트(apply/rollback/restart) 인증.
    # LAB_TUNER_TOKEN 미설정(로컬 개발) 시 통과시키되 기동 시 경고 로그 1회.
    _lab_tuner_token = os.environ.get("LAB_TUNER_TOKEN")
    if not _lab_tuner_token:
        log.warning(
            "LAB_TUNER_TOKEN 미설정 — /promote/apply·rollback·restart 인증 없음"
            "(로컬 개발 전용, 배포 전 반드시 설정할 것)"
        )

    def _auth_or_401(req):
        """LAB_TUNER_TOKEN 설정 시 X-Lab-Tuner-Token 헤더 검증.
        실패 시 401 Response, 통과(또는 토큰 미설정) 시 None."""
        if not _lab_tuner_token:
            return None
        got = req.headers.get("X-Lab-Tuner-Token")
        if got != _lab_tuner_token:
            return web.json_response({"error": "invalid or missing X-Lab-Tuner-Token"}, status=401)
        return None

    async def dev_token(req):
        # mizu 정책: 토큰 값을 로그에 남기지 않는다(응답 바디로만 전달, 여기서 log 호출 없음).
        # opus Important: opt-in 게이트 미설정 시 라우트 존재 자체를 감춘다(404).
        if not _dev_token_enabled():
            raise web.HTTPNotFound()
        return _dev_token_response(req.remote, _lab_tuner_token)

    async def live_status(_req):
        busy = guard.is_busy() if guard is not None else False
        return web.json_response({"busy": busy})

    async def get_knobs(_req):
        return web.json_response(registry.get().to_dict())

    async def get_knobs_meta(_req):
        return web.json_response({"meta": KNOB_META})

    async def list_runs(_req):
        # UI run 타임라인(tuner.js loadRuns) — ArtifactStore.list_runs() 그대로 노출.
        # 읽기 전용 GET, 사용자 입력 없음(경로탈출 위험 없음).
        return web.json_response(store.list_runs())

    async def post_knobs(req):
        partial = await req.json()
        merged = registry.update(partial)
        return web.json_response(merged.to_dict())

    async def metrics_sse(req):
        resp = web.StreamResponse()
        resp.headers["Content-Type"] = "text/event-stream"
        resp.headers["Cache-Control"] = "no-cache"
        await resp.prepare(req)
        try:
            while True:
                _tm = app.get("lab_turn_metrics")
                snap = _tm.snapshot() if _tm is not None else dict(app["lab_metrics"]["last"])
                # 마지막 렌더에 실제로 실려 간 파라미터를 함께 흘려보낸다.
                # UI 가 "적용됐나?" 를 추측하지 않고 실제 전송값을 보여줄 수 있다.
                # 클래스 변수라 통화·replay 어느 경로로 보냈든 잡힌다.
                from harness import KnobsFifthInproc
                snap["last_render"] = KnobsFifthInproc.last_sent
                payload = json.dumps(snap)
                await resp.write(f"data: {payload}\n\n".encode())
                await asyncio.sleep(0.5)
        except (asyncio.CancelledError, ConnectionResetError):
            pass
        return resp

    # opus 최종리뷰 Minor: 로그인 비번을 tuner.html(정적 소스, VCS 추적)에 하드코딩하지
    # 않는다. serve-time 에 LAB_TUNER_DEV_PASSWORD 가 설정돼 있으면 그 값을 prefill,
    # 없으면 빈 값 그대로 서빙한다 — 소스·VCS 어디에도 평문 비번이 남지 않는다.
    _PW_PLACEHOLDER = (
        'id="login-pw" type="password" placeholder="password" '
        'autocomplete="current-password" value=""'
    )

    async def index(_req):
        html_text = (_STATIC / "tuner.html").read_text(encoding="utf-8")
        dev_password = os.environ.get("LAB_TUNER_DEV_PASSWORD")
        if dev_password:
            html_text = html_text.replace(
                _PW_PLACEHOLDER,
                _PW_PLACEHOLDER.replace('value=""', f'value="{_html_escape(dev_password, quote=True)}"'),
            )
        # mizu MEDIUM: LAB_TUNER_DEV_PASSWORD 설정 시 본문에 평문 비번이 실리므로
        # 브라우저/중간 프록시 캐시에 남지 않도록 no-store 강제(무설정 시에도 일관 적용).
        return web.Response(text=html_text, content_type="text/html",
                             headers={"Cache-Control": "no-store"})

    async def tuner_js(_req):
        # no-cache 강제 — 배포가 잦은데 파일명에 버전이 없어서, 브라우저가
        # Last-Modified 휴리스틱으로 옛 번들을 계속 실행하는 일이 실제로 있었다
        # (외부 URL 에서 새 함수가 undefined 로 나옴). 재검증만 하게 만든다.
        return web.FileResponse(_STATIC / "tuner.js",
                                headers={"Cache-Control": "no-cache"})

    async def login_proxy(req):
        """api POST /oth-path 프록시 — accessToken만 반환.

        ⚠️ 비밀번호·업스트림 예외 본문은 절대 로깅하지 않는다(chat_endpoint.verify_login
        과 동일 원칙) — 예외 시 type(e).__name__만 남긴다.
        """
        body = await req.json()
        email = body.get("email")
        password = body.get("password")
        if not email or not password:
            return web.json_response({"error": "email/password required"}, status=400)
        url = f"{_API_BASE}/oth-path"
        payload = json.dumps({"email": email, "password": password, "platform": "web"}).encode("utf-8")
        try:
            timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
            async with aiohttp.ClientSession(timeout=timeout) as sess:
                async with sess.post(url, data=payload, headers={
                    "Content-Type": "application/json",
                    "User-Agent": _BROWSER_UA,
                }) as r:
                    txt = await r.text()
                    if r.status != 200:
                        return web.json_response({"error": "login failed", "status": r.status}, status=r.status)
                    data = json.loads(txt)
        except Exception as e:
            log.warning("login_proxy failed: %s", type(e).__name__)  # 비번·예외 본문 미로깅
            return web.json_response({"error": "login error"}, status=502)
        return web.json_response({"accessToken": data.get("accessToken")})

    async def clones_proxy(req):
        """api GET /oth-path 프록시 — {id,name}만 추려 드롭다운에 제공."""
        token = _bearer(req)
        if not token:
            return web.json_response({"error": "missing bearer token"}, status=401)
        url = f"{_API_BASE}/oth-path"
        try:
            timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
            async with aiohttp.ClientSession(timeout=timeout) as sess:
                async with sess.get(url, headers={
                    "Authorization": f"Bearer {token}",
                    "User-Agent": _BROWSER_UA,
                }) as r:
                    if r.status != 200:
                        return web.json_response({"error": f"api {r.status}"}, status=r.status)
                    data = await r.json()
        except Exception as e:
            log.warning("clones_proxy failed: %s", type(e).__name__)
            return web.json_response({"error": "upstream error"}, status=502)
        items = data.get("items") or []
        clones = [{"id": it.get("id"), "name": it.get("name")}
                  for it in items if it.get("id") is not None]
        return web.json_response({"clones": clones})

    async def replay_tts(req):
        data = await req.json()
        rid = data.get("run_id")
        err = _validate_run_id(rid)
        if err:
            return web.json_response({"error": err}, status=400)
        if say_fn is None:
            return web.json_response({"error": "say_fn 미주입"}, status=503)
        # el S12b MINOR: 무발화턴(llm.txt 없음) → 렌더/로드 실패로 인한 500 대신 404.
        llm_path = store.path(rid, "llm.txt")
        if not os.path.exists(llm_path):
            return web.json_response({"error": f"run_id에 llm.txt 없음(무발화턴?): {rid}"}, status=404)
        text = store.load_text(rid, "llm.txt")
        wav = await say_fn(text, data.get("se_path"))
        store.save_bytes(rid, "answer.wav", wav)
        return web.json_response({"run_id": rid, "bytes": len(wav)})

    async def replay_fifth(req):
        data = await req.json()
        rid = data.get("run_id")
        err = _validate_run_id(rid)
        if err:
            return web.json_response({"error": err}, status=400)
        if guard is not None:
            try:
                guard.assert_free()
            except LiveBusyError as exc:
                return web.json_response({"error": str(exc)}, status=409)
        wav_path = store.path(rid, "answer.wav")
        # el S12b MINOR: 무발화턴(answer.wav 없음) → 렌더 실패로 인한 500 대신 404.
        if not os.path.exists(wav_path):
            return web.json_response({"error": f"run_id에 answer.wav 없음(무발화턴?): {rid}"}, status=404)
        # 공유 라이브 렌더(:8810)에 직접 /render POST (KnobsFifthInproc 재사용)
        import harness
        renderer = harness.KnobsFifthInproc(data.get("video_path", ""), registry=registry,
                                             render_url=render_url)
        renderer.load()
        n = [0]
        renderer.infer(wav_path,
                       lambda arr: n.__setitem__(0, n[0] + 1),
                       video_path=data.get("video_path"))
        return web.json_response({"run_id": rid, "frames": n[0]})

    def _read_env(name: str) -> str:
        # 현재 라이브 값 조회 — 프로세스 env(systemd EnvironmentFile로 로드된 값과 동일).
        return os.environ.get(name, "")

    async def promote_preview(_req):
        # preview는 read-only라 토큰 인증 대상에서 제외(el/mizu 합의).
        entries = promote.diff(registry.get(), _read_env, dirty=registry.dirty())
        return web.json_response({"entries": entries})

    async def promote_apply(req):
        unauthorized = _auth_or_401(req)
        if unauthorized is not None:
            return unauthorized
        try:
            data = await req.json()
        except Exception:
            data = {}
        confirm = data.get("confirm") is True
        # el BLOCKER 2: dirty(이번 세션에 실제로 튜닝한 knob)만 promote 후보.
        entries = promote.diff(registry.get(), _read_env, dirty=registry.dirty())
        applicable = [e for e in entries if not e.get("container")]
        container_warnings = [e for e in entries if e.get("container")]
        # ⚠️ confirm:true 가 없으면 무조건 dry_run=True 강제(라이브 파일 미변경).
        try:
            result = promote.apply(
                applicable,
                write_fn=promote.upsert_env_line,
                backup_fn=promote.backup_file,
                dry_run=not confirm,
            )
        except ValueError as exc:
            # mizu VETO(CRITICAL 1): 화이트리스트 위반(systemd 인젝션 시도) → 400, 파일 미변경.
            return web.json_response({"error": str(exc)}, status=400)
        result["container_warnings"] = container_warnings   # fifth.* — 컨테이너 재기동/커밋 필요, apply 대상 제외
        return web.json_response(result)

    async def promote_rollback(req):
        unauthorized = _auth_or_401(req)
        if unauthorized is not None:
            return unauthorized
        try:
            data = await req.json()
        except Exception:
            data = {}
        backup_id = data.get("backup_id")
        try:
            target = promote.rollback(backup_id, promote.restore_file)
        except (ValueError, OSError) as exc:
            return web.json_response({"error": str(exc)}, status=400)
        return web.json_response({"restored": target})

    async def promote_restart(req):
        unauthorized = _auth_or_401(req)
        if unauthorized is not None:
            return unauthorized
        # 2단계 확인: body에 정확한 confirm 토큰 + confirm2=true 둘 다 필요.
        # 이 핸들러가 실제로 systemctl restart를 실행하는 유일한 경로 — 사람이
        # 직접 호출할 때만 이 두 조건을 동시에 만족시킬 수 있게 의도적으로 엄격함.
        try:
            data = await req.json()
        except Exception:
            data = {}
        if data.get("confirm") != "RESTART" or data.get("confirm2") is not True:
            return web.json_response(
                {"error": "2단계 확인 필요: body={'confirm':'RESTART','confirm2':true}"},
                status=400,
            )
        import subprocess
        # 뒷정리(실서버 검증에서 확인된 gap): promote가 drop-in(lab-tuner.conf)을
        # 새로 쓰거나 고치면 systemd 유닛이 "changed on disk" 상태가 되어,
        # daemon-reload 없이 restart하면 옛 env로 뜬다(수동 daemon-reload로만
        # batch가 반영됐던 사례) — restart 앞에서 항상 선행한다. daemon-reload가
        # 실패해도 restart 자체는 시도하되(fail-open), 실패 사실은 응답에 남긴다.
        reload_proc = subprocess.run(
            ["sudo", "systemctl", "daemon-reload"],
            capture_output=True, text=True, timeout=30,
        )
        proc = subprocess.run(
            ["sudo", "systemctl", "restart", "afterlife-prethird"],
            capture_output=True, text=True, timeout=30,
        )
        status = subprocess.run(
            ["systemctl", "show", "afterlife-prethird", "--property=MainPID"],
            capture_output=True, text=True, timeout=10,
        )
        return web.json_response({
            "daemon_reload_returncode": reload_proc.returncode,
            "daemon_reload_stderr": reload_proc.stderr,
            "restart_returncode": proc.returncode,
            "restart_stderr": proc.stderr,
            "mainpid_info": status.stdout.strip(),
        })

    async def flp_config(_req):
        """3층(FLP) 읽기전용 스냅샷 — 컨테이너 렌더서버 GET /oth-path 프록시.

        랩은 컨테이너 밖(호스트)에서 돌아 yaml 을 직접 못 읽는다.
        렌더서버가 죽어 있어도 랩 자체는 계속 떠 있어야 하므로 예외를 삼키고
        200 + error 로 응답한다(UI 는 패널에만 '조회 실패' 를 띄운다).
        """
        url = render_url or os.environ.get("FIFTH_RENDER_URL", "http://127.0.0.1:8810")
        try:
            timeout = aiohttp.ClientTimeout(total=3)
            async with aiohttp.ClientSession(timeout=timeout) as s:
                async with s.get(f"{url}/config") as r:
                    return web.json_response(await r.json())
        except Exception as exc:
            return web.json_response({"error": f"렌더서버 조회 실패: {exc}"})

    async def render_logs(req):
        """fifth 렌더서버 로그 프록시 — 파라미터가 실제 렌더까지 갔는지 화면에서 확인.

        렌더서버는 systemd + docker exec 조합이라 stdout 이 journal 에도 파일에도
        안 남는 경우가 있다. 서버가 메모리 링버퍼에 들고 있는 것을 그대로 내준다.
        since 커서로 증분 조회한다(폴링마다 전량 전송 방지).
        """
        url = render_url or os.environ.get("FIFTH_RENDER_URL", "http://127.0.0.1:8810")
        since = req.query.get("since", "0")
        try:
            timeout = aiohttp.ClientTimeout(total=4)
            async with aiohttp.ClientSession(timeout=timeout) as s:
                async with s.get(f"{url}/logs", params={"since": since}) as r:
                    return web.json_response(await r.json())
        except Exception as exc:
            # 렌더서버가 죽어 있어도 랩은 계속 떠 있어야 한다.
            return web.json_response({"error": f"렌더서버 로그 조회 실패: {exc}", "lines": []})

    async def sources_list(req):
        """업로드 소스 목록(최신 우선). 저장 루트도 함께 내려 UI 가 경로를 보여준다."""
        err = _auth_or_401(req)
        if err is not None:
            return err
        import source_lab
        return web.json_response({
            "root": str(source_lab.root()),
            "sources": source_lab.list_sources(),
            "max_mb": source_lab.MAX_BYTES // 1048576,
            "idle_spec": {"sec": source_lab.IDLE_SEC, "fps": source_lab.IDLE_FPS,
                          "w": source_lab.IDLE_W, "h": source_lab.IDLE_H},
        })

    async def source_upload(req):
        """multipart 업로드 → lab-sources/{날짜시간}/source.ext (+ 영상이면 idle.mp4).

        용량은 **읽는 도중** 누적으로 막는다 — 전부 받고 나서 검사하면 상한을
        넘는 파일이 이미 메모리에 올라온 뒤다.
        """
        err = _auth_or_401(req)
        if err is not None:
            return err
        import source_lab
        try:
            reader = await req.multipart()
        except Exception as exc:
            return web.json_response({"error": f"multipart 파싱 실패: {exc}"}, status=400)

        filename, buf, total = None, [], 0
        while True:
            field = await reader.next()
            if field is None:
                break
            if field.name != "file":
                continue
            filename = field.filename or ""
            try:
                source_lab.kind_of(filename)   # 확장자는 바이트를 받기 전에 거른다
            except source_lab.SourceError as exc:
                return web.json_response({"error": str(exc)}, status=400)
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                total += len(chunk)
                if total > source_lab.MAX_BYTES:
                    return web.json_response(
                        {"error": f"용량 초과: {source_lab.MAX_BYTES // 1048576}MB 상한"},
                        status=413)
                buf.append(chunk)
            break

        if filename is None:
            return web.json_response({"error": "file 파트가 없습니다"}, status=400)
        try:
            meta = source_lab.save_bytes(b"".join(buf), filename)
        except source_lab.SourceError as exc:
            return web.json_response({"error": str(exc)}, status=400)
        except Exception as exc:
            log.warning("source upload 실패: %s", exc)
            return web.json_response({"error": f"저장 실패: {exc}"}, status=500)
        return web.json_response(meta)

    async def source_thumb(req):
        """목록 섬네일 이미지. 없으면 그 자리에서 만든다(구 업로드 호환).

        <img src> 로 직접 못 건다 — 인증이 커스텀 헤더라 img 태그가 못 싣는다.
        프런트가 fetch 로 받아 blob URL 로 붙인다(tuner.js loadSources).
        """
        err = _auth_or_401(req)
        if err is not None:
            return err
        import source_lab
        path = source_lab.ensure_thumb(req.query.get("id", ""))
        if not path:
            raise web.HTTPNotFound()
        # id 마다 내용이 고정이라 캐시해도 안전하다(같은 id 로 다른 그림이 오지 않는다).
        return web.FileResponse(path, headers={"Cache-Control": "public, max-age=3600"})

    async def source_delete(req):
        err = _auth_or_401(req)
        if err is not None:
            return err
        import source_lab
        data = await req.json()
        try:
            ok = source_lab.delete(data.get("id", ""))
        except source_lab.SourceError as exc:
            return web.json_response({"error": str(exc)}, status=400)
        # 지운 소스를 노브가 아직 가리키고 있으면 클론 기본으로 되돌린다
        # (resolve 가 fail-open 이라 통화는 살지만, UI 가 유령 id 를 보여주지 않게).
        if ok and registry.get().source.render_source == data.get("id"):
            registry.update({"source": {"render_source": ""}})
        return web.json_response({"deleted": ok})

    async def voices_list(req):
        """업로드 음성 목록(최신 우선). 저장 루트도 함께 내려 UI 가 경로를 보여준다."""
        err = _auth_or_401(req)
        if err is not None:
            return err
        import voice_lab
        return web.json_response({
            "root": str(voice_lab.root()),
            "voices": voice_lab.list_voices(),
            "max_mb": voice_lab.MAX_BYTES // 1048576,
            "exts": list(voice_lab.AUDIO_EXTS),
        })

    async def voice_upload(req):
        """multipart 업로드 → reference_voices/lab-{날짜시간}/voice.wav (+ 참조 문장).

        선택 필드 ref_text 를 같이 보내면 그것을 참조 문장으로 쓰고 STT 를 건너뛴다
        (전사가 422 로 거부되는 음성도 쓸 수 있게 하는 탈출구).

        용량은 **읽는 도중** 누적으로 막는다 — source_upload 와 같은 이유다.
        """
        err = _auth_or_401(req)
        if err is not None:
            return err
        import voice_lab
        try:
            reader = await req.multipart()
        except Exception as exc:
            return web.json_response({"error": f"multipart 파싱 실패: {exc}"}, status=400)

        filename, buf, total, ref_text = None, [], 0, None
        while True:
            field = await reader.next()
            if field is None:
                break
            if field.name == "ref_text":
                ref_text = (await field.text()).strip()
                continue
            if field.name != "file":
                continue
            filename = field.filename or ""
            try:
                voice_lab.check_ext(filename)  # 확장자는 바이트를 받기 전에 거른다
            except voice_lab.VoiceError as exc:
                return web.json_response({"error": str(exc)}, status=400)
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                total += len(chunk)
                if total > voice_lab.MAX_BYTES:
                    return web.json_response(
                        {"error": f"용량 초과: {voice_lab.MAX_BYTES // 1048576}MB 상한"},
                        status=413)
                buf.append(chunk)
            # file 파트 뒤에 ref_text 가 올 수 있으므로 여기서 끊지 않는다.

        if filename is None:
            return web.json_response({"error": "file 파트가 없습니다"}, status=400)
        try:
            meta = voice_lab.save_bytes(b"".join(buf), filename, ref_text=ref_text)
        except voice_lab.VoiceError as exc:
            return web.json_response({"error": str(exc)}, status=400)
        except Exception as exc:
            log.warning("voice upload 실패: %s", exc)
            return web.json_response({"error": f"저장 실패: {exc}"}, status=500)
        return web.json_response(meta)

    async def voice_delete(req):
        err = _auth_or_401(req)
        if err is not None:
            return err
        import voice_lab
        data = await req.json()
        try:
            ok = voice_lab.delete(data.get("id", ""))
        except voice_lab.VoiceError as exc:
            # 랩이 만들지 않은 디렉터리(= 실 클론 음성 자산) 요청도 여기로 온다.
            return web.json_response({"error": str(exc)}, status=400)
        if ok and registry.get().source.voice_source == data.get("id"):
            registry.update({"source": {"voice_source": ""}})
        return web.json_response({"deleted": ok})

    def _fifth_changes():
        """현재 유닛의 env 대비 바뀔 항목. (변경목록, ExecStart 원문)."""
        unit = open(promote.FIFTH_UNIT, encoding="utf-8").read()
        exec_start = promote.extract_exec_start(unit)
        _, cur_env, _ = promote._parse_exec_env(exec_start)
        # 🔴 이번 세션에 실제로 바꾼 값만 굽는다. 랩 노브 기본값이 렌더서버 실제값과
        # 같다는 보장이 없어(2026-08-18: 랩 cfg_scale=2.0 vs 렌더서버 /config 1.2 —
        # FLP yaml 이 덮는다) 전부 구우면 건드리지도 않은 라이브 동작이 바뀐다.
        want = promote.fifth_env_updates(registry.get(), dirty=registry.dirty())
        changes = [{"env": k, "current": cur_env.get(k), "new": v}
                   for k, v in want.items() if cur_env.get(k) != v]
        return changes, exec_start

    async def render_preview(req):
        """렌더서버 재기동으로 바뀔 값 미리보기. 아무것도 실행하지 않는다."""
        err = _auth_or_401(req)
        if err is not None:
            return err
        try:
            changes, _ = _fifth_changes()
        except (OSError, ValueError) as exc:
            return web.json_response({"error": f"유닛 조회 실패: {exc}", "changes": []},
                                     status=500)
        return web.json_response({
            "changes": changes,
            "service": promote.FIFTH_SERVICE,
            "shared_with_live": True,   # UI 가 경고 문구를 띄우는 근거
        })

    async def render_restart(req):
        """fifth 렌더서버 env 반영 + 재기동.

        🔴 이 컨테이너는 라이브 통화와 공유한다 — 재기동하면 진행 중인 통화가 끊긴다.
        그래서 (1) 토큰 (2) 2단계 확인 (3) 라이브 통화 0건, 셋을 모두 요구한다.
        🔴 기동에 실패하면 사람 손을 기다리지 않고 즉시 되돌린다. 렌더서버가 안 뜨면
        라이브가 통째로 죽기 때문이다.
        """
        err = _auth_or_401(req)
        if err is not None:
            return err
        try:
            data = await req.json()
        except Exception:
            data = {}
        if data.get("confirm") != "RESTART_RENDER" or data.get("confirm2") is not True:
            return web.json_response(
                {"error": "2단계 확인 필요: body={'confirm':'RESTART_RENDER','confirm2':true}"},
                status=400)
        if guard is not None and guard.active_sessions() > 0:
            return web.json_response(
                {"error": "라이브 통화가 진행 중입니다 — 렌더서버를 재기동하면 그 통화가 끊깁니다"},
                status=409)

        try:
            changes, exec_start = _fifth_changes()
        except (OSError, ValueError) as exc:
            return web.json_response({"error": f"유닛 조회 실패: {exc}"}, status=500)
        if not changes:
            return web.json_response(
                {"error": "바뀔 값이 없습니다 — 재기동하지 않았습니다", "changes": []},
                status=400)
        try:
            content = promote.build_fifth_dropin(
                exec_start, {c["env"]: c["new"] for c in changes})
        except (ValueError, promote.UnsafeEnvValueError) as exc:
            return web.json_response({"error": f"drop-in 조립 거부: {exc}"}, status=400)

        prev = None
        if os.path.isfile(promote.FIFTH_DROPIN):
            prev = open(promote.FIFTH_DROPIN, encoding="utf-8").read()
        # /etc/systemd/system 은 root 소유다 — os.makedirs 로는 PermissionError.
        # prethird 쪽 drop-in 디렉터리가 afterlife 소유인 것과 같은 상태로 만들어
        # 이후 쓰기는 sudo 없이 되게 한다(2026-08-18 서버 실측).
        _dir = os.path.dirname(promote.FIFTH_DROPIN)
        if not os.path.isdir(_dir):
            mk = _sh(["sudo", "mkdir", "-p", _dir])
            ch = _sh(["sudo", "chown", f"{os.getuid()}:{os.getgid()}", _dir])
            if mk.returncode != 0 or not os.path.isdir(_dir):
                return web.json_response(
                    {"error": f"drop-in 디렉터리 생성 실패: {mk.stderr or ch.stderr}"}, status=500)

        def _write(text):
            with open(promote.FIFTH_DROPIN, "w", encoding="utf-8") as f:
                f.write(text)

        def _restore():
            # 이전 상태로 되돌린다 — 없었으면 파일 자체를 지운다.
            if prev is None:
                try:
                    os.unlink(promote.FIFTH_DROPIN)
                except OSError:
                    pass
            else:
                _write(prev)
            _sh(["sudo", "systemctl", "daemon-reload"])
            _sh(["sudo", "systemctl", "restart", promote.FIFTH_SERVICE], timeout=120)

        _write(content)
        reload_proc = _sh(["sudo", "systemctl", "daemon-reload"])
        restart_proc = _sh(["sudo", "systemctl", "restart", promote.FIFTH_SERVICE], timeout=120)
        url = render_url or os.environ.get("FIFTH_RENDER_URL", "http://127.0.0.1:8810")
        healthy = _render_healthy(url)
        if not healthy:
            _restore()
            log.warning("[render-restart] 기동 실패 → 자동 롤백 (changes=%s)", changes)
            return web.json_response({
                "ok": False, "rolled_back": True, "changes": changes,
                "error": "렌더서버가 다시 뜨지 않아 이전 설정으로 되돌렸습니다",
                "restart_stderr": restart_proc.stderr,
            })
        log.info("[render-restart] 반영 완료: %s", changes)
        return web.json_response({
            "ok": True, "rolled_back": False, "changes": changes,
            "daemon_reload_returncode": reload_proc.returncode,
            "restart_returncode": restart_proc.returncode,
        })

    async def production_status(_req):
        import subprocess
        keys = [loc["env"] for path, loc in promote.KNOB_TO_LIVE.items()
                if not loc.get("container")]
        # drop-in conf 파싱
        try:
            with open(promote._PRETHIRD_DROPIN) as f:
                dropin = prod_status.parse_dropin(f.read())
        except OSError:
            dropin = {}
        # 프로덕션 prethird MainPID 실행 env
        mainpid = None
        running = {}
        try:
            out = subprocess.run(
                ["systemctl", "show", "afterlife-prethird", "--property=MainPID"],
                capture_output=True, text=True, timeout=10).stdout.strip()
            pid = int(out.split("=", 1)[1]) if "=" in out else 0
            if pid > 0:
                mainpid = pid
                running = prod_status.read_running_env(pid, keys)
        except (ValueError, OSError, subprocess.SubprocessError):
            pass
        rows = prod_status.drift(dropin, running, keys)
        return web.json_response({"mainpid": mainpid, "rows": rows,
                                  "generated_at": prod_status.kst_now()})

    app.router.add_get("/knobs", get_knobs)
    app.router.add_get("/knobs/meta", get_knobs_meta)
    app.router.add_post("/knobs", post_knobs)
    app.router.add_get("/runs", list_runs)
    app.router.add_get("/metrics", metrics_sse)
    app.router.add_get("/live-status", live_status)   # UI 배너(라이브 통화 중 튜닝 대기)
    app.router.add_get("/dev-token", dev_token)   # T-113: loopback(ssh 터널) 전용 토큰 자동주입
    app.router.add_get("/", index)
    app.router.add_get("/tuner.js", tuner_js)
    app.router.add_post("/login", login_proxy)
    app.router.add_get("/oth-path", clones_proxy)
    app.router.add_post("/replay/tts", replay_tts)
    app.router.add_post("/replay/fifth", replay_fifth)
    app.router.add_post("/promote/preview", promote_preview)
    app.router.add_post("/promote/apply", promote_apply)
    app.router.add_post("/promote/rollback", promote_rollback)
    app.router.add_post("/promote/restart", promote_restart)
    app.router.add_get("/promote/render-preview", render_preview)   # fifth env 미리보기
    app.router.add_post("/promote/render-restart", render_restart)  # fifth 렌더서버 재기동
    app.router.add_get("/production-status", production_status)
    app.router.add_get("/flp-config", flp_config)   # 3층 읽기전용 스냅샷
    app.router.add_get("/render-logs", render_logs)  # 렌더서버 로그 프록시
    app.router.add_get("/sources", sources_list)          # 업로드 소스 목록
    app.router.add_post("/source/upload", source_upload)  # 업로드(multipart)
    app.router.add_get("/voices", voices_list)             # 업로드 음성 목록
    app.router.add_post("/voice/upload", voice_upload)     # 음성 업로드(multipart)
    app.router.add_post("/voice/delete", voice_delete)
    app.router.add_get("/source/thumb", source_thumb)     # 목록 섬네일
    app.router.add_post("/source/delete", source_delete)
    return app
