

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

const v_c00b46 = "signup.free_credits";
export const v_d75566 = 3000;
const v_d8e9e2 = 600000; 

export async function v_52acfb(env: v_273a0c): Promise<number> {
  try {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(v_c00b46)
      .first<{ value: string }>();
    if (!v_3ac7e7) return v_d75566;
    const v_f4e98d = Number(v_3ac7e7.value);
    return Number.isFinite(v_f4e98d) && v_f4e98d >= 0 && v_f4e98d <= v_d8e9e2
      ? Math.floor(v_f4e98d)
      : v_d75566;
  } catch {
    return v_d75566;
  }
}

export async function v_b61290(env: v_273a0c, v_e2c945): Promise<void> {
  await v_c9c489.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(v_c00b46, String(Math.floor(v_e2c945)))
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

  imageUrl?: string;

  xrunPrice?: number;

  svgaUrl?: string;

  names?: Partial<Record<GiftNameLang, string>>;
}

export const v_4cb9e1 = ["en", "ja", "zh-CN", "id"] as const;
export type GiftNameLang = (typeof v_4cb9e1)[number];

export function v_8d6dec(v_479f05): GiftCatalogItem["names"] {
  if (!v_479f05 || typeof v_479f05 !== "object") return undefined;
  const v_8d4337 = {};
  for (const v_5254bf of v_4cb9e1) {
    const v_81e2ef = (v_479f05 as Record<string, unknown>)[v_5254bf];
    if (typeof v_81e2ef === "string" && v_81e2ef.trim() && v_81e2ef.trim().length <= 80) v_8d4337[v_5254bf] = v_81e2ef.trim();
  }
  return Object.keys(v_8d4337).length > 0 ? v_8d4337 : undefined;
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
        const v_479f05 = v_23805a as GiftCatalogItem;
        const v_8c0b26 = {
          id: v_479f05.id,
          name: v_479f05.name,
          emoji: v_479f05.emoji,
          price: v_479f05.price,
        };
        if (typeof v_479f05.imageUrl === "string" && v_479f05.imageUrl.length > 0) {
          v_8c0b26.imageUrl = v_479f05.imageUrl;
        }

        if (typeof v_479f05.xrunPrice === "number" && Number.isFinite(v_479f05.xrunPrice) && v_479f05.xrunPrice >= 0) {
          v_8c0b26.xrunPrice = v_479f05.xrunPrice;
        }

        if (typeof v_479f05.svgaUrl === "string" && v_479f05.svgaUrl.length > 0 && v_479f05.svgaUrl.length <= 500) {
          v_8c0b26.svgaUrl = v_479f05.svgaUrl;
        }
        const v_77b1ac = v_8d6dec(v_479f05.names);
        if (v_77b1ac) v_8c0b26.names = v_77b1ac;
        v_4622b9.push(v_8c0b26);
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

const v_72d058 = "auth.google_enabled_ios";
const v_250179 = "auth.google_enabled_android";
const v_4517ff = true;
const v_c438fb = true;

export interface GoogleEnabled {
  ios: boolean;
  android: boolean;
  updatedAt: number;
}

export function v_1ded13(
  v_81e2ef,
  v_0debf4,
): boolean {
  if (v_81e2ef === null || v_81e2ef === undefined) return v_0debf4;
  return v_81e2ef === "1";
}

export async function v_508dab(env: v_273a0c): Promise<GoogleEnabled> {
  try {
    const v_8f00b9 = await v_c9c489.DB.prepare(
      `SELECT key, value, updated_at FROM app_config WHERE key IN (?, ?)`,
    )
      .bind(v_72d058, v_250179)
      .all<{ key: string; value: string; updated_at: number }>();

    const v_18b8bf = v_8f00b9.results ?? [];
    const v_8dcb51 = new Map(v_18b8bf.map((v_cb35cb) => [v_cb35cb.key, v_cb35cb.value]));
    const v_3eee66 = v_18b8bf.reduce((v_35f85c, v_cb35cb) => Math.max(v_35f85c, v_cb35cb.updated_at ?? 0), 0);

    return {
      ios: v_1ded13(
        v_8dcb51.get(v_72d058) ?? v_c9c489.AUTH_GOOGLE_ENABLED_IOS,
        v_4517ff,
      ),
      android: v_1ded13(
        v_8dcb51.get(v_250179) ?? v_c9c489.AUTH_GOOGLE_ENABLED_ANDROID,
        v_c438fb,
      ),
      updatedAt: v_3eee66,
    };
  } catch {

    return {
      ios: v_1ded13(v_c9c489.AUTH_GOOGLE_ENABLED_IOS, v_4517ff),
      android: v_1ded13(v_c9c489.AUTH_GOOGLE_ENABLED_ANDROID, v_c438fb),
      updatedAt: 0,
    };
  }
}

const v_efcd03 = {
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

const v_f9522f = {
  serverStatus: "running",
  minVersionIos: "",
  minVersionAndroid: "",
};

function v_9423bc(v_81e2ef): ServerStatus {
  if (v_81e2ef === "running" || v_81e2ef === "maintenance" || v_81e2ef === "stopped") return v_81e2ef;
  return v_f9522f.serverStatus;
}

export function v_1f7eef(v_81e2ef): boolean {
  if (v_81e2ef === "") return true;
  return /^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(v_81e2ef);
}

export async function v_dc0a0b(env: v_273a0c): Promise<SystemFunctionConfig> {
  try {
    const v_8f00b9 = await v_c9c489.DB
      .prepare(
        `SELECT key, value, updated_at FROM app_config WHERE key IN (?, ?, ?)`,
      )
      .bind(
        v_efcd03.serverStatus,
        v_efcd03.minVersionIos,
        v_efcd03.minVersionAndroid,
      )
      .all<{ key: string; value: string; updated_at: number }>();
    const v_18b8bf = v_8f00b9.results ?? [];
    const v_8dcb51 = new Map(v_18b8bf.map((v_cb35cb) => [v_cb35cb.key, v_cb35cb.value]));
    const v_3eee66 = v_18b8bf.reduce((v_35f85c, v_cb35cb) => Math.max(v_35f85c, v_cb35cb.updated_at ?? 0), 0);
    return {
      serverStatus: v_9423bc(v_8dcb51.get(v_efcd03.serverStatus)),
      minVersionIos: v_8dcb51.get(v_efcd03.minVersionIos) ?? v_f9522f.minVersionIos,
      minVersionAndroid:
        v_8dcb51.get(v_efcd03.minVersionAndroid) ?? v_f9522f.minVersionAndroid,
      updatedAt: v_3eee66,
    };
  } catch {
    return { ...v_f9522f, updatedAt: 0 };
  }
}

export async function v_88bb3b(
  env: v_273a0c,
  v_17dc8a,
): Promise<SystemFunctionConfig> {
  const v_1e6eca = [];
  if (v_17dc8a.serverStatus !== undefined) {
    v_1e6eca.push([v_efcd03.serverStatus, v_17dc8a.serverStatus]);
  }
  if (v_17dc8a.minVersionIos !== undefined) {
    v_1e6eca.push([v_efcd03.minVersionIos, v_17dc8a.minVersionIos]);
  }
  if (v_17dc8a.minVersionAndroid !== undefined) {
    v_1e6eca.push([v_efcd03.minVersionAndroid, v_17dc8a.minVersionAndroid]);
  }
  for (const [v_0eb677, v_81e2ef] of v_1e6eca) {
    await v_c9c489.DB
      .prepare(
        `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
      )
      .bind(v_0eb677, v_81e2ef)
      .run();
  }
  return v_dc0a0b(v_c9c489);
}

const v_76434b = "ad.messages";
const v_9aa6be = 500; 
export interface AdMessages {
  pre: string;
  post: string;
  toast: string;
}
export const v_71229a = {
  pre: "{userName}줄 꽃 좀 따올게! 영상 보고 있으면 금방 다녀올게 🌸",
  post: "기다려줘서 고마워! 꽃 선물 짠 🌸",
  toast: "{cloneName}에게 꽃을 받았습니다 🌸",
};

export async function v_99e8be(env: v_273a0c): Promise<AdMessages> {
  try {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(v_76434b)
      .first<{ value: string }>();
    if (!v_3ac7e7) return v_71229a;
    const v_8decf8 = JSON.parse(v_3ac7e7.value) as unknown;
    if (!v_8decf8 || typeof v_8decf8 !== "object") return v_71229a;
    const v_e2a85c = v_8decf8 as Partial<AdMessages>;
    return {
      pre: typeof v_e2a85c.pre === "string" && v_e2a85c.pre.length > 0 ? v_e2a85c.pre : v_71229a.pre,
      post: typeof v_e2a85c.post === "string" && v_e2a85c.post.length > 0 ? v_e2a85c.post : v_71229a.post,
      toast: typeof v_e2a85c.toast === "string" && v_e2a85c.toast.length > 0 ? v_e2a85c.toast : v_71229a.toast,
    };
  } catch {
    return v_71229a;
  }
}

export async function v_824b75(
  env: v_273a0c,
  v_17dc8a,
): Promise<AdMessages> {
  const v_275ccd = await v_99e8be(v_c9c489);
  const v_a448ad = {
    pre: typeof v_17dc8a.pre === "string" ? v_17dc8a.pre : v_275ccd.pre,
    post: typeof v_17dc8a.post === "string" ? v_17dc8a.post : v_275ccd.post,
    toast: typeof v_17dc8a.toast === "string" ? v_17dc8a.toast : v_275ccd.toast,
  };

  for (const [v_0eb677, v_81e2ef] of Object.entries(v_a448ad)) {
    if (v_81e2ef.length === 0) throw new Error(`ad messages ${v_0eb677} must be non-empty`);
    if (v_81e2ef.length > v_9aa6be) {
      throw new Error(`ad messages ${v_0eb677} must be ≤ ${v_9aa6be} chars`);
    }
  }
  await v_c9c489.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(v_76434b, JSON.stringify(v_a448ad))
    .run();
  return v_a448ad;
}

const v_b99c96 = "ad.cadence";
const v_c7c40c = 1000; 
export interface AdCadence {
  firstRound: number;
  interval: number;
}
export const v_599a4b = { firstRound: 11, interval: 5 };

function v_bf244c(v_e2a85c): AdCadence {
  const v_e84077 = Number(v_e2a85c?.firstRound);
  const v_f9f313 = Number(v_e2a85c?.interval);
  return {
    firstRound:
      Number.isInteger(v_e84077) && v_e84077 >= 1 && v_e84077 <= v_c7c40c ? v_e84077 : v_599a4b.firstRound,
    interval:
      Number.isInteger(v_f9f313) && v_f9f313 >= 1 && v_f9f313 <= v_c7c40c ? v_f9f313 : v_599a4b.interval,
  };
}

export async function v_4bc1db(env: v_273a0c): Promise<AdCadence> {
  try {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(v_b99c96)
      .first<{ value: string }>();
    if (!v_3ac7e7) return v_599a4b;
    const v_8decf8 = JSON.parse(v_3ac7e7.value) as unknown;
    if (!v_8decf8 || typeof v_8decf8 !== "object") return v_599a4b;
    return v_bf244c(v_8decf8 as Partial<AdCadence>);
  } catch {
    return v_599a4b;
  }
}

export async function v_b7471b(env: v_273a0c, v_17dc8a): Promise<AdCadence> {
  const v_275ccd = await v_4bc1db(v_c9c489);
  const v_a448ad = v_bf244c({
    firstRound: v_17dc8a.firstRound ?? v_275ccd.firstRound,
    interval: v_17dc8a.interval ?? v_275ccd.interval,
  });
  await v_c9c489.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(v_b99c96, JSON.stringify(v_a448ad))
    .run();
  return v_a448ad;
}

const v_566753 = "gift.exchange";
export interface GiftExchangeMaintenance {
  from: number; 
  to: number; 
  message?: string;
}
export interface GiftExchangeConfig {
  enabled: boolean;
  minQty: number;

  feeQty: number;
  feeUnit: number;
  maintenance: GiftExchangeMaintenance | null;
  version: number;
}
export const v_6ebdd1 = {
  enabled: true,
  minQty: 10,
  feeQty: 1,
  feeUnit: 10,
  maintenance: null,
  version: 1,
};

function v_a7a965(v_e2a85c): GiftExchangeConfig {
  const v_9c6813 = Number(v_e2a85c?.minQty);
  const v_3cda59 = Number(v_e2a85c?.feeQty);
  const v_25946a = Number(v_e2a85c?.feeUnit);
  const v_0e1851 = Number(v_e2a85c?.version);
  const v_35f85c = v_e2a85c?.maintenance;
  const v_ffbee4 =
    v_35f85c && Number.isFinite(Number(v_35f85c.from)) && Number.isFinite(Number(v_35f85c.to)) && Number(v_35f85c.to) > Number(v_35f85c.from)
      ? {
          from: Number(v_35f85c.from),
          to: Number(v_35f85c.to),
          ...(typeof v_35f85c.message === "string" && v_35f85c.message.trim() ? { message: v_35f85c.message.trim().slice(0, 200) } : {}),
        }
      : null;
  return {
    enabled: typeof v_e2a85c?.enabled === "boolean" ? v_e2a85c.enabled : v_6ebdd1.enabled,
    minQty: Number.isInteger(v_9c6813) && v_9c6813 >= 1 && v_9c6813 <= 10000 ? v_9c6813 : v_6ebdd1.minQty,
    feeQty: Number.isInteger(v_3cda59) && v_3cda59 >= 0 && v_3cda59 <= 1000 ? v_3cda59 : v_6ebdd1.feeQty,
    feeUnit: Number.isInteger(v_25946a) && v_25946a >= 1 && v_25946a <= 10000 ? v_25946a : v_6ebdd1.feeUnit,
    maintenance: v_ffbee4,
    version: Number.isInteger(v_0e1851) && v_0e1851 >= 1 ? v_0e1851 : v_6ebdd1.version,
  };
}

export async function v_705aa5(env: v_273a0c): Promise<GiftExchangeConfig> {
  try {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(v_566753)
      .first<{ value: string }>();
    if (!v_3ac7e7) return v_6ebdd1;
    const v_8decf8 = JSON.parse(v_3ac7e7.value) as unknown;
    if (!v_8decf8 || typeof v_8decf8 !== "object") return v_6ebdd1;
    return v_a7a965(v_8decf8 as Partial<GiftExchangeConfig>);
  } catch {
    return v_6ebdd1;
  }
}

export async function v_1e6592(
  env: v_273a0c,
  v_17dc8a,
): Promise<GiftExchangeConfig> {
  const v_275ccd = await v_705aa5(v_c9c489);
  const v_f04727 = v_a7a965({
    enabled: v_17dc8a.enabled ?? v_275ccd.enabled,
    minQty: v_17dc8a.minQty ?? v_275ccd.minQty,
    feeQty: v_17dc8a.feeQty ?? v_275ccd.feeQty,
    feeUnit: v_17dc8a.feeUnit ?? v_275ccd.feeUnit,
    maintenance: v_17dc8a.maintenance === undefined ? v_275ccd.maintenance : v_17dc8a.maintenance,
    version: v_275ccd.version,
  });

  if (v_f04727.minQty !== v_275ccd.minQty || v_f04727.feeQty !== v_275ccd.feeQty || v_f04727.feeUnit !== v_275ccd.feeUnit) {
    v_f04727.version = v_275ccd.version + 1;
  }
  await v_c9c489.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(v_566753, JSON.stringify(v_f04727))
    .run();
  return v_f04727;
}

export function v_e4ea0f(v_01dcf5, v_d016c9): number {
  return v_d016c9 > 0 ? Math.ceil(v_d016c9 / v_01dcf5.feeUnit) * v_01dcf5.feeQty : 0;
}

export function v_c47972(v_01dcf5, v_2461e1): number {
  let v_ab6401 = Math.max(0, v_2461e1);
  while (v_ab6401 > 0 && v_ab6401 + v_e4ea0f(v_01dcf5, v_ab6401) > v_2461e1) v_ab6401--;
  return v_ab6401;
}

export function v_2e4a1b(
  v_01dcf5,
  v_5c2f9f = Date.now(),
): GiftExchangeMaintenance | null {
  const v_35f85c = v_01dcf5.maintenance;
  return v_35f85c && v_5c2f9f >= v_35f85c.from && v_5c2f9f < v_35f85c.to ? v_35f85c : null;
}

const v_7978ec = "vision.config";
const v_9a83ae = 20;
const v_df19aa = 100;
export type VisionDetail = "low" | "high";
export interface VisionConfig {
  model: string;
  detail: VisionDetail;
  models: string[];
}
export const v_4a6b0a = {
  model: "gpt-4o-mini",
  detail: "high",

  models: ["gpt-4o-mini", "gpt-5.4-mini", "gpt-5-nano", "gpt-6-luna"],
};

function v_818f22(v_81e2ef): v_81e2ef is VisionDetail {
  return v_81e2ef === "low" || v_81e2ef === "high";
}

function v_ca976d(v_81e2ef): string[] | null {
  if (!Array.isArray(v_81e2ef) || v_81e2ef.length === 0 || v_81e2ef.length > v_9a83ae) return null;
  const v_8d4337 = [];
  for (const v_479f05 of v_81e2ef) {
    if (typeof v_479f05 !== "string") return null;
    const v_35f85c = v_479f05.trim();
    if (!v_35f85c || v_35f85c.length > v_df19aa) return null;
    if (!v_8d4337.includes(v_35f85c)) v_8d4337.push(v_35f85c);
  }
  return v_8d4337;
}

export async function v_e00c46(env: v_273a0c): Promise<VisionConfig> {
  try {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(v_7978ec)
      .first<{ value: string }>();
    if (!v_3ac7e7) return v_4a6b0a;
    const v_e2a85c = JSON.parse(v_3ac7e7.value) as Partial<VisionConfig> | null;
    if (!v_e2a85c || typeof v_e2a85c !== "object") return v_4a6b0a;
    const v_70641e = v_ca976d(v_e2a85c.models) ?? v_4a6b0a.models;
    return {
      model: typeof v_e2a85c.model === "string" && v_70641e.includes(v_e2a85c.model) ? v_e2a85c.model : (v_70641e[0] ?? v_4a6b0a.model),
      detail: v_818f22(v_e2a85c.detail) ? v_e2a85c.detail : v_4a6b0a.detail,
      models: v_70641e,
    };
  } catch {
    return v_4a6b0a;
  }
}

export async function v_bcea4f(
  env: v_273a0c,
  v_17dc8a,
): Promise<VisionConfig> {
  const v_275ccd = await v_e00c46(v_c9c489);
  let v_70641e = v_275ccd.models;
  if (v_17dc8a.models !== undefined) {
    const v_738e47 = v_ca976d(v_17dc8a.models);
    if (!v_738e47) {
      throw new Error(`models must be 1~${v_9a83ae} non-empty strings.`);
    }
    v_70641e = v_738e47;
  }
  const v_768389 = v_17dc8a.model !== undefined ? v_17dc8a.model : v_275ccd.model;
  if (typeof v_768389 !== "string" || !v_70641e.includes(v_768389)) {
    throw new Error("model must be one of models.");
  }
  const v_3cfdfc = v_17dc8a.detail !== undefined ? v_17dc8a.detail : v_275ccd.detail;
  if (!v_818f22(v_3cfdfc)) throw new Error("detail must be low or high.");
  const v_a448ad = { model: v_768389, detail: v_3cfdfc, models: v_70641e };
  await v_c9c489.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(v_7978ec, JSON.stringify(v_a448ad))
    .run();
  return v_a448ad;
}

const v_928050 = "chat.model_config";
export interface ChatModelConfig {
  model: string;
  models: string[];
}
export const v_f91665 = {
  model: "gpt-5.4-mini",
  models: ["gpt-5.4-mini", "gpt-4o-mini", "gpt-5-nano", "gpt-6-luna"],
};

export async function v_882bd5(env: v_273a0c): Promise<ChatModelConfig> {
  try {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT value FROM app_config WHERE key = ? LIMIT 1`)
      .bind(v_928050)
      .first<{ value: string }>();
    if (!v_3ac7e7) return v_f91665;
    const v_e2a85c = JSON.parse(v_3ac7e7.value) as Partial<ChatModelConfig> | null;
    if (!v_e2a85c || typeof v_e2a85c !== "object") return v_f91665;
    const v_70641e = v_ca976d(v_e2a85c.models) ?? v_f91665.models;
    return {
      model:
        typeof v_e2a85c.model === "string" && v_70641e.includes(v_e2a85c.model)
          ? v_e2a85c.model
          : (v_70641e[0] ?? v_f91665.model),
      models: v_70641e,
    };
  } catch {
    return v_f91665;
  }
}

export async function v_8bd547(
  env: v_273a0c,
  v_17dc8a,
): Promise<ChatModelConfig> {
  const v_275ccd = await v_882bd5(v_c9c489);
  let v_70641e = v_275ccd.models;
  if (v_17dc8a.models !== undefined) {
    const v_738e47 = v_ca976d(v_17dc8a.models);
    if (!v_738e47) {
      throw new Error(`models must be 1~${v_9a83ae} non-empty strings.`);
    }
    v_70641e = v_738e47;
  }
  const v_768389 = v_17dc8a.model !== undefined ? v_17dc8a.model : v_275ccd.model;
  if (typeof v_768389 !== "string" || !v_70641e.includes(v_768389)) {
    throw new Error("model must be one of models.");
  }
  const v_a448ad = { model: v_768389, models: v_70641e };
  await v_c9c489.DB
    .prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, unixepoch())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
    )
    .bind(v_928050, JSON.stringify(v_a448ad))
    .run();
  return v_a448ad;
}
