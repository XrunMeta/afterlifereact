import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from clone_dialog import bundle_to_messages  # noqa: E402
from clone_dialog.persona_prompt import _format_pref_history  # noqa: E402


def test_none_returns_empty():
    assert bundle_to_messages(None) == []


def test_empty_dict_returns_empty():
    assert bundle_to_messages({}) == []


def test_builds_single_system_message_with_display_name():
    """personaBundle 포함 전체 구조(fetch_bundle 반환 형식)로 테스트."""
    bundle = {
        "personaBundle": {
            "cloneId": "9043",
            "persona": {"displayName": "할배", "tone": "다정하고 따뜻함"},
        }
    }
    msgs = bundle_to_messages(bundle)
    assert len(msgs) == 1
    assert msgs[0]["role"] == "system"
    assert "할배" in msgs[0]["content"]


def test_includes_l0_rules():
    """L0 rules_text가 system message에 포함되어야 한다."""
    bundle = {
        "personaBundle": {
            "cloneId": "9043",
            "l0": {"rules_text": "절대 불법 정보를 제공하지 마세요.", "blocklist": []},
            "persona": {"displayName": "할배"},
        }
    }
    msgs = bundle_to_messages(bundle)
    assert len(msgs) == 1
    assert "절대 불법 정보" in msgs[0]["content"]


def test_includes_relation_and_tone():
    bundle = {
        "personaBundle": {
            "cloneId": "1",
            "persona": {
                "displayName": "민준",
                "relation": "친구",
                "tone": "유쾌하고 편안함",
            },
        }
    }
    msgs = bundle_to_messages(bundle)
    assert len(msgs) == 1
    content = msgs[0]["content"]
    assert "친구" in content
    assert "유쾌" in content


def test_missing_persona_key_returns_empty():
    """personaBundle 키가 없는 dict → []."""
    bundle = {"assets": {"voiceSeKey": "9043"}}
    assert bundle_to_messages(bundle) == []


def test_no_display_name_still_builds():
    """displayName 없어도 메시지는 1개 반환(다른 속성 있으면)."""
    bundle = {
        "personaBundle": {
            "cloneId": "1",
            "persona": {"tone": "차분함", "personality_core": "조용하고 사려 깊음"},
        }
    }
    msgs = bundle_to_messages(bundle)
    assert len(msgs) == 1
    assert msgs[0]["role"] == "system"


def _bundle(persona):
    return {"personaBundle": {"cloneId": "1", "persona": persona}}


def test_preference_personal_렌더_가독():
    """학습 키(preference_personal, dict) — 파이썬 repr 노출 금지."""
    msgs = bundle_to_messages(_bundle({"preference_personal": {"커피": "라떼", "취미": "여행"}}))
    content = msgs[0]["content"]
    assert "사용자 취향" in content
    assert "커피: 라떼" in content
    assert "{" not in content and "'" not in content   # 파이썬 dict repr 금지


def test_memories_personal_렌더_가독():
    """학습 키(memories_personal, list) — 파이썬 repr 노출 금지."""
    msgs = bundle_to_messages(_bundle({"memories_personal": ["여행 좋아함", "고양이 키움"]}))
    content = msgs[0]["content"]
    assert "기억" in content
    assert "여행 좋아함" in content and "고양이 키움" in content
    assert "[" not in content   # 파이썬 list repr 금지


def test_relation_렌더():
    msgs = bundle_to_messages(_bundle({"relation": "손녀"}))
    assert "사용자와의 관계: 손녀" in msgs[0]["content"]


def test_빈_bundle_회귀():
    assert bundle_to_messages(None) == []
    assert bundle_to_messages({}) == []
    assert bundle_to_messages({"personaBundle": {"persona": {}}}) == []


def test_빈_preference_personal_은_렌더_생략():
    """빈 dict/list 학습 키는 프롬프트에 실리지 않아야 한다 (이중 방어)."""
    msgs = bundle_to_messages(_bundle({"preference_personal": {}, "memories_personal": []}))
    assert msgs == []


def test_preference_history_renders_arrow():
    assert _format_pref_history([
        {"key": "음료", "from": "콜라", "to": "사이다", "at": "2026-07-05T00:00:00Z"},
        {"key": "음식", "from": "김치", "to": "라면", "at": "2026-07-05T01:00:00Z"},
    ]) == "음료: 콜라→사이다; 음식: 김치→라면"


def test_bundle_includes_preference_history_line():
    msgs = bundle_to_messages(_bundle({
        "displayName": "정진스님",
        "preference_history": [{"key": "음료", "from": "콜라", "to": "사이다", "at": "x"}],
    }))
    assert len(msgs) == 1
    assert "- 취향 변화: 음료: 콜라→사이다" in msgs[0]["content"]


def test_empty_preference_history_no_line():
    msgs = bundle_to_messages(_bundle({
        "displayName": "정진스님", "preference_history": [],
    }))
    assert "취향 변화" not in msgs[0]["content"]
