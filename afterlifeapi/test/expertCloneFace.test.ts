import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b2eae5 } from "../src/lib/jwt";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1)`,
    )
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427, v_3a8949): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427, v_3a8949)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_182fdb(v_e0c7e8): Promise<string> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_ceb55a!.id, kind: "access" }, v_43fd42, 60 * 10);
}

v_469bf2("전문가 클론 얼굴 정책", () => {
  v_23805a("개인 클론은 faceIdentifyEnabled=true", async () => {
    const v_43e90c = await v_bfb240("t257j@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257j-clone", "memlow");
    const v_21cc31 = await v_182fdb("t257j@x.com");

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/face-policy`, {
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    const v_4d33b2 = await v_8f00b9.json<{ faceIdentifyEnabled: boolean }>();
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(v_4d33b2.faceIdentifyEnabled).toBe(true);
  });

  v_23805a("전문가 클론은 faceIdentifyEnabled=false", async () => {
    const v_1badb6 = await v_bfb240("t257k-owner@x.com");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "t257k-clone", "expert");
    await v_bfb240("t257k-guest@x.com");
    const v_21cc31 = await v_182fdb("t257k-guest@x.com");

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/face-policy`, {
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    const v_4d33b2 = await v_8f00b9.json<{ faceIdentifyEnabled: boolean }>();
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(v_4d33b2.faceIdentifyEnabled).toBe(false);
  });

  v_23805a("존재하지 않는 클론은 404", async () => {
    const v_43e90c = await v_bfb240("t257m@x.com");
    const v_21cc31 = await v_182fdb("t257m@x.com");

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path`, {
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
    void v_43e90c;
  });

  v_23805a("cloneId가 잘못되면 422", async () => {
    const v_43e90c = await v_bfb240("t257n@x.com");
    const v_21cc31 = await v_182fdb("t257n@x.com");

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path`, {
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
    void v_43e90c;
  });

  v_23805a("전문가 클론은 재통화 시 같은 L2′를 재사용한다", async () => {
    const v_1badb6 = await v_bfb240("t257l-owner@x.com");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "t257l-clone", "expert");
    const v_37944d = await v_bfb240("t257l-guest@x.com");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    const { ensureAccountPerson: v_840775 } = await import("../src/lib/cloneFaceScope");
    const v_ea719c = await v_840775(v_c9c489 as never, { userId: v_37944d, cloneId: v_6e0fd3 });
    const v_486a80 = await v_840775(v_c9c489 as never, { userId: v_37944d, cloneId: v_6e0fd3 });
    v_4d37e3(v_486a80).toBe(v_ea719c);

    const v_f4e98d = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM persons WHERE user_id = ? AND clone_id = ?")
      .bind(v_37944d, v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_f4e98d?.n).toBe(1);

    const v_550b91 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE clone_id = ?")
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_550b91?.n).toBe(0);
  });
});
