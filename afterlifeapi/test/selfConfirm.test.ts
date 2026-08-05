import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_dbed3e } from "../src/lib/faceVectors";
import { v_b2eae5 } from "../src/lib/jwt";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent, face_biometric_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1, 1)`,
    )
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427, v_3a8949 = "memlow"): Promise<number> {
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

function v_46ff7a(v_bdb39e): number[] {
  const v_81e2ef = new Array(512).fill(0);
  v_81e2ef[v_bdb39e % 512] = 1;
  return v_81e2ef;
}

async function v_182fdb(v_e0c7e8): Promise<string> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_ceb55a!.id, kind: "access" }, v_43fd42, 60 * 10);
}

v_469bf2("POST /oth-path", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  v_23805a("3벡터 확정 시 clones.self_person_id 가 설정된다", async () => {
    const v_43e90c = await v_bfb240("t257f@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257f-clone");
    const v_21cc31 = await v_182fdb("t257f@x.com");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vectors: [v_46ff7a(3), v_46ff7a(3), v_46ff7a(3)], displayName: "제작자" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ personId: number; selfPersonId: number }>();
    v_4d37e3(v_4d33b2.personId).toBe(v_4d33b2.selfPersonId);

    const v_eb25ce = await v_a1651b
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(v_6e0fd3)
      .first<{ self_person_id: number | null }>();
    v_4d37e3(v_eb25ce?.self_person_id).toBe(v_4d33b2.personId);

    const v_550b91 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE clone_id = ? AND source = 'self'")
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_550b91?.n).toBe(3);
  });

  v_23805a("이미 self가 확정된 클론은 409", async () => {
    const v_43e90c = await v_bfb240("t257g@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257g-clone");
    const v_21cc31 = await v_182fdb("t257g@x.com");

    const v_3f4675 = { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` };
    await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: v_3f4675,
      body: JSON.stringify({ vectors: [v_46ff7a(4), v_46ff7a(4), v_46ff7a(4)] }),
    });
    const v_486a80 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: v_3f4675,
      body: JSON.stringify({ vectors: [v_46ff7a(5), v_46ff7a(5), v_46ff7a(5)] }),
    });
    v_4d37e3(v_486a80.status).toBe(409);
  });

  v_23805a("전문가 클론은 422 — self 개념이 없다", async () => {
    const v_43e90c = await v_bfb240("t257h@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257h-clone", "expert");
    const v_21cc31 = await v_182fdb("t257h@x.com");

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vectors: [v_46ff7a(6), v_46ff7a(6), v_46ff7a(6)] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("벡터가 3개가 아니면 422", async () => {
    const v_43e90c = await v_bfb240("t257i@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257i-clone");
    const v_21cc31 = await v_182fdb("t257i@x.com");

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vectors: [v_46ff7a(7), v_46ff7a(7)] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });
});
