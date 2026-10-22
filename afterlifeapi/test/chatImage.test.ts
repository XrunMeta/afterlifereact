

import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_fc6bcf(): Promise<void> {
  const v_3ac7e7 = await v_a1651b()
    .prepare(`SELECT kek_id FROM encryption_keys WHERE status = 'active' LIMIT 1`)
    .first<{ kek_id: string }>();
  if (v_3ac7e7) return;
  const { generateKekAndWrap: v_8bb5d2 } = await import("../src/lib/kekProvider");
  const { encryptedKek: v_8f246d } = v_8bb5d2((v_c9c489 as { MASTER_ROOT: string }).MASTER_ROOT);
  await v_a1651b()
    .prepare(`INSERT INTO encryption_keys (kek_id, version, encrypted_kek, status) VALUES ('kek_test_v1', 1, ?, 'active')`)
    .bind(v_8f246d)
    .run();
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
              VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`)
    .bind(v_1badb6, v_556427)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, (v_c9c489 as { JWT_ACCESS_SECRET: string }).JWT_ACCESS_SECRET, 600);
}

async function v_8108ea(v_43e90c, v_6e0fd3, v_4fab5a, v_3b27d9 = "image/jpeg") {
  const v_ebd523 = new FormData();
  v_ebd523.append("image", new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], "chat.jpg", { type: v_3b27d9 }));
  return v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/messages/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await v_21cc31(v_43e90c)}`, "X-Idempotency-Key": `afl1031-${v_4fab5a}` },
    body: v_ebd523,
  });
}

function v_f4b0f8(v_6856a9, v_de130a) {
  v_8fd90d
    .get("http://openai.test")
    .intercept({ path: "/v1/chat/completions", method: "POST" })
    .reply((v_328259) => {
      v_de130a?.(JSON.parse(String(v_328259.body)));
      return { statusCode: 200, data: { choices: [{ message: { content: JSON.stringify({ description: v_6856a9 }) } }] } };
    });
}

v_469bf2("AFL-1031 채팅 사진", () => {
  v_ba7107(async () => {
    await v_fc6bcf();
    v_8fd90d.activate();
    v_8fd90d.disableNetConnect();
  });
  v_719203(() => v_8fd90d.assertNoPendingInterceptors());

  v_23805a("사진을 인식해 [사진] 메시지와 답장을 남기고 타임라인에 사진 말풍선으로 보인다", async () => {
    const v_0c8987 = await v_bfb240("img-a@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "img_a");
    let v_f966e3 = null;
    v_f4b0f8("바닷가에서 찍은 노을 사진", (v_148ff6) => { v_f966e3 = v_148ff6; });

    const v_8f00b9 = await v_8108ea(v_0c8987, v_062ae9, "a1");
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as {
      userMessage: { id: number; content: string; kind: string; caption: string };
      cloneReply: { content: string };
    };
    v_4d37e3(v_4d33b2.userMessage).toMatchObject({ content: "[사진]", kind: "image", caption: "바닷가에서 찍은 노을 사진" });
    v_4d37e3(v_4d33b2.cloneReply.content.length).toBeGreaterThan(0);

    const v_765b79 = (v_f966e3 as unknown as { model: string; messages: Array<{ content: unknown }> });
    v_4d37e3(v_765b79.model).toBe("gpt-4o-mini");
    const v_910cfa = (v_765b79.messages[1]!.content as Array<{ image_url: { url: string; detail: string } }>)[0]!;
    v_4d37e3(v_910cfa.image_url.detail).toBe("high");
    v_4d37e3(v_910cfa.image_url.url.startsWith("data:image/jpeg;base64,")).toBe(true);

    const v_3ac7e7 = await v_a1651b().prepare("SELECT content FROM messages WHERE id = ?").bind(v_4d33b2.userMessage.id)
      .first<{ content: string }>();
    v_4d37e3(v_3ac7e7!.content).not.toContain("노을");

    const v_fcb4e5 = (await (await v_1df298.fetch(`http://localhost/oth-path${v_062ae9}/timeline`, {
      headers: { Authorization: `Bearer ${await v_21cc31(v_0c8987)}` },
    })).json()) as { items: Array<{ type: string; role?: string; kind?: string; caption?: string; content?: string }> };
    const v_2a5a61 = v_fcb4e5.items.find((v_ebec57) => v_ebec57.type === "chat" && v_ebec57.role === "user");
    v_4d37e3(v_2a5a61).toMatchObject({ kind: "image", caption: "바닷가에서 찍은 노을 사진", content: "[사진]" });
  });

  v_23805a("지원하지 않는 형식은 422 이고 비전 호출도 없다", async () => {
    const v_0c8987 = await v_bfb240("img-b@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "img_b");
    const v_8f00b9 = await v_8108ea(v_0c8987, v_062ae9, "b1", "application/pdf");
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("인식 실패면 502 이고 메시지를 남기지 않는다", async () => {
    const v_0c8987 = await v_bfb240("img-c@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "img_c");
    v_8fd90d.get("http://openai.test").intercept({ path: "/v1/chat/completions", method: "POST" })
      .reply(500, { error: "boom" });
    const v_8f00b9 = await v_8108ea(v_0c8987, v_062ae9, "c1");
    v_4d37e3(v_8f00b9.status).toBe(502);
    const v_f4e98d = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM messages WHERE user_id = ?").bind(v_0c8987).first<{ n: number }>();
    v_4d37e3(v_f4e98d!.n).toBe(0);
  });
});
