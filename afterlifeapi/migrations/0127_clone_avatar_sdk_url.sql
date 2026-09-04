-- 0127_clone_avatar_sdk_url.sql
-- T-689 (2026-09-04): clones 에 avatar_sdk_glb_url 컬럼 추가.
--
-- Avatar SDK (avatarsdk.com / MetaPerson Creator) 로 페르소나별 3D 얼굴 헤드를 생성하고
-- 그 GLB 파일의 원격 URL 을 여기 저장한다. React Native 앱은 이 URL 을 react-native-filament
-- 의 useModel({ uri }) 에 넘겨 통화 화면에서 렌더한다.
--
-- Phase 1 (T-688) 은 dev 화면에서 사용자가 매번 URL 을 붙여넣는 방식이었고,
-- 이번엔 admin 이 페르소나마다 URL 을 한 번만 저장하면 앱이 자동으로 클론별 헤드 로드.
--
-- NULL 허용 (avatar SDK 미가입·미생성 페르소나 = NULL). musetalk/echomimic_v3 파이프라인은
-- 이 컬럼 무관하게 기존대로 동작. threed pipeline 페르소나만 이 URL 을 참조.
ALTER TABLE clones ADD COLUMN avatar_sdk_glb_url TEXT;

-- Avatar SDK 아바타 ID (선택). REST API 통합 시 GLB URL 재생성·삭제·상태 조회에 사용.
ALTER TABLE clones ADD COLUMN avatar_sdk_id TEXT;
