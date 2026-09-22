
import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_2f5367(v_0c8987): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  return v_b2eae5(
    { sub: v_0c8987, kind: "access" },
    (v_c9c489 as { JWT_ACCESS_SECRET: string }).JWT_ACCESS_SECRET,
    600,
  );
}

const v_194714 = [
  { key: "age", type: "fixed_choice", label: "나이대가 어떻게 되세요?", options: ["10대", "20대", "30대"] },
  { key: "gender", type: "fixed_choice", label: "성별은요?", options: ["남성", "여성", "기타"] },
  { key: "mbti", type: "fixed_choice", label: "어떤 MBTI를 가지고 있나요?", options: ["INTJ", "ENFP"] },
  { key: "personality_core", type: "gemma_choice", label: "어떤 성격이셨나요?", targetField: "personality_core" },
  { key: "tone", type: "fixed_choice", label: "어떤 말투를 쓰셨나요?", targetField: "tone", options: ["표준말", "사투리"] },
  { key: "speech_speed", type: "fixed_choice", label: "말의 속도는 어땠나요?", targetField: "speech_speed", options: ["빠른 편"] },
];

v_469bf2("위저드 답 → 저장 → 통화 bundle", () => {
  v_23805a("앱 Step7 요청 그대로 보내면 mbti/age 가 bundle persona 에 실린다", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare("INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (7301,'pab@t','x','PAB',CURRENT_TIMESTAMP)")
      .run();
    await v_a1651b
      .prepare("INSERT OR REPLACE INTO persoth-secretema (id, schema_json) VALUES (1, ?)")
      .bind(JSON.stringify(v_194714))
      .run();
    const v_ea333d = await v_2f5367(7301);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json", "X-Idempotency-Key": "pab-faker-0001" },
      body: JSON.stringify({
        clone_type: "friend",
        name: "페이커",
        username: "pab_faker",
        visibility: "public",
        l1_profile: { attrs: {}, notes: "" },
        personaAnswers: { age: "20대", gender: "남성", mbti: "INTJ", personality_core: "침착함", tone: "표준말" },
      }),
    });
    if (v_8f00b9.status !== 201) console.log("[pab] create", v_8f00b9.status, await v_8f00b9.clone().text());
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();

    const v_3ac7e7 = await v_a1651b.prepare("SELECT l1_profile FROM clones WHERE id=?").bind(v_eb25ce.id).first<{ l1_profile: string }>();
    console.log("[pab] l1_profile =", v_3ac7e7?.l1_profile);
    const v_6531eb = await v_a1651b.prepare("SELECT key, value FROM persona_attributes WHERE clone_id=?").bind(v_eb25ce.id).all();
    console.log("[pab] persona_attributes =", JSON.stringify(v_6531eb.results));

    const v_148ff6 = await v_1df298.fetch(`http://localhost/oth-path${v_eb25ce.id}/bundle`, { headers: { Authorization: `Bearer ${v_ea333d}` } });
    const v_4d33b2 = await v_148ff6.json<{ personaBundle: { persona: Record<string, unknown> } }>();
    console.log("[pab] bundle status", v_148ff6.status, "persona =", JSON.stringify(v_4d33b2.personaBundle?.persona));
    v_4d37e3(v_4d33b2.personaBundle.persona.mbti).toBe("INTJ");
    v_4d37e3(v_4d33b2.personaBundle.persona.age).toBe("20대");
  });
});
