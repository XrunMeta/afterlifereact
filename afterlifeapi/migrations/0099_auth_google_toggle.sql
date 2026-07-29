-- 0099: 구글 로그인 플랫폼별 원격 토글 (T-175).
--   "1" = 켬, 그 외 모든 값 = 끔. 값 변경 = UPDATE (재배포 불필요).
--   iOS 기본 '0'(꺼짐):
--     - App Store Guideline 4.8(Sign in with Apple) 노출 회피
--     - iOS 시뮬레이터에 GoogleService-Info.plist 부재
--     - 기본이 꺼짐이어야 켜는 행위가 항상 명시적 확인을 거친다
--   Android 기본 '1'(켬) — 현행 유지.
INSERT OR IGNORE INTO app_config (key, value) VALUES
  ('auth.google_enabled_ios', '0'),
  ('auth.google_enabled_android', '1');
