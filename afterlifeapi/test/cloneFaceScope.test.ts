import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import { faceNamespace } from "../src/lib/cloneFaceScope";

describe("faceNamespace", () => {
  it("userId와 cloneId를 콜론으로 결합한다", () => {
    expect(faceNamespace(7, 42)).toBe("7:42");
  });

  it("서로 다른 클론은 서로 다른 namespace를 갖는다", () => {
    expect(faceNamespace(7, 42)).not.toBe(faceNamespace(7, 43));
  });

  it("서로 다른 사용자는 서로 다른 namespace를 갖는다", () => {
    expect(faceNamespace(7, 42)).not.toBe(faceNamespace(8, 42));
  });
});

describe("0109 스키마", () => {
  it("clone_person_faces 테이블이 존재한다", async () => {
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='clone_person_faces'")
      .first<{ name: string }>();
    expect(row?.name).toBe("clone_person_faces");
  });

  it("clones에 self_person_id 컬럼이 있다", async () => {
    const db = env.DB as unknown as D1Database;
    const cols = await db.prepare("PRAGMA table_info(clones)").all<{ name: string }>();
    expect(cols.results.map((c) => c.name)).toContain("self_person_id");
  });

  it("clone_person_faces에 (clone_id, person_id) 인덱스가 있다", async () => {
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_cpf_clone_person'")
      .first<{ name: string }>();
    expect(row?.name).toBe("idx_cpf_clone_person");
  });

  it("폐기된 부분 유니크 인덱스가 제거됐다", async () => {
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='uq_persons_user_name_no_clone'")
      .first<{ name: string }>();
    expect(row).toBeNull();
  });
});
