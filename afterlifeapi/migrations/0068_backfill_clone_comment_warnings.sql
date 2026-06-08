-- 0068: 기존 수락(reviewed/actioned) 댓글·페르소나 신고에 대한 경고 backfill.
--   이전 코드는 user_reports 수락 시에만 user_warnings 를 만들었고, 댓글/페르소나
--   신고 수락 시에는 경고를 만들지 않아 작성자/소유자 '받은 경고 N회'가 0으로 남음.
--   누락된 경고만 채움 (정지 suspended_until 은 소급 적용하지 않음 — 향후 수락분만 적용).

-- 댓글 신고 → 댓글 작성자에게 경고.
INSERT INTO user_warnings (user_id, admin_id, report_id, report_type, reason)
SELECT fc.user_id, 0, cmr.id, 'comment', cmr.admin_message
  FROM comment_reports cmr
  JOIN feed_comments fc ON fc.id = cmr.comment_id
 WHERE cmr.status IN ('reviewed', 'actioned')
   AND NOT EXISTS (
     SELECT 1 FROM user_warnings w
      WHERE w.report_id = cmr.id AND w.report_type = 'comment'
   );

-- 페르소나 신고 → 페르소나 소유자에게 경고.
INSERT INTO user_warnings (user_id, admin_id, report_id, report_type, reason)
SELECT cl.owner_id, 0, cr.id, 'clone', cr.admin_message
  FROM clone_reports cr
  JOIN clones cl ON cl.id = cr.clone_id
 WHERE cr.status IN ('reviewed', 'actioned')
   AND NOT EXISTS (
     SELECT 1 FROM user_warnings w
      WHERE w.report_id = cr.id AND w.report_type = 'clone'
   );
