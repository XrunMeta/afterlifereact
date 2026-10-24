import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at, face_biometric_consent) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_4e7b87(v_ea333d, v_6e0fd3): Promise<number> {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ cloneId: v_6e0fd3 }),
  });
  const { id: v_389afb } = (await v_8f00b9.json()) as { id: number };
  return v_389afb;
}

async function v_a56201(v_ea333d, v_ca1ec5) {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/consent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ state: "granted" }),
  });
  v_4d37e3(v_8f00b9.status).toBe(200);
}

async function v_eb0ef3(v_ea333d, v_43e90c, v_6e0fd3, v_ca1ec5, v_f9a45c) {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/faces`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ cloneId: v_6e0fd3, vectors: [v_f9a45c] }),
  });
  v_4d37e3(v_8f00b9.status).toBe(200);

  void v_43e90c;
}

function v_46ff7a(v_4a1c36 = 0.1): number[] {
  return Array(512).fill(v_4a1c36);
}

function v_a4bfae(): number[] {
  return Array.from({ length: 512 }, (v_37eab7, v_ebec57) => (v_ebec57 < 256 ? 1 : -1));
}

async function v_a63110(v_ea333d, v_f9a45c, v_6e0fd3) {
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ vector: v_f9a45c, cloneId: v_6e0fd3 }),
  });
}

v_469bf2("POST /oth-path", () => {
  v_23805a("enroll된 person과 같은 벡터 → best 일치·score>0.99", async () => {
    const v_43e90c = await v_bfb240("match-same@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "match-same-clone");
    const v_ca1ec5 = await v_4e7b87(v_ea333d, v_6e0fd3);
    await v_a56201(v_ea333d, v_ca1ec5);
    await v_eb0ef3(v_ea333d, v_43e90c, v_6e0fd3, v_ca1ec5, v_46ff7a(0.1));

    const v_8f00b9 = await v_a63110(v_ea333d, v_46ff7a(0.1), v_6e0fd3);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as {
      matches: { personId: number; displayName: string | null; score: number }[];
      best: { personId: number; displayName: string | null; score: number } | null;
      threshold: number;
    };
    v_4d37e3(v_4d33b2.best).not.toBeNull();
    v_4d37e3(v_4d33b2.best!.personId).toBe(v_ca1ec5);
    v_4d37e3(v_4d33b2.best!.score).toBeGreaterThan(0.99);
  });

  v_23805a("전혀 다른(직교) 벡터 → best null", async () => {
    const v_43e90c = await v_bfb240("match-orth@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "match-orth-clone");
    const v_ca1ec5 = await v_4e7b87(v_ea333d, v_6e0fd3);
    await v_a56201(v_ea333d, v_ca1ec5);
    await v_eb0ef3(v_ea333d, v_43e90c, v_6e0fd3, v_ca1ec5, v_46ff7a(0.1));

    const v_8f00b9 = await v_a63110(v_ea333d, v_a4bfae(), v_6e0fd3);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { best: unknown };
    v_4d37e3(v_4d33b2.best).toBeNull();
  });

  v_23805a("사용자 B가 A 소유 공개 클론으로 match 시도 → 200이지만 A의 등록은 보이지 않는다(namespace 격리)", async () => {
    const v_1badb6 = await v_bfb240("match-owner@test.local");
    const v_7f0625 = await v_bfb240("match-attacker@test.local");
    const v_40444e = await v_86c39f(v_1badb6);
    const v_d82c92 = await v_86c39f(v_7f0625);
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "match-owner-clone");

    const v_ca1ec5 = await v_4e7b87(v_40444e, v_6e0fd3);
    await v_a56201(v_40444e, v_ca1ec5);
    await v_eb0ef3(v_40444e, v_1badb6, v_6e0fd3, v_ca1ec5, v_46ff7a(0.1));

    const v_8f00b9 = await v_a63110(v_d82c92, v_46ff7a(0.1), v_6e0fd3);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { best: unknown | null; matches: unknown[] };
    v_4d37e3(v_4d33b2.best).toBeNull();
    v_4d37e3(v_4d33b2.matches).toHaveLength(0);
  });

  v_23805a("비공개(private) 클론으로 타인이 match 시도 → 404(진짜 비접근은 계속 차단)", async () => {
    const v_1badb6 = await v_bfb240("match-priv-owner@test.local");
    await v_a1651b()
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Private', 'match-priv-clone', 'memlow', 'private', CURRENT_TIMESTAMP)`,
      )
      .bind(v_1badb6)
      .run();
    const v_6e0fd3 = (
      await v_a1651b().prepare("SELECT id FROM clones WHERE username = 'match-priv-clone'").first<{ id: number }>()
    )!.id;
    const v_0b00e8 = await v_bfb240("match-priv-stranger@test.local");
    const v_36f9f9 = await v_86c39f(v_0b00e8);

    const v_8f00b9 = await v_a63110(v_36f9f9, v_46ff7a(0.1), v_6e0fd3);
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("vector 형식 오류(길이 부족) → 422 VALIDATION_FAILED", async () => {
    const v_43e90c = await v_bfb240("match-badvec@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);

    const v_8f00b9 = await v_a63110(v_ea333d, Array(10).fill(0.1));
    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_4d33b2 = (await v_8f00b9.json()) as { error: { code: string } };
    v_4d37e3(v_4d33b2.error.code).toBe("VALIDATION_FAILED");
  });

  v_23805a("vector에 비수치 포함 → 422 VALIDATION_FAILED", async () => {
    const v_43e90c = await v_bfb240("match-nonnumeric@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_0af197 = v_46ff7a();
    (v_0af197 as unknown[])[0] = "x";

    const v_8f00b9 = await v_a63110(v_ea333d, v_0af197);
    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_4d33b2 = (await v_8f00b9.json()) as { error: { code: string } };
    v_4d37e3(v_4d33b2.error.code).toBe("VALIDATION_FAILED");
  });

  v_23805a("app_config face.match_threshold 반영 → 응답 threshold 필드 일치(임계값 충족 불가하면 best null)", async () => {
    const v_43e90c = await v_bfb240("match-threshold@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "match-threshold-clone");
    const v_ca1ec5 = await v_4e7b87(v_ea333d, v_6e0fd3);
    await v_a56201(v_ea333d, v_ca1ec5);
    await v_eb0ef3(v_ea333d, v_43e90c, v_6e0fd3, v_ca1ec5, v_46ff7a(0.1));

    await v_a1651b()
      .prepare(
        "INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('face.match_threshold', '1.5', 1)"
      )
      .run();

    const v_8f00b9 = await v_a63110(v_ea333d, v_46ff7a(0.1), v_6e0fd3);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { threshold: number; best: unknown };
    v_4d37e3(v_4d33b2.threshold).toBe(1.5);
    v_4d37e3(v_4d33b2.best).toBeNull();

    await v_a1651b().prepare("DELETE FROM app_config WHERE key = 'face.match_threshold'").run();
  });
});
