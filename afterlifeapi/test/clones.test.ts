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
  v_818579,
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

async function v_8af3e6(
  v_6e0fd3,
  v_1badb6,
  v_489382,
  v_22da99,
): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status)
       VALUES (?, ?, ?, ?, 'accepted')`,
    )
    .bind(v_6e0fd3, v_1badb6, v_489382, v_22da99)
    .run();
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

v_469bf2("clones route — viewerRole 4값", () => {
  v_ba7107(async () => {
    if (!(await v_2e4ad6())) {
      throw new Error(
        "D1 migrations not applied. Check poolOptions.workers.miniflare.d1Databases or wrangler migrations.",
      );
    }
  });

  v_23805a("viewerRole = 'owner' for clone owner", async () => {
    const v_1badb6 = await v_bfb240("vr-owner@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "vr_owner", "public");
    const v_21cc31 = await v_86c39f(v_1badb6);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { clone: { viewerRole: string | null } };
    v_4d37e3(v_4d33b2.clone.viewerRole).toBe("owner");
  });

  v_23805a("viewerRole = 'coowner' for accepted share role='owner' (non-self)", async () => {
    const v_1badb6 = await v_bfb240("vr-cowo@test.local");
    const v_af26b7 = await v_bfb240("vr-cowo-target@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "vr_cowo", "public");
    await v_8af3e6(v_6e0fd3, v_1badb6, v_af26b7, "owner");
    const v_21cc31 = await v_86c39f(v_af26b7);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { clone: { viewerRole: string | null } };
    v_4d37e3(v_4d33b2.clone.viewerRole).toBe("coowner");
  });

  v_23805a("viewerRole = 'coowner' for accepted share role='viewer' (share 접근 유지)", async () => {
    const v_1badb6 = await v_bfb240("vr-viewer-o@test.local");
    const v_013af2 = await v_bfb240("vr-viewer-t@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "vr_viewer", "public");
    await v_8af3e6(v_6e0fd3, v_1badb6, v_013af2, "viewer");
    const v_21cc31 = await v_86c39f(v_013af2);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { clone: { viewerRole: string | null } };
    v_4d37e3(v_4d33b2.clone.viewerRole).toBe("coowner");
  });

  v_23805a("viewerRole = 'follower' for follower (공개 클론)", async () => {
    const v_1badb6 = await v_bfb240("vr-flw-o@test.local");
    const v_baf950 = await v_bfb240("vr-flw-t@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "vr_flw", "public");
    await v_979e03(v_6e0fd3, v_baf950);
    const v_21cc31 = await v_86c39f(v_baf950);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { clone: { viewerRole: string | null } };
    v_4d37e3(v_4d33b2.clone.viewerRole).toBe("follower");
  });

  v_23805a("viewerRole = null for anonymous on public clone", async () => {
    const v_1badb6 = await v_bfb240("vr-anon-o@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "vr_anon", "public");
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}`);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { clone: { viewerRole: string | null } };
    v_4d37e3(v_4d33b2.clone.viewerRole).toBeNull();
  });
});

v_469bf2("clones search route — stats 객체 통일", () => {
  v_23805a("GET /oth-path — item.stats = {followers, messages, gifts}", async () => {
    const v_1badb6 = await v_bfb240("search-o@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "search_clone", "public");

    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path?q=search_clone`,
    );
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as {
      items: Array<{
        id: number;
        name: string;
        username: string;
        cloneType: string;
        avatarUrl: string | null;
        stats: { followers: number; messages: number; gifts: number };
        createdAt: string;
      }>;
      nextCursor: string | null;
    };
    const v_8c0b26 = v_4d33b2.items.find((v_ebec57) => v_ebec57.id === v_6e0fd3);
    v_4d37e3(v_8c0b26).toBeDefined();
    v_4d37e3(v_8c0b26!.stats).toEqual({ followers: 0, messages: 0, gifts: 0 });

    v_4d37e3((v_8c0b26 as unknown as { followersCount?: number }).followersCount).toBeUndefined();
  });
});
