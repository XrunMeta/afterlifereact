-- l1_profile.attrs JSON 이 채워진 clones 에 대해 persona_attributes(L1) 행을 생성.
-- idempotent: 이미 존재하는 (clone_id, level, key) 는 skip.
INSERT INTO persona_attributes (clone_id, level, key, value)
SELECT
  c.id, 'l1', je.key, CAST(je.value AS TEXT)
FROM clones c, json_each(json_extract(c.l1_profile, '$.attrs')) je
WHERE c.l1_profile IS NOT NULL
  AND json_valid(c.l1_profile)
  AND json_extract(c.l1_profile, '$.attrs') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM persona_attributes pa
    WHERE pa.clone_id = c.id AND pa.level = 'l1' AND pa.key = je.key
  );
