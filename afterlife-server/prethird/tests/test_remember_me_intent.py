"""test_remember_me_intent.py — "나를 기억해" 류 발화로 Remember Me 시트를 여는 의도 감지.

이 정규식이 하는 일과 하지 않는 일을 분명히 해 둔다. **이름을 뽑지 않는다.**
UI 를 열라는 신호만 만든다. 이름은 사용자가 시트에 직접 입력한다.

T-467 B 가 제거되는 이유와 이 모듈이 남는 이유가 정확히 이 차이다. T-467 B 는
"응/그래" 를 듣고 **이름을 확정**했다 — STT 오인식이 그대로 신원이 되어 person 43 에
"이름이 카메라이다" 가 8건 쌓였다. 여기서 잘못 발동해봐야 시트가 한 번 열릴 뿐이다.
"""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from remember_me_intent import wants_remember_me  # noqa: E402


def test_기억_요청은_발동한다():
    for text in (
        "내 이름 기억해줘",
        "이름 좀 기억해",
        "나 기억해줘",
        "날 기억해 줘",
        "저를 기억해주세요",
        "내 이름 저장해줘",
        "나 등록해줘",
        "제 이름 좀 등록해 주세요",
    ):
        assert wants_remember_me(text), text


def test_기억_여부를_묻는_말은_발동하지_않는다():
    """되묻기(_RULE_UNKNOWN_ASK)로 클론이 "기억이 잘 안 나" 라고 하면 사용자가
    "어제 일 기억해?" 처럼 되물을 수 있다. 그때마다 시트가 뜨면 대화가 불가능하다."""
    for text in (
        "어제 일 기억해?",
        "그거 기억나?",
        "내 이름 기억나니",
        "나 기억하니?",
        "내 이름 기억해요?",
    ):
        assert not wants_remember_me(text), text


def test_대상이_나_자신이_아니면_발동하지_않는다():
    for text in (
        "그 얘기 기억해줘",
        "이 노래 저장해줘",
        "카메라 기억해",
        "우리 약속 기억해줘",
    ):
        assert not wants_remember_me(text), text


def test_빈값과_비문자열은_안전하게_False():
    for text in ("", "   ", None, 123, [], {}):
        assert wants_remember_me(text) is False


def test_이름을_추출하지_않는다():
    """이 모듈의 반환은 bool 이다 — 이름을 만들어내는 경로가 아예 없어야 한다."""
    assert wants_remember_me("내 이름은 지호야 기억해줘") is True
    # 반환값에 "지호" 가 실려 나갈 수 있는 형태(str/dict/tuple)면 안 된다.
    assert isinstance(wants_remember_me("내 이름은 지호야 기억해줘"), bool)
