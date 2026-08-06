

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

const SIGNUP_FREE_CREDITS_KEY = "signup.free_credits";
export const SIGNUP_FREE_CREDITS_DEFAULT = 3000;
const SIGNUP_FREE_CREDITS_MAX = 600000; 

export async function getSignupFreeCredits(env: Bindings): Promise<number> {
  try {
    const row = await env.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(SIGNUP_FREE_CREDITS_KEY)
      .first<{ value: string }>();
    if (!row) return SIGNUP_FREE_CREDITS_DEFAULT;
    const n = Number(row.value);
    return Number.isFinite(n) && n >= 0 && n <= SIGNUP_FREE_CREDITS_MAX
      ? Math.floor(n)
      : SIGNUP_FREE_CREDITS_DEFAULT;
  } catch {
    return SIGNUP_FREE_CREDITS_DEFAULT;
  }
}

export async function setSignupFreeCredits(env: Bindings, credits: number): Promise<void> {
  await env.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(SIGNUP_FREE_CREDITS_KEY, String(Math.floor(credits)))
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

const GIFT_CATALOG_KEY = "gift.catalog";
const GIFT_CATALOG_DEFAULT: GiftCatalogItem[] = [
  { id: "gift-starcandy", name: "별사탕", emoji: "🍬", price: 10 },
  { id: "gift-bouquet",   name: "꽃다발", emoji: "💐", price: 10 },
  { id: "gift-like",      name: "좋아요", emoji: "👍", price: 10 },
  { id: "gift-heartbeat", name: "두근두근", emoji: "💓", price: 10 },
];

export interface GiftCatalogItem {
  id: string;
  name: string;
  emoji: string;

  price: number;

  imageUrl?: string;

  xrunPrice?: number;

  svgaUrl?: string;
}

export async function getGiftCatalog(env: Bindings): Promise<GiftCatalogItem[]> {
  try {
    const row = await env.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(GIFT_CATALOG_KEY)
      .first<{ value: string }>();
    if (!row?.value) return GIFT_CATALOG_DEFAULT;
    const parsed = JSON.parse(row.value) as unknown;
    if (!Array.isArray(parsed)) return GIFT_CATALOG_DEFAULT;
    const items: GiftCatalogItem[] = [];
    for (const it of parsed) {
      if (
        it && typeof it === "object" &&
        typeof (it as GiftCatalogItem).id === "string" &&
        typeof (it as GiftCatalogItem).name === "string" &&
        typeof (it as GiftCatalogItem).emoji === "string" &&
        typeof (it as GiftCatalogItem).price === "number"
      ) {
        const raw = it as GiftCatalogItem;
        const item: GiftCatalogItem = {
          id: raw.id,
          name: raw.name,
          emoji: raw.emoji,
          price: raw.price,
        };
        if (typeof raw.imageUrl === "string" && raw.imageUrl.length > 0) {
          item.imageUrl = raw.imageUrl;
        }

        if (typeof raw.xrunPrice === "number" && Number.isFinite(raw.xrunPrice) && raw.xrunPrice >= 0) {
          item.xrunPrice = raw.xrunPrice;
        }

        if (typeof raw.svgaUrl === "string" && raw.svgaUrl.length > 0 && raw.svgaUrl.length <= 500) {
          item.svgaUrl = raw.svgaUrl;
        }
        items.push(item);
      }
    }
    return items.length > 0 ? items : GIFT_CATALOG_DEFAULT;
  } catch {
    return GIFT_CATALOG_DEFAULT;
  }
}

export async function setGiftCatalog(env: Bindings, items: GiftCatalogItem[]): Promise<void> {
  await env.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(GIFT_CATALOG_KEY, JSON.stringify(items))
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

const GOOGLE_IOS_KEY = "auth.google_enabled_ios";
const GOOGLE_ANDROID_KEY = "auth.google_enabled_android";
const GOOGLE_IOS_DEFAULT = true;
const GOOGLE_ANDROID_DEFAULT = true;

export interface GoogleEnabled {
  ios: boolean;
  android: boolean;
  updatedAt: number;
}

export function parseEnabledFlag(
  v: string | null | undefined,
  fallback: boolean,
): boolean {
  if (v === null || v === undefined) return fallback;
  return v === "1";
}

export async function getGoogleEnabled(env: Bindings): Promise<GoogleEnabled> {
  try {
    const res = await env.DB.prepare(
      `SELECT key, value, updated_at FROM app_config WHERE key IN (?, ?)`,
    )
      .bind(GOOGLE_IOS_KEY, GOOGLE_ANDROID_KEY)
      .all<{ key: string; value: string; updated_at: number }>();

    const rows = res.results ?? [];
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const updatedAt = rows.reduce((m, r) => Math.max(m, r.updated_at ?? 0), 0);

    return {
      ios: parseEnabledFlag(
        map.get(GOOGLE_IOS_KEY) ?? env.AUTH_GOOGLE_ENABLED_IOS,
        GOOGLE_IOS_DEFAULT,
      ),
      android: parseEnabledFlag(
        map.get(GOOGLE_ANDROID_KEY) ?? env.AUTH_GOOGLE_ENABLED_ANDROID,
        GOOGLE_ANDROID_DEFAULT,
      ),
      updatedAt,
    };
  } catch {

    return {
      ios: parseEnabledFlag(env.AUTH_GOOGLE_ENABLED_IOS, GOOGLE_IOS_DEFAULT),
      android: parseEnabledFlag(env.AUTH_GOOGLE_ENABLED_ANDROID, GOOGLE_ANDROID_DEFAULT),
      updatedAt: 0,
    };
  }
}

const SYSTEM_FUNCTION_KEYS = {
  serverStatus: "system.server_status",
  minVersionIos: "system.min_version_ios",
  minVersionAndroid: "system.min_version_android",
} as const;

export type ServerStatus = "running" | "maintenance" | "stopped";

export interface SystemFunctionConfig {
  serverStatus: ServerStatus;
  minVersionIos: string;
  minVersionAndroid: string;
  updatedAt: number;
}

const SYSTEM_FUNCTION_DEFAULTS: Omit<SystemFunctionConfig, "updatedAt"> = {
  serverStatus: "running",
  minVersionIos: "",
  minVersionAndroid: "",
};

function parseServerStatus(v: string | null | undefined): ServerStatus {
  if (v === "running" || v === "maintenance" || v === "stopped") return v;
  return SYSTEM_FUNCTION_DEFAULTS.serverStatus;
}

export function isValidSemver(v: string): boolean {
  if (v === "") return true;
  return /^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(v);
}

export async function getSystemFunctionConfig(env: Bindings): Promise<SystemFunctionConfig> {
  try {
    const res = await env.DB
      .prepare(
        `SELECT key, value, updated_at FROM app_config WHERE key IN (?, ?, ?)`,
      )
      .bind(
        SYSTEM_FUNCTION_KEYS.serverStatus,
        SYSTEM_FUNCTION_KEYS.minVersionIos,
        SYSTEM_FUNCTION_KEYS.minVersionAndroid,
      )
      .all<{ key: string; value: string; updated_at: number }>();
    const rows = res.results ?? [];
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const updatedAt = rows.reduce((m, r) => Math.max(m, r.updated_at ?? 0), 0);
    return {
      serverStatus: parseServerStatus(map.get(SYSTEM_FUNCTION_KEYS.serverStatus)),
      minVersionIos: map.get(SYSTEM_FUNCTION_KEYS.minVersionIos) ?? SYSTEM_FUNCTION_DEFAULTS.minVersionIos,
      minVersionAndroid:
        map.get(SYSTEM_FUNCTION_KEYS.minVersionAndroid) ?? SYSTEM_FUNCTION_DEFAULTS.minVersionAndroid,
      updatedAt,
    };
  } catch {
    return { ...SYSTEM_FUNCTION_DEFAULTS, updatedAt: 0 };
  }
}

export async function setSystemFunctionConfig(
  env: Bindings,
  patch: Partial<Omit<SystemFunctionConfig, "updatedAt">>,
): Promise<SystemFunctionConfig> {
  const entries: Array<[string, string]> = [];
  if (patch.serverStatus !== undefined) {
    entries.push([SYSTEM_FUNCTION_KEYS.serverStatus, patch.serverStatus]);
  }
  if (patch.minVersionIos !== undefined) {
    entries.push([SYSTEM_FUNCTION_KEYS.minVersionIos, patch.minVersionIos]);
  }
  if (patch.minVersionAndroid !== undefined) {
    entries.push([SYSTEM_FUNCTION_KEYS.minVersionAndroid, patch.minVersionAndroid]);
  }
  for (const [k, v] of entries) {
    await env.DB
      .prepare(
        `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
      )
      .bind(k, v)
      .run();
  }
  return getSystemFunctionConfig(env);
}
