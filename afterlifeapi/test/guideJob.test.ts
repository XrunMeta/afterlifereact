

import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { env, fetchMock } from "cloudflare:test";
import { triggerGuideJob } from "../src/lib/guideJob";

const ORCH = "http://orchestrator.test";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(email)
    .run();
  return (
    await db.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first<{ id: number }>()
  )!.id;
}

async function seedClone(
  ownerId: number,
  username: string,
  l1Profile?: unknown,
): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, l1_profile, created_at)
       VALUES (?, 'CT', ?, 'memlow', 'public', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username, l1Profile ? JSON.stringify(l1Profile) : null)
    .run();
  return (
    await db.prepare(`SELECT id FROM clones WHERE username = ?`).bind(username).first<{ id: number }>()
  )!.id;
}

async function seedFile(uid: number, suffix: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const key = `uploadedfiles/triggerguidejob-${suffix}.bin`;
  const r = await db
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'application/octet-stream', 1, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(key, uid)
    .first<{ id: number }>();
  return r!.id;
}

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

describe("triggerGuideJob() 단위 테스트", () => {
  it("잡 생성 + clone_id 연결 + orchestrator 중계 payload(persona 포함)", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("triggerguidejob_full@test.com");
    const cloneId = await seedClone(uid, `tgj-full-${Date.now()}`, {
      attrs: { mbti: "INFP" },
      notes: "unit test persona",
    });
    const faceFileId = await seedFile(uid, "face");

    let relayedBody: string | null = null;
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((opts) => {
        relayedBody = opts.body as string;
        return { statusCode: 202, data: { ok: true } };
      });

    const waitUntilPromises: Promise<unknown>[] = [];
    const result = await triggerGuideJob(db, {
      cloneId,
      userId: uid,
      faceSrcFileId: faceFileId,
      voiceRawUrl: "http://localhost/oth-path",
      origin: "http://localhost",
      orchestratorUrl: ORCH,
      orchSecret: "test-secret",
      waitUntil: (p) => waitUntilPromises.push(p),
    });

    expect(result.guideJobId).toBeTruthy();
    await Promise.all(waitUntilPromises);

    const job = await db
      .prepare(`SELECT kind, src_file_id, clone_id, status FROM clone_asset_jobs WHERE id=?`)
      .bind(result.guideJobId)
      .first<{ kind: string; src_file_id: number; clone_id: number; status: string }>();
    expect(job).toBeTruthy();
    expect(job!.kind).toBe("guide");
    expect(job!.src_file_id).toBe(faceFileId);
    expect(job!.clone_id).toBe(cloneId);

    expect(job!.status).toBe("running");

    expect(relayedBody).toBeTruthy();
    const parsed = JSON.parse(relayedBody!);
    expect(parsed.job_id).toBe(result.guideJobId);
    expect(parsed.kind).toBe("guide");
    expect(parsed.face_url).toBe(`http://localhost/oth-path${faceFileId}`);
    expect(parsed.clone_id).toBe(String(cloneId));
    expect(parsed.voice_raw_url).toBe("http://localhost/oth-path");
    expect(typeof parsed.callback_token).toBe("string");

    expect(parsed.persona).toBeTruthy();
    expect(parsed.persona.l0).toBeTruthy();
    expect(parsed.persona.l1.attrs).toBeUndefined();
    expect(parsed.persona.l1.mbti).toBe("INFP");
    expect(parsed.persona.l1.notes).toBe("unit test persona");
  });

  it("orchestratorUrl/orchSecret 미설정 → 잡만 생성, 중계 skip(fetch 미호출)", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("triggerguidejob_noorch@test.com");
    const cloneId = await seedClone(uid, `tgj-noorch-${Date.now()}`);
    const faceFileId = await seedFile(uid, "face-noorch");

    const waitUntilPromises: Promise<unknown>[] = [];
    const result = await triggerGuideJob(db, {
      cloneId,
      userId: uid,
      faceSrcFileId: faceFileId,
      voiceRawUrl: "http://localhost/oth-path",
      origin: "http://localhost",

      waitUntil: (p) => waitUntilPromises.push(p),
    });

    expect(result.guideJobId).toBeTruthy();
    expect(waitUntilPromises.length).toBe(0); 

    const job = await db
      .prepare(`SELECT clone_id, status FROM clone_asset_jobs WHERE id=?`)
      .bind(result.guideJobId)
      .first<{ clone_id: number; status: string }>();
    expect(job).toBeTruthy();
    expect(job!.clone_id).toBe(cloneId);

    expect(job!.status).toBe("pending");

  });

  it("persona 조립 실패 시(system_persona 조회 예외) persona=null 로 폴백 — try/catch 격리", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("triggerguidejob_personafail@test.com");
    const cloneId = await seedClone(uid, `tgj-personafail-${Date.now()}`, { mbti: "ESTJ" });
    const faceFileId = await seedFile(uid, "face-personafail");

    const throwingDb = new Proxy(db, {
      get(target, prop, receiver) {
        if (prop === "prepare") {
          return (sql: string) => {
            if (sql.includes("system_persona")) {
              throw new Error("simulated system_persona failure");
            }
            return (target as unknown as { prepare: (s: string) => unknown }).prepare(sql);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as D1Database;

    let relayedBody: string | null = null;
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((opts) => {
        relayedBody = opts.body as string;
        return { statusCode: 202, data: { ok: true } };
      });

    const waitUntilPromises: Promise<unknown>[] = [];
    const result = await triggerGuideJob(throwingDb, {
      cloneId,
      userId: uid,
      faceSrcFileId: faceFileId,
      voiceRawUrl: "http://localhost/oth-path",
      origin: "http://localhost",
      orchestratorUrl: ORCH,
      orchSecret: "test-secret",
      waitUntil: (p) => waitUntilPromises.push(p),
    });

    await Promise.all(waitUntilPromises);

    const job = await db
      .prepare(`SELECT clone_id, status FROM clone_asset_jobs WHERE id=?`)
      .bind(result.guideJobId)
      .first<{ clone_id: number; status: string }>();
    expect(job!.clone_id).toBe(cloneId);
    expect(job!.status).toBe("running");

    expect(relayedBody).toBeTruthy();
    const parsed = JSON.parse(relayedBody!);

    expect(parsed.persona).toBeNull();
  });
});
