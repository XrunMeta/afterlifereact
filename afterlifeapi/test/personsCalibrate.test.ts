

import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { issueToken } from "../src/lib/jwt";
import { isFaceCalibrateEnabled } from "../src/routes/persons";
import { getFaceIndex } from "../src/lib/faceVectors";

const db = () => env.DB as unknown as D1Database;

async function seedUser(email: string): Promise<number> {
  await db()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

async function post(tok: string, body: unknown) {
  return SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("isFaceCalibrateEnabled (단위) — off 불변식", () => {
  it("env var 없음 → false(=404 경로)", () => {
    expect(isFaceCalibrateEnabled({})).toBe(false);
  });
  it("'0' → false", () => {
    expect(isFaceCalibrateEnabled({ FACE_CALIBRATE_ENABLED: "0" })).toBe(false);
  });
  it("'true'·다른 값 → false(엄격히 '1'만 on)", () => {
    expect(isFaceCalibrateEnabled({ FACE_CALIBRATE_ENABLED: "true" })).toBe(false);
  });
  it("'' (빈 문자열) → false", () => {
    expect(isFaceCalibrateEnabled({ FACE_CALIBRATE_ENABLED: "" })).toBe(false);
  });
  it("'1' → true", () => {
    expect(isFaceCalibrateEnabled({ FACE_CALIBRATE_ENABLED: "1" })).toBe(true);
  });
});

describe("POST /oth-path (HTTP 통합 — 테스트 바인딩 on 고정)", () => {
  it("저장하고 벡터는 응답/DB에 없다", async () => {
    const userId = await seedUser("calibrate-on-save@test.local");
    const tok = await issueAccessToken(userId);
    const vector = new Array(512).fill(0).map((_, i) => (i === 0 ? 1 : 0));

    const res = await post(tok, { vector, groundTruthPersonId: "p1" });
    expect(res.status).toBe(200);
    const j = await res.json<{
      id: number;
      matchedId: string | null;
      bestScore: number;
      threshold: number;
      scoreCount: number;
    }>();
    expect(j.id).toBeGreaterThan(0);
    expect(typeof j.bestScore).toBe("number");
    expect(typeof j.threshold).toBe("number");
    expect(typeof j.scoreCount).toBe("number");

    const row = await db()
      .prepare("SELECT * FROM face_calibrate_samples WHERE id = ?")
      .bind(j.id)
      .first<Record<string, unknown>>();
    expect(row).toBeTruthy();
    expect(row!.user_id).toBe(String(userId));
    expect(row!.ground_truth_person_id).toBe("p1");

    expect(JSON.stringify(row)).not.toContain('"vector"');

    const scores = JSON.parse(String(row!.scores_json));
    expect(Array.isArray(scores)).toBe(true);
    for (const s of scores) {
      expect(Object.keys(s).sort()).toEqual(["personId", "score"].sort());
    }
  });

  it("groundTruthPersonId 없이도 저장된다(선택 필드)", async () => {
    const userId = await seedUser("calibrate-no-gt@test.local");
    const tok = await issueAccessToken(userId);
    const vector = new Array(512).fill(0.05);

    const res = await post(tok, { vector });
    expect(res.status).toBe(200);
    const j = await res.json<{ id: number }>();
    const row = await db()
      .prepare("SELECT ground_truth_person_id FROM face_calibrate_samples WHERE id = ?")
      .bind(j.id)
      .first<{ ground_truth_person_id: string | null }>();
    expect(row!.ground_truth_person_id).toBeNull();
  });

  it("다른 사용자의 calibrate 결과는 격리된다(namespace 스코핑)", async () => {
    const ownerId = await seedUser("calibrate-owner@test.local");
    const otherId = await seedUser("calibrate-other@test.local");
    const ownerTok = await issueAccessToken(ownerId);
    const otherTok = await issueAccessToken(otherId);
    const vector = new Array(512).fill(0.02);

    const r1 = await post(ownerTok, { vector });
    expect(r1.status).toBe(200);
    const r2 = await post(otherTok, { vector });
    expect(r2.status).toBe(200);

    const rows = await db()
      .prepare("SELECT user_id FROM face_calibrate_samples WHERE user_id = ?")
      .bind(String(ownerId))
      .all<{ user_id: string }>();
    expect(rows.results.length).toBeGreaterThan(0);
    expect(rows.results.every((r) => r.user_id === String(ownerId))).toBe(true);
  });

  it("vector 길이 오류 → 400, 메시지에 벡터값 없음", async () => {
    const userId = await seedUser("calibrate-badvec@test.local");
    const tok = await issueAccessToken(userId);
    const res = await post(tok, { vector: [1, 2, 3] });
    expect(res.status).toBe(400);
    const t = await res.text();
    expect(t).not.toContain("1,2,3");
  });

  it("vector 누락 → 400", async () => {
    const userId = await seedUser("calibrate-novec@test.local");
    const tok = await issueAccessToken(userId);
    const res = await post(tok, {});
    expect(res.status).toBe(400);
  });

  it("vector에 비수치 포함 → 400", async () => {
    const userId = await seedUser("calibrate-nonnumeric@test.local");
    const tok = await issueAccessToken(userId);
    const bad = new Array(512).fill(0.1);
    bad[0] = "x";
    const res = await post(tok, { vector: bad });
    expect(res.status).toBe(400);
  });

  it("인증 없이 호출 → 401", async () => {
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vector: new Array(512).fill(0.1) }),
    });
    expect(res.status).toBe(401);
  });

  it("metadata 없는 매치는 scores에서 제외된다(personId 둔갑 방지)", async () => {
    const userId = await seedUser("calibrate-no-metadata@test.local");
    const tok = await issueAccessToken(userId);
    const ns = String(userId);
    const vector = new Array(512).fill(0).map((_, i) => (i === 0 ? 1 : 0));

    const idx = getFaceIndex(env as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string });
    await idx.insert([
      { id: "orphan-embedding-no-metadata", values: vector, namespace: ns }, 
      { id: "with-metadata", values: vector, namespace: ns, metadata: { personId: "777" } },
    ]);

    const res = await post(tok, { vector });
    expect(res.status).toBe(200);
    const j = await res.json<{ id: number; matchedId: string | null; scoreCount: number }>();

    expect(j.scoreCount).toBe(1);

    const row = await db()
      .prepare("SELECT scores_json FROM face_calibrate_samples WHERE id = ?")
      .bind(j.id)
      .first<{ scores_json: string }>();
    const scores = JSON.parse(String(row!.scores_json)) as { personId: string; score: number }[];
    expect(scores.length).toBe(1);
    expect(scores[0].personId).toBe("777");
    expect(scores.some((s) => s.personId === "orphan-embedding-no-metadata")).toBe(false);
  });
});

describe("GET /oth-path (폴링 조회 — Task 2)", () => {

  async function get(tok: string, qs = "") {
    return SELF.fetch(`http://localhost/oth-path${qs}`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
  }

  it("자기 userId 샘플만, since 커서 동작", async () => {
    const u1 = await seedUser("calibrate-samples-u1@test.local");
    const u2 = await seedUser("calibrate-samples-u2@test.local");
    const tok1 = await issueAccessToken(u1);

    await db()
      .prepare(
        `INSERT INTO face_calibrate_samples
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, 'p1', 0.9, 0.83, '[{"personId":"p1","score":0.9}]', 1),
                (?, NULL, NULL, 0.4, 0.83, '[]', 2),
                (?, NULL, 'p9', 0.8, 0.83, '[]', 3)`
      )
      .bind(String(u1), String(u1), String(u2))
      .run();

    const res = await get(tok1);
    expect(res.status).toBe(200);
    const j = await res.json<{
      samples: { id: number; matchedId: string | null }[];
      nextSince: number;
    }>();
    expect(j.samples.length).toBe(2);
    expect(j.samples.every((s) => s.matchedId !== "p9")).toBe(true); 

    const res2 = await get(tok1, `?since=${j.samples[0].id}`);
    expect(res2.status).toBe(200);
    const j2 = await res2.json<{ samples: unknown[] }>();
    expect(j2.samples.length).toBe(1);
  });

  it("scores_json을 파싱해 scores 배열/필드 매핑으로 반환한다", async () => {
    const u = await seedUser("calibrate-samples-scores@test.local");
    const tok = await issueAccessToken(u);
    await db()
      .prepare(
        `INSERT INTO face_calibrate_samples
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, 'p1', 'p1', 0.92, 0.83, '[{"personId":"p1","score":0.92},{"personId":"p2","score":0.3}]', 10)`
      )
      .bind(String(u))
      .run();

    const res = await get(tok);
    expect(res.status).toBe(200);
    const j = await res.json<{
      samples: {
        id: number;
        ts: number;
        groundTruthPersonId: string | null;
        matchedId: string | null;
        bestScore: number;
        threshold: number;
        scores: { personId: string; score: number }[];
      }[];
    }>();
    expect(j.samples.length).toBe(1);
    const s = j.samples[0];
    expect(s.ts).toBe(10);
    expect(s.groundTruthPersonId).toBe("p1");
    expect(s.matchedId).toBe("p1");
    expect(s.bestScore).toBe(0.92);
    expect(s.threshold).toBe(0.83);
    expect(s.scores).toEqual([
      { personId: "p1", score: 0.92 },
      { personId: "p2", score: 0.3 },
    ]);
  });

  it("limit 파라미터가 페이지 크기를 제한하고 nextSince를 갱신한다", async () => {
    const u = await seedUser("calibrate-samples-limit@test.local");
    const tok = await issueAccessToken(u);
    await db()
      .prepare(
        `INSERT INTO face_calibrate_samples
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, NULL, 0.1, 0.83, '[]', 100),
                (?, NULL, NULL, 0.1, 0.83, '[]', 101),
                (?, NULL, NULL, 0.1, 0.83, '[]', 102)`
      )
      .bind(String(u), String(u), String(u))
      .run();

    const res = await get(tok, "?limit=2");
    expect(res.status).toBe(200);
    const j = await res.json<{ samples: { id: number }[]; nextSince: number }>();
    expect(j.samples.length).toBe(2);
    expect(j.nextSince).toBe(j.samples[1].id);
  });

  it("인증 없이 호출 → 401", async () => {
    const res = await SELF.fetch("http://localhost/oth-path");
    expect(res.status).toBe(401);
  });

  it("since가 최대 id 이상이면 빈 배열 + nextSince === since(커서 되감김 없음)", async () => {
    const u = await seedUser("calibrate-samples-since-beyond@test.local");
    const tok = await issueAccessToken(u);
    await db()
      .prepare(
        `INSERT INTO face_calibrate_samples
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, NULL, 0.1, 0.83, '[]', 200)`
      )
      .bind(String(u))
      .run();

    const beyond = 999999;
    const res = await get(tok, `?since=${beyond}`);
    expect(res.status).toBe(200);
    const j = await res.json<{ samples: unknown[]; nextSince: number }>();
    expect(j.samples.length).toBe(0);
    expect(j.nextSince).toBe(beyond);
  });

  it("since=-1(음수)·since=abc(NaN) → 0으로 폴백해 첫 페이지 정상 반환", async () => {
    const u = await seedUser("calibrate-samples-since-fallback@test.local");
    const tok = await issueAccessToken(u);
    await db()
      .prepare(
        `INSERT INTO face_calibrate_samples
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, NULL, 0.1, 0.83, '[]', 300)`
      )
      .bind(String(u))
      .run();

    const resBaseline = await get(tok);
    expect(resBaseline.status).toBe(200);
    const jBaseline = await resBaseline.json<{ samples: unknown[] }>();

    const resNeg = await get(tok, "?since=-1");
    expect(resNeg.status).toBe(200);
    const jNeg = await resNeg.json<{ samples: unknown[] }>();
    expect(jNeg.samples.length).toBe(jBaseline.samples.length);

    const resNaN = await get(tok, "?since=abc");
    expect(resNaN.status).toBe(200);
    const jNaN = await resNaN.json<{ samples: unknown[] }>();
    expect(jNaN.samples.length).toBe(jBaseline.samples.length);
  });

  it("limit=999 → 에러 없이 동작(내부 200 clamp), 시드 건수 이하로 반환", async () => {
    const u = await seedUser("calibrate-samples-limit-over@test.local");
    const tok = await issueAccessToken(u);
    await db()
      .prepare(
        `INSERT INTO face_calibrate_samples
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, NULL, 0.1, 0.83, '[]', 400),
                (?, NULL, NULL, 0.1, 0.83, '[]', 401),
                (?, NULL, NULL, 0.1, 0.83, '[]', 402)`
      )
      .bind(String(u), String(u), String(u))
      .run();

    const res = await get(tok, "?limit=999");
    expect(res.status).toBe(200);
    const j = await res.json<{ samples: unknown[] }>();

    expect(j.samples.length).toBe(3);
  });

  it("scores_json이 손상된 행이 있어도 500이 아니라 그 행만 scores:[]로 폴백하고 커서가 전진한다", async () => {
    const u = await seedUser("calibrate-samples-corrupt-json@test.local");
    const tok = await issueAccessToken(u);
    await db()
      .prepare(
        `INSERT INTO face_calibrate_samples
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, 'p1', 0.5, 0.83, 'not-valid-json{{{', 500),
                (?, NULL, 'p2', 0.6, 0.83, '[{"personId":"p2","score":0.6}]', 501)`
      )
      .bind(String(u), String(u))
      .run();

    const res = await get(tok);
    expect(res.status).toBe(200);
    const j = await res.json<{
      samples: { id: number; matchedId: string | null; scores: unknown[] }[];
      nextSince: number;
    }>();
    expect(j.samples.length).toBe(2);
    const corrupted = j.samples.find((s) => s.matchedId === "p1")!;
    const ok = j.samples.find((s) => s.matchedId === "p2")!;
    expect(corrupted.scores).toEqual([]);
    expect(ok.scores).toEqual([{ personId: "p2", score: 0.6 }]);

    expect(j.nextSince).toBe(ok.id);
  });

});

describe("wrangler.toml FACE_CALIBRATE_ENABLED 정적 안전망(off→404 회귀 방지)", () => {
  it("[vars]·[env.preview.vars]·[env.production.vars] 전부 \"0\"이어야 한다", async () => {

    const { default: toml } = await import("../wrangler.toml?raw");

    const matches = [...(toml as string).matchAll(/FACE_CALIBRATE_ENABLED\s*=\s*"([^"]*)"/g)].map((m) => m[1]);

    expect(matches.length).toBe(3);
    for (const v of matches) {
      expect(v).toBe("0");
    }
  });
});
