

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_6690d9 } from "../middleware/auth";
import { v_3ebe58 } from "../lib/errors";
import { v_807b74, v_de391e, v_5f6369, v_1166ee } from "../lib/xrun";

export const v_a35f69 = new v_b7c41b<v_de0a25>();

v_a35f69.use("*", v_6690d9);

async function v_903cff(env: v_de0a25["Bindings"], v_43e90c): Promise<number | null> {
  const v_3ac7e7 = await v_c9c489.DB.prepare(
    `SELECT xrun_member_id FROM users WHERE id = ? AND deleted_at IS NULL`,
  )
    .bind(v_43e90c)
    .first<{ xrun_member_id: number | null }>();
  return v_3ac7e7?.xrun_member_id ?? null;
}

v_a35f69.get("/pin/status", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_660822 = await v_903cff(v_3f4e2e.env, v_43e90c);
  if (!v_660822) return v_3f4e2e.json({ linked: false, hasPin: false });
  const v_8f00b9 = await v_807b74(v_3f4e2e.env, v_660822);
  if (!v_8f00b9.ok) throw new v_3ebe58("UPSTREAM_FAILURE", v_8f00b9.reason ?? "xrun gateway error");
  return v_3f4e2e.json({ linked: true, hasPin: v_8f00b9.hasPin });
});

v_a35f69.post("/pin/verify", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_3f4e2e.req.json().catch(() => ({}) as Record<string, unknown>);
  const v_6bee94 = typeof v_4d33b2.pin === "string" ? v_4d33b2.pin : "";
  if (!/^\d{6}$/.test(v_6bee94)) {
    throw new v_3ebe58("VALIDATION_FAILED", "pin must be 6 digits");
  }
  const v_660822 = await v_903cff(v_3f4e2e.env, v_43e90c);
  if (!v_660822) throw new v_3ebe58("CONFLICT", "xrun account not linked");

  const v_8f00b9 = await v_de391e(v_3f4e2e.env, v_660822, v_6bee94);
  if (!v_8f00b9.ok) throw new v_3ebe58("UPSTREAM_FAILURE", v_8f00b9.reason ?? "xrun gateway error");
  return v_3f4e2e.json({ match: v_8f00b9.match, hasPin: v_8f00b9.hasPin });
});

v_a35f69.get("/balance", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_660822 = await v_903cff(v_3f4e2e.env, v_43e90c);
  if (!v_660822) {
    return v_3f4e2e.json({ linked: false, balances: [], xrun: null, ad: null });
  }
  const v_8f00b9 = await v_5f6369(v_3f4e2e.env, v_660822);
  if (!v_8f00b9.ok) {
    throw new v_3ebe58("UPSTREAM_FAILURE", v_8f00b9.reason ?? "xrun gateway error");
  }

  const v_7f8c56 = v_8f00b9.balances.filter(
    (v_148ff6) => v_148ff6.currency != null && Number.isFinite(Number(v_148ff6.currency)),
  );

  if (v_8f00b9.balances.length > 0 && v_7f8c56.length === 0) {
    console.warn(
      "[payments.balance] gateway returned only null-currency rows",
      "member=", v_660822,
      "raw=", JSON.stringify(v_8f00b9.balances),
    );
  }

  const v_14e183 = (v_a832b3): number | null => {
    const v_3ac7e7 = v_7f8c56.find((v_148ff6) => Number(v_148ff6.currency) === v_a832b3);
    if (!v_3ac7e7) return null;
    const v_f4e98d = Number(v_3ac7e7.amount);
    return Number.isFinite(v_f4e98d) ? v_f4e98d : null;
  };

  const v_5f9081 = await v_1166ee(v_3f4e2e.env, v_660822).catch(() => null);
  const v_4c90cc = v_5f9081 ?? v_14e183(18);
  return v_3f4e2e.json({
    linked: true,
    balances: v_7f8c56.map((v_148ff6) => ({
      currency: Number(v_148ff6.currency),
      symbol: v_148ff6.symbol,

      amount: (Number(v_148ff6.currency) === 18 && v_5f9081 != null) ? v_5f9081.toFixed(8) : v_148ff6.amount,
      address: v_148ff6.address,
    })),
    xrun: v_4c90cc,
    ad: v_14e183(19),

    gatewayWalletReady: v_7f8c56.length > 0,
  });
});
