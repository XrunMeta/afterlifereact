import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_dbed3e } from "../src/lib/faceVectors";
import { v_54846c } from "../src/lib/password";

const v_8c880b = "Testpw1234";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_598405 = await v_54846c(v_8c880b);
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent)
       VALUES (?, ?, 'U', CURRENT_TIMESTAMP, 1)`,
    )
    .bind(v_e0c7e8, v_598405)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_f86d7a(v_43e90c, v_6e0fd3, v_1833e7): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_5c2f9f = Date.now();
  const v_43af15 = await v_a1651b
    .prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
       VALUES (?, ?, ?, 'granted', ?)`,
    )
    .bind(v_43e90c, v_6e0fd3, v_1833e7, v_5c2f9f)
    .run();
  const v_ca1ec5 = v_43af15.meta.last_row_id as number;
  await v_a1651b
    .prepare(
      `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', unixepoch())`,
    )
    .bind(v_6e0fd3, v_ca1ec5)
    .run();
  return v_ca1ec5;
}

async function v_182fdb(v_e0c7e8): Promise<string> {
  const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: v_e0c7e8, password: v_8c880b }),
  });
  const v_b75e36 = await v_8f00b9.json<{ accessToken: string }>();
  return v_b75e36.accessToken;
}

v_469bf2("나를 기억하는 클론", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  v_23805a("L2′가 있는 클론이 목록에 나온다", async () => {
    const v_43e90c = await v_bfb240("t257m@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257m-clone");
    await v_f86d7a(v_43e90c, v_6e0fd3, "나");
    const v_21cc31 = await v_182fdb("t257m@x.com");

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    const v_4d33b2 = await v_8f00b9.json<{ clones: { cloneId: number }[] }>();
    v_4d37e3(v_4d33b2.clones.map((v_62c214) => v_62c214.cloneId)).toContain(v_6e0fd3);
  });

  v_23805a("self L2′는 목록에서 제외된다", async () => {
    const v_43e90c = await v_bfb240("t257n@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257n-clone");
    const v_7019c8 = await v_f86d7a(v_43e90c, v_6e0fd3, "제작자");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b.prepare("UPDATE clones SET self_person_id = ? WHERE id = ?").bind(v_7019c8, v_6e0fd3).run();
    const v_21cc31 = await v_182fdb("t257n@x.com");

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    const v_4d33b2 = await v_8f00b9.json<{ clones: { cloneId: number }[] }>();
    v_4d37e3(v_4d33b2.clones.map((v_62c214) => v_62c214.cloneId)).not.toContain(v_6e0fd3);
  });

  v_23805a("지우기는 L2′와 person을 함께 삭제한다", async () => {
    const v_43e90c = await v_bfb240("t257o@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257o-clone");
    const v_ca1ec5 = await v_f86d7a(v_43e90c, v_6e0fd3, "지울사람");
    const v_21cc31 = await v_182fdb("t257o@x.com");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);

    const v_d94e57 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
      .bind(v_6e0fd3, v_ca1ec5)
      .first<{ n: number }>();
    v_4d37e3(v_d94e57?.n).toBe(0);

    const v_306a28 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM persons WHERE id = ?")
      .bind(v_ca1ec5)
      .first<{ n: number }>();
    v_4d37e3(v_306a28?.n).toBe(0);
  });

  v_23805a("존재하지 않는 cloneId를 지워도 에러 없이 0건을 반환한다(멱등)", async () => {
    const v_43e90c = await v_bfb240("t257p@x.com");
    const v_21cc31 = await v_182fdb("t257p@x.com");

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "DELETE",
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ deletedPersons: number; deletedVectors: number }>();
    v_4d37e3(v_4d33b2.deletedPersons).toBe(0);
    v_4d37e3(v_4d33b2.deletedVectors).toBe(0);
  });

  v_23805a("잘못된 cloneId는 422를 반환한다", async () => {
    const v_43e90c = await v_bfb240("t257q@x.com");
    const v_21cc31 = await v_182fdb("t257q@x.com");

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "DELETE",
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("[지우기]는 self person과 그 clone_person_faces는 보존한다(비-self만 삭제)", async () => {
    const v_43e90c = await v_bfb240("t257s@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257s-clone");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    const v_7019c8 = await v_f86d7a(v_43e90c, v_6e0fd3, "제작자self");
    await v_a1651b.prepare("UPDATE clones SET self_person_id = ? WHERE id = ?").bind(v_7019c8, v_6e0fd3).run();
    await v_a1651b
      .prepare(
        `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
         VALUES (?, ?, ?, 'w600k_mbf', 512, 'self', ?)`,
      )
      .bind(v_6e0fd3, v_7019c8, "vec-self-1", Date.now())
      .run();

    const v_912627 = await v_f86d7a(v_43e90c, v_6e0fd3, "친구P2");
    await v_a1651b
      .prepare(
        `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
         VALUES (?, ?, ?, 'w600k_mbf', 512, 'enroll', ?)`,
      )
      .bind(v_6e0fd3, v_912627, "vec-other-1", Date.now())
      .run();

    const v_21cc31 = await v_182fdb("t257s@x.com");
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ deletedPersons: number }>();
    v_4d37e3(v_4d33b2.deletedPersons).toBe(1); 

    const v_e1d594 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM persons WHERE id = ?")
      .bind(v_7019c8)
      .first<{ n: number }>();
    v_4d37e3(v_e1d594?.n).toBe(1);

    const v_0576a4 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE person_id = ?")
      .bind(v_7019c8)
      .first<{ n: number }>();
    v_4d37e3(v_0576a4?.n).toBe(1);

    const v_eb25ce = await v_a1651b
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(v_6e0fd3)
      .first<{ self_person_id: number | null }>();
    v_4d37e3(v_eb25ce?.self_person_id).toBe(v_7019c8);

    const v_a9cbf1 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM persons WHERE id = ?")
      .bind(v_912627)
      .first<{ n: number }>();
    v_4d37e3(v_a9cbf1?.n).toBe(0);
  });

  v_23805a("같은 클론을 두 번 지워도 에러 없이 멱등하다", async () => {
    const v_43e90c = await v_bfb240("t257r@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257r-clone");
    await v_f86d7a(v_43e90c, v_6e0fd3, "지울사람2");
    const v_21cc31 = await v_182fdb("t257r@x.com");

    const v_ea719c = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_ea719c.status).toBe(200);

    const v_486a80 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_486a80.status).toBe(200);
    const v_4d33b2 = await v_486a80.json<{ deletedPersons: number; deletedVectors: number }>();
    v_4d37e3(v_4d33b2.deletedPersons).toBe(0);
  });
});

v_469bf2("페르소나 삭제 → 얼굴 기억 삭제", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  v_23805a("주인이 페르소나를 지우면 다른 사용자의 기억도 지워지고 목록에서 사라진다", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("t1021-owner@x.com");
    const v_013af2 = await v_bfb240("t1021-viewer@x.com");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "t1021-clone");
    await v_f86d7a(v_013af2, v_6e0fd3, "뷰어");
    await v_f86d7a(v_1badb6, v_6e0fd3, "주인");

    const v_5294e1 = await v_182fdb("t1021-owner@x.com");
    const v_d0ca5b = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${v_5294e1}` },
    });
    v_4d37e3(v_d0ca5b.status).toBe(200);

    const v_dbaa7f = await v_a1651b.prepare("SELECT COUNT(*) AS n FROM persons WHERE clone_id = ?").bind(v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_dbaa7f?.n).toBe(0);
    const v_d94e57 = await v_a1651b.prepare("SELECT COUNT(*) AS n FROM clone_ont_person WHERE clone_id = ?").bind(v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_d94e57?.n).toBe(0);

    const v_7d0764 = await v_182fdb("t1021-viewer@x.com");
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      headers: { authorization: `Bearer ${v_7d0764}` },
    });
    const v_b75e36 = await v_8f00b9.json<{ clones: Array<{ cloneId: number }> }>();
    v_4d37e3(v_b75e36.clones.find((v_3f4e2e) => v_3f4e2e.cloneId === v_6e0fd3)).toBeUndefined();
  });

  v_23805a("이미 삭제된 페르소나에 남은 기억도 목록에 나오지 않는다", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("t1021b-owner@x.com");
    const v_013af2 = await v_bfb240("t1021b-viewer@x.com");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "t1021b-clone");
    await v_f86d7a(v_013af2, v_6e0fd3, "뷰어");
    await v_a1651b
      .prepare("UPDATE clones SET deletion_state = 'soft_deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(v_6e0fd3)
      .run();
    const v_7d0764 = await v_182fdb("t1021b-viewer@x.com");
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      headers: { authorization: `Bearer ${v_7d0764}` },
    });
    const v_b75e36 = await v_8f00b9.json<{ clones: Array<{ cloneId: number }> }>();
    v_4d37e3(v_b75e36.clones.find((v_3f4e2e) => v_3f4e2e.cloneId === v_6e0fd3)).toBeUndefined();
  });
});
