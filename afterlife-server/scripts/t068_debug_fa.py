"""FA predict 반환값 확인"""
import sys, os
os.chdir("/root/FasterLivePortrait")
sys.path.insert(0, "/root/FasterLivePortrait")
import cv2
from omegaconf import OmegaConf
from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline

cfg = OmegaConf.load("configs/trt_infer.yaml")
pipe = FasterLivePortraitPipeline(cfg=cfg)
fa = pipe.model_dict["face_analysis"]
lm = pipe.model_dict["landmark"]

cap = cv2.VideoCapture("/root/FasterLivePortrait/gominju-d18m04-25fps.mp4")
ret, frame = cap.read()
cap.release()

print(f"frame shape: {frame.shape if frame is not None else None}")
print(f"frame dtype: {frame.dtype if frame is not None else None}")

res = fa.predict(frame)
print(f"fa.predict result type: {type(res)}")
print(f"fa.predict result len: {len(res) if res is not None else None}")
if res and len(res) > 0:
    print(f"first face type: {type(res[0])}")
    if hasattr(res[0], '__dict__'):
        print(f"first face attrs: {list(res[0].__dict__.keys())}")
    elif hasattr(res[0], 'kps'):
        print(f"kps shape: {res[0].kps.shape}")
else:
    print("NO FACES DETECTED by fa.predict")
    # 직접 landmark 모델 사용 시도
    print("Trying landmark model directly with full frame...")
    # landmark model: predict(img_rgb, lmk_init) 시그니처
    # lmk_init 없이는 호출 불가 → prepare_source 방식 써야함

# prepare_source 방식으로 재시도
print("\n--- prepare_source approach ---")
ok = pipe.prepare_source("/root/FasterLivePortrait/gominju-d18m04-25fps.mp4", realtime=True)
print(f"prepare_source ok={ok}")
print(f"src_imgs len: {len(pipe.src_imgs)}")
print(f"src_infos len: {len(pipe.src_infos)}")
if pipe.src_infos:
    info0 = pipe.src_infos[0]
    print(f"src_infos[0] type: {type(info0)}, len: {len(info0)}")
    if info0:
        print(f"src_infos[0][0] type: {type(info0[0])}, len: {len(info0[0])}")
        if len(info0[0]) > 1:
            lmk = info0[0][1]
            print(f"lmk type: {type(lmk)}, shape: {lmk.shape if hasattr(lmk,'shape') else 'no shape'}")
