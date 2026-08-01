import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

let v_1923e2 = 0;
function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_bfb240(): Promise<number> {
  v_1923e2 += 1;
  const v_e0c7e8 = `sda-${v_1923e2}-${Date.now()}@test.local`;
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6, v_818579 = "public"): Promise<number> {
  v_1923e2 += 1;
  const v_556427 = `sda_clone_${v_1923e2}`;
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'friend', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427, v_818579)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_c8e75a(v_6e0fd3): Promise<void> {
  await v_a1651b()
    .prepare(`UPDATE clones SET admin_suspended_at = CURRENT_TIMESTAMP, admin_suspend_reason = '테스트 중지' WHERE id = ?`)
    .bind(v_6e0fd3)
    .run();
}

async function v_9c78dc(v_6e0fd3, v_1badb6, v_489382): Promise<void> {
  await v_a1651b()
    .prepare(`INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')`)
    .bind(v_6e0fd3, v_1badb6, v_489382)
    .run();
}

async function v_ca221f(v_43e90c, v_e2c945): Promise<void> {
  await v_a1651b().prepare(`UPDATE users SET credits = ? WHERE id = ?`).bind(v_e2c945, v_43e90c).run();
}

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

function v_68f0aa(v_8d41d7): Record<string, string> {
  return { Authorization: `Bearer ${v_8d41d7}` };
}

v_469bf2("GET /oth-path — 직접 링크 상세", () => {
  v_23805a("타인은 403, 소유자는 200, 정상 클론은 타인도 200", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    const v_375bef = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);
    const v_983772 = await v_21cc31(v_257b90);
    const v_72c7a6 = await v_21cc31(v_1c6644);

    v_4d37e3((await v_1df298.fetch(`http://localhost/oth-path${v_7f572b}`, { headers: v_68f0aa(v_983772) })).status).toBe(200);
    v_4d37e3((await v_1df298.fetch(`http://localhost/oth-path${v_7f572b}`, { headers: v_68f0aa(v_72c7a6) })).status).toBe(403);
    v_4d37e3((await v_1df298.fetch(`http://localhost/oth-path${v_375bef}`, { headers: v_68f0aa(v_72c7a6) })).status).toBe(200);
  });

  v_23805a("coowner 도 정지 중 상세 조회 가능", async () => {
    const v_257b90 = await v_bfb240();
    const v_583293 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90, "private");
    await v_c8e75a(v_7f572b);
    await v_9c78dc(v_7f572b, v_257b90, v_583293);
    const v_930b2e = await v_21cc31(v_583293);
    v_4d37e3((await v_1df298.fetch(`http://localhost/oth-path${v_7f572b}`, { headers: v_68f0aa(v_930b2e) })).status).toBe(200);
  });
});

v_469bf2("PATCH /oth-path — 대화 기억 갱신", () => {
  async function v_ddb38c(v_6e0fd3, v_8d41d7): Promise<Response> {
    return v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/l2`, {
      method: "PATCH",
      headers: { ...v_68f0aa(v_8d41d7), "Content-Type": "application/json" },
      body: JSON.stringify({ memory_summary: "테스트 요약" }),
    });
  }

  v_23805a("타인은 403, 소유자는 200, 정상 클론은 타인도 200", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    const v_375bef = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);
    const v_983772 = await v_21cc31(v_257b90);
    const v_72c7a6 = await v_21cc31(v_1c6644);

    v_4d37e3((await v_ddb38c(v_7f572b, v_983772)).status).toBe(200);
    v_4d37e3((await v_ddb38c(v_7f572b, v_72c7a6)).status).toBe(403);
    v_4d37e3((await v_ddb38c(v_375bef, v_72c7a6)).status).toBe(200);
  });
});

v_469bf2("GET /oth-path — 개별 피드 타임라인", () => {
  v_23805a("타인은 403, 소유자는 200, 정상 클론은 타인도 200", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    const v_375bef = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);
    const v_983772 = await v_21cc31(v_257b90);
    const v_72c7a6 = await v_21cc31(v_1c6644);

    v_4d37e3((await v_1df298.fetch(`http://localhost/oth-path${v_7f572b}/oth-path`, { headers: v_68f0aa(v_983772) })).status).toBe(200);
    v_4d37e3((await v_1df298.fetch(`http://localhost/oth-path${v_7f572b}/oth-path`, { headers: v_68f0aa(v_72c7a6) })).status).toBe(403);
    v_4d37e3((await v_1df298.fetch(`http://localhost/oth-path${v_375bef}/oth-path`, { headers: v_68f0aa(v_72c7a6) })).status).toBe(200);
  });
});

v_469bf2("POST /oth-path — 클론에게 DM", () => {
  async function v_9c423d(v_6e0fd3, v_8d41d7, v_62c866): Promise<Response> {
    return v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/messages`, {
      method: "POST",
      headers: { ...v_68f0aa(v_8d41d7), "Content-Type": "application/json", "X-Idempotency-Key": v_62c866 },
      body: JSON.stringify({ content: "안녕하세요" }),
    });
  }

  v_23805a("타인은 403(크레딧 무관하게 발신 자체 차단), 소유자는 200, 정상 클론은 타인도 200", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    const v_375bef = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);
    await v_ca221f(v_257b90, 10);
    await v_ca221f(v_1c6644, 10);
    const v_983772 = await v_21cc31(v_257b90);
    const v_72c7a6 = await v_21cc31(v_1c6644);

    v_4d37e3((await v_9c423d(v_7f572b, v_983772, "sda-msg-owner-1")).status).toBe(200);
    v_4d37e3((await v_9c423d(v_7f572b, v_72c7a6, "sda-msg-stranger-1")).status).toBe(403);
    v_4d37e3((await v_9c423d(v_375bef, v_72c7a6, "sda-msg-stranger-2")).status).toBe(200);
  });

  v_23805a("stream 변형도 타인 발신 차단", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);
    const v_72c7a6 = await v_21cc31(v_1c6644);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_7f572b}/messages/stream`, {
      method: "POST",
      headers: { ...v_68f0aa(v_72c7a6), "Content-Type": "application/json", "X-Idempotency-Key": "sda-stream-1" },
      body: JSON.stringify({ content: "안녕" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });
});

v_469bf2("POST /oth-path — 선물(결제)", () => {
  async function v_63eb1c(v_6e0fd3, v_f7e120): Promise<number> {
    const v_3ac7e7 = await v_a1651b()
      .prepare(`SELECT COUNT(*) AS n FROM gift_logs WHERE clone_id = ? AND sender_user_id = ?`)
      .bind(v_6e0fd3, v_f7e120)
      .first<{ n: number }>();
    return v_3ac7e7?.n ?? 0;
  }

  v_23805a("타인이 정지 클론에 선물 시도 → 403 + gift_logs 행 생성 안 됨(결제 시작 전 차단)", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);
    await v_a1651b().prepare(`UPDATE users SET xrun_member_id = 555001 WHERE id = ?`).bind(v_1c6644).run();
    const v_72c7a6 = await v_21cc31(v_1c6644);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_7f572b}/gift`, {
      method: "POST",
      headers: { ...v_68f0aa(v_72c7a6), "Content-Type": "application/json" },
      body: JSON.stringify({ giftId: "g1", giftName: "선물", amount: 10, pin: "123456" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
    const v_4d33b2 = (await v_8f00b9.json()) as { error: { message: string } };
    v_4d37e3(v_4d33b2.error.message).toBe("일시 중지된 페르소나에는 선물할 수 없어요.");
    v_4d37e3(await v_63eb1c(v_7f572b, v_1c6644)).toBe(0);
  });

  v_23805a("coowner 는 정지 게이트를 통과한다(그 이후 결제 단계에서 별도 사유로 실패해도 무관)", async () => {
    const v_257b90 = await v_bfb240();
    const v_583293 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);
    await v_9c78dc(v_7f572b, v_257b90, v_583293);
    await v_a1651b().prepare(`UPDATE users SET xrun_member_id = 555002 WHERE id = ?`).bind(v_583293).run();
    const v_930b2e = await v_21cc31(v_583293);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_7f572b}/gift`, {
      method: "POST",
      headers: { ...v_68f0aa(v_930b2e), "Content-Type": "application/json" },
      body: JSON.stringify({ giftId: "g1", giftName: "선물", amount: 10, pin: "123456" }),
    });

    v_4d37e3(await v_63eb1c(v_7f572b, v_583293)).toBe(1);
    if (v_8f00b9.status === 403) {
      const v_4d33b2 = (await v_8f00b9.json()) as { error: { message: string } };
      v_4d37e3(v_4d33b2.error.message).not.toBe("일시 중지된 페르소나에는 선물할 수 없어요.");
    }
  });

  v_23805a("정상(비정지) 클론은 타인의 선물 시도가 결제 단계까지 그대로 진행(회귀)", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_375bef = await v_4d24a9(v_257b90);
    await v_a1651b().prepare(`UPDATE users SET xrun_member_id = 555003 WHERE id = ?`).bind(v_1c6644).run();
    const v_72c7a6 = await v_21cc31(v_1c6644);

    await v_1df298.fetch(`http://localhost/oth-path${v_375bef}/gift`, {
      method: "POST",
      headers: { ...v_68f0aa(v_72c7a6), "Content-Type": "application/json" },
      body: JSON.stringify({ giftId: "g1", giftName: "선물", amount: 10, pin: "123456" }),
    });
    v_4d37e3(await v_63eb1c(v_375bef, v_1c6644)).toBe(1);
  });
});

v_469bf2("GET /oth-path·shared·l2", () => {
  const v_d8a9e2 = ["l1", "shared", "l2"];
  for (const v_e2a85c of v_d8a9e2) {
    v_23805a(`/${v_e2a85c} — 타인은 403, 소유자는 200, 정상 클론은 타인도 200`, async () => {
      const v_257b90 = await v_bfb240();
      const v_1c6644 = await v_bfb240();
      const v_7f572b = await v_4d24a9(v_257b90);
      const v_375bef = await v_4d24a9(v_257b90);
      await v_c8e75a(v_7f572b);
      const v_983772 = await v_21cc31(v_257b90);
      const v_72c7a6 = await v_21cc31(v_1c6644);

      v_4d37e3(
        (await v_1df298.fetch(`http://localhost/oth-path${v_7f572b}/memory/${v_e2a85c}`, { headers: v_68f0aa(v_983772) })).status,
      ).toBe(200);
      v_4d37e3(
        (await v_1df298.fetch(`http://localhost/oth-path${v_7f572b}/memory/${v_e2a85c}`, { headers: v_68f0aa(v_72c7a6) })).status,
      ).toBe(403);
      v_4d37e3(
        (await v_1df298.fetch(`http://localhost/oth-path${v_375bef}/memory/${v_e2a85c}`, { headers: v_68f0aa(v_72c7a6) })).status,
      ).toBe(200);
    });
  }
});
