#!/usr/bin/env python3
"""t067_model_parity.py <onnx> <tflite> — 시드 랜덤 5개 + PIL 합성 구조 이미지(그라디언트+도형) 1개,
총 6개 입력으로 onnx/tflite 출력 cosine>0.999 검증. 6개 전부 통과해야 PARITY OK.
Task 8 하네스는 embed_onnx(img_path, onnx_path)를 import해 앱과 동일 전처리를 보장한다."""
import sys, numpy as np

def preprocess(img_arr):                       # img_arr: HWC uint8 RGB 112x112
    x = (img_arr.astype(np.float32) - 127.5) / 127.5
    return x[None, ...]                        # NHWC [1,112,112,3]

def _run_onnx(sess, img_arr):
    """onnx 세션 공용 추론 헬퍼 — embed_onnx와 __main__ 패리티 루프가 함께 사용(DRY)."""
    x = preprocess(img_arr).transpose(0, 3, 1, 2)  # onnx는 NCHW
    v = sess.run(None, {sess.get_inputs()[0].name: x})[0][0]
    return v / np.linalg.norm(v)

def embed_onnx(img_path, onnx_path):
    """img_path 이미지를 onnx_path(w600k_mbf.onnx 등) 모델로 512d 임베딩(L2 정규화).
    onnx_path는 필수 인자 — 호출자(Task 8 하네스)가 실제 모델 경로를 명시해야 한다."""
    import onnxruntime as ort
    from PIL import Image
    img = np.asarray(Image.open(img_path).convert("RGB").resize((112, 112)))
    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    return _run_onnx(sess, img)

def _make_synthetic_image():
    """랜덤 노이즈만으로는 실사 분포를 대표하지 못하므로, 그라디언트 배경 + 도형으로
    구성된 합성 이미지를 추가 검증 입력으로 사용한다."""
    from PIL import Image, ImageDraw
    img = Image.new("RGB", (112, 112))
    px = img.load()
    for y in range(112):
        for x in range(112):
            px[x, y] = (int(255 * x / 111), int(255 * y / 111), 128)
    draw = ImageDraw.Draw(img)
    draw.ellipse((20, 20, 70, 70), fill=(200, 180, 160))
    draw.rectangle((60, 60, 100, 100), fill=(90, 60, 50))
    return np.asarray(img)

if __name__ == "__main__":
    onnx_path, tflite_path = sys.argv[1], sys.argv[2]
    import onnxruntime as ort
    try:
        from ai_edge_litert.interpreter import Interpreter
    except ImportError:
        from tensorflow.lite import Interpreter  # fallback

    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    it = Interpreter(model_path=tflite_path); it.allocate_tensors()
    inp, out = it.get_input_details()[0], it.get_output_details()[0]
    assert tuple(inp["shape"]) == (1, 112, 112, 3), f"입력 NHWC 아님: {inp['shape']}"
    assert tuple(out["shape"]) == (1, 512), f"출력 512d 아님: {out['shape']}"

    rng = np.random.default_rng(42)
    test_images = [rng.integers(0, 256, (112, 112, 3), dtype=np.uint8) for _ in range(5)]
    test_images.append(_make_synthetic_image())

    all_pass = True
    for i, img in enumerate(test_images):
        a = _run_onnx(sess, img)
        x = preprocess(img)
        it.set_tensor(inp["index"], x.astype(np.float32)); it.invoke()
        b = it.get_tensor(out["index"])[0]
        b = b / np.linalg.norm(b)
        cos = float(np.dot(a, b))
        label = f"random#{i}" if i < 5 else "synthetic"
        print(f"[{label}] parity cosine={cos:.6f}")
        if cos <= 0.999:
            all_pass = False

    assert all_pass, "onnx/tflite 패리티 실패 — 변환 옵션 점검"
    print("PARITY OK")
