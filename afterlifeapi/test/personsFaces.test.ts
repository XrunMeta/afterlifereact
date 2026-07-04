import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_a8d2cc } from "../src/lib/faceVectors";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_4e7b87(v_ea333d): Promise<number> {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
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

function v_46ff7a(v_4a1c36 = 0.1): number[] {
  return Array(512).fill(v_4a1c36);
}

v_469bf2("POST /oth-path", () => {
  v_23805a("consent 없는 person enroll → 403", async () => {
    const v_43e90c = await v_bfb240("faces-noconsent@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_ca1ec5 = await v_4e7b87(v_ea333d);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [v_46ff7a()] }),
    });

    v_4d37e3(v_8f00b9.status).toBe(403);
    const v_4d33b2 = (await v_8f00b9.json()) as { error: { code: string } };
    v_4d37e3(v_4d33b2.error.code).toBe("FORBIDDEN");
  });

  v_23805a("consent granted → 200, face_embeddings 행 N개 생성", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_43e90c = await v_bfb240("faces-granted@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_ca1ec5 = await v_4e7b87(v_ea333d);
    await v_a56201(v_ea333d, v_ca1ec5);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [v_46ff7a(0.1), v_46ff7a(0.2), v_46ff7a(0.3)] }),
    });

    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { enrolled: number };
    v_4d37e3(v_4d33b2.enrolled).toBe(3);

    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT COUNT(*) c FROM face_embeddings WHERE person_id = ?")
      .bind(v_ca1ec5)
      .first<{ c: number }>();
    v_4d37e3(v_3ac7e7?.c).toBe(3);

    const v_e86ad8 = v_a8d2cc(v_c9c489 as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string });
    const v_80a1ce = await v_e86ad8.query(v_46ff7a(0.1), { topK: 3, namespace: String(v_43e90c), returnMetadata: true });
    v_4d37e3(v_80a1ce.matches.length).toBeGreaterThan(0);
    v_4d37e3(v_80a1ce.matches[0].metadata?.personId).toBe(String(v_ca1ec5));
  });

  v_23805a("vectors 검증: 512 아님/6개 초과/비수치 → 422 VALIDATION_FAILED", async () => {
    const v_43e90c = await v_bfb240("faces-invalid@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_ca1ec5 = await v_4e7b87(v_ea333d);
    await v_a56201(v_ea333d, v_ca1ec5);

    const v_1d5e5f = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [Array(10).fill(0.1)] }),
    });
    v_4d37e3(v_1d5e5f.status).toBe(422);
    v_4d37e3(((await v_1d5e5f.json()) as { error: { code: string } }).error.code).toBe("VALIDATION_FAILED");

    const v_48bbbd = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: Array(6).fill(v_46ff7a()) }),
    });
    v_4d37e3(v_48bbbd.status).toBe(422);

    const v_e8fe74 = v_46ff7a();
    v_e8fe74[0] = "x" as unknown as number;
    const v_0c452c = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [v_e8fe74] }),
    });
    v_4d37e3(v_0c452c.status).toBe(422);
  });

  v_23805a("타인 소유 person → 404", async () => {
    const v_257b90 = await v_bfb240("faces-owner@test.local");
    const v_53bb36 = await v_bfb240("faces-attacker@test.local");
    const v_40444e = await v_86c39f(v_257b90);
    const v_d82c92 = await v_86c39f(v_53bb36);

    const v_ca1ec5 = await v_4e7b87(v_40444e);
    await v_a56201(v_40444e, v_ca1ec5);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_d82c92}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [v_46ff7a()] }),
    });

    v_4d37e3(v_8f00b9.status).toBe(404);
    const v_4d33b2 = (await v_8f00b9.json()) as { error: { code: string } };
    v_4d37e3(v_4d33b2.error.code).toBe("NOT_FOUND");
  });

  v_23805a("비정수 person id(/faces) → 422 VALIDATION_FAILED (parsePersonId 재사용, 500 아님)", async () => {
    const v_43e90c = await v_bfb240("faces-nanid@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);

    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [v_46ff7a()] }),
    });

    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_4d33b2 = (await v_8f00b9.json()) as { error: { code: string } };
    v_4d37e3(v_4d33b2.error.code).toBe("VALIDATION_FAILED");
  });
});
