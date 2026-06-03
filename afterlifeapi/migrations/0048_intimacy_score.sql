-- 친밀도 시스템 v2 — 가중치 기반 score 누적.
-- 기획서: docs/specs/2026-05-15-intimacy-system.md
--
-- 기존: intimacy = min(100, total_interactions * 2). 단순 누적.
-- 신규: intimacy = intimacy_score (가중치 + Daily Cap 15°C + per-feed Cap 4°C 적용).
--   chat   +1°C / 무제한
--   call   +15°C / 통화 20분 이상 시
--   learn  +2°C  / 20분 쿨다운
--   feed   +2°C  / 피드별 평생 캡 4°C
--
-- 백필 정책: 신규 적립부터 적용. 기존 행은 0 으로 시작 (legacy 호환 위해 컬럼만 추가).

ALTER TABLE user_clone_interactions
  ADD COLUMN intimacy_score INTEGER NOT NULL DEFAULT 0;
