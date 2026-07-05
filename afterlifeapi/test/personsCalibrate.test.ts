

import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { issueToken } from "../src/lib/jwt";
import { isFaceCalibrateEnabled } from "../src/routes/persons";

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
});
