

import type { v_273a0c } from "./env";

const v_f419a5 = "persona.paid_price_xrun";
const v_ca051a = 0.001;

export async function v_916830(env: v_273a0c): Promise<number> {
  try {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(v_f419a5)
      .first<{ value: string }>();
    if (!v_3ac7e7) return v_ca051a;
    const v_f4e98d = Number(v_3ac7e7.value);
    return Number.isFinite(v_f4e98d) && v_f4e98d >= 0 ? v_f4e98d : v_ca051a;
  } catch {
    return v_ca051a;
  }
}

export async function v_5d3436(env: v_273a0c, v_6bbb57): Promise<void> {
  await v_c9c489.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(v_f419a5, String(v_6bbb57))
    .run();
}

const v_ca1841 = "knowledge.interpret_extra_rules";

export async function v_399bbb(env: v_273a0c): Promise<string> {
  try {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(v_ca1841)
      .first<{ value: string }>();
    return v_3ac7e7?.value ?? "";
  } catch {
    return "";
  }
}

export async function v_6e82f0(env: v_273a0c, v_ddf1dc): Promise<void> {
  await v_c9c489.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(v_ca1841, v_ddf1dc)
    .run();
}
