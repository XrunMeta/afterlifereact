-- 0114_persona_questions_v5_tone_speed_dialect.sql
-- T-474: 페르소나 위저드 tone 재설계 + speech_speed 신규 + dialect_region 옵션 정리.
--
-- 변경:
--   1) tone: gemma_choice → fixed_choice ["표준말", "사투리"]
--      (기존 자유 톤은 MBTI 기본 말투 fallback 으로 커버 — T-473)
--   2) speech_speed: 신규 fixed_choice ["빠른 편","평범한 편","느린 편"]  targetField=speech_speed
--   3) dialect_region: ["경상도","전라도","충청도","제주","강원","서울/경기"]
--                     → ["경상도","전라도","충청도","강원도","제주도"]  showWhen 유지
--   4) dialect_intensity 삭제 (사용자 요청 스펙 없음)
--   5) 기존 age/gender/mbti/personality_core/first_meeting 등은 유지.
UPDATE persona_question_schema
SET
  schema_json = '[{"key":"age","type":"fixed_choice","label":"나이대가 어떻게 되세요?","options":["10대","20대","30대","40대","50대","60대 이상"]},{"key":"gender","type":"fixed_choice","label":"성별은요?","options":["남성","여성","기타"]},{"key":"mbti","type":"fixed_choice","label":"어떤 MBTI를 가지고 있나요?","options":["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"]},{"key":"personality_core","type":"gemma_choice","label":"어떤 성격이셨나요?","targetField":"personality_core","options_include":["조용한 성격","급한 성격"]},{"key":"tone","type":"fixed_choice","label":"어떤 말투를 쓰셨나요?","targetField":"tone","options":["표준말","사투리"]},{"key":"speech_speed","type":"fixed_choice","label":"말의 속도는 어땠나요?","targetField":"speech_speed","options":["빠른 편","평범한 편","느린 편"]},{"key":"dialect_region","type":"fixed_choice","label":"어느 지역 사투리였나요?","options":["경상도","전라도","충청도","강원도","제주도"],"showWhen":{"tone":"사투리"}}]',
  updated_at = unixepoch() * 1000
WHERE id = 1;
