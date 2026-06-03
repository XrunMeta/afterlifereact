-- 0056_persona_questions_v3_seed.sql
-- SP3.5 v3: 통합 채팅 위저드 — 질문 스키마를 10개로 확장.
-- (나이/성별/MBTI/성격/말투/사투리지역/사투리정도/첫만남/습관/추억)
-- 시스템 필드(name/username/relation)는 스키마 아님 — 위저드 코드가 직접 수집.
-- additive: 0055 INSERT OR IGNORE 로 id=1 row 존재. UPDATE 로 schema_json 교체.

-- clones.relation: 통합 채팅 위저드가 수집한 관계(부모/자녀/배우자 등). 기존 컬럼 없으므로 추가.
ALTER TABLE clones ADD COLUMN relation TEXT;

UPDATE persona_question_schema
SET schema_json = '[{"key":"age","type":"fixed_choice","label":"나이대가 어떻게 되세요?","options":["10대","20대","30대","40대","50대","60대 이상"]},{"key":"gender","type":"fixed_choice","label":"성별은요?","options":["남성","여성","기타"]},{"key":"mbti","type":"fixed_choice","label":"MBTI가 떠오르면 골라주세요","options":["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ","모름"]},{"key":"personality_core","type":"gemma_choice","label":"어떤 성격이셨나요?","targetField":"personality_core"},{"key":"tone","type":"gemma_choice","label":"어떤 말투로 말하셨나요?","targetField":"tone","options_include":["사투리"]},{"key":"dialect_region","type":"fixed_choice","label":"어느 지역 사투리였나요?","options":["경상도","전라도","충청도","제주","강원","서울/경기"],"showWhen":{"tone":"사투리"}},{"key":"dialect_intensity","type":"fixed_choice","label":"사투리가 어느 정도였나요?","options":["약간","보통","심함"],"showWhen":{"tone":"사투리"}},{"key":"first_meeting","type":"text","label":"처음 만난 이야기를 들려주실래요?"},{"key":"habit","type":"text","label":"자주 하던 말이나 습관이 있었나요?"},{"key":"memory","type":"text","label":"가장 선명한 추억 한 장면을 들려주세요"}]',
    updated_at = unixepoch() * 1000
WHERE id = 1;
