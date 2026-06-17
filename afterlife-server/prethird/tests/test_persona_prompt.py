import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from clone_dialog import bundle_to_messages  # noqa: E402


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
