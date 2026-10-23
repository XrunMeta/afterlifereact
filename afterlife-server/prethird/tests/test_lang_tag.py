"""AFL-1033 응답 언어 태그 파서 (채팅·통화 공용)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from clone_dialog.lang_tag import LangTagStream, lang_instruction, normalize_lang, split_head_tags, split_lang_tag  # noqa: E402


def test_정상_태그():
    assert split_lang_tag("<lang=ja>こんにちは！") == ("ja", "こんにちは！")


def test_앞공백_대소문자_지역코드():
    assert split_lang_tag("  <LANG=zh-CN> 你好") == ("zh", "你好")


def test_태그_없음은_사용자언어():
    assert split_lang_tag("Hello there", "en") == ("en", "Hello there")


def test_태그_없고_사용자언어_없으면_ko():
    assert split_lang_tag("안녕") == ("ko", "안녕")


def test_깨진_태그는_폴백_본문에서_제거():
    assert split_lang_tag("<lang=>안녕", "ja") == ("ja", "안녕")
    assert split_lang_tag("<lang=xx 안녕", None) == ("ko", "안녕")


def test_모르는_코드는_폴백():
    assert split_lang_tag("<lang=qq>hi", "en") == ("en", "hi")


def test_중간_태그는_지우고_플래그로_안씀():
    assert split_lang_tag("안녕 <lang=en>hi", "ko") == ("ko", "안녕 hi")


def test_normalize():
    assert normalize_lang("zh-CN") == "zh"
    assert normalize_lang("ja_JP") == "ja"
    assert normalize_lang("xx") is None
    assert normalize_lang(None) is None


def _stream(chunks, fb=None):
    s = LangTagStream(fb)
    out = "".join(s.feed(c) for c in chunks) + s.finish()
    return s.lang, out


def test_스트림_태그가_조각으로_와도_첫_토큰에서_언어_결정():
    s = LangTagStream("ko")
    assert s.feed("<la") == ""
    assert s.lang is None
    assert s.feed("ng=es>Ho") == "Ho"
    assert s.lang == "es"
    assert s.feed("la <lang=en>!") == "la !"


def test_스트림_태그_없음():
    assert _stream(["안", "녕"], "ja") == ("ja", "안녕")


def test_스트림_깨진_태그():
    assert _stream(["<lang=>", "hi"], "en") == ("en", "hi")


def test_스트림_짧은_답_finish():
    assert _stream(["<lang=fr"], "en") == ("en", "")


def test_지시문에_사용자언어_폴백():
    assert "`ja`" in lang_instruction("ja-JP")
    assert "`ko`" in lang_instruction(None)


# AFL-1039 <ask=who>
def test_ask_who_after_lang():
    assert split_head_tags("<lang=ko><ask=who>잠깐 카메라 봐줄래?") == ("ko", "who", "잠깐 카메라 봐줄래?")


def test_ask_tag_midbody_stripped_not_flag():
    assert split_head_tags("<lang=ko>안녕 <ask=who>") == ("ko", None, "안녕")


def test_unknown_ask_value_ignored():
    assert split_head_tags("<lang=ko><ask=name:지호>안녕")[1] is None   # 이름 실어 나르기 차단
    assert split_head_tags("<lang=ko><ask=name:지호>안녕")[2] == "안녕"


def test_ask_without_lang_tag_ignored_and_stripped():
    assert split_head_tags("<ask=who>안녕", "en") == ("en", None, "안녕")


def test_stream_ask_split_across_chunks():
    s = LangTagStream("ko"); out = s.feed("<lang=ko><as") + s.feed("k=who>카메라") + s.finish()
    assert (s.lang, s.ask, out) == ("ko", "who", "카메라")


def test_stream_without_ask_unchanged():
    s = LangTagStream("ko"); out = s.feed("<lang=ja>こんにちは") + s.finish()
    assert (s.lang, s.ask, out) == ("ja", None, "こんにちは")


def test_stream_ask_pending_flushed_on_finish():
    s = LangTagStream("ko"); out = s.feed("<lang=ko><as") + s.finish()
    assert (s.ask, out) == (None, "")


# AFL-1039 실통화(2026-10-23): LLM 이 `</ask=who>` 를 답 끝 닫는 태그로 붙여 화면에 그대로 나왔다.
def test_closing_tags_stripped():
    lang, ask, body = split_head_tags("<lang=ko>카메라 잠깐 봐줘.</ask=who></lang=ko>", "ko")
    assert body == "카메라 잠깐 봐줘." and ask is None


def test_stream_closing_tag_split_across_tokens():
    s = LangTagStream("ko")
    parts = ["<lang=ko>", "카메라", " 봐줘.", "</", "ask", "=who", ">"]
    out = "".join(s.feed(p) for p in parts) + s.finish()
    assert out == "카메라 봐줘." and s.ask is None


def test_stream_partial_tag_at_end_dropped():
    s = LangTagStream("ko")
    out = s.feed("<lang=ko>안녕") + s.feed("</as") + s.finish()
    assert out == "안녕"


def test_stream_lone_lt_kept():
    s = LangTagStream("ko")
    out = s.feed("<lang=ko>a <") + s.feed("3 b") + s.feed(" <") + s.finish()
    assert out == "a <3 b <"


# AFL-1039 실통화(2026-10-23): 답 끝 `</final` 이 화면에 나왔다.
def test_stray_closing_tag_stripped():
    assert split_head_tags("<lang=ko>뭐 하고 있어?</final", "ko") == ("ko", None, "뭐 하고 있어?")
    assert split_head_tags("<lang=ko>좋아.</final>", "ko")[2] == "좋아."


def test_stream_stray_closing_tag_split():
    s = LangTagStream("ko")
    out = "".join(s.feed(p) for p in ["<lang=ko>", "뭐 하고 있어?", "</fin", "al"]) + s.finish()
    assert out == "뭐 하고 있어?"


def test_opening_word_tag_kept_and_lt_text_kept():
    s = LangTagStream("ko")
    out = "".join(s.feed(p) for p in ["<lang=ko>", "a < b 이고 ", "<3"]) + s.finish()
    assert out == "a < b 이고 <3"
