-- T-214 UI 검증용 SEED 정정 — 0107 은 오타 이메일(happluck) 로 no-op 였음.
-- 실제 유저 이메일: oth-user@example.invalid (user_id=9007). y 하나 있음.
INSERT OR IGNORE INTO persons (user_id, clone_id, display_name, consent_state, consent_at, created_at)
SELECT u.id, NULL, seed.display_name, 'granted', unixepoch() * 1000, unixepoch() * 1000
  FROM users u
 CROSS JOIN (
   SELECT '엄마'      AS display_name UNION ALL
   SELECT '동생'      UNION ALL
   SELECT '친구 지영' UNION ALL
   SELECT '회사동료'  UNION ALL
   SELECT '이웃'
 ) seed
 WHERE u.email = 'oth-user@example.invalid';
