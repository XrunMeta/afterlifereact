# scripts/ 직하(비패키지) → 절대 import. learn_writeback.py / call_lifecycle.py 와 동일 graceful 패턴.
#
# 통화 대화 원문(call_turns) 서버 기록.
#
# 왜 별도 모듈인가:
#   learn_writeback 은 "학습" 이다 — PRETHIRD_LEARN_ENABLED 토글과 사용자 동의 게이트(API 측
#   hasCallLearningConsent)에 묶여 있고, 추출(extract_l2)에 성공한 것만 올라간다. 반면 이 모듈은
#   "기록" 이다. 통화 내역 화면·감사·사후 디버깅의 유일한 원문 출처라 학습 여부와 무관하게 항상
#   나가야 한다(call_lifecycle.call_start/call_end 가 T-167 때 학습 게이트를 걷어낸 것과 같은 논거 —
#   기록이 토글에 묶여 있으면 토글이 꺼진 환경에서 통화가 통째로 사라진다).
#   그래서 learn_writeback 안에 끼워넣지 않고 게이트 없는 독립 경로로 둔다.
#
# 인증이 LEARN_SECRET 이 아니라 ORCH_SECRET 인 이유:
#   수신처 `POST /oth-path` 이 처음부터 ORCH_SECRET Bearer 로 열려 있다
#   (afterlifeapi/src/routes/internal.ts). learn_writeback 의 헤더를 그대로 복사하면 401 이다.
#
# 통화 경로를 절대 블로킹/예외전파하지 않는다 — 호출부는 asyncio.ensure_future 로 스케줄한다.
from __future__ import annotations
import os
import re
import json
import logging
import aiohttp

log = logging.getLogger("prethird.turnrec")

# 기록은 best-effort 라 짧게 끊는다. learn_writeback 과 동일 감각(5s).
_TIMEOUT_S = 5.0

# prethird session_id = call_id = uuid4().hex[:12] (12 소문자 hex).
# call_lifecycle 과 동일한 심층방어 — URL path 보간 전 형식 강제.
_CALL_ID_RE = re.compile(r"[0-9a-f]{12}")

# [mizu H-1] 발화 길이 상한. afterlifeapi 의 두 라우트(internal.ts 의 이 경로,
# calls.ts 의 say)가 모두 2000자에서 400 을 준다 — 그 값과 일치시킨다.
_MAX_TURN_TEXT = 2000

# 중복 전송 차단용 최근 전송 키. 프로세스 로컬·상한 있는 단순 집합이다
# (재기동하면 비지만, 재기동 뒤에 같은 턴을 다시 보낼 경로 자체가 없다).
_SENT_KEYS: set[str] = set()
_SENT_KEYS_MAX = 4096


def _mark_sent(key: str) -> bool:
    """이미 보낸 키면 False. 처음 보는 키면 등록하고 True.

    상한 도달 시 통째로 비운다 — LRU 를 유지할 만큼 중요한 상태가 아니고(중복 방지는
    같은 통화 안에서 짧은 시간 내에만 의미가 있다), 장기 통화 수천 턴에서 메모리가
    무한히 자라는 쪽이 더 나쁘다."""
    if key in _SENT_KEYS:
        return False
    if len(_SENT_KEYS) >= _SENT_KEYS_MAX:
        _SENT_KEYS.clear()
    _SENT_KEYS.add(key)
    return True


async def _post_turn(api_base: str, secret: str, call_id: str, role: str, text: str) -> None:
    """단일 turn POST. HTTP 관례는 learn_writeback._post_learn 과 동일(aiohttp·타임아웃·
    비200 은 log.warning 만). 본문 text 는 로그에 남기지 않는다(PII)."""
    url = f"{api_base}/oth-path"
    body = json.dumps({"role": role, "text": text}).encode("utf-8")
    timeout = aiohttp.ClientTimeout(total=_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as s:
        async with s.post(url, data=body, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {secret}",
        }) as r:
            if r.status != 200:
                log.warning("call turn writeback http %s call=%s role=%s", r.status, call_id, role)


async def turn_writeback(
    call_id: str | None,
    user_text: str | None,
    clone_reply: str | None,
    dedupe_key: str | None = None,
) -> None:
    """턴 종료 후 사용자 발화 + 클론 응답을 call_turns 에 기록. fire-and-forget.

    - 학습 토글·동의 게이트를 보지 않는다(위 모듈 주석 참고).
    - 빈 텍스트는 보내지 않는다 — 서버가 400(bad_turn) 이라 왕복만 낭비된다.
    - user 를 먼저 보낸다. seq 는 서버가 COALESCE(MAX(seq),0)+1 로 채번하므로
      전송 순서가 곧 대화 순서가 된다(클라가 seq 를 보내지 않는 계약).
    - dedupe_key 가 주어지면 같은 키의 재전송을 무시한다. None 이면 중복 검사를
      하지 않는다 — 호출부가 턴당 1회만 부르는 구조라 그 자체로 1회성이고,
      키가 없다고 기록을 건너뛰면 오히려 원문이 유실된다.
    - 어떤 실패도 밖으로 나가지 않는다(통화·학습·과금 무영향).
    """
    try:
        secret = os.environ.get("ORCH_SECRET")
        api_base = os.environ.get("PRETHIRD_API_BASE")
        if not secret or not api_base or not call_id:
            return
        if not _CALL_ID_RE.fullmatch(call_id):
            return
        if dedupe_key is not None and not _mark_sent(dedupe_key):
            log.debug("call turn writeback dup skipped key=%s", dedupe_key)
            return
        for role, raw in (("user", user_text), ("clone", clone_reply)):
            text = (raw or "").strip()
            if not text:
                continue
            # [mizu H-1] 서버가 2000자 상한으로 400 을 주므로 상류에서 먼저 자른다.
            # 그냥 보내면 긴 발화 1건이 통째로 유실되는데, 기록 목적상 앞부분이라도
            # 남는 편이 낫다(형제 라우트 calls.ts 의 상한과 같은 값).
            if len(text) > _MAX_TURN_TEXT:
                log.info(
                    "call turn text truncated call=%s role=%s len=%d -> %d",
                    call_id, role, len(text), _MAX_TURN_TEXT,
                )
                text = text[:_MAX_TURN_TEXT]
            # 한쪽 실패가 다른 쪽 기록을 막지 않도록 개별 try.
            try:
                await _post_turn(api_base, secret, call_id, role, text)
            except Exception as e:
                log.warning("call turn writeback call=%s role=%s failed: %s", call_id, role, e)
    except Exception as e:
        log.warning("turn_writeback call=%s failed: %s", call_id, e)
