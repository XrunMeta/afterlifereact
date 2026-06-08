"""
afterlife inference_lib — MuseTalk inference.py 의 main() 을 두 단계로 split.

회차 029-A: subprocess 매번 모델 로드 (30s) 제거 위해 모델 메모리 상주 + 직접 호출.

  load_models(args) -> dict   # 1회 호출 (server startup)
  run_inference(args, models) # /infer 마다 호출

inference.py 의 main() 본문을 거의 그대로 복제 (큰 reactor 안 함).
import / fast_check_ffmpeg / 모델 변수 unpack 외엔 라인 단위로 동일.
"""

import os
import cv2
import math
import copy
import torch
import glob
import shutil
import pickle
import subprocess
import time
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm
from omegaconf import OmegaConf
from transformers import WhisperModel
import sys

from musetalk.utils.blending import get_image, get_image_prepare_material, get_image_blending, get_image_blending_fast
from musetalk.utils.face_parsing import FaceParsing
from musetalk.utils.audio_processor import AudioProcessor
from musetalk.utils.utils import get_file_type, get_video_fps, datagen, load_all_model
from musetalk.utils.preprocessing import get_landmark_and_bbox, read_imgs, coord_placeholder


def fast_check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except:
        return False


@torch.no_grad()
def load_models(args):
    """모델 적재 (1회). args 는 inference.py 의 argparse Namespace 와 호환 — gpu_id, vae_type, unet_config, unet_model_path, whisper_dir, use_float16, version, left_cheek_width, right_cheek_width, ffmpeg_path 사용."""
    # Configure ffmpeg path (inference.py main L32~L40)
    if not fast_check_ffmpeg():
        print("Adding ffmpeg to PATH")
        path_separator = ';' if sys.platform == 'win32' else ':'
        os.environ["PATH"] = f"{args.ffmpeg_path}{path_separator}{os.environ['PATH']}"
        if not fast_check_ffmpeg():
            print("Warning: Unable to find ffmpeg, please ensure ffmpeg is properly installed")

    device = torch.device(f"cuda:{args.gpu_id}" if torch.cuda.is_available() else "cpu")
    # Load model weights
    vae, unet, pe = load_all_model(
        unet_model_path=args.unet_model_path, 
        vae_type=args.vae_type,
        unet_config=args.unet_config,
        device=device
    )
    timesteps = torch.tensor([0], device=device)
    
    # Convert models to half precision if float16 is enabled
    if args.use_float16:
        pe = pe.half()
        vae.vae = vae.vae.half()
        unet.model = unet.model.half()
    
    # Move models to specified device
    pe = pe.to(device)
    vae.vae = vae.vae.to(device)
    unet.model = unet.model.to(device)
        
    # Initialize audio processor and Whisper model
    audio_processor = AudioProcessor(feature_extractor_path=args.whisper_dir)
    weight_dtype = unet.model.dtype
    whisper = WhisperModel.from_pretrained(args.whisper_dir)
    whisper = whisper.to(device=device, dtype=weight_dtype).eval()
    whisper.requires_grad_(False)
    
    # Initialize face parser with configurable parameters based on version
    if args.version == "v15":
        fp = FaceParsing(
            left_cheek_width=args.left_cheek_width,
            right_cheek_width=args.right_cheek_width
        )
    else:  # v1
        fp = FaceParsing()
    return {
        "device": device,
        "vae": vae,
        "unet": unet,
        "pe": pe,
        "timesteps": timesteps,
        "audio_processor": audio_processor,
        "weight_dtype": weight_dtype,
        "whisper": whisper,
        "fp": fp,
    }


@torch.no_grad()
def run_inference(args, models, frame_callback=None, timing_out=None, batch_emit=False):
    """1회 inference (yaml 의 task list 순회). inference.py main L78~L249 본문 그대로."""
    def _emit_timing(**kv):
        # 029-monitor: timing_out dict 에 단계별 ms 채움 (server-timing-monitor). 동작 변경 없음.
        if timing_out is not None:
            for _k, _v in kv.items():
                timing_out[_k] = int(_v * 1000) if _v is not None else None
    device = models["device"]
    vae = models["vae"]
    unet = models["unet"]
    pe = models["pe"]
    timesteps = models["timesteps"]
    audio_processor = models["audio_processor"]
    weight_dtype = models["weight_dtype"]
    whisper = models["whisper"]
    fp = models["fp"]

    
    # Load inference configuration
    inference_config = OmegaConf.load(args.inference_config)
    print("Loaded inference config:", inference_config)
    
    # Process each task
    for task_id in inference_config:
        try:
            # Get task configuration
            video_path = inference_config[task_id]["video_path"]
            audio_path = inference_config[task_id]["audio_path"]
            if "result_name" in inference_config[task_id]:
                args.output_vid_name = inference_config[task_id]["result_name"]
            
            # Set bbox_shift based on version
            if args.version == "v15":
                bbox_shift = 0  # v15 uses fixed bbox_shift
            else:
                bbox_shift = inference_config[task_id].get("bbox_shift", args.bbox_shift)  # v1 uses config or default
            
            # Set output paths
            input_basename = os.path.basename(video_path).split('.')[0]
            audio_basename = os.path.basename(audio_path).split('.')[0]
            output_basename = f"{input_basename}_{audio_basename}"
            
            # Create temporary directories
            temp_dir = os.path.join(args.result_dir, f"{args.version}")
            os.makedirs(temp_dir, exist_ok=True)
            
            # Set result save paths
            result_img_save_path = os.path.join(temp_dir, output_basename)
            crop_coord_save_path = os.path.join(args.result_dir, "../", input_basename+".pkl")
            os.makedirs(result_img_save_path, exist_ok=True)
            
            # Set output video paths
            if args.output_vid_name is None:
                output_vid_name = os.path.join(temp_dir, output_basename + ".mp4")
            else:
                output_vid_name = os.path.join(temp_dir, args.output_vid_name)
            output_vid_name_concat = os.path.join(temp_dir, output_basename + "_concat.mp4")
            
            # Extract frames from source video
            if get_file_type(video_path) == "video":
                save_dir_full = os.path.join(temp_dir, input_basename)
                os.makedirs(save_dir_full, exist_ok=True)
                # 029-D-3: skip ffmpeg extract if cached png already present
                cached_pngs = sorted(glob.glob(os.path.join(save_dir_full, '*.[jpJP][pnPN]*[gG]')))
                if not cached_pngs:
                    cmd = f"ffmpeg -v fatal -i {video_path} -start_number 0 {save_dir_full}/%08d.png"
                    os.system(cmd)
                    input_img_list = sorted(glob.glob(os.path.join(save_dir_full, '*.[jpJP][pnPN]*[gG]')))
                else:
                    print(f"[029-D-3] Reusing cached frames: {len(cached_pngs)} from {save_dir_full}", flush=True)
                    input_img_list = cached_pngs
                fps = get_video_fps(video_path)
            elif get_file_type(video_path) == "image":
                input_img_list = [video_path]
                fps = args.fps
            elif os.path.isdir(video_path):
                input_img_list = glob.glob(os.path.join(video_path, '*.[jpJP][pnPN]*[gG]'))
                input_img_list = sorted(input_img_list, key=lambda x: int(os.path.splitext(os.path.basename(x))[0]))
                fps = args.fps
            else:
                raise ValueError(f"{video_path} should be a video file, an image file or a directory of images")
    
            # 029-D-3c: preprocess 단계별 timing log + vae latent disk cache.
            # Extract audio features
            _t_audio_s = time.time()
            whisper_input_features, librosa_length = audio_processor.get_audio_feature(audio_path)
            whisper_chunks = audio_processor.get_whisper_chunk(
                whisper_input_features,
                device,
                weight_dtype,
                whisper,
                librosa_length,
                fps=fps,
                audio_padding_length_left=args.audio_padding_length_left,
                audio_padding_length_right=args.audio_padding_length_right,
            )
            _t_audio = time.time() - _t_audio_s

            # Preprocess input images (landmark/bbox)
            # 029-D-3c follow1: read_imgs 다중스레드 (cv2.imread 병렬, IO 병목 해소).
            _t_coord_s = time.time()
            if os.path.exists(crop_coord_save_path) and args.use_saved_coord:
                print("Using saved coordinates")
                with open(crop_coord_save_path, 'rb') as f:
                    coord_list = pickle.load(f)
                _n = max(1, min(16, len(input_img_list)))
                with ThreadPoolExecutor(max_workers=_n) as _ex:
                    frame_list = list(_ex.map(cv2.imread, input_img_list))
            else:
                print("Extracting landmarks... time-consuming operation")
                coord_list, frame_list = get_landmark_and_bbox(input_img_list, bbox_shift)
                with open(crop_coord_save_path, 'wb') as f:
                    pickle.dump(coord_list, f)
            _t_coord = time.time() - _t_coord_s

            print(f"Number of frames: {len(frame_list)}")

            # 029-D-3c: VAE latent disk cache. input_basename + version + extra_margin
            # 같은 source 면 vae encode 결과 재사용 (cold ~5-6s → warm ~50ms 기대).
            _t_vae_s = time.time()
            latent_cache_path = os.path.join(
                args.result_dir, "..",
                input_basename + f".latents_v{args.version}_em{args.extra_margin}.pkl",
            )
            input_latent_list = None
            _latent_hit = False
            if getattr(args, "use_saved_coord", True) and os.path.exists(latent_cache_path):
                try:
                    with open(latent_cache_path, "rb") as f:
                        cached = pickle.load(f)
                    if isinstance(cached, list) and len(cached) > 0:
                        input_latent_list = [
                            (t.to(device, dtype=weight_dtype) if hasattr(t, "to") else t)
                            for t in cached
                        ]
                        _latent_hit = True
                        print(f"[029-D-3c] Reusing cached vae latents: {len(input_latent_list)} from {latent_cache_path}", flush=True)
                    else:
                        print(f"[029-D-3c] latent cache invalid — discard", flush=True)
                except Exception as _le:
                    print(f"[029-D-3c] latent cache load fail: {_le}", flush=True)
                    input_latent_list = None
            if input_latent_list is None:
                input_latent_list = []
                for bbox, frame in zip(coord_list, frame_list):
                    if bbox == coord_placeholder:
                        continue
                    x1, y1, x2, y2 = bbox
                    if args.version == "v15":
                        y2 = y2 + args.extra_margin
                        y2 = min(y2, frame.shape[0])
                    crop_frame = frame[y1:y2, x1:x2]
                    crop_frame = cv2.resize(crop_frame, (256, 256), interpolation=cv2.INTER_LANCZOS4)
                    latents = vae.get_latents_for_unet(crop_frame)
                    input_latent_list.append(latents)
                # cpu tensor 로 저장 → device 독립
                try:
                    to_save = [
                        (t.detach().cpu() if hasattr(t, "detach") else t)
                        for t in input_latent_list
                    ]
                    with open(latent_cache_path, "wb") as f:
                        pickle.dump(to_save, f)
                    print(f"[029-D-3c] latent cache saved: {len(input_latent_list)} → {latent_cache_path}", flush=True)
                except Exception as _se:
                    print(f"[029-D-3c] latent cache save fail: {_se}", flush=True)
            _t_vae = time.time() - _t_vae_s

            print(f"[029-D-3c-timing] audio={_t_audio*1000:.0f}ms coord={_t_coord*1000:.0f}ms vae={_t_vae*1000:.0f}ms hit={_latent_hit} total_preprocess={(_t_audio+_t_coord+_t_vae)*1000:.0f}ms", flush=True)
            _emit_timing(whisper=_t_audio, coord=_t_coord, vae=_t_vae)
        
            # Smooth first and last frames
            frame_list_cycle = frame_list + frame_list[::-1]
            coord_list_cycle = coord_list + coord_list[::-1]
            input_latent_list_cycle = input_latent_list + input_latent_list[::-1]
            
            # Batch inference
            print("Starting inference")
            video_num = len(whisper_chunks)
            batch_size = args.batch_size
            gen = datagen(
                whisper_chunks=whisper_chunks,
                vae_encode_latents=input_latent_list_cycle,
                batch_size=batch_size,
                delay_frame=0,
                device=device,
            )
            
            res_frame_list = []
            total = int(np.ceil(float(video_num) / batch_size))

            # 029-D-3c-latency: UNet inference loop timing
            _t_unet_s = time.time()
            for i, (whisper_batch, latent_batch) in enumerate(tqdm(gen, total=total)):
                audio_feature_batch = pe(whisper_batch)
                latent_batch = latent_batch.to(dtype=unet.model.dtype)

                pred_latents = unet.model(latent_batch, timesteps, encoder_hidden_states=audio_feature_batch).sample
                recon = vae.decode_latents(pred_latents)
                for res_frame in recon:
                    res_frame_list.append(res_frame)
            _t_unet = time.time() - _t_unet_s
            print(f"[029-D-3c-latency] unet_inference_loop={_t_unet*1000:.0f}ms frames={len(res_frame_list)} batches={total} batch_size={batch_size}", flush=True)
            _emit_timing(unet=_t_unet)
            
            # 029-D-3a: per-cycle-index face-parse mask cache.
            # padding loop 의 get_image 가 매 frame 마다 BiSeNet face parsing (~100ms) 를
            # 호출하던 부분이 진짜 병목이었다. coord_list_cycle 길이만큼만 unique 한
            # bbox/crop_box 이므로 mask_array+crop_box 를 cycle index 별로 캐시한다.
            # 같은 reference video 면 디스크 pkl 캐시 (saved_coord 와 동일 정책).
            mask_cache_path = os.path.join(args.result_dir, "../", input_basename + f".mask_{args.parsing_mode}_em{args.extra_margin}_lc{args.left_cheek_width}_rc{args.right_cheek_width}.pkl")
            mask_cache_list = None
            _mask_n_initial = 0  # 029-F-latency2: load 시점 채워진 수 — 저장 조건 판단(불필요한 241MB write 방지)
            if getattr(args, "use_saved_coord", True) and os.path.exists(mask_cache_path):
                try:
                    with open(mask_cache_path, "rb") as f:
                        mask_cache_list = pickle.load(f)
                    if not isinstance(mask_cache_list, list) or len(mask_cache_list) != len(coord_list_cycle):
                        print(f"[029-D-3a] mask cache size mismatch (cache={len(mask_cache_list) if isinstance(mask_cache_list, list) else 'N/A'} vs cycle={len(coord_list_cycle)}) — discard", flush=True)
                        mask_cache_list = None
                    else:
                        n_filled = sum(1 for m in mask_cache_list if m is not None)
                        _mask_n_initial = n_filled
                        print(f"[029-D-3a] Reusing cached masks: {n_filled}/{len(mask_cache_list)} from {mask_cache_path}", flush=True)
                except Exception as _mc_e:
                    print(f"[029-D-3a] mask cache load fail: {_mc_e}", flush=True)
                    mask_cache_list = None
            if mask_cache_list is None:
                mask_cache_list = [None] * len(coord_list_cycle)
                _mask_n_initial = 0
                print(f"[029-D-3a] mask cache cold-start, len={len(mask_cache_list)}", flush=True)

            # 029-D-3a: stream 모드에서 mp4 저장 skip (publisher 가 frame_callback 으로 push)
            skip_mp4 = bool(getattr(args, "skip_mp4_output", False))

            # Pad generated images to original video size
            # 029-D-3c-latency: padding loop timing — inner breakdown
            _t_pad_s = time.time()
            _t_copy_acc = 0.0
            _t_resize_acc = 0.0
            _t_blend_acc = 0.0
            _t_imwrite_acc = 0.0
            # 029-D-3c-latency-B2: ffmpeg PIPE rawvideo. cv2.imwrite (PNG encoding +
            # 디스크 IO) 폐기. padding loop 안에서 combine_frame.tobytes() → ffmpeg stdin.
            # img2video 별도 단계 통합됨.
            ffmpeg_proc = None
            temp_vid_path = None
            if not skip_mp4:
                _H, _W = int(frame_list_cycle[0].shape[0]), int(frame_list_cycle[0].shape[1])
                temp_vid_path = f"{temp_dir}/temp_{input_basename}_{audio_basename}.mp4"
                # 029-D-3c-latency-B3: libx264 ultrafast → h264_nvenc (GPU hardware
                # encoding). NVENC engine 은 CUDA cores 와 별개라 musetalk inference 와
                # 경합 없음. preset p4 (balanced) + cq 23 (libx264 crf 18~23 수준 quality).
                # 효과 기대: encoding 속도 ↑ → stdin_write backpressure 해소 → padding
                # loop 단축.
                ffmpeg_cmd = [
                    "ffmpeg", "-y", "-v", "warning",
                    "-f", "rawvideo",
                    "-pixel_format", "bgr24",
                    "-s", f"{_W}x{_H}",
                    "-r", str(int(fps)),
                    "-i", "-",
                    "-c:v", "h264_nvenc", "-preset", "p4",
                    "-pix_fmt", "yuv420p",
                    "-rc", "vbr", "-cq", "23",
                    temp_vid_path,
                ]
                print(f"[029-D-3c-latency-B2] ffmpeg PIPE start {_W}x{_H}@{int(fps)}fps → {temp_vid_path}", flush=True)
                ffmpeg_proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)
            # batch_emit: padding loop 중 frame_callback push 억제 → loop 후 일괄 emit
            combined_frames = []  # batch_emit=True 일 때만 채워짐
            print("Padding generated images to original video size")
            for i, res_frame in enumerate(tqdm(res_frame_list)):
                cyc_idx = i % len(coord_list_cycle)
                bbox = coord_list_cycle[cyc_idx]
                _ts = time.time()
                ori_frame = frame_list_cycle[i % (len(frame_list_cycle))].copy()
                _t_copy_acc += time.time() - _ts
                x1, y1, x2, y2 = bbox
                if args.version == "v15":
                    y2 = y2 + args.extra_margin
                    y2 = min(y2, ori_frame.shape[0])
                _ts = time.time()
                try:
                    res_frame = cv2.resize(res_frame.astype(np.uint8), (x2-x1, y2-y1))
                except:
                    continue
                _t_resize_acc += time.time() - _ts

                # Merge results with version-specific parameters
                cached_entry = mask_cache_list[cyc_idx]
                if cached_entry is None:
                    if args.version == "v15":
                        mask_array, crop_box = get_image_prepare_material(
                            ori_frame, [x1, y1, x2, y2], fp=fp, mode=args.parsing_mode
                        )
                    else:
                        mask_array, crop_box = get_image_prepare_material(
                            ori_frame, [x1, y1, x2, y2], fp=fp
                        )
                    mask_cache_list[cyc_idx] = (mask_array, crop_box)
                else:
                    mask_array, crop_box = cached_entry
                _ts = time.time()
                combine_frame = get_image_blending_fast(  # 029-latency: full PIL 왕복 제거 (sync+throughput)
                    ori_frame, res_frame, [x1, y1, x2, y2], mask_array, crop_box
                )
                _t_blend_acc += time.time() - _ts

                _ts = time.time()
                if ffmpeg_proc is not None:
                    # 029-D-3c-latency-B2: PNG/디스크 폐기 → rawvideo bgr24 stdin write
                    ffmpeg_proc.stdin.write(combine_frame.tobytes())
                _t_imwrite_acc += time.time() - _ts
                if frame_callback is not None:
                    if batch_emit:
                        # batch_emit 모드: 수집만, loop 중 push 없음. (i, frame) 튜플로 원래 인덱스 보존
                        combined_frames.append((i, combine_frame))
                    else:
                        try:
                            frame_callback(i, combine_frame)
                            # 029-D-3c-latency-stream2: GIL yield hint — worker thread 가
                            # 즉시 acquire 가능 (burst 회피, padding loop 와 동시 push).
                            time.sleep(0)
                        except Exception as _cb_e:
                            print(f"[frame_callback] err: {_cb_e}", flush=True)

            _t_pad = time.time() - _t_pad_s
            print(f"[029-D-3c-latency] padding_loop={_t_pad*1000:.0f}ms frames={len(res_frame_list)} (resize+blending+stdin.write)", flush=True)
            print(f"[029-D-3c-latency] padding_breakdown copy={_t_copy_acc*1000:.0f}ms resize={_t_resize_acc*1000:.0f}ms blend={_t_blend_acc*1000:.0f}ms stdin_write={_t_imwrite_acc*1000:.0f}ms (total inner={(_t_copy_acc+_t_resize_acc+_t_blend_acc+_t_imwrite_acc)*1000:.0f}ms)", flush=True)
            _emit_timing(padding=_t_pad)

            # batch_emit: loop 종료 후 수집된 전체 프레임 일괄 push
            # batch_emit: loop 도중 예외 시 수집분은 유실(emit 안 됨) — streaming과 달리 부분 전송 없음(의도된 trade-off)
            if frame_callback is not None and batch_emit:
                print(f"[batch_emit] flushing {len(combined_frames)} frames", flush=True)
                for orig_i, cf in combined_frames:
                    try:
                        frame_callback(orig_i, cf)
                    except Exception as _cb_e:
                        print(f"[frame_callback] err: {_cb_e}", flush=True)

            # 029-D-3c-latency-B2: ffmpeg stdin close → 인코딩 마무리 대기
            if ffmpeg_proc is not None:
                _t_enc_s = time.time()
                try:
                    ffmpeg_proc.stdin.close()
                except Exception:
                    pass
                _enc_rc = ffmpeg_proc.wait()
                _t_enc = time.time() - _t_enc_s
                print(f"[029-D-3c-latency] ffmpeg_pipe_finish={_t_enc*1000:.0f}ms rc={_enc_rc}", flush=True)

            # 029-D-3a: mask cache pkl 저장 (다음 호출 위해 — partial 도 저장)
            # 029-F-latency2: 새로 채워진 mask 가 있을 때만 저장. 전부 캐시 히트면 디스크
            # 내용이 동일하므로 241MB write 를 skip(매턴 고정비 제거). 몇 턴 뒤 자주 쓰는
            # cycle index 가 포화되면 저장이 완전히 멈춤. 정합성: 새 mask 는 여전히 저장됨.
            if getattr(args, "use_saved_coord", True):
                n_filled = sum(1 for m in mask_cache_list if m is not None)
                if n_filled > _mask_n_initial:
                    try:
                        with open(mask_cache_path, "wb") as f:
                            pickle.dump(mask_cache_list, f)
                        print(f"[029-D-3a] mask cache saved: {n_filled}/{len(mask_cache_list)} (+{n_filled - _mask_n_initial}) -> {mask_cache_path}", flush=True)
                    except Exception as _ms_e:
                        print(f"[029-D-3a] mask cache save fail: {_ms_e}", flush=True)
                else:
                    print(f"[029-D-3a] mask cache unchanged ({n_filled}/{len(mask_cache_list)}) — save skip", flush=True)

            if skip_mp4:
                # mp4 출력 생략 — publisher 가 frame_callback 으로 이미 받았다.
                print(f"[029-D-3a] skip_mp4_output=True — ffmpeg img2video / combine_audio 생략", flush=True)
                # result_img_save_path 도 비어있을 가능성 있어 정리.
                try:
                    shutil.rmtree(result_img_save_path)
                except Exception:
                    pass
            else:
                # 029-D-3c-latency-B2: img2video 단계는 padding loop 안 ffmpeg PIPE 로 통합.
                # 여기서는 audio + temp_vid_path mp4 결합만 (-c copy 로 거의 instant).
                cmd_combine_audio = f"ffmpeg -y -v warning -i {audio_path} -i {temp_vid_path} -c copy {output_vid_name}"
                print("Audio combination command:", cmd_combine_audio)
                _t_c_s = time.time()
                os.system(cmd_combine_audio)
                _t_c = time.time() - _t_c_s
                print(f"[029-D-3c-latency] ffmpeg_combine_audio={_t_c*1000:.0f}ms", flush=True)
                _emit_timing(ffmpeg=_t_c)

                # Clean up temporary files (result_img_save_path 는 B2 에선 빈 디렉토리)
                try:
                    shutil.rmtree(result_img_save_path)
                except Exception:
                    pass
                try:
                    os.remove(temp_vid_path)
                except Exception:
                    pass
            
            # 029-D-3: keep save_dir_full + pkl cache for next call
            # shutil.rmtree(save_dir_full)
            if not args.saved_coord:
                try:
                    os.remove(crop_coord_save_path)
                except OSError:
                    pass
                    
            print(f"Results saved to {output_vid_name}")
        except Exception as e:
            print("Error occurred during processing:", e)
