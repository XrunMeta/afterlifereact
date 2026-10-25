import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_8cf86b } from "../src/lib/utils";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_38cec9(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_bfb240(v_e0c7e8, v_1833e7 = null): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', ?, CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, v_1833e7)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_fb3621<T>(v_9fe22d, v_21cc31): Promise<{ status: number; body: T }> {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost${v_9fe22d}`, { headers: { Authorization: `Bearer ${v_21cc31}` } });
  return { status: v_8f00b9.status, body: (await v_8f00b9.json()) as T };
}

type Person = { id?: number; userId?: number; email: string | null };

v_469bf2("남의 이메일 마스킹", () => {
  v_23805a("maskEmail — 로컬파트 앞 3자 + ***", () => {
    v_4d37e3(v_8cf86b("abcdef@x.com")).toBe("abc***");
    v_4d37e3(v_8cf86b("ab@x.com")).toBe("ab***");
    v_4d37e3(v_8cf86b(null)).toBeNull();
  });

  v_23805a("팔로워·팔로잉 목록은 마스킹", async () => {
    const v_b32680 = await v_bfb240("mask-me1@test.local");
    const v_f3fbb7 = await v_bfb240("fanuser1@test.local");
    await v_a1651b().prepare("INSERT INTO user_follows (follower_id, followee_id) VALUES (?, ?)").bind(v_f3fbb7, v_b32680).run();
    const v_21cc31 = await v_38cec9(v_b32680);

    const v_823f08 = await v_fb3621<{ items: Person[] }>(`/oth-path${v_b32680}/followers`, v_21cc31);
    v_4d37e3(v_823f08.status).toBe(200);
    v_4d37e3(v_823f08.body.items.map((v_ebec57) => v_ebec57.email)).toEqual(["fan***"]);

    const v_ba3f04 = await v_fb3621<{ items: Person[] }>(`/oth-path${v_f3fbb7}/following`, v_21cc31);
    v_4d37e3(v_ba3f04.body.items.map((v_ebec57) => v_ebec57.email)).toEqual(["mas***"]);
  });

  v_23805a("남의 프로필은 마스킹, 본인 프로필은 전체", async () => {
    const v_b32680 = await v_bfb240("mask-me2@test.local");
    const v_a9cbf1 = await v_bfb240("otherguy2@test.local");
    const v_21cc31 = await v_38cec9(v_b32680);

    const v_6cc797 = await v_fb3621<{ user: Person }>(`/oth-path${v_a9cbf1}`, v_21cc31);
    v_4d37e3(v_6cc797.body.user.email).toBe("oth***");
    const v_1c1268 = await v_fb3621<{ user: Person }>(`/oth-path${v_b32680}`, v_21cc31);
    v_4d37e3(v_1c1268.body.user.email).toBe("mask-me2@test.local");
  });

  v_23805a("검색 — 정확히 입력한 이메일만 전체, 부분 입력 결과는 마스킹", async () => {
    const v_b32680 = await v_bfb240("mask-me3@test.local");
    await v_bfb240("searchtarget3@test.local");
    const v_21cc31 = await v_38cec9(v_b32680);

    const v_17ec8d = await v_fb3621<{ items: Person[] }>(`/oth-path?q=${encodeURIComponent("searchtarget3@test.local")}`, v_21cc31);
    v_4d37e3(v_17ec8d.body.items.map((v_ebec57) => v_ebec57.email)).toContain("searchtarget3@test.local");

    const v_4628fe = await v_fb3621<{ items: Person[] }>(`/oth-path?q=searchtarget3`, v_21cc31);
    v_4d37e3(v_4628fe.body.items.length).toBeGreaterThan(0);
    v_4d37e3(v_4628fe.body.items.every((v_ebec57) => v_ebec57.email === "sea***")).toBe(true);
  });
});
