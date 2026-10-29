

import { v_469bf2, v_23805a, v_4d37e3, v_ff107d, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";
import { v_b2eae5 } from "../src/lib/jwt";
import { v_dbed3e } from "../src/lib/faceVectors";
import { v_003ee1 } from "../src/lib/cloneFaceScope";
import { v_525d9f } from "../src/lib/xrunAccountFace";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_9542f7 = v_c9c489 as unknown as Parameters<typeof v_003ee1>[0];
const v_cafb6f = new URL((v_c9c489 as unknown as { XRUN_API_URL: string }).XRUN_API_URL).origin;

let v_ac94c3 = 7000;
async function v_bfb240(v_e0c7e8, v_312bfe = true): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent, face_biometric_consent, xrun_member_id)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1, 1, ?)`,
    )
    .bind(v_e0c7e8, v_312bfe ? ++v_ac94c3 : null)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'C', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

function v_46ff7a(v_bdb39e): number[] {
  const v_81e2ef = new Array(512).fill(0);
  v_81e2ef[v_bdb39e % 512] = 1;
  return v_81e2ef;
}
function v_8a9589(v_81e2ef): string {
  const v_8d1421 = new Uint8Array(new Float32Array(v_81e2ef).buffer);
  let v_fd5f43 = "";
  for (const v_148ff6 of v_8d1421) v_fd5f43 += String.fromCharCode(v_148ff6);
  return btoa(v_fd5f43);
}

async function v_21cc31(v_43e90c): Promise<string> {
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}
async function v_51c3d2(v_9fe22d, v_9edd60, v_4d33b2) {
  return v_1df298.fetch(`https://x${v_9fe22d}`, {
    method: v_4d33b2 === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${v_9edd60}`, "Content-Type": "application/json" },
    body: v_4d33b2 === undefined ? undefined : JSON.stringify(v_4d33b2),
  });
}

async function v_389002(v_0c8987, v_6e0fd3, v_9edd60, v_bdb39e): Promise<number> {
  const v_28eeb6 = (await (await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_6e0fd3, displayName: "나", enrolledVia: "auto_biometric" })).json()) as { id: number };
  await v_003ee1(v_9542f7, { userId: v_0c8987, cloneId: v_6e0fd3, personId: v_28eeb6.id, vectors: [v_46ff7a(v_bdb39e)] });
  v_4d37e3((await v_51c3d2(`/oth-path${v_28eeb6.id}/account-self`, v_9edd60, {})).status).toBe(200);
  return v_28eeb6.id;
}

type XrunData = { enrolled: boolean; match: boolean; embedding?: string };
function v_949537(v_9390e8, v_fce685 = 1) {
  const v_ebec57 = v_8fd90d.get(v_cafb6f).intercept({ path: "/oth-path", method: "POST" });
  (v_9390e8 ? v_ebec57.reply(200, { status: "success", data: v_9390e8 }) : v_ebec57.reply(500, { status: "error" })).times(v_fce685);
}
function v_fe4f41(v_909ede) {
  v_8fd90d.get(v_cafb6f).intercept({ path: "/oth-path", method: "POST" })
    .reply(200, { status: "success", data: { enabled: true, faceStatus: v_909ede } });
}

async function v_15337a(v_ca1ec5): Promise<number> {
  let v_f4e98d = 0;
  for (let v_ebec57 = 0; v_ebec57 < 40 && v_f4e98d === 0; v_ebec57++) {
    v_f4e98d = (await v_a1651b().prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE person_id = ?").bind(v_ca1ec5).first<{ n: number }>())!.n;
    if (v_f4e98d === 0) await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 50));
  }
  return v_f4e98d;
}

v_ff107d(() => {
  v_dbed3e();
  v_525d9f();
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => {

  v_8fd90d.assertNoPendingInterceptors();
  v_8fd90d.deactivate();
});

v_469bf2("AFL-1065 /match selfMatch — xrun 계정 얼굴 우선", () => {
  v_23805a("xrun match → selfMatch true (afterlife 본인 얼굴 없어도)", async () => {
    const v_0c8987 = await v_bfb240("x1@t.com");
    const v_148ff6 = await v_4d24a9(v_0c8987, "x1_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    v_949537({ enrolled: true, match: true });
    const v_8f00b9 = (await (await v_51c3d2("/oth-path", v_9edd60, { vector: v_46ff7a(7), cloneId: v_148ff6 })).json()) as { selfMatch: boolean; best: unknown };
    v_4d37e3(v_8f00b9.selfMatch).toBe(true);
    v_4d37e3(v_8f00b9.best).toBeNull();
  });

  v_23805a("xrun mismatch 면 afterlife 본인 얼굴이 맞아도 selfMatch false", async () => {
    const v_0c8987 = await v_bfb240("x2@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "x2_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "x2_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    await v_389002(v_0c8987, v_779914, v_9edd60, 7);
    v_949537({ enrolled: true, match: false });
    const v_8f00b9 = (await (await v_51c3d2("/oth-path", v_9edd60, { vector: v_46ff7a(7), cloneId: v_148ff6 })).json()) as { selfMatch: boolean };
    v_4d37e3(v_8f00b9.selfMatch).toBe(false);
  });

  v_23805a("/match 는 xrun 을 1초까지만 기다린다 — 넘으면 폴백(selfMatch false)", async () => {
    const v_0c8987 = await v_bfb240("x2b@t.com");
    const v_148ff6 = await v_4d24a9(v_0c8987, "x2b_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    v_8fd90d.get(v_cafb6f).intercept({ path: "/oth-path", method: "POST" })
      .reply(200, { status: "success", data: { enrolled: true, match: true } })
      .delay(2_500);

    const v_8f00b9 = (await (await v_51c3d2("/oth-path", v_9edd60, { vector: v_46ff7a(7), cloneId: v_148ff6 })).json()) as { selfMatch: boolean };
    v_4d37e3(v_8f00b9.selfMatch).toBe(false);
  });

  v_23805a("xrun 장애(500) → afterlife 본인 얼굴로 판정(폴백)", async () => {
    const v_0c8987 = await v_bfb240("x3@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "x3_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "x3_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    await v_389002(v_0c8987, v_779914, v_9edd60, 7);
    v_949537(null);
    const v_8f00b9 = (await (await v_51c3d2("/oth-path", v_9edd60, { vector: v_46ff7a(7), cloneId: v_148ff6 })).json()) as { selfMatch: boolean };
    v_4d37e3(v_8f00b9.selfMatch).toBe(true);
  });
});

v_469bf2("AFL-1065 from-account-self — xrun 계정 얼굴 복사", () => {
  v_23805a("xrun match → 201 · source_person_id NULL · granted · 계정 얼굴 1장 복사 → 이 클론이 그 이름으로 알아봄", async () => {
    const v_0c8987 = await v_bfb240("x4@t.com");
    const v_148ff6 = await v_4d24a9(v_0c8987, "x4_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    v_949537({ enrolled: true, match: true, embedding: v_8a9589(v_46ff7a(7)) });
    const v_cb35cb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "히즈키", vectors: [v_46ff7a(7)] });
    v_4d37e3(v_cb35cb.status).toBe(201);
    const v_28eeb6 = (await v_cb35cb.json()) as { id: number; displayName: string };
    const v_3ac7e7 = await v_a1651b()
      .prepare("SELECT clone_id, source_person_id, consent_state FROM persons WHERE id = ?")
      .bind(v_28eeb6.id)
      .first<{ clone_id: number; source_person_id: number | null; consent_state: string }>();
    v_4d37e3(v_3ac7e7).toEqual({ clone_id: v_148ff6, source_person_id: null, consent_state: "granted" });
    v_4d37e3(await v_15337a(v_28eeb6.id)).toBe(1);
    const v_38d084 = await v_a1651b().prepare("SELECT source FROM clone_person_faces WHERE person_id = ?").bind(v_28eeb6.id).first<{ source: string }>();
    v_4d37e3(v_38d084!.source).toBe("self");

    const v_35f85c = (await (await v_51c3d2("/oth-path", v_9edd60, { vector: v_46ff7a(7), cloneId: v_148ff6 })).json()) as {
      best: { personId: number; displayName: string } | null;
    };
    v_4d37e3(v_35f85c.best?.personId).toBe(v_28eeb6.id);
    v_4d37e3(v_35f85c.best?.displayName).toBe("히즈키");
  });

  v_23805a("xrun match 여도 이 클론이 이미 그 얼굴을 알면 409 ALREADY_REGISTERED", async () => {
    const v_0c8987 = await v_bfb240("x5@t.com");
    const v_148ff6 = await v_4d24a9(v_0c8987, "x5_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d81543 = (await (await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "기존", enrolledVia: "auto_biometric" })).json()) as { id: number };
    await v_003ee1(v_9542f7, { userId: v_0c8987, cloneId: v_148ff6, personId: v_d81543.id, vectors: [v_46ff7a(7)] });
    v_949537({ enrolled: true, match: true, embedding: v_8a9589(v_46ff7a(7)) });
    const v_cb35cb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "히즈키", vectors: [v_46ff7a(7)] });
    v_4d37e3(v_cb35cb.status).toBe(409);
    v_4d37e3(((await v_cb35cb.json()) as { error: { details?: { code?: string } } }).error.details?.code).toBe("ALREADY_REGISTERED");
  });

  v_23805a("계정 얼굴 복사본이 이미 있으면(벡터 검색에 아직 안 잡혀도) 이름이 달라도 409 ALREADY_REGISTERED", async () => {
    const v_0c8987 = await v_bfb240("x5b@t.com");
    const v_148ff6 = await v_4d24a9(v_0c8987, "x5b_b");
    const v_9edd60 = await v_21cc31(v_0c8987);

    const v_ba2215 = (await (await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "히즈키", enrolledVia: "card" })).json()) as { id: number };
    await v_a1651b()
      .prepare(`INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at) VALUES (?, ?, 'pending-v', 'w600k_mbf', 512, 'self', ?)`)
      .bind(v_148ff6, v_ba2215.id, Date.now())
      .run();
    v_949537({ enrolled: true, match: true, embedding: v_8a9589(v_46ff7a(7)) });
    const v_cb35cb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "다른이름", vectors: [v_46ff7a(7)] });
    v_4d37e3(v_cb35cb.status).toBe(409);
    const v_49263d = (await v_cb35cb.json()) as { error: { details?: { code?: string; personId?: number } } };
    v_4d37e3(v_49263d.error.details?.code).toBe("ALREADY_REGISTERED");
    v_4d37e3(v_49263d.error.details?.personId).toBe(v_ba2215.id);
  });

  v_23805a("xrun mismatch → 422 SELF_FACE_MISMATCH (afterlife 본인 얼굴이 맞아도) · person 안 만들어짐", async () => {
    const v_0c8987 = await v_bfb240("x6@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "x6_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "x6_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    await v_389002(v_0c8987, v_779914, v_9edd60, 7);
    v_949537({ enrolled: true, match: false });
    const v_cb35cb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "히즈키", vectors: [v_46ff7a(7)] });
    v_4d37e3(v_cb35cb.status).toBe(422);
    v_4d37e3(((await v_cb35cb.json()) as { error: { details?: { code?: string } } }).error.details?.code).toBe("SELF_FACE_MISMATCH");
    const v_f4e98d = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM persons WHERE clone_id = ?").bind(v_148ff6).first<{ n: number }>();
    v_4d37e3(v_f4e98d!.n).toBe(0);
  });

  v_23805a("xrun none + afterlife 본인 얼굴 없음 → 404 NO_SELF_FACE", async () => {
    const v_0c8987 = await v_bfb240("x7@t.com");
    const v_148ff6 = await v_4d24a9(v_0c8987, "x7_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    v_949537({ enrolled: false, match: false });
    const v_cb35cb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "히즈키", vectors: [v_46ff7a(7)] });
    v_4d37e3(v_cb35cb.status).toBe(404);
  });

  v_23805a("xrun 장애 + afterlife 본인 얼굴 → 기존처럼 원본 벡터 복사(source_person_id = 원본)", async () => {
    const v_0c8987 = await v_bfb240("x8@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "x8_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "x8_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_389002(v_0c8987, v_779914, v_9edd60, 7);
    v_949537(null);
    const v_cb35cb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "히즈키", vectors: [v_46ff7a(7)] });
    v_4d37e3(v_cb35cb.status).toBe(201);
    const v_28eeb6 = (await v_cb35cb.json()) as { id: number };
    const v_3ac7e7 = await v_a1651b().prepare("SELECT source_person_id FROM persons WHERE id = ?").bind(v_28eeb6.id).first<{ source_person_id: number }>();
    v_4d37e3(v_3ac7e7!.source_person_id).toBe(v_d4923e);
  });
});

v_469bf2("AFL-1065 /self-face", () => {
  v_23805a("afterlife 본인 얼굴 없어도 xrun 얼굴 active 면 hasSelfFace true", async () => {
    const v_0c8987 = await v_bfb240("x9@t.com");
    const v_9edd60 = await v_21cc31(v_0c8987);
    v_fe4f41("active");
    v_4d37e3(((await (await v_51c3d2("/oth-path", v_9edd60)).json()) as { hasSelfFace: boolean }).hasSelfFace).toBe(true);
    v_fe4f41("none");
    v_4d37e3(((await (await v_51c3d2("/oth-path", v_9edd60)).json()) as { hasSelfFace: boolean }).hasSelfFace).toBe(false);
  });
});
