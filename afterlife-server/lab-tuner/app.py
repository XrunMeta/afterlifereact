from __future__ import annotations
import asyncio
import json
import logging
import os
import pathlib
import re

import aiohttp
from aiohttp import web
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
_LOOPBACK_REMOTES = {"127.0.0.1", "::1"}


def _is_loopback_remote(remote: str | None) -> bool:
    return remote in _LOOPBACK_REMOTES


def _dev_token_response(remote: str | None, token: str | None) -> web.Response:
    """순수 함수 — request 객체 없이도 단위테스트 가능하게 반환 로직만 분리."""
    if not _is_loopback_remote(remote):
        return web.json_response({"error": "loopback 전용"}, status=403)
    # LAB_TUNER_TOKEN 미설정(로컬 개발, 인증우회 모드)이면 token=null만 반환.
    return web.json_response({"token": token})


def build_app(registry, factory, store, say_fn=None, render_url=None, guard=None) -> web.Application:
    # say_fn/render_url/guard는 Task 9·12에서 사용(초기 Task 11 단계는 None 허용).
    app = make_app(pipeline_factory=factory)   # /offer /healthz /static/ /prebuild
    app["lab_registry"] = registry
    app["lab_store"] = store
    app["lab_guard"] = guard
    app["lab_metrics"] = {"last": {}}

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
                payload = json.dumps(app["lab_metrics"]["last"])
                await resp.write(f"data: {payload}\n\n".encode())
                await asyncio.sleep(0.5)
        except (asyncio.CancelledError, ConnectionResetError):
            pass
        return resp

    async def index(_req):
        return web.FileResponse(_STATIC / "tuner.html")

    async def tuner_js(_req):
        return web.FileResponse(_STATIC / "tuner.js")

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
        proc = subprocess.run(
            ["sudo", "systemctl", "restart", "afterlife-prethird"],
            capture_output=True, text=True, timeout=30,
        )
        status = subprocess.run(
            ["systemctl", "show", "afterlife-prethird", "--property=MainPID"],
            capture_output=True, text=True, timeout=10,
        )
        return web.json_response({
            "restart_returncode": proc.returncode,
            "restart_stderr": proc.stderr,
            "mainpid_info": status.stdout.strip(),
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
    app.router.add_get("/production-status", production_status)
    return app
