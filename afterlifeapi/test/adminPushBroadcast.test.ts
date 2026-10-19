import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_c43f8d, v_c1f9bb, v_fd26b4 } from "../src/lib/adminBroadcast";

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_21cc31(v_f91f33): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5(v_f91f33, v_43fd42, 600);
}

async function v_bfb240(v_9b82b4, v_18d480): Promise<number> {
  const v_e0c7e8 = `bcast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
  await v_a1651b()
    .prepare(
      `INSERT INTO users (email, password_hash, name, xrun_member_id, marketing_consent, created_at) VALUES (?, 'x', 'U', ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8, v_9b82b4, v_18d480)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_aa9b1e(v_4d33b2) {
  const v_020893 = await v_21cc31({ sub: 99996, kind: "access", admin: true });
  const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_020893}`, "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<Record<string, unknown>>() };
}

v_469bf2("adminBroadcast helpers", () => {
  v_23805a("야간(KST 21~08) 판정", () => {
    v_4d37e3(v_fd26b4(new Date("2026-10-19T12:00:00Z"))).toBe(true); 
    v_4d37e3(v_fd26b4(new Date("2026-10-19T22:59:00Z"))).toBe(true); 
    v_4d37e3(v_fd26b4(new Date("2026-10-19T23:00:00Z"))).toBe(false); 
    v_4d37e3(v_fd26b4(new Date("2026-10-19T11:59:00Z"))).toBe(false); 
  });

  v_23805a("광고 표기·수신거부 안내", () => {
    v_4d37e3(v_c1f9bb("이벤트", true)).toBe("(광고) 이벤트");
    v_4d37e3(v_c1f9bb("(광고) 이벤트", true)).toBe("(광고) 이벤트");
    v_4d37e3(v_c1f9bb("공지", false)).toBe("공지");
    v_4d37e3(v_c43f8d("내용", true)).toContain("수신거부");
    v_4d37e3(v_c43f8d("내용", false)).toBe("내용");
  });
});

v_469bf2("POST /oth-path", () => {
  v_23805a("공지성: 동의 무관 전원 / 광고성: 혜택 정보 수신 동의자만 (야간이면 422)", async () => {
    await v_bfb240(772001, 1);
    await v_bfb240(772002, 0);
    const v_52e08b = [772001, 772002];

    const v_d48273 = await v_aa9b1e({ title: "공지", xrunMemberIds: v_52e08b, isAd: false });
    v_4d37e3(v_d48273.status).toBe(200);
    v_4d37e3(v_d48273.json.targetUsers).toBe(2);
    v_4d37e3(v_d48273.json.skippedNoConsent).toBe(0);

    const v_ddcfed = await v_aa9b1e({ title: "이벤트", xrunMemberIds: v_52e08b, isAd: true });
    if (v_fd26b4()) {
      v_4d37e3(v_ddcfed.status).toBe(422);
    } else {
      v_4d37e3(v_ddcfed.status).toBe(200);
      v_4d37e3(v_ddcfed.json.targetUsers).toBe(1);
      v_4d37e3(v_ddcfed.json.skippedNoConsent).toBe(1);
    }
  });

  v_23805a("marketing-consented: 동의한 xrun 회원번호만 반환", async () => {
    await v_bfb240(772101, 1);
    await v_bfb240(772102, 0);
    const v_020893 = await v_21cc31({ sub: 99996, kind: "access", admin: true });
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_020893}`, "Content-Type": "application/json" },
      body: JSON.stringify({ xrunMemberIds: [772101, 772102, 772199] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3((await v_8f00b9.json<{ xrunMemberIds: number[] }>()).xrunMemberIds).toEqual([772101]);
  });

  v_23805a("제목/대상 누락 시 422, 비관리자 거부", async () => {
    v_4d37e3((await v_aa9b1e({ title: "", all: true })).status).toBe(422);
    v_4d37e3((await v_aa9b1e({ title: "x" })).status).toBe(422);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x", all: true }),
    });
    v_4d37e3(v_8f00b9.status).toBeGreaterThanOrEqual(401);
  });
});
