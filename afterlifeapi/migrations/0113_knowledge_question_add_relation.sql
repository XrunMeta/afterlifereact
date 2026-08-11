-- 0113_knowledge_question_add_relation.sql
-- T-470: 클론 생성 도우미(PersonaAssistantScreen) 의 relation 시스템 질문을 제거하고,
-- 학습(knowledge) 첫 질문으로 이동. 기존 4문항 앞에 relation 을 삽입한다.
-- 0087 seed 는 INSERT OR IGNORE 라 이미 배포된 DB 에는 반영되지 않으므로 UPDATE 로 덮는다.
UPDATE knowledge_question_schema
SET
  schema_json = '[{"key":"relation","label":"저와의 관계를 알려주세요 (예: 아빠, 친구, 스승님)"},{"key":"job","label":"생전 직업이나 하시던 일을 알려주세요"},{"key":"family","label":"가족 관계를 알려주세요"},{"key":"likes","label":"특별히 좋아하셨던 것이 있나요?"},{"key":"episodes","label":"기억에 남는 일화가 있나요?"}]',
  updated_at = unixepoch() * 1000
WHERE id = 1;
