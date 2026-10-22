

import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b2eae5 } from "../src/lib/jwt";
import { v_dbed3e } from "../src/lib/faceVectors";
import { v_003ee1 } from "../src/lib/cloneFaceScope";

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

async function v_51c3d2(v_9fe22d, v_9edd60, v_4d33b2) {
  return v_1df298.fetch(`https://x${v_9fe22d}`, {
    method: v_4d33b2 === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${v_9edd60}`, "Content-Type": "application/json" },
    body: v_4d33b2 === undefined ? undefined : JSON.stringify(v_4d33b2),
  });
}

v_469bf2("사용자 본인 얼굴 — 클론 간 인식", () => {
  v_ff107d(() => v_dbed3e());

  v_23805a("첫 통화 전 등록(userSelf) 후 다른 클론에서 본인으로 매칭되고 복사본이 생긴다", async () => {
    const v_0c8987 = await v_bfb240("self1@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "self_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "self_b");
    const v_9edd60 = await v_21cc31(v_0c8987);

    let v_72c7a6 = (await (await v_51c3d2("/oth-path", v_9edd60)).json()) as { hasSelfFace: boolean };
    v_4d37e3(v_72c7a6.hasSelfFace).toBe(false);

    const v_28eeb6 = (await (await v_51c3d2("/oth-path", v_9edd60, {
      cloneId: v_779914, displayName: "나", enrolledVia: "auto_biometric", userSelf: true,
    })).json()) as { id: number };
    await v_003ee1(v_9542f7, { userId: v_0c8987, cloneId: v_779914, personId: v_28eeb6.id, vectors: [v_46ff7a(7)] });

    v_72c7a6 = (await (await v_51c3d2("/oth-path", v_9edd60)).json()) as { hasSelfFace: boolean };
    v_4d37e3(v_72c7a6.hasSelfFace).toBe(true);

    const v_8f00b9 = (await (await v_51c3d2("/oth-path", v_9edd60, { vector: v_46ff7a(7), cloneId: v_148ff6 })).json()) as {
      best: { personId: number; displayName: string } | null;
    };
    v_4d37e3(v_8f00b9.best).not.toBeNull();
    v_4d37e3(v_8f00b9.best!.displayName).toBe("나");
    const v_b38746 = await v_a1651b()
      .prepare("SELECT id, clone_id, source_person_id FROM persons WHERE id = ?")
      .bind(v_8f00b9.best!.personId)
      .first<{ id: number; clone_id: number; source_person_id: number }>();
    v_4d37e3(v_b38746!.clone_id).toBe(v_148ff6);
    v_4d37e3(v_b38746!.source_person_id).toBe(v_28eeb6.id);
  });

  v_23805a("다른 사람(본인 아님) 얼굴은 다른 클론에서 인식되지 않는다", async () => {
    const v_0c8987 = await v_bfb240("self2@t.com");
    const v_779914 = await v_4d24a9(v_0c8987, "self2_a");
    const v_148ff6 = await v_4d24a9(v_0c8987, "self2_b");
    const v_9edd60 = await v_21cc31(v_0c8987);

    const v_a9cbf1 = (await (await v_51c3d2("/oth-path", v_9edd60, {
      cloneId: v_779914, displayName: "친구", enrolledVia: "auto_biometric",
    })).json()) as { id: number };
    await v_003ee1(v_9542f7, { userId: v_0c8987, cloneId: v_779914, personId: v_a9cbf1.id, vectors: [v_46ff7a(9)] });

    const v_8f00b9 = (await (await v_51c3d2("/oth-path", v_9edd60, { vector: v_46ff7a(9), cloneId: v_148ff6 })).json()) as {
      best: unknown;
    };
    v_4d37e3(v_8f00b9.best).toBeNull();
  });
});
