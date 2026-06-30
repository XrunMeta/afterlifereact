-- 에프터라이프 이용약관 — type × language 매트릭스.
--   type: 1=서비스 약관, 2=개인정보 처리방침 (위치 정보 약관은 미사용)
--   language: ko/en/ja/zh/vi/th/id/hi (8개)
--   ko 는 폴백용으로 보호 (admin DELETE 거부). 해당 언어 row 가 없으면 사용자
--   화면에서 ko 로 폴백.
CREATE TABLE IF NOT EXISTS Agreements (
  type INTEGER NOT NULL,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT,
  PRIMARY KEY (type, language)
);
