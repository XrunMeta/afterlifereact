import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import { loadUserL2 } from "../src/lib/personaBundle";

const db = () => env.DB as unknown as D1Database;

describe("loadUserL2 (clone_ont)", () => {
  it("clone_ont.data에서 4필드만 추출, 사용자별 격리", async () => {

    await db()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(
        9043,
        100,
        JSON.stringify({
          address: "성준",
          memories_personal: ["x"],
          memory_summary: "100의 기억",
          relationship: "친구",
        })
      )
      .run();

    const l2a = await loadUserL2(db(), 9043, 100);
    expect(l2a?.memory_summary).toBe("100의 기억");
    expect(l2a?.relationship).toBe("친구");

    expect((l2a as Record<string, unknown>)?.address).toBeUndefined();
    expect((l2a as Record<string, unknown>)?.memories_personal).toBeUndefined();

    const l2b = await loadUserL2(db(), 9043, 200);
    expect(l2b).toBeNull();
  });

  it("context, recent_topics 필드도 추출됨", async () => {
    await db()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(
        9044,
        101,
        JSON.stringify({
          context: "첫 만남",
          recent_topics: ["날씨", "여행"],
          address: "이름",
        })
      )
      .run();

    const l2 = await loadUserL2(db(), 9044, 101);
    expect(l2?.context).toBe("첫 만남");
    expect(l2?.recent_topics).toEqual(["날씨", "여행"]);
    expect((l2 as Record<string, unknown>)?.address).toBeUndefined();
  });

  it("4필드 모두 없으면 null 반환", async () => {
    await db()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(9045, 102, JSON.stringify({ address: "홍길동", memories_personal: [] }))
      .run();

    const l2 = await loadUserL2(db(), 9045, 102);
    expect(l2).toBeNull();
  });

  it("data가 빈 문자열이면 null 반환", async () => {
    await db()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, '', unixepoch())"
      )
      .bind(9046, 103)
      .run();

    const l2 = await loadUserL2(db(), 9046, 103);
    expect(l2).toBeNull();
  });
});
