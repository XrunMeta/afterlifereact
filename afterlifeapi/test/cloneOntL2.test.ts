import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_20b0e8 } from "../src/lib/personaBundle";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

v_469bf2("loadUserL2 (clone_ont)", () => {
  v_23805a("clone_ont.data에서 4필드만 추출, 사용자별 격리", async () => {

    await v_a1651b()
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

    const v_0dee75 = await v_20b0e8(v_a1651b(), 9043, 100);
    v_4d37e3(v_0dee75?.memory_summary).toBe("100의 기억");
    v_4d37e3(v_0dee75?.relationship).toBe("친구");

    v_4d37e3((v_0dee75 as Record<string, unknown>)?.address).toBeUndefined();
    v_4d37e3((v_0dee75 as Record<string, unknown>)?.memories_personal).toBeUndefined();

    const v_e02ad3 = await v_20b0e8(v_a1651b(), 9043, 200);
    v_4d37e3(v_e02ad3).toBeNull();
  });

  v_23805a("context, recent_topics 필드도 추출됨", async () => {
    await v_a1651b()
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

    const v_1af19b = await v_20b0e8(v_a1651b(), 9044, 101);
    v_4d37e3(v_1af19b?.context).toBe("첫 만남");
    v_4d37e3(v_1af19b?.recent_topics).toEqual(["날씨", "여행"]);
    v_4d37e3((v_1af19b as Record<string, unknown>)?.address).toBeUndefined();
  });

  v_23805a("4필드 모두 없으면 null 반환", async () => {
    await v_a1651b()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(9045, 102, JSON.stringify({ address: "홍길동", memories_personal: [] }))
      .run();

    const v_1af19b = await v_20b0e8(v_a1651b(), 9045, 102);
    v_4d37e3(v_1af19b).toBeNull();
  });

  v_23805a("data가 빈 문자열이면 null 반환", async () => {
    await v_a1651b()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, '', unixepoch())"
      )
      .bind(9046, 103)
      .run();

    const v_1af19b = await v_20b0e8(v_a1651b(), 9046, 103);
    v_4d37e3(v_1af19b).toBeNull();
  });
});
