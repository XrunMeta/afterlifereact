-- 0058_persona_mbti_label.sql
-- SP3.5 v3 UX: MBTI 질문 라벨 문구 수정.
-- "MBTI가 떠오르면 골라주세요" → "어떤 MBTI를 가지고 있나요?"
UPDATE persona_question_schema
SET schema_json = REPLACE(schema_json, 'MBTI가 떠오르면 골라주세요', '어떤 MBTI를 가지고 있나요?'),
    updated_at = unixepoch() * 1000
WHERE id = 1;
