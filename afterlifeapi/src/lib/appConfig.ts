

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

const KNOWLEDGE_INTERPRET_RULES_KEY = "knowledge.interpret_extra_rules";

export async function getKnowledgeInterpretRules(env: Bindings): Promise<string> {
  try {
    const row = await env.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(KNOWLEDGE_INTERPRET_RULES_KEY)
      .first<{ value: string }>();
    return row?.value ?? "";
  } catch {
    return "";
  }
}

export async function setKnowledgeInterpretRules(env: Bindings, rules: string): Promise<void> {
  await env.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(KNOWLEDGE_INTERPRET_RULES_KEY, rules)
    .run();
}

export async function getKnowledgeInterpretRulesText(env: Bindings): Promise<string> {
  const raw = await getKnowledgeInterpretRules(env);
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!(trimmed.startsWith("[") || trimmed.startsWith("{"))) return raw;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return raw;
    const blocks: string[] = [];
    for (const item of parsed) {
      if (typeof item === "string") {
        const s = item.trim();
        if (s) blocks.push(s);
        continue;
      }
      if (item && typeof item === "object") {
        const body = typeof (item as { body?: unknown }).body === "string"
          ? ((item as { body: string }).body).trim()
          : "";
        if (!body) continue;
        const title = typeof (item as { title?: unknown }).title === "string"
          ? ((item as { title: string }).title).trim()
          : "";
        blocks.push(title ? `[${title}]\n${body}` : body);
      }
    }
    return blocks.join("\n\n");
  } catch {
    return raw;
  }
}
