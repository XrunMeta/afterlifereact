

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import type { v_d33606 } from "../lib/coldStorage";
import { v_344b9e } from "../lib/memoryStore";

export const v_dda4b9 = new v_b7c41b<v_de0a25>();

type SoftDeleteResult = "ok" | "not_found" | "not_owner" | "already_deleted";
type SoftRestoreResult = "ok" | "not_found" | "not_owner" | "not_soft_deleted" | "past_restore_window";

const TABLE: Record<v_d33606, string> = {
  user: "users",
  clone: "clones",
  message: "messages",
};

const HAS_SOFT_DELETED_AT: Record<v_d33606, boolean> = {
  user: true,
  clone: true,
  message: false,
};

const v_8cc98d = 90;

async function v_b4f765(
  v_a1651b,
  type: v_d33606,
  v_389afb,
  v_9cd637,
  v_1badb6,
): Promise<SoftDeleteResult> {
  const v_cb9428 = v_edff4c[v_3b27d9];
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT id, deletion_state, ${v_9cd637} FROM ${v_cb9428} WHERE id = ?`)
    .bind(v_389afb)
    .first<{ id: number; deletion_state: string; [key: string]: unknown }>();

  if (!v_3ac7e7) return "not_found";
  if (v_3ac7e7[v_9cd637] !== v_1badb6) return "not_owner";
  if (v_3ac7e7.deletion_state !== "active") return "already_deleted";

  const v_24f50c = v_66e19e[v_3b27d9]
    ? v_3b27d9 === "clone"
      ? "deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP"
      : "deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP"
    : "deletion_state = 'soft_deleted'";

  await v_a1651b
    .prepare(`UPDATE ${v_cb9428} SET ${v_24f50c} WHERE id = ?`)
    .bind(v_389afb)
    .run();

  return "ok";
}

export async function v_c8311e(
  v_a1651b,
  type: v_d33606,
  v_389afb,
  v_9cd637,
  v_1badb6,
): Promise<SoftRestoreResult> {
  const v_cb9428 = v_edff4c[v_3b27d9];

  const v_1494c2 = v_66e19e[v_3b27d9]
    ? `SELECT id, deletion_state, ${v_9cd637}, soft_deleted_at FROM ${v_cb9428} WHERE id = ?`
    : `SELECT id, deletion_state, ${v_9cd637} FROM ${v_cb9428} WHERE id = ?`;
  const v_3ac7e7 = await v_a1651b
    .prepare(v_1494c2)
    .bind(v_389afb)
    .first<{
      id: number;
      deletion_state: string;
      soft_deleted_at: string | null;
      [key: string]: unknown;
    }>();

  if (!v_3ac7e7) return "not_found";
  if (v_3ac7e7[v_9cd637] !== v_1badb6) return "not_owner";
  if (v_3ac7e7.deletion_state !== "soft_deleted") return "not_soft_deleted";

  if (v_66e19e[v_3b27d9] && v_3ac7e7.soft_deleted_at) {
    const v_bee926 = new Date(v_3ac7e7.soft_deleted_at).getTime();
    const v_4c14f9 = v_bee926 + v_8cc98d * 24 * 60 * 60 * 1000;
    if (Date.now() > v_4c14f9) return "past_restore_window";
  }

  const v_24f50c = v_66e19e[v_3b27d9]
    ? v_3b27d9 === "clone"
      ? "deletion_state = 'active', soft_deleted_at = NULL, deleted_at = NULL"
      : "deletion_state = 'active', soft_deleted_at = NULL"
    : "deletion_state = 'active'";

  await v_a1651b
    .prepare(`UPDATE ${v_cb9428} SET ${v_24f50c} WHERE id = ?`)
    .bind(v_389afb)
    .run();

  return "ok";
}

function v_d24e3e(v_43c42e) {
  switch (v_43c42e) {
    case "not_found":
      throw new v_3ebe58("NOT_FOUND", "Resource not found.");
    case "not_owner":
      throw new v_3ebe58("FORBIDDEN", "You do not own this resource.");
    case "already_deleted":
      throw new v_3ebe58("CONFLICT", "Resource is already deleted.");
  }
}

function v_7b6df3(v_43c42e) {
  switch (v_43c42e) {
    case "not_found":
      throw new v_3ebe58("NOT_FOUND", "Resource not found.");
    case "not_owner":
      throw new v_3ebe58("FORBIDDEN", "You do not own this resource.");
    case "not_soft_deleted":
      throw new v_3ebe58("CONFLICT", "Resource is not in soft_deleted state.");
    case "past_restore_window":
      throw new v_3ebe58("SHREDDED", "Restore window has expired (90 days).");
  }
}

export async function v_f51850(
  v_a1651b,
  v_1badb6,
): Promise<{ softDeleted: number; transferred: number }> {
  const v_2461e1 = (
    await v_a1651b
      .prepare(
        `SELECT id FROM clones
          WHERE owner_id = ? AND deletion_state = 'active' AND deleted_at IS NULL`,
      )
      .bind(v_1badb6)
      .all<{ id: number }>()
  ).results;

  let v_64c9b8 = 0;
  let v_051394 = 0;
  for (const { id: v_6e0fd3 } of v_2461e1) {

    const v_820a60 = await v_a1651b
      .prepare(
        `SELECT cs.id, cs.target_user_id
           FROM clone_shares cs
           JOIN users u ON u.id = cs.target_user_id
          WHERE cs.clone_id = ?
            AND cs.status = 'accepted'
            AND cs.target_user_id IS NOT NULL
            AND cs.target_user_id != ?
            AND u.deleted_at IS NULL
            AND u.deletion_state = 'active'
          ORDER BY cs.created_at ASC, cs.id ASC
          LIMIT 1`,
      )
      .bind(v_6e0fd3, v_1badb6)
      .first<{ id: number; target_user_id: number }>();

    if (v_820a60) {
      await v_a1651b.batch([
        v_a1651b
          .prepare("UPDATE clones SET owner_id = ? WHERE id = ?")
          .bind(v_820a60.target_user_id, v_6e0fd3),
        v_a1651b
          .prepare(
            `UPDATE clones SET primary_editor_user_id = ?
              WHERE id = ? AND primary_editor_user_id = ?`,
          )
          .bind(v_820a60.target_user_id, v_6e0fd3, v_1badb6),
        v_a1651b.prepare("DELETE FROM clone_shares WHERE id = ?").bind(v_820a60.id),
      ]);
      v_051394 += 1;
    } else {
      await v_a1651b
        .prepare(
          `UPDATE clones
              SET deletion_state = 'soft_deleted',
                  soft_deleted_at = CURRENT_TIMESTAMP,
                  deleted_at = CURRENT_TIMESTAMP,
                  owner_cascade_deleted_at = CURRENT_TIMESTAMP
            WHERE id = ? AND deletion_state = 'active'`,
        )
        .bind(v_6e0fd3)
        .run();
      v_64c9b8 += 1;
    }
  }
  return { softDeleted: v_64c9b8, transferred: v_051394 };
}

v_dda4b9.delete("/me", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_43c42e = await v_b4f765(v_3f4e2e.env.DB, "user", v_43e90c, "id", v_43e90c);
  if (v_43c42e !== "ok" && v_43c42e !== "already_deleted") {
    v_d24e3e(v_43c42e); 
  }
  const v_d7b02d = v_43c42e === "already_deleted";

  const v_f891e6 = await v_f51850(v_3f4e2e.env.DB, v_43e90c);
  console.log(
    `[deletion.me] clones cascade: softDeleted=${v_f891e6.softDeleted} transferred=${v_f891e6.transferred}`,
  );

  const v_ab75ce = await v_3f4e2e.env.DB
    .prepare(`DELETE FROM user_follows WHERE follower_id = ? OR followee_id = ?`)
    .bind(v_43e90c, v_43e90c)
    .run();
  console.log(`[deletion.me] user_follows removed: ${v_ab75ce.meta?.changes ?? 0}`);

  try {
    const v_213c33 = await v_3f4e2e.env.DB
      .prepare(`SELECT xrun_member_id FROM users WHERE id = ?`)
      .bind(v_43e90c)
      .first<{ xrun_member_id: number | null }>();
    const v_88fe80 = v_213c33?.xrun_member_id ?? null;
    if (v_88fe80) {
      const { markAfterlifeDeletedOnXrun: v_a23589 } = await import("../lib/xrun");
      await v_a23589(v_3f4e2e.env, v_88fe80);
    }
  } catch (v_49263d) {
    console.warn("[deletion.me] xrun mark failed:", (v_49263d as Error).message);
  }

  try {
    const v_c690be = await v_344b9e(v_3f4e2e.env, v_43e90c);
    console.log(
      `[deletion.me] ontology purged: ont=${v_c690be.ontRows} person=${v_c690be.personRows} kv=${v_c690be.kvKeys}`,
    );
  } catch (v_49263d) {
    console.error(
      `[deletion.me] CRITICAL: ontology purge FAILED for user ${v_43e90c} — 재시도 필요: ${(v_49263d as Error).message}`,
    );
  }

  if (!v_d7b02d) {
    try {
      const v_d1b635 = await v_3f4e2e.env.DB
        .prepare(`SELECT email, name FROM users WHERE id = ?`)
        .bind(v_43e90c)
        .first<{ email: string | null; name: string | null }>();
      if (v_d1b635?.email) {
        const { sendMail: v_a71d8b } = await import("../lib/gmail");
        const v_8a1355 = v_d1b635.name || v_d1b635.email.split("@")[0] || "회원";
        await v_a71d8b(v_3f4e2e.env, {
          to: v_d1b635.email,
          subject: "[Afterlife] 탈퇴가 완료되었습니다",
          html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#111">
            <p>안녕하세요, ${v_8a1355} 님.</p>
            <p>Afterlife 탈퇴 요청이 정상적으로 처리되었습니다.</p>
            <p>계정과 관련된 클론·대화·팔로우 관계는 모두 정리되었으며,
            학습 데이터(음성·프롬프트)는 재사용 불가하도록 파기됩니다.</p>
            <p style="margin-top:24px;color:#666;font-size:13px">
            함께해 주셔서 감사했습니다. 언제든 다시 돌아오실 수 있습니다.<br/>
            문의: <a href="mailto:oth-staff@example.invalid">oth-staff@example.invalid</a>
            </p>
          </div>`,
        });
      }
    } catch (v_49263d) {
      console.warn("[deletion.me] farewell mail failed (ignored):", (v_49263d as Error).message);
    }
  }

  return v_3f4e2e.json({ ok: true, state: "soft_deleted", alreadyDeleted: v_d7b02d });
});

v_dda4b9.delete("/oth-path", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_a1651b
    .prepare("SELECT id, owner_id, deletion_state FROM clones WHERE id = ?")
    .bind(v_6e0fd3)
    .first<{ id: number; owner_id: number; deletion_state: string }>();
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  if (v_eb25ce.owner_id !== v_43e90c) throw new v_3ebe58("FORBIDDEN", "You do not own this clone.");
  if (v_eb25ce.deletion_state !== "active") throw new v_3ebe58("CONFLICT", "Clone is already deleted.");

  const v_820a60 = await v_a1651b
    .prepare(
      `SELECT cs.id, cs.target_user_id
         FROM clone_shares cs
         JOIN users u ON u.id = cs.target_user_id
        WHERE cs.clone_id = ?
          AND cs.status = 'accepted'
          AND cs.target_user_id IS NOT NULL
          AND cs.target_user_id != ?
          AND u.deleted_at IS NULL
        ORDER BY cs.created_at ASC, cs.id ASC
        LIMIT 1`,
    )
    .bind(v_6e0fd3, v_43e90c)
    .first<{ id: number; target_user_id: number }>();

  if (!v_820a60) {

    await v_a1651b
      .prepare(
        `UPDATE clones
            SET deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP,
                deleted_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
      )
      .bind(v_6e0fd3)
      .run();
    return v_3f4e2e.json({ ok: true, state: "soft_deleted", transferred: null });
  }

  await v_a1651b.batch([
    v_a1651b.prepare("UPDATE clones SET owner_id = ? WHERE id = ?").bind(v_820a60.target_user_id, v_6e0fd3),
    v_a1651b
      .prepare(
        `UPDATE clones SET primary_editor_user_id = ?
          WHERE id = ? AND primary_editor_user_id = ?`,
      )
      .bind(v_820a60.target_user_id, v_6e0fd3, v_43e90c),
    v_a1651b.prepare("DELETE FROM clone_shares WHERE id = ?").bind(v_820a60.id),
  ]);

  return v_3f4e2e.json({
    ok: true,
    state: "transferred",
    transferred: { newOwnerId: v_820a60.target_user_id },
  });
});

v_dda4b9.post("/oth-path", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_43c42e = await v_c8311e(v_3f4e2e.env.DB, "clone", v_6e0fd3, "owner_id", v_43e90c);
  v_7b6df3(v_43c42e);
  return v_3f4e2e.json({ ok: true, state: "active" });
});

v_dda4b9.delete("/messages/:id", v_6690d9, async (v_3f4e2e) => {
  const v_7f4466 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_7f4466) || v_7f4466 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid message id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_43c42e = await v_b4f765(v_3f4e2e.env.DB, "message", v_7f4466, "user_id", v_43e90c);
  v_d24e3e(v_43c42e);
  return v_3f4e2e.json({ ok: true, state: "soft_deleted" });
});

v_dda4b9.post("/messages/:id/restore", v_6690d9, async (v_3f4e2e) => {
  const v_7f4466 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_7f4466) || v_7f4466 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid message id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_43c42e = await v_c8311e(v_3f4e2e.env.DB, "message", v_7f4466, "user_id", v_43e90c);
  v_7b6df3(v_43c42e);
  return v_3f4e2e.json({ ok: true, state: "active" });
});
