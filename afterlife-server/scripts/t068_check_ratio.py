"""close_ratio 의미 확인: 입다문 vs 입벌린"""
import sys, os
os.chdir("/root/FasterLivePortrait")
sys.path.insert(0, "/root/FasterLivePortrait")
from src.utils.utils import calc_lip_close_ratio
from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline
from omegaconf import OmegaConf

cfg = OmegaConf.load("configs/trt_infer.yaml")
pipe = FasterLivePortraitPipeline(cfg=cfg)

# 입다문 source
pipe.prepare_source("gominju_source.jpg", realtime=True)
info = pipe.src_infos[0][0]
lmk = info[1]
ratio_closed = float(calc_lip_close_ratio(lmk[None])[0, 0])
print(f"gominju_source.jpg (입다문): lip_close_ratio={ratio_closed:.4f}")

# rank1 입벌림
pipe.prepare_source("gominju_open_rank1_f42.jpg", realtime=True)
info2 = pipe.src_infos[0][0]
lmk2 = info2[1]
ratio_open = float(calc_lip_close_ratio(lmk2[None])[0, 0])
print(f"gominju_open_rank1_f42.jpg (입벌림): lip_close_ratio={ratio_open:.4f}")

print(f"\n결론: close_ratio가 {'크면' if ratio_open > ratio_closed else '작으면'} 입이 열린 것")
print(f"  입다문={ratio_closed:.4f}, 입벌린={ratio_open:.4f}")

# 기존 source_open.jpg도 확인
pipe.prepare_source("gominju_source_open.jpg", realtime=True)
info3 = pipe.src_infos[0][0]
lmk3 = info3[1]
ratio_existing = float(calc_lip_close_ratio(lmk3[None])[0, 0])
print(f"gominju_source_open.jpg (기존 작업): lip_close_ratio={ratio_existing:.4f}")
