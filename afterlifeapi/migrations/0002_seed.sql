-- AfterLife seed data (베타 기본값)
-- 참조: docs/pricing.md §2.2 (선물 S/M/L/XL = 1/5/10/50)

-- ============================================================
-- gifts (S/M/L/XL 4단계 기본 셋)
-- ============================================================
INSERT INTO gifts (name, emoji, price_credits) VALUES
  ('박수',   '👏', 1),
  ('하트',   '❤️', 1),
  ('꽃다발', '💐', 5),
  ('음료',   '🥤', 5),
  ('케이크', '🎂', 10),
  ('트로피', '🏆', 50);

-- ============================================================
-- voice_presets (데모용 기본 4종)
-- ============================================================
INSERT INTO voice_presets (name, gender, age_range, sample_url, description) VALUES
  ('따뜻한 중년 남성', 'male',   '40s', '/samples/voice_m_40.mp3', '온화하고 안정적인 톤'),
  ('밝은 청년 여성',   'female', '20s', '/samples/voice_f_20.mp3', '활기차고 경쾌한 톤'),
  ('차분한 노년 여성', 'female', '60s', '/samples/voice_f_60.mp3', '부드럽고 차분한 톤'),
  ('낮은 톤 청년 남성','male',   '20s', '/samples/voice_m_20.mp3', '낮고 차분한 톤');

-- ============================================================
-- ad_keywords (최소 동작 확인용 기본 1건)
-- ============================================================
INSERT INTO ad_keywords (keyword, track, ad_title, ad_url, ad_description, is_active) VALUES
  ('장례', 'memlow', '추모 서비스 안내', 'https://example.com/memorial', '가족을 위한 추모 서비스', 1);
