-- 0100: 구글 로그인 플랫폼별 원격 토글 (T-175).
--   (0099 는 T-167 Task 21.5 가 선점 예정이라 양보함)
--   "1" = 켬, 그 외 모든 값 = 끔. 값 변경 = UPDATE (재배포 불필요).
--
--   iOS/Android 모두 기본 '1'(켬) — 현행 동작 유지.
--   당초 iOS 는 '0'(꺼짐)으로 계획했다. App Store Guideline 4.8(제3자 소셜
--   로그인 제공 시 Apple 로그인 병행 필수)을 Apple 로그인 없이 회피하려는
--   목적이었다. 그러나 PR #545 로 Apple Sign-In 이, PR #544 로 iOS 구글
--   OAuth 클라이언트(GoogleService-Info.plist + iosClientId)가 각각 들어오면서
--   두 전제가 모두 사라졌다 — 4.8 은 Apple 로그인으로 충족되고, iOS 에서
--   구글 로그인이 실제로 동작한다. 따라서 끌 이유가 없어 '1' 로 확정한다.
--   (히즈키 결정, 2026-07-29)
--
--   이 토글의 목적은 이제 "심사 회피"가 아니라 **운영 중 원격 제어**다.
--   인증 장애·정책 변경 시 앱 재배포 없이 D1 UPDATE 로 끌 수 있다.
INSERT OR IGNORE INTO app_config (key, value) VALUES
  ('auth.google_enabled_ios', '1'),
  ('auth.google_enabled_android', '1');
