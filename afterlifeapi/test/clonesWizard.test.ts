import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_2f5367(v_0c8987): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await v_b2eae5({ sub: v_0c8987, kind: "access" }, v_43fd42, 600);
}

v_469bf2("clones wizard persona mapping", () => {
  v_23805a("maps age/gender/mbti/personaTypes into l1_profile", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (90,'w@t','x','W',CURRENT_TIMESTAMP)",
      )
      .run();
    const v_ea333d = await v_2f5367(90);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_ea333d}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": "wiz-test-1-unique",
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "테스트",
        username: "wiztest1",
        persona: { age: "60대", gender: "남성", mbti: "INFP", personaTypes: ["감정적", "평온한"] },
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT l1_profile FROM clones WHERE username='wiztest1'")
      .first<{ l1_profile: string }>();
    const v_020b4b = JSON.parse(v_3ac7e7!.l1_profile);
    v_4d37e3(v_020b4b.attrs.age).toBe("60대");
    v_4d37e3(v_020b4b.attrs.gender).toBe("남성");
    v_4d37e3(v_020b4b.attrs.mbti).toBe("INFP");
    v_4d37e3(v_020b4b.personality_core).toContain("감정적");
  });

  v_23805a("persona 미전달 시 l1_profile 없으면 null 유지", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (91,'w2@t','x','W2',CURRENT_TIMESTAMP)",
      )
      .run();
    const v_ea333d = await v_2f5367(91);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_ea333d}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": "wiz-test-2-unique",
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "기본테스트",
        username: "wiztest2",
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT l1_profile FROM clones WHERE username='wiztest2'")
      .first<{ l1_profile: string | null }>();
    v_4d37e3(v_3ac7e7!.l1_profile).toBeNull();
  });

  v_23805a("기존 l1_profile.attrs 와 persona 위저드 값 merge", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (92,'w3@t','x','W3',CURRENT_TIMESTAMP)",
      )
      .run();
    const v_ea333d = await v_2f5367(92);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_ea333d}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": "wiz-test-3-unique",
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "머지테스트",
        username: "wiztest3",
        l1_profile: { attrs: { hobby: "등산" }, notes: "산을 좋아해" },
        persona: { age: "40대", mbti: "ENTP", personaTypes: ["논리적"] },
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT l1_profile FROM clones WHERE username='wiztest3'")
      .first<{ l1_profile: string }>();
    const v_020b4b = JSON.parse(v_3ac7e7!.l1_profile);

    v_4d37e3(v_020b4b.attrs.hobby).toBe("등산");
    v_4d37e3(v_020b4b.notes).toBe("산을 좋아해");

    v_4d37e3(v_020b4b.attrs.age).toBe("40대");
    v_4d37e3(v_020b4b.attrs.mbti).toBe("ENTP");
    v_4d37e3(v_020b4b.personality_core).toContain("논리적");
  });
});
