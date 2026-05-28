#!/usr/bin/env python3
"""lipsync_measure.py — muxed mp4 의 입싱크(A/V) offset 실측.

회차 029-D-3d-multi follow / systematic-debugging Phase 1 (증거 수집).
sync 가 musetalk mp4 소스에서 깨지는지(=baked-in) vs publisher demux/송출에서
깨지는지를 특정하기 위한 계측기. 이 스크립트는 **mp4 소스 자체**를 잰다.

방법:
  - audio: RMS envelope (말소리 레벨), 비디오 프레임 격자(25Hz)에 정렬
  - video: 입 ROI 의 "벌림(openness) 프록시" — ROI 내 대비(std) / 어두운픽셀비율.
    ⚠️ frame-diff(움직임)는 벌림의 미분이라 envelope(레벨)와 ~1/4 음절주기 위상편향이
       생김 → offset 측정 오염. 그래서 레벨 vs 레벨(openness vs envelope)로 상관.
  - cross-correlation(scipy) → lag(ms). parabolic 보간으로 sub-frame.
  - 부가: stream duration mismatch(audio_dur vs frames/fps) = musetalk muxing 무결성.

ROI 는 시간축 분산(std) 이미지로 자동 검출(입이 가장 많이 변함). 하드코딩 좌표 불필요.
계측기 검증: --inject-ms D 로 audio 를 D ms 지연 → 보고 lag 이 +D 로 복원되면 sign/scale OK.

부호 규약: lag_ms > 0  =>  audio 가 입 벌림보다 *나중*(소리가 입보다 늦음).
           lag_ms < 0  =>  audio 가 입 벌림보다 *먼저*(소리가 입보다 빠름).
의존: numpy, av(PyAV), scipy, ffmpeg/ffprobe. (mediapipe/librosa 불필요)
"""
import sys
import json
import argparse
import subprocess
import numpy as np

def probe(path):
    """ffprobe 로 audio/video stream duration, nb_frames, fps 추출."""
    out = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_streams", "-show_format", path],
        capture_output=True, text=True).stdout
    j = json.loads(out or "{}")
    info = dict(video_dur=None, audio_dur=None, nb_frames=None, fps=None)
    for s in j.get("streams", []):
        if s["codec_type"] == "video":
            info["video_dur"] = float(s.get("duration") or 0) or None
            num, _, den = s.get("avg_frame_rate", "0/0").partition("/")
            try:
                info["fps"] = float(num) / float(den) if float(den) else None
            except ValueError:
                info["fps"] = None
            nbf = s.get("nb_frames", "")
            info["nb_frames"] = int(nbf) if nbf.isdigit() else None
        elif s["codec_type"] == "audio":
            info["audio_dur"] = float(s.get("duration") or 0) or None
    return info

def decode_video_gray(path):
    """PyAV 로 전 프레임 grayscale 디코드 → (frames[N,H,W] float32, fps)."""
    import av
    container = av.open(path)
    vs = container.streams.video[0]
    fps = float(vs.average_rate) if vs.average_rate else 25.0
    frames = [f.to_ndarray(format="gray") for f in container.decode(video=0)]
    container.close()
    return np.stack(frames).astype(np.float32), fps

def decode_audio(path, sr=48000, inject_ms=0.0):
    """ffmpeg 로 mono s16le PCM 디코드 → float32 [-1,1]. inject_ms>0 이면 그만큼 지연."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-i", path, "-ac", "1", "-ar", str(sr),
         "-f", "s16le", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if inject_ms:
        pad = np.zeros(int(abs(inject_ms) / 1000.0 * sr), np.float32)
        a = np.concatenate([pad, a]) if inject_ms > 0 else np.concatenate([a, pad])[len(pad):]
    return a, sr

def audio_envelope_on_grid(a, sr, n_frames, fps, win_ms=40.0):
    """각 비디오 프레임 중심 ±win/2 윈도우의 RMS → 25Hz 격자 레벨 신호."""
    env = np.zeros(n_frames, np.float32)
    half = int(sr * win_ms / 1000.0 / 2)
    for i in range(n_frames):
        c = int((i + 0.5) / fps * sr)
        seg = a[max(0, c - half):min(len(a), c + half)]
        if seg.size:
            env[i] = np.sqrt(np.mean(seg * seg))
    return env

def find_mouth_roi(frames, override=None):
    """시간축 std 이미지(가우시안 평활)의 피크 = 입. 피크 중심 소박스로 ROI 한정.
    과대 ROI 는 턱/옷/머리흔들림(d18)을 섞어 입 신호를 희석 → 작게."""
    from scipy.ndimage import gaussian_filter
    H, W = frames.shape[1:]
    std = frames.std(axis=0)
    if override:
        y0, y1, x0, x1 = override
        return (y0, y1, x0, x1), std
    band = np.zeros_like(std, dtype=bool)
    # 눈/팔자주름 제외, 코끝~턱 사이 입 영역만. 분산 argmax 가 위로 끌리는 것 방지.
    band[int(0.60 * H):int(0.90 * H), int(0.32 * W):int(0.70 * W)] = True
    s = gaussian_filter(np.where(band, std, 0.0), sigma=max(2, W 
    py, px = np.unravel_index(int(np.argmax(s)), s.shape)
    hh, hw = int(0.05 * H), int(0.08 * W)            # 입 ~ 작은 박스
    y0, y1 = max(0, py - hh), min(H, py + hh)
    x0, x1 = max(0, px - hw), min(W, px + hw)
    return (int(y0), int(y1), int(x0), int(x1)), std

def mouth_signals(frames, roi):
    """입 ROI 의 벌림 프록시들 + 움직임(진단용 fallback) per-frame."""
    y0, y1, x0, x1 = roi
    roi_f = frames[:, y0:y1, x0:x1]                       # [N, h, w]
    flat = roi_f.reshape(len(roi_f), -1)
    openness_std = flat.std(axis=1)                       # 대비 = 벌림(레벨)
    # 어두운 픽셀 비율: 입 벌리면 치아 그림자/구강이 어두워짐(레벨)
    dark_thr = np.percentile(flat, 20)
    dark_frac = (flat < dark_thr).mean(axis=1).astype(np.float32)
    # 움직임(미분) — 위상편향 있어 primary 아님, 교차검증용
    motion = np.zeros(len(roi_f), np.float32)
    motion[1:] = np.abs(np.diff(roi_f, axis=0)).reshape(len(roi_f) - 1, -1).mean(axis=1)
    return dict(openness_std=openness_std, dark_frac=dark_frac, motion=motion)

def _bandpass(x, fps, lo=1.5, hi=8.0):
    """음절율 대역(1.5~8Hz)만 남겨 느린 '말하는 중' 드리프트 제거. 짧으면 detrend fallback."""
    from scipy.signal import butter, filtfilt, detrend
    ny = fps / 2.0
    hi = min(hi, ny * 0.95)
    if lo >= hi:
        return detrend(x)
    b, a = butter(3, [lo / ny, hi / ny], btype="band")
    if len(x) <= 3 * max(len(a), len(b)):
        return detrend(x)
    return filtfilt(b, a, x)

def xcorr_lag(sig, ref, fps, max_lag_ms=400.0):
    """sig(입 벌림) 와 ref(audio env) 의 cross-corr lag. band-pass 후 ±max_lag 내에서만 탐색.
    parabolic sub-frame 보간. 부호: lag_ms>0 => audio(ref) 가 입(sig) 보다 나중."""
    from scipy.signal import correlate, correlation_lags
    sig, ref = _bandpass(sig, fps), _bandpass(ref, fps)
    s = (sig - sig.mean()) / (sig.std() + 1e-9)
    r = (ref - ref.mean()) / (ref.std() + 1e-9)
    c = correlate(r, s, mode="full")                      # ref 를 sig 에 정렬
    lags = correlation_lags(len(r), len(s), mode="full")
    win = np.abs(lags) <= int(max_lag_ms / 1000.0 * fps)  # 미세 offset prior
    c, lags = c[win], lags[win]
    k = int(np.argmax(c))
    delta = 0.0
    if 0 < k < len(c) - 1:
        y0, y1, y2 = c[k - 1], c[k], c[k + 1]
        denom = y0 - 2 * y1 + y2
        if denom != 0:
            delta = 0.5 * (y0 - y2) / denom
    lag_frames = lags[k] + delta
    peak = float(c[k] / (np.linalg.norm(r) * np.linalg.norm(s) + 1e-9))
    return lag_frames / fps * 1000.0, peak

def dump_visuals(path, frames, fps, roi, std, sigs, env, outdir):
    """ROI/std 히트맵 + 시간축 신호 플롯 PNG. 눈으로 ROI·정렬 확인용."""
    import cv2
    stem = outdir.rstrip("/") + "/" + path.rsplit("/", 1)[-1][:-4]
    mid = frames[len(frames) 
    img = cv2.cvtColor(mid, cv2.COLOR_GRAY2BGR)
    y0, y1, x0, x1 = roi
    cv2.rectangle(img, (x0, y0), (x1, y1), (0, 0, 255), 3)
    sn = (std / (std.max() + 1e-9) * 255).astype(np.uint8)
    heat = cv2.applyColorMap(sn, cv2.COLORMAP_JET)
    cv2.imwrite(stem + ".roi.png", np.hstack([img, heat]))
    # 시간축 신호 (정규화) — matplotlib 있으면 사용, 없으면 cv2 라인
    def norm(x):
        return (x - x.mean()) / (x.std() + 1e-9)
    series = {"env": norm(env), **{k: norm(v) for k, v in sigs.items()}}
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        t = np.arange(len(env)) / fps
        plt.figure(figsize=(14, 5))
        for k, v in series.items():
            plt.plot(t, v, label=k, lw=1.4 if k == "env" else 1.0)
        plt.legend(); plt.xlabel("s"); plt.title(path.rsplit("/", 1)[-1])
        plt.tight_layout(); plt.savefig(stem + ".sig.png", dpi=90); plt.close()
    except Exception as e:
        print("matplotlib unavailable:", e, file=sys.stderr)

def measure(path, roi_override=None, inject_ms=0.0, dump_dir=None):
    info = probe(path)
    frames, fps = decode_video_gray(path)
    n = len(frames)
    a, sr = decode_audio(path, inject_ms=inject_ms)
    env = audio_envelope_on_grid(a, sr, n, fps)
    roi, std = find_mouth_roi(frames, roi_override)
    sigs = mouth_signals(frames, roi)
    if dump_dir is not None and std is not None:
        dump_visuals(path, frames, fps, roi, std, sigs, env, dump_dir)

    proxies = {}
    for name, sig in sigs.items():
        lag_ms, peak = xcorr_lag(sig, env, fps)
        proxies[name] = dict(lag_ms=round(lag_ms, 1), corr=round(peak, 3))

    # primary = 레벨 프록시(openness_std/dark_frac) 중 |corr| 큰 것
    level = {k: proxies[k] for k in ("openness_std", "dark_frac")}
    best = max(level, key=lambda k: abs(level[k]["corr"]))

    vid_dur = n / fps
    aud_dur = (len(a) - int(abs(inject_ms) / 1000.0 * sr)) / sr  # 주입분 제외
    mismatch_ms = round((aud_dur - vid_dur) * 1000.0, 1)

    return dict(
        file=path.rsplit("/", 1)[-1],
        n_frames=n, fps=round(fps, 3), frame_hw=list(frames.shape[1:]),
        video_dur_s=round(vid_dur, 3), audio_dur_s=round(aud_dur, 3),
        mismatch_ms=mismatch_ms, roi=list(roi),
        inject_ms=inject_ms, probe=info,
        proxies=proxies, primary=best,
        lag_ms=proxies[best]["lag_ms"], corr=proxies[best]["corr"],
        reliable=abs(proxies[best]["corr"]) >= 0.15,
        _env=env, _sigs=sigs, _fps=fps,                  # aggregate 용 raw
    )

def aggregate(results):
    """여러 chunk 의 env/openness 신호를 이어붙여 단일 cross-corr → 공통 lag(노이즈 평균).
    chunk 경계마다 NaN 갭을 안 넣고 단순 concat — band-pass 가 저주파 제거하므로 OK."""
    fps = results[0]["_fps"]
    env = np.concatenate([r["_env"] for r in results])
    out = {"n_frames": int(sum(r["n_frames"] for r in results)),
           "n_chunks": len(results), "fps": fps}
    for name in ("openness_std", "dark_frac", "motion"):
        sig = np.concatenate([r["_sigs"][name] for r in results])
        lag_ms, peak = xcorr_lag(sig, env, fps)
        out[name] = dict(lag_ms=round(lag_ms, 1), corr=round(peak, 3))
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mp4", nargs="+")
    ap.add_argument("--roi", help="y0,y1,x0,x1 강제 ROI")
    ap.add_argument("--inject-ms", type=float, default=0.0,
                    help="검증용: audio 를 N ms 지연 주입(>0). 보고 lag 이 +N 이면 OK")
    ap.add_argument("--dump", help="ROI/신호 PNG 저장 디렉토리")
    ap.add_argument("--aggregate", action="store_true",
                    help="여러 chunk 신호를 이어붙여 단일 lag(노이즈 평균)")
    args = ap.parse_args()
    roi = tuple(int(x) for x in args.roi.split(",")) if args.roi else None
    results = [measure(p, roi, args.inject_ms, args.dump) for p in args.mp4]
    agg = aggregate(results) if args.aggregate else None
    for r in results:                                    # numpy raw 제거(직렬화)
        for k in ("_env", "_sigs", "_fps"):
            r.pop(k, None)
    out = {"per_chunk": results, "aggregate": agg} if agg else results
    print(json.dumps(out, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
