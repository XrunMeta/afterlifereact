-- T-117: knowledge 답변 블랙리스트 (전역 단일 row).
-- owner 가 학습하기 답변 저장 시 이 리스트의 단어 하나라도 포함하면 서버가 거절.
-- knowledge_question_schema(0087) 와 동일 단일 row 패턴.
CREATE TABLE IF NOT EXISTS knowledge_blacklist (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  blacklist_json TEXT NOT NULL,
  updated_by     INTEGER,
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- 초기 seed: 빈 배열
INSERT OR IGNORE INTO knowledge_blacklist (id, blacklist_json, updated_at)
VALUES (1, '[]', unixepoch() * 1000);
