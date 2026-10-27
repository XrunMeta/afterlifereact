"""견본 글에 쉼 자리 문장부호 넣기 (AFL-1059).

사용자 녹음 견본은 STT 글에 문장부호가 하나도 없었다(9220·9222·9224). 소리에는 0.4~0.9초 쉼이 있는데
글에는 표시가 없으니 CosyVoice 가 "아무 데서나 쉰다" 를 배워 1~5초씩 쉬었다. 같은 견본에 문장부호만
넣어도 1초 넘는 정적이 22 → 11 로 줄었다(문장 176개, 2026-10-27).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import make_prompt_ref as mpr  # noqa: E402

W = [{"w": " 오늘", "s": 0.0, "e": 0.4}, {"w": " 날씨", "s": 0.4, "e": 0.8},
     {"w": " 진짜", "s": 0.8, "e": 1.1}, {"w": " 좋더라구요", "s": 1.1, "e": 2.0},
     {"w": " 점심", "s": 2.5, "e": 2.8}, {"w": " 먹고", "s": 2.8, "e": 3.1},
     {"w": " 나갔는데", "s": 3.1, "e": 3.9}, {"w": " 햇볕이", "s": 4.8, "e": 5.2},
     {"w": " 따뜻했어요", "s": 5.2, "e": 6.0}]
PAUSES = [(2.0, 2.45), (3.9, 4.83)]


def test_쉼_자리에_문장부호():
    assert mpr.punctuate(W, PAUSES) == "오늘 날씨 진짜 좋더라구요. 점심 먹고 나갔는데, 햇볕이 따뜻했어요."


def test_짧은_쉼은_무시():
    assert mpr.punctuate(W, [(2.0, 2.2)]) == "오늘 날씨 진짜 좋더라구요 점심 먹고 나갔는데 햇볕이 따뜻했어요."


def test_이미_문장부호가_있으면_그대로():
    w = [dict(x) for x in W]
    w[3]["w"] = " 좋더라구요."
    w[-1]["w"] = " 따뜻했어요!"
    assert mpr.punctuate(w, PAUSES) == "오늘 날씨 진짜 좋더라구요. 점심 먹고 나갔는데, 햇볕이 따뜻했어요!"


def test_끝_무음은_무시():
    # 마지막 단어 뒤 무음은 문장 사이 쉼이 아니다.
    assert mpr.punctuate(W, [(6.5, 7.2)]) == "오늘 날씨 진짜 좋더라구요 점심 먹고 나갔는데 햇볕이 따뜻했어요."


def test_STT가_쉼을_다음_단어에_삼켜도_앞_단어_끝으로_맞춘다():
    # 실측 9222: 나갔는데[4.46-5.14] 햇볕이[5.14-6.64], 실제 쉼 5.45-6.33 — 쉼 가운데(5.89)는 경계(5.14)와
    # 0.75초 떨어져 놓쳤다. 쉼 시작과 직전 단어 끝(0.31초 차)으로 맞춘다.
    w = [{"w": " 밖에", "s": 4.10, "e": 4.46}, {"w": " 나갔는데", "s": 4.46, "e": 5.14},
         {"w": " 햇볕이", "s": 5.14, "e": 6.64}, {"w": " 따뜻해서", "s": 6.64, "e": 7.2}]
    assert mpr.punctuate(w, [(5.45, 6.33)]) == "밖에 나갔는데, 햇볕이 따뜻해서."


def test_전사는_words_로_문장부호를_넣는다(monkeypatch, tmp_path):
    seen = {}

    class _Resp:
        def read(self):
            return json.dumps({"ref_text": "오늘 날씨 진짜 좋더라구요 점심 먹고 나갔는데 햇볕이 따뜻했어요",
                               "words": W}).encode()

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    def fake(req, timeout=None):
        seen.update(json.loads(req.data.decode()))
        return _Resp()
    monkeypatch.setattr(mpr.urllib.request, "urlopen", fake)
    monkeypatch.setattr(mpr, "silences", lambda p: ([s for s, _ in PAUSES], [e for _, e in PAUSES]))
    assert mpr.transcribe(str(tmp_path / "x.wav")) == "오늘 날씨 진짜 좋더라구요. 점심 먹고 나갔는데, 햇볕이 따뜻했어요."
    assert seen["words"] is True


def test_words_없는_옛_STT는_종전대로(monkeypatch, tmp_path):
    class _Resp:
        def read(self):
            return json.dumps({"ref_text": "안녕하세요 반가워요"}).encode()

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False
    monkeypatch.setattr(mpr.urllib.request, "urlopen", lambda req, timeout=None: _Resp())
    assert mpr.transcribe(str(tmp_path / "x.wav")) == "안녕하세요 반가워요"


def test_STT가_쉼을_앞_단어에_삼켜도_맞춘다():
    # 실측 9220: 맛있더라구요[4.78-6.28], 실제 쉼 5.55-6.32 — 단어 끝이 쉼 안에 있다.
    w = [{"w": " 더", "s": 4.54, "e": 4.78}, {"w": " 맛있더라구요", "s": 4.78, "e": 6.28},
         {"w": " 따끈한", "s": 6.28, "e": 6.94}, {"w": " 국물", "s": 6.94, "e": 7.18}]
    assert mpr.punctuate(w, [(5.55, 6.32)]) == "더 맛있더라구요. 따끈한 국물."
