-- 0116_persona_question_drop_personality_core.sql
-- T-476: "어떤 성격이셨나요?" (personality_core) 질문 제거 — MBTI 카탈로그(T-469
-- mbti_traits.py) 가 성격 상세를 이미 반영하므로 중복 UX.
-- 스키마에서 항목만 삭제. 기존 페르소나의 저장된 personality_core 값은 유지 (프롬프트
-- 렌더 시 여전히 "## 너의 정보 - 핵심 성격: ..." 로 반영됨). 신규 페르소나는 필드
-- 없음 → MBTI 카탈로그가 대체.
UPDATE persona_question_schema
SET
  schema_json = '[{"key":"age","type":"fixed_choice","label":"나이대가 어떻게 되세요?","options":["10대","20대","30대","40대","50대","60대 이상"]},{"key":"gender","type":"fixed_choice","label":"성별은요?","options":["남성","여성","기타"],"optional":false},{"key":"mbti","type":"fixed_choice","label":"어떤 MBTI를 가지고 있나요?","options":["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"]},{"key":"tone","type":"fixed_choice","label":"어떤 말투를 쓰셨나요?","targetField":"tone","options":["표준말","사투리"]},{"key":"speech_speed","type":"fixed_choice","label":"말의 속도는 어땠나요?","targetField":"speech_speed","options":["빠른 편","평범한 편","느린 편"]},{"key":"dialect_region","type":"fixed_choice","label":"어느 지역 사투리였나요?","options":["경상도","전라도","충청도","강원도","제주도"],"showWhen":{"tone":"사투리"}}]',
  updated_at = unixepoch() * 1000
WHERE id = 1;
