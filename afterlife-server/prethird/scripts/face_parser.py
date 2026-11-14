"""AFL-1096 — 입싱크 마스크용 얼굴 분할기 선택.

PRETHIRD_FACE_PARSER
  bisenet   (기본) MuseTalk 원본 BiSeNet(face-parse-bisent 79999_iter.pth). 학습 데이터 CelebAMask-HQ 가
            비상업 연구·교육 전용이라 라이선스 회색지대(서버 라이선스 점검 R-2).
  mediapipe MediaPipe Face Mesh(Apache-2.0) 랜드마크로 같은 라벨을 그린다(mp_face_parsing.py).
            BiSeNet 가중치를 아예 읽지 않는다.

마스크 캐시 이름에 분할기 꼬리표(mask_tag)를 붙여 두 방식의 캐시가 섞이지 않게 한다
(bisenet = 빈 꼬리표 → 기존 캐시 파일명 그대로).
"""
from __future__ import annotations

import os

ENV = "PRETHIRD_FACE_PARSER"
_CHOICES = ("bisenet", "mediapipe")


def parser_name(env: dict | None = None) -> str:
    """환경변수 값 → 'bisenet' | 'mediapipe'. 모르는 값·빈 값은 기본 bisenet."""
    v = (env if env is not None else os.environ).get(ENV, "").strip().lower()
    return v if v in _CHOICES else "bisenet"


def mask_tag(fp) -> str:
    """분할기 객체의 마스크 캐시 꼬리표. BiSeNet(속성 없음)은 '' 라 기존 파일명이 유지된다."""
    return str(getattr(fp, "MASK_TAG", "") or "")


def make_face_parser(left_cheek_width: int = 80, right_cheek_width: int = 80, env: dict | None = None):
    """선택된 분할기를 만든다. 무거운 모듈(torch·mediapipe)은 여기서만 import 한다."""
    if parser_name(env) == "mediapipe":
        from mp_face_parsing import MediaPipeFaceParsing  # noqa: PLC0415

        print(f"[AFL-1096] face parser = mediapipe (lc={left_cheek_width} rc={right_cheek_width})", flush=True)
        return MediaPipeFaceParsing(left_cheek_width=left_cheek_width, right_cheek_width=right_cheek_width)
    from musetalk.utils.face_parsing import FaceParsing  # noqa: PLC0415

    return FaceParsing(left_cheek_width=left_cheek_width, right_cheek_width=right_cheek_width)
