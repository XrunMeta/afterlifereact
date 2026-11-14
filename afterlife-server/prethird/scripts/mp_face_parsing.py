# AFL-1096 — MuseTalk 얼굴 분할(BiSeNet face-parse-bisent, CelebAMask-HQ 비상업 학습) 대체.
# MediaPipe Face Mesh(Apache-2.0) 랜드마크로 CelebAMask 라벨 중 jaw 모드가 쓰는 것만 그린다.
#   1 = 피부(턱선 FACE_OVAL 안쪽) · 2 = 눈·눈썹(피부에서 뺌) · 10 = 코 · 12 = 입술·입안
# 라벨을 만든 뒤의 처리(raw/neck/jaw 모드, 턱 아래 확장·볼 깎기)는 원본 FaceParsing 과 같은 코드다.
import cv2
import numpy as np
from PIL import Image

from musetalk.utils.face_parsing import FaceParsing


def _idx(conn):
    return sorted({i for edge in conn for i in edge})


class MediaPipeFaceParsing(FaceParsing):
    """FaceParsing 과 같은 호출 방식(__call__(image, size, mode) → PIL L 이미지 0/255).

    chin_expand: Face Mesh 턱선은 턱 끝 랜드마크에서 멈춰 BiSeNet 피부보다 짧다(수염·만화 얼굴에서 특히).
    턱선 중 얼굴 중심보다 아래 점을 중심에서 (1 + chin_expand) 배로 밀어 아래쪽을 늘린다.
    AFL-1096 A/B(클론 25개)에서 0 이 가장 잘 맞아 기본값 0 (늘리면 일반 얼굴이 BiSeNet 보다 커진다).
    """

    MASK_TAG = "_mp"  # 마스크 캐시 파일명 꼬리표 — BiSeNet 캐시와 섞이지 않게(face_parser.mask_tag)

    def __init__(self, left_cheek_width=80, right_cheek_width=80, chin_expand=0.0):
        self.chin_expand = float(chin_expand)
        super().__init__(left_cheek_width=left_cheek_width, right_cheek_width=right_cheek_width)

    def model_init(self, *args, **kwargs):  # BiSeNet 가중치를 읽지 않는다
        import mediapipe as mp
        from mediapipe.python.solutions import face_mesh_connections as c

        self._mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True, max_num_faces=1, refine_landmarks=False, min_detection_confidence=0.3)
        self._groups = {
            "oval": _idx(c.FACEMESH_FACE_OVAL),
            "eyes": [_idx(c.FACEMESH_LEFT_EYE), _idx(c.FACEMESH_RIGHT_EYE),
                     _idx(c.FACEMESH_LEFT_EYEBROW), _idx(c.FACEMESH_RIGHT_EYEBROW)],
            "nose": _idx(c.FACEMESH_NOSE),
            "lips": _idx(c.FACEMESH_LIPS),
        }
        self.fallback_count = 0
        return None

    def image_preprocess(self):
        return None

    def _labels(self, rgb):
        h, w = rgb.shape[:2]
        res = self._mesh.process(rgb)
        if not res.multi_face_landmarks:
            return None
        pts = np.array([[p.x * w, p.y * h] for p in res.multi_face_landmarks[0].landmark], dtype=np.float32)
        lab = np.zeros((h, w), dtype=np.uint8)

        def fill(ids, value, p=pts):
            hull = cv2.convexHull(p[ids].astype(np.int32))
            cv2.fillConvexPoly(lab, hull, int(value))

        oval = pts.copy()
        if self.chin_expand:
            ids = self._groups["oval"]
            c = oval[ids].mean(axis=0)
            low = [i for i in ids if oval[i, 1] > c[1]]
            oval[low] = c + (oval[low] - c) * (1.0 + self.chin_expand)
        fill(self._groups["oval"], 1, oval)
        for g in self._groups["eyes"]:
            fill(g, 2)
        fill(self._groups["nose"], 10)
        fill(self._groups["lips"], 12)
        return lab

    def _fallback(self, h, w):
        # 얼굴을 못 찾으면 crop 아래 가운데 타원을 피부로 둔다(입 붙이기가 통째로 빠지는 것 방지)
        self.fallback_count += 1
        lab = np.zeros((h, w), dtype=np.uint8)
        cv2.ellipse(lab, (w // 2, int(h * 0.58)), (int(w * 0.30), int(h * 0.36)), 0, 0, 360, 1, -1)
        cv2.ellipse(lab, (w // 2, int(h * 0.70)), (int(w * 0.12), int(h * 0.05)), 0, 0, 360, 12, -1)
        return lab

    def __call__(self, image, size=(512, 512), mode="raw"):
        if isinstance(image, str):
            image = Image.open(image)
        image = image.convert("RGB").resize(size, Image.BILINEAR)
        rgb = np.array(image)
        parsing = self._labels(rgb)
        if parsing is None:
            parsing = self._fallback(*rgb.shape[:2])
        parsing = parsing.astype(np.int64)

        # ↓ 원본 FaceParsing.__call__ 의 모드 처리와 동일
        if mode == "neck":
            parsing[np.isin(parsing, [1, 11, 12, 13, 14])] = 255
            parsing[np.where(parsing != 255)] = 0
        elif mode == "jaw":
            face_region = np.isin(parsing, [1]) * 255
            face_region = face_region.astype(np.uint8)
            original_dilated = cv2.dilate(face_region, self.kernel, iterations=1)
            eroded = cv2.erode(original_dilated, self.cheek_kernel, iterations=2)
            face_region = cv2.bitwise_and(eroded, self.cheek_mask)
            face_region = cv2.bitwise_or(face_region, cv2.bitwise_and(original_dilated, ~self.cheek_mask))
            parsing[(face_region == 255) & (~np.isin(parsing, [10]))] = 255
            parsing[np.isin(parsing, [11, 12, 13])] = 255
            parsing[np.where(parsing != 255)] = 0
        else:
            parsing[np.isin(parsing, [1, 11, 12, 13])] = 255
            parsing[np.where(parsing != 255)] = 0
        return Image.fromarray(parsing.astype(np.uint8))
