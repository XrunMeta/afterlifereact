import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

const TAG = "sptag";
let seq = 0;

function db(): D1Database {
  return env.DB as unknown as D1Database;
}

async function seedUser(): Promise<number> {
  seq += 1;
  const email = `susp-${seq}-${Date.now()}@test.local`;
  await db()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  return (await db().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>())!.id;
}

async function seedClone(ownerId: number, opts: { visibility?: string; cloneType?: string } = {}): Promise<number> {
  seq += 1;
  const username = `${TAG}_clone_${seq}`;
  await db()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, `${TAG}_${seq}`, username, opts.cloneType ?? "friend", opts.visibility ?? "public")
    .run();
  return (await db().prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>())!.id;
}

async function suspendClone(cloneId: number): Promise<void> {
  await db()
    .prepare(`UPDATE clones SET admin_suspended_at = CURRENT_TIMESTAMP, admin_suspend_reason = '테스트 중지' WHERE id = ?`)
    .bind(cloneId)
    .run();
}

async function unsuspendClone(cloneId: number): Promise<void> {
  await db()
    .prepare(`UPDATE clones SET admin_suspended_at = NULL, admin_suspend_reason = NULL WHERE id = ?`)
    .bind(cloneId)
    .run();
}

async function token(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return issueToken({ sub: userId, kind: "access" }, secret, 600);
}

async function searchIds(t: string): Promise<number[]> {
  const res = await SELF.fetch(`http://localhost/oth-path?q=${TAG}&limit=50`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  const j = (await res.json()) as { items?: Array<{ id?: number }> };
  return (j.items ?? []).map((i) => i.id!).filter(Boolean);
}

async function discoverIds(t: string): Promise<number[]> {
  const res = await SELF.fetch("http://localhost/oth-path?limit=50", {
    headers: { Authorization: `Bearer ${t}` },
  });
  const j = (await res.json()) as { items?: Array<{ cloneId?: number }> };
  return (j.items ?? []).map((i) => i.cloneId!).filter(Boolean);
}

async function shortsCloneIds(t: string): Promise<number[]> {
  const res = await SELF.fetch("http://localhost/oth-path", {
    headers: { Authorization: `Bearer ${t}` },
  });
  const j = (await res.json()) as { items?: Array<{ cloneId?: number }> };
  return (j.items ?? []).map((i) => i.cloneId!).filter(Boolean);
}

async function seedShort(cloneId: number): Promise<void> {
  await db()
    .prepare(`INSERT INTO clone_shorts (clone_id, status, media_url) VALUES (?, 'ready', 'https://r2.example.com/s.mp4')`)
    .bind(cloneId)
    .run();
}

async function bundleStatus(cloneId: number, t: string): Promise<number> {
  const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  return res.status;
}

describe("T-203 후속 — admin_suspended_at 외부 노출 차단", () => {
  it("검색: 타인에게는 안 보이고 소유자 본인에게는 보인다 + 정상 클론은 둘 다에게 유지", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const suspended = await seedClone(owner);
    const normal = await seedClone(owner);
    await suspendClone(suspended);

    const ot = await token(owner);
    const st = await token(stranger);

    const ownerSearch = await searchIds(ot);
    expect(ownerSearch).toContain(suspended);
    expect(ownerSearch).toContain(normal);

    const strangerSearch = await searchIds(st);
    expect(strangerSearch).not.toContain(suspended);
    expect(strangerSearch).toContain(normal);
  });

  it("검색: 비로그인(anonymous)도 정지 클론은 못 봄", async () => {
    const owner = await seedUser();
    const suspended = await seedClone(owner);
    const normal = await seedClone(owner);
    await suspendClone(suspended);

    const res = await SELF.fetch(`http://localhost/oth-path?q=${TAG}&limit=50`);
    const j = (await res.json()) as { items?: Array<{ id?: number }> };
    const ids = (j.items ?? []).map((i) => i.id!).filter(Boolean);
    expect(ids).not.toContain(suspended);
    expect(ids).toContain(normal);
  });

  it("홈피드(discover): 타인에게는 안 보이고 소유자 본인에게는 보인다 + 정상 클론 유지", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const suspended = await seedClone(owner);
    const normal = await seedClone(owner);
    await suspendClone(suspended);

    const ot = await token(owner);
    const st = await token(stranger);

    const ownerFeed = await discoverIds(ot);
    expect(ownerFeed).toContain(suspended);
    expect(ownerFeed).toContain(normal);

    const strangerFeed = await discoverIds(st);
    expect(strangerFeed).not.toContain(suspended);
    expect(strangerFeed).toContain(normal);
  });

  it("shorts 피드: 타인에게는 안 보이고 소유자 본인에게는 보인다 + 정상 클론 유지", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const suspended = await seedClone(owner);
    const normal = await seedClone(owner);
    await seedShort(suspended);
    await seedShort(normal);
    await suspendClone(suspended);

    const ot = await token(owner);
    const st = await token(stranger);

    const ownerShorts = await shortsCloneIds(ot);
    expect(ownerShorts).toContain(suspended);
    expect(ownerShorts).toContain(normal);

    const strangerShorts = await shortsCloneIds(st);
    expect(strangerShorts).not.toContain(suspended);
    expect(strangerShorts).toContain(normal);
  });

  it("통화(bundle): 타인은 403, 소유자는 200 + 정상 클론은 둘 다 200", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const suspended = await seedClone(owner);
    const normal = await seedClone(owner);
    await suspendClone(suspended);

    const ot = await token(owner);
    const st = await token(stranger);

    expect(await bundleStatus(suspended, ot)).toBe(200); 
    expect(await bundleStatus(suspended, st)).toBe(403); 
    expect(await bundleStatus(normal, ot)).toBe(200);
    expect(await bundleStatus(normal, st)).toBe(200); 
  });

  it("공동관리자(coowner, share role='owner')는 정지 중에도 소유자와 동일하게 통화 가능", async () => {
    const owner = await seedUser();
    const coowner = await seedUser();
    const suspended = await seedClone(owner, { visibility: "private" });
    await suspendClone(suspended);
    await db()
      .prepare(
        `INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')`,
      )
      .bind(suspended, owner, coowner)
      .run();

    const ct = await token(coowner);
    expect(await bundleStatus(suspended, ct)).toBe(200);
  });

  it("정지 해제 후 타인에게 다시 보인다(검색·피드·shorts·통화 전부)", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const cloneId = await seedClone(owner);
    await seedShort(cloneId);
    await suspendClone(cloneId);

    const st = await token(stranger);

    expect(await searchIds(st)).not.toContain(cloneId);
    expect(await discoverIds(st)).not.toContain(cloneId);
    expect(await shortsCloneIds(st)).not.toContain(cloneId);
    expect(await bundleStatus(cloneId, st)).toBe(403);

    await unsuspendClone(cloneId);
    expect(await searchIds(st)).toContain(cloneId);
    expect(await discoverIds(st)).toContain(cloneId);
    expect(await shortsCloneIds(st)).toContain(cloneId);
    expect(await bundleStatus(cloneId, st)).toBe(200);
  });

  it("followers/selected visibility 클론도 정지 시 자격 있는 타인에게 차단된다", async () => {
    const owner = await seedUser();
    const follower = await seedUser();
    const cloneId = await seedClone(owner, { visibility: "followers" });
    await db()
      .prepare(`INSERT INTO clone_follows (clone_id, user_id) VALUES (?, ?)`)
      .bind(cloneId, follower)
      .run();

    const ft = await token(follower);

    expect(await searchIds(ft)).toContain(cloneId);
    expect(await discoverIds(ft)).toContain(cloneId);

    await suspendClone(cloneId);

    expect(await searchIds(ft)).not.toContain(cloneId);
    expect(await discoverIds(ft)).not.toContain(cloneId);
  });
});
