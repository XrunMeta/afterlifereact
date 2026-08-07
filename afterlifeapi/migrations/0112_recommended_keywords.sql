-- T-418 (2026-08-07): 검색 화면 상단 추천 키워드 (관리자에서 무제한 등록, 앱에서 가로 플리킹).
--   앱: GET /oth-path → order 오름차순 정렬. 탭 시 키워드로 검색.
--   어드민: POST/PATCH/DELETE /oth-path — 등록 / 수정 / 삭제 / 순서 변경.

CREATE TABLE IF NOT EXISTS recommended_keywords (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword     TEXT NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_recommended_keywords_order ON recommended_keywords(sort_order, id);

-- 초기 seed (스크린샷 참고).
INSERT OR IGNORE INTO recommended_keywords (keyword, sort_order) VALUES
  ('추모', 10),
  ('변호사', 20),
  ('연예인', 30),
  ('아나운서', 40),
  ('경찰관', 50),
  ('정보보안', 60);
