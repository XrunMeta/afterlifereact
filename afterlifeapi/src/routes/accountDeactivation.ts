

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_96aa7f } from "../lib/password";
import { v_937e23 } from "../lib/xrun";
import { v_b78f7e, v_656e8b } from "../lib/otp";
import { v_1186b8 } from "../lib/deactivation";
import { v_74defc } from "../lib/logger";

export const v_344cd4 = new v_b7c41b<v_de0a25>();

async function v_3fb498(c: { env: v_de0a25["Bindings"] }, v_43e90c) {
  const v_b32680 = await v_3f4e2e.env.DB
    .prepare(`SELECT id, email, password_hash, deactivated_at, xrun_member_id FROM users WHERE id = ? AND deleted_at IS NULL`)
    .bind(v_43e90c)
    .first<{ id: number; email: string; password_hash: string; deactivated_at: string | null; xrun_member_id: number | null }>();
  if (!v_b32680) throw new v_3ebe58("NOT_FOUND", "User not found.");
  return v_b32680;
}

v_344cd4.post("/me/deactivate/request-code", v_6690d9, async (v_3f4e2e) => {
  const v_b32680 = await v_3fb498(v_3f4e2e, v_3f4e2e.get("userId")!);
  await v_b78f7e(v_3f4e2e.env, v_b32680.email);
  return v_3f4e2e.json({ ok: true, email: v_b32680.email });
});

const v_333879 = v_1f4ea7
  .object({
    password: v_1f4ea7.string().min(1).max(200).optional(),
    verificationCode: v_1f4ea7.string().regex(/^\d{6}$/).optional(),
  })
  .refine((v_148ff6) => !!v_148ff6.password || !!v_148ff6.verificationCode, { message: "password or verificationCode required" });

v_344cd4.post("/me/deactivate", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_333879);
  const v_b32680 = await v_3fb498(v_3f4e2e, v_43e90c);

  if (v_4d33b2.password) {

    const v_3ed4c3 =
      (await v_96aa7f(v_4d33b2.password, v_b32680.password_hash)) ||
      (!!v_b32680.xrun_member_id && (await v_937e23(v_3f4e2e.env, v_b32680.email, v_4d33b2.password)).found);

    if (!v_3ed4c3) throw new v_3ebe58("VALIDATION_FAILED", "비밀번호가 맞지 않아요.");
  } else {
    await v_656e8b(v_3f4e2e.env, v_b32680.email, v_4d33b2.verificationCode!);
  }

  await v_1186b8(v_3f4e2e.env, v_43e90c);
  if (!v_b32680.deactivated_at) {
    await v_3f4e2e.env.DB.batch([
      v_3f4e2e.env.DB.prepare(`UPDATE users SET deactivated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(v_43e90c),

      v_3f4e2e.env.DB.prepare(`UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).bind(v_43e90c),
    ]);
  }
  await v_74defc(v_3f4e2e, { userId: v_43e90c, action: "account.deactivate", details: { via: v_4d33b2.password ? "password" : "email_code" } });
  return v_3f4e2e.json({ ok: true });
});
