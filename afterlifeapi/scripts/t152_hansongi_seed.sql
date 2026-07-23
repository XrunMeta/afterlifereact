-- T-152 한송이 전문가 클론 시드 템플릿 (preview 전용 — 마이그레이션 아님, wrangler d1 execute --file 수동 실행)
-- 실행 정본·전체 런북: KB tasks/T-152-afterlife-전문가클론-한송이/PIPELINE.md 단계 4
-- 플레이스홀더(:xxx)는 실값 치환한 사본으로 실행할 것. l1_profile JSON은 build_l1.mjs 산출물(작은따옴표 '' 이스케이프).
-- 2026-07-24 실행 결과: clone id 9082 (owner 1007, files 10522 avatar / 10523 voice)

INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
VALUES (:avatar_r2_key, 'image/png', :avatar_bytes, :owner_user_id, 'clone_avatar');

INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
VALUES (:voice_r2_key, 'audio/wav', :voice_bytes, :owner_user_id, 'clone_voice');

INSERT INTO clones (owner_id, clone_type, name, username, description, category, visibility, avatar_url, training_status, l1_profile)
VALUES (:owner_user_id, 'expert', '한송이', 'hansongi_florist',
  '꽃과 계절 이야기를 나누는 플로리스트예요. 어울리는 꽃을 골라드릴게요. (AI 클론)',
  'lifestyle', 'public',
  'https://edge-alt-preview.example.invalid/oth-path' || (SELECT id FROM files WHERE r2_key = :avatar_r2_key),
  'ready', :l1_profile_json);

-- 이후 자산 잡(voice_clone·idle_video·filler)은 clone_asset_jobs INSERT + gabia /oth-path 트리거 — PIPELINE.md 4d 참조.
