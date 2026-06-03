-- 0055_persona_question_schema.sql
-- SP3.5: 페르소나 생성 도우미 질문 스키마(전역 단일). 관리자가 admin에서 편집.
-- system_persona(0051)와 동일한 단일 row 패턴.
CREATE TABLE IF NOT EXISTS persona_question_schema (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  schema_json TEXT NOT NULL,
  updated_by  INTEGER,
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

INSERT OR IGNORE INTO persona_question_schema (id, schema_json, updated_at) VALUES (
  1,
  '[{"key":"personality_core","type":"gemma_choice","label":"어떤 성격이셨나요?","targetField":"personality_core"},{"key":"tone","type":"gemma_choice","label":"어떤 말투로 말하셨나요?","targetField":"tone","options_include":["사투리"]},{"key":"dialect_region","type":"fixed_choice","label":"어느 지역 사투리였나요?","options":["경상도","전라도","충청도","제주","강원","서울/경기"],"showWhen":{"tone":"사투리"}},{"key":"dialect_intensity","type":"fixed_choice","label":"사투리가 어느 정도였나요?","options":["약간","보통","심함"],"showWhen":{"tone":"사투리"}}]',
  unixepoch() * 1000
);
