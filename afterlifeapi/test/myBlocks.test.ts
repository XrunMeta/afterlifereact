import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let seq = 0;
async function seedUser(): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const email = `mb-${seq}-${(seq * 7919) % 100000}@test.local`;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const username = `mb_clone_${seq}`;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 600);
}

function authFetch(path: string, token: string, method = "GET"): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
}

interface BlockItem {
  type: "clone" | "user";
  blockId: number;
  clone?: { id: number };
  user?: { id: number; email: string };
}

describe("GET /oth-path — 클론 + 유저 통합", () => {
  beforeAll(async () => {
    try {
      await (env.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM clone_blocks").first();
    } catch {
      throw new Error("D1 migrations not applied.");
    }
  });

  it("차단한 클론과 유저가 모두 type 판별자와 함께 반환됨", async () => {
    const me = await seedUser();
    const other = await seedUser(); 
    const cloneOwner = await seedUser();
    const cloneId = await seedClone(cloneOwner); 
    const token = await issueAccessToken(me);

    expect((await authFetch(`/oth-path${cloneId}/block`, token, "POST")).status).toBe(200);
    expect((await authFetch(`/oth-path${other}/block`, token, "POST")).status).toBe(200);

    const res = await authFetch(`/oth-path`, token);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { items: BlockItem[] };

    const cloneItem = json.items.find((i) => i.type === "clone");
    const userItem = json.items.find((i) => i.type === "user");
    expect(cloneItem?.clone?.id).toBe(cloneId);
    expect(userItem?.user?.id).toBe(other);
    expect(json.items.length).toBeGreaterThanOrEqual(2);
  });

  it("유저 신고(자동 차단)도 /me/blocks 에 type:user 로 노출", async () => {
    const me = await seedUser();
    const target = await seedUser();
    const token = await issueAccessToken(me);

    expect((await authFetch(`/oth-path${target}/report`, token, "POST")).status).toBe(200);

    const res = await authFetch(`/oth-path`, token);
    const json = (await res.json()) as { items: BlockItem[] };
    const userItem = json.items.find((i) => i.type === "user" && i.user?.id === target);
    expect(userItem).toBeTruthy();
  });
});
