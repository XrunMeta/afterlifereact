

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { requireIdempotencyKey } from "../middleware/idempotency";
import { logActivity } from "../lib/logger";
import {
  hasAcceptedShare,
  loadCloneById,
} from "../lib/cloneAccess";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/ciphers/utils.js";

export const cloneShares = new Hono<AppEnv>();
export const inviteTokens = new Hono<AppEnv>();

const INVITE_TTL_MS = 3 * 24 * 60 * 60 * 1000; 
const MAX_ACTIVE_INVITES_PER_CLONE = 50;

function parseCloneId(c: { req: { param: (k: string) => string } }): number {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  return cloneId;
}
function parseShareId(c: { req: { param: (k: string) => string } }): number {
  const sid = Number(c.req.param("shareId"));
  if (!Number.isInteger(sid) || sid <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid share id.");
  }
  return sid;
}

function toHex(bytes: Uint8Array): string {
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

function hashToken(plaintext: string): string {
  return toHex(sha256(new TextEncoder().encode(plaintext)));
}

function generateInviteToken(): string {
  const uuid = crypto.randomUUID().replace(/-/g, "");
  const extra = toHex(randomBytes(16));
  return `${uuid}${extra}`; 
}

async function assertOwner(
  db: D1Database,
  cloneId: number,
  userId: number,
): Promise<void> {
  const clone = await loadCloneById(db, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
  const isOwner =
    clone.owner_id === userId ||
    (await hasAcceptedShare(db, cloneId, userId)) === "owner";
  if (!isOwner) throw new APIError("FORBIDDEN", "Owner role required.");
}

const inviteCreateSchema = z.object({
  invite_email: z.email().max(254).optional(),
  relation: z.string().max(40).optional(),
  grant_owner: z.boolean().default(false), 
  ttl_hours: z.number().int().min(1).max(720).optional(), 
});

cloneShares.post(
  "/:id/invites",
  requireAuth,
  requireIdempotencyKey("sharing.invite"),
  async (c) => {
    const cloneId = parseCloneId(c);
    const userId = c.get("userId")!;
    const body = await parseJson(c, inviteCreateSchema);
    const db = c.env.DB;
    await assertOwner(db, cloneId, userId);

    const active = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM invite_tokens
          WHERE clone_id = ? AND used_at IS NULL AND cancelled_at IS NULL
            AND expires_at > CURRENT_TIMESTAMP`,
      )
      .bind(cloneId)
      .first<{ n: number }>();
    if ((active?.n ?? 0) >= MAX_ACTIVE_INVITES_PER_CLONE) {
      throw new APIError(
        "QUOTA_EXCEEDED",
        `Too many active invites (${MAX_ACTIVE_INVITES_PER_CLONE} max).`,
      );
    }

    const token = generateInviteToken();
    const tokenHash = hashToken(token);

    const ttlMs = (body.ttl_hours ?? 72) * 60 * 60 * 1000;
    const MAX_TTL_MS = 30 * 24 * 60 * 60 * 1000; 
    const expiresAt = new Date(Date.now() + Math.min(ttlMs, MAX_TTL_MS))
      .toISOString()
      .replace("T", " ")
      .replace(/\..*$/, "");

    try {
      await db
        .prepare(
          `INSERT INTO invite_tokens
             (token_hash, clone_id, owner_id, invite_email, relation, grant_owner, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          tokenHash,
          cloneId,
          userId,
          body.invite_email ?? null,
          body.relation ?? null,
          body.grant_owner ? 1 : 0,
          expiresAt,
        )
        .run();
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (/UNIQUE constraint failed: invite_tokens\.token_hash/i.test(msg)) {

        throw new APIError("CONFLICT", "Token collision — retry.");
      }
      throw err;
    }
    await logActivity(c, {
      userId,
      action: "sharing.invite.create",
      details: { cloneId, grantOwner: body.grant_owner, inviteEmail: body.invite_email },
    });
    return c.json(
      {
        token, 
        expiresAt,
        inviteEmail: body.invite_email ?? null,
        grantOwner: body.grant_owner,
      },
      201,
    );
  },
);

inviteTokens.get("/:token", async (c) => {
  const token = c.req.param("token");
  if (!token || token.length < 32 || token.length > 256) {
    throw new APIError("VALIDATION_FAILED", "Invalid token.");
  }
  const tokenHash = hashToken(token);
  const row = await c.env.DB
    .prepare(
      `SELECT i.clone_id, i.invite_email, i.relation, i.grant_owner, i.expires_at, i.used_at, i.cancelled_at,
              c.name, c.username, c.avatar_url, c.clone_type
         FROM invite_tokens i JOIN clones c ON c.id = i.clone_id
        WHERE i.token_hash = ? AND c.deleted_at IS NULL`,
    )
    .bind(tokenHash)
    .first<{
      clone_id: number;
      invite_email: string | null;
      relation: string | null;
      grant_owner: number;
      expires_at: string;
      used_at: string | null;
      cancelled_at: string | null;
      name: string;
      username: string;
      avatar_url: string | null;
      clone_type: string;
    }>();
  if (!row) throw new APIError("NOT_FOUND", "Invite not found.");
  if (row.used_at) throw new APIError("CONFLICT", "Invite already used.");
  if (row.cancelled_at) throw new APIError("CONFLICT", "Invite cancelled by owner.");

  const expired = new Date(row.expires_at.replace(" ", "T") + "Z") < new Date();
  if (expired) throw new APIError("CONFLICT", "Invite expired.");

  return c.json({
    clone: {
      id: row.clone_id,
      name: row.name,
      username: row.username,
      avatarUrl: row.avatar_url,
      cloneType: row.clone_type,
    },
    inviteEmail: row.invite_email,
    relation: row.relation,
    grantOwner: row.grant_owner === 1,
    expiresAt: row.expires_at,
  });
});

inviteTokens.post(
  "/:token/accept",
  requireAuth,
  requireIdempotencyKey("sharing.invite.accept"),
  async (c) => {
    const token = c.req.param("token");
    if (!token || token.length < 32 || token.length > 256) {
      throw new APIError("VALIDATION_FAILED", "Invalid token.");
    }
    const userId = c.get("userId")!;
    const db = c.env.DB;
    const tokenHash = hashToken(token);

    const inv = await db
      .prepare(
        `SELECT id, clone_id, invite_email, relation, grant_owner, expires_at, used_at, cancelled_at
           FROM invite_tokens WHERE token_hash = ?`,
      )
      .bind(tokenHash)
      .first<{
        id: number;
        clone_id: number;
        invite_email: string | null;
        relation: string | null;
        grant_owner: number;
        expires_at: string;
        used_at: string | null;
        cancelled_at: string | null;
      }>();
    if (!inv) throw new APIError("NOT_FOUND", "Invite not found.");
    if (inv.used_at) throw new APIError("CONFLICT", "Invite already used.");
    if (inv.cancelled_at) throw new APIError("CONFLICT", "Invite cancelled by owner.");
    const expired = new Date(inv.expires_at.replace(" ", "T") + "Z") < new Date();
    if (expired) throw new APIError("CONFLICT", "Invite expired.");

    if (inv.invite_email) {
      const u = await db
        .prepare(`SELECT email FROM users WHERE id = ?`)
        .bind(userId)
        .first<{ email: string }>();
      if (!u || u.email.toLowerCase() !== inv.invite_email.toLowerCase()) {
        throw new APIError("FORBIDDEN", "Invite email does not match.");
      }
    }

    const role = inv.grant_owner === 1 ? "owner" : "viewer";
    const existing = await db
      .prepare(
        `SELECT id, role, status FROM clone_shares
          WHERE clone_id = ? AND target_user_id = ? LIMIT 1`,
      )
      .bind(inv.clone_id, userId)
      .first<{ id: number; role: string; status: string }>();

    const operations: D1PreparedStatement[] = [];
    if (existing) {

      operations.push(
        db
          .prepare(
            `UPDATE clone_shares
                SET role = ?, status = 'accepted', relation = COALESCE(?, relation),
                    updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
          )
          .bind(role, inv.relation, existing.id),
      );
    } else {
      operations.push(
        db
          .prepare(
            `INSERT INTO clone_shares
               (clone_id, owner_id, target_user_id, relation, role, status)
             VALUES (?, ?, ?, ?, ?, 'accepted')`,
          )
          .bind(inv.clone_id, userId, userId, inv.relation, role),
      );
    }
    operations.push(
      db
        .prepare(
          `UPDATE invite_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ? AND used_at IS NULL`,
        )
        .bind(inv.id),
    );
    await db.batch(operations);

    await logActivity(c, {
      userId,
      action: "sharing.invite.accept",
      details: { cloneId: inv.clone_id, inviteId: inv.id, role },
    });
    return c.json({ ok: true, cloneId: inv.clone_id, role });
  },
);

cloneShares.get("/:id/shares", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  await assertOwner(c.env.DB, cloneId, userId);

  const rows = (
    await c.env.DB
      .prepare(
        `SELECT s.id, s.target_user_id, s.invite_email, s.relation, s.role, s.status,
                s.created_at, u.name AS target_name, u.email AS target_email
           FROM clone_shares s
           LEFT JOIN users u ON u.id = s.target_user_id
          WHERE s.clone_id = ?
          ORDER BY s.id ASC`,
      )
      .bind(cloneId)
      .all<{
        id: number;
        target_user_id: number | null;
        invite_email: string | null;
        relation: string | null;
        role: string;
        status: string;
        created_at: string;
        target_name: string | null;
        target_email: string | null;
      }>()
  ).results;
  return c.json({
    shares: rows.map((r) => ({
      id: r.id,
      targetUserId: r.target_user_id,
      targetName: r.target_name,
      targetEmail: r.target_email,
      inviteEmail: r.invite_email,
      relation: r.relation,
      role: r.role,
      status: r.status,
      createdAt: r.created_at,
    })),
  });
});

cloneShares.delete(
  "/:id/shares/:shareId",
  requireAuth,
  requireIdempotencyKey("sharing.share.delete"),
  async (c) => {
    const cloneId = parseCloneId(c);
    const shareId = parseShareId(c);
    const userId = c.get("userId")!;
    const db = c.env.DB;

    const target = await db
      .prepare(
        `SELECT id, clone_id, target_user_id, role, status
           FROM clone_shares WHERE id = ? AND clone_id = ?`,
      )
      .bind(shareId, cloneId)
      .first<{
        id: number;
        clone_id: number;
        target_user_id: number | null;
        role: string;
        status: string;
      }>();
    if (!target) throw new APIError("NOT_FOUND", "Share not found.");

    const isSelf = target.target_user_id === userId;
    if (isSelf && target.role === "owner") {
      throw new APIError(
        "OWNER_CONSTRAINT",
        "Cannot remove your own owner record — delete the clone instead.",
      );
    }
    if (!isSelf) {

      await assertOwner(db, cloneId, userId);
    }

    try {
      await db
        .prepare(`DELETE FROM clone_shares WHERE id = ?`)
        .bind(shareId)
        .run();
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (/at least 2 owners|last required owner/i.test(msg)) {
        throw new APIError("OWNER_CONSTRAINT", "2-of-N owner rule violated.");
      }
      throw err;
    }
    await logActivity(c, {
      userId,
      action: isSelf ? "sharing.share.leave" : "sharing.share.kick",
      details: { cloneId, shareId, removedRole: target.role, removedTargetUserId: target.target_user_id },
    });
    return c.json({ ok: true, action: isSelf ? "leave" : "kick" });
  },
);

cloneShares.get("/:id/invites", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  const db = c.env.DB;
  await assertOwner(db, cloneId, userId);

  const rows = await db
    .prepare(
      `SELECT id, invite_email, relation, grant_owner, expires_at, created_at
         FROM invite_tokens
        WHERE clone_id = ? AND used_at IS NULL AND cancelled_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        ORDER BY id DESC`,
    )
    .bind(cloneId)
    .all<{
      id: number;
      invite_email: string | null;
      relation: string | null;
      grant_owner: number;
      expires_at: string;
      created_at: string;
    }>();
  return c.json({
    items: (rows.results ?? []).map((r) => ({
      id: r.id,
      inviteEmail: r.invite_email,
      relation: r.relation,
      grantOwner: !!r.grant_owner,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
      status: "pending" as const,
    })),
  });
});

cloneShares.delete(
  "/:id/invites/:inviteId",
  requireAuth,
  requireIdempotencyKey("sharing.invite.cancel"),
  async (c) => {
    const cloneId = parseCloneId(c);
    const userId = c.get("userId")!;
    const inviteId = Number(c.req.param("inviteId"));
    if (!Number.isInteger(inviteId) || inviteId <= 0) {
      throw new APIError("VALIDATION_FAILED", "Invalid invite id.");
    }
    const db = c.env.DB;
    await assertOwner(db, cloneId, userId);

    const row = await db
      .prepare(
        `SELECT id, used_at, cancelled_at FROM invite_tokens
          WHERE id = ? AND clone_id = ?`,
      )
      .bind(inviteId, cloneId)
      .first<{ id: number; used_at: string | null; cancelled_at: string | null }>();
    if (!row) throw new APIError("NOT_FOUND", "Invite not found.");
    if (row.used_at) throw new APIError("CONFLICT", "Invite already accepted — remove via shares delete instead.");
    if (row.cancelled_at) throw new APIError("CONFLICT", "Invite already cancelled.");

    await db
      .prepare(`UPDATE invite_tokens SET cancelled_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(inviteId)
      .run();
    await logActivity(c, {
      userId,
      action: "sharing.invite.cancel",
      details: { cloneId, inviteId },
    });
    return c.json({ ok: true });
  },
);
