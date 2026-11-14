"""AFL-1096 입싱크 마스크 분할기 선택 — 기본은 BiSeNet 그대로, mediapipe 일 때만 바뀌고 캐시 이름이 갈린다.

torch·mediapipe 없이 돌도록 두 분할기 모듈을 가짜로 끼워 고르는 경로만 확인한다.
"""
import os
import sys
import types

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import face_parser  # noqa: E402


@pytest.fixture
def fake_parsers(monkeypatch):
    made = []

    class FakeBiSeNet:
        def __init__(self, left_cheek_width=80, right_cheek_width=80):
            made.append(("bisenet", left_cheek_width, right_cheek_width))

    class FakeMP:
        MASK_TAG = "_mp"

        def __init__(self, left_cheek_width=80, right_cheek_width=80):
            made.append(("mediapipe", left_cheek_width, right_cheek_width))

    fp_mod = types.ModuleType("musetalk.utils.face_parsing")
    fp_mod.FaceParsing = FakeBiSeNet
    mp_mod = types.ModuleType("mp_face_parsing")
    mp_mod.MediaPipeFaceParsing = FakeMP
    for name in ("musetalk", "musetalk.utils"):
        monkeypatch.setitem(sys.modules, name, types.ModuleType(name))
    monkeypatch.setitem(sys.modules, "musetalk.utils.face_parsing", fp_mod)
    monkeypatch.setitem(sys.modules, "mp_face_parsing", mp_mod)
    return made


@pytest.mark.parametrize("value,expected", [
    (None, "bisenet"), ("", "bisenet"), ("bisenet", "bisenet"), ("mediapipe", "mediapipe"),
    (" MediaPipe ", "mediapipe"), ("insightface", "bisenet"),
])
def test_parser_name(value, expected):
    env = {} if value is None else {face_parser.ENV: value}
    assert face_parser.parser_name(env) == expected


def test_default_is_bisenet_with_same_cache_name(fake_parsers):
    fp = face_parser.make_face_parser(90, 90, env={})
    assert fake_parsers == [("bisenet", 90, 90)]
    assert face_parser.mask_tag(fp) == ""  # 기존 마스크 캐시 파일명 그대로


def test_mediapipe_selected_and_cache_tagged(fake_parsers):
    fp = face_parser.make_face_parser(90, 90, env={face_parser.ENV: "mediapipe"})
    assert fake_parsers == [("mediapipe", 90, 90)]
    assert face_parser.mask_tag(fp) == "_mp"


def test_unknown_value_falls_back_to_bisenet(fake_parsers):
    face_parser.make_face_parser(env={face_parser.ENV: "bogus"})
    assert fake_parsers == [("bisenet", 80, 80)]
