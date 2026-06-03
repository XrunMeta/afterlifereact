-- 0045: feed_comments.parent_comment_id — 1depth 답글(reply) 지원.
--
-- 정책: 최대 1 depth — 답글의 답글은 평면화 (parent_comment_id 는 항상 최상위
-- 부모를 가리키게 함, 클라가 평면 리스트로 렌더). 인스타와 동일 UX.
--
-- API:
--   POST /oth-path
--     body.parentCommentId? — 있으면 답글, 없으면 부모 댓글.
--   GET /oth-path
--     parent_comment_id IS NULL 만 반환. 각 행에 repliesCount 포함.
--   GET /oth-path
--     해당 부모의 답글 리스트.

ALTER TABLE feed_comments ADD COLUMN parent_comment_id INTEGER
  REFERENCES feed_comments(id) ON DELETE CASCADE;

CREATE INDEX idx_feed_comments_parent ON feed_comments(parent_comment_id, id);
