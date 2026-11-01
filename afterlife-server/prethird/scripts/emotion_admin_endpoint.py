"""emotion_admin_endpoint.py — 관리자 감정 관리 endpoint (AFL-1072).

목소리 감정 은행(AFL-1069) 켜기/끄기·감정별 후보 고르기, 영상 감정 설정 저장.
설정은 공용 JSON 파일(EMOTION_CONFIG_PATH) 한 개 — CosyVoice 가 같은 파일을 mtime 으로 읽어
재시작 없이 반영한다. 영상(video) 값은 저장만 하고 이 모듈은 동작에 연결하지 않는다.

인증: `Authorization: Bearer <LEARN_SECRET | PRETHIRD_LEARN_SECRET>` (admin_records_endpoint 관례).
  비밀이 비어 있으면 모두 거부. afterlifeapi 의 requireAdmin 프록시만 호출한다.

Endpoints:
  GET /oth-path             → {config, source, candidates, emotions}
  PUT /oth-path             → 부분 갱신 후 GET 과 같은 모양
  GET /oth-path   → 후보 wav (audio/wav, no-store)
"""
from __future__ import annotations
import hmac
import json
import logging
import os
import re
import tempfile
from datetime import datetime, timedelta, timezone

from aiohttp import web

log = logging.getLogger("prethird.emotion_admin")

EMOTIONS = ["happy", "sad", "warm", "angry"]
EMO_LABEL_KO = {"happy": "기쁨", "sad": "슬픔", "warm": "다정", "angry": "화남"}
DEFAULT_CHOICE = {"happy": "happy_ainsley", "sad": "sad_hana", "warm": "warm_ainsley", "angry": "angry_ainsley"}
VIDEO_MODES = ("off", "all", "some")
MAX_CLONES = 500
CLONE_ID_RE = re.compile(r"^(?:[0-9]+|preset-[0-9]+)$")
SAMPLE_ID_RE = re.compile(r"^[a-z]+_[a-z0-9]+$")
KST = timezone(timedelta(hours=9))


def _secret() -> str:
    return (os.environ.get("LEARN_SECRET", "")
            or os.environ.get("PRETHIRD_LEARN_SECRET", ""))


def _config_path() -> str:
    return os.environ.get("EMOTION_CONFIG_PATH", "/data/emotion_config.json")


def _bank_dir() -> str:
    # 주의: 두 서비스(prethird·cosyvoice)가 반드시 같은 은행 디렉터리를 봐야 한다 —
    # 여기서 후보로 보이는 파일이 CosyVoice 에도 있어야 고른 후보가 실제로 쓰인다.
    return (os.environ.get("PRETHIRD_EMO_BANK_DIR")
            or os.environ.get("COSYVOICE_EMO_BANK_DIR")
            or "/data/emo_bank_20261030")


def _auth_ok(req: web.Request) -> bool:
    secret = _secret()
    if not secret:
        return False
    auth = req.headers.get("Authorization", "")
    return hmac.compare_digest(auth.encode(), f"Bearer {secret}".encode())


def _unauth() -> web.Response:
    return web.json_response({"error": "UNAUTHENTICATED"}, status=401)


def _candidates() -> dict:
    """{감정: [{id, label, speaker, text}]} — wav 와 비어있지 않은 같은 이름 txt 가 짝인 것만."""
    out = {e: [] for e in EMOTIONS}
    d = _bank_dir()
    try:
        names = sorted(os.listdir(d))
    except OSError:
        return out
    for fn in names:
        m = re.fullmatch(r"([a-z]+)_([a-z0-9]+)\.wav", fn)
        if not m or m.group(1) not in out:
            continue
        stem = fn[:-4]
        try:
            with open(os.path.join(d, stem + ".txt"), encoding="utf-8") as f:
                text = f.read().strip()
        except OSError:
            continue
        if not text:
            continue
        emo = m.group(1)
        out[emo].append({"id": stem, "label": "", "speaker": m.group(2), "text": text})
    for emo, items in out.items():
        for i, it in enumerate(items, 1):
            it["label"] = f"{EMO_LABEL_KO[emo]}{i}"
    return out


def _default_config(cands: dict) -> dict:
    ids = {c["id"] for items in cands.values() for c in items}
    return {
        "voice": {"enabled": False,
                  "choice": {e: n for e, n in DEFAULT_CHOICE.items() if n in ids}},
        "video": {"mode": "off", "clones": []},
        "updated_at": "",
        "updated_by": "",
    }


def _load_file() -> dict | None:
    """파일 → 정규화한 설정. 없거나 깨졌으면 None(= 기본값 취급)."""
    try:
        with open(_config_path(), encoding="utf-8") as f:
            raw = json.load(f)
        voice, video = raw["voice"], raw["video"]
        choice = {e: voice["choice"].get(e) for e in EMOTIONS if e in voice["choice"]}
        if not isinstance(voice["enabled"], bool):  # CosyVoice 와 같은 해석 — 깨진 파일로 본다
            raise ValueError("voice.enabled 가 bool 이 아님")
        cfg = {
            "voice": {"enabled": voice["enabled"], "choice": choice},
            "video": {"mode": video["mode"], "clones": list(video["clones"])},
            "updated_at": str(raw.get("updated_at", "")),
            "updated_by": str(raw.get("updated_by", "")),
        }
        if cfg["video"]["mode"] not in VIDEO_MODES:
            return None
        return cfg
    except FileNotFoundError:
        return None
    except Exception as e:
        log.warning("[emotion-admin] 설정 파일 읽기 실패 → 기본값으로 취급: %s", e)
        return None


def _snapshot() -> tuple[dict, str, dict]:
    cands = _candidates()
    cfg = _load_file()
    if cfg is None:
        return _default_config(cands), "default", cands
    return cfg, "file", cands


def _view(cfg: dict, source: str, cands: dict) -> dict:
    return {"config": cfg, "source": source, "candidates": cands, "emotions": EMOTIONS}


def _atomic_write(path: str, cfg: dict) -> None:
    d = os.path.dirname(path) or "."
    os.makedirs(d, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".emotion_config.", suffix=".tmp", dir=d)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.chmod(tmp, 0o644)  # CosyVoice(같은 User)가 읽는다
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def _bad(reason: str) -> web.Response:
    # 관리자 화면(request)은 error 가 문자열이면 그대로 보여준다 — 이유를 error 에 싣는다.
    return web.json_response({"error": reason, "code": "INVALID_BODY"}, status=400)


def _apply(cfg: dict, body: dict, cands: dict) -> str | None:
    """body 를 cfg 에 부분 반영. 검증 실패면 이유 문자열(cfg 는 버려질 사본)."""
    voice = body.get("voice")
    if voice is not None:
        if not isinstance(voice, dict):
            return "voice 는 객체여야 합니다"
        if "enabled" in voice:
            if not isinstance(voice["enabled"], bool):
                return "voice.enabled 는 true/false 여야 합니다"
            cfg["voice"]["enabled"] = voice["enabled"]
        if "choice" in voice:
            choice = voice["choice"]
            if not isinstance(choice, dict):
                return "voice.choice 는 객체여야 합니다"
            for emo, cid in choice.items():
                if emo not in EMOTIONS:
                    return f"알 수 없는 감정: {emo}"
                if cid is not None:
                    if not isinstance(cid, str) or cid not in {c["id"] for c in cands[emo]}:
                        return f"{emo} 의 후보가 아닙니다: {cid!r}"
                cfg["voice"]["choice"][emo] = cid
    video = body.get("video")
    if video is not None:
        if not isinstance(video, dict):
            return "video 는 객체여야 합니다"
        if "mode" in video:
            if video["mode"] not in VIDEO_MODES:
                return "video.mode 는 off|all|some 중 하나여야 합니다"
            cfg["video"]["mode"] = video["mode"]
        if "clones" in video:
            clones = video["clones"]
            if not isinstance(clones, list):
                return "video.clones 는 배열이어야 합니다"
            seen, uniq = set(), []
            for c in clones:
                if not isinstance(c, str) or not CLONE_ID_RE.fullmatch(c):
                    return f"클론 id 형식 오류: {c!r}"
                if c not in seen:
                    seen.add(c)
                    uniq.append(c)
            if len(uniq) > MAX_CLONES:
                return f"video.clones 는 최대 {MAX_CLONES}개입니다"
            cfg["video"]["clones"] = uniq
    by = body.get("updated_by", "")
    if not isinstance(by, str) or len(by) > 200:
        return "updated_by 는 200자 이하 문자열이어야 합니다"
    cfg["updated_by"] = by.strip()
    return None


async def get_config(req: web.Request) -> web.Response:
    if not _auth_ok(req):
        return _unauth()
    cfg, source, cands = _snapshot()
    return web.json_response(_view(cfg, source, cands))


async def put_config(req: web.Request) -> web.Response:
    if not _auth_ok(req):
        return _unauth()
    try:
        body = await req.json()
    except Exception:
        return _bad("JSON 본문이 필요합니다")
    if not isinstance(body, dict):
        return _bad("본문은 객체여야 합니다")
    cur, source, cands = _snapshot()  # await 없이 읽기→쓰기 — 단일 이벤트 루프라 경합 없음
    cfg = json.loads(json.dumps(cur))
    if source == "default":
        # 저장된 설정이 없을 때 첫 저장은 켜기/끄기를 명시해야 한다(영상만 저장하다 목소리가 의도치 않게 정해지는 것 방지).
        v = body.get("voice")
        if not isinstance(v, dict) or "enabled" not in v:
            return web.json_response({
                "error": "아직 저장된 설정이 없어요 — 목소리 켜기/끄기를 먼저 정해서 같이 저장해 주세요",
                "code": "VOICE_UNSET"}, status=409)
        # 첫 저장은 choice 4감정을 모두 채운다: 기본 후보, 디렉터리에 없으면 null.
        cfg["voice"]["choice"] = {e: cfg["voice"]["choice"].get(e) for e in EMOTIONS}
    err = _apply(cfg, body, cands)
    if err:
        return _bad(err)
    cfg["updated_at"] = datetime.now(KST).isoformat(timespec="seconds")
    try:
        _atomic_write(_config_path(), cfg)
    except OSError as e:
        log.error("[emotion-admin] 설정 저장 실패: %s", e)
        return web.json_response({"error": "WRITE_FAILED"}, status=500)
    return web.json_response(_view(cfg, "file", cands))


async def get_sample(req: web.Request) -> web.Response:
    if not _auth_ok(req):
        return _unauth()
    sid = req.match_info.get("id", "")
    if not SAMPLE_ID_RE.fullmatch(sid) or sid not in {c["id"] for items in _candidates().values() for c in items}:
        return web.json_response({"error": "NOT_FOUND"}, status=404)
    try:
        with open(os.path.join(_bank_dir(), sid + ".wav"), "rb") as f:
            data = f.read()
    except OSError:
        return web.json_response({"error": "NOT_FOUND"}, status=404)
    return web.Response(body=data, content_type="audio/wav", headers={"Cache-Control": "no-store"})


def register_emotion_admin_routes(app: web.Application) -> None:
    app.router.add_get("/oth-path", get_config)
    app.router.add_put("/oth-path", put_config)
    app.router.add_get("/oth-path", get_sample)
