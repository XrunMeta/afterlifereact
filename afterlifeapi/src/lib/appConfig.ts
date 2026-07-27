

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

const v_3a3341 = "gift.catalog";
const v_555ada = [
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
}

export async function v_0edc13(env: v_273a0c): Promise<GiftCatalogItem[]> {
  try {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(v_3a3341)
      .first<{ value: string }>();
    if (!v_3ac7e7?.value) return v_555ada;
    const v_8decf8 = JSON.parse(v_3ac7e7.value) as unknown;
    if (!Array.isArray(v_8decf8)) return v_555ada;
    const v_4622b9 = [];
    for (const v_23805a of v_8decf8) {
      if (
        v_23805a && typeof v_23805a === "object" &&
        typeof (v_23805a as GiftCatalogItem).id === "string" &&
        typeof (v_23805a as GiftCatalogItem).name === "string" &&
        typeof (v_23805a as GiftCatalogItem).emoji === "string" &&
        typeof (v_23805a as GiftCatalogItem).price === "number"
      ) {
        v_4622b9.push({
          id: (v_23805a as GiftCatalogItem).id,
          name: (v_23805a as GiftCatalogItem).name,
          emoji: (v_23805a as GiftCatalogItem).emoji,
          price: (v_23805a as GiftCatalogItem).price,
        });
      }
    }
    return v_4622b9.length > 0 ? v_4622b9 : v_555ada;
  } catch {
    return v_555ada;
  }
}

export async function v_9459da(env: v_273a0c, v_4622b9): Promise<void> {
  await v_c9c489.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(v_3a3341, JSON.stringify(v_4622b9))
    .run();
}

export async function v_e35611(env: v_273a0c): Promise<string> {
  const v_479f05 = await v_399bbb(v_c9c489);
  if (!v_479f05) return "";
  const v_2f361a = v_479f05.trim();
  if (!(v_2f361a.startsWith("[") || v_2f361a.startsWith("{"))) return v_479f05;
  try {
    const v_8decf8 = JSON.parse(v_2f361a) as unknown;
    if (!Array.isArray(v_8decf8)) return v_479f05;
    const v_1412c1 = [];
    for (const v_8c0b26 of v_8decf8) {
      if (typeof v_8c0b26 === "string") {
        const v_fd5f43 = v_8c0b26.trim();
        if (v_fd5f43) v_1412c1.push(v_fd5f43);
        continue;
      }
      if (v_8c0b26 && typeof v_8c0b26 === "object") {
        const v_4d33b2 = typeof (v_8c0b26 as { body?: unknown }).body === "string"
          ? ((v_8c0b26 as { body: string }).body).trim()
          : "";
        if (!v_4d33b2) continue;
        const v_9f1622 = typeof (v_8c0b26 as { title?: unknown }).title === "string"
          ? ((v_8c0b26 as { title: string }).title).trim()
          : "";
        v_1412c1.push(v_9f1622 ? `[${v_9f1622}]\n${v_4d33b2}` : v_4d33b2);
      }
    }
    return v_1412c1.join("\n\n");
  } catch {
    return v_479f05;
  }
}
