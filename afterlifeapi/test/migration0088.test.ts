import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";

const db = () => env.DB as unknown as D1Database;

describe("migration 0088 face_biometric_consent", () => {
  it("users 테이블에 face_biometric_consent/face_consent_at/face_consent_version 컬럼 추가", async () => {
    const cols = await db().prepare("PRAGMA table_info(users)").all<{ name: string }>();
    const names = cols.results.map((r) => r.name);
    expect(names).toEqual(
      expect.arrayContaining(["face_biometric_consent", "face_consent_at", "face_consent_version"]),
    );
  });

  it("users.face_biometric_consent 기본값 0, 기존 행에도 소급 적용", async () => {
    await db()
      .prepare(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES ('mig0088@e','x','U',CURRENT_TIMESTAMP)",
      )
      .run();
    const row = await db()
      .prepare(
        "SELECT face_biometric_consent AS c, face_consent_at AS at, face_consent_version AS v FROM users WHERE email = 'mig0088@e'",
      )
      .first<{ c: number; at: number | null; v: string | null }>();
    expect(row?.c).toBe(0);
    expect(row?.at).toBeNull();
    expect(row?.v).toBeNull();
  });

  it("persons 테이블에 enrolled_via 컬럼 추가, 기본값 'card'", async () => {
    const cols = await db().prepare("PRAGMA table_info(persons)").all<{ name: string }>();
    const names = cols.results.map((r) => r.name);
    expect(names).toEqual(expect.arrayContaining(["enrolled_via"]));

    await db()
      .prepare(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES ('mig0088b@e','x','U',CURRENT_TIMESTAMP)",
      )
      .run();
    const u = await db().prepare("SELECT id FROM users WHERE email = 'mig0088b@e'").first<{ id: number }>();
    await db()
      .prepare("INSERT INTO persons (user_id, display_name, consent_state, created_at) VALUES (?, 'P', 'none', ?)")
      .bind(u!.id, Date.now())
      .run();
    const p = await db()
      .prepare("SELECT enrolled_via FROM persons WHERE user_id = ?")
      .bind(u!.id)
      .first<{ enrolled_via: string }>();
    expect(p?.enrolled_via).toBe("card");
  });

  it("persons.enrolled_via CHECK 제약 — 허용값 외 INSERT 실패", async () => {
    await db()
      .prepare(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES ('mig0088c@e','x','U',CURRENT_TIMESTAMP)",
      )
      .run();
    const u = await db().prepare("SELECT id FROM users WHERE email = 'mig0088c@e'").first<{ id: number }>();
    await expect(
      db()
        .prepare(
          "INSERT INTO persons (user_id, display_name, consent_state, enrolled_via, created_at) VALUES (?, 'P', 'none', 'bogus', ?)",
        )
        .bind(u!.id, Date.now())
        .run(),
    ).rejects.toThrow();
  });
});
