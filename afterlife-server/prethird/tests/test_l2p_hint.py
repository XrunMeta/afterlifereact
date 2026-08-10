"""test_l2p_hint — T-252: verify와 실통화가 공유하는 L2' 힌트는 이제 옛 append 방식
힌트 조립 함수가 아니라 bundle_to_messages(bundle, speaker=...) 재조립으로 낸다.
검증 의도(이름만 있을 때 vs 관계/취향/기억이 있을 때)는 그대로 유지하고 조립
방식만 Task 5 이관에 맞춰 갱신한다."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from clone_dialog import bundle_to_messages  # noqa: E402

_BUNDLE = {
    "personaBundle": {
        "cloneId": "1",
        "persona": {"displayName": "코조", "tone": "친근함"},
    }
}


def test_hint_name_only_when_no_l2p():
    for l2p in (None, {}):
        messages = bundle_to_messages(_BUNDLE, speaker={"name": "형", "l2p_data": l2p})
        content = messages[0]["content"]
        assert '지금 너와 통화 중인 상대는 "형" 이다.' in content
        # l2p_data가 없으면 base persona로 폴백하는데, base persona엔 상대 필드가
        # 없으므로 "상대 정보" 섹션 자체가 생기지 않는다 — 이름만 있는 상태.
        # (머리말 규칙 문장이 "## 상대 정보"를 인용부호로 언급하므로 그 줄과 헷갈리지
        # 않도록, 줄 단위 헤딩 형태로만 검사한다.)
        assert "\n## 상대 정보\n" not in content


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
