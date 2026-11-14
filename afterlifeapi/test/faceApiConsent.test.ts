

import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { isFaceApiConsentCheckOn, requireFaceApiConsent } from "../src/lib/faceApiConsent";
import { issueToken } from "../src/lib/jwt";

const db = () => env.DB as unknown as D1Database;

async function seedUser(email: string, consent: number): Promise<number> {
  await db()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, face_biometric_consent) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, ?)`,
    )
    .bind(email, consent)
    .run();
  return (await db().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>())!.id;
}
async function seedClone(ownerId: number, username: string): Promise<number> {
  await db()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'C', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username)
    .run();
  return (await db().prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>())!.id;
}
async function tok(userId: number): Promise<string> {
  return issueToken({ sub: userId, kind: "access" }, (env as { JWT_ACCESS_SECRET: string }).JWT_ACCESS_SECRET, 600);
}
const vec = () => Array.from({ length: 128 }, (_, i) => (i === 0 ? 1 : 0));
async function call(method: string, path: string, token: string, body?: unknown) {
  return SELF.fetch(`http://localhost${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("?�위�?, () => {
  it("미설??ON, ?�확??off ???�만 OFF", () => {
    expect(isFaceApiConsentCheckOn({})).toBe(true);
    expect(isFaceApiConsentCheckOn({ FACE_API_CONSENT_CHECK: "" })).toBe(true);
    expect(isFaceApiConsentCheckOn({ FACE_API_CONSENT_CHECK: "false" })).toBe(true);
    expect(isFaceApiConsentCheckOn({ FACE_API_CONSENT_CHECK: "off" })).toBe(false);
  });
  it("off �?미동?�·없???�용?�도 ?�과, 기본?�면 403", async () => {
    const uid = await seedUser("fac-sw@test.local", 0);
    const off = { ...env, FACE_API_CONSENT_CHECK: "off" } as never;
    await expect(requireFaceApiConsent(off, uid, "t")).resolves.toBeUndefined();
    await expect(requireFaceApiConsent(off, 999999, "t")).resolves.toBeUndefined();
    await expect(requireFaceApiConsent(env as never, uid, "t")).rejects.toMatchObject({ code: "FACE_CONSENT_REQUIRED", status: 403 });
  });
  it("???�음·조회 ?�패??거절(fail-closed)", async () => {
    await expect(requireFaceApiConsent(env as never, 999999, "t")).rejects.toMatchObject({ code: "FACE_CONSENT_REQUIRED" });
    const broken = { DB: { prepare: () => { throw new Error("boom"); } } } as never;
    await expect(requireFaceApiConsent(broken, 1, "t")).rejects.toMatchObject({ code: "FACE_CONSENT_REQUIRED" });
  });
});

describe("?�굴 벡터 ?�우??HTTP 게이??, () => {
  it("granted ???�과, 미동??0)/철회(1??) ??403 FACE_CONSENT_REQUIRED", async () => {
    const ok = await seedUser("fac-ok@test.local", 1);
    const no = await seedUser("fac-no@test.local", 0);
    const revoked = await seedUser("fac-rev@test.local", 1);
    await db().prepare("UPDATE users SET face_biometric_consent = 0 WHERE id = ?").bind(revoked).run();
    const cid = await seedClone(ok, "fac-clone");

    const okRes = await call("POST", "/oth-path", await tok(ok), { vector: vec(), cloneId: cid });
    expect(okRes.status).toBe(200);
    const galOk = await call("GET", `/oth-path?cloneId=${cid}`, await tok(ok));
    expect(galOk.status).toBe(200);

    for (const u of [no, revoked]) {
      const t = await tok(u);
      const calls: Array<[string, string, unknown?]> = [
        ["POST", "/oth-path", { vector: vec(), cloneId: cid }],
        ["GET", `/oth-path?cloneId=${cid}`],
        ["POST", "/oth-path", { vectors: [vec()], cloneId: cid }],
        ["POST", "/oth-path", { vectors: [vec()], cloneId: cid, displayName: "a" }],
        ["POST", "/oth-path"],
        ["POST", "/oth-path", { vector: vec(), cloneId: cid }],
        ["POST", `/oth-path${cid}/self-confirm`, { vectors: [vec(), vec(), vec()] }],
      ];
      for (const [m, p, b] of calls) {
        const r = await call(m, p, t, b);
        const j = await r.json<{ error: { code: string } }>();
        expect(r.status, `${m} ${p}`).toBe(403);
        expect(j.error.code, `${m} ${p}`).toBe("FACE_CONSENT_REQUIRED");
      }
    }
  }, 20_000); 

  it("미동???�용?�도 ??��·목록·self-face·person ?�성?� 막히지 ?�는???�체?�보 미처�?철회 경로)", async () => {
    const no = await seedUser("fac-free@test.local", 0);
    const cid = await seedClone(no, "fac-free-clone");
    const t = await tok(no);
    expect((await call("GET", `/oth-path?cloneId=${cid}`, t)).status).toBe(200);
    expect((await call("GET", "/oth-path", t)).status).toBe(200);
    expect((await call("DELETE", "/oth-path", t)).status).toBe(404); 
    expect((await call("POST", "/oth-path", t, { cloneId: cid })).status).toBe(201);
  });

  it("?�이: ?�의 ?�??직후 /match 200 ??철회 ??403", async () => {
    const uid = await seedUser("fac-trans@test.local", 0);
    const cid = await seedClone(uid, "fac-trans-clone");
    const t = await tok(uid);
    const m = () => call("POST", "/oth-path", t, { vector: vec(), cloneId: cid });
    expect((await m()).status).toBe(403);
    const grant = await call("POST", "/oth-path", t, { state: "granted" });
    expect(grant.status).toBeLessThan(300);
    expect((await m()).status).toBe(200);
    const revoke = await call("POST", "/oth-path", t, { state: "revoked" });
    expect(revoke.status).toBeLessThan(300);
    expect((await m()).status).toBe(403);
  });
});
