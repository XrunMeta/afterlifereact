-- T-532B (2026-08-20): 얼굴 매칭 threshold 상향 + person 75 (테스트 데이터) 정리.
--   증상: 새 얼굴 보여도 person 75 "테스트" 로 매칭돼 Remember Me sheet 안 뜸.
--   원인: T-532A 각도 수집이 person 75 에 20 embedding 채워놓음 → topK=3 중 하나가
--         threshold 0.42 쉽게 넘어 다른 얼굴도 confirmed. 매칭 공간이 너무 넓어짐.
--   fix: (1) threshold 0.42 → 0.55 상향 (매칭 엄격화)
--        (2) person 75 clone_person_faces 최근 3개만 남기고 정리 (테스트 데이터 축소).
--            Vectorize 엔 남아있지만 persons.ts /match 가 D1 정본으로 필터.

UPDATE app_config
  SET value = '0.55', updated_at = strftime('%s','now')
  WHERE key = 'face.match_threshold';

-- person 75 오래된 embedding 삭제 (초기 3개만 남김)
DELETE FROM clone_person_faces
  WHERE person_id = 75
    AND id NOT IN (
      SELECT id FROM clone_person_faces
       WHERE person_id = 75
       ORDER BY created_at ASC
       LIMIT 3
    );
