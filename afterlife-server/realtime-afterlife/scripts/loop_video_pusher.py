"""
회차 029-D-2c-debug: mp4 영상을 publisher 의 /push_frame 으로 loop push.
musetalk 와 동일한 흐름으로 publisher 큐가 정상 동작하는지 검증.

사용:
  python loop_video_pusher.py --video /path/to/video.mp4 --fps 25 --loop
  python loop_video_pusher.py --video /home/afterlife/afterlife-server/musetalk-afterlife/reference_videos/halbae/halbae-d18m04-25fps.mp4 --loop
"""

import argparse
import io
import logging
import sys
import time

import av
import requests
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("loop_pusher")

def push_frame(publisher: str, jpeg_bytes: bytes, width: int, height: int) -> dict:
    r = requests.post(
        f"{publisher}/push_frame",
        data=jpeg_bytes,
        headers={
            "Content-Type": "image/jpeg",
            "X-Width": str(width),
            "X-Height": str(height),
            "X-Frame-Format": "jpeg",
        },
        timeout=2.0,
    )
    r.raise_for_status()
    return r.json()

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--video", required=True, help="mp4 path")
    p.add_argument("--publisher", default="http://127.0.0.1:8400")
    p.add_argument("--fps", type=float, default=25.0)
    p.add_argument("--loop", action="store_true", help="repeat forever")
    p.add_argument("--quality", type=int, default=80, help="JPEG quality (1-100)")
    p.add_argument("--max-loops", type=int, default=0, help="0 = infinite")
    args = p.parse_args()

    period = 1.0 / args.fps
    loops = 0
    total_pushed = 0
    total_failed = 0

    while True:
        try:
            container = av.open(args.video)
        except Exception as e:
            log.error("cannot open video %s: %s", args.video, e)
            sys.exit(1)

        stream = container.streams.video[0]
        width = stream.codec_context.width
        height = stream.codec_context.height
        log.info("loop=%d video=%s %dx%d", loops + 1, args.video, width, height)

        next_t = time.time()
        loop_pushed = 0

        for frame in container.decode(stream):
            rgb = frame.to_ndarray(format="rgb24")
            pil = Image.fromarray(rgb)
            buf = io.BytesIO()
            pil.save(buf, format="JPEG", quality=args.quality)
            jpeg = buf.getvalue()

            try:
                push_frame(args.publisher, jpeg, width, height)
                loop_pushed += 1
                total_pushed += 1
            except Exception as e:
                total_failed += 1
                log.warning("push failed: %s", e)

            next_t += period
            sleep = next_t - time.time()
            if sleep > 0:
                time.sleep(sleep)
            else:
                next_t = time.time()

        container.close()
        loops += 1
        log.info(
            "loop=%d pushed=%d total_pushed=%d total_failed=%d",
            loops, loop_pushed, total_pushed, total_failed,
        )

        if not args.loop:
            break
        if args.max_loops and loops >= args.max_loops:
            break

    log.info("done — total_pushed=%d total_failed=%d", total_pushed, total_failed)

if __name__ == "__main__":
    main()
