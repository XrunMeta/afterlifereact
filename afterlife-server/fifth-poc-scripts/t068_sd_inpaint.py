"""
T-068 SD Inpaint PoC — 입다문 사진에서 입벌림+치아 생성
환경: sadtalker2 conda env (torch 2.8+cu126)
실행: sudo -n /root/miniconda3/envs/sadtalker2/bin/python t068_sd_inpaint.py [--n 3] [--guidance 12.0] [--steps 50]

의존: diffusers, accelerate, mediapipe, transformers
모델: stabilityai/stable-diffusion-2-inpainting (SD2-inpaint, CreativeML OpenRAIL-M)
모델캐시: /data/huggingface/hub (HF_HOME=/data/huggingface)

라이선스 메모:
  SD 2 Inpainting = stabilityai/stable-diffusion-2-inpainting
  라이선스: CreativeML Open RAIL++-M License
  상용: 가능 (단, 라이선스 파일 포함 + "Responsible AI" 조항 준수 필요)
  참고: https://huggingface.co/stabilityai/stable-diffusion-2-inpainting/blob/main/LICENSE-MODEL
"""

import os, sys, argparse, time
import numpy as np
import cv2
from PIL import Image

# HF 캐시 → /data (루트 84% 회피)
os.environ["HF_HOME"] = "/data/huggingface"
os.environ["TRANSFORMERS_CACHE"] = "/data/huggingface/hub"
os.environ["HF_DATASETS_CACHE"] = "/data/huggingface/datasets"

# GPU1 사용 (prethird/musetalk GPU0 보호)
os.environ["CUDA_VISIBLE_DEVICES"] = "0"  # 컨테이너 외부 직접 실행 시 GPU1=idx1, 여기선 호스트 직접

ap = argparse.ArgumentParser()
ap.add_argument("--src", default="/data/afterlife/fifth-poc/FasterLivePortrait/gominju_source.jpg",
                help="입력 소스 이미지 (입다문)")
ap.add_argument("--out-dir", default="/data/afterlife/fifth-poc", help="출력 디렉토리")
ap.add_argument("--n", type=int, default=3, help="생성 이미지 수 (1~5)")
ap.add_argument("--guidance", type=float, default=12.0, help="guidance scale (8~15)")
ap.add_argument("--steps", type=int, default=50, help="denoising steps (30~80)")
ap.add_argument("--mask-dilation", type=int, default=20, help="마스크 팽창 px (크면 더 넓은 영역 inpaint)")
ap.add_argument("--gpu-id", type=int, default=1, help="CUDA GPU index (0=A6000-0, 1=A6000-1)")
args = ap.parse_args()

# GPU 인덱스 명시
os.environ["CUDA_VISIBLE_DEVICES"] = str(args.gpu_id)

import torch
print(f"[env] torch={torch.__version__} cuda={torch.cuda.is_available()} device_count={torch.cuda.device_count()}")
if torch.cuda.is_available():
    print(f"[env] GPU: {torch.cuda.get_device_name(0)} VRAM={torch.cuda.get_device_properties(0).total_memory//1024//1024}MB")

# ── 1. mediapipe 얼굴 랜드마크로 입 영역 마스크 생성 ──────────────────────────

def build_lip_mask(img_bgr: np.ndarray, dilation: int = 20) -> np.ndarray:
    """
    mediapipe FaceMesh (legacy solutions API or Tasks API) 로 입+턱 영역 마스크 생성.
    mediapipe 0.10.x: solutions.face_mesh가 deprecated → legacy import 시도 후 Tasks 폴백.
    반환: H×W uint8 마스크 (255=inpaint 영역)
    """
    # mediapipe 입 주변 landmark index (lips outer + inner + jaw)
    LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409,
                  291, 375, 321, 405, 314, 17, 84, 181, 91, 146]
    LIPS_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415,
                  308, 324, 318, 402, 317, 14, 87, 178, 88, 95]
    JAW_LOWER = [17, 18, 200, 199, 175, 152, 377, 400, 378, 379, 365, 397]
    all_lip_idx = list(set(LIPS_OUTER + LIPS_INNER + JAW_LOWER))

    h, w = img_bgr.shape[:2]
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    lmks = None

    # 방법 1: mediapipe Tasks API (0.10.x+)
    try:
        import mediapipe as mp
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision as mp_vision
        import urllib.request, tempfile

        # Tasks API용 모델 다운로드 (캐시)
        model_path = "/data/huggingface/face_landmarker.task"
        if not os.path.exists(model_path):
            url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
            print(f"  [mediapipe] Tasks 모델 다운로드: {url}")
            urllib.request.urlretrieve(url, model_path)
            print(f"  [mediapipe] 저장: {model_path}")

        base_opts = mp_python.BaseOptions(model_asset_path=model_path)
        opts = mp_vision.FaceLandmarkerOptions(
            base_options=base_opts,
            num_faces=1,
            min_face_detection_confidence=0.5,
        )
        detector = mp_vision.FaceLandmarker.create_from_options(opts)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        detection_result = detector.detect(mp_img)

        if detection_result.face_landmarks:
            fl = detection_result.face_landmarks[0]
            lmks_raw = fl  # NormalizedLandmark list
            pts = np.array([[int(lmks_raw[i].x * w), int(lmks_raw[i].y * h)]
                            for i in all_lip_idx if i < len(lmks_raw)], dtype=np.int32)
            print(f"  [mediapipe] Tasks API 성공, {len(pts)} pts")
        else:
            print("[WARN] mediapipe Tasks: no face detected")
    except Exception as e:
        print(f"[WARN] mediapipe Tasks API 실패: {e}")
        pts = None

    if pts is None or len(pts) < 5:
        print("  → 폴백: bbox 마스크 사용")
        return None

    mask = np.zeros((h, w), dtype=np.uint8)
    hull = cv2.convexHull(pts)
    cv2.fillPoly(mask, [hull], 255)

    # 팽창: 입 주변 여백 추가
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilation, dilation))
    mask = cv2.dilate(mask, kernel)
    return mask


def build_fallback_mask(img_bgr: np.ndarray) -> np.ndarray:
    """
    OpenCV Haar cascade 폴백 — 얼굴 bbox 하단 1/3를 입 마스크로
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(80, 80))
    h, w = img_bgr.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)
    if len(faces) == 0:
        # 최후 폴백: 이미지 하단 35%~65% 중앙 영역
        y1, y2 = int(h * 0.55), int(h * 0.75)
        x1, x2 = int(w * 0.25), int(w * 0.75)
        mask[y1:y2, x1:x2] = 255
        print("[WARN] face not detected, using center-bottom bbox mask")
    else:
        fx, fy, fw, fh = faces[0]
        # 얼굴 하단 30~70% → 입+턱 영역
        y1 = fy + int(fh * 0.50)
        y2 = fy + int(fh * 0.85)
        x1 = fx + int(fw * 0.15)
        x2 = fx + int(fw * 0.85)
        mask[y1:y2, x1:x2] = 255
        print(f"[mask] face bbox fallback: ({x1},{y1})-({x2},{y2})")
    return mask


# ── 2. 이미지 로드 + 마스크 생성 ───────────────────────────────────────────────

print(f"\n[step1] 이미지 로드: {args.src}")
assert os.path.exists(args.src), f"소스 이미지 없음: {args.src}"
img_bgr = cv2.imread(args.src)
assert img_bgr is not None
H, W = img_bgr.shape[:2]
print(f"  원본 크기: {W}×{H}")

# SD inpaint 권장 해상도 (512 or 768)
INPAINT_SIZE = 512
img_resized = cv2.resize(img_bgr, (INPAINT_SIZE, INPAINT_SIZE), interpolation=cv2.INTER_LANCZOS4)
img_pil = Image.fromarray(cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB))

print("[step2] 입 마스크 생성 (mediapipe 시도)")
mask = build_lip_mask(img_resized, dilation=args.mask_dilation)
if mask is None:
    mask = build_fallback_mask(img_resized)

mask_pil = Image.fromarray(mask)

# 마스크 저장 (디버그)
mask_save = os.path.join(args.out_dir, "gominju_sd_mask.png")
cv2.imwrite(mask_save, mask)
mask_ratio = (mask > 0).sum() / mask.size * 100
print(f"  마스크 저장: {mask_save} (커버비율={mask_ratio:.1f}%)")

# ── 3. SD Inpaint 모델 로드 ─────────────────────────────────────────────────────

print("\n[step3] SD inpaint 모델 로드")
from diffusers import StableDiffusionInpaintPipeline
import torch

MODEL_ID = "stabilityai/stable-diffusion-2-inpainting"
print(f"  모델: {MODEL_ID}")
print(f"  캐시: {os.environ['HF_HOME']}")

t0 = time.time()
pipe = StableDiffusionInpaintPipeline.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16,
    safety_checker=None,  # 한국 의료/추모 앱 — 안전필터 비활성 (얼굴 치아 생성 차단 방지)
)
pipe = pipe.to("cuda")
# 메모리 최적화
pipe.enable_attention_slicing()
print(f"  로드 완료: {time.time()-t0:.1f}s")

# ── 4. 생성 ───────────────────────────────────────────────────────────────────────

PROMPT = (
    "open mouth showing upper and lower teeth, natural slight smile, "
    "realistic face photo, high resolution, sharp focus, same person, "
    "same lighting, same skin tone"
)
NEGATIVE = (
    "closed mouth, blurry, low quality, distorted face, different person, "
    "teeth missing, cartoon, illustration, painting, extra fingers"
)

print(f"\n[step4] inpaint 생성 (n={args.n}, guidance={args.guidance}, steps={args.steps})")
print(f"  prompt: {PROMPT[:80]}...")
print(f"  negative: {NEGATIVE[:60]}...")

t1 = time.time()
results = pipe(
    prompt=PROMPT,
    negative_prompt=NEGATIVE,
    image=img_pil,
    mask_image=mask_pil,
    num_inference_steps=args.steps,
    guidance_scale=args.guidance,
    num_images_per_prompt=args.n,
    strength=0.99,  # 마스크 내부만 강하게 변형
).images
print(f"  생성 완료: {time.time()-t1:.1f}s")

# ── 5. 저장 — 원본 크기로 복원 ──────────────────────────────────────────────────

out_paths = []
for i, img_out in enumerate(results):
    # 512→원본 해상도 복원
    img_out_np = np.array(img_out)  # RGB
    img_out_full = cv2.resize(img_out_np, (W, H), interpolation=cv2.INTER_LANCZOS4)
    img_out_bgr = cv2.cvtColor(img_out_full, cv2.COLOR_RGB2BGR)

    if i == 0:
        out_path = os.path.join(args.out_dir, "gominju_sd_open.jpg")
    else:
        out_path = os.path.join(args.out_dir, f"gominju_sd_open_{i+1}.jpg")

    cv2.imwrite(out_path, img_out_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])
    out_paths.append(out_path)
    print(f"  저장: {out_path}")

print(f"\n[done] 생성 이미지: {out_paths}")
print("\n[판정 기준]")
print("  치아 생성 여부 — 위/아래 치아가 보이는가")
print("  정체성 유지 — 마스크 외부(얼굴 윤곽/피부/눈/코) 동일한가")
print("  자연스러움 — 입 주변 경계 블렌딩")
print(f"\n[라이선스] {MODEL_ID}: CreativeML OpenRAIL++-M → 상용 가능 (책임 AI 조항 준수)")
