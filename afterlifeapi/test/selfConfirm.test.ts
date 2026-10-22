import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_dbed3e } from "../src/lib/faceVectors";
import { v_b2eae5 } from "../src/lib/jwt";
import { v_4c5429 } from "../src/lib/cloneFaceScope";
import { v_3ebe58 } from "../src/lib/errors";
import type { v_273a0c } from "../src/lib/env";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent, face_biometric_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1, 1)`,
    )
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427, v_3a8949 = "memlow"): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427, v_3a8949)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

function v_46ff7a(v_bdb39e): number[] {
  const v_81e2ef = new Array(512).fill(0);
  v_81e2ef[v_bdb39e % 512] = 1;
  return v_81e2ef;
}

async function v_182fdb(v_e0c7e8): Promise<string> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_ceb55a!.id, kind: "access" }, v_43fd42, 60 * 10);
}

v_469bf2("POST /oth-path", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  v_23805a("3벡터 확정 시 clones.self_person_id 가 설정된다", async () => {
    const v_43e90c = await v_bfb240("t257f@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257f-clone");
    const v_21cc31 = await v_182fdb("t257f@x.com");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vectors: [v_46ff7a(3), v_46ff7a(3), v_46ff7a(3)], displayName: "제작자" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ personId: number; selfPersonId: number }>();
    v_4d37e3(v_4d33b2.personId).toBe(v_4d33b2.selfPersonId);

    const v_eb25ce = await v_a1651b
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(v_6e0fd3)
      .first<{ self_person_id: number | null }>();
    v_4d37e3(v_eb25ce?.self_person_id).toBe(v_4d33b2.personId);

    const v_550b91 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE clone_id = ? AND source = 'self'")
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_550b91?.n).toBe(3);
  });

  v_23805a("이미 self가 확정된 클론은 409", async () => {
    const v_43e90c = await v_bfb240("t257g@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257g-clone");
    const v_21cc31 = await v_182fdb("t257g@x.com");

    const v_3f4675 = { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` };
    await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: v_3f4675,
      body: JSON.stringify({ vectors: [v_46ff7a(4), v_46ff7a(4), v_46ff7a(4)] }),
    });
    const v_486a80 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: v_3f4675,
      body: JSON.stringify({ vectors: [v_46ff7a(5), v_46ff7a(5), v_46ff7a(5)] }),
    });
    v_4d37e3(v_486a80.status).toBe(409);
  });

  v_23805a("전문가 클론은 422 — self 개념이 없다", async () => {
    const v_43e90c = await v_bfb240("t257h@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257h-clone", "expert");
    const v_21cc31 = await v_182fdb("t257h@x.com");

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vectors: [v_46ff7a(6), v_46ff7a(6), v_46ff7a(6)] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("벡터가 3개가 아니면 422", async () => {
    const v_43e90c = await v_bfb240("t257i@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257i-clone");
    const v_21cc31 = await v_182fdb("t257i@x.com");

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vectors: [v_46ff7a(7), v_46ff7a(7)] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("타 사용자 소유 클론이면 404", async () => {
    const v_1badb6 = await v_bfb240("t257j-owner@x.com");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "t257j-owner-clone");
    await v_bfb240("t257j-other@x.com");
    const v_21cc31 = await v_182fdb("t257j-other@x.com");

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vectors: [v_46ff7a(8), v_46ff7a(8), v_46ff7a(8)] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("소유자 본인이어도 소프트삭제된 클론이면 404(deletion_state≠active)", async () => {
    const v_43e90c = await v_bfb240("t257k@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257k-deleted");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(`UPDATE clones SET deletion_state = 'soft_deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(v_6e0fd3)
      .run();
    const v_21cc31 = await v_182fdb("t257k@x.com");

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vectors: [v_46ff7a(9), v_46ff7a(9), v_46ff7a(9)] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });
});

v_469bf2("confirmSelf() 경합 가드 — self_person_id UPDATE 영향행 0", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  v_23805a("경합 패자는 CONFLICT를 던지고 자신이 만든 person/벡터를 정리한다(고아 없음)", async () => {
    const v_43e90c = await v_bfb240("t257l@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257l-clone");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_a5302d = v_c9c489 as unknown as v_273a0c;

    const v_0a9f0b = await v_4c5429(v_a5302d, {
      userId: v_43e90c,
      cloneId: v_6e0fd3,
      vectors: [v_46ff7a(10), v_46ff7a(10), v_46ff7a(10)],
      displayName: "승자",
    });

    let v_c30a61 = null;
    try {
      await v_4c5429(v_a5302d, {
        userId: v_43e90c,
        cloneId: v_6e0fd3,
        vectors: [v_46ff7a(11), v_46ff7a(11), v_46ff7a(11)],
        displayName: "패자",
      });
    } catch (v_9e86fd) {
      v_c30a61 = v_9e86fd;
    }
    v_4d37e3(v_c30a61).toBeInstanceOf(v_3ebe58);
    v_4d37e3((v_c30a61 as v_3ebe58).code).toBe("CONFLICT");
    v_4d37e3((v_c30a61 as v_3ebe58).status).toBe(409);

    const v_eb25ce = await v_a1651b
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(v_6e0fd3)
      .first<{ self_person_id: number | null }>();
    v_4d37e3(v_eb25ce?.self_person_id).toBe(v_0a9f0b.personId);

    const v_fded81 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM persons WHERE clone_id = ?")
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_fded81?.n).toBe(1);

    const v_550b91 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE clone_id = ?")
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_550b91?.n).toBe(3);
  });
});

v_469bf2("DELETE /oth-path 로 self 삭제 → self_person_id NULL화 → 재확정 성공", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  v_23805a("self person 삭제 후 clones.self_person_id가 NULL이 되고, 동일 클론에 self-confirm 재시도가 200으로 성공한다", async () => {
    const v_43e90c = await v_bfb240("t257selfdel@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257selfdel-clone");
    const v_21cc31 = await v_182fdb("t257selfdel@x.com");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3f4675 = { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` };

    const v_f4441a = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: v_3f4675,
      body: JSON.stringify({ vectors: [v_46ff7a(40), v_46ff7a(40), v_46ff7a(40)], displayName: "지울제작자" }),
    });
    v_4d37e3(v_f4441a.status).toBe(200);
    const { personId: v_ca1ec5 } = await v_f4441a.json<{ personId: number }>();

    const v_0cfb8d = await v_a1651b
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(v_6e0fd3)
      .first<{ self_person_id: number | null }>();
    v_4d37e3(v_0cfb8d?.self_person_id).toBe(v_ca1ec5);

    const v_8bd83b = await v_1df298.fetch(`https://x/oth-path${v_ca1ec5}`, {
      method: "DELETE",
      headers: v_3f4675,
    });
    v_4d37e3(v_8bd83b.status).toBe(200);

    const v_d0f0cb = await v_a1651b
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(v_6e0fd3)
      .first<{ self_person_id: number | null }>();
    v_4d37e3(v_d0f0cb?.self_person_id).toBeNull();

    const v_d6f419 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: v_3f4675,
      body: JSON.stringify({ vectors: [v_46ff7a(41), v_46ff7a(41), v_46ff7a(41)], displayName: "재확정제작자" }),
    });
    v_4d37e3(v_d6f419.status).toBe(200);
    const v_82ea38 = await v_d6f419.json<{ personId: number }>();
    v_4d37e3(v_82ea38.personId).not.toBe(v_ca1ec5);

    const v_ca588a = await v_a1651b
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(v_6e0fd3)
      .first<{ self_person_id: number | null }>();
    v_4d37e3(v_ca588a?.self_person_id).toBe(v_82ea38.personId);
  });
});

v_469bf2("confirmSelf() enroll 실패 → 고아 person 없음 + 재시도 성공", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  v_23805a("Vectorize insert 실패 시 person 행이 남지 않고, 동일 displayName 재시도는 200으로 성공한다", async () => {
    const v_43e90c = await v_bfb240("t257m@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257m-clone");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    const v_6b8a4e = {
      insert: async () => {
        throw new Error("simulated vectorize insert failure");
      },
      query: async () => ({ matches: [] }),
      deleteByIds: async () => {},
    } as unknown as VectorizeIndex;
    const v_5f322f = new Proxy(v_c9c489 as unknown as v_273a0c, {
      get(v_5f5d6d, v_e36420, v_b9fbb4) {
        if (v_e36420 === "FACE_VECTORS") return v_6b8a4e;
        return Reflect.get(v_5f5d6d, v_e36420, v_b9fbb4);
      },
    });

    await v_4d37e3(
      v_4c5429(v_5f322f, {
        userId: v_43e90c,
        cloneId: v_6e0fd3,
        vectors: [v_46ff7a(12), v_46ff7a(12), v_46ff7a(12)],
        displayName: "재시도",
      }),
    ).rejects.toThrow();

    const v_fded81 = await v_a1651b
      .prepare("SELECT COUNT(*) AS n FROM persons WHERE clone_id = ?")
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_fded81?.n).toBe(0);
    const v_eb25ce = await v_a1651b
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(v_6e0fd3)
      .first<{ self_person_id: number | null }>();
    v_4d37e3(v_eb25ce?.self_person_id).toBeNull();

    const v_21cc31 = await v_182fdb("t257m@x.com");
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vectors: [v_46ff7a(13), v_46ff7a(13), v_46ff7a(13)], displayName: "재시도" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
  });
});

v_469bf2("self-confirm — 이미 등록된 같은 얼굴 재사용", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  async function v_73029f(v_43e90c, v_6e0fd3, v_1833e7, v_bdb39e): Promise<number> {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_43af15 = await v_a1651b
      .prepare(
        `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
         VALUES (?, ?, ?, 'granted', 0, 'auto_biometric', 0)`,
      )
      .bind(v_43e90c, v_6e0fd3, v_1833e7)
      .run();
    const v_d4923e = v_43af15.meta.last_row_id as number;
    const { enrollCloneScopeFaces: v_003ee1 } = await import("../src/lib/cloneFaceScope");
    await v_003ee1(v_c9c489 as unknown as v_273a0c, { userId: v_43e90c, cloneId: v_6e0fd3, personId: v_d4923e, vectors: [v_46ff7a(v_bdb39e)] });
    return v_d4923e;
  }

  v_23805a("같은 얼굴이 있으면 새 person 없이 그 사람이 self", async () => {
    const v_43e90c = await v_bfb240("t257r1@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257r1-clone");
    const v_d4923e = await v_73029f(v_43e90c, v_6e0fd3, "Guao", 9);
    const v_cb35cb = await v_4c5429(v_c9c489 as unknown as v_273a0c, { userId: v_43e90c, cloneId: v_6e0fd3, vectors: [v_46ff7a(9), v_46ff7a(9), v_46ff7a(9)] });
    v_4d37e3(v_cb35cb).toEqual({ personId: v_d4923e, selfPersonId: v_d4923e, reused: true });
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_f4e98d = await v_a1651b.prepare("SELECT COUNT(*) AS n FROM persons WHERE user_id = ? AND clone_id = ?").bind(v_43e90c, v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_f4e98d?.n).toBe(1);
    const v_3f4e2e = await v_a1651b.prepare("SELECT self_person_id FROM clones WHERE id = ?").bind(v_6e0fd3).first<{ self_person_id: number }>();
    v_4d37e3(v_3f4e2e?.self_person_id).toBe(v_d4923e);
  });

  v_23805a("다른 얼굴만 있으면 기존대로 새 person 을 만든다", async () => {
    const v_43e90c = await v_bfb240("t257r2@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257r2-clone");
    const v_d4923e = await v_73029f(v_43e90c, v_6e0fd3, "엄마", 9);
    const v_cb35cb = await v_4c5429(v_c9c489 as unknown as v_273a0c, { userId: v_43e90c, cloneId: v_6e0fd3, vectors: [v_46ff7a(10), v_46ff7a(10), v_46ff7a(10)] });
    v_4d37e3(v_cb35cb.reused).toBeUndefined();
    v_4d37e3(v_cb35cb.personId).not.toBe(v_d4923e);
  });

  v_23805a("다른 계정이 같은 클론에 등록한 같은 얼굴은 재사용하지 않는다", async () => {
    const v_257b90 = await v_bfb240("t257r3@x.com");
    const v_a9cbf1 = await v_bfb240("t257r3b@x.com");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "t257r3-clone");
    const v_0028f5 = await v_73029f(v_a9cbf1, v_6e0fd3, "남", 11);
    const v_cb35cb = await v_4c5429(v_c9c489 as unknown as v_273a0c, { userId: v_257b90, cloneId: v_6e0fd3, vectors: [v_46ff7a(11), v_46ff7a(11), v_46ff7a(11)] });
    v_4d37e3(v_cb35cb.reused).toBeUndefined();
    v_4d37e3(v_cb35cb.personId).not.toBe(v_0028f5);
  });
});
