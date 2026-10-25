

import { v_b7c41b, type v_437670 } from "zmui";
import { v_043916 } from "bppretklejpcmw";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_6690d9 } from "../middleware/auth";
import { v_a04a51 } from "../middleware/idempotency";
import { v_74defc } from "../lib/logger";
import { v_a8614b, v_034656, v_137694, v_f7e14c } from "../lib/ale";
import { v_e44d97 } from "../lib/kekProvider";
import { v_295cc5 } from "../lib/ai";
import { v_663c07, v_70ddfa, v_4dc423 } from "../lib/chatReply";
import { v_2f0299, v_c56968, v_386d00, v_f500c0 } from "../lib/conversationMemory";
import { v_10ee58, v_ea6521, v_888068 } from "../lib/chatReplyTo";
import { v_74c502, v_7a9d93, v_5d4a51, v_09d461 } from "../lib/cloneAccess";
import { v_e86502, v_fda4d7, v_3821c0 } from "../lib/memoryStore";
import { v_dd9d7c, v_721d54, v_cf0463 } from "../lib/interactions";
import { v_a00a76 } from "../lib/conversationEvents";
import { v_026a6e, v_97036c } from "../lib/langTag";
import {
  v_e68875,
  v_a52bdd,
  v_3f052d,
  v_56bce4,
  v_741d36,
  v_931a4e,
} from "../lib/chatImage";

const v_92f378 = 10_000;
import { v_15ea73 } from "../lib/sqliteTs";

export const v_19e2a3 = new v_b7c41b<v_de0a25>();
export const v_fa56e0 = new v_b7c41b<v_de0a25>();

v_fa56e0.get("/health", (v_3f4e2e) => v_3f4e2e.json({ ok: true, module: "messages" }));

v_fa56e0.delete("/:id", v_6690d9, async (v_3f4e2e) => {
  const v_73ad51 = v_2ab119(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT user_id, deletion_state FROM messages WHERE id = ?`)
    .bind(v_73ad51)
    .first<{ user_id: number; deletion_state: string }>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Message not found.");

  if (v_3ac7e7.user_id !== v_43e90c) throw new v_3ebe58("FORBIDDEN", "Not your message.");
  if (v_3ac7e7.deletion_state !== "active") {
    return v_3f4e2e.json({ ok: true, alreadyDeleted: true });
  }
  await v_3f4e2e.env.DB
    .prepare(`UPDATE messages SET deletion_state = 'soft_deleted' WHERE id = ?`)
    .bind(v_73ad51)
    .run();
  return v_3f4e2e.json({ ok: true });
});

const v_2a73ea = v_1f4ea7.object({ emoji: v_1f4ea7.string().max(16).nullable() });
v_fa56e0.put("/:id/reaction", v_6690d9, async (v_3f4e2e) => {
  const v_73ad51 = v_2ab119(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const { emoji: v_03a50c } = await v_4c95c2(v_3f4e2e, v_2a73ea);
  if (v_03a50c !== null && !v_888068(v_03a50c)) throw new v_3ebe58("VALIDATION_FAILED", "Unsupported reaction.");
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT user_id, role, deletion_state FROM messages WHERE id = ?`)
    .bind(v_73ad51)
    .first<{ user_id: number; role: string; deletion_state: string }>();
  if (!v_3ac7e7 || v_3ac7e7.deletion_state !== "active") throw new v_3ebe58("NOT_FOUND", "Message not found.");
  if (v_3ac7e7.user_id !== v_43e90c) throw new v_3ebe58("FORBIDDEN", "Not your message.");
  if (v_3ac7e7.role !== "clone") throw new v_3ebe58("VALIDATION_FAILED", "Reactions are only for clone messages.");
  await v_3f4e2e.env.DB.prepare(`UPDATE messages SET reaction = ? WHERE id = ?`).bind(v_03a50c, v_73ad51).run();
  return v_3f4e2e.json({ ok: true, reaction: v_03a50c });
});

function v_31113b(v_3f4e2e): number {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  return v_6e0fd3;
}
function v_2ab119(v_3f4e2e): number {
  const v_73ad51 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_73ad51) || v_73ad51 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid message id.");
  }
  return v_73ad51;
}

const v_7c582e = v_1f4ea7.object({
  session_id: v_1f4ea7.string().min(1).max(64).optional(),
  content: v_1f4ea7.string().min(1).max(4000),

  locale: v_1f4ea7.string().min(2).max(16).optional(),

  reply_to_message_id: v_1f4ea7.number().int().positive().optional(),
});

async function v_c5d920(
  c: v_437670<v_de0a25>,
  v_6e0fd3,
  v_4d33b2,

  v_e5af65,
) {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_22da99 = await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c);
  if (!v_22da99) throw new v_3ebe58("FORBIDDEN", "No access to this clone.");

  if (v_7a9d93(v_eb25ce, v_22da99)) {
    throw new v_3ebe58("FORBIDDEN", "This clone is currently suspended.");
  }

  const { key: v_169842, provider: v_93bc27 } = await v_386d00(v_3f4e2e.env, v_43e90c, v_6e0fd3);
  if (v_169842.kind === "shredded") {
    throw new v_3ebe58("FORBIDDEN", "This conversation is no longer available.");
  }
  await v_70ddfa(v_3f4e2e.env, v_43e90c);

  let v_d5c3bc = v_e5af65 ?? v_4d33b2.content;
  let v_a714e9 = null;
  if (v_4d33b2.reply_to_message_id !== undefined) {
    const v_ab6401 = await v_a1651b
      .prepare(
        `SELECT role, content FROM messages
          WHERE id = ? AND user_id = ? AND clone_id = ?
            AND status = 'active' AND deletion_state = 'active' AND content IS NOT NULL`,
      )
      .bind(v_4d33b2.reply_to_message_id, v_43e90c, v_6e0fd3)
      .first<{ role: string; content: string }>();
    const v_418ed5 = v_ab6401 && v_ab6401.role === "clone"
      ? await v_c56968(v_3f4e2e.env, v_169842, v_93bc27, v_a8614b(v_3f4e2e.env.ALE_KEK), v_6e0fd3, "clone", v_ab6401.content)
      : null;
    if (v_418ed5 === null) throw new v_3ebe58("VALIDATION_FAILED", "Reply target is not available.");
    v_d5c3bc = v_ea6521(v_418ed5, v_d5c3bc);
    v_a714e9 = { id: v_4d33b2.reply_to_message_id, content: v_10ee58(v_418ed5) };
  }

  const v_c5607b = v_4d33b2.session_id ?? crypto.randomUUID();

  const v_5f37ae = v_97036c(v_4d33b2.locale ?? v_3f4e2e.req.header("X-App-Locale"));

  let v_b4c4d3;
  let v_b29561 = v_5f37ae ?? v_026a6e;
  if (v_3f4e2e.env.CHAT_REPLY_SOURCE === "prethird") {
    const v_16e2dd = await v_663c07(v_3f4e2e.env, v_43e90c, v_6e0fd3);
    const v_4eca64 = (v_3f4e2e.req.header("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const v_cb35cb = await v_4dc423(v_3f4e2e.env, {
      cloneId: v_6e0fd3, userToken: v_4eca64, text: v_d5c3bc, prior: v_16e2dd.prior, recent: v_16e2dd.recent, userLang: v_5f37ae,
    });
    v_b4c4d3 = v_cb35cb.reply;
    v_b29561 = v_cb35cb.lang;
  } else {
    const [v_19fdaa, v_1405be, v_ee6431] = await Promise.all([
      v_e86502(v_3f4e2e.env, v_6e0fd3),
      v_fda4d7(v_3f4e2e.env, v_6e0fd3),
      v_3821c0(v_3f4e2e.env, v_6e0fd3, v_43e90c),
    ]);
    const v_677216 = await v_295cc5(v_d5c3bc, {
      cloneName: v_eb25ce.name,
      cloneType: v_eb25ce.clone_type,
      persona: (v_991acb(v_19fdaa)?.persona as Record<string, unknown>) ?? {},
      sharedEvents: v_79a0db(v_1405be?.events ?? null) ?? [],
      personalL2: v_991acb(v_ee6431),
    });
    v_b4c4d3 = v_677216.content;
  }

  const v_369293 = await v_f500c0(v_3f4e2e.env, { userId: v_43e90c, cloneId: v_6e0fd3, role: "user" }, v_4d33b2.content);
  const v_09f707 = await v_f500c0(v_3f4e2e.env, { userId: v_43e90c, cloneId: v_6e0fd3, role: "clone" }, v_b4c4d3);
  if (v_369293 === null || v_09f707 === null) {
    throw new v_3ebe58("FORBIDDEN", "This conversation is no longer available.");
  }

  const v_d70f86 = (v_cb35cb, v_b43b74, v_5254bf, v_55f737 = null) =>
    v_a1651b
      .prepare(
        `INSERT INTO messages (clone_id, user_id, session_id, role, content, status, reconciliation_status, lang, reply_to_message_id)
         VALUES (?, ?, ?, ?, ?, 'active', 'pending', ?, ?)
         RETURNING id, created_at`,
      )
      .bind(v_6e0fd3, v_43e90c, v_c5607b, v_cb35cb, v_b43b74, v_5254bf, v_55f737)
      .first<{ id: number; created_at: string }>();
  const v_43f890 = await v_d70f86("user", v_369293, null, v_a714e9?.id ?? null);
  if (!v_43f890) throw new v_3ebe58("INTERNAL_ERROR", "Failed to persist user message.");
  const v_56871e = await v_d70f86("clone", v_09f707, v_b29561);
  if (!v_56871e) throw new v_3ebe58("INTERNAL_ERROR", "Failed to persist clone reply.");

  await v_dd9d7c(v_3f4e2e.env, v_43e90c, v_6e0fd3, "chat");

  await v_721d54(v_3f4e2e.env, v_43e90c, v_6e0fd3, v_cf0463.chat, "chat");

  v_3f4e2e.executionCtx.waitUntil(
    v_a00a76(
      v_3f4e2e.env,
      { userId: v_43e90c, cloneId: v_6e0fd3, cloneName: v_eb25ce.name, replyCreatedAt: v_56871e.created_at, replyText: v_b4c4d3 },
      Number(v_3f4e2e.env.CHAT_UNREAD_PUSH_DELAY_MS ?? v_92f378) || 0,
    ).catch((v_49263d) => console.warn(`[chat.unreadPush] ${v_49263d.message}`)),
  );

  v_3f4e2e.executionCtx.waitUntil(v_123140(v_3f4e2e.env, v_6e0fd3, v_43e90c, v_4d33b2.content, v_b4c4d3));

  await v_a1651b
    .prepare(
      `UPDATE clone_stats SET messages_count = messages_count + 2, updated_at = CURRENT_TIMESTAMP
         WHERE clone_id = ?`,
    )
    .bind(v_6e0fd3)
    .run()
    .catch((v_49263d) => console.error(`[STATS_UPDATE_FAIL] clone=${v_6e0fd3} ${v_49263d.message}`));

  return { sessionId: v_c5607b, userMsg: v_43f890, cloneMsg: v_56871e, replyText: v_b4c4d3, replyLang: v_b29561, replyTo: v_a714e9 };
}

v_19e2a3.post(
  "/:id/messages",
  v_6690d9,
  v_a04a51("messages.send"),
  async (v_3f4e2e) => {
    const v_6e0fd3 = v_31113b(v_3f4e2e);
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_7c582e);
    const { sessionId: v_c5607b, userMsg: v_43f890, cloneMsg: v_56871e, replyText: v_b4c4d3, replyLang: v_b29561, replyTo: v_a714e9 } = await v_c5d920(v_3f4e2e, v_6e0fd3, v_4d33b2);

    await v_74defc(v_3f4e2e, {
      userId: v_3f4e2e.get("userId")!,
      action: "message.send",
      details: { cloneId: v_6e0fd3, sessionId: v_c5607b, userMsgId: v_43f890.id, cloneMsgId: v_56871e.id },
    });

    return v_3f4e2e.json({
      sessionId: v_c5607b,
      userMessage: {
        id: v_43f890.id, content: v_4d33b2.content,
        at: v_15ea73(v_43f890.created_at), createdAt: v_43f890.created_at,
        ...(v_a714e9 ? { replyTo: v_a714e9 } : {}),
      },
      cloneReply: {
        id: v_56871e.id, content: v_b4c4d3, tokens: 0, lang: v_b29561,
        at: v_15ea73(v_56871e.created_at), createdAt: v_56871e.created_at,
      },

      billing: { credits: 0, tokens: 0 },
    });
  },
);

v_19e2a3.post(
  "/:id/messages/image",
  v_6690d9,
  v_a04a51("messages.image"),
  async (v_3f4e2e) => {
    const v_6e0fd3 = v_31113b(v_3f4e2e);
    const v_ebd523 = await v_3f4e2e.req.formData().catch(() => null);

    const v_479f05 = v_ebd523?.get("image");
    if (!v_479f05 || typeof v_479f05 !== "object" || typeof (v_479f05 as { arrayBuffer?: unknown }).arrayBuffer !== "function") {
      throw new v_3ebe58("VALIDATION_FAILED", "image file is required.");
    }
    const v_4de33e = v_479f05 as { type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
    const v_3b27d9 = (v_4de33e.type || "").toLowerCase();
    if (!(v_3f052d as readonly string[]).includes(v_3b27d9)) {
      throw new v_3ebe58("VALIDATION_FAILED", "Unsupported image type.");
    }
    if (v_4de33e.size <= 0 || v_4de33e.size > v_e68875) {
      throw new v_3ebe58("VALIDATION_FAILED", "Image is too large.");
    }
    const v_5c0540 = v_ebd523?.get("session_id");
    const v_acee3a =
      typeof v_5c0540 === "string" && v_5c0540.length >= 1 && v_5c0540.length <= 64 ? v_5c0540 : undefined;

    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
    if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
    const v_22da99 = await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c);
    if (!v_22da99 || v_7a9d93(v_eb25ce, v_22da99)) throw new v_3ebe58("FORBIDDEN", "No access to this clone.");
    await v_70ddfa(v_3f4e2e.env, v_43e90c);

    const v_6856a9 = await v_931a4e(v_3f4e2e.env, {
      bytes: new Uint8Array(await v_4de33e.arrayBuffer()),
      type: v_3b27d9,
    });
    const v_b43b74 = v_56bce4(v_6856a9);
    const v_103b3d = v_ebd523?.get("locale");
    const v_6f298b = typeof v_103b3d === "string" && v_103b3d.length <= 16 ? v_103b3d : undefined;
    const { sessionId: v_c5607b, userMsg: v_43f890, cloneMsg: v_56871e, replyText: v_b4c4d3, replyLang: v_b29561 } = await v_c5d920(
      v_3f4e2e, v_6e0fd3, { session_id: v_acee3a, content: v_b43b74, locale: v_6f298b }, v_741d36(v_6856a9),
    );

    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "message.image",
      details: { cloneId: v_6e0fd3, sessionId: v_c5607b, userMsgId: v_43f890.id, cloneMsgId: v_56871e.id },
    });

    return v_3f4e2e.json({
      sessionId: v_c5607b,
      userMessage: {
        id: v_43f890.id, content: v_a52bdd, kind: "image", caption: v_6856a9,
        at: v_15ea73(v_43f890.created_at), createdAt: v_43f890.created_at,
      },
      cloneReply: {
        id: v_56871e.id, content: v_b4c4d3, tokens: 0, lang: v_b29561,
        at: v_15ea73(v_56871e.created_at), createdAt: v_56871e.created_at,
      },
      billing: { credits: 0, tokens: 0 },
    });
  },
);

v_19e2a3.post(
  "/:id/messages/stream",
  v_6690d9,
  v_a04a51("messages.send"),
  async (v_3f4e2e) => {
    const v_6e0fd3 = v_31113b(v_3f4e2e);
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_7c582e);
    const { sessionId: v_c5607b, userMsg: v_43f890, cloneMsg: v_56871e, replyText: v_b4c4d3, replyLang: v_b29561 } = await v_c5d920(v_3f4e2e, v_6e0fd3, v_4d33b2);

    await v_74defc(v_3f4e2e, {
      userId: v_3f4e2e.get("userId")!,
      action: "message.send.stream",
      details: { cloneId: v_6e0fd3, sessionId: v_c5607b, userMsgId: v_43f890.id, cloneMsgId: v_56871e.id, credits: 0 },
    });

    return v_043916(v_3f4e2e, async (v_cab51f) => {
      try {
        await v_cab51f.writeSSE({
          event: "start",
          data: JSON.stringify({ sessionId: v_c5607b, userMessageId: v_43f890.id }),
        });
        const v_7f18e9 = v_b4c4d3.split(/(\s+)/).filter(Boolean);
        for (const v_334f63 of v_7f18e9) {
          await v_cab51f.writeSSE({ event: "token", data: JSON.stringify({ chunk: v_334f63 }) });
          await v_cab51f.sleep(15);
        }
        await v_cab51f.writeSSE({
          event: "done",
          data: JSON.stringify({
            cloneMessageId: v_56871e.id,
            tokens: 0,
            credits: 0,
            createdAt: v_56871e.created_at,
            lang: v_b29561,
          }),
        });
      } catch (v_49263d) {
        console.error(`[SSE_STREAM_FAIL] clone=${v_6e0fd3} msg=${v_56871e.id} ${(v_49263d as Error).message}`);
        await v_cab51f
          .writeSSE({
            event: "error",
            data: JSON.stringify({
              code: "STREAM_FAILED",
              message: "Stream terminated unexpectedly.",
            }),
          })
          .catch(() => {});
      }
    });
  },
);

const v_872bc1 = v_1f4ea7.object({
  session_id: v_1f4ea7.string().min(1).max(64).optional(),
  cursor: v_1f4ea7.coerce.number().int().positive().optional(), 
  limit: v_1f4ea7.coerce.number().int().min(1).max(100).default(50),
});

v_19e2a3.get("/:id/messages", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_22da99 = await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c);
  if (!v_22da99) throw new v_3ebe58("FORBIDDEN", "No access to this clone.");

  const v_8decf8 = v_872bc1.safeParse(
    Object.fromEntries(new URL(v_3f4e2e.req.url).searchParams.entries()),
  );
  if (!v_8decf8.success) {
    throw new v_3ebe58("VALIDATION_FAILED", "Query invalid.", v_8decf8.error.issues);
  }
  const { session_id: v_acee3a, cursor: v_75cbf4, limit: v_02be30 } = v_8decf8.data;

  const v_abcc8d = [
    `clone_id = ?`,
    `user_id = ?`,
    `status = 'active'`,
  ];
  const v_925171 = [v_6e0fd3, v_43e90c];
  if (v_acee3a) {
    v_abcc8d.push(`session_id = ?`);
    v_925171.push(v_acee3a);
  }
  if (v_75cbf4) {
    v_abcc8d.push(`id < ?`);
    v_925171.push(v_75cbf4);
  }

  const v_18b8bf = (
    await v_a1651b
      .prepare(
        `SELECT id, session_id, role, content, created_at
           FROM messages
          WHERE ${v_abcc8d.join(" AND ")}
          ORDER BY id DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30 + 1)
      .all<{
        id: number;
        session_id: string;
        role: "user" | "clone";
        content: string | null;
        created_at: string;
      }>()
  ).results;

  const v_6bbe19 = v_18b8bf.length > v_02be30;
  const v_2365e9 = v_6bbe19 ? v_18b8bf.slice(0, v_02be30) : v_18b8bf;
  const v_d205b7 = v_a8614b(v_3f4e2e.env.ALE_KEK);
  const v_67b8fb = await v_e44d97(v_3f4e2e);
  const v_742379 = `msg:${v_6e0fd3}`;
  const v_4291aa = v_3f4e2e.env.LAZY_V2_MIGRATE_ENABLED === "1";

  const { key: v_169842 } = await v_386d00(v_3f4e2e.env, v_43e90c, v_6e0fd3);

  const v_4622b9 = await Promise.all(
    v_2365e9.map(async (v_cb35cb) => {
      let v_b43b74 = null;
      if (v_cb35cb.content && v_169842.kind !== "shredded") {
        try {
          const v_da74da = v_169842.kind === "ok" && v_034656(v_cb35cb.content)
            ? v_f7e14c(v_cb35cb.content, v_169842.dekId, v_169842.dek, v_2f0299(v_cb35cb.role))
            : null;
          v_b43b74 = v_da74da ?? await v_137694(v_cb35cb.content, {
            db: v_3f4e2e.env.DB,
            hkdfContext: v_742379,
            legacyProvider: v_d205b7,
            v3Provider: v_67b8fb,
            actor: { type: "user", id: v_43e90c },
            auditSecret: v_3f4e2e.env.AUDIT_SECRET,
            lazyMigrateEnabled: v_4291aa,
            hint: { key: "messages.content", resourceId: v_cb35cb.id },
          });
        } catch (v_49263d) {
          console.error(`[ALE_OPEN_FAIL] msg=${v_cb35cb.id} ${(v_49263d as Error).message}`);
          v_b43b74 = null;
        }
      }
      return {
        id: v_cb35cb.id,
        sessionId: v_cb35cb.session_id,
        role: v_cb35cb.role,
        content: v_b43b74,
        createdAt: v_cb35cb.created_at,
      };
    }),
  );

  return v_3f4e2e.json({
    items: v_4622b9,
    nextCursor: v_6bbe19 && v_2365e9.length > 0 ? v_2365e9[v_2365e9.length - 1]!.id : null,
  });
});

v_19e2a3.get("/:id/sessions", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_22da99 = await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c);
  if (!v_22da99) throw new v_3ebe58("FORBIDDEN", "No access to this clone.");

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT session_id,
                MAX(created_at) AS last_at,
                MAX(id)         AS last_id,
                COUNT(*)        AS message_count
           FROM messages
          WHERE clone_id = ? AND user_id = ? AND status = 'active'
          GROUP BY session_id
          ORDER BY last_id DESC
          LIMIT 50`,
      )
      .bind(v_6e0fd3, v_43e90c)
      .all<{
        session_id: string;
        last_at: string;
        last_id: number;
        message_count: number;
      }>()
  ).results;

  return v_3f4e2e.json({
    sessions: v_18b8bf.map((v_cb35cb) => ({
      sessionId: v_cb35cb.session_id,
      lastAt: v_cb35cb.last_at,
      lastMessageId: v_cb35cb.last_id,
      messageCount: v_cb35cb.message_count,
    })),
  });
});

async function v_778279(
  c: { env: { DB: D1Database; JWT_ACCESS_SECRET: string } } & Parameters<typeof v_09d461>[0],
  v_7f4466,
  v_43e90c,
): Promise<void> {
  const v_a1651b = v_3f4e2e.env.DB;

  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT m.id, m.clone_id, m.user_id, c.owner_id, c.visibility
         FROM messages m JOIN clones c ON c.id = m.clone_id
        WHERE m.id = ? AND ${v_74c502("c")}`,
    )
    .bind(v_7f4466)
    .first<{
      id: number;
      clone_id: number;
      user_id: number;
      owner_id: number;
      visibility: string;
    }>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Message not found.");

  if (v_3ac7e7.user_id !== v_43e90c) throw new v_3ebe58("FORBIDDEN", "Not your conversation.");
  const v_22da99 = await v_09d461(
    v_3f4e2e,
    { id: v_3ac7e7.clone_id, owner_id: v_3ac7e7.owner_id, visibility: v_3ac7e7.visibility },
    v_43e90c,
  );
  if (!v_22da99) throw new v_3ebe58("FORBIDDEN", "No access to this clone.");
}

const v_1d22f1 = v_1f4ea7.object({ note: v_1f4ea7.string().max(500).optional() });

v_fa56e0.post("/:id/star", v_6690d9, async (v_3f4e2e) => {
  const v_7f4466 = v_2ab119(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_638ecc = (await v_3f4e2e.req.json().catch(() => ({}))) as { note?: string };
  const v_8decf8 = v_1d22f1.safeParse(v_638ecc);
  if (!v_8decf8.success) {
    throw new v_3ebe58("VALIDATION_FAILED", "Body invalid.", v_8decf8.error.issues);
  }
  await v_778279(v_3f4e2e, v_7f4466, v_43e90c);

  await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO message_starred (user_id, message_id, note)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, message_id) DO UPDATE SET note = excluded.note`,
    )
    .bind(v_43e90c, v_7f4466, v_8decf8.data.note ?? null)
    .run();
  return v_3f4e2e.json({ ok: true });
});

v_fa56e0.delete("/:id/star", v_6690d9, async (v_3f4e2e) => {
  const v_7f4466 = v_2ab119(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  await v_3f4e2e.env.DB
    .prepare(`DELETE FROM message_starred WHERE user_id = ? AND message_id = ?`)
    .bind(v_43e90c, v_7f4466)
    .run();
  return v_3f4e2e.json({ ok: true });
});

async function v_123140(
  env: v_de0a25["Bindings"],
  v_6e0fd3,
  v_43e90c,
  v_1dfbf4,
  v_27d2be,
): Promise<void> {
  if (v_c9c489.LEARN_FROM_CHAT !== "1") return; 

  void v_6e0fd3; void v_43e90c;
}

function v_991acb(v_479f05): Record<string, unknown> | null {
  if (!v_479f05) return null;
  try {
    const v_81e2ef = JSON.parse(v_479f05);
    return v_81e2ef && typeof v_81e2ef === "object" && !Array.isArray(v_81e2ef)
      ? (v_81e2ef as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
function v_79a0db(v_479f05): unknown[] | null {
  if (!v_479f05) return null;
  try {
    const v_81e2ef = JSON.parse(v_479f05);
    return Array.isArray(v_81e2ef) ? v_81e2ef : null;
  } catch {
    return null;
  }
}
