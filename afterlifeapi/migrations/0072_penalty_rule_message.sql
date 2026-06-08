-- 0072: 제재 조치 프리셋에 '사용자 안내 문구' 추가.
--   관리자가 이 제재를 적용할 때 사용자에게 알림으로 띄울 기본 문구.
--   (예: 경고만 → "커뮤니티 규칙 위반으로 경고가 발급되었습니다.")
ALTER TABLE report_penalty_rules ADD COLUMN message TEXT;
