

import type { Bindings } from "./env";

const PERSONA_PRICE_KEY = "persona.paid_price_xrun";
const PERSONA_PRICE_DEFAULT = 0.001;

export async function getPersonaPriceXrun(env: Bindings): Promise<number> {
  try {
    const row = await env.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(PERSONA_PRICE_KEY)
      .first<{ value: string }>();
    if (!row) return PERSONA_PRICE_DEFAULT;
    const n = Number(row.value);
    return Number.isFinite(n) && n >= 0 ? n : PERSONA_PRICE_DEFAULT;
  } catch {
    return PERSONA_PRICE_DEFAULT;
  }
}

export async function setPersonaPriceXrun(env: Bindings, price: number): Promise<void> {
  await env.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(PERSONA_PRICE_KEY, String(price))
    .run();
}
