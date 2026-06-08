import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

let v_1923e2 = 0;
async function v_bfb240(): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_e0c7e8 = `mr-${v_1923e2}-${(v_1923e2 * 7919) % 100000}@test.local`;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_21cc31(v_43e90c, v_b7f2b4 = false): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing");
  return await v_b2eae5({ sub: v_43e90c, kind: "access", admin: v_b7f2b4 }, v_43fd42, 600);
}

function v_309144(v_9fe22d, v_8d41d7, v_bfe9b9 = "GET", v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
    body: v_4d33b2 ? JSON.stringify(v_4d33b2) : undefined,
  });
}

v_469bf2("내 신고 — made / received", () => {
  v_ba7107(async () => {
    try {
      await (v_c9c489.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM user_reports").first();
    } catch {
      throw new Error("D1 migrations not applied.");
    }
  });

  v_23805a("신고 접수 → made 에 대기중, 관리자 수락 → made 수락됨 + received 노출", async () => {
    const v_4e6894 = await v_bfb240();
    const v_5f5d6d = await v_bfb240();
    const v_956b49 = await v_21cc31(v_4e6894);

    v_4d37e3((await v_309144(`/oth-path${v_5f5d6d}/report`, v_956b49, "POST", { reason: "스팸" })).status).toBe(200);

    let v_51146d = (await (await v_309144(`/oth-path`, v_956b49)).json()) as {
      items: Array<{ status: string; targetId: number; reason: string | null }>;
    };
    const v_1c1268 = v_51146d.items.find((v_62c214) => v_62c214.targetId === v_5f5d6d);
    v_4d37e3(v_1c1268).toBeTruthy();
    v_4d37e3(v_1c1268!.status).toBe("open");

    const v_aac801 = await v_21cc31(v_5f5d6d);
    let v_ed7fe5 = (await (await v_309144(`/oth-path`, v_aac801)).json()) as {
      items: Array<{ adminMessage: string | null }>;
      warningCount: number;
    };
    v_4d37e3(v_ed7fe5.items.length).toBe(0);

    const v_99000e = (
      (await (await v_309144(`/oth-path`, v_956b49)).json()) as { items: Array<{ id: number; targetId: number }> }
    ).items.find((v_62c214) => v_62c214.targetId === v_5f5d6d)!.id;
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);
    const v_7a8f8e = "신고가 확인되어 경고합니다.";
    v_4d37e3(
      (await v_309144(`/oth-path${v_5f5d6d}/warn`, v_b7f2b4, "POST", { reportId: v_99000e, reason: v_7a8f8e })).status,
    ).toBe(200);

    v_51146d = (await (await v_309144(`/oth-path`, v_956b49)).json()) as {
      items: Array<{ status: string; targetId: number; adminMessage: string | null }>;
    };
    const v_e69b90 = v_51146d.items.find((v_62c214) => v_62c214.targetId === v_5f5d6d)!;
    v_4d37e3(v_e69b90.status).toBe("actioned");
    v_4d37e3(v_e69b90.adminMessage).toBe(v_7a8f8e);

    v_ed7fe5 = (await (await v_309144(`/oth-path`, v_aac801)).json()) as {
      items: Array<{ adminMessage: string | null }>;
      warningCount: number;
    };
    v_4d37e3(v_ed7fe5.items.length).toBe(1);
    v_4d37e3(v_ed7fe5.warningCount).toBe(1);
    v_4d37e3(v_ed7fe5.items[0].adminMessage).toBe(v_7a8f8e);
  });
});
