-- messages_no_hard_delete 트리거를 재설치하여 deletion_state='archived_cold'인 row의 DELETE만 허용.
-- Slice 4 hard_delete cron이 archived_cold 메시지를 실제로 DELETE할 수 있도록 예외 처리.

DROP TRIGGER IF EXISTS trg_messages_no_hard_delete;

CREATE TRIGGER trg_messages_no_hard_delete
BEFORE DELETE ON messages
WHEN OLD.deletion_state != 'archived_cold'
BEGIN
  SELECT RAISE(ABORT, 'messages uses soft purge; use UPDATE SET status=purged, content=NULL instead.');
END;
