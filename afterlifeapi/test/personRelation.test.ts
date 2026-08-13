import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function tok(uid: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await issueToken({ sub: uid, kind: "access" }, secret, 600);
}

async function seedPerson(userId: number, cloneId: number | null, name: string) {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)",
    )
    .bind(userId, `u${userId}@t`, "x", "U")
    .run();
  const row = await db
    .prepare(
      "INSERT INTO persons (user_id, clone_id, display_name, created_at) VALUES (?,?,?,?) RETURNING id",
    )
    .bind(userId, cloneId, name, Date.now())
    .first<{ id: number }>();
  return row!.id;
}

const patch = async (personId: number, token: string, body: unknown) =>
  SELF.fetch(`http://localhost/oth-path${personId}/relation`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

const readL2p = (cloneId: number, personId: number) =>
  (env.DB as unknown as D1Database)
    .prepare("SELECT data FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
    .bind(cloneId, personId)
    .first<{ data: string }>();

describe("PATCH /oth-path", () => {
  it("L2' 가 없으면 새로 만들어 relation 을 적는다", async () => {
    const id = await seedPerson(801, 8801, "rel-new");
    const res = await patch(id, await tok(801), { relation: "손주" });
    expect(res.status).toBe(200);

    const row = await readL2p(8801, id);
    expect(JSON.parse(row!.data).relation).toBe("손주");
  });

  it("기존 L2' 의 다른 키를 지우지 않는다 — 자동 학습분 보존", async () => {
    const id = await seedPerson(802, 8802, "rel-merge");
    await (env.DB as unknown as D1Database)
      .prepare(
        "INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?,?,?,unixepoch())",
      )
      .bind(
        8802,
        id,
        JSON.stringify({ relation: "옛관계", memories_personal: ["어제 등산 감"] }),
      )
      .run();

    expect((await patch(id, await tok(802), { relation: "오랜 친구" })).status).toBe(200);

    const data = JSON.parse((await readL2p(8802, id))!.data);
    expect(data.relation).toBe("오랜 친구");
    expect(data.memories_personal).toEqual(["어제 등산 감"]);
  });

  it("남의 person 은 건드리지 못한다", async () => {
    const id = await seedPerson(803, 8803, "rel-other");
    const res = await patch(id, await tok(804), { relation: "침입" });
    expect(res.status).toBe(404);
    expect(await readL2p(8803, id)).toBeNull();
  });

  it("빈 relation·과길이는 400대로 거부한다", async () => {
    const id = await seedPerson(805, 8805, "rel-bad");
    const t = await tok(805);
    expect((await patch(id, t, {})).status).toBeGreaterThanOrEqual(400);
    expect((await patch(id, t, { relation: "   " })).status).toBeGreaterThanOrEqual(400);
    expect((await patch(id, t, { relation: "가".repeat(101) })).status).toBeGreaterThanOrEqual(400);
    expect(await readL2p(8805, id)).toBeNull();
  });

  it("클론에 속하지 않은 화자는 거부한다 — L2' 는 클론별 격리다", async () => {
    const id = await seedPerson(806, null, "rel-global");
    const res = await patch(id, await tok(806), { relation: "친구" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("깨진 JSON 이 저장돼 있어도 저장을 포기하지 않는다", async () => {
    const id = await seedPerson(807, 8807, "rel-broken");
    await (env.DB as unknown as D1Database)
      .prepare(
        "INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?,?,?,unixepoch())",
      )
      .bind(8807, id, "{not json")
      .run();

    expect((await patch(id, await tok(807), { relation: "이웃" })).status).toBe(200);
    expect(JSON.parse((await readL2p(8807, id))!.data).relation).toBe("이웃");
  });
});
