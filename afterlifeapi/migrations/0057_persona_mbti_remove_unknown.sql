-- 0057_persona_mbti_remove_unknown.sql
-- SP3.5 v3 UX: MBTI 질문 options에서 "모름" 제거.
-- "모름"은 '건너뛰기'(fixed_choice 자동 추가 버튼)와 의미 중복 → 건너뛰기로 통일.
-- schema_json 내 "모름"은 mbti options 끝에만 존재(다른 질문엔 없음) → ,"모름" 토큰만 제거.
UPDATE persona_question_schema
SET schema_json = REPLACE(schema_json, ',"모름"', ''),
    updated_at = unixepoch() * 1000
WHERE id = 1;
