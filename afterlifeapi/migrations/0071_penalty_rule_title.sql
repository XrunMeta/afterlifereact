-- 0071: 제재 조치 프리셋에 제목(이름) 추가.
--   자동 적용을 빼고 관리자가 신고 내역/회원 상세에서 수동으로 '제재 적용' 하므로,
--   각 제재를 알아보기 쉬운 이름으로 구분. (예: "심한 욕설 - 7일 정지")
ALTER TABLE report_penalty_rules ADD COLUMN title TEXT;
