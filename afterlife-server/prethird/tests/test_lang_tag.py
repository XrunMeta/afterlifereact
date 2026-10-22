"""AFL-1033 응답 언어 태그 파서 (채팅·통화 공용)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from clone_dialog.lang_tag import LangTagStream, lang_instruction, normalize_lang, split_lang_tag  # noqa: E402


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
