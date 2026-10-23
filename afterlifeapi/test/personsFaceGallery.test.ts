import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_4e7b87(v_ea333d, v_6e0fd3): Promise<number> {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ cloneId: v_6e0fd3 }),
  });
  const { id: v_389afb } = (await v_8f00b9.json()) as { id: number };
  return v_389afb;
}

async function v_a56201(v_ea333d, v_ca1ec5) {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/consent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ state: "granted" }),
  });
  v_4d37e3(v_8f00b9.status).toBe(200);
}

async function v_eb0ef3(v_ea333d, v_43e90c, v_6e0fd3, v_ca1ec5, v_f9a45c) {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/faces`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ cloneId: v_6e0fd3, vectors: [v_f9a45c] }),
  });
  v_4d37e3(v_8f00b9.status).toBe(200);

  void v_43e90c;
}

function v_46ff7a(v_4a1c36 = 0.1): number[] {
  return Array(512).fill(v_4a1c36);
}

function v_a4bfae(): number[] {
  return Array.from({ length: 512 }, (v_37eab7, v_ebec57) => (v_ebec57 < 256 ? 1 : -1));
}

async function v_41026d(v_ea333d, v_6e0fd3) {
  return v_1df298.fetch(`http://localhost/oth-path?cloneId=${v_6e0fd3}`, {
    headers: { Authorization: `Bearer ${v_ea333d}` },
  });
}

type Gallery = {
  cloneId: number;
  threshold: number;
  persons: { personId: number; displayName: string | null; vectors: number[][]; landmarkRatiosList: unknown[] }[];
};

v_469bf2("GET /oth-path", () => {
  v_23805a("이 클론에 등록한 내 사람들의 벡터를 사람별로 돌려준다", async () => {
    const v_43e90c = await v_bfb240("gallery-own@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "gallery-own-clone");
    const v_5b6e4b = await v_4e7b87(v_ea333d, v_6e0fd3);
    await v_a56201(v_ea333d, v_5b6e4b);
    await v_eb0ef3(v_ea333d, v_43e90c, v_6e0fd3, v_5b6e4b, v_46ff7a(0.1));
    await v_eb0ef3(v_ea333d, v_43e90c, v_6e0fd3, v_5b6e4b, v_a4bfae());
    const v_8f00b9 = await v_41026d(v_ea333d, v_6e0fd3);
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(v_8f00b9.headers.get("Cache-Control")).toBe("no-store");
    const v_4d33b2 = (await v_8f00b9.json()) as Gallery;
    v_4d37e3(v_4d33b2.cloneId).toBe(v_6e0fd3);
    v_4d37e3(typeof v_4d33b2.threshold).toBe("number");
    v_4d37e3(v_4d33b2.persons).toHaveLength(1);
    v_4d37e3(v_4d33b2.persons[0].personId).toBe(v_5b6e4b);
    v_4d37e3(v_4d33b2.persons[0].vectors).toHaveLength(2);
    v_4d37e3(v_4d33b2.persons[0].vectors[0]).toHaveLength(512);
    v_4d37e3(v_4d33b2.persons[0].landmarkRatiosList).toHaveLength(2);
  });

  v_23805a("다른 사용자·다른 클론의 사람은 섞이지 않는다", async () => {
    const v_779914 = await v_bfb240("gallery-a@test.local");
    const v_148ff6 = await v_bfb240("gallery-b@test.local");
    const v_51937d = await v_86c39f(v_779914);
    const v_c3c9ed = await v_86c39f(v_148ff6);
    const v_023785 = await v_4d24a9(v_779914, "gallery-scope-1");
    const v_f1a970 = await v_4d24a9(v_779914, "gallery-scope-2");
    const v_384b8e = await v_4e7b87(v_51937d, v_023785);
    await v_a56201(v_51937d, v_384b8e);
    await v_eb0ef3(v_51937d, v_779914, v_023785, v_384b8e, v_46ff7a(0.2));
    const v_afe362 = await v_4e7b87(v_51937d, v_f1a970);
    await v_a56201(v_51937d, v_afe362);
    await v_eb0ef3(v_51937d, v_779914, v_f1a970, v_afe362, v_46ff7a(0.3));
    const v_4f321c = await v_4e7b87(v_c3c9ed, v_023785);
    await v_a56201(v_c3c9ed, v_4f321c);
    await v_eb0ef3(v_c3c9ed, v_148ff6, v_023785, v_4f321c, v_46ff7a(0.4));

    const v_57bbc9 = (await (await v_41026d(v_51937d, v_023785)).json()) as Gallery;
    v_4d37e3(v_57bbc9.persons.map((v_e2a85c) => v_e2a85c.personId)).toEqual([v_384b8e]);
    const v_6fd84c = (await (await v_41026d(v_c3c9ed, v_023785)).json()) as Gallery;
    v_4d37e3(v_6fd84c.persons.map((v_e2a85c) => v_e2a85c.personId)).toEqual([v_4f321c]);
  });

  v_23805a("등록한 사람이 없으면 빈 목록", async () => {
    const v_ceb55a = await v_bfb240("gallery-empty@test.local");
    const v_ea333d = await v_86c39f(v_ceb55a);
    const v_6e0fd3 = await v_4d24a9(v_ceb55a, "gallery-empty-clone");
    const v_4d33b2 = (await (await v_41026d(v_ea333d, v_6e0fd3)).json()) as Gallery;
    v_4d37e3(v_4d33b2.persons).toEqual([]);
  });

  v_23805a("cloneId 가 잘못되면 422(VALIDATION_FAILED), 없는 클론이면 404", async () => {
    const v_ceb55a = await v_bfb240("gallery-bad@test.local");
    const v_ea333d = await v_86c39f(v_ceb55a);
    v_4d37e3((await v_41026d(v_ea333d, "abc")).status).toBe(422);
    v_4d37e3((await v_41026d(v_ea333d, 99999999)).status).toBe(404);
  });

  v_23805a("인증이 없으면 401", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path?cloneId=1");
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});
