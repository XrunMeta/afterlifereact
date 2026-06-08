-- 회원 탈퇴(DELETE /oth-path) 시 소유 클론을 함께 soft-delete 하기 위한 cascade 표식.
--   owner_cascade_deleted_at: 유저 탈퇴로 인해 자동 soft-delete 된 클론에만 기록.
--   복구(/oth-path, /me/restore) 시 '탈퇴로 내려간' 클론만 정확히 되살리기 위함 —
--   사용자가 탈퇴 전에 직접 지운 클론(이 컬럼 NULL)은 부활 대상에서 제외.
--   NULL = 자기 자신이 직접 삭제했거나 애초에 active. NOT NULL = 탈퇴 cascade 로 삭제됨.
ALTER TABLE clones ADD COLUMN owner_cascade_deleted_at TIMESTAMP;

CREATE INDEX idx_clones_owner_cascade
  ON clones(owner_id, owner_cascade_deleted_at)
  WHERE owner_cascade_deleted_at IS NOT NULL;
