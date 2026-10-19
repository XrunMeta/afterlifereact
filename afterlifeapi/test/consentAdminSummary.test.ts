import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_4d2fbb = 884512;

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_21cc31(v_f91f33): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5(v_f91f33, v_43fd42, 600);
}

async function v_bfb240(): Promise<number> {
  const v_e0c7e8 = `consent-admin-${Date.now()}@test.local`;
  await v_a1651b()
    .prepare(
      `INSERT INTO users (email, password_hash, name, xrun_member_id, created_at)
       VALUES (?, 'x', 'U', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8, v_4d2fbb)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4f438a(v_9fe22d, v_9edd60, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`https://x${v_9fe22d}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_9edd60}`, "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
}

v_469bf2("동의 7종 → admin summary", () => {
  v_23805a("clone-face/marketing 저장 후 GET /oth-path 와 admin summary 에 상태·시각이 나온다", async () => {
    const v_43e90c = await v_bfb240();
    const v_9edd60 = await v_21cc31({ sub: v_43e90c, kind: "access" });

    const v_e98932 = await v_1df298.fetch("https://x/oth-path", { headers: { Authorization: `Bearer ${v_9edd60}` } });
    v_4d37e3(v_e98932.status).toBe(200);
    const v_148ff6 = await v_e98932.json<{ clone_face: { state: string }; marketing: { state: string } }>();
    v_4d37e3(v_148ff6.clone_face.state).toBe("none");
    v_4d37e3(v_148ff6.marketing.state).toBe("none");

    for (const [v_9fe22d, v_b6e533] of [
      ["/oth-path", "granted"],
      ["/oth-path", "granted"],
      ["/oth-path", "granted"],
      ["/oth-path", "granted"],
      ["/oth-path", "revoked"],
      ["/oth-path", "granted"],
    ] as const) {
      const v_cb35cb = await v_4f438a(v_9fe22d, v_9edd60, { state: v_b6e533, channel: "signup" });
      v_4d37e3(v_cb35cb.status).toBe(200);
    }

    const v_33efc5 = await v_1df298.fetch("https://x/oth-path", { headers: { Authorization: `Bearer ${v_9edd60}` } });
    const v_779914 = await v_33efc5.json<{ clone_face: { state: string; at: number | null }; marketing: { state: string } }>();
    v_4d37e3(v_779914.clone_face.state).toBe("granted");
    v_4d37e3(typeof v_779914.clone_face.at).toBe("number");
    v_4d37e3(v_779914.marketing.state).toBe("granted");

    const v_020893 = await v_21cc31({ sub: 99997, kind: "access", admin: true });
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_4d2fbb}/summary`, {
      headers: { Authorization: `Bearer ${v_020893}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_fd5f43 = await v_8f00b9.json<{ user: Record<string, number | string | null> }>();
    v_4d37e3(v_fd5f43.user).not.toBeNull();
    v_4d37e3(v_fd5f43.user.faceBiometricConsent).toBe(1);
    v_4d37e3(typeof v_fd5f43.user.faceBiometricConsentAt).toBe("number");
    v_4d37e3(v_fd5f43.user.callLearningConsent).toBe(1);
    v_4d37e3(v_fd5f43.user.locationConsent).toBe(1);
    v_4d37e3(v_fd5f43.user.marketingConsent).toBe(1);
    v_4d37e3(typeof v_fd5f43.user.marketingConsentAt).toBe("number");
    v_4d37e3(v_fd5f43.user.cloneFaceConsent).toBe(1);
    v_4d37e3(typeof v_fd5f43.user.cloneFaceConsentAt).toBe("number");
  });

  v_23805a("marketing 철회 → 0, clone-face 잘못된 state → 422", async () => {
    const v_43e90c = await v_bfb240();
    const v_9edd60 = await v_21cc31({ sub: v_43e90c, kind: "access" });
    v_4d37e3((await v_4f438a("/oth-path", v_9edd60, { state: "granted" })).status).toBe(200);
    v_4d37e3((await v_4f438a("/oth-path", v_9edd60, { state: "revoked" })).status).toBe(200);
    const v_3ac7e7 = await v_a1651b().prepare("SELECT marketing_consent AS m FROM users WHERE id = ?").bind(v_43e90c).first<{ m: number }>();
    v_4d37e3(v_3ac7e7?.m).toBe(0);
    v_4d37e3((await v_4f438a("/oth-path", v_9edd60, { state: "maybe" })).status).toBe(422);
  });
});

v_469bf2("sso-reconsent marketingConsent", () => {
  v_23805a("body.marketingConsent 를 저장하고, 미전달 시 기존 값을 유지한다", async () => {
    const v_43e90c = await v_bfb240();
    const v_9edd60 = await v_21cc31({ sub: v_43e90c, kind: "access" });
    v_4d37e3((await v_4f438a("/oth-path", v_9edd60, { marketingConsent: true })).status).toBe(200);
    let v_3ac7e7 = await v_a1651b().prepare("SELECT marketing_consent AS m, sso_consent_version AS v FROM users WHERE id = ?").bind(v_43e90c).first<{ m: number; v: string | null }>();
    v_4d37e3(v_3ac7e7?.m).toBe(1);
    v_4d37e3(v_3ac7e7?.v).not.toBeNull();
    v_4d37e3((await v_4f438a("/oth-path", v_9edd60, {})).status).toBe(200);
    v_3ac7e7 = await v_a1651b().prepare("SELECT marketing_consent AS m, sso_consent_version AS v FROM users WHERE id = ?").bind(v_43e90c).first<{ m: number; v: string | null }>();
    v_4d37e3(v_3ac7e7?.m).toBe(1);
  });
});
