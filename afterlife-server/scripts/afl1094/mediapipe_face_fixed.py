# AFL-1094 — InsightFace(비상업 모델) 대체용 얼굴 검출·랜드마크.
# FasterLivePortrait 의 MediaPipeFaceModel 과 같지만, 원본은 BGR→RGB 를 두 번 변환해 MediaPipe 에 BGR 이
# 들어가는 버그가 있다(184장 A/B 에서 14장 미검출). 여기서는 RGB 로 한 번만 바꿔 넘긴다.
# MediaPipe 와 Face Mesh 모델은 Apache-2.0.
import cv2
import mediapipe as mp
import numpy as np


class MediaPipeFaceModelFixed:
    def __init__(self, **kwargs):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        )

    def predict(self, *data):
        img_bgr = data[0]
        h, w = img_bgr.shape[:2]
        results = self.face_mesh.process(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
        if not results.multi_face_landmarks:
            return []
        return [
            np.array([[p.x * w, p.y * h] for p in face.landmark])
            for face in results.multi_face_landmarks
        ]
