-- 0126_face_landmark_ratios.sql
-- T-583: 얼굴 embedding 만으로 자매 등 유사 얼굴 분리 실패 → landmark 기반 구조 비율(눈-코, 눈-입, 코-턱 등)을
--   함께 저장하고 매칭 시 embedding cosine + landmark 유사도를 조합 판정한다.
-- landmark_ratios 는 JSON string. 형식: {"eyeToFaceWidth":0.35, "noseBelowEyes":0.72, ...}
-- 정규화 기준: 눈 사이 거리(=1.0). 얼굴 크기·거리 무관한 형태만 남는다.
-- 기존 행은 NULL 로 남고, RN 이 매칭 시 NULL 이면 landmark 조합 스킵(embedding cosine 단독 fallback).
--
-- ⚠️ 반드시 `wrangler d1 migrations apply` 로만 적용. `wrangler d1 execute --file` 금지.

ALTER TABLE clone_person_faces ADD COLUMN landmark_ratios TEXT;
