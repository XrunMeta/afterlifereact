

import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203, v_3889c0 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

const v_ff7e4d = "http://prethird.test";

async function v_21cc31(v_0c8987): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_0c8987, kind: "access" }, v_43fd42, 600);
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b.prepare(`SELECT id FROM users WHERE email = ?`).bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_c808bd(v_0c8987, v_ae8e76): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'application/octet-stream', 1, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(`uploadedfiles/prebuildtrig-${v_ae8e76}.bin`, v_0c8987)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_808a54(v_ea333d, v_433c46): Promise<string> {
  const v_cb35cb = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "voice_clone", src_file_id: v_433c46 }),
  });
  v_4d37e3(v_cb35cb.status).toBe(201);
  return (await v_cb35cb.json<{ job_id: string }>()).job_id;
}

async function v_39eaf5(v_ea333d, v_f91f33) {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${v_ea333d}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `prebuildtrig-${Date.now()}-${Math.random()}`,
    },
    body: JSON.stringify({
      clone_type: "friend",
      name: "PrebuildTrig",
      username: `pbtrig${Date.now()}${Math.floor(Math.random() * 1e6)}`,
      ...v_f91f33,
    }),
  });
  v_4d37e3(v_8f00b9.status).toBe(201);
  return (await v_8f00b9.json<{ clone: { id: number } }>()).clone.id;
}

const v_28be8c = (v_d799e2) => new Promise((v_cb35cb) => setTimeout(v_cb35cb, v_d799e2));

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

v_469bf2("AFL-1017: createClone prebuild 트리거 (raw 음성 기반)", () => {
  v_23805a("voice_se_url 이 null 이어도 voice_clone 잡 src_file_id 로 /prebuild 발화", async () => {
    const v_0c8987 = await v_bfb240("pbtrig_ok@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_d7fa74 = await v_c808bd(v_0c8987, "ok-wav");
    const v_04211c = await v_808a54(v_8d41d7, v_d7fa74); 

    let v_df0713 = null;
    v_8fd90d
      .get(v_ff7e4d)
      .intercept({ path: "/prethird/prebuild", method: "POST" })
      .reply((v_328259) => {
        v_df0713 = {
          auth: new Headers(v_328259.headers as Record<string, string>).get("authorization"),
          body: String(v_328259.body),
        };
        return { statusCode: 200, data: { ok: true } };
      });

    const v_6e0fd3 = await v_39eaf5(v_8d41d7, { voice_clone_job_id: v_04211c });
    for (let v_ebec57 = 0; v_ebec57 < 50 && !v_df0713; v_ebec57++) await v_28be8c(50);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b.prepare(`SELECT voice_se_url FROM clones WHERE id=?`).bind(v_6e0fd3).first<{ voice_se_url: string | null }>();
    v_4d37e3(v_3ac7e7!.voice_se_url).toBeNull();
    v_4d37e3(v_df0713).toBeTruthy();
    v_4d37e3(v_df0713!.auth).toBe("Bearer test-secret");
    const v_8decf8 = JSON.parse(v_df0713!.body);
    v_4d37e3(v_8decf8.cloneId).toBe(String(v_6e0fd3));
    v_4d37e3(v_8decf8.voiceRawUrl).toBe(`http://localhost/oth-path${v_d7fa74}`);
  });

  v_23805a("voice_clone_job_id 없음(preset 등) → 트리거 안 함", async () => {
    const v_0c8987 = await v_bfb240("pbtrig_none@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_980ff2 = v_3889c0.spyOn(globalThis, "fetch");
    await v_39eaf5(v_8d41d7, {});
    await v_28be8c(400);
    const v_715950 = v_980ff2.mock.calls.some((v_779914) => String(v_779914[0]).includes("/prethird/prebuild"));
    v_980ff2.mockRestore();
    v_4d37e3(v_715950).toBe(false);
  });

  v_23805a("job user 불일치 → 트리거 안 함", async () => {
    const v_257b90 = await v_bfb240("pbtrig_owner@test.com");
    const v_a9cbf1 = await v_bfb240("pbtrig_other@test.com");
    const v_40444e = await v_21cc31(v_257b90);
    const v_825625 = await v_21cc31(v_a9cbf1);
    const v_d7fa74 = await v_c808bd(v_257b90, "mismatch-wav");
    const v_04211c = await v_808a54(v_40444e, v_d7fa74);
    const v_980ff2 = v_3889c0.spyOn(globalThis, "fetch");
    await v_39eaf5(v_825625, { voice_clone_job_id: v_04211c });
    await v_28be8c(400);
    const v_715950 = v_980ff2.mock.calls.some((v_779914) => String(v_779914[0]).includes("/prethird/prebuild"));
    v_980ff2.mockRestore();
    v_4d37e3(v_715950).toBe(false);
  });
});
