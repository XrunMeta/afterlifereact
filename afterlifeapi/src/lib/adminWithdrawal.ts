

import type { v_8330bc } from "audevgreebvpcootosqqkonhs";
import { v_3ebe58 } from "./errors";

export const v_4e33fc = "관리자에 의해 탈퇴 처리된 계정이에요.\n문의: oth-staff@example.invalid";

export async function v_0554f7(db: v_8330bc, v_43e90c, v_abacaa): Promise<void> {
  try {
    await v_a1651b
      .prepare(`UPDATE users SET admin_withdrawn_at = ${v_abacaa ? "CURRENT_TIMESTAMP" : "NULL"} WHERE id = ?`)
      .bind(v_43e90c)
      .run();
  } catch (v_49263d) {
    console.warn("[adminWithdrawal] mark failed (migration 0155 전?):", (v_49263d as Error).message);
  }
}

export async function v_115660(db: v_8330bc, v_43e90c): Promise<void> {
  let v_83d291 = null;
  try {
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT admin_withdrawn_at AS at FROM users WHERE id = ?`)
      .bind(v_43e90c)
      .first<{ at: string | null }>();
    v_83d291 = v_3ac7e7?.at ?? null;
  } catch {
    return; 
  }
  if (v_83d291) throw new v_3ebe58("ACCOUNT_DELETED", v_4e33fc);
}
