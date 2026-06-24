-- 0078_persona_questions_v4_tone_personality.sql
-- 페르소나 질문 스키마 v4 (persona_question_schema id=1, schema_json 단일출처).
-- 변경:
--   1) personality_core("어떤 성격이셨나요?") gemma_choice 에 options_include 추가:
--      ["조용한 성격","급한 성격"] — 항상 노출되는 고정 후보.
--   2) tone("어떤 말투로 말하셨나요?") options_include 에 "평범한 말투" 추가:
--      기존 ["사투리"] → ["사투리","평범한 말투"].
--   3) first_meeting / habit / memory (text 3개) 질문 제거.
-- 남는 질문(7): age, gender, mbti, personality_core, tone, dialect_region, dialect_intensity.
-- schema_json 전체 교체 — 0056~0058(mbti "모름" 제거 + 라벨) 누적분을 반영한 최종형.
-- idempotent: SET 전체 덮어쓰기라 반복 실행해도 동일 결과.

UPDATE persona_question_schema
SET schema_json = '[{"key":"age","type":"fixed_choice","label":"나이대가 어떻게 되세요?","options":["10대","20대","30대","40대","50대","60대 이상"]},{"key":"gender","type":"fixed_choice","label":"성별은요?","options":["남성","여성","기타"]},{"key":"mbti","type":"fixed_choice","label":"어떤 MBTI를 가지고 있나요?","options":["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"]},{"key":"personality_core","type":"gemma_choice","label":"어떤 성격이셨나요?","targetField":"personality_core","options_include":["조용한 성격","급한 성격"]},{"key":"tone","type":"gemma_choice","label":"어떤 말투로 말하셨나요?","targetField":"tone","options_include":["사투리","평범한 말투"]},{"key":"dialect_region","type":"fixed_choice","label":"어느 지역 사투리였나요?","options":["경상도","전라도","충청도","제주","강원","서울/경기"],"showWhen":{"tone":"사투리"}},{"key":"dialect_intensity","type":"fixed_choice","label":"사투리가 어느 정도였나요?","options":["약간","보통","심함"],"showWhen":{"tone":"사투리"}}]',
    updated_at = unixepoch() * 1000
WHERE id = 1;
