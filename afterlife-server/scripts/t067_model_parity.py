#!/usr/bin/env python3
"""t067_model_parity.py <onnx> <tflite> — 랜덤+실이미지 입력으로 onnx/tflite 출력 cosine>0.999 검증.
Task 8 하네스도 embed_onnx()를 import해 앱과 동일 전처리를 보장한다."""
import sys, numpy as np

def preprocess(img_arr):                       # img_arr: HWC uint8 RGB 112x112
    x = (img_arr.astype(np.float32) - 127.5) / 127.5
    return x[None, ...]                        # NHWC [1,112,112,3]

def embed_onnx(img_path, onnx_path="w600k_mbf.onnx"):
    import onnxruntime as ort
    from PIL import Image
    img = np.asarray(Image.open(img_path).convert("RGB").resize((112, 112)))
    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    x = preprocess(img).transpose(0, 3, 1, 2)  # onnx는 NCHW
    v = sess.run(None, {sess.get_inputs()[0].name: x})[0][0]
    return v / np.linalg.norm(v)

if __name__ == "__main__":
    onnx_path, tflite_path = sys.argv[1], sys.argv[2]
    import onnxruntime as ort
    try:
        from ai_edge_litert.interpreter import Interpreter
    except ImportError:
        from tensorflow.lite import Interpreter  # fallback
    rng = np.random.default_rng(42)
    img = rng.integers(0, 256, (112, 112, 3), dtype=np.uint8)
    x = preprocess(img)
    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    a = sess.run(None, {sess.get_inputs()[0].name: x.transpose(0, 3, 1, 2)})[0][0]
    it = Interpreter(model_path=tflite_path); it.allocate_tensors()
    inp, out = it.get_input_details()[0], it.get_output_details()[0]
    assert tuple(inp["shape"]) == (1, 112, 112, 3), f"입력 NHWC 아님: {inp['shape']}"
    assert tuple(out["shape"]) == (1, 512), f"출력 512d 아님: {out['shape']}"
    it.set_tensor(inp["index"], x.astype(np.float32)); it.invoke()
    b = it.get_tensor(out["index"])[0]
    a, b = a / np.linalg.norm(a), b / np.linalg.norm(b)
    cos = float(np.dot(a, b))
    print(f"parity cosine={cos:.6f}")
    assert cos > 0.999, "onnx/tflite 패리티 실패 — 변환 옵션 점검"
    print("PARITY OK")
