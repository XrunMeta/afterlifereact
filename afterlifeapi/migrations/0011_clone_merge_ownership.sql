-- Critical 테마 (사) + (라): 멤로우 병합 — 새 clone_id v1 + 원본 archived_merged 아카이브
-- clones: ownership_state 상태머신 + parent_clone_ids 역참조 + merge_source_archived_at
-- clone_merge_optout_responses: 양측 공유자 7일 Opt-out 응답 로그

ALTER TABLE clones ADD COLUMN ownership_state TEXT NOT NULL DEFAULT 'active'
  CHECK (ownership_state IN ('active','archived_merged','pending_reclaim'));

ALTER TABLE clones ADD COLUMN parent_clone_ids TEXT;  -- JSON array, 병합 결과 clone만 값 존재
ALTER TABLE clones ADD COLUMN merge_source_archived_at TIMESTAMP;

CREATE INDEX idx_clones_ownership_state ON clones(ownership_state, owner_id);

-- 병합 Opt-out 응답 로그 (Critical 테마 라)
CREATE TABLE clone_merge_optout_responses (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  merge_request_id   TEXT NOT NULL,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_clone_id    INTEGER NOT NULL REFERENCES clones(id) ON DELETE RESTRICT,
  decision           TEXT NOT NULL CHECK (decision IN ('agree','decline','timeout')),
  responded_at       TIMESTAMP,
  deadline_at        TIMESTAMP NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(merge_request_id, user_id, source_clone_id)
);

CREATE INDEX idx_merge_optout_request ON clone_merge_optout_responses(merge_request_id);
CREATE INDEX idx_merge_optout_deadline ON clone_merge_optout_responses(deadline_at) WHERE responded_at IS NULL;
