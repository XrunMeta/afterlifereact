"""T-545: viseme_playback 파이프라인용 서버 endpoint.

POST /oth-path
Body: {"text": str, "se_key"?: str, "voice_se_url"?: str, "clone_id"?: int}
Response: {
    "audio_wav_b64": str,        # base64 WAV bytes (기존 TTS)
    "duration_ms": int,           # 오디오 총 길이
    "visemes": [                  # timeline sync 용 viseme 시퀀스
        {"v": "A", "dur_ms": 200}, ...
    ],
    "viseme_prefix": str | null   # clone 의 viseme R2 prefix (클라가 클립 다운로드)
}

인증: LEARN_SECRET (기존 tts_admin_endpoint 와 동일).
"""
from __future__ import annotations
import os, io, wave, base64, logging, re
import aiohttp
from aiohttp import web
from viseme.korean_viseme import text_to_visemes

log = logging.getLogger("prethird.viseme")

REF_VOICES_ROOT = os.environ.get(
    "PRETHIRD_REF_VOICES_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)
LEARN_SECRET = os.environ.get("LEARN_SECRET", "") or os.environ.get("PRETHIRD_LEARN_SECRET", "")


def _wav_duration_ms(wav_bytes: bytes) -> int:
    try:
        with wave.open(io.BytesIO(wav_bytes), "rb") as w:
            frames = w.getnframes()
            rate = w.getframerate() or 24000
            return int(frames * 1000 / rate)
    except Exception:
        return 0


async def viseme_synth(req: web.Request) -> web.Response:
    secret = req.headers.get("X-Admin-Secret", "")
    if not LEARN_SECRET or secret != LEARN_SECRET:
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
    text = (body.get("text") or "").strip()
    se_key = body.get("se_key")
    if not text:
        return web.json_response({"error": "text required"}, status=400)
    if len(text) > 500:
        return web.json_response({"error": "text too long"}, status=400)

    # 1) TTS 오디오 생성 — 기존 tts_client 재사용
    # T-633 (2026-08-27): se_key 미제공 시 default preset 사용. tts_client.say(se_path=None) 은
    #   8203 (CosyVoice2) 에서 400 반환 · 실 통화에서 useVisemeAvatar.greet 등이 se_key 없이
    #   호출하므로 default 필요. viseme_chat 과 동일 정책.
    se_path = None
    if se_key:
        candidate = os.path.join(REF_VOICES_ROOT, se_key, "se.pth")
        if os.path.isfile(candidate):
            se_path = candidate
    if se_path is None:
        default_se_key = os.environ.get("VISEME_CHAT_DEFAULT_SE_KEY", "preset-9519")
        if default_se_key:
            candidate = os.path.join(REF_VOICES_ROOT, default_se_key, "se.pth")
            if os.path.isfile(candidate):
                se_path = candidate
    try:
        from tts_client import say
        wav_bytes = await say(text, se_path=se_path)
    except Exception as e:
        log.warning("viseme_synth TTS failed: %s", e)
        return web.json_response({"error": f"tts: {e}"}, status=502)

    dur_ms = _wav_duration_ms(wav_bytes)
    # 2) 텍스트 → viseme 시퀀스 (오디오 길이에 맞춰 dur 분배)
    visemes = text_to_visemes(text, total_ms=dur_ms if dur_ms > 0 else None)

    return web.json_response({
        "audio_wav_b64": base64.b64encode(wav_bytes).decode("ascii"),
        "duration_ms": dur_ms,
        "visemes": visemes,
    })


# T-631/T-632/T-633 (2026-08-27): viseme_playback 대화 사이클.
# POST /oth-path
# Body: {"text": str, "clone_id"?: int}
# Response: {
#     "response_text": str,       # gemma3 전체 응답 (자막용)
#     "sentences": [               # 문장 배열 · 각각 /oth-path 형식
#         { "text", "audio_wav_b64", "duration_ms", "visemes" }, ...
#     ]
# }
#
# 파이프라인: 사용자 발화 text → ollama gemma3:27b → 응답 → 문장 청킹 → 각 문장 TTS+viseme.
# 페르소나 프롬프트 통합은 후속 (지금 MVP · 일반 대화 프롬프트).

OLLAMA_URL = os.environ.get("PRETHIRD_OLLAMA_URL", "http://127.0.0.1:11435")
CHAT_MODEL = os.environ.get("VISEME_CHAT_MODEL", "gemma3:27b")

# MVP 시스템 프롬프트 — 짧은 응답 + 자연스러운 한국어. 페르소나 통합 시 clone_id 로 확장.
# T-636 (2026-08-27): 이모지·이모티콘 절대 금지 (음성 통화 → TTS 가 읽어야 하는데
#   이모지는 소리로 읽히지 않고 응답 품질만 저하). tone 이 '이모지 자주' 라 저장돼 있어도
#   이 규칙이 override 한다.
_MVP_SYSTEM_PROMPT = (
    "당신은 친근한 대화 상대입니다. 사용자와 자연스럽게 한국어로 대화하세요. "
    "응답은 2~3문장으로 짧고 자연스럽게. 마침표·물음표·느낌표로 문장을 끝맺으세요. "
    "이모지·이모티콘·특수기호(😄 😊 😜 ^^ ㅋㅋ 등)는 절대 사용하지 마세요. "
    "이건 음성 통화라 이모지는 소리로 읽을 수 없습니다. 순수 한국어 문장만 출력하세요."
)


def _split_sentences(text: str) -> list[str]:
    """한국어/영문 문장 청킹. `.!?` 뒤 공백/개행 기준. 빈 문장은 제거."""
    # 문장 부호 뒤에서 split (부호 유지).
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    result = [p.strip() for p in parts if p.strip()]
    if not result:
        result = [text.strip()] if text.strip() else []
    return result


def _compose_system_prompt(
    clone_name: str | None,
    user_name: str | None,
    persona_description: str | None = None,
    remembered_name: str | None = None,
    user_location: str | None = None,
    persona_attrs_summary: str | None = None,
    persona_core: str | None = None,
    persona_tone: str | None = None,
    persona_knowledge: list | None = None,
) -> str:
    """T-633 fix + T-634 + T-635 (2026-08-27): 페르소나 통합 시스템 프롬프트.
       T-635 확장 필드:
         - persona_attrs_summary: 'age=..., gender=..., mbti=...' 컴팩트 요약
         - persona_core: personality_core (성향 코어)
         - persona_tone: 말투/톤 힌트
         - persona_knowledge: [{q, a}, ...] Q&A 배열 (T-117 학습하기 결과)
    """
    parts = []
    if clone_name:
        parts.append(f"당신은 '{clone_name}'입니다. 이 이름의 페르소나로 대답하세요.")
    if persona_description:
        parts.append(f"당신의 성격·배경: {persona_description}")
    # T-635 · attrs (age/gender/mbti) · 짧아서 그대로 삽입.
    if persona_attrs_summary:
        parts.append(f"당신의 기본 속성: {persona_attrs_summary}. 이 속성에 어울리게 답하세요.")
    if persona_core:
        parts.append(f"당신의 성향 코어: {persona_core}")
    if persona_tone:
        parts.append(f"당신의 말투/톤: {persona_tone}. 이 톤을 대화 내내 유지하세요.")
    # T-635 · knowledge Q&A · 학습하기에서 사용자가 입력한 페르소나 기억.
    #   프롬프트에 "Q: ... A: ..." 형식으로 삽입 · gemma3 가 answer 를 반영해 응답.
    if persona_knowledge and isinstance(persona_knowledge, list):
        kn_lines = []
        for item in persona_knowledge[:10]:
            if isinstance(item, dict):
                q = str(item.get("q", "")).strip()
                a = str(item.get("a", "")).strip()
                if q and a:
                    kn_lines.append(f"- Q: {q}\n  A: {a}")
        if kn_lines:
            parts.append("당신에 대해 이미 알려진 사실 (사용자 질문과 관련 있으면 참고하세요):\n" + "\n".join(kn_lines))
    # L2 우선 (Remember Me) · 없으면 계정 이름.
    effective_user_name = remembered_name or user_name
    if effective_user_name:
        parts.append(
            f"사용자의 이름은 '{effective_user_name}'입니다. 대화 중 이름을 자연스럽게 부르세요. 절대 '사용자님'이라 부르지 마세요."
        )
    if user_location:
        parts.append(
            f"사용자는 지금 '{user_location}' 근처에 있습니다. 대화 흐름에 자연스럽게 지역·날씨 같은 화제를 섞을 수 있습니다."
        )
    parts.append(_MVP_SYSTEM_PROMPT)
    return " ".join(parts)


async def _generate_response(
    user_text: str,
    clone_name: str | None = None,
    user_name: str | None = None,
    persona_description: str | None = None,
    remembered_name: str | None = None,
    user_location: str | None = None,
    persona_attrs_summary: str | None = None,
    persona_core: str | None = None,
    persona_tone: str | None = None,
    persona_knowledge: list | None = None,
) -> str:
    """ollama gemma3 호출 · 전체 응답 텍스트 반환."""
    timeout = aiohttp.ClientTimeout(total=30)
    system_prompt = _compose_system_prompt(
        clone_name,
        user_name,
        persona_description=persona_description,
        remembered_name=remembered_name,
        user_location=user_location,
        persona_attrs_summary=persona_attrs_summary,
        persona_core=persona_core,
        persona_tone=persona_tone,
        persona_knowledge=persona_knowledge,
    )
    payload = {
        "model": CHAT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": int(os.environ.get("PRETHIRD_MAX_RESPONSE_TOKENS", "200")),
        },
    }
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(f"{OLLAMA_URL}/oth-path", json=payload) as r:
            if r.status != 200:
                body = await r.text()
                raise RuntimeError(f"ollama http {r.status}: {body[:200]}")
            data = await r.json()
    msg = data.get("message") or {}
    content = (msg.get("content") or "").strip()
    # T-636 (2026-08-27): 이모지·이모티콘 응답 후처리 정화. gemma3 가 시스템 프롬프트 무시하고
    #   이모지 섞어 낼 때가 있어 이중 방어. 유니코드 이모지 범위 + 흔한 텍스트 이모티콘 제거.
    content = _strip_emojis(content)
    return content


# T-636: 이모지·이모티콘 후처리. 시스템 프롬프트 지시가 무시되는 케이스 방어.
_EMOJI_RE = re.compile(
    "[\U0001F600-\U0001F64F"       # 표정 이모지
    "\U0001F300-\U0001F5FF"        # 심볼·픽토그램
    "\U0001F680-\U0001F6FF"        # 교통·지도
    "\U0001F1E0-\U0001F1FF"        # 국기
    "\U00002600-\U000027BF"        # 잡다 심볼
    "\U0001F900-\U0001F9FF"        # 보충 심볼
    "\U0001FA70-\U0001FAFF"        # 확장 심볼
    "\U00002702-\U000027B0"        # 딩벳
    "]+",
    flags=re.UNICODE,
)
_TEXT_EMOTICON_RE = re.compile(r"(?:\^\^|\^_\^|:\)|:\(|;\)|ㅋ{2,}|ㅎ{2,}|ㅠ{2,}|ㅜ{2,})")

def _strip_emojis(text: str) -> str:
    if not text:
        return text
    text = _EMOJI_RE.sub("", text)
    text = _TEXT_EMOTICON_RE.sub("", text)
    # 여러 공백 정리 · 문장 끝 여백 정리.
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


async def viseme_chat(req: web.Request) -> web.Response:
    secret = req.headers.get("X-Admin-Secret", "")
    if not LEARN_SECRET or secret != LEARN_SECRET:
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
    text = (body.get("text") or "").strip()
    # T-633 fix + T-634 + T-635: 페르소나 통합 payload.
    _clone_id = body.get("clone_id")
    clone_name = (body.get("clone_name") or "").strip() or None
    user_name = (body.get("user_name") or "").strip() or None
    persona_description = (body.get("persona_description") or "").strip() or None
    remembered_name = (body.get("remembered_name") or "").strip() or None
    user_location = (body.get("user_location") or "").strip() or None
    # T-635 신규
    persona_attrs_summary = (body.get("persona_attrs_summary") or "").strip() or None
    persona_core = (body.get("persona_core") or "").strip() or None
    persona_tone = (body.get("persona_tone") or "").strip() or None
    persona_knowledge = body.get("persona_knowledge")
    if not isinstance(persona_knowledge, list):
        persona_knowledge = None
    if not text:
        return web.json_response({"error": "text required"}, status=400)
    if len(text) > 2000:
        return web.json_response({"error": "text too long"}, status=400)

    # 1) gemma3 응답 생성.
    try:
        response_text = await _generate_response(
            text,
            clone_name=clone_name,
            user_name=user_name,
            persona_description=persona_description,
            remembered_name=remembered_name,
            user_location=user_location,
            persona_attrs_summary=persona_attrs_summary,
            persona_core=persona_core,
            persona_tone=persona_tone,
            persona_knowledge=persona_knowledge,
        )
    except Exception as e:
        log.warning("viseme_chat gemma failed: %s", e)
        return web.json_response({"error": f"gemma: {e}"}, status=502)

    if not response_text:
        return web.json_response({"response_text": "", "sentences": []})

    # 2) 문장 청킹.
    sentence_texts = _split_sentences(response_text)
    if not sentence_texts:
        return web.json_response({"response_text": response_text, "sentences": []})

    # 3) 각 문장 TTS + viseme 생성 (순차 · 병렬 안 함 — TTS GPU 경합 방지).
    try:
        from tts_client import say
    except Exception as e:
        log.warning("viseme_chat tts import failed: %s", e)
        return web.json_response({"error": f"tts_import: {e}"}, status=502)

    # T-633 · MVP default preset. viseme_synth 와 달리 실 통화 사이클에선 se_key 를 클라가 안 넘김.
    # tts_client.say(se_path=None) 은 8203 (CosyVoice2) 에서 400 반환 → default preset se_key 로
    # se.pth 세팅. 페르소나 통합 시 clone.voice_preset_id 로 세팅 예정.
    default_se_key = os.environ.get("VISEME_CHAT_DEFAULT_SE_KEY", "preset-9519")
    default_se_path = None
    if default_se_key:
        candidate = os.path.join(REF_VOICES_ROOT, default_se_key, "se.pth")
        if os.path.isfile(candidate):
            default_se_path = candidate

    sentences = []
    for sent in sentence_texts:
        if not sent:
            continue
        try:
            wav_bytes = await say(sent, se_path=default_se_path)
        except Exception as e:
            log.warning("viseme_chat TTS failed on '%s': %s", sent[:40], e)
            # 개별 문장 실패는 skip · 나머지 계속 (부분 응답이라도 반환).
            continue
        dur_ms = _wav_duration_ms(wav_bytes)
        visemes = text_to_visemes(sent, total_ms=dur_ms if dur_ms > 0 else None)
        sentences.append({
            "text": sent,
            "audio_wav_b64": base64.b64encode(wav_bytes).decode("ascii"),
            "duration_ms": dur_ms,
            "visemes": visemes,
        })

    return web.json_response({
        "response_text": response_text,
        "sentences": sentences,
    })


def register_viseme_routes(app: web.Application) -> None:
    app.router.add_post("/oth-path", viseme_synth)
    app.router.add_post("/oth-path", viseme_chat)
    log.info("viseme endpoints registered: POST /oth-path (T-545), POST /oth-path (T-633)")
