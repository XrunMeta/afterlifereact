

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b94402, v_94652e } from "../src/lib/faceApiConsent";
import { v_b2eae5 } from "../src/lib/jwt";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8, v_74e200): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, face_biometric_consent) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, ?)`,
    )
    .bind(v_e0c7e8, v_74e200)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}
async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'C', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}
async function v_ea333d(v_43e90c): Promise<string> {
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, (v_c9c489 as { JWT_ACCESS_SECRET: string }).JWT_ACCESS_SECRET, 600);
}
const v_46ff7a = () => Array.from({ length: 512 }, (v_37eab7, v_ebec57) => (v_ebec57 === 0 ? 1 : 0));
async function v_51c3d2(v_bfe9b9, v_9fe22d, v_21cc31, v_4d33b2) {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
    body: v_4d33b2 === undefined ? undefined : JSON.stringify(v_4d33b2),
  });
}

v_469bf2("스위치", () => {
  v_23805a("미설정=ON, 정확히 off 일 때만 OFF", () => {
    v_4d37e3(v_b94402({})).toBe(true);
    v_4d37e3(v_b94402({ FACE_API_CONSENT_CHECK: "" })).toBe(true);
    v_4d37e3(v_b94402({ FACE_API_CONSENT_CHECK: "false" })).toBe(true);
    v_4d37e3(v_b94402({ FACE_API_CONSENT_CHECK: "off" })).toBe(false);
  });
  v_23805a("off 면 미동의·없는 사용자도 통과, 기본이면 403", async () => {
    const v_0c8987 = await v_bfb240("fac-sw@test.local", 0);
    const v_fa04a0 = { ...v_c9c489, FACE_API_CONSENT_CHECK: "off" } as never;
    await v_4d37e3(v_94652e(v_fa04a0, v_0c8987, "t")).resolves.toBeUndefined();
    await v_4d37e3(v_94652e(v_fa04a0, 999999, "t")).resolves.toBeUndefined();
    await v_4d37e3(v_94652e(v_c9c489 as never, v_0c8987, "t")).rejects.toMatchObject({ code: "FACE_CONSENT_REQUIRED", status: 403 });
  });
  v_23805a("행 없음·조회 실패는 거절(fail-closed)", async () => {
    await v_4d37e3(v_94652e(v_c9c489 as never, 999999, "t")).rejects.toMatchObject({ code: "FACE_CONSENT_REQUIRED" });
    const v_e1be02 = { DB: { prepare: () => { throw new Error("boom"); } } } as never;
    await v_4d37e3(v_94652e(v_e1be02, 1, "t")).rejects.toMatchObject({ code: "FACE_CONSENT_REQUIRED" });
  });
});

v_469bf2("얼굴 벡터 라우트 HTTP 게이트", () => {
  v_23805a("granted 는 통과, 미동의(0)/철회(1→0) 는 403 FACE_CONSENT_REQUIRED", async () => {
    const v_3ed4c3 = await v_bfb240("fac-ok@test.local", 1);
    const v_7fa7c6 = await v_bfb240("fac-no@test.local", 0);
    const v_09dd65 = await v_bfb240("fac-rev@test.local", 1);
    await v_a1651b().prepare("UPDATE users SET face_biometric_consent = 0 WHERE id = ?").bind(v_09dd65).run();
    const v_062ae9 = await v_4d24a9(v_3ed4c3, "fac-clone");

    const v_070ae5 = await v_51c3d2("POST", "/oth-path", await v_ea333d(v_3ed4c3), { vector: v_46ff7a(), cloneId: v_062ae9 });
    v_4d37e3(v_070ae5.status).toBe(200);
    const v_aef41f = await v_51c3d2("GET", `/oth-path?cloneId=${v_062ae9}`, await v_ea333d(v_3ed4c3));
    v_4d37e3(v_aef41f.status).toBe(200);

    for (const v_ceb55a of [v_7fa7c6, v_09dd65]) {
      const v_8d41d7 = await v_ea333d(v_ceb55a);
      const v_20e160 = [
        ["POST", "/oth-path", { vector: v_46ff7a(), cloneId: v_062ae9 }],
        ["GET", `/oth-path?cloneId=${v_062ae9}`],
        ["POST", "/oth-path", { vectors: [v_46ff7a()], cloneId: v_062ae9 }],
        ["POST", "/oth-path", { vectors: [v_46ff7a()], cloneId: v_062ae9, displayName: "a" }],
        ["POST", "/oth-path"],
        ["POST", "/oth-path", { vector: v_46ff7a(), cloneId: v_062ae9 }],
        ["POST", `/oth-path${v_062ae9}/self-confirm`, { vectors: [v_46ff7a(), v_46ff7a(), v_46ff7a()] }],
      ];
      for (const [v_35f85c, v_e2a85c, v_148ff6] of v_20e160) {
        const v_cb35cb = await v_51c3d2(v_35f85c, v_e2a85c, v_8d41d7, v_148ff6);
        const v_b75e36 = await v_cb35cb.json<{ error: { code: string } }>();
        v_4d37e3(v_cb35cb.status, `${v_35f85c} ${v_e2a85c}`).toBe(403);
        v_4d37e3(v_b75e36.error.code, `${v_35f85c} ${v_e2a85c}`).toBe("FACE_CONSENT_REQUIRED");
      }
    }
  });

  v_23805a("미동의 사용자도 삭제·목록·self-face·person 생성은 막히지 않는다(생체정보 미처리/철회 경로)", async () => {
    const v_7fa7c6 = await v_bfb240("fac-free@test.local", 0);
    const v_062ae9 = await v_4d24a9(v_7fa7c6, "fac-free-clone");
    const v_8d41d7 = await v_ea333d(v_7fa7c6);
    v_4d37e3((await v_51c3d2("GET", `/oth-path?cloneId=${v_062ae9}`, v_8d41d7)).status).toBe(200);
    v_4d37e3((await v_51c3d2("GET", "/oth-path", v_8d41d7)).status).toBe(200);
    v_4d37e3((await v_51c3d2("DELETE", "/oth-path", v_8d41d7)).status).toBe(404); 
    v_4d37e3((await v_51c3d2("POST", "/oth-path", v_8d41d7, { cloneId: v_062ae9 })).status).toBe(201);
  });

  v_23805a("전이: 동의 저장 직후 /match 200 → 철회 후 403", async () => {
    const v_0c8987 = await v_bfb240("fac-trans@test.local", 0);
    const v_062ae9 = await v_4d24a9(v_0c8987, "fac-trans-clone");
    const v_8d41d7 = await v_ea333d(v_0c8987);
    const v_35f85c = () => v_51c3d2("POST", "/oth-path", v_8d41d7, { vector: v_46ff7a(), cloneId: v_062ae9 });
    v_4d37e3((await v_35f85c()).status).toBe(403);
    const v_696c65 = await v_51c3d2("POST", "/oth-path", v_8d41d7, { state: "granted" });
    v_4d37e3(v_696c65.status).toBeLessThan(300);
    v_4d37e3((await v_35f85c()).status).toBe(200);
    const v_e0920a = await v_51c3d2("POST", "/oth-path", v_8d41d7, { state: "revoked" });
    v_4d37e3(v_e0920a.status).toBeLessThan(300);
    v_4d37e3((await v_35f85c()).status).toBe(403);
  });
});
