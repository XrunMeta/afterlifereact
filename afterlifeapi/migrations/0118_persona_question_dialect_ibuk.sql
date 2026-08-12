-- 0118_persona_question_dialect_ibuk.sql
-- T-495: dialect_region options 에 이북 지역 (평안도/함경도) 2개 추가.
-- 카탈로그(dialect_traits.py)엔 이미 자료 준비됨 (T-495).
UPDATE persona_question_schema
SET
  schema_json = '[{"key":"age","type":"fixed_choice","label":"나이대가 어떻게 되세요?","options":["10대","20대","30대","40대","50대","60대 이상"]},{"key":"gender","type":"fixed_choice","label":"성별은요?","options":["남성","여성"],"optional":false},{"key":"mbti","type":"fixed_choice","label":"어떤 MBTI를 가지고 있나요?","options":["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"]},{"key":"tone","type":"fixed_choice","label":"어떤 말투를 쓰셨나요?","targetField":"tone","options":["표준말","사투리"]},{"key":"speech_speed","type":"fixed_choice","label":"말의 속도는 어땠나요?","targetField":"speech_speed","options":["빠른 편","평범한 편","느린 편"]},{"key":"dialect_region","type":"fixed_choice","label":"어느 지역 사투리였나요?","options":["경상도","전라도","충청도","강원도","제주도","평안도","함경도"],"showWhen":{"tone":"사투리"}}]',
  updated_at = unixepoch() * 1000
WHERE id = 1;
