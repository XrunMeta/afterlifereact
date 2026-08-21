"""T-545 E: 얼굴 이미지 → 10 viseme PNG 사전 렌더 도구 (MVP · PIL 만).

용도:
    1) 페르소나 얼굴 이미지 1장 입력.
    2) 각 viseme (REST/A/E/I/O/U/EO/EU/BILAB/DENT) 에 맞는 입 모양 오버레이를
       프로그램적으로 그려 10개 PNG 산출.
    3) 산출물을 R2 prefix (예: `visemes/9126/`) 에 업로드하면 클라이언트가
       `VisemePlayer` 로 재생.

MVP 제약 (의도):
    - MediaPipe 없이 PIL 만 사용 → gabia 시스템 의존성 최소 (pip install pillow 만).
    - 실제 얼굴 랜드마크 감지 X. 대신 이미지 하단 중앙에 고정 위치로 입 모양 오버레이.
    - 얼굴 세로 비율에 따라 오버레이 위치가 어긋날 수 있음. 이건 후속 업그레이드 대상.
    - 완성 수준: 실 통화 립싱크 대체는 아니지만 파이프라인 end-to-end 검증에 충분.

후속 (별건):
    - MediaPipe FaceMesh 로 입 랜드마크 감지 → 정확한 mouth ROI 계산.
    - Thin-plate spline 로 mouth ROI 워핑 → 자연스러운 입 모양 변형.
    - 최종적으로 EchoMimicV3 로 10 프레임 사전 렌더 (highest quality, 오래 걸림).

사용법:
    python render_visemes.py <face_image_path> <output_dir>

    예:
    python render_visemes.py /tmp/9126_face.jpg /tmp/9126_visemes/
    → /tmp/9126_visemes/viseme_rest.png ... viseme_dent.png (10개)

관련: [[T-545]] · [[persona_bundle]] · korean_viseme.py (자모 → viseme 매퍼).
"""
from __future__ import annotations
import sys
import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.stderr.write("PIL (Pillow) required. Install: pip install Pillow\n")
    sys.exit(1)


# 10 viseme 목록 (VisemePlayer.tsx VISEME_ORDER 와 정합).
VISEMES = ["REST", "A", "E", "I", "O", "U", "EO", "EU", "BILAB", "DENT"]

# 입 모양 파라미터 — (width_ratio, height_ratio, shape).
# ratios 는 얼굴 이미지 짧은 변 대비 비율.
# shape: "closed" | "oval" | "wide" | "round" | "teeth".
MOUTH_STYLES: dict[str, tuple[float, float, str]] = {
    "REST":  (0.14, 0.02, "closed"),  # 살짝 닫힘
    "A":     (0.14, 0.10, "oval"),    # 크게 열림 (아)
    "E":     (0.18, 0.03, "wide"),    # 옆으로 넓게 (에)
    "I":     (0.16, 0.02, "wide"),    # 이 — 살짝 벌리고 옆으로
    "O":     (0.10, 0.09, "round"),   # 동그랗게 (오)
    "U":     (0.07, 0.07, "round"),   # 작고 동그랗게 (우)
    "EO":    (0.13, 0.07, "oval"),    # 중간 (어)
    "EU":    (0.12, 0.03, "wide"),    # 으
    "BILAB": (0.13, 0.005, "closed"), # 완전히 다물음 (ㅁㅂㅍ)
    "DENT":  (0.15, 0.04, "teeth"),   # 이 드러남 (ㄷㅌㅅ)
}

# 얼굴 이미지 대비 입 위치 — (x_ratio, y_ratio).
# 정면 얼굴 표준 비율: 입은 세로 중앙보다 살짝 아래 (약 0.72), 가로 중앙 (0.5).
MOUTH_POS = (0.5, 0.72)

# 입 색상 — 어두운 붉은색 (검정 배경 · 붉은 립 이질감 방지).
LIP_COLOR = (110, 40, 45)
TEETH_COLOR = (240, 235, 220)
INNER_MOUTH_COLOR = (60, 25, 30)


def _draw_mouth(img: Image.Image, viseme: str) -> Image.Image:
    """이미지 사본에 viseme 에 맞는 입 오버레이 그리고 반환."""
    out = img.copy().convert("RGBA")
    draw = ImageDraw.Draw(out, "RGBA")
    W, H = out.size
    short = min(W, H)
    cx = int(W * MOUTH_POS[0])
    cy = int(H * MOUTH_POS[1])

    w_ratio, h_ratio, shape = MOUTH_STYLES[viseme]
    w = int(short * w_ratio)
    h = max(3, int(short * h_ratio))
    left, top = cx - w // 2, cy - h // 2
    right, bottom = cx + w // 2, cy + h // 2
    bbox = (left, top, right, bottom)

    if shape == "closed":
        # 얇은 선 — 얼굴 위에 입 라인.
        draw.line([(left, cy), (right, cy)], fill=LIP_COLOR, width=max(2, h))
    elif shape == "oval":
        # 세로로 열린 타원 — 안쪽 어둡게, 립 라인.
        draw.ellipse(bbox, fill=INNER_MOUTH_COLOR, outline=LIP_COLOR, width=2)
    elif shape == "wide":
        # 옆으로 넓은 타원 (얇음). 이가 살짝 보이도록 안쪽 밝게.
        draw.ellipse(bbox, fill=TEETH_COLOR, outline=LIP_COLOR, width=2)
    elif shape == "round":
        # 원형 (O/U). 안쪽 어둡게.
        r = min(w, h) // 2
        draw.ellipse(
            (cx - r, cy - r, cx + r, cy + r),
            fill=INNER_MOUTH_COLOR,
            outline=LIP_COLOR,
            width=2,
        )
    elif shape == "teeth":
        # 이 드러난 모양 (ㄷㅌㅅ). 밝은 안쪽 + 위쪽 이빨 선.
        draw.ellipse(bbox, fill=TEETH_COLOR, outline=LIP_COLOR, width=2)
        # 위쪽 이빨 세로선 3개.
        teeth_top = top + max(1, h // 4)
        teeth_bot = cy
        step = w // 4
        for i in range(1, 4):
            x = left + step * i
            draw.line([(x, teeth_top), (x, teeth_bot)], fill=(200, 195, 180), width=1)

    return out.convert("RGB")


def render_visemes(face_path: str, out_dir: str) -> list[str]:
    """얼굴 이미지 → 10 viseme PNG. 산출 파일 경로 리스트 반환."""
    src = Image.open(face_path)
    if src.mode != "RGB":
        src = src.convert("RGB")

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    results: list[str] = []
    for v in VISEMES:
        rendered = _draw_mouth(src, v)
        fname = f"viseme_{v.lower()}.png"
        fpath = out_path / fname
        rendered.save(fpath, "PNG", optimize=True)
        results.append(str(fpath))
        print(f"[render_visemes] {v:<6} -> {fpath}")

    return results


def main():
    if len(sys.argv) != 3:
        print("usage: render_visemes.py <face_image_path> <output_dir>", file=sys.stderr)
        sys.exit(2)
    face_path, out_dir = sys.argv[1], sys.argv[2]
    if not os.path.isfile(face_path):
        print(f"face image not found: {face_path}", file=sys.stderr)
        sys.exit(2)
    render_visemes(face_path, out_dir)


if __name__ == "__main__":
    main()
