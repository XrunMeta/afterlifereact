-- M-2 TOCTOU hardening: 타입별 1개 무료 쿼터를 DB 레벨에서 강제.
-- pricing.md §1.1 "Soft Delete 후 재생성은 쿼터 소진으로 간주" — soft-deleted 포함한 전역 UNIQUE.
-- 베타 종료 후 유료 생성 경로 열리면 본 인덱스를 DROP하고 애플리케이션 레벨 quota로 전환.

CREATE UNIQUE INDEX uniq_clones_owner_type ON clones(owner_id, clone_type);
