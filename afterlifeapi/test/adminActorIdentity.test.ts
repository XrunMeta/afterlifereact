import { v_469bf2, v_23805a, v_4d37e3, v_ff107d, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d, v_5069a9 } from "lwkoweqmjbnvjqw";
import v_cfaf0e from "../src/index";

const v_e6906f = "https://console2.example.invalid";
const v_cafb6f = new URL((v_c9c489 as unknown as { XRUN_API_URL: string }).XRUN_API_URL).origin;
const v_c977a8 = 777;
const v_50f9d3 = "boss@xrun.test";

let v_1923e2 = 0;
function v_76e4f8(): string {
  v_1923e2 += 1;
  return `aaa.tok${Date.now()}x${v_1923e2}.ccc`;
}

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

function v_7bfcb1(v_21cc31, v_d308b5 = 200) {
  v_8fd90d
    .get(v_cafb6f)
    .intercept({ path: "/oth-path", method: "GET", headers: { Authorization: `Bearer ${v_21cc31}` } })
    .reply(v_d308b5, v_d308b5 === 200 ? { success: true, data: { member: v_c977a8, email: v_50f9d3, type: 1 } } : { success: false });
}

function v_b7f2b4(v_9fe22d, v_bfe9b9, v_4d33b2, v_21cc31): Promise<Response> {
  return v_1df298.fetch(`http://localhost/oth-path${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: {
      "Content-Type": "application/json",
      Origin: v_e6906f,
      ...(v_21cc31 ? { "X-Xrun-Admin-Token": v_21cc31 } : {}),
    },
    body: v_4d33b2 === undefined ? undefined : JSON.stringify(v_4d33b2),
  });
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b().prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`).bind(v_e0c7e8).run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'C', ?, 'friend', 'public', CURRENT_TIMESTAMP)`)
    .bind(v_1badb6, v_556427)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

const v_3024fa = "운영정책 위반으로 비활성화합니다";

v_469bf2("XRUN 관리자 신원 확인", () => {
  v_ff107d(() => {
    v_8fd90d.activate();
    v_8fd90d.disableNetConnect();
  });
  v_719203(() => {
    v_8fd90d.assertNoPendingInterceptors();
    v_8fd90d.deactivate();
  });

  v_23805a("토큰 확인되면 비활성화·복구 통과, 감사 로그에 XRUN 관리자로 남음 + 캐시로 재확인 안 함", async () => {
    const v_257b90 = await v_bfb240(`actor-owner-${Date.now()}@test.local`);
    const v_6e0fd3 = await v_4d24a9(v_257b90, `actor_clone_${Date.now()}`);
    const v_21cc31 = v_76e4f8();
    v_7bfcb1(v_21cc31); 

    const v_fa04a0 = await v_b7f2b4(`/oth-path${v_6e0fd3}/disable`, "POST", { reason: v_3024fa }, v_21cc31);
    v_4d37e3(v_fa04a0.status).toBe(200);
    const v_3ac7e7 = await v_a1651b()
      .prepare(`SELECT admin_suspended_at AS at, deletion_state AS st FROM clones WHERE id = ?`)
      .bind(v_6e0fd3)
      .first<{ at: string | null; st: string }>();
    v_4d37e3(v_3ac7e7?.at).toBeTruthy();
    v_4d37e3(v_3ac7e7?.st).toBe("active");

    const v_abacaa = await v_b7f2b4(`/oth-path${v_6e0fd3}/activate`, "POST", undefined, v_21cc31);
    v_4d37e3(v_abacaa.status).toBe(200);

    const v_4fc7c6 = await v_a1651b()
      .prepare(`SELECT actor_id AS id FROM decryption_audit_log WHERE resource_id = ? AND op = 'disable' ORDER BY id DESC LIMIT 1`)
      .bind(String(v_6e0fd3))
      .first<{ id: string }>();
    v_4d37e3(v_4fc7c6?.id).toBe(`xrun:${v_c977a8}`);
  });

  v_23805a("토큰 없음·거절된 토큰·XRUN 장애는 401 — Origin 만으로는 통과 못 함", async () => {
    const v_257b90 = await v_bfb240(`actor-owner2-${Date.now()}@test.local`);
    const v_6e0fd3 = await v_4d24a9(v_257b90, `actor_clone2_${Date.now()}`);

    v_4d37e3((await v_b7f2b4(`/oth-path${v_6e0fd3}/disable`, "POST", { reason: v_3024fa })).status).toBe(401);

    const v_0af197 = v_76e4f8();
    v_7bfcb1(v_0af197, 401);
    v_4d37e3((await v_b7f2b4(`/oth-path${v_6e0fd3}/disable`, "POST", { reason: v_3024fa }, v_0af197)).status).toBe(401);

    const v_a86deb = v_76e4f8();
    v_7bfcb1(v_a86deb, 503);
    v_4d37e3((await v_b7f2b4(`/oth-path${v_6e0fd3}/disable`, "POST", { reason: v_3024fa }, v_a86deb)).status).toBe(401);

    const v_3ac7e7 = await v_a1651b().prepare(`SELECT admin_suspended_at AS at FROM clones WHERE id = ?`).bind(v_6e0fd3).first<{ at: string | null }>();
    v_4d37e3(v_3ac7e7?.at).toBeNull();
  });

  v_23805a("XRUN 번호가 같은 번호의 super_admin 으로 잡히지 않음 — super_admin 전용 API 는 계속 401", async () => {
    await v_a1651b()
      .prepare(`INSERT OR REPLACE INTO admin_users (id, email, password_hash, role, is_active) VALUES (?, ?, 'x', 'super_admin', 1)`)
      .bind(v_c977a8, "same-number@afterlife.test")
      .run();
    const v_21cc31 = v_76e4f8();
    v_7bfcb1(v_21cc31);
    const v_8f00b9 = await v_b7f2b4(`/system-persona`, "PUT", { text: "x" }, v_21cc31);
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("제재·신고 처리 기록에 실제 관리자 번호가 남음", async () => {
    const v_67cd67 = Date.now();
    const v_5f5d6d = await v_bfb240(`actor-target-${v_67cd67}@test.local`);
    const v_4e6894 = await v_bfb240(`actor-reporter-${v_67cd67}@test.local`);
    const v_21cc31 = v_76e4f8();
    v_7bfcb1(v_21cc31);

    v_4d37e3((await v_b7f2b4(`/oth-path${v_5f5d6d}/apply-penalty`, "POST", { action: "warn" }, v_21cc31)).status).toBe(200);
    const v_32f7b8 = await v_a1651b().prepare(`SELECT admin_id AS a FROM user_warnings WHERE user_id = ?`).bind(v_5f5d6d).first<{ a: number }>();
    v_4d37e3(v_32f7b8?.a).toBe(v_c977a8);

    const v_3e58a1 = await v_a1651b()
      .prepare(`SELECT details FROM activity_logs WHERE user_id = ? AND action = 'moderation.penalty' ORDER BY id DESC LIMIT 1`)
      .bind(v_5f5d6d)
      .first<{ details: string }>();
    v_4d37e3(JSON.parse(v_3e58a1!.details)).toMatchObject({ penalty: "warn", adminId: v_c977a8, adminEmail: v_50f9d3 });

    await v_a1651b().prepare(`INSERT INTO user_reports (reporter_id, target_id, reason) VALUES (?, ?, 'spam')`).bind(v_4e6894, v_5f5d6d).run();
    const v_d5e9c2 = (await v_a1651b().prepare(`SELECT id FROM user_reports WHERE reporter_id = ?`).bind(v_4e6894).first<{ id: number }>())!.id;
    v_4d37e3((await v_b7f2b4(`/oth-path${v_d5e9c2}`, "PATCH", { status: "dismissed" }, v_21cc31)).status).toBe(200);
    const v_cb35cb = await v_a1651b().prepare(`SELECT reviewer_admin_id AS a, status FROM user_reports WHERE id = ?`).bind(v_d5e9c2).first<{ a: number; status: string }>();
    v_4d37e3(v_cb35cb).toMatchObject({ a: v_c977a8, status: "dismissed" });

    v_4d37e3((await v_b7f2b4(`/oth-path${v_d5e9c2}`, "PATCH", { status: "open" }, v_21cc31)).status).toBe(200);
    const v_b96973 = await v_a1651b().prepare(`SELECT reviewer_admin_id AS a FROM user_reports WHERE id = ?`).bind(v_d5e9c2).first<{ a: number | null }>();
    v_4d37e3(v_b96973?.a).toBeNull();
  });

  v_23805a("로컬 개발(development)만 토큰 없는 브릿지 요청 허용(번호 0)", async () => {
    const v_5f5d6d = await v_bfb240(`actor-legacy-${Date.now()}@test.local`);
    v_4d37e3((await v_b7f2b4(`/oth-path${v_5f5d6d}/apply-penalty`, "POST", { action: "warn" })).status).toBe(200);
    const v_32f7b8 = await v_a1651b().prepare(`SELECT admin_id AS a FROM user_warnings WHERE user_id = ?`).bind(v_5f5d6d).first<{ a: number }>();
    v_4d37e3(v_32f7b8?.a).toBe(0);
  });

  v_23805a("브라우저 preflight 가 새 헤더를 허용", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "OPTIONS",
      headers: { Origin: v_e6906f, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type,x-xrun-admin-token" },
    });
    v_4d37e3((v_8f00b9.headers.get("Access-Control-Allow-Headers") ?? "").toLowerCase()).toContain("x-xrun-admin-token");
  });

  v_469bf2.each(["production", "staging"])("배포 환경(%s) — 토큰 필수", (v_e0a4be) => {
    function v_51c3d2(v_9fe22d, v_00cfc6 = {}, v_21cc31): Promise<Response> {
      const v_309144 = new Request(`http://localhost/oth-path${v_9fe22d}`, {
        ...v_00cfc6,
        headers: {
          "Content-Type": "application/json",
          Origin: v_e6906f,
          ...(v_21cc31 ? { "X-Xrun-Admin-Token": v_21cc31 } : {}),
          ...((v_00cfc6.headers as Record<string, string>) ?? {}),
        },
      });
      return v_cfaf0e.fetch(v_309144, { ...v_c9c489, ENVIRONMENT: v_e0a4be } as never, v_5069a9());
    }

    v_23805a("Origin 만 맞는 요청은 조회·제재 모두 401, 아무것도 안 바뀜", async () => {
      const v_5f5d6d = await v_bfb240(`bridge-open-${v_e0a4be}-${Date.now()}@test.local`);
      const v_ef8ab1 = await v_51c3d2(`/report-penalty-rules`);
      v_4d37e3(v_ef8ab1.status).toBe(401);
      v_4d37e3(((await v_ef8ab1.json()) as { error: { message: string } }).error.message).toContain("관리자 로그인");
      const v_08bb80 = await v_51c3d2(`/oth-path${v_5f5d6d}/apply-penalty`, { method: "POST", body: JSON.stringify({ action: "warn" }) });
      v_4d37e3(v_08bb80.status).toBe(401);
      const v_32f7b8 = await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM user_warnings WHERE user_id = ?`).bind(v_5f5d6d).first<{ n: number }>();
      v_4d37e3(v_32f7b8?.n).toBe(0);
    });

    v_23805a("가짜 토큰·XRUN 장애도 401", async () => {
      const v_0af197 = v_76e4f8();
      v_7bfcb1(v_0af197, 401);
      v_4d37e3((await v_51c3d2(`/report-penalty-rules`, {}, v_0af197)).status).toBe(401);
      const v_a86deb = v_76e4f8();
      v_7bfcb1(v_a86deb, 503);
      v_4d37e3((await v_51c3d2(`/report-penalty-rules`, {}, v_a86deb)).status).toBe(401);

      v_4d37e3((await v_51c3d2(`/report-penalty-rules`, {}, "not-a-jwt")).status).toBe(401);
    });

    v_23805a("확인된 XRUN 관리자 토큰은 통과", async () => {
      const v_21cc31 = v_76e4f8();
      v_7bfcb1(v_21cc31);
      v_4d37e3((await v_51c3d2(`/report-penalty-rules`, {}, v_21cc31)).status).toBe(200);
    });

    v_23805a("afterlife 관리자 Bearer 는 XRUN Origin 이어도 통과, 일반 사용자 토큰은 거절", async () => {
      const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
      const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
      const v_183879 = async (v_ddc5a4) =>
        v_51c3d2(`/report-penalty-rules`, { headers: { Authorization: `Bearer ${await v_b2eae5(v_ddc5a4, v_43fd42, 600)}` } });
      v_4d37e3((await v_183879({ sub: 9301, kind: "access", admin: true })).status).toBe(200);
      v_4d37e3((await v_183879({ sub: 9302, kind: "access" })).status).toBe(403);
    });

    v_23805a("Origin 없이 토큰도 없으면 401", async () => {
      const v_309144 = new Request("http://localhost/oth-path");
      const v_8f00b9 = await v_cfaf0e.fetch(v_309144, { ...v_c9c489, ENVIRONMENT: v_e0a4be } as never, v_5069a9());
      v_4d37e3(v_8f00b9.status).toBe(401);
    });
  });
});
