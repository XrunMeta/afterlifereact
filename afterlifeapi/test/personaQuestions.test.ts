import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_02d529 } from "../src/lib/personaQuestions";

v_469bf2("validatePersonaQuestions", () => {
  v_23805a("accepts a valid schema with gemma_choice + fixed_choice + showWhen", () => {
    const v_cb35cb = v_02d529([
      { key: "tone", type: "gemma_choice", label: "말투?", targetField: "tone", options_include: ["사투리"] },
      { key: "dialect_region", type: "fixed_choice", label: "지역?", options: ["경상도"], showWhen: { tone: "사투리" } },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(true);
  });

  v_23805a("rejects duplicate keys", () => {
    const v_cb35cb = v_02d529([
      { key: "tone", type: "text", label: "a" },
      { key: "tone", type: "text", label: "b" },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("duplicate");
  });

  v_23805a("rejects unknown type", () => {
    const v_cb35cb = v_02d529([{ key: "x", type: "slider", label: "a" }]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
  });

  v_23805a("rejects fixed_choice with empty options", () => {
    const v_cb35cb = v_02d529([{ key: "x", type: "fixed_choice", label: "a", options: [] }]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
  });

  v_23805a("rejects showWhen referencing a non-existent key", () => {
    const v_cb35cb = v_02d529([
      { key: "x", type: "text", label: "a", showWhen: { ghost: "v" } },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("showWhen");
  });

  v_23805a("rejects non-array input", () => {
    v_4d37e3(v_02d529({} as unknown).ok).toBe(false);
  });

  v_23805a("rejects more than 50 questions", () => {
    const v_212049 = Array.from({ length: 51 }, (v_37eab7, v_ebec57) => ({ key: `k${v_ebec57}`, type: "text", label: `L${v_ebec57}` }));
    const v_cb35cb = v_02d529(v_212049);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("too many");
  });

  v_23805a("rejects invalid key format (contains space)", () => {
    const v_cb35cb = v_02d529([{ key: "bad key", type: "text", label: "a" }]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("invalid key format");
  });

  v_23805a("rejects forbidden targetField (__proto__)", () => {
    const v_cb35cb = v_02d529([{ key: "x", type: "text", label: "a", targetField: "__proto__" }]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("forbidden targetField");
  });

  v_23805a("rejects forbidden targetField (attrs container key)", () => {
    const v_cb35cb = v_02d529([{ key: "x", type: "text", label: "a", targetField: "attrs" }]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("forbidden targetField");
  });

  v_23805a("rejects invalid targetField format (contains dot)", () => {
    const v_cb35cb = v_02d529([{ key: "x", type: "text", label: "a", targetField: "a.b" }]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("invalid targetField format");
  });

  v_23805a("rejects showWhen self-reference", () => {
    const v_cb35cb = v_02d529([
      { key: "tone", type: "text", label: "a", showWhen: { tone: "v" } },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("self-reference");
  });

  v_23805a("rejects showWhen circular reference (A→B→A)", () => {
    const v_cb35cb = v_02d529([
      { key: "a", type: "text", label: "A", showWhen: { b: "v" } },
      { key: "b", type: "text", label: "B", showWhen: { a: "v" } },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("circular");
  });

  v_23805a("rejects options > 20 for fixed_choice", () => {
    const v_328259 = Array.from({ length: 21 }, (v_37eab7, v_ebec57) => `opt${v_ebec57}`);
    const v_cb35cb = v_02d529([{ key: "x", type: "fixed_choice", label: "a", options: v_328259 }]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("too many");
  });

  v_23805a("accepts valid targetField on a fixed_choice question", () => {
    const v_cb35cb = v_02d529([
      { key: "tone", type: "fixed_choice", label: "말투?", targetField: "tone", options: ["반말", "존댓말"] },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(true);
  });

  v_23805a("rejects fixed_choice with duplicate options", () => {
    const v_cb35cb = v_02d529([
      { key: "mood", type: "fixed_choice", label: "분위기?", options: ["밝음", "조용함", "밝음"] },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("duplicate option");
    v_4d37e3(v_cb35cb.error).toContain("mood");
  });

  v_23805a("rejects gemma_choice with duplicate options_include", () => {
    const v_cb35cb = v_02d529([
      { key: "tone", type: "gemma_choice", label: "말투?", options_include: ["사투리", "반말", "사투리"] },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("duplicate options_include");
    v_4d37e3(v_cb35cb.error).toContain("tone");
  });

  v_23805a("accepts fixed_choice with all unique options", () => {
    const v_cb35cb = v_02d529([
      { key: "region", type: "fixed_choice", label: "지역?", options: ["서울", "부산", "제주"] },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(true);
  });

  v_23805a("accepts v3 seed schema (10 questions) — all types/showWhen/targetField valid", () => {
    const v_64b26f = [
      { key: "age", type: "fixed_choice", label: "나이대가 어떻게 되세요?", options: ["10대", "20대", "30대", "40대", "50대", "60대 이상"] },
      { key: "gender", type: "fixed_choice", label: "성별은요?", options: ["남성", "여성", "기타"] },
      { key: "mbti", type: "fixed_choice", label: "MBTI가 떠오르면 골라주세요", options: ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ", "모름"] },
      { key: "personality_core", type: "gemma_choice", label: "어떤 성격이셨나요?", targetField: "personality_core" },
      { key: "tone", type: "gemma_choice", label: "어떤 말투로 말하셨나요?", targetField: "tone", options_include: ["사투리"] },
      { key: "dialect_region", type: "fixed_choice", label: "어느 지역 사투리였나요?", options: ["경상도", "전라도", "충청도", "제주", "강원", "서울/경기"], showWhen: { tone: "사투리" } },
      { key: "dialect_intensity", type: "fixed_choice", label: "사투리가 어느 정도였나요?", options: ["약간", "보통", "심함"], showWhen: { tone: "사투리" } },
      { key: "first_meeting", type: "text", label: "처음 만난 이야기를 들려주실래요?" },
      { key: "habit", type: "text", label: "자주 하던 말이나 습관이 있었나요?" },
      { key: "memory", type: "text", label: "가장 선명한 추억 한 장면을 들려주세요" },
    ];
    const v_cb35cb = v_02d529(v_64b26f);
    v_4d37e3(v_cb35cb.ok).toBe(true);
    if (v_cb35cb.ok) {
      v_4d37e3(v_cb35cb.questions).toHaveLength(10);

      const v_5a1d77 = v_cb35cb.questions.find((v_ab6401) => v_ab6401.key === "dialect_region");
      v_4d37e3(v_5a1d77?.showWhen).toEqual({ tone: "사투리" });

      const v_12cd99 = v_cb35cb.questions.find((v_ab6401) => v_ab6401.key === "personality_core");
      v_4d37e3(v_12cd99?.targetField).toBe("personality_core");

      const v_2694bd = v_cb35cb.questions.find((v_ab6401) => v_ab6401.key === "age");
      v_4d37e3(v_2694bd?.targetField).toBeUndefined();
    }
  });
});

const v_d72b33 = 9001;

async function v_7c351e(v_f91f33): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5(v_f91f33, v_43fd42, 600);
}

async function v_09bcb2(): Promise<string> {
  return v_7c351e({ sub: v_d72b33, kind: "access", admin: true });
}

async function v_45f3c0(): Promise<string> {
  return v_7c351e({ sub: 99998, kind: "access", admin: true });
}

v_ba7107(async () => {

  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(v_d72b33, "superadmin-pq-test@afterlife.test", "hashed-placeholder")
    .run();
});

v_469bf2("admin /persona-questions", () => {
  v_23805a("GET returns seeded schema", async () => {
    const v_ea333d = await v_45f3c0();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ questions: unknown[] }>();
    v_4d37e3(Array.isArray(v_4d33b2.questions)).toBe(true);
  });

  v_23805a("PUT rejects invalid schema with 400", async () => {
    const v_ea333d = await v_09bcb2();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ questions: [{ key: "a", type: "slider", label: "x" }] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("PUT persists a valid schema", async () => {
    const v_ea333d = await v_09bcb2();
    const v_a448ad = [{ key: "tone", type: "text", label: "말투?" }];
    const v_4abc91 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ questions: v_a448ad }),
    });
    v_4d37e3(v_4abc91.status).toBe(200);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b.prepare("SELECT schema_json FROM persoth-secretema WHERE id=1").first<{ schema_json: string }>();
    v_4d37e3(JSON.parse(v_3ac7e7!.schema_json)[0].key).toBe("tone");
  });

  v_23805a("PUT rejects non-super_admin (regular admin token → 401 or 403)", async () => {
    const v_ea333d = await v_45f3c0();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ questions: [{ key: "tone", type: "text", label: "a" }] }),
    });
    v_4d37e3([401, 403]).toContain(v_8f00b9.status);
  });
});
