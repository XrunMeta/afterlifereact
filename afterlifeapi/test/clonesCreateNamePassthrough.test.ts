

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

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_39eaf5(v_21cc31, v_1833e7, v_556427) {
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${v_21cc31}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `t219-${v_556427}-${Date.now()}-${Math.random()}`,
    },
    body: JSON.stringify({
      name: v_1833e7,
      username: v_556427,
      clone_type: "friend",
      visibility: "public",
    }),
  });
}

v_469bf2("T-219 clone name pass-through", () => {
  v_ba7107(async () => {
    if (!(await v_2e4ad6())) {
      throw new Error("D1 migrations not applied.");
    }
  });

  v_23805a("한국어 이름을 그대로 저장한다", async () => {
    const v_0c8987 = await v_bfb240("t219-ko@test.local");
    const v_21cc31 = await v_86c39f(v_0c8987);
    const v_8f00b9 = await v_39eaf5(v_21cc31, "별이", "t219_star");
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_4d33b2 = (await v_8f00b9.json()) as { clone: { name: string; username: string } };
    v_4d37e3(v_4d33b2.clone.name).toBe("별이");
    v_4d37e3(v_4d33b2.clone.username).toBe("t219_star");
  });

  v_23805a("공백/특수문자 포함 이름을 그대로 저장한다 (trim 등의 조용한 가공 없음)", async () => {
    const v_0c8987 = await v_bfb240("t219-special@test.local");
    const v_21cc31 = await v_86c39f(v_0c8987);

    const v_479f05 = "할머니 · 모리 (2대)";
    const v_8f00b9 = await v_39eaf5(v_21cc31, v_479f05, "t219_special");
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_4d33b2 = (await v_8f00b9.json()) as { clone: { name: string } };
    v_4d37e3(v_4d33b2.clone.name).toBe(v_479f05);
  });

  v_23805a("이모지 이름을 그대로 저장한다", async () => {
    const v_0c8987 = await v_bfb240("t219-emoji@test.local");
    const v_21cc31 = await v_86c39f(v_0c8987);
    const v_8f00b9 = await v_39eaf5(v_21cc31, "🌟 별이", "t219_emoji");
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_4d33b2 = (await v_8f00b9.json()) as { clone: { name: string } };
    v_4d37e3(v_4d33b2.clone.name).toBe("🌟 별이");
  });

  v_23805a("DB 저장값도 요청값과 100% 일치한다 (트리거·마이그로 인한 조용한 변형 방지)", async () => {
    const v_0c8987 = await v_bfb240("t219-db@test.local");
    const v_21cc31 = await v_86c39f(v_0c8987);
    const v_8f00b9 = await v_39eaf5(v_21cc31, "미주", "t219_db");
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_4d33b2 = (await v_8f00b9.json()) as { clone: { id: number } };
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT name FROM clones WHERE id = ?")
      .bind(v_4d33b2.clone.id)
      .first<{ name: string }>();
    v_4d37e3(v_3ac7e7?.name).toBe("미주");
  });
});
