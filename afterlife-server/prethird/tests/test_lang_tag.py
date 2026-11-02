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


# AFL-1067 <emo=…> 감정 태그 — 언어(·ask) 태그 뒤에 하나. TTS 견본 선택용 파라미터.
from clone_dialog.lang_tag import DEFAULT_EMOTION, EMOTIONS, emotion_instruction, normalize_emotion, split_reply_tags  # noqa: E402


def test_emo_6종_기본_neutral():
    assert EMOTIONS == ("neutral", "calm", "happy", "sad", "angry", "warm")
    assert DEFAULT_EMOTION == "neutral"


def test_normalize_emotion():
    assert normalize_emotion("SAD") == "sad"
    assert normalize_emotion(" warm ") == "warm"
    assert normalize_emotion("excited") is None
    assert normalize_emotion(None) is None


def test_emo_after_lang():
    assert split_reply_tags("<lang=ko><emo=sad>보고 싶었어.") == ("ko", None, "sad", "보고 싶었어.")


def test_emo_after_ask():
    assert split_reply_tags("<lang=ko><ask=who><emo=calm>카메라 봐줄래?") == ("ko", "who", "calm", "카메라 봐줄래?")


def test_emo_before_lang_순서_바뀌어도_인정():
    assert split_reply_tags("<emo=happy><lang=en>Great!", "ko") == ("en", None, "happy", "Great!")


def test_emo_without_lang_구앱():
    assert split_reply_tags("<emo=warm>괜찮아.") == ("ko", None, "warm", "괜찮아.")


def test_emo_없으면_neutral():
    assert split_reply_tags("<lang=ko>응.") == ("ko", None, "neutral", "응.")


def test_emo_모르는_값은_neutral_본문에서_제거():
    assert split_reply_tags("<lang=ko><emo=excited>와!") == ("ko", None, "neutral", "와!")


def test_emo_중간_닫는태그_지우고_플래그로_안씀():
    assert split_reply_tags("<lang=ko>안녕 <emo=sad>잘 가.</emo>") == ("ko", None, "neutral", "안녕 잘 가.")


def test_split_head_tags_emo_있어도_3튜플_그대로():
    assert split_head_tags("<lang=ko><emo=sad>응") == ("ko", None, "응")
    assert split_lang_tag("<lang=ja><emo=happy>はい") == ("ja", "はい")


def test_stream_emo_조각으로_와도_판정():
    s = LangTagStream("ko")
    parts = ["<lang=ko>", "<e", "mo=s", "ad>", "보고", " 싶었어."]
    out = "".join(s.feed(p) for p in parts) + s.finish()
    assert (s.lang, s.ask, s.emo, out) == ("ko", None, "sad", "보고 싶었어.")


def test_stream_emo_판정전엔_본문_안흘림():
    s = LangTagStream("ko")
    assert s.feed("<lang=ko><emo=wa") == ""
    assert s.emo is None
    assert s.feed("rm>괜찮아") == "괜찮아"
    assert s.emo == "warm"


def test_stream_ask_then_emo():
    s = LangTagStream("ko")
    out = s.feed("<lang=ko><ask=who>") + s.feed("<emo=calm>잠깐") + s.finish()
    assert (s.ask, s.emo, out) == ("who", "calm", "잠깐")


def test_stream_emo_없으면_neutral_으로_확정():
    s = LangTagStream("ko")
    assert s.feed("<lang=ko>응") == "응"
    assert s.emo == "neutral"


def test_stream_emo_끊긴채_끝나면_버림():
    s = LangTagStream("ko")
    out = s.feed("<lang=ko>") + s.feed("<emo=sa") + s.finish()
    assert (s.emo, out) == ("neutral", "")


def test_stream_본문_중간_emo_지움():
    s = LangTagStream("ko")
    out = "".join(s.feed(p) for p in ["<lang=ko><emo=happy>좋아", " <emo", "=sad>", "진짜."]) + s.finish()
    assert (s.emo, out) == ("happy", "좋아 진짜.")


def test_emotion_instruction_값과_예시():
    txt = emotion_instruction()
    for e in EMOTIONS:
        assert e in txt
    assert "<emo=" in txt and "neutral" in txt


# sion 리뷰(2026-10-30): 감정 값 형식이 벗어나도 값 꼬리가 본문으로 새면 안 된다.
def test_emo_값_변형은_통째로_지우고_neutral():
    for raw in ["<emo=warm!>", "<emo=행복>", "<emo=ABCDEFGHIJKLMNOP>", "<emo=happy.>", "<emo=warm, 기쁘게>",
                "<emo=>", "<emo>", "<emo = sad >"]:
        lang, ask, emo, body = split_reply_tags("<lang=ko>" + raw + "안녕", "ja")
        assert body == "안녕", raw
        assert emo == ("sad" if "sad" in raw else "neutral"), raw


def test_emo_중간_값_변형도_통째로_지움():
    assert split_reply_tags("<lang=ko>좋아 <emo=신남!> 진짜.")[3] == "좋아  진짜."


def test_emo_닫는꺾쇠_없으면_본문을_먹지_않음():
    assert split_reply_tags("<lang=ko>안녕 <emo=sad 그리고 많이 보고 싶었어")[3] == "안녕 그리고 많이 보고 싶었어"


def test_stream_emo_글자단위_분할():
    raw = "<lang=ko><emo=happy>와, 잘됐다!"
    s = LangTagStream("ko")
    out = "".join(s.feed(c) for c in raw) + s.finish()
    assert (s.lang, s.emo, out) == ("ko", "happy", "와, 잘됐다!")


def test_stream_emo_값_변형_꼬리_안샘():
    for raw in ["<emo=warm!>", "<emo=행복>", "<emo=warm, 기쁘게>"]:
        s = LangTagStream("ko")
        out = "".join(s.feed(c) for c in "<lang=ko>" + raw + "안녕") + s.finish()
        assert (s.emo, out) == ("neutral", "안녕"), raw


def test_emo_뒤의_ask_는_인정안함_순서고정():
    assert split_reply_tags("<lang=ko><emo=warm><ask=who>좋아") == ("ko", None, "warm", "좋아")


# sion 재검증(2026-10-30): 닫는 `>` 없는 `<emo=` 뒤 본문이 스트림에서 통째로 사라지면 안 된다.
def test_stream_emo_닫는꺾쇠_없어도_본문_유지():
    for raw, want in [("<lang=ko><emo=sad 응.", "응."), ("<lang=ko><emo=sad 괜찮아, 많이 힘들었지?", "괜찮아, 많이 힘들었지?"),
                      ("<lang=ko>x <emo=sad 그래서 말이야", "x 그래서 말이야")]:
        s = LangTagStream("ko")
        out = s.feed(raw) + s.finish()
        assert out == split_reply_tags(raw)[3] == want, raw


def test_emo_긴_값도_꼬리_안샘():
    raw = "<lang=ko><emo=" + "x" * 30 + ">안녕"
    assert split_reply_tags(raw)[3] == "안녕"
    s = LangTagStream("ko")
    assert s.feed(raw) + s.finish() == "안녕"


def test_등호없는_emo_본문은_보존():
    assert split_reply_tags("<lang=ko>안녕 <emo 설명 텍스트> 끝")[3] == "안녕 <emo 설명 텍스트> 끝"
    assert split_reply_tags("<lang=ko>x<emo 좋아")[3] == "x<emo 좋아"
    assert split_reply_tags("<lang=ko>a <emotion> b")[3] == "a <emotion> b"


def test_emotion_instruction_감정별_말투():
    txt = emotion_instruction()
    assert "[감정에 맞는 말투]" in txt
    assert "어어?" in txt and "하아…" in txt and "하아~" in txt and "아휴," in txt  # 화남 감탄사(쿄카 TTS 확인 11-02)
    assert "에휴" in txt and "문장 중간에만" in txt               # 에휴는 첫머리에서 깨져 중간만(sungjius 11-02)
    for w in ("흐으음…", "참나,", "허 참,", "헐,", "헐…"):       # 2차 TTS 확인(sungjius 11-02)
        assert w in txt, w
    assert "어어어?" not in txt and "쓰읍" not in txt              # 들어 보고 뺀 것
    assert "화가 났을 때만은 반말" in txt and "angry 가 아닐 때는 평소 말투" in txt  # 존댓말 클론은 화날 때만 반말
    assert "욕설" in txt and "이모지" in txt and "2~3문장" in txt


def test_화남_감탄사는_매_턴_하나를_골라_권한다():
    import random
    from clone_dialog.lang_tag import ANGRY_INTERJECTIONS
    picks = set()
    for seed in range(40):
        txt = emotion_instruction(random.Random(seed))
        hit = [w for w in ANGRY_INTERJECTIONS if f'감탄사는 "{w}"를 써' in txt]
        none = "감탄사 없이 바로 퉁명하게 시작해" in txt
        assert len(hit) + none == 1
        picks.add(hit[0] if hit else None)
    assert len(picks) >= 8 and None in picks  # 고르게 돌아가고, 감탄사 없이도 권한다
    assert "에휴" not in ANGRY_INTERJECTIONS  # 에휴는 첫머리에 권하지 않는다(중간만)


def test_최근_답의_첫머리_감탄사_계열을_찾는다():
    from clone_dialog.lang_tag import recent_interjections
    texts = ["헐… 그럼 짧게 할게.", "<lang=ko><emo=angry>헐, 더 세게는 아니고.", "아휴, 그런 식으로 놀리면 짜증 나지.",
             "그래, 준비됐어.", "허 참, 그런 걸 왜 시켜.", "또 해 달라고? 에휴, 알았어."]
    assert recent_interjections(texts) == ["헐", "아휴", "허참"]


def test_최근에_쓴_감탄사는_권하지_않고_쓰지_말라고_한다():
    import random
    from clone_dialog.lang_tag import ANGRY_INTERJECTIONS
    for seed in range(40):
        txt = emotion_instruction(random.Random(seed), avoid=["헐", "아휴"])
        assert '감탄사는 "헐' not in txt and '감탄사는 "아휴' not in txt
        assert '앞 답에서 쓴 "헐"·"아휴" 는 이번엔 쓰지 마' in txt
    assert "앞 답에서" not in emotion_instruction(random.Random(1))


def test_기쁨_슬픔_다정_감탄사_목록():
    txt = emotion_instruction()
    for w in ("와아~", "우와!", "오오~", "헤헤,", "야호!",           # 기쁨(쿄카 TTS 확인 sungjius 11-02)
              "저런…", "아이고…", "어떡해…", "흐음…", "흑…",     # 슬픔
              "그랬구나,", "아이고~", "에구,", "음~", "그럼 그럼,", "토닥토닥,"):  # 다정
        assert w in txt, w
    assert '"어머' not in txt.replace('(\"어머\" 등)', "")  # 폭주·잘림 잦아 뺌 — 쓰지 말라는 문구에만 남는다
    assert "목록에 없는 감탄사" in txt


def test_감정마다_이번_턴_감탄사를_하나씩_권한다():
    import random
    from clone_dialog.lang_tag import EMO_INTERJECTIONS
    seen = {emo: set() for emo in EMO_INTERJECTIONS}
    for seed in range(60):
        txt = emotion_instruction(random.Random(seed))
        for emo, words in EMO_INTERJECTIONS.items():
            hit = [w for w in words if f'이번 답이 {emo} 라면 감탄사는 "{w}"를 써' in txt]
            none = f"이번 답이 {emo} 라면 감탄사 없이" in txt
            assert len(hit) + none == 1, (emo, seed)
            seen[emo].add(hit[0] if hit else None)
    for emo, words in EMO_INTERJECTIONS.items():
        assert None in seen[emo] and len(seen[emo]) >= len(words) - 1, emo


def test_최근_답_감탄사_계열은_감정_상관없이_찾고_피한다():
    import random
    from clone_dialog.lang_tag import recent_interjections
    texts = ["<lang=ko><emo=happy>와아~ 진짜 잘됐다!", "저런… 많이 힘들었겠다.", "아까 그 얘기 말이야.",
             "음식 맛있었어?", "그럼 그럼, 다 알지.", "아 그랬구나, 몰랐어."]
    assert recent_interjections(texts) == ["와아", "저런", "그럼그럼", "아"]
    for seed in range(40):
        txt = emotion_instruction(random.Random(seed), avoid=["와아", "저런"])
        assert '감탄사는 "와아~"' not in txt and '감탄사는 "저런…"' not in txt
        assert '앞 답에서 쓴 "와아"·"저런" 는 이번엔 쓰지 마' in txt


def test_물결은_감탄사_목록의_것만_허용():
    txt = emotion_instruction()
    assert '"하아~"·"와아~"' in txt and "이모지" in txt
