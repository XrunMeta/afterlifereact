-- 0110_purge_legacy_face_data.sql
-- T-257: 레거시 얼굴 데이터 전량 삭제 후 새 구조로 재시작.
--
-- 배경(prod 실측 2026-08-05): persons 29건 중 24건(83%)이 clone_id IS NULL 이다.
-- 실제 얼굴이 붙는 등록 경로 두 곳(useFaceEnroll.enroll / enrollSilent)이 cloneId 를
-- 넘기지 않았기 때문이며, 반대로 clone_id 가 있는 5건은 동의 카드 산물이라 임베딩이 없다.
-- 즉 "정리" = 얼굴 인식 데이터 전량 초기화다. 출시 이전 테스트 데이터라 실질 손실이 없고,
-- 백필·부분 보존 설계가 전부 불필요해진다(설계 §8.3).
--
-- ⚠️ 선행 조건: scripts/t257_purge_vectorize.md 의 Vectorize 삭제를 **먼저** 수행할 것.
--    이 파일을 먼저 적용하면 vectorize_id 를 잃어 고아 벡터를 특정할 수 없다.
--
-- !! 반드시 `wrangler d1 migrations apply` 로만 적용할 것.
-- !! 멱등 — 재실행해도 안전하다(대상이 없으면 no-op).

-- 1) 얼굴 벡터 장부
DELETE FROM face_embeddings;
DELETE FROM clone_person_faces;

-- 2) L2′ — person 이 사라지므로 함께 파기. FK CASCADE 와 이중화(명시적 선행 삭제).
DELETE FROM clone_ont_person;

-- 3) 통화 기록의 화자 참조 해제(통화 기록 자체는 보존)
UPDATE call_turns SET speaker_person_id = NULL WHERE speaker_person_id IS NOT NULL;

-- 4) self 표식 해제 — 참조하던 person 이 사라진다
UPDATE clones SET self_person_id = NULL WHERE self_person_id IS NOT NULL;

-- 5) person 전량 삭제.
--    persons_consent_log 는 GDPR Art.7 append-only 감사증적이라 보존한다(0083 규약 승계).
DELETE FROM persons;
