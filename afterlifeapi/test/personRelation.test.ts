import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_ea333d(v_0c8987): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await v_b2eae5({ sub: v_0c8987, kind: "access" }, v_43fd42, 600);
}

async function v_2f0be6(v_43e90c, v_6e0fd3, v_1833e7) {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)",
    )
    .bind(v_43e90c, `u${v_43e90c}@t`, "x", "U")
    .run();
  const v_3ac7e7 = await v_a1651b
    .prepare(
      "INSERT INTO persons (user_id, clone_id, display_name, created_at) VALUES (?,?,?,?) RETURNING id",
    )
    .bind(v_43e90c, v_6e0fd3, v_1833e7, Date.now())
    .first<{ id: number }>();
  return v_3ac7e7!.id;
}

const v_17dc8a = async (v_ca1ec5, v_21cc31, v_4d33b2) =>
  v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/relation`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_21cc31}` },
    body: JSON.stringify(v_4d33b2),
  });

const v_e8aa56 = (v_6e0fd3, v_ca1ec5) =>
  (v_c9c489.DB as unknown as D1Database)
    .prepare("SELECT data FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
    .bind(v_6e0fd3, v_ca1ec5)
    .first<{ data: string }>();

v_469bf2("PATCH /oth-path", () => {
  v_23805a("L2' 가 없으면 새로 만들어 relation 을 적는다", async () => {
    const v_389afb = await v_2f0be6(801, 8801, "rel-new");
    const v_8f00b9 = await v_17dc8a(v_389afb, await v_ea333d(801), { relation: "손주" });
    v_4d37e3(v_8f00b9.status).toBe(200);

    const v_3ac7e7 = await v_e8aa56(8801, v_389afb);
    v_4d37e3(JSON.parse(v_3ac7e7!.data).relation).toBe("손주");
  });

  v_23805a("기존 L2' 의 다른 키를 지우지 않는다 — 자동 학습분 보존", async () => {
    const v_389afb = await v_2f0be6(802, 8802, "rel-merge");
    await (v_c9c489.DB as unknown as D1Database)
      .prepare(
        "INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?,?,?,unixepoch())",
      )
      .bind(
        8802,
        v_389afb,
        JSON.stringify({ relation: "옛관계", memories_personal: ["어제 등산 감"] }),
      )
      .run();

    v_4d37e3((await v_17dc8a(v_389afb, await v_ea333d(802), { relation: "오랜 친구" })).status).toBe(200);

    const v_9390e8 = JSON.parse((await v_e8aa56(8802, v_389afb))!.data);
    v_4d37e3(v_9390e8.relation).toBe("오랜 친구");
    v_4d37e3(v_9390e8.memories_personal).toEqual(["어제 등산 감"]);
  });

  v_23805a("남의 person 은 건드리지 못한다", async () => {
    const v_389afb = await v_2f0be6(803, 8803, "rel-other");
    const v_8f00b9 = await v_17dc8a(v_389afb, await v_ea333d(804), { relation: "침입" });
    v_4d37e3(v_8f00b9.status).toBe(404);
    v_4d37e3(await v_e8aa56(8803, v_389afb)).toBeNull();
  });

  v_23805a("빈 relation·과길이는 400대로 거부한다", async () => {
    const v_389afb = await v_2f0be6(805, 8805, "rel-bad");
    const v_8d41d7 = await v_ea333d(805);
    v_4d37e3((await v_17dc8a(v_389afb, v_8d41d7, {})).status).toBeGreaterThanOrEqual(400);
    v_4d37e3((await v_17dc8a(v_389afb, v_8d41d7, { relation: "   " })).status).toBeGreaterThanOrEqual(400);
    v_4d37e3((await v_17dc8a(v_389afb, v_8d41d7, { relation: "가".repeat(101) })).status).toBeGreaterThanOrEqual(400);
    v_4d37e3(await v_e8aa56(8805, v_389afb)).toBeNull();
  });

  v_23805a("클론에 속하지 않은 화자는 거부한다 — L2' 는 클론별 격리다", async () => {
    const v_389afb = await v_2f0be6(806, null, "rel-global");
    const v_8f00b9 = await v_17dc8a(v_389afb, await v_ea333d(806), { relation: "친구" });
    v_4d37e3(v_8f00b9.status).toBeGreaterThanOrEqual(400);
  });

  v_23805a("깨진 JSON 이 저장돼 있어도 저장을 포기하지 않는다", async () => {
    const v_389afb = await v_2f0be6(807, 8807, "rel-broken");
    await (v_c9c489.DB as unknown as D1Database)
      .prepare(
        "INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?,?,?,unixepoch())",
      )
      .bind(8807, v_389afb, "{not json")
      .run();

    v_4d37e3((await v_17dc8a(v_389afb, await v_ea333d(807), { relation: "이웃" })).status).toBe(200);
    v_4d37e3(JSON.parse((await v_e8aa56(8807, v_389afb))!.data).relation).toBe("이웃");
  });
});
