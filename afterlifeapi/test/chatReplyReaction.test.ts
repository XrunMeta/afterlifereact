

import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

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

type Sent = {
  userMessage: { id: number; content: string; replyTo?: { id: number; content: string } };
  cloneReply: { id: number; content: string };
};

async function v_9c423d(v_43e90c, v_6e0fd3, v_b43b74, v_4fab5a, v_a714e9) {
  return v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await v_21cc31(v_43e90c)}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `afl1055-${v_4fab5a}`,
    },
    body: JSON.stringify({ content: v_b43b74, ...(v_a714e9 !== undefined ? { reply_to_message_id: v_a714e9 } : {}) }),
  });
}

async function v_9abbaf(v_43e90c, v_7f4466, v_03a50c) {
  return v_1df298.fetch(`http://localhost/oth-path${v_7f4466}/reaction`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${await v_21cc31(v_43e90c)}`, "Content-Type": "application/json" },
    body: JSON.stringify({ emoji: v_03a50c }),
  });
}

type Item = { type: string; id: number; role: string; content: string; replyTo?: { id: number; content: string | null }; reaction?: string };
async function v_29ce4d(v_43e90c, v_6e0fd3): Promise<Item[]> {
  const v_cb35cb = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/timeline`, {
    headers: { Authorization: `Bearer ${await v_21cc31(v_43e90c)}` },
  });
  v_4d37e3(v_cb35cb.status).toBe(200);
  return ((await v_cb35cb.json()) as { items: Item[] }).items.filter((v_ebec57) => v_ebec57.type === "chat");
}

v_469bf2("AFL-1055 채팅 메뉴", () => {
  v_ba7107(v_fc6bcf);

  v_23805a("클론 말에 답장하면 인용이 LLM 문장에 붙고, 저장은 쓴 말 그대로 + 타임라인에 인용", async () => {
    const v_0c8987 = await v_bfb240("rr-a@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "rr_a");
    const v_ea719c = (await (await v_9c423d(v_0c8987, v_062ae9, "오늘 비 왔어", "a1")).json()) as Sent;
    const v_5f5d6d = v_ea719c.cloneReply;

    const v_8f00b9 = await v_9c423d(v_0c8987, v_062ae9, "응 맞아", "a2", v_5f5d6d.id);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as Sent;
    v_4d37e3(v_4d33b2.userMessage.content).toBe("응 맞아");
    v_4d37e3(v_4d33b2.userMessage.replyTo).toEqual({ id: v_5f5d6d.id, content: v_5f5d6d.content });

    v_4d37e3(v_4d33b2.cloneReply.content).toContain("에 대한 답장이야");
    v_4d37e3(v_4d33b2.cloneReply.content).toContain(v_5f5d6d.content);
    v_4d37e3(v_4d33b2.cloneReply.content).toContain("응 맞아");

    const v_3ac7e7 = await v_a1651b().prepare("SELECT reply_to_message_id FROM messages WHERE id = ?")
      .bind(v_4d33b2.userMessage.id).first<{ reply_to_message_id: number | null }>();
    v_4d37e3(v_3ac7e7!.reply_to_message_id).toBe(v_5f5d6d.id);

    const v_1c1268 = (await v_29ce4d(v_0c8987, v_062ae9)).find((v_ebec57) => v_ebec57.id === v_4d33b2.userMessage.id)!;
    v_4d37e3(v_1c1268.content).toBe("응 맞아");
    v_4d37e3(v_1c1268.replyTo).toEqual({ id: v_5f5d6d.id, content: v_5f5d6d.content });
  });

  v_23805a("내 말·숨긴 말·다른 사람 대화의 말에는 답장할 수 없다(아무것도 저장 안 함)", async () => {
    const v_0c8987 = await v_bfb240("rr-b@t.local");
    const v_a9cbf1 = await v_bfb240("rr-b2@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "rr_b");
    const v_ea719c = (await (await v_9c423d(v_0c8987, v_062ae9, "안녕", "b1")).json()) as Sent;
    const v_6cc797 = (await (await v_9c423d(v_a9cbf1, v_062ae9, "누구세요", "b2")).json()) as Sent;

    v_4d37e3((await v_9c423d(v_0c8987, v_062ae9, "내 말에", "b3", v_ea719c.userMessage.id)).status).toBe(422);
    v_4d37e3((await v_9c423d(v_0c8987, v_062ae9, "남의 말에", "b4", v_6cc797.cloneReply.id)).status).toBe(422);
    await v_a1651b().prepare("UPDATE messages SET deletion_state = 'soft_deleted' WHERE id = ?").bind(v_ea719c.cloneReply.id).run();
    v_4d37e3((await v_9c423d(v_0c8987, v_062ae9, "지운 말에", "b5", v_ea719c.cloneReply.id)).status).toBe(422);

    const v_f4e98d = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM messages WHERE user_id = ? AND clone_id = ?")
      .bind(v_0c8987, v_062ae9).first<{ n: number }>();
    v_4d37e3(v_f4e98d!.n).toBe(2);
  });

  v_23805a("답장한 클론 말을 나중에 지우면 인용은 content=null(삭제된 메시지)로 남는다", async () => {
    const v_0c8987 = await v_bfb240("rr-c@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "rr_c");
    const v_ea719c = (await (await v_9c423d(v_0c8987, v_062ae9, "뭐해", "c1")).json()) as Sent;
    const v_677216 = (await (await v_9c423d(v_0c8987, v_062ae9, "그렇구나", "c2", v_ea719c.cloneReply.id)).json()) as Sent;

    const v_d0ca5b = await v_1df298.fetch(`http://localhost/oth-path${v_ea719c.cloneReply.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${await v_21cc31(v_0c8987)}` },
    });
    v_4d37e3(v_d0ca5b.status).toBe(200);

    const v_4622b9 = await v_29ce4d(v_0c8987, v_062ae9);
    v_4d37e3(v_4622b9.some((v_ebec57) => v_ebec57.id === v_ea719c.cloneReply.id)).toBe(false);
    v_4d37e3(v_4622b9.find((v_ebec57) => v_ebec57.id === v_677216.userMessage.id)!.replyTo).toEqual({ id: v_ea719c.cloneReply.id, content: null });
  });

  v_23805a("이모지는 내 대화의 클론 말에만, 정해진 6개만 — null 이면 뗀다", async () => {
    const v_0c8987 = await v_bfb240("rr-d@t.local");
    const v_a9cbf1 = await v_bfb240("rr-d2@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "rr_d");
    const v_f966e3 = (await (await v_9c423d(v_0c8987, v_062ae9, "고마워", "d1")).json()) as Sent;

    v_4d37e3((await v_9abbaf(v_0c8987, v_f966e3.cloneReply.id, "❤️")).status).toBe(200);
    v_4d37e3((await v_29ce4d(v_0c8987, v_062ae9)).find((v_ebec57) => v_ebec57.id === v_f966e3.cloneReply.id)!.reaction).toBe("❤️");

    v_4d37e3((await v_9abbaf(v_0c8987, v_f966e3.cloneReply.id, "🙏")).status).toBe(200);
    v_4d37e3((await v_29ce4d(v_0c8987, v_062ae9)).find((v_ebec57) => v_ebec57.id === v_f966e3.cloneReply.id)!.reaction).toBe("🙏");

    v_4d37e3((await v_9abbaf(v_0c8987, v_f966e3.userMessage.id, "❤️")).status).toBe(422);
    v_4d37e3((await v_9abbaf(v_0c8987, v_f966e3.cloneReply.id, "🍕")).status).toBe(422);
    v_4d37e3((await v_9abbaf(v_a9cbf1, v_f966e3.cloneReply.id, "❤️")).status).toBe(403);

    v_4d37e3((await v_9abbaf(v_0c8987, v_f966e3.cloneReply.id, null)).status).toBe(200);
    v_4d37e3((await v_29ce4d(v_0c8987, v_062ae9)).find((v_ebec57) => v_ebec57.id === v_f966e3.cloneReply.id)!.reaction).toBeUndefined();
  });
});
