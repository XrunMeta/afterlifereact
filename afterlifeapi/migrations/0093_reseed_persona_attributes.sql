-- 0093: persona_attributes 재시드 (0044/0092 의 DROP TABLE clones 로 CASCADE 삭제된 것 복구).
--
-- 배경:
--   0025 와 0052 가 persona_attributes 에 L1 EAV 를 채웠으나, 그 이후 0044/0092 가
--   clones 를 `DROP TABLE clones` 로 재생성했다. persona_attributes.clone_id 는
--   `REFERENCES clones(id) ON DELETE CASCADE` 이므로 DROP 시 CASCADE 로 전량 삭제됐다.
--   clones 데이터는 clones_new 로 복사됐지만 persona_attributes 는 사라진 채로 유지.
--   (PRAGMA foreign_keys=OFF 는 트랜잭션 내부에서 무효.)
--
--   결과: `SELECT COUNT(*) FROM persona_attributes` = 0.
--   test/systemPersona.test.ts 가 이 상태를 감지 → 며칠간 CI 실패 → preview 배포 blocked.
--
-- 이 마이그레이션:
--   (A) 0025 로직 재실행 — l1_profile.attrs JSON 있는 클론 대상 재시드.
--   (B) halbae 는 flat l1_profile. 0053 최신값에서 personality_core/tone/speech_patterns
--       3개를 EAV 로 미러 (0052 R-1).
--   둘 다 `INSERT OR IGNORE` — 이미 있으면 skip. 멱등.

-- (A) l1_profile.attrs JSON 이 있는 클론 → 0025 로직 재실행.
INSERT OR IGNORE INTO persona_attributes (clone_id, level, key, value)
SELECT
  c.id, 'l1', je.key, CAST(je.value AS TEXT)
FROM clones c, json_each(json_extract(c.l1_profile, '$.attrs')) je
WHERE c.l1_profile IS NOT NULL
  AND json_valid(c.l1_profile)
  AND json_extract(c.l1_profile, '$.attrs') IS NOT NULL;

-- (B) halbae — flat l1_profile 3개 필드를 개별 INSERT 로 EAV 미러.
INSERT OR IGNORE INTO persona_attributes (clone_id, level, key, value)
SELECT c.id, 'l1', 'personality_core', json_extract(c.l1_profile, '$.personality_core')
FROM clones c
WHERE c.username = 'halbae'
  AND json_extract(c.l1_profile, '$.personality_core') IS NOT NULL;

INSERT OR IGNORE INTO persona_attributes (clone_id, level, key, value)
SELECT c.id, 'l1', 'tone', json_extract(c.l1_profile, '$.tone')
FROM clones c
WHERE c.username = 'halbae'
  AND json_extract(c.l1_profile, '$.tone') IS NOT NULL;

INSERT OR IGNORE INTO persona_attributes (clone_id, level, key, value)
SELECT c.id, 'l1', 'speech_patterns', json_extract(c.l1_profile, '$.speech_patterns')
FROM clones c
WHERE c.username = 'halbae'
  AND json_extract(c.l1_profile, '$.speech_patterns') IS NOT NULL;
