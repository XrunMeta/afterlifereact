import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { requireIdempotencyKey } from "../middleware/idempotency";
import { grant } from "../lib/credits";

export const credits = new Hono<AppEnv>();

credits.get("/health", (c) => c.json({ ok: true, module: "credits" }));

credits.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const db = c.env.DB;

  const u = await db
    .prepare(
      `SELECT credits, balance_checkpoint, last_ledger_id, checkpoint_at
         FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(userId)
    .first<{
      credits: number;
      balance_checkpoint: number;
      last_ledger_id: number;
      checkpoint_at: string | null;
    }>();
  if (!u) throw new APIError("NOT_FOUND", "User not found.");

  const recent = (
    await db
      .prepare(
        `SELECT id, amount, type, ref_id, created_at
           FROM credit_ledgers
          WHERE user_id = ?
          ORDER BY id DESC
          LIMIT 10`,
      )
      .bind(userId)
      .all<{
        id: number;
        amount: number;
        type: string;
        ref_id: string | null;
        created_at: string;
      }>()
  ).results;

  return c.json({
    credits: u.credits,
    balanceCheckpoint: u.balance_checkpoint,
    lastLedgerId: u.last_ledger_id,
    checkpointAt: u.checkpoint_at,
    recentLedgers: recent.map((r) => ({
      id: r.id,
      amount: r.amount,
      type: r.type,
      refId: r.ref_id,
      createdAt: r.created_at,
    })),
  });
});

const ledgerQuery = z.object({
  after_id: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  type: z
    .enum(["charge_inapp", "charge_xrun", "gift", "clone_create", "message_send", "refund", "admin_grant"])
    .optional(),
});

credits.get("/ledgers", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const parsed = ledgerQuery.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams.entries()),
  );
  if (!parsed.success) {
    throw new APIError("VALIDATION_FAILED", "Query invalid.", parsed.error.issues);
  }
  const { after_id, limit, type } = parsed.data;

  const where: string[] = [`user_id = ?`];
  const binds: unknown[] = [userId];
  if (after_id) {
    where.push(`id < ?`);
    binds.push(after_id);
  }
  if (type) {
    where.push(`type = ?`);
    binds.push(type);
  }
  const rows = (
    await c.env.DB
      .prepare(
        `SELECT id, amount, type, ref_id, created_at
           FROM credit_ledgers
          WHERE ${where.join(" AND ")}
          ORDER BY id DESC
          LIMIT ?`,
      )
      .bind(...binds, limit + 1)
      .all<{
        id: number;
        amount: number;
        type: string;
        ref_id: string | null;
        created_at: string;
      }>()
  ).results;

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return c.json({
    items: page.map((r) => ({
      id: r.id,
      amount: r.amount,
      type: r.type,
      refId: r.ref_id,
      createdAt: r.created_at,
    })),
    nextAfterId: hasMore && page.length > 0 ? page[page.length - 1]!.id : null,
  });
});

const PACKAGES: Record<string, { credits: number; type: "charge_inapp" | "charge_xrun" }> = {
  starter: { credits: 10, type: "charge_inapp" },
  regular: { credits: 30, type: "charge_inapp" },
  plus: { credits: 105, type: "charge_inapp" }, 
  pro: { credits: 575, type: "charge_inapp" }, 
};

const chargeSchema = z.object({
  package_id: z.enum(["starter", "regular", "plus", "pro"]),
  payment_provider: z
    .enum(["mock_beta", "xrun_wallet", "iap_google", "iap_apple"])
    .default("mock_beta"),
  payment_token: z.string().max(2000).optional(),
});

credits.post(
  "/charge",
  requireAuth,
  requireIdempotencyKey("credits.charge"),
  async (c) => {
    const body = await parseJson(c, chargeSchema);
    const userId = c.get("userId")!;
    const pkg = PACKAGES[body.package_id]!;

    if (body.payment_provider !== "mock_beta") {
      throw new APIError(
        "UPSTREAM_FAILURE",
        `Payment provider ${body.payment_provider} not yet integrated.`,
      );
    }

    const idemKey = c.req.header("X-Idempotency-Key")!;
    await grant(c, {
      userId,
      amount: pkg.credits,
      type: pkg.type,
      refId: body.package_id,
      idempotencyKey: idemKey,
    });

    const user = await c.env.DB
      .prepare(`SELECT credits FROM users WHERE id = ?`)
      .bind(userId)
      .first<{ credits: number }>();

    return c.json({
      ok: true,
      packageId: body.package_id,
      credited: pkg.credits,
      credits: user?.credits ?? 0,
    });
  },
);
