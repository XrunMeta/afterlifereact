import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_20b0e8 } from "../src/lib/personaBundle";
import { v_87cfd2 } from "../src/lib/callBundle";
import { v_5d4a51 } from "../src/lib/cloneAccess";
import { v_b2eae5 } from "../src/lib/jwt";

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

    v_4d37e3((v_0dee75 as Record<string, unknown>)?.memories_personal).toEqual(["x"]);

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

  v_23805a("buildCallBundle이 요청 사용자의 clone_ont L2를 주입", async () => {

    await v_a1651b()
      .prepare(
        "INSERT INTO clones (id, owner_id, name, username, clone_type, visibility, primary_editor_user_id, created_at) VALUES (?, 1, 'TestClone', 'testclone9043', 'memlow', 'public', 1, CURRENT_TIMESTAMP)"
      )
      .bind(9043)
      .run();

    await v_a1651b()
      .prepare(
        "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(9043, 100, JSON.stringify({ memory_summary: "100의 기억" }))
      .run();
    await v_a1651b()
      .prepare(
        "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(9043, 200, JSON.stringify({ memory_summary: "200의 기억" }))
      .run();
    const v_eb25ce = await v_5d4a51(v_a1651b(), 9043);
    const v_a7e018 = await v_87cfd2(v_a1651b(), v_eb25ce!, 100, "http://test");
    const v_ef6bb1 = await v_87cfd2(v_a1651b(), v_eb25ce!, 200, "http://test");
    v_4d37e3(v_a7e018.personaBundle.persona.memory_summary).toBe("100의 기억");
    v_4d37e3(v_ef6bb1.personaBundle.persona.memory_summary).toBe("200의 기억");
  });

  v_23805a("L2 소비 필드(구 4필드+학습 3키)가 모두 없으면 null 반환", async () => {
    await v_a1651b()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(9045, 102, JSON.stringify({ address: "홍길동" }))
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

v_469bf2("PUT /oth-path — 통화 L2 4필드 보존", () => {
  async function v_bfb240(v_e0c7e8): Promise<number> {
    await v_a1651b()
      .prepare(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)"
      )
      .bind(v_e0c7e8)
      .run();
    return (
      await v_a1651b()
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(v_e0c7e8)
        .first<{ id: number }>()
    )!.id;
  }

  async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
    await v_a1651b()
      .prepare(
        "INSERT INTO clones (owner_id, name, username, clone_type, visibility, primary_editor_user_id, created_at) VALUES (?, 'TC', ?, 'memlow', 'public', ?, CURRENT_TIMESTAMP)"
      )
      .bind(v_1badb6, v_556427, v_1badb6)
      .run();
    return (
      await v_a1651b()
        .prepare("SELECT id FROM clones WHERE username = ?")
        .bind(v_556427)
        .first<{ id: number }>()
    )!.id;
  }

  async function v_86c39f(v_43e90c): Promise<string> {
    const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
    if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing");
    return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
  }

  function v_5c1e3a(v_21cc31) {
    return {
      Authorization: `Bearer ${v_21cc31}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `test-put-l2-${Date.now()}-${Math.random()}`,
    };
  }

  v_23805a("memory.ts PUT(채팅 편집)이 우리 4필드를 보존한다", async () => {
    const v_7cd229 = await v_bfb240("put-l2-preserve@test.local");
    const v_6e0fd3 = await v_4d24a9(v_7cd229, "put_l2_preserve_c");
    const v_706f17 = await v_86c39f(v_7cd229);

    await v_a1651b()
      .prepare(
        "INSERT INTO clone_ont (clone_id,user_id,data,updated_at) VALUES (?,?,?,unixepoch())"
      )
      .bind(v_6e0fd3, v_7cd229, JSON.stringify({ memory_summary: "기존 기억" }))
      .run();

    const v_cb35cb = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}/memory/l2`,
      {
        method: "PUT",
        headers: v_5c1e3a(v_706f17),
        body: JSON.stringify({ address: "오빠" }),
      }
    );
    v_4d37e3(v_cb35cb.status).toBe(200);

    const v_3ac7e7 = await v_a1651b()
      .prepare(
        "SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?"
      )
      .bind(v_6e0fd3, v_7cd229)
      .first<{ data: string }>();
    const v_9390e8 = JSON.parse(v_3ac7e7!.data) as Record<string, unknown>;
    v_4d37e3(v_9390e8.address).toBe("오빠");
    v_4d37e3(v_9390e8.memory_summary).toBe("기존 기억"); 
  });
});
