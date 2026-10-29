"""턴별 시작 프레임 회전 — 회전된 자리와 원래 프레임 번호를 잇는다.

2026-09-17 부터 inference_lib 가 매 턴 frame·coord·latent 목록을 같은 칸(_rot)만큼 돌린다.
입 마스크 캐시(디스크 pkl)는 회전된 자리 번호(cyc_idx)로 저장·조회되고 있었다.
다음 턴은 _rot 이 달라서 다른 프레임의 마스크·crop_box 가 붙었다.
2026-10-29 실측: 고개 움직임이 큰 감정 영상에서 마스크 높이가 0 이 되어 59프레임에서 렌더가 멈췄다.
캐시는 회전과 무관한 원래 프레임 번호로 다룬다.
torch 없이 테스트할 수 있게 번호 계산만 여기 둔다.
"""

# 캐시 파일 이름에 붙인다. 옛 파일은 회전된 순서로 저장돼 있어 읽으면 안 된다.
MASK_CACHE_TAG = "rot1"


def rotate(items: list, rot: int) -> list:
    """앞의 rot 개를 뒤로 보낸다. 회전 후 i 번째 = 원래 (i + rot) % n 번째."""
    return items[rot:] + items[:rot]


def mask_cache_index(cyc_idx: int, rot: int, n: int) -> int:
    """회전된 목록의 cyc_idx 자리에 있는 프레임의 원래 번호."""
    return (cyc_idx + rot) % n
