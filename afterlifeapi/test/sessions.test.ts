import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

interface ClonesRow { cnt: number }

async function v_2e4ad6(): Promise<boolean> {
  try {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT COUNT(*) AS cnt FROM clones")
      .first<ClonesRow>();
    return typeof v_3ac7e7?.cnt === "number";
  } catch {
    return false;
  }
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(v_e0c7e8)
    .first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(
  v_1badb6,
  v_556427,
  v_818579 = "public",
): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'memlow', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427, v_818579)
    .run();
  const v_3f4e2e = await v_a1651b
    .prepare("SELECT id FROM clones WHERE username = ?")
    .bind(v_556427)
    .first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_979e03(v_6e0fd3, v_43e90c): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT OR IGNORE INTO clone_follows (user_id, clone_id) VALUES (?, ?)`,
    )
    .bind(v_43e90c, v_6e0fd3)
    .run();
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

interface SessionResponse {
  sessionId: string;
  livekitRoom: string;
  livekitToken: string;
  cloudflareCallsAppId: string;
  loraUri: string;
  ttsVoiceUri: string;
  expiresAt: string;
  viewerRole: "owner" | "coowner" | "follower";
}

v_469bf2("sessions route — contract", () => {
  v_ba7107(async () => {
    if (!(await v_2e4ad6())) {
      throw new Error("D1 migrations not applied.");
    }
  });

  v_23805a("POST /oth-path — owner 는 200 + stub fields 반환", async () => {
    const v_1badb6 = await v_bfb240("sess-o@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "sess_owner_clone");
    const v_21cc31 = await v_86c39f(v_1badb6);
    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}`,
      { method: "POST", headers: { Authorization: `Bearer ${v_21cc31}` } },
    );
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as SessionResponse;
    v_4d37e3(v_4d33b2.sessionId).toMatch(/^sess-/);
    v_4d37e3(v_4d33b2.livekitRoom).toMatch(/^room-/);
    v_4d37e3(v_4d33b2.livekitToken.length).toBeGreaterThan(0);
    v_4d37e3(v_4d33b2.loraUri).toMatch(/^r2:\/\//);
    v_4d37e3(v_4d33b2.ttsVoiceUri).toMatch(/^r2:\/\//);
    v_4d37e3(typeof v_4d33b2.expiresAt).toBe("string");
    v_4d37e3(v_4d33b2.viewerRole).toBe("owner");
  });

  v_23805a("POST /oth-path — follower 는 200 + viewerRole='follower'", async () => {
    const v_1badb6 = await v_bfb240("sess-flw-o@test.local");
    const v_baf950 = await v_bfb240("sess-flw-f@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "sess_flw_clone");
    await v_979e03(v_6e0fd3, v_baf950);
    const v_21cc31 = await v_86c39f(v_baf950);
    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}`,
      { method: "POST", headers: { Authorization: `Bearer ${v_21cc31}` } },
    );
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as SessionResponse;
    v_4d37e3(v_4d33b2.viewerRole).toBe("follower");
  });

  v_23805a("POST /oth-path — 관계 없는 유저는 403", async () => {
    const v_1badb6 = await v_bfb240("sess-noacc-o@test.local");
    const v_0b00e8 = await v_bfb240("sess-noacc-s@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "sess_noacc_clone");
    const v_21cc31 = await v_86c39f(v_0b00e8);
    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}`,
      { method: "POST", headers: { Authorization: `Bearer ${v_21cc31}` } },
    );
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("POST /oth-path — 비로그인은 401", async () => {
    const v_1badb6 = await v_bfb240("sess-anon-o@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "sess_anon_clone");
    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}`,
      { method: "POST" },
    );
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});
