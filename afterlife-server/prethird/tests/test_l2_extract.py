import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from clone_dialog import l2_extract  # noqa: E402


def test_safe_json_extracts_object():
    assert l2_extract._safe_json('전문 {"a": 1} 후문') == {"a": 1}
    assert l2_extract._safe_json("no json here") == {}
    assert l2_extract._safe_json('{"broken": ') == {}


async def test_extract_empty_user_text_skips(monkeypatch):
    # user_text 비면 LLM 호출 없이 빈 dict
    called = {"n": 0}
    async def _fake(*a, **k):
        called["n"] += 1
        return "{}"
    monkeypatch.setattr(l2_extract, "chat_once", _fake)
    assert await l2_extract.extract_l2("", "안녕하세요") == {}
    assert called["n"] == 0


async def test_extract_parses_and_filters(monkeypatch):
    async def _fake(*a, **k):
        return '{"preference_personal": {"coffee": "라떼"}, "relation": "손녀", "memories_personal": ["등산 좋아함", ""]}'
    monkeypatch.setattr(l2_extract, "chat_once", _fake)
    out = await l2_extract.extract_l2("나 등산 좋아해", "좋네요")
    assert out["preference_personal"] == {"coffee": "라떼"}
    assert out["relation"] == "손녀"
    assert out["memories_personal"] == ["등산 좋아함"]  # 빈 문자열 제거


async def test_extract_empty_result_returns_empty(monkeypatch):
    async def _fake(*a, **k):
        return '{"preference_personal": {}, "relation": null, "memories_personal": []}'
    monkeypatch.setattr(l2_extract, "chat_once", _fake)
    assert await l2_extract.extract_l2("음", "네") == {}


async def test_extract_llm_failure_returns_empty(monkeypatch):
    async def _fake(*a, **k):
        raise RuntimeError("ollama down")
    monkeypatch.setattr(l2_extract, "chat_once", _fake)
    assert await l2_extract.extract_l2("뭔가", "응답") == {}


def test_prompt_forbids_pii():
    # PII allowlist 회귀: 프롬프트에 민감정보 금지 지시가 포함되어야 함
    p = l2_extract._EXTRACT_SYSTEM.lower()
    for kw in ["address", "phone", "registration", "card", "password"]:
        assert kw in p


async def test_extract_drops_pii_patterns(monkeypatch):
    # mizu M-1: 간접표현으로 PII가 추출돼도 정규식 2차 스캔으로 drop
    async def _fake(*a, **k):
        return ('{"preference_personal": {"phone": "010-1234-5678"}, "relation": null, '
                '"memories_personal": ["연락처 010-1234-5678", "등산 좋아함"]}')
    monkeypatch.setattr(l2_extract, "chat_once", _fake)
    out = await l2_extract.extract_l2("내 번호 010-1234-5678", "네")
    assert "preference_personal" not in out      # phone 값 PII drop → 빈 객체 → 키 누락
    assert out["memories_personal"] == ["등산 좋아함"]  # PII 메모만 drop


def test_prompt_guides_preference_key_normalization():
    sys = l2_extract._EXTRACT_SYSTEM.lower()
    # 선호 키를 카테고리로 정규화하라는 지시가 프롬프트에 존재
    assert "categor" in sys or "카테고리" in l2_extract._EXTRACT_SYSTEM
    assert "same key" in sys or "동일" in l2_extract._EXTRACT_SYSTEM


async def test_extract_drops_nested_preference(monkeypatch):
    # mizu H-1: preference value가 primitive 아니면(중첩 객체/배열) drop
    async def _fake(*a, **k):
        return ('{"preference_personal": {"info": {"addr": "서울"}, "coffee": "라떼"}, '
                '"relation": null, "memories_personal": []}')
    monkeypatch.setattr(l2_extract, "chat_once", _fake)
    out = await l2_extract.extract_l2("나 라떼 좋아", "좋네요")
    assert out["preference_personal"] == {"coffee": "라떼"}  # 중첩 dict drop, primitive만


async def test_extract_drops_account_number(monkeypatch):
    # 계좌번호(하이픈/연속 숫자) → drop
    async def _fake(*a, **k):
        return ('{"preference_personal": {"음료": "콜라"}, "relation": null, '
                '"memories_personal": ["계좌 110-234-567890", "국민은행 12345678901234"]}')
    monkeypatch.setattr(l2_extract, "chat_once", _fake)
    out = await l2_extract.extract_l2("계좌 알려줄게", "네")
    assert out["preference_personal"] == {"음료": "콜라"}   # 정상 취향 보존
    assert out.get("memories_personal", []) == []          # 계좌 2건 모두 drop


async def test_extract_drops_password(monkeypatch):
    # 비밀번호 키워드 항목 → drop
    async def _fake(*a, **k):
        return ('{"preference_personal": {"비번": "1234", "취미": "등산"}, "relation": null, '
                '"memories_personal": ["비밀번호는 abcd1234", "등산 좋아함"]}')
    monkeypatch.setattr(l2_extract, "chat_once", _fake)
    out = await l2_extract.extract_l2("비번 알려줄게", "네")
    assert out["preference_personal"] == {"취미": "등산"}   # 비번 키 drop, 정상 보존
    assert out["memories_personal"] == ["등산 좋아함"]      # 비밀번호 메모 drop


async def test_extract_drops_address(monkeypatch):
    # 지번/도로명 주소(키워드+숫자) → drop, 숫자 없는 일반 문장은 보존
    async def _fake(*a, **k):
        return ('{"preference_personal": {}, "relation": null, '
                '"memories_personal": ["우리집은 서울 강남구 테헤란로 123", "산책을 좋아함"]}')
    monkeypatch.setattr(l2_extract, "chat_once", _fake)
    out = await l2_extract.extract_l2("우리집 주소는", "네")
    assert out["memories_personal"] == ["산책을 좋아함"]    # 주소 drop, 일반 문장 보존


def test_prompt_forbids_pii_examples():
    # PRIVACY 강화: 집 주소·계좌번호·비밀번호를 preference/memory로도 추출 금지 명시
    p = l2_extract._EXTRACT_SYSTEM.lower()
    assert "account" in p and "password" in p
    # preference/memory 경로로도 금지한다는 강화 문구
    assert "preference" in p or "memory" in p


def test_normal_preferences_not_dropped():
    # 정상 취향값에 PII 오탐 없음(회귀 방어)
    for v in ["콜라", "사이다", "재즈", "등산 좋아함", "라떼"]:
        assert l2_extract._has_pii(v) is False


def test_normal_numeric_and_english_not_flagged():
    # el/mizu 게이트: 숫자+조사·영단어 부분매칭 오탐 방지 회귀
    for v in ["2가 더 좋아", "라떼 2로 주세요", "3로 갈래", "친구가 3명 있어",
              "spinning 좋아해", "opinion 나누기 좋아함", "조회수 1234567890 관심"]:
        assert l2_extract._has_pii(v) is False, v


def test_pii_still_detected_after_tuning():
    # 튜닝 후에도 실제 PII는 계속 탐지
    for v in ["서울 강남구 테헤란로 123", "서울시 강남구", "110-234-567890",
              "12345678901234", "비밀번호는 abcd1234", "010-1234-5678", "123번지"]:
        assert l2_extract._has_pii(v) is True, v


async def test_extract_drops_numeric_pii_value(monkeypatch):
    # mizu I-1: preference 값이 숫자 타입이어도 계좌 정규식 적용(문자열화 후 검사)
    async def _fake(*a, **k):
        return ('{"preference_personal": {"계좌": 12345678901234, "취미": "등산"}, '
                '"relation": null, "memories_personal": []}')
    monkeypatch.setattr(l2_extract, "chat_once", _fake)
    out = await l2_extract.extract_l2("계좌", "네")
    assert out["preference_personal"] == {"취미": "등산"}
