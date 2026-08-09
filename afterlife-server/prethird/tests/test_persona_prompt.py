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
    # displayName 은 T-252 설계상 속성 줄로 렌더하지 않는다(머리말 승격은 Task 2).
    # 여기서는 displayName 이 섞여 있어도 나머지 속성으로 메시지가 정상 조립되는지만 확인한다.
    assert "다정하고 따뜻함" in msgs[0]["content"]


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
    assert "## 상대 정보" in content
    assert "- 취향: " in content
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
    content = msgs[0]["content"]
    assert "## 상대 정보" in content
    assert "- 너와의 관계: 손녀" in content


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
    # displayName 은 속성 줄에 렌더되지 않으므로(T-252), 메시지가 비지 않도록
    # tone 을 함께 둔다. 검증 의도는 그대로: 빈 preference_history 는 줄을 만들지 않는다.
    msgs = bundle_to_messages(_bundle({
        "displayName": "정진스님", "tone": "차분함", "preference_history": [],
    }))
    assert "취향 변화" not in msgs[0]["content"]


def test_knowledge_formatted_as_section():
    """knowledge([{key,q,a,updated_at}]) → '## 전문 지식' 섹션, dict repr 유출 금지."""
    bundle = {"personaBundle": {"l0": {}, "cloneId": "1", "persona": {
        "tone": "차분함",
        "knowledge": [
            {"key": "k1", "q": "[꽃말] 프리지아", "a": "당신의 시작을 응원한다는 의미.", "updated_at": 1},
            {"key": "k2", "q": None, "a": "질문 없는 항목.", "updated_at": 2},
        ],
    }}}
    text = bundle_to_messages(bundle)[0]["content"]
    assert "## 전문 지식" in text
    assert "- [꽃말] 프리지아: 당신의 시작을 응원한다는 의미." in text
    assert "- 질문 없는 항목." in text
    assert "updated_at" not in text and "{'" not in text  # repr 유출 금지


def test_no_knowledge_no_section():
    msgs = bundle_to_messages(_bundle({"tone": "x"}))
    assert "## 전문 지식" not in msgs[0]["content"]


def test_empty_knowledge_no_section():
    msgs = bundle_to_messages(_bundle({"tone": "x", "knowledge": []}))
    assert "## 전문 지식" not in msgs[0]["content"]


def test_knowledge_excluded_from_persona_fallback_loop():
    """knowledge 키는 '나머지 속성' 루프에서 dict repr로 새지 않아야 한다."""
    msgs = bundle_to_messages(_bundle({
        "tone": "x",
        "knowledge": [{"key": "k1", "q": "q1", "a": "a1", "updated_at": 1}],
    }))
    content = msgs[0]["content"]
    assert "- knowledge:" not in content


def test_소유자별_블록_분리():
    """클론 속성과 상대 속성이 서로 다른 블록에 들어가야 한다."""
    msgs = bundle_to_messages(_bundle({
        "displayName": "코조",
        "tone": "무뚝뚝함",
        "personality_core": "속정 깊음",
        "preference_personal": {"음료": "커피"},
        "memories_personal": ["어제 등산 감"],
    }))
    content = msgs[0]["content"]
    # 머리말 문장 안에도 '"## 상대 정보" 는 ...' 식으로 헤딩 문자열이 인용되므로,
    # 실제 블록 경계(줄바꿈으로 둘러싸인 헤딩)로 나눠야 머리말과 섞이지 않는다.
    self_block, other_block = content.split("\n## 상대 정보\n")

    # 클론 속성은 "너의 정보"에만
    assert "무뚝뚝함" in self_block
    assert "속정 깊음" in self_block
    assert "무뚝뚝함" not in other_block

    # 상대 속성은 "상대 정보"에만
    assert "커피" in other_block
    assert "어제 등산 감" in other_block
    assert "커피" not in self_block


def test_미분류_키는_참고_블록():
    """알려지지 않은 키는 소유자를 알 수 없으므로 ## 참고 로 격리한다."""
    msgs = bundle_to_messages(_bundle({
        "displayName": "코조",
        "tone": "무뚝뚝함",
        "낯선키": "낯선값",
    }))
    content = msgs[0]["content"]
    assert "## 참고" in content
    ref_block = content.split("## 참고")[1]
    assert "낯선값" in ref_block


def test_display_name_은_블록에_없다():
    """displayName 은 머리말로 승격되므로 속성 줄로 중복 출력하지 않는다."""
    msgs = bundle_to_messages(_bundle({"displayName": "코조", "tone": "무뚝뚝함"}))
    content = msgs[0]["content"]
    assert "- 이름: 코조" not in content


def test_context_는_참고_블록():
    """context 는 통화 상황 맥락이라 소유자가 없다."""
    msgs = bundle_to_messages(_bundle({"tone": "차분함", "context": "저녁 시간"}))
    content = msgs[0]["content"]
    assert "## 참고" in content
    assert "저녁 시간" in content.split("## 참고")[1]


def _bundle_v(persona, viewer_name=None):
    """viewer 포함 번들 헬퍼."""
    pb = {"cloneId": "1", "persona": persona}
    if viewer_name is not None:
        pb["viewer"] = {"displayName": viewer_name}
    return {"personaBundle": pb}


def test_상태1_기본상대_이름있음():
    """얼굴 미확정 + viewer 이름 있음 → 이름을 밝히고 인칭 규칙을 선언한다."""
    msgs = bundle_to_messages(_bundle_v({"displayName": "코조", "tone": "무뚝뚝함"}, "지호"))
    content = msgs[0]["content"]
    assert '너는 "코조" 이다' in content
    assert "지호" in content
    assert "나 / 내 / 제가" in content
    assert "되물어라" in content


def test_상태1_역할어_없음():
    """상대의 관계를 규정하는 표현을 쓰지 않는다(타인 클론 통화 38% 오인 방지)."""
    msgs = bundle_to_messages(_bundle_v({"displayName": "코조", "tone": "무뚝뚝함"}, "지호"))
    content = msgs[0]["content"]
    for banned in ("만든 사람", "제작자", "주인", "생성자"):
        assert banned not in content


def test_상태2_화자확정():
    """speaker 주어지면 그 이름이 상대이고, 상대 정보는 L2' 값으로 채워진다."""
    msgs = bundle_to_messages(
        _bundle_v({"displayName": "코조", "memories_personal": ["기본상대 기억"]}, "지호"),
        speaker={"name": "민수", "l2p_data": {"memories_personal": ["민수랑 낚시함"]}},
    )
    content = msgs[0]["content"]
    assert "민수" in content
    assert "지호" not in content            # 기본 상대는 밀려난다
    assert "민수랑 낚시함" in content
    assert "기본상대 기억" not in content    # base L2 는 L2' 로 대체된다


def test_상태3_이름없음():
    """viewer 이름이 없으면 이름을 부르지 말라고 지시한다."""
    msgs = bundle_to_messages(_bundle_v({"displayName": "코조", "tone": "무뚝뚝함"}, None))
    content = msgs[0]["content"]
    assert "이름으로 부르지 마라" in content
    assert "지어내지 마라" in content


def test_상태4_미확정_얼굴():
    """unknown_face → 기본 상대 정보는 유지하되 이름은 부르지 않는다."""
    msgs = bundle_to_messages(
        _bundle_v({"displayName": "코조", "memories_personal": ["어제 등산 감"]}, "지호"),
        speaker={"unconfirmed": True},
    )
    content = msgs[0]["content"]
    assert "확정하지 못했다" in content
    assert "이름으로 부르지 마라" in content
    assert "지호" not in content              # 이름 호칭 억제
    assert "어제 등산 감" in content          # L2 맥락은 유지
    assert "단정해서 꺼내지 마라" in content


def test_상태4_전이시_L2p_미잔류():
    """화자 A 확정 → unknown 전이. A 의 이름·L2' 기억이 남으면 안 된다."""
    bundle = _bundle_v({"displayName": "코조", "memories_personal": ["기본 기억"]}, "지호")
    confirmed = bundle_to_messages(
        bundle, speaker={"name": "민수", "l2p_data": {"memories_personal": ["민수 비밀"]}}
    )
    assert "민수 비밀" in confirmed[0]["content"]

    fallback = bundle_to_messages(bundle, speaker={"unconfirmed": True})
    content = fallback[0]["content"]
    assert "민수" not in content
    assert "민수 비밀" not in content
    assert "기본 기억" in content


def test_화자_A에서_B로_전환시_A_미잔류():
    bundle = _bundle_v({"displayName": "코조"}, "지호")
    a = bundle_to_messages(bundle, speaker={"name": "민수", "l2p_data": {"memories_personal": ["민수 기억"]}})
    b = bundle_to_messages(bundle, speaker={"name": "수진", "l2p_data": {"memories_personal": ["수진 기억"]}})
    assert "민수" in a[0]["content"]
    assert "민수" not in b[0]["content"]
    assert "민수 기억" not in b[0]["content"]
    assert "수진 기억" in b[0]["content"]


def test_이름_sanitize_실패시_상태3로_강등():
    """제어문자·과길이 이름은 신뢰하지 않는다(프롬프트 인젝션 완화, T-135 승계)."""
    msgs = bundle_to_messages(
        _bundle_v({"displayName": "코조"}, "지호"),
        speaker={"name": "악의적​이름" + "가" * 40, "l2p_data": {"memories_personal": ["x"]}},
    )
    content = msgs[0]["content"]
    assert "이름으로 부르지 마라" in content
    assert "x" in content     # L2' 데이터 자체는 살린다


def test_머리말_8줄_이내():
    """통화 첫 턴 지연 방어 — 머리말은 8줄을 넘지 않는다."""
    msgs = bundle_to_messages(_bundle_v({"displayName": "코조", "tone": "무뚝뚝함"}, "지호"))
    header = msgs[0]["content"].split("## ")[0]
    assert len([ln for ln in header.strip().split("\n") if ln.strip()]) <= 8


def test_1인자_호출_회귀():
    """speaker 없이 호출하던 기존 코드가 그대로 동작해야 한다."""
    msgs = bundle_to_messages(_bundle({"displayName": "코조", "tone": "무뚝뚝함"}))
    assert len(msgs) == 1
    assert msgs[0]["role"] == "system"
