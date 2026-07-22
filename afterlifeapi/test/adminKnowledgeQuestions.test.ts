import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_d72b33 = 9002; 

async function v_b2eae5(v_f91f33): Promise<string> {
  const { issueToken: v_c43006 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_c43006(v_f91f33, v_43fd42, 600);
}
async function v_dca3c3(): Promise<string> {
  return v_b2eae5({ sub: v_d72b33, kind: "access", admin: true });
}

v_ba7107(async () => {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(v_d72b33, "superadmin-kq@afterlife.test", "hashed-placeholder")
    .run();
});

async function v_309144(v_9fe22d, v_bfe9b9, v_21cc31, v_4d33b2) {
  return v_1df298.fetch(`http://localhost/oth-path${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
    body: v_4d33b2 ? JSON.stringify(v_4d33b2) : undefined,
  });
}

v_469bf2("admin knowledge-questions", () => {
  v_23805a("PUT then GET round-trips a valid schema", async () => {
    const v_21cc31 = await v_dca3c3();
    const v_4abc91 = await v_309144("knowledge-questions", "PUT", v_21cc31, {
      questions: [{ key: "job", label: "직업은?" }],
    });
    v_4d37e3(v_4abc91.status).toBe(200);
    const v_38715b = await v_309144("knowledge-questions", "GET", v_21cc31);
    v_4d37e3(v_38715b.status).toBe(200);
    const v_7ecfd1 = (await v_38715b.json()) as { questions: unknown[] };

    v_4d37e3(v_7ecfd1.questions).toEqual([
      { key: "job", label: "직업은?", slots: [{ key: "job_val", label: "직업은?" }] },
    ]);
  });

  v_23805a("PUT rejects invalid schema with 400", async () => {
    const v_21cc31 = await v_dca3c3();
    const v_4abc91 = await v_309144("knowledge-questions", "PUT", v_21cc31, {
      questions: [{ key: "job" }], 
    });
    v_4d37e3(v_4abc91.status).toBe(400);
  });
});
