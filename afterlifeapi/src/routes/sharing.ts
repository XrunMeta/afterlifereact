

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_6690d9 } from "../middleware/auth";
import { v_a04a51 } from "../middleware/idempotency";
import { v_74defc } from "../lib/logger";
import {
  v_7adf64,
  v_5d4a51,
} from "../lib/cloneAccess";
import { v_55b118 } from "../lib/inviteNotifier";
import { v_084137 } from "jyrbilrsgaufsmqlwpinn";
import { v_5f30e2 } from "qcyoxusdylhcdivjkjnuowj";

export const v_403c0a = new v_b7c41b<v_de0a25>();
export const v_98b245 = new v_b7c41b<v_de0a25>();

const v_d4f6d1 = 3 * 24 * 60 * 60 * 1000; 
const v_5ee199 = 50;

function v_31113b(v_3f4e2e): number {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  return v_6e0fd3;
}
function v_165714(v_3f4e2e): number {
  const v_adc048 = Number(v_3f4e2e.req.param("shareId"));
  if (!Number.isInteger(v_adc048) || v_adc048 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid share id.");
  }
  return v_adc048;
}

function v_302a2c(v_fbb6da): string {
  let v_993b31 = "";
  for (const v_148ff6 of v_fbb6da) v_993b31 += v_148ff6.toString(16).padStart(2, "0");
  return v_993b31;
}

function v_27c443(v_9db068): string {
  return v_302a2c(v_084137(new TextEncoder().encode(v_9db068)));
}

function v_8fc319(): string {
  const v_07ba85 = crypto.randomUUID().replace(/-/g, "");
  const v_f91f33 = v_302a2c(v_5f30e2(16));
  return `${v_07ba85}${v_f91f33}`; 
}

async function v_979b07(
  v_a1651b,
  v_6e0fd3,
  v_43e90c,
): Promise<void> {
  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_2aec08 =
    v_eb25ce.owner_id === v_43e90c ||
    (await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c)) === "owner";
  if (!v_2aec08) throw new v_3ebe58("FORBIDDEN", "Owner role required.");
}

const v_f6e296 = v_1f4ea7.object({
  invite_email: v_1f4ea7.email().max(254).optional(),
  relation: v_1f4ea7.string().max(40).optional(),
  grant_owner: v_1f4ea7.boolean().default(false), 
  ttl_hours: v_1f4ea7.number().int().min(1).max(720).optional(), 
});

v_403c0a.post(
  "/:id/invites",
  v_6690d9,
  v_a04a51("sharing.invite"),
  async (v_3f4e2e) => {
    const v_6e0fd3 = v_31113b(v_3f4e2e);
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_f6e296);
    const v_a1651b = v_3f4e2e.env.DB;
    await v_979b07(v_a1651b, v_6e0fd3, v_43e90c);

    const v_f8b770 = await v_a1651b
      .prepare(
        `SELECT COUNT(*) AS n FROM invite_tokens
          WHERE clone_id = ? AND used_at IS NULL AND cancelled_at IS NULL
            AND expires_at > CURRENT_TIMESTAMP`,
      )
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    if ((v_f8b770?.n ?? 0) >= v_5ee199) {
      throw new v_3ebe58(
        "QUOTA_EXCEEDED",
        `Too many active invites (${v_5ee199} max).`,
      );
    }

    const v_21cc31 = v_8fc319();
    const v_109fd8 = v_27c443(v_21cc31);

    const v_9d0b9e = (v_4d33b2.ttl_hours ?? 72) * 60 * 60 * 1000;
    const v_2c50d3 = 30 * 24 * 60 * 60 * 1000; 
    const v_0b8131 = new Date(Date.now() + Math.min(v_9d0b9e, v_2c50d3))
      .toISOString()
      .replace("T", " ")
      .replace(/\..*$/, "");

    try {
      await v_a1651b
        .prepare(
          `INSERT INTO invite_tokens
             (token_hash, clone_id, owner_id, invite_email, relation, grant_owner, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          v_109fd8,
          v_6e0fd3,
          v_43e90c,
          v_4d33b2.invite_email ?? null,
          v_4d33b2.relation ?? null,
          v_4d33b2.grant_owner ? 1 : 0,
          v_0b8131,
        )
        .run();
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error).message ?? "";
      if (/UNIQUE constraint failed: invite_tokens\.token_hash/i.test(v_badeaf)) {

        throw new v_3ebe58("CONFLICT", "Token collision — retry.");
      }
      throw v_49263d;
    }
    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "sharing.invite.create",
      details: { cloneId: v_6e0fd3, grantOwner: v_4d33b2.grant_owner, inviteEmail: v_4d33b2.invite_email },
    });

    let v_666ddb = { emailSent: false, pushSent: 0 };
    if (v_4d33b2.invite_email) {
      const v_ab4c96 = await v_3f4e2e.env.DB.prepare(
        `SELECT c.name AS cloneName, u.name AS inviterName
           FROM clones c LEFT JOIN users u ON u.id = ?
          WHERE c.id = ?`,
      )
        .bind(v_43e90c, v_6e0fd3)
        .first<{ cloneName: string | null; inviterName: string | null }>();
      try {
        v_666ddb = await v_55b118(v_3f4e2e.env, {
          cloneId: v_6e0fd3,
          cloneName: v_ab4c96?.cloneName ?? "페르소나",
          inviterName: v_ab4c96?.inviterName ?? "친구",
          inviteeEmail: v_4d33b2.invite_email,
          token: v_21cc31,
          expiresAt: v_0b8131,
        });
      } catch (v_49263d) {

        console.warn(`[sharing.invite] notify failed: ${(v_49263d as Error).message}`);
      }
    }

    return v_3f4e2e.json(
      {
        token: v_21cc31, 
        expiresAt: v_0b8131,
        inviteEmail: v_4d33b2.invite_email ?? null,
        grantOwner: v_4d33b2.grant_owner,
        notify: v_666ddb,
      },
      201,
    );
  },
);

v_98b245.get("/:token", async (v_3f4e2e) => {
  const v_21cc31 = v_3f4e2e.req.param("token");
  if (!v_21cc31 || v_21cc31.length < 32 || v_21cc31.length > 256) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid token.");
  }
  const v_109fd8 = v_27c443(v_21cc31);
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT i.clone_id, i.invite_email, i.relation, i.grant_owner, i.expires_at, i.used_at, i.cancelled_at,
              c.name, c.username, c.avatar_url, c.clone_type
         FROM invite_tokens i JOIN clones c ON c.id = i.clone_id
        WHERE i.token_hash = ? AND c.deleted_at IS NULL`,
    )
    .bind(v_109fd8)
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
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Invite not found.");
  if (v_3ac7e7.used_at) throw new v_3ebe58("CONFLICT", "Invite already used.");
  if (v_3ac7e7.cancelled_at) throw new v_3ebe58("CONFLICT", "Invite cancelled by owner.");

  const v_2699db = new Date(v_3ac7e7.expires_at.replace(" ", "T") + "Z") < new Date();
  if (v_2699db) throw new v_3ebe58("CONFLICT", "Invite expired.");

  return v_3f4e2e.json({
    clone: {
      id: v_3ac7e7.clone_id,
      name: v_3ac7e7.name,
      username: v_3ac7e7.username,
      avatarUrl: v_3ac7e7.avatar_url,
      cloneType: v_3ac7e7.clone_type,
    },
    inviteEmail: v_3ac7e7.invite_email,
    relation: v_3ac7e7.relation,
    grantOwner: v_3ac7e7.grant_owner === 1,
    expiresAt: v_3ac7e7.expires_at,
  });
});

v_98b245.post(
  "/:token/accept",
  v_6690d9,
  v_a04a51("sharing.invite.accept"),
  async (v_3f4e2e) => {
    const v_21cc31 = v_3f4e2e.req.param("token");
    if (!v_21cc31 || v_21cc31.length < 32 || v_21cc31.length > 256) {
      throw new v_3ebe58("VALIDATION_FAILED", "Invalid token.");
    }
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_a1651b = v_3f4e2e.env.DB;
    const v_109fd8 = v_27c443(v_21cc31);

    const v_f0104f = await v_a1651b
      .prepare(
        `SELECT id, clone_id, invite_email, relation, grant_owner, expires_at, used_at, cancelled_at
           FROM invite_tokens WHERE token_hash = ?`,
      )
      .bind(v_109fd8)
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
    if (!v_f0104f) throw new v_3ebe58("NOT_FOUND", "Invite not found.");
    if (v_f0104f.used_at) throw new v_3ebe58("CONFLICT", "Invite already used.");
    if (v_f0104f.cancelled_at) throw new v_3ebe58("CONFLICT", "Invite cancelled by owner.");
    const v_2699db = new Date(v_f0104f.expires_at.replace(" ", "T") + "Z") < new Date();
    if (v_2699db) throw new v_3ebe58("CONFLICT", "Invite expired.");

    if (v_f0104f.invite_email) {
      const v_ceb55a = await v_a1651b
        .prepare(`SELECT email FROM users WHERE id = ?`)
        .bind(v_43e90c)
        .first<{ email: string }>();
      if (!v_ceb55a || v_ceb55a.email.toLowerCase() !== v_f0104f.invite_email.toLowerCase()) {
        throw new v_3ebe58("FORBIDDEN", "Invite email does not match.");
      }
    }

    const v_22da99 = v_f0104f.grant_owner === 1 ? "owner" : "viewer";
    const v_3c8572 = await v_a1651b
      .prepare(
        `SELECT id, role, status FROM clone_shares
          WHERE clone_id = ? AND target_user_id = ? LIMIT 1`,
      )
      .bind(v_f0104f.clone_id, v_43e90c)
      .first<{ id: number; role: string; status: string }>();

    const v_ebc640 = [];
    if (v_3c8572) {

      v_ebc640.push(
        v_a1651b
          .prepare(
            `UPDATE clone_shares
                SET role = ?, status = 'accepted', relation = COALESCE(?, relation),
                    updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
          )
          .bind(v_22da99, v_f0104f.relation, v_3c8572.id),
      );
    } else {
      v_ebc640.push(
        v_a1651b
          .prepare(
            `INSERT INTO clone_shares
               (clone_id, owner_id, target_user_id, relation, role, status)
             VALUES (?, ?, ?, ?, ?, 'accepted')`,
          )
          .bind(v_f0104f.clone_id, v_43e90c, v_43e90c, v_f0104f.relation, v_22da99),
      );
    }
    v_ebc640.push(
      v_a1651b
        .prepare(
          `UPDATE invite_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ? AND used_at IS NULL`,
        )
        .bind(v_f0104f.id),
    );
    await v_a1651b.batch(v_ebc640);

    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "sharing.invite.accept",
      details: { cloneId: v_f0104f.clone_id, inviteId: v_f0104f.id, role: v_22da99 },
    });
    return v_3f4e2e.json({ ok: true, cloneId: v_f0104f.clone_id, role: v_22da99 });
  },
);

v_403c0a.get("/:id/shares", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  await v_979b07(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT s.id, s.target_user_id, s.invite_email, s.relation, s.role, s.status,
                s.created_at, u.name AS target_name, u.email AS target_email
           FROM clone_shares s
           LEFT JOIN users u ON u.id = s.target_user_id
          WHERE s.clone_id = ?
          ORDER BY s.id ASC`,
      )
      .bind(v_6e0fd3)
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
  return v_3f4e2e.json({
    shares: v_18b8bf.map((v_cb35cb) => ({
      id: v_cb35cb.id,
      targetUserId: v_cb35cb.target_user_id,
      targetName: v_cb35cb.target_name,
      targetEmail: v_cb35cb.target_email,
      inviteEmail: v_cb35cb.invite_email,
      relation: v_cb35cb.relation,
      role: v_cb35cb.role,
      status: v_cb35cb.status,
      createdAt: v_cb35cb.created_at,
    })),
  });
});

v_403c0a.delete(
  "/:id/shares/:shareId",
  v_6690d9,
  v_a04a51("sharing.share.delete"),
  async (v_3f4e2e) => {
    const v_6e0fd3 = v_31113b(v_3f4e2e);
    const v_b7bfe9 = v_165714(v_3f4e2e);
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_a1651b = v_3f4e2e.env.DB;

    const v_5f5d6d = await v_a1651b
      .prepare(
        `SELECT id, clone_id, target_user_id, role, status
           FROM clone_shares WHERE id = ? AND clone_id = ?`,
      )
      .bind(v_b7bfe9, v_6e0fd3)
      .first<{
        id: number;
        clone_id: number;
        target_user_id: number | null;
        role: string;
        status: string;
      }>();
    if (!v_5f5d6d) throw new v_3ebe58("NOT_FOUND", "Share not found.");

    const v_a3c903 = v_5f5d6d.target_user_id === v_43e90c;
    if (v_a3c903 && v_5f5d6d.role === "owner") {
      throw new v_3ebe58(
        "OWNER_CONSTRAINT",
        "Cannot remove your own owner record — delete the clone instead.",
      );
    }
    if (!v_a3c903) {

      await v_979b07(v_a1651b, v_6e0fd3, v_43e90c);
    }

    try {
      await v_a1651b
        .prepare(`DELETE FROM clone_shares WHERE id = ?`)
        .bind(v_b7bfe9)
        .run();
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error).message ?? "";
      if (/at least 2 owners|last required owner/i.test(v_badeaf)) {
        throw new v_3ebe58("OWNER_CONSTRAINT", "2-of-N owner rule violated.");
      }
      throw v_49263d;
    }
    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: v_a3c903 ? "sharing.share.leave" : "sharing.share.kick",
      details: { cloneId: v_6e0fd3, shareId: v_b7bfe9, removedRole: v_5f5d6d.role, removedTargetUserId: v_5f5d6d.target_user_id },
    });
    return v_3f4e2e.json({ ok: true, action: v_a3c903 ? "leave" : "kick" });
  },
);

v_403c0a.get("/:id/invites", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;
  await v_979b07(v_a1651b, v_6e0fd3, v_43e90c);

  const v_18b8bf = await v_a1651b
    .prepare(
      `SELECT id, invite_email, relation, grant_owner, expires_at, created_at
         FROM invite_tokens
        WHERE clone_id = ? AND used_at IS NULL AND cancelled_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        ORDER BY id DESC`,
    )
    .bind(v_6e0fd3)
    .all<{
      id: number;
      invite_email: string | null;
      relation: string | null;
      grant_owner: number;
      expires_at: string;
      created_at: string;
    }>();
  return v_3f4e2e.json({
    items: (v_18b8bf.results ?? []).map((v_cb35cb) => ({
      id: v_cb35cb.id,
      inviteEmail: v_cb35cb.invite_email,
      relation: v_cb35cb.relation,
      grantOwner: !!v_cb35cb.grant_owner,
      expiresAt: v_cb35cb.expires_at,
      createdAt: v_cb35cb.created_at,
      status: "pending" as const,
    })),
  });
});

v_403c0a.delete(
  "/:id/invites/:inviteId",
  v_6690d9,
  v_a04a51("sharing.invite.cancel"),
  async (v_3f4e2e) => {
    const v_6e0fd3 = v_31113b(v_3f4e2e);
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_2e18e1 = Number(v_3f4e2e.req.param("inviteId"));
    if (!Number.isInteger(v_2e18e1) || v_2e18e1 <= 0) {
      throw new v_3ebe58("VALIDATION_FAILED", "Invalid invite id.");
    }
    const v_a1651b = v_3f4e2e.env.DB;
    await v_979b07(v_a1651b, v_6e0fd3, v_43e90c);

    const v_3ac7e7 = await v_a1651b
      .prepare(
        `SELECT id, used_at, cancelled_at FROM invite_tokens
          WHERE id = ? AND clone_id = ?`,
      )
      .bind(v_2e18e1, v_6e0fd3)
      .first<{ id: number; used_at: string | null; cancelled_at: string | null }>();
    if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Invite not found.");
    if (v_3ac7e7.used_at) throw new v_3ebe58("CONFLICT", "Invite already accepted — remove via shares delete instead.");
    if (v_3ac7e7.cancelled_at) throw new v_3ebe58("CONFLICT", "Invite already cancelled.");

    await v_a1651b
      .prepare(`UPDATE invite_tokens SET cancelled_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(v_2e18e1)
      .run();
    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "sharing.invite.cancel",
      details: { cloneId: v_6e0fd3, inviteId: v_2e18e1 },
    });
    return v_3f4e2e.json({ ok: true });
  },
);
