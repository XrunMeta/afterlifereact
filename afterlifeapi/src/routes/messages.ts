

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { requireIdempotencyKey } from "../middleware/idempotency";
import { logActivity } from "../lib/logger";
import { getKekProvider, openAny, seal } from "../lib/ale";
import { requestKekProvider } from "../lib/kekProvider";
import { callMockAI, buildSystemPrompt } from "../lib/ai";
import { spend } from "../lib/credits";
import { cloneActiveSql, loadCloneById, resolveViewerRole } from "../lib/cloneAccess";
import { estimateMessageCost } from "../lib/pricing";
import { readCtx, readShared, readOnt } from "../lib/memoryStore";
import { bumpInteraction, addIntimacyScore, INTIMACY_WEIGHTS } from "../lib/interactions";

export const cloneMessages = new Hono<AppEnv>();
export const messages = new Hono<AppEnv>();

messages.get("/health", (c) => c.json({ ok: true, module: "messages" }));

function parseCloneId(c: { req: { param: (k: string) => string } }): number {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  return cloneId;
}
function parseMessageId(c: { req: { param: (k: string) => string } }): number {
  const mid = Number(c.req.param("id"));
  if (!Number.isInteger(mid) || mid <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid message id.");
  }
  return mid;
}

const postMessageSchema = z.object({
  session_id: z.string().min(1).max(64).optional(),
  content: z.string().min(1).max(4000),
});

cloneMessages.post(
  "/:id/messages",
  requireAuth,
  requireIdempotencyKey("messages.send"),
  async (c) => {
    const cloneId = parseCloneId(c);
    const body = await parseJson(c, postMessageSchema);
    const userId = c.get("userId")!;
    const db = c.env.DB;

    const clone = await loadCloneById(db, cloneId);
    if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
    const role = await resolveViewerRole(c, clone, userId);
    if (!role) throw new APIError("FORBIDDEN", "No access to this clone.");

    const balance = await db
      .prepare(`SELECT credits FROM users WHERE id = ? AND deleted_at IS NULL`)
      .bind(userId)
      .first<{ credits: number }>();
    if (!balance || balance.credits < 1) {
      throw new APIError("INSUFFICIENT_CREDITS", "Not enough credits to chat.");
    }

    const sessionId = body.session_id ?? crypto.randomUUID();
    const provider = getKekProvider(c.env.ALE_KEK);
    const aleContext = `msg:${cloneId}`;
    const userCiphertext = seal(body.content, provider, aleContext);

    const userMsg = await db
      .prepare(
        `INSERT INTO messages (clone_id, user_id, session_id, role, content, status, reconciliation_status)
         VALUES (?, ?, ?, 'user', ?, 'active', 'pending')
         RETURNING id, created_at`,
      )
      .bind(cloneId, userId, sessionId, userCiphertext)
      .first<{ id: number; created_at: string }>();
    if (!userMsg) throw new APIError("INTERNAL_ERROR", "Failed to persist user message.");

    await bumpInteraction(c.env, userId, cloneId, "chat");

    await addIntimacyScore(c.env, userId, cloneId, INTIMACY_WEIGHTS.chat, "chat");

    const [l1Raw, sharedData, l2Raw] = await Promise.all([
      readCtx(c.env, cloneId),
      readShared(c.env, cloneId),
      readOnt(c.env, cloneId, userId),
    ]);
    const sharedRaw = sharedData?.events ?? null;
    const persona = safeParseObj(l1Raw)?.persona as Record<string, unknown> ?? {};
    const sharedEvents = safeParseArr(sharedRaw) ?? [];
    const l2 = safeParseObj(l2Raw);

    const systemPrompt = buildSystemPrompt({
      cloneName: clone.name,
      cloneType: clone.clone_type,
      persona,
      sharedEvents,
      personalL2: l2,
    });

    void systemPrompt;

    const reply = await callMockAI(body.content, {
      cloneName: clone.name,
      cloneType: clone.clone_type,
      persona,
      sharedEvents,
      personalL2: l2,
    });

    const cloneCiphertext = seal(reply.content, provider, aleContext);
    const cloneMsg = await db
      .prepare(
        `INSERT INTO messages (clone_id, user_id, session_id, role, content, status, reconciliation_status)
         VALUES (?, ?, ?, 'clone', ?, 'active', 'pending')
         RETURNING id, created_at`,
      )
      .bind(cloneId, userId, sessionId, cloneCiphertext)
      .first<{ id: number; created_at: string }>();
    if (!cloneMsg) throw new APIError("INTERNAL_ERROR", "Failed to persist clone reply.");

    c.executionCtx.waitUntil(
      maybeLearnFromChat(c.env, cloneId, userId, body.content, reply.content),
    );

    await db
      .prepare(
        `UPDATE clone_stats SET messages_count = messages_count + 2, updated_at = CURRENT_TIMESTAMP
           WHERE clone_id = ?`,
      )
      .bind(cloneId)
      .run()
      .catch((err: Error) =>
        console.error(`[STATS_UPDATE_FAIL] clone=${cloneId} ${err.message}`),
      );

    const idemKey = c.req.header("X-Idempotency-Key")!;
    const { credits: cost, tokens: totalTokens } = estimateMessageCost({
      userText: body.content,
      replyText: reply.content,
      actualTokens: reply.tokens,
    });
    await spend(c, {
      userId,
      amount: cost,
      type: "message_send",
      refId: String(cloneMsg.id),
      idempotencyKey: `msg:${idemKey}`,
    });

    await logActivity(c, {
      userId,
      action: "message.send",
      details: { cloneId, sessionId, userMsgId: userMsg.id, cloneMsgId: cloneMsg.id },
    });

    return c.json({
      sessionId,
      userMessage: {
        id: userMsg.id,
        content: body.content,
        createdAt: userMsg.created_at,
      },
      cloneReply: {
        id: cloneMsg.id,
        content: reply.content,
        tokens: reply.tokens,
        createdAt: cloneMsg.created_at,
      },
      billing: {
        credits: cost,
        tokens: totalTokens,
      },
    });
  },
);

cloneMessages.post(
  "/:id/messages/stream",
  requireAuth,
  requireIdempotencyKey("messages.send"),
  async (c) => {
    const cloneId = parseCloneId(c);
    const body = await parseJson(c, postMessageSchema);
    const userId = c.get("userId")!;
    const db = c.env.DB;

    const clone = await loadCloneById(db, cloneId);
    if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
    const role = await resolveViewerRole(c, clone, userId);
    if (!role) throw new APIError("FORBIDDEN", "No access to this clone.");

    const balance = await db
      .prepare(`SELECT credits FROM users WHERE id = ? AND deleted_at IS NULL`)
      .bind(userId)
      .first<{ credits: number }>();
    if (!balance || balance.credits < 1) {
      throw new APIError("INSUFFICIENT_CREDITS", "Not enough credits to chat.");
    }

    const sessionId = body.session_id ?? crypto.randomUUID();
    const provider = getKekProvider(c.env.ALE_KEK);
    const aleContext = `msg:${cloneId}`;
    const userCiphertext = seal(body.content, provider, aleContext);

    const userMsg = await db
      .prepare(
        `INSERT INTO messages (clone_id, user_id, session_id, role, content, status, reconciliation_status)
         VALUES (?, ?, ?, 'user', ?, 'active', 'pending')
         RETURNING id, created_at`,
      )
      .bind(cloneId, userId, sessionId, userCiphertext)
      .first<{ id: number; created_at: string }>();
    if (!userMsg) throw new APIError("INTERNAL_ERROR", "Failed to persist user message.");

    const [l1Raw, sharedData, l2Raw] = await Promise.all([
      readCtx(c.env, cloneId),
      readShared(c.env, cloneId),
      readOnt(c.env, cloneId, userId),
    ]);
    const sharedRaw = sharedData?.events ?? null;
    const persona = (safeParseObj(l1Raw)?.persona as Record<string, unknown>) ?? {};
    const sharedEvents = safeParseArr(sharedRaw) ?? [];
    const l2 = safeParseObj(l2Raw);

    const reply = await callMockAI(body.content, {
      cloneName: clone.name,
      cloneType: clone.clone_type,
      persona,
      sharedEvents,
      personalL2: l2,
    });

    const cloneCiphertext = seal(reply.content, provider, aleContext);
    const cloneMsg = await db
      .prepare(
        `INSERT INTO messages (clone_id, user_id, session_id, role, content, status, reconciliation_status)
         VALUES (?, ?, ?, 'clone', ?, 'active', 'pending')
         RETURNING id, created_at`,
      )
      .bind(cloneId, userId, sessionId, cloneCiphertext)
      .first<{ id: number; created_at: string }>();
    if (!cloneMsg) throw new APIError("INTERNAL_ERROR", "Failed to persist clone reply.");

    c.executionCtx.waitUntil(
      maybeLearnFromChat(c.env, cloneId, userId, body.content, reply.content),
    );

    await db
      .prepare(
        `UPDATE clone_stats SET messages_count = messages_count + 2, updated_at = CURRENT_TIMESTAMP
           WHERE clone_id = ?`,
      )
      .bind(cloneId)
      .run()
      .catch((err: Error) =>
        console.error(`[STATS_UPDATE_FAIL_SSE] clone=${cloneId} ${err.message}`),
      );

    const idemKey = c.req.header("X-Idempotency-Key")!;
    const { credits: cost, tokens: totalTokens } = estimateMessageCost({
      userText: body.content,
      replyText: reply.content,
      actualTokens: reply.tokens,
    });
    await spend(c, {
      userId,
      amount: cost,
      type: "message_send",
      refId: String(cloneMsg.id),
      idempotencyKey: `msg:${idemKey}`,
    });

    await logActivity(c, {
      userId,
      action: "message.send.stream",
      details: { cloneId, sessionId, userMsgId: userMsg.id, cloneMsgId: cloneMsg.id, credits: cost },
    });

    return streamSSE(c, async (stream) => {
      try {
        await stream.writeSSE({
          event: "start",
          data: JSON.stringify({ sessionId, userMessageId: userMsg.id }),
        });
        const chunks = reply.content.split(/(\s+)/).filter(Boolean);
        for (const chunk of chunks) {
          await stream.writeSSE({ event: "token", data: JSON.stringify({ chunk }) });
          await stream.sleep(15);
        }
        await stream.writeSSE({
          event: "done",
          data: JSON.stringify({
            cloneMessageId: cloneMsg.id,
            tokens: totalTokens,
            credits: cost,
            createdAt: cloneMsg.created_at,
          }),
        });
      } catch (err) {
        console.error(`[SSE_STREAM_FAIL] clone=${cloneId} msg=${cloneMsg.id} ${(err as Error).message}`);
        await stream
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

const listQuery = z.object({
  session_id: z.string().min(1).max(64).optional(),
  cursor: z.coerce.number().int().positive().optional(), 
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

cloneMessages.get("/:id/messages", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  const db = c.env.DB;

  const clone = await loadCloneById(db, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
  const role = await resolveViewerRole(c, clone, userId);
  if (!role) throw new APIError("FORBIDDEN", "No access to this clone.");

  const parsed = listQuery.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams.entries()),
  );
  if (!parsed.success) {
    throw new APIError("VALIDATION_FAILED", "Query invalid.", parsed.error.issues);
  }
  const { session_id, cursor, limit } = parsed.data;

  const where: string[] = [
    `clone_id = ?`,
    `user_id = ?`,
    `status = 'active'`,
  ];
  const binds: unknown[] = [cloneId, userId];
  if (session_id) {
    where.push(`session_id = ?`);
    binds.push(session_id);
  }
  if (cursor) {
    where.push(`id < ?`);
    binds.push(cursor);
  }

  const rows = (
    await db
      .prepare(
        `SELECT id, session_id, role, content, created_at
           FROM messages
          WHERE ${where.join(" AND ")}
          ORDER BY id DESC
          LIMIT ?`,
      )
      .bind(...binds, limit + 1)
      .all<{
        id: number;
        session_id: string;
        role: "user" | "clone";
        content: string | null;
        created_at: string;
      }>()
  ).results;

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const legacyProvider = getKekProvider(c.env.ALE_KEK);
  const v3Provider = await requestKekProvider(c);
  const aleContext = `msg:${cloneId}`;
  const lazyMigrateEnabled = c.env.LAZY_V2_MIGRATE_ENABLED === "1";

  const items = await Promise.all(
    page.map(async (r) => {
      let content: string | null = null;
      if (r.content) {
        try {
          content = await openAny(r.content, {
            db: c.env.DB,
            hkdfContext: aleContext,
            legacyProvider,
            v3Provider,
            actor: { type: "user", id: userId },
            auditSecret: c.env.AUDIT_SECRET,
            lazyMigrateEnabled,
            hint: { key: "messages.content", resourceId: r.id },
          });
        } catch (err) {
          console.error(`[ALE_OPEN_FAIL] msg=${r.id} ${(err as Error).message}`);
          content = null;
        }
      }
      return {
        id: r.id,
        sessionId: r.session_id,
        role: r.role,
        content,
        createdAt: r.created_at,
      };
    }),
  );

  return c.json({
    items,
    nextCursor: hasMore && page.length > 0 ? page[page.length - 1]!.id : null,
  });
});

cloneMessages.get("/:id/sessions", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
  const role = await resolveViewerRole(c, clone, userId);
  if (!role) throw new APIError("FORBIDDEN", "No access to this clone.");

  const rows = (
    await c.env.DB
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
      .bind(cloneId, userId)
      .all<{
        session_id: string;
        last_at: string;
        last_id: number;
        message_count: number;
      }>()
  ).results;

  return c.json({
    sessions: rows.map((r) => ({
      sessionId: r.session_id,
      lastAt: r.last_at,
      lastMessageId: r.last_id,
      messageCount: r.message_count,
    })),
  });
});

async function assertMessageAccessible(
  c: { env: { DB: D1Database; JWT_ACCESS_SECRET: string } } & Parameters<typeof resolveViewerRole>[0],
  messageId: number,
  userId: number,
): Promise<void> {
  const db = c.env.DB;

  const row = await db
    .prepare(
      `SELECT m.id, m.clone_id, m.user_id, c.owner_id, c.visibility
         FROM messages m JOIN clones c ON c.id = m.clone_id
        WHERE m.id = ? AND ${cloneActiveSql("c")}`,
    )
    .bind(messageId)
    .first<{
      id: number;
      clone_id: number;
      user_id: number;
      owner_id: number;
      visibility: string;
    }>();
  if (!row) throw new APIError("NOT_FOUND", "Message not found.");

  if (row.user_id !== userId) throw new APIError("FORBIDDEN", "Not your conversation.");
  const role = await resolveViewerRole(
    c,
    { id: row.clone_id, owner_id: row.owner_id, visibility: row.visibility },
    userId,
  );
  if (!role) throw new APIError("FORBIDDEN", "No access to this clone.");
}

const starSchema = z.object({ note: z.string().max(500).optional() });

messages.post("/:id/star", requireAuth, async (c) => {
  const messageId = parseMessageId(c);
  const userId = c.get("userId")!;
  const note = (await c.req.json().catch(() => ({}))) as { note?: string };
  const parsed = starSchema.safeParse(note);
  if (!parsed.success) {
    throw new APIError("VALIDATION_FAILED", "Body invalid.", parsed.error.issues);
  }
  await assertMessageAccessible(c, messageId, userId);

  await c.env.DB
    .prepare(
      `INSERT INTO message_starred (user_id, message_id, note)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, message_id) DO UPDATE SET note = excluded.note`,
    )
    .bind(userId, messageId, parsed.data.note ?? null)
    .run();
  return c.json({ ok: true });
});

messages.delete("/:id/star", requireAuth, async (c) => {
  const messageId = parseMessageId(c);
  const userId = c.get("userId")!;
  await c.env.DB
    .prepare(`DELETE FROM message_starred WHERE user_id = ? AND message_id = ?`)
    .bind(userId, messageId)
    .run();
  return c.json({ ok: true });
});

async function maybeLearnFromChat(
  env: AppEnv["Bindings"],
  cloneId: number,
  userId: number,
  _userText: string,
  _replyText: string,
): Promise<void> {
  if (env.LEARN_FROM_CHAT !== "1") return; 

  void cloneId; void userId;
}

function safeParseObj(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
function safeParseArr(raw: string | null): unknown[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
