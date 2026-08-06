

import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
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
       VALUES (?, 'TestClone', ?, ?, 'public', CURRENT_TIMESTAMP)`
    )
    .bind(v_1badb6, v_556427, v_3a8949)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_2f0be6(v_43e90c, v_6e0fd3, v_1833e7): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
       VALUES (?, ?, ?, 'granted', ?)`
    )
    .bind(v_43e90c, v_6e0fd3, v_1833e7, Date.now())
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

async function v_2b3880(v_6e0fd3, v_ca1ec5, v_f4e98d): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  for (let v_ebec57 = 0; v_ebec57 < v_f4e98d; v_ebec57++) {
    await v_a1651b
      .prepare(
        `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
         VALUES (?, ?, ?, 'w600k_mbf', 512, 'call', ?)`
      )
      .bind(v_6e0fd3, v_ca1ec5, `vec-${v_6e0fd3}-${v_ca1ec5}-${v_ebec57}`, Date.now())
      .run();
  }
}

v_469bf2("GET /oth-path — 얼굴 메타(faceCount·isSelf)", () => {
  let v_21cc31;
  let v_6e0fd3;
  let v_79e62f;
  let v_35500c;
  let v_8ecfe9;
  let v_cda71e;

  v_ba7107(async () => {
    const v_43e90c = await v_bfb240("t257meta@x.com");
    v_21cc31 = await v_86c39f(v_43e90c);
    v_6e0fd3 = await v_4d24a9(v_43e90c, "t257meta-clone");
    v_79e62f = await v_4d24a9(v_43e90c, "t257meta-other");

    v_35500c = await v_2f0be6(v_43e90c, v_6e0fd3, "얼굴있음");
    await v_2b3880(v_6e0fd3, v_35500c, 3);

    v_8ecfe9 = await v_2f0be6(v_43e90c, v_6e0fd3, "얼굴없음");

    v_cda71e = await v_2f0be6(v_43e90c, v_6e0fd3, "제작자");
    await v_2b3880(v_6e0fd3, v_cda71e, 5);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b.prepare("UPDATE clones SET self_person_id = ? WHERE id = ?").bind(v_cda71e, v_6e0fd3).run();
  });

  v_23805a("faceCount 는 그 클론 스코프의 얼굴 개수를 센다", async () => {
    const v_cb35cb = await v_1df298.fetch(`https://x/oth-path?cloneId=${v_6e0fd3}`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_cb35cb.status).toBe(200);
    const v_4d33b2 = await v_cb35cb.json<{ data: Array<{ id: number; faceCount: number }> }>();
    const v_b6b02f = new Map(v_4d33b2.data.map((v_e2a85c) => [v_e2a85c.id, v_e2a85c]));
    v_4d37e3(v_b6b02f.get(v_35500c)?.faceCount).toBe(3);
    v_4d37e3(v_b6b02f.get(v_cda71e)?.faceCount).toBe(5);
  });

  v_23805a("얼굴이 없는 person 은 faceCount 0 (누락이 아니라 0)", async () => {
    const v_cb35cb = await v_1df298.fetch(`https://x/oth-path?cloneId=${v_6e0fd3}`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    const v_4d33b2 = await v_cb35cb.json<{ data: Array<{ id: number; faceCount: number }> }>();
    const v_3ac7e7 = v_4d33b2.data.find((v_e2a85c) => v_e2a85c.id === v_8ecfe9);
    v_4d37e3(v_3ac7e7).toBeDefined();
    v_4d37e3(v_3ac7e7!.faceCount).toBe(0);
  });

  v_23805a("isSelf 는 clones.self_person_id 와 일치하는 person 에만 true", async () => {
    const v_cb35cb = await v_1df298.fetch(`https://x/oth-path?cloneId=${v_6e0fd3}`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    const v_4d33b2 = await v_cb35cb.json<{ data: Array<{ id: number; isSelf: boolean }> }>();
    const v_b6b02f = new Map(v_4d33b2.data.map((v_e2a85c) => [v_e2a85c.id, v_e2a85c]));
    v_4d37e3(v_b6b02f.get(v_cda71e)?.isSelf).toBe(true);
    v_4d37e3(v_b6b02f.get(v_35500c)?.isSelf).toBe(false);
    v_4d37e3(v_b6b02f.get(v_8ecfe9)?.isSelf).toBe(false);
  });

  v_23805a("다른 클론의 얼굴은 세지 않는다", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    await v_a1651b
      .prepare(
        `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
         VALUES (?, ?, 'vec-cross-contamination', 'w600k_mbf', 512, 'call', ?)`
      )
      .bind(v_79e62f, v_35500c, Date.now())
      .run();

    const v_cb35cb = await v_1df298.fetch(`https://x/oth-path?cloneId=${v_6e0fd3}`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    const v_4d33b2 = await v_cb35cb.json<{ data: Array<{ id: number; faceCount: number }> }>();
    const v_3ac7e7 = v_4d33b2.data.find((v_e2a85c) => v_e2a85c.id === v_35500c);
    v_4d37e3(v_3ac7e7!.faceCount).toBe(3); 
  });

  v_23805a("cloneId 미지정 조회에서도 person 의 소속 클론 기준으로 센다", async () => {
    const v_cb35cb = await v_1df298.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_cb35cb.status).toBe(200);
    const v_4d33b2 = await v_cb35cb.json<{ data: Array<{ id: number; faceCount: number; isSelf: boolean }> }>();
    const v_b6b02f = new Map(v_4d33b2.data.map((v_e2a85c) => [v_e2a85c.id, v_e2a85c]));
    v_4d37e3(v_b6b02f.get(v_35500c)?.faceCount).toBe(3);
    v_4d37e3(v_b6b02f.get(v_cda71e)?.isSelf).toBe(true);
  });
});
