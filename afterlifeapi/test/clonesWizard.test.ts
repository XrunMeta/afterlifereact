import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function userTok(uid: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await issueToken({ sub: uid, kind: "access" }, secret, 600);
}

describe("clones wizard persona mapping", () => {
  it("GET /oth-path returns halbae system clone", async () => {
    const db = env.DB as unknown as D1Database;

    await db
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (90,'w@t','x','W',CURRENT_TIMESTAMP)",
      )
      .run();
    const tok = await userTok(90);
    const res = await SELF.fetch("http://localhost/oth-path", {
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ items: { id: number; username: string; name: string }[] }>();
    expect(body.items.some((c) => c.username === "halbae")).toBe(true);
  });

  it("maps age/gender/mbti/personaTypes into l1_profile", async () => {
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (90,'w@t','x','W',CURRENT_TIMESTAMP)",
      )
      .run();
    const tok = await userTok(90);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tok}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": "wiz-test-1-unique",
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "테스트",
        username: "wiztest1",
        persona: { age: "60대", gender: "남성", mbti: "INFP", personaTypes: ["감정적", "평온한"] },
      }),
    });
    expect(res.status).toBe(201);
    const row = await db
      .prepare("SELECT l1_profile FROM clones WHERE username='wiztest1'")
      .first<{ l1_profile: string }>();
    const l1 = JSON.parse(row!.l1_profile);
    expect(l1.attrs.age).toBe("60대");
    expect(l1.attrs.gender).toBe("남성");
    expect(l1.attrs.mbti).toBe("INFP");
    expect(l1.personality_core).toContain("감정적");
  });

  it("persona 미전달 시 l1_profile 없으면 null 유지", async () => {
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (91,'w2@t','x','W2',CURRENT_TIMESTAMP)",
      )
      .run();
    const tok = await userTok(91);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tok}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": "wiz-test-2-unique",
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "기본테스트",
        username: "wiztest2",
      }),
    });
    expect(res.status).toBe(201);
    const row = await db
      .prepare("SELECT l1_profile FROM clones WHERE username='wiztest2'")
      .first<{ l1_profile: string | null }>();
    expect(row!.l1_profile).toBeNull();
  });

  it("preserves PersonaAssistant fields (personality_core/tone/dialect) in l1_profile", async () => {
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (91,'p@t','x','P',CURRENT_TIMESTAMP)",
      )
      .run();
    const tok = await userTok(91);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tok}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": "wiz-pa-1",
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "할배",
        username: "wizpa1",
        l1_profile: {
          attrs: { dialect_region: "경상도", dialect_intensity: "심함" },
          notes: "",
          personality_core: "정 많고 느긋함",
          tone: "정겨운 사투리",
        },
      }),
    });
    expect(res.status).toBe(201);
    const row = await db
      .prepare("SELECT l1_profile FROM clones WHERE username='wizpa1'")
      .first<{ l1_profile: string }>();
    const l1 = JSON.parse(row!.l1_profile);
    expect(l1.personality_core).toBe("정 많고 느긋함");
    expect(l1.tone).toBe("정겨운 사투리");
    expect(l1.attrs.dialect_region).toBe("경상도");
  });

  it("기존 l1_profile.attrs 와 persona 위저드 값 merge", async () => {
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (92,'w3@t','x','W3',CURRENT_TIMESTAMP)",
      )
      .run();
    const tok = await userTok(92);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tok}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": "wiz-test-3-unique",
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "머지테스트",
        username: "wiztest3",
        l1_profile: { attrs: { hobby: "등산" }, notes: "산을 좋아해" },
        persona: { age: "40대", mbti: "ENTP", personaTypes: ["논리적"] },
      }),
    });
    expect(res.status).toBe(201);
    const row = await db
      .prepare("SELECT l1_profile FROM clones WHERE username='wiztest3'")
      .first<{ l1_profile: string }>();
    const l1 = JSON.parse(row!.l1_profile);

    expect(l1.attrs.hobby).toBe("등산");
    expect(l1.notes).toBe("산을 좋아해");

    expect(l1.attrs.age).toBe("40대");
    expect(l1.attrs.mbti).toBe("ENTP");
    expect(l1.personality_core).toContain("논리적");
  });
});
