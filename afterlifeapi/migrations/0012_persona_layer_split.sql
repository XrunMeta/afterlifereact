-- Critical 테마 (사): Field 단위 페르소나 가중치
-- clones.profile (기존 단일 JSON) → L1_profile (background/tone) + L2_profile (memory_summary/relationship) 분리
-- personaResolver.ts가 field_priority 규약(mood_overrides=L1_force 등) 적용

ALTER TABLE clones ADD COLUMN l1_profile TEXT;  -- JSON: background, tone, personality_core
ALTER TABLE clones ADD COLUMN l2_profile TEXT;  -- JSON: memory_summary, relationship, context

-- 인덱싱 불필요 (개별 clone 조회 시 함께 로드)
