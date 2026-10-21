"""unet 배치 크기 버킷 — cudnn 자동튜닝을 응답마다 다시 하지 않게 입력 크기를 고정한다.

2026-10-21 실측: musetalk 의 face_detection 이 프로세스 시작 시 `cudnn.benchmark=True` 를
켠다(musetalk/utils/preprocessing.py 모듈 전역 FaceAlignment). 배치 64 로 묶으면 마지막
배치 크기가 응답마다 달라(frames % 64) 처음 보는 크기마다 자동튜닝이 걸린다 →
재시작 이후 unet 이 프레임당 55~62ms(이미 본 크기는 15ms). 98프레임 렌더 10.4초.

마지막 배치를 bucket 배수로 올려 패딩하면 크기가 batch_size/bucket 가지로 고정되고,
프로세스 첫 렌더에서 한 번씩 튜닝해 두면 이후로는 다시 튜닝하지 않는다.
torch 없이 테스트할 수 있게 크기 계산만 여기 둔다.
"""
import os

# 0 이면 끔(기존 동작). 롤백은 env 로.
PAD_BUCKET = int(os.environ.get("MUSETALK_PAD_BUCKET", "16"))

def bucket_size(n: int, batch_size: int, bucket: int = PAD_BUCKET) -> int:
    """n 프레임 배치를 몇 프레임으로 패딩할지. bucket<=0 이면 n 그대로."""
    if bucket <= 0 or n <= 0:
        return n
    return min(batch_size, -(-n 

def bucket_sizes(batch_size: int, bucket: int = PAD_BUCKET) -> list[int]:
    """나올 수 있는 배치 크기 전부(미리 튜닝할 목록). bucket<=0 이면 빈 목록."""
    if bucket <= 0:
        return []
    sizes = list(range(bucket, batch_size, bucket))
    return sizes + [batch_size]
