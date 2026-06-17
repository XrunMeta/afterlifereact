-- 신고 처리 시 관리자가 입력한 메시지. 수락(actioned)/거절(dismissed) 모두 저장.
--   앱: 신고자는 '신고관리'에서, 대상자는 '신고당한 내역'에서 이 메시지를 확인.
ALTER TABLE user_reports ADD COLUMN admin_message TEXT;
