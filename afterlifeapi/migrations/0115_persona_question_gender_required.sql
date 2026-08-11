-- 0115_persona_question_gender_required.sql
-- T-475: gender 질문에 optional=false 추가 → 건너뛰기 버튼 제거.
-- 사유: gender 옵션에 이미 "기타" 가 있어 스킵 버튼과 UX 중복. 사용자 혼란.
-- (앱 로직: PersonaAssistantScreen: `q.type === 'fixed_choice' && q.optional !== false` → skip 붙임.)
-- 0114 v5 JSON 그대로 유지하고 gender 항목에만 "optional":false 추가.
UPDATE persona_question_schema
SET
  schema_json = '[{"key":"age","type":"fixed_choice","label":"나이대가 어떻게 되세요?","options":["10대","20대","30대","40대","50대","60대 이상"]},{"key":"gender","type":"fixed_choice","label":"성별은요?","options":["남성","여성","기타"],"optional":false},{"key":"mbti","type":"fixed_choice","label":"어떤 MBTI를 가지고 있나요?","options":["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"]},{"key":"personality_core","type":"gemma_choice","label":"어떤 성격이셨나요?","targetField":"personality_core","options_include":["조용한 성격","급한 성격"]},{"key":"tone","type":"fixed_choice","label":"어떤 말투를 쓰셨나요?","targetField":"tone","options":["표준말","사투리"]},{"key":"speech_speed","type":"fixed_choice","label":"말의 속도는 어땠나요?","targetField":"speech_speed","options":["빠른 편","평범한 편","느린 편"]},{"key":"dialect_region","type":"fixed_choice","label":"어느 지역 사투리였나요?","options":["경상도","전라도","충청도","강원도","제주도"],"showWhen":{"tone":"사투리"}}]',
  updated_at = unixepoch() * 1000
WHERE id = 1;
