-- T-214 UI 검증용 임시 SEED — oth-user@example.invalid 계정에 지인 4명 등록.
--   앱 리빌드 없이(FACE_CONSENT_ENFORCED off) T-214 요약·전체보기 UI 확인 목적.
--   테스트 종료 후 별도 마이그레이션으로 삭제 예정. 실제 얼굴 embedding 은 넣지 않음
--   (persons 행만 있어도 Agreements 화면·AcquaintanceManagement 목록 렌더 확인 가능).
--
-- 멱등: 같은 (user_id, clone_id, display_name) 은 UNIQUE — INSERT OR IGNORE 로 재실행 안전.
-- clone_id 는 NULL 로 두면 앱 렌더에서 `Person #id` fallback → 그래도 이름은 display_name 우선.

INSERT OR IGNORE INTO persons (user_id, clone_id, display_name, consent_state, consent_at, created_at)
SELECT u.id, NULL, name, 'granted', unixepoch() * 1000, unixepoch() * 1000
  FROM users u
 CROSS JOIN (
   SELECT '엄마'      AS name UNION ALL
   SELECT '동생'      UNION ALL
   SELECT '친구 지영' UNION ALL
   SELECT '회사동료'  UNION ALL
   SELECT '이웃'
 ) seed
 WHERE u.email = 'oth-user@example.invalid';
