-- 0117_persona_question_gender_no_other.sql
-- T-477: gender options 에서 "기타" 자체를 제거 → ["남성","여성"] 2택.
-- T-475(0115) 에서 "기타" 있는 상태로 optional:false 만 붙였는데 사용자 실제 요청은
-- "기타" 옵션 자체를 지우는 것이었음. optional:false 는 유지 (skip 없음).
UPDATE persona_question_schema
SET
  schema_json = '[{"key":"age","type":"fixed_choice","label":"나이대가 어떻게 되세요?","options":["10대","20대","30대","40대","50대","60대 이상"]},{"key":"gender","type":"fixed_choice","label":"성별은요?","options":["남성","여성"],"optional":false},{"key":"mbti","type":"fixed_choice","label":"어떤 MBTI를 가지고 있나요?","options":["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"]},{"key":"tone","type":"fixed_choice","label":"어떤 말투를 쓰셨나요?","targetField":"tone","options":["표준말","사투리"]},{"key":"speech_speed","type":"fixed_choice","label":"말의 속도는 어땠나요?","targetField":"speech_speed","options":["빠른 편","평범한 편","느린 편"]},{"key":"dialect_region","type":"fixed_choice","label":"어느 지역 사투리였나요?","options":["경상도","전라도","충청도","강원도","제주도"],"showWhen":{"tone":"사투리"}}]',
  updated_at = unixepoch() * 1000
WHERE id = 1;
