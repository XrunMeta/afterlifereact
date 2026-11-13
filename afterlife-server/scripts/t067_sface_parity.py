#!/usr/bin/env python3
"""t067_sface_parity.py <onnx> <tflite> — SFace onnx/tflite 변환 패리티 검증.

전처리 공식 (OpenCV FaceRecognizerSF.feature 와 동일):
  - 입력 이미지: 112×112×3 aligned face, **BGR** (RGB 아님)
  - uint8 → float32 로 타입 변환만, **평균 차감 없음, 스케일 1.0**
    (즉 `blobFromImage(aligned, 1.0, size, Scalar(0,0,0), false, false)` 와 동치)
  - 모델은 L2 정규화를 포함하지 않음 → 임베딩 출력 후 외부에서 L2 정규화 (OpenCV `cv::normalize`)

Task 8 하네스 재사용 호환: embed_onnx(img_path, onnx_path) 를 import 해 앱과 동일 전처리를 보장한다.

시드 랜덤 5개 + PIL 합성 구조 이미지 1개, 총 6개 입력으로 onnx/tflite 출력 cosine>0.999 검증.
"""
import sys
import numpy as np


def preprocess(img_bgr: "np.ndarray") -> "np.ndarray":
    """SFace 공식 전처리 — BGR uint8 → float32 로 타입만 변환, 스케일/평균 없음.

    img_bgr: HWC uint8 BGR 112x112.
    반환: NHWC float32 [1,112,112,3] (0..255 값 그대로).
    """
    x = img_bgr.astype(np.float32)
    return x[None, ...]


def _run_onnx(sess, img_bgr):
    """onnx 세션 공용 추론 헬퍼 — embed_onnx와 __main__ 패리티 루프가 함께 사용(DRY).
    SFace ONNX는 입력 레이아웃이 NCHW [1,3,112,112] 라 NHWC 입력을 전치한다."""
    x = preprocess(img_bgr).transpose(0, 3, 1, 2)  # NHWC → NCHW
    v = sess.run(None, {sess.get_inputs()[0].name: x})[0][0]
    n = np.linalg.norm(v)
    return v / n if n > 0 else v


def embed_onnx(img_path, onnx_path):
    """img_path 이미지를 onnx_path(sface_2021dec.onnx) 모델로 128d 임베딩(L2 정규화).

    주의: PIL이 RGB로 열므로 BGR로 채널을 뒤집어야 SFace 입력과 맞는다.
    """
    import onnxruntime as ort
    from PIL import Image

    img_rgb = np.asarray(Image.open(img_path).convert("RGB").resize((112, 112)))
    img_bgr = img_rgb[:, :, ::-1].copy()  # RGB → BGR
    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    return _run_onnx(sess, img_bgr)


def _make_synthetic_image():
    """랜덤 노이즈만으로는 실사 분포를 대표하지 못하므로, 그라디언트 배경 + 도형으로
    구성된 합성 이미지를 추가 검증 입력으로 사용한다. 반환은 BGR uint8."""
    from PIL import Image, ImageDraw

    img = Image.new("RGB", (112, 112))
    px = img.load()
    for y in range(112):
        for x in range(112):
            px[x, y] = (int(255 * x / 111), int(255 * y / 111), 128)
    draw = ImageDraw.Draw(img)
    draw.ellipse((20, 20, 70, 70), fill=(200, 180, 160))
    draw.rectangle((60, 60, 100, 100), fill=(90, 60, 50))
    rgb = np.asarray(img)
    return rgb[:, :, ::-1].copy()  # RGB → BGR


if __name__ == "__main__":
    onnx_path, tflite_path = sys.argv[1], sys.argv[2]
    import onnxruntime as ort
    try:
        from ai_edge_litert.interpreter import Interpreter
    except ImportError:
        from tensorflow.lite import Interpreter  # fallback

    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    it = Interpreter(model_path=tflite_path)
    it.allocate_tensors()
    inp, out = it.get_input_details()[0], it.get_output_details()[0]
    # onnx2tf 는 NHWC 로 전치해서 내보낸다 — 기대 입력 레이아웃.
    assert tuple(inp["shape"]) == (1, 112, 112, 3), f"입력 NHWC 아님: {inp['shape']}"
    assert tuple(out["shape"]) == (1, 128), f"출력 128d 아님: {out['shape']}"

    rng = np.random.default_rng(42)
    # SFace는 BGR 입력 — 랜덤이어도 채널 순서는 맞춰 둔다(실질 통계적 영향 없지만 계약 일치).
    test_images = [rng.integers(0, 256, (112, 112, 3), dtype=np.uint8) for _ in range(5)]
    test_images.append(_make_synthetic_image())

    all_pass = True
    for i, img in enumerate(test_images):
        a = _run_onnx(sess, img)
        x = preprocess(img)
        it.set_tensor(inp["index"], x.astype(np.float32))
        it.invoke()
        b = it.get_tensor(out["index"])[0]
        n = np.linalg.norm(b)
        b = b / n if n > 0 else b
        cos = float(np.dot(a, b))
        label = f"random#{i}" if i < 5 else "synthetic"
        print(f"[{label}] parity cosine={cos:.6f}")
        if cos <= 0.999:
            all_pass = False

    assert all_pass, "onnx/tflite 패리티 실패 — 변환 옵션 점검"
    print("PARITY OK")
