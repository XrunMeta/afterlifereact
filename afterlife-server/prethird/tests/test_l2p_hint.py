"""test_l2p_hint — T-252: verify와 실통화가 공유하는 L2' 힌트는 이제 옛 append 방식
힌트 조립 함수가 아니라 bundle_to_messages(bundle, speaker=...) 재조립으로 낸다.
검증 의도(이름만 있을 때 vs 관계/취향/기억이 있을 때)는 그대로 유지하고 조립
방식만 Task 5 이관에 맞춰 갱신한다."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from clone_dialog import bundle_to_messages  # noqa: E402

# [T-252 fix / el 지적] persona 에 상대 필드를 채워야 "상대 정보 섹션 없음" 단언이
# 실효를 갖는다 — 예전엔 displayName·tone 뿐이라 섹션이 애초에 생길 수 없었다.
_BUNDLE = {
    "personaBundle": {
        "cloneId": "1",
        "persona": {
            "displayName": "코조",
            "tone": "친근함",
            "relation": "이웃",
            "memories_personal": ["작년에 이사 옴"],
        },
    }
}


def test_hint_name_only_when_no_l2p():
    for l2p in (None, {}):
        messages = bundle_to_messages(_BUNDLE, speaker={"name": "형", "l2p_data": l2p})
        content = messages[0]["content"]
        assert '지금 너와 통화 중인 상대는 "형" 이다.' in content
        # [T-252 fix / mizu H-2] 화자가 확정됐는데 L2' 가 없으면 상대 정보 블록을
        # 만들지 않는다 — base persona(계정주 L2)로 폴백하면 계정주의 관계·기억이
        # 확정된 제3자의 것으로 단언된다.
        assert "\n## 상대 정보\n" not in content
        assert "이웃" not in content
        assert "작년에 이사 옴" not in content


def test_hint_includes_relation_and_prefs():
    data = {
        "relation": "친구",
        "preference_personal": {"음료": "아메리카노"},
        "memories_personal": ["지난주 등산"],
    }
    messages = bundle_to_messages(_BUNDLE, speaker={"name": "형", "l2p_data": data})
    content = messages[0]["content"]
    assert '지금 너와 통화 중인 상대는 "형" 이다.' in content
    assert "## 상대 정보" in content
    assert "너와의 관계: 친구" in content
    assert "취향: 음료: 아메리카노" in content
    assert "기억: 지난주 등산" in content
