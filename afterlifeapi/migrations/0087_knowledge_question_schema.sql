-- 0087_knowledge_question_schema.sql
-- T-117: 지식 수집용 질문 세트(전역 단일). persona_question_schema(0055)와 동일 단일 row 패턴.
CREATE TABLE IF NOT EXISTS knowledge_question_schema (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  schema_json TEXT NOT NULL,
  updated_by  INTEGER,
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

INSERT OR IGNORE INTO knowledge_question_schema (id, schema_json, updated_at) VALUES (
  1,
  '[{"key":"job","label":"생전 직업이나 하시던 일을 알려주세요"},{"key":"family","label":"가족 관계를 알려주세요"},{"key":"likes","label":"특별히 좋아하셨던 것이 있나요?"},{"key":"episodes","label":"기억에 남는 일화가 있나요?"}]',
  unixepoch() * 1000
);
