

import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";
import { v_842ce7 } from "../src/lib/guideJob";

const v_8fe3be = "http://orchestrator.test";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8)
    .run();
  return (
    await v_a1651b.prepare(`SELECT id FROM users WHERE email = ?`).bind(v_e0c7e8).first<{ id: number }>()
  )!.id;
}

async function v_4d24a9(
  v_1badb6,
  v_556427,
  v_564b6a,
): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, l1_profile, created_at)
       VALUES (?, 'CT', ?, 'memlow', 'public', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427, v_564b6a ? JSON.stringify(v_564b6a) : null)
    .run();
  return (
    await v_a1651b.prepare(`SELECT id FROM clones WHERE username = ?`).bind(v_556427).first<{ id: number }>()
  )!.id;
}

async function v_c808bd(v_0c8987, v_ae8e76): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_b24339 = `uploadedfiles/triggerguidejob-${v_ae8e76}.bin`;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'application/octet-stream', 1, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(v_b24339, v_0c8987)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

v_469bf2("triggerGuideJob() 단위 테스트", () => {
  v_23805a("잡 생성 + clone_id 연결 + orchestrator 중계 payload(persona 포함)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("triggerguidejob_full@test.com");
    const v_6e0fd3 = await v_4d24a9(v_0c8987, `tgj-full-${Date.now()}`, {
      attrs: { mbti: "INFP" },
      notes: "unit test persona",
    });
    const v_a7be37 = await v_c808bd(v_0c8987, "face");

    let v_2b0616 = null;
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((v_328259) => {
        v_2b0616 = v_328259.body as string;
        return { statusCode: 202, data: { ok: true } };
      });

    const v_e4819b = [];
    const v_43c42e = await v_842ce7(v_a1651b, {
      cloneId: v_6e0fd3,
      userId: v_0c8987,
      faceSrcFileId: v_a7be37,
      voiceRawUrl: "http://localhost/oth-path",
      origin: "http://localhost",
      orchestratorUrl: v_8fe3be,
      orchSecret: "test-secret",
      waitUntil: (v_e2a85c) => v_e4819b.push(v_e2a85c),
    });

    v_4d37e3(v_43c42e.guideJobId).toBeTruthy();
    await Promise.all(v_e4819b);

    const v_d5ec97 = await v_a1651b
      .prepare(`SELECT kind, src_file_id, clone_id, status FROM clone_asset_jobs WHERE id=?`)
      .bind(v_43c42e.guideJobId)
      .first<{ kind: string; src_file_id: number; clone_id: number; status: string }>();
    v_4d37e3(v_d5ec97).toBeTruthy();
    v_4d37e3(v_d5ec97!.kind).toBe("guide");
    v_4d37e3(v_d5ec97!.src_file_id).toBe(v_a7be37);
    v_4d37e3(v_d5ec97!.clone_id).toBe(v_6e0fd3);

    v_4d37e3(v_d5ec97!.status).toBe("running");

    v_4d37e3(v_2b0616).toBeTruthy();
    const v_8decf8 = JSON.parse(v_2b0616!);
    v_4d37e3(v_8decf8.job_id).toBe(v_43c42e.guideJobId);
    v_4d37e3(v_8decf8.kind).toBe("guide");
    v_4d37e3(v_8decf8.face_url).toBe(`http://localhost/oth-path${v_a7be37}`);
    v_4d37e3(v_8decf8.clone_id).toBe(String(v_6e0fd3));
    v_4d37e3(v_8decf8.voice_raw_url).toBe("http://localhost/oth-path");
    v_4d37e3(typeof v_8decf8.callback_token).toBe("string");

    v_4d37e3(v_8decf8.persona).toBeTruthy();
    v_4d37e3(v_8decf8.persona.l0).toBeTruthy();
    v_4d37e3(v_8decf8.persona.l1.attrs).toBeUndefined();
    v_4d37e3(v_8decf8.persona.l1.mbti).toBe("INFP");
    v_4d37e3(v_8decf8.persona.l1.notes).toBe("unit test persona");
  });

  v_23805a("orchestratorUrl/orchSecret 미설정 → 잡만 생성, 중계 skip(fetch 미호출)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("triggerguidejob_noorch@test.com");
    const v_6e0fd3 = await v_4d24a9(v_0c8987, `tgj-noorch-${Date.now()}`);
    const v_a7be37 = await v_c808bd(v_0c8987, "face-noorch");

    const v_e4819b = [];
    const v_43c42e = await v_842ce7(v_a1651b, {
      cloneId: v_6e0fd3,
      userId: v_0c8987,
      faceSrcFileId: v_a7be37,
      voiceRawUrl: "http://localhost/oth-path",
      origin: "http://localhost",

      waitUntil: (v_e2a85c) => v_e4819b.push(v_e2a85c),
    });

    v_4d37e3(v_43c42e.guideJobId).toBeTruthy();
    v_4d37e3(v_e4819b.length).toBe(0); 

    const v_d5ec97 = await v_a1651b
      .prepare(`SELECT clone_id, status FROM clone_asset_jobs WHERE id=?`)
      .bind(v_43c42e.guideJobId)
      .first<{ clone_id: number; status: string }>();
    v_4d37e3(v_d5ec97).toBeTruthy();
    v_4d37e3(v_d5ec97!.clone_id).toBe(v_6e0fd3);

    v_4d37e3(v_d5ec97!.status).toBe("pending");

  });

  v_23805a("persona 조립 실패 시(system_persona 조회 예외) persona=null 로 폴백 — try/catch 격리", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("triggerguidejob_personafail@test.com");
    const v_6e0fd3 = await v_4d24a9(v_0c8987, `tgj-personafail-${Date.now()}`, { mbti: "ESTJ" });
    const v_a7be37 = await v_c808bd(v_0c8987, "face-personafail");

    const v_ea2155 = new Proxy(v_a1651b, {
      get(v_5f5d6d, v_e36420, v_b9fbb4) {
        if (v_e36420 === "prepare") {
          return (v_f8df46) => {
            if (v_f8df46.includes("system_persona")) {
              throw new Error("simulated system_persona failure");
            }
            return (v_5f5d6d as unknown as { prepare: (s: string) => unknown }).prepare(v_f8df46);
          };
        }
        return Reflect.get(v_5f5d6d, v_e36420, v_b9fbb4);
      },
    }) as D1Database;

    let v_2b0616 = null;
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((v_328259) => {
        v_2b0616 = v_328259.body as string;
        return { statusCode: 202, data: { ok: true } };
      });

    const v_e4819b = [];
    const v_43c42e = await v_842ce7(v_ea2155, {
      cloneId: v_6e0fd3,
      userId: v_0c8987,
      faceSrcFileId: v_a7be37,
      voiceRawUrl: "http://localhost/oth-path",
      origin: "http://localhost",
      orchestratorUrl: v_8fe3be,
      orchSecret: "test-secret",
      waitUntil: (v_e2a85c) => v_e4819b.push(v_e2a85c),
    });

    await Promise.all(v_e4819b);

    const v_d5ec97 = await v_a1651b
      .prepare(`SELECT clone_id, status FROM clone_asset_jobs WHERE id=?`)
      .bind(v_43c42e.guideJobId)
      .first<{ clone_id: number; status: string }>();
    v_4d37e3(v_d5ec97!.clone_id).toBe(v_6e0fd3);
    v_4d37e3(v_d5ec97!.status).toBe("running");

    v_4d37e3(v_2b0616).toBeTruthy();
    const v_8decf8 = JSON.parse(v_2b0616!);

    v_4d37e3(v_8decf8.persona).toBeNull();
  });
});
