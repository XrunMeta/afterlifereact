

import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b2eae5 } from "../src/lib/jwt";
import { v_dbed3e } from "../src/lib/faceVectors";
import { v_003ee1 } from "../src/lib/cloneFaceScope";
import { v_19963e } from "../src/lib/personDelete";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_9542f7 = v_c9c489 as unknown as Parameters<typeof v_003ee1>[0];

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent, face_biometric_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1, 1)`,
    )
    .bind(v_e0c7e8)
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

async function v_21cc31(v_43e90c): Promise<string> {
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_51c3d2(v_9fe22d, v_9edd60, v_4d33b2, v_bfe9b9) {
  return v_1df298.fetch(`https://x${v_9fe22d}`, {
    method: v_bfe9b9 ?? (v_4d33b2 === undefined ? "GET" : "POST"),
    headers: { Authorization: `Bearer ${v_9edd60}`, "Content-Type": "application/json" },
    body: v_4d33b2 === undefined ? undefined : JSON.stringify(v_4d33b2),
  });
}

async function v_9ef1c2(v_0c8987, v_6e0fd3, v_9edd60, v_1833e7, v_bdb39e): Promise<number> {
  const v_28eeb6 = (await (await v_51c3d2("/oth-path", v_9edd60, {
    cloneId: v_6e0fd3, displayName: v_1833e7, enrolledVia: "auto_biometric",
  })).json()) as { id: number };
  await v_003ee1(v_9542f7, { userId: v_0c8987, cloneId: v_6e0fd3, personId: v_28eeb6.id, vectors: [v_46ff7a(v_bdb39e)] });
  return v_28eeb6.id;
}

interface MatchRes { best: { personId: number; displayName: string } | null; matches: unknown[]; selfMatch: boolean }
async function v_a63110(v_9edd60, v_6e0fd3, v_bdb39e): Promise<MatchRes> {
  return (await (await v_51c3d2("/oth-path", v_9edd60, { vector: v_46ff7a(v_bdb39e), cloneId: v_6e0fd3 })).json()) as MatchRes;
}

v_469bf2("계정 본인 얼굴 — selfMatch 플래그", () => {
  v_ff107d(() => v_dbed3e());

  v_23805a("본인 지정 전엔 다른 클론 match 의 selfMatch=false", async () => {
    const v_0c8987 = await v_bfb240("as1@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "as1_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "as1_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);

    const v_72c7a6 = (await (await v_51c3d2("/oth-path", v_9edd60)).json()) as { hasSelfFace: boolean };
    v_4d37e3(v_72c7a6.hasSelfFace).toBe(false);
    const v_8f00b9 = await v_a63110(v_9edd60, v_148ff6, 7);
    v_4d37e3(v_8f00b9.selfMatch).toBe(false);
    v_4d37e3(v_8f00b9.best).toBeNull();
  });

  v_23805a("account-self 지정 후 다른 클론에서 같은 벡터 → selfMatch=true, best/matches 는 비어 있음", async () => {
    const v_0c8987 = await v_bfb240("as2@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "as2_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "as2_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);

    const v_cb35cb = await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(((await v_cb35cb.json()) as { ok: boolean }).ok).toBe(true);
    const v_72c7a6 = (await (await v_51c3d2("/oth-path", v_9edd60)).json()) as { hasSelfFace: boolean };
    v_4d37e3(v_72c7a6.hasSelfFace).toBe(true);

    const v_8f00b9 = await v_a63110(v_9edd60, v_148ff6, 7);
    v_4d37e3(v_8f00b9.selfMatch).toBe(true);
    v_4d37e3(v_8f00b9.best).toBeNull();
    v_4d37e3(v_8f00b9.matches).toHaveLength(0);

    const v_7b3f91 = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM persons WHERE clone_id = ?").bind(v_148ff6).first<{ n: number }>();
    v_4d37e3(v_7b3f91!.n).toBe(0);
  });

  v_23805a("다른 사람 벡터 → selfMatch=false", async () => {
    const v_0c8987 = await v_bfb240("as3@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "as3_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "as3_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});

    const v_8f00b9 = await v_a63110(v_9edd60, v_148ff6, 99);
    v_4d37e3(v_8f00b9.selfMatch).toBe(false);
    v_4d37e3(v_8f00b9.best).toBeNull();
  });

  v_23805a("본인 얼굴의 원본 클론에서는 기존대로 best, selfMatch=false", async () => {
    const v_0c8987 = await v_bfb240("as4@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "as4_a");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});

    const v_8f00b9 = await v_a63110(v_9edd60, v_779914, 7);
    v_4d37e3(v_8f00b9.best?.personId).toBe(v_d4923e);
    v_4d37e3(v_8f00b9.selfMatch).toBe(false);
  });
});

v_469bf2("계정 본인 얼굴 — from-account-self", () => {
  v_ff107d(() => v_dbed3e());

  v_23805a("생성 후 벡터가 복사되면 그 클론 match 가 best 로 잡힌다", async () => {
    const v_0c8987 = await v_bfb240("as5@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "as5_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "as5_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});

    const v_cb35cb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "주인님", vector: v_46ff7a(7) });
    v_4d37e3(v_cb35cb.status).toBe(201);
    const v_28eeb6 = (await v_cb35cb.json()) as { id: number; displayName: string };
    v_4d37e3(v_28eeb6.displayName).toBe("주인님");

    const v_3ac7e7 = await v_a1651b()
      .prepare("SELECT clone_id, source_person_id, consent_state FROM persons WHERE id = ?")
      .bind(v_28eeb6.id)
      .first<{ clone_id: number; source_person_id: number; consent_state: string }>();
    v_4d37e3(v_3ac7e7).toMatchObject({ clone_id: v_148ff6, source_person_id: v_d4923e, consent_state: "granted" });

    let v_f4e98d = 0;
    for (let v_ebec57 = 0; v_ebec57 < 40 && v_f4e98d === 0; v_ebec57++) {
      v_f4e98d = (await v_a1651b().prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE person_id = ?").bind(v_28eeb6.id).first<{ n: number }>())!.n;
      if (v_f4e98d === 0) await new Promise((v_8f00b9) => setTimeout(v_8f00b9, 50));
    }
    v_4d37e3(v_f4e98d).toBe(1);

    const v_8f00b9 = await v_a63110(v_9edd60, v_148ff6, 7);
    v_4d37e3(v_8f00b9.best?.personId).toBe(v_28eeb6.id);
    v_4d37e3(v_8f00b9.best?.displayName).toBe("주인님");
    v_4d37e3(v_8f00b9.selfMatch).toBe(false);
  });

  v_23805a("같은 이름이 이미 있으면 422, 원본 클론이면 422", async () => {
    const v_0c8987 = await v_bfb240("as6@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "as6_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "as6_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});

    await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "친구" });
    v_4d37e3((await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "친구", vector: v_46ff7a(7) })).status).toBe(422);
    v_4d37e3((await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_779914, displayName: "다른이름", vector: v_46ff7a(7) })).status).toBe(422);
  });

  v_23805a("본인 얼굴 없이 호출하면 404", async () => {
    const v_0c8987 = await v_bfb240("as7@t.com");
    const v_148ff6 = await v_4d24a9(v_0c8987, "as7_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_cb35cb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "주인님", vector: v_46ff7a(7) });
    v_4d37e3(v_cb35cb.status).toBe(404);
  });
});

v_469bf2("account-self 지정 검증·삭제", () => {
  v_ff107d(() => v_dbed3e());

  v_23805a("다른 계정 person → 404, 얼굴 없는 person → 422", async () => {
    const v_79e089 = await v_bfb240("as8@t.com");
    const v_b1ff3f = await v_bfb240("as8b@t.com");
    const v_779914 = await v_4d24a9(v_79e089, "as8_a");
    const v_ece1e8 = await v_21cc31(v_79e089);
    const v_a9fa04 = await v_21cc31(v_b1ff3f);
    const v_d4923e = await v_9ef1c2(v_79e089, v_779914, v_ece1e8, "나", 7);
    v_4d37e3((await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_a9fa04, {})).status).toBe(404);

    const v_d6db99 = (await (await v_51c3d2("/oth-path", v_ece1e8, { cloneId: v_779914, displayName: "빈사람", enrolledVia: "auto_biometric" })).json()) as { id: number };
    v_4d37e3((await v_51c3d2(`/oth-path${v_d6db99.id}/account-self`, v_ece1e8, {})).status).toBe(422);
  });

  v_23805a("person 삭제 시 포인터가 해제된다", async () => {
    const v_0c8987 = await v_bfb240("as9@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "as9_a");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});

    v_4d37e3((await v_51c3d2(`/oth-path${v_d4923e}`, v_9edd60, undefined, "DELETE")).status).toBe(200);
    const v_ceb55a = await v_a1651b().prepare("SELECT self_face_person_id AS s FROM users WHERE id = ?").bind(v_0c8987).first<{ s: number | null }>();
    v_4d37e3(v_ceb55a!.s).toBeNull();
    const v_72c7a6 = (await (await v_51c3d2("/oth-path", v_9edd60)).json()) as { hasSelfFace: boolean };
    v_4d37e3(v_72c7a6.hasSelfFace).toBe(false);
  });
});

v_469bf2("계정 본인 얼굴 — 보안 감사 반영", () => {
  v_ff107d(() => v_dbed3e());

  v_23805a("동의가 철회된 본인 얼굴은 selfMatch=false, from-account-self 404, 재지정 account-self 403", async () => {
    const v_0c8987 = await v_bfb240("sec1@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "sec1_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "sec1_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});
    v_4d37e3((await v_a63110(v_9edd60, v_148ff6, 7)).selfMatch).toBe(true);

    await v_a1651b().prepare("UPDATE persons SET consent_state = 'none' WHERE id = ?").bind(v_d4923e).run();
    v_4d37e3((await v_a63110(v_9edd60, v_148ff6, 7)).selfMatch).toBe(false);
    const v_72c7a6 = (await (await v_51c3d2("/oth-path", v_9edd60)).json()) as { hasSelfFace: boolean };
    v_4d37e3(v_72c7a6.hasSelfFace).toBe(false);
    v_4d37e3((await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "주인님", vector: v_46ff7a(7) })).status).toBe(404);
    v_4d37e3((await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {})).status).toBe(403);
  });

  v_23805a("같은 클론에 복사본이 이미 있으면 409 ALREADY_REGISTERED — 이름이 달라도 같은 얼굴이면 거절", async () => {
    const v_0c8987 = await v_bfb240("sec2@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "sec2_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "sec2_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});

    const v_2d1eeb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "주인님", vector: v_46ff7a(7) });
    v_4d37e3(v_2d1eeb.status).toBe(201);
    const v_ea719c = (await v_2d1eeb.json()) as { id: number };
    const v_b96973 = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "다른이름", vector: v_46ff7a(7) });
    v_4d37e3(v_b96973.status).toBe(409);
    const v_49263d = (await v_b96973.json()) as { error: { code: string; details: { code: string; personId: number; displayName: string } } };
    v_4d37e3(v_49263d.error.details).toMatchObject({ code: "ALREADY_REGISTERED", personId: v_ea719c.id, displayName: "주인님" });
    const v_f4e98d = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM persons WHERE clone_id = ?").bind(v_148ff6).first<{ n: number }>();
    v_4d37e3(v_f4e98d!.n).toBe(1);
  });

  v_23805a("이 클론 공간이 이미 이 얼굴을 알면(복사본이 아니어도) 409", async () => {
    const v_0c8987 = await v_bfb240("sec2b@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "sec2b_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "sec2b_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});
    const v_d81543 = await v_9ef1c2(v_0c8987, v_148ff6, v_9edd60, "이미앎", 7);

    const v_cb35cb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "새이름", vector: v_46ff7a(7) });
    v_4d37e3(v_cb35cb.status).toBe(409);
    const v_49263d = (await v_cb35cb.json()) as { error: { details: { personId: number; displayName: string } } };
    v_4d37e3(v_49263d.error.details).toMatchObject({ personId: v_d81543, displayName: "이미앎" });
  });

  v_23805a("같은 클론의 다른 계정 person 은 대조 대상이 아니다 — 같은 벡터여도 201, 응답에 타 계정 정보 없음", async () => {
    const v_79e089 = await v_bfb240("sec7@t.com");
    const v_b1ff3f = await v_bfb240("sec7b@t.com");
    const v_779914 = await v_4d24a9(v_79e089, "sec7_a");
    const v_148ff6 = await v_4d24a9(v_79e089, "sec7_b"); 
    const v_ece1e8 = await v_21cc31(v_79e089);
    const v_a9fa04 = await v_21cc31(v_b1ff3f);
    const v_d4923e = await v_9ef1c2(v_79e089, v_779914, v_ece1e8, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_ece1e8, {});

    await v_9ef1c2(v_b1ff3f, v_148ff6, v_a9fa04, "타계정사람", 7);

    const v_cb35cb = await v_51c3d2("/oth-path", v_ece1e8, { cloneId: v_148ff6, displayName: "주인님", vector: v_46ff7a(7) });
    v_4d37e3(v_cb35cb.status).toBe(201);
    const v_9b6134 = await v_cb35cb.text();
    v_4d37e3(v_9b6134).not.toContain("타계정사람");
  });

  v_23805a("다른 사람 벡터로 from-account-self → 422 SELF_FACE_MISMATCH, person 안 만들어짐", async () => {
    const v_0c8987 = await v_bfb240("sec5@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "sec5_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "sec5_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});

    const v_cb35cb = await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "남", vector: v_46ff7a(99) });
    v_4d37e3(v_cb35cb.status).toBe(422);
    const v_49263d = (await v_cb35cb.json()) as { error: { details: { code: string } } };
    v_4d37e3(v_49263d.error.details.code).toBe("SELF_FACE_MISMATCH");
    const v_f4e98d = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM persons WHERE clone_id = ?").bind(v_148ff6).first<{ n: number }>();
    v_4d37e3(v_f4e98d!.n).toBe(0);
  });

  v_23805a("vector 누락·잘못된 길이 → 422 VALIDATION_FAILED", async () => {
    const v_0c8987 = await v_bfb240("sec6@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "sec6_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "sec6_b");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});

    v_4d37e3((await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "주인님" })).status).toBe(422);
    v_4d37e3((await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "주인님", vector: [1, 2] })).status).toBe(422);
  });

  v_23805a("다른 계정의 본인 얼굴과 같은 벡터여도 selfMatch=false (비누설)", async () => {
    const v_79e089 = await v_bfb240("sec3@t.com");
    const v_b1ff3f = await v_bfb240("sec3b@t.com");
    const v_779914 = await v_4d24a9(v_79e089, "sec3_a");
    const v_148ff6 = await v_4d24a9(v_b1ff3f, "sec3_b");
    const v_ece1e8 = await v_21cc31(v_79e089);
    const v_a9fa04 = await v_21cc31(v_b1ff3f);
    const v_d4923e = await v_9ef1c2(v_79e089, v_779914, v_ece1e8, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_ece1e8, {});
    const v_8f00b9 = await v_a63110(v_a9fa04, v_148ff6, 7);
    v_4d37e3(v_8f00b9.selfMatch).toBe(false);
    v_4d37e3(v_8f00b9.best).toBeNull();
  });

  async function v_97dc9c(v_e0c7e8, v_bd1444) {
    const v_0c8987 = await v_bfb240(v_e0c7e8);
    const v_779914 = await v_4d24a9(v_0c8987, `${v_bd1444}_a`);
    const v_148ff6 = await v_4d24a9(v_0c8987, `${v_bd1444}_b`);
    const v_3f4e2e = await v_4d24a9(v_0c8987, `${v_bd1444}_c`);
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});
    const v_16dbdb = (await (await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_148ff6, displayName: "B의나", vector: v_46ff7a(7) })).json()) as { id: number };
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 300)); 

    await v_a1651b().prepare("UPDATE persons SET created_at = 1000 WHERE id = ?").bind(v_16dbdb.id).run();
    const v_a252ed = (await (await v_51c3d2("/oth-path", v_9edd60, { cloneId: v_3f4e2e, displayName: "C의나", vector: v_46ff7a(7) })).json()) as { id: number };
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 300));
    await v_a1651b().prepare("UPDATE persons SET created_at = 2000 WHERE id = ?").bind(v_a252ed.id).run();
    return { uid: v_0c8987, a: v_779914, b: v_148ff6, c: v_3f4e2e, tk: v_9edd60, pid: v_d4923e, cb: v_16dbdb.id, cc: v_a252ed.id };
  }
  const v_0cb51a = async (v_0c8987) =>
    (await v_a1651b().prepare("SELECT self_face_person_id AS s FROM users WHERE id = ?").bind(v_0c8987).first<{ s: number | null }>())!.s;
  const v_38d084 = async (v_389afb) =>
    (await v_a1651b().prepare("SELECT source_person_id AS s FROM persons WHERE id = ?").bind(v_389afb).first<{ s: number | null }>())!.s;

  v_23805a("원본 삭제 → 가장 이른 복사본이 새 계정 얼굴, 남은 복사본은 새 원본을 가리키고 다른 클론 selfMatch 유지", async () => {
    const v_8d41d7 = await v_97dc9c("sec4@t.com", "sec4");
    v_4d37e3((await v_51c3d2(`/oth-path${v_8d41d7.pid}`, v_8d41d7.tk, undefined, "DELETE")).status).toBe(200);
    v_4d37e3(await v_0cb51a(v_8d41d7.uid)).toBe(v_8d41d7.cb);
    v_4d37e3(await v_38d084(v_8d41d7.cb)).toBeNull();
    v_4d37e3(await v_38d084(v_8d41d7.cc)).toBe(v_8d41d7.cb);

    const v_354d57 = await v_a63110(v_8d41d7.tk, v_8d41d7.a, 7);
    v_4d37e3(v_354d57.selfMatch).toBe(true);
    v_4d37e3(v_354d57.best).toBeNull();
    v_4d37e3((await v_a63110(v_8d41d7.tk, v_8d41d7.c, 7)).best?.personId).toBe(v_8d41d7.cc);
  });

  v_23805a("원본 클론 삭제(purge)도 승계", async () => {
    const v_8d41d7 = await v_97dc9c("sec4b@t.com", "sec4b");
    await v_19963e(v_c9c489 as unknown as Parameters<typeof v_19963e>[0], v_8d41d7.a);
    v_4d37e3(await v_0cb51a(v_8d41d7.uid)).toBe(v_8d41d7.cb);
    v_4d37e3(await v_38d084(v_8d41d7.cc)).toBe(v_8d41d7.cb);
  });

  v_23805a("복사본이 없으면 원본 삭제 시 NULL", async () => {
    const v_0c8987 = await v_bfb240("sec4c@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "sec4c_a");
    const v_9edd60 = await v_21cc31(v_0c8987);
    const v_d4923e = await v_9ef1c2(v_0c8987, v_779914, v_9edd60, "나", 7);
    await v_51c3d2(`/oth-path${v_d4923e}/account-self`, v_9edd60, {});
    await v_51c3d2(`/oth-path${v_d4923e}`, v_9edd60, undefined, "DELETE");
    v_4d37e3(await v_0cb51a(v_0c8987)).toBeNull();
  });
});
