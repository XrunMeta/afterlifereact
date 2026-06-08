import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let seq = 0;
async function seedUser(): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const email = `bh-${seq}-${(seq * 7919) % 100000}@test.local`;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  return (await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>())!.id;
}

const TAG = "zqxblocktag";
async function seedClone(ownerId: number): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const username = `bh_clone_${seq}`;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, `${TAG}_${seq}`, username)
    .run();
  return (await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>())!.id;
}

async function token(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing");
  return await issueToken({ sub: userId, kind: "access" }, secret, 600);
}

function authPost(path: string, t: string): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}` },
  });
}

async function discoverIds(t: string): Promise<number[]> {
  const res = await SELF.fetch("http://localhost/oth-path?limit=50", {
    headers: { Authorization: `Bearer ${t}` },
  });
  const j = (await res.json()) as { items?: Array<{ cloneId?: number }> };
  return (j.items ?? []).map((i) => i.cloneId!).filter(Boolean);
}

async function searchIds(t: string): Promise<number[]> {
  const res = await SELF.fetch(`http://localhost/oth-path?q=${TAG}&limit=50`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  const j = (await res.json()) as { items?: Array<{ id?: number }> };
  return (j.items ?? []).map((i) => i.id!).filter(Boolean);
}

describe("차단 시 클론 숨김 — 피드 + 검색", () => {
  beforeAll(async () => {
    try {
      await (env.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM user_blocks").first();
    } catch {
      throw new Error("D1 migrations not applied.");
    }
  });

  it("유저 차단 → 그 유저의 클론이 피드/검색에서 사라짐, 정상 유저 클론은 유지", async () => {
    const viewer = await seedUser();
    const badUser = await seedUser();
    const goodUser = await seedUser();
    const badClone = await seedClone(badUser);
    const goodClone = await seedClone(goodUser);
    const vt = await token(viewer);

    expect(await discoverIds(vt)).toEqual(expect.arrayContaining([badClone, goodClone]));
    expect(await searchIds(vt)).toEqual(expect.arrayContaining([badClone, goodClone]));

    expect((await authPost(`/oth-path${badUser}/block`, vt)).status).toBe(200);

    const feed = await discoverIds(vt);
    expect(feed).not.toContain(badClone);
    expect(feed).toContain(goodClone);
    const search = await searchIds(vt);
    expect(search).not.toContain(badClone);
    expect(search).toContain(goodClone);
  });

  it("클론만 차단 → 그 클론만 사라지고 같은 주인의 다른 클론/타 클론은 유지", async () => {
    const viewer = await seedUser();
    const owner = await seedUser();
    const blockedClone = await seedClone(owner);
    const otherClone = await seedClone(owner); 
    const vt = await token(viewer);

    expect((await authPost(`/oth-path${blockedClone}/block`, vt)).status).toBe(200);

    const feed = await discoverIds(vt);
    expect(feed).not.toContain(blockedClone);
    expect(feed).toContain(otherClone); 

    const search = await searchIds(vt);
    expect(search).not.toContain(blockedClone);
    expect(search).toContain(otherClone);
  });
});
