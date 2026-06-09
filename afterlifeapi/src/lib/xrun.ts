

import type { v_273a0c } from "./env";

export interface XrunRegisterResult {
  status: "created" | "duplicate" | "failed";
  member?: number;
  guid?: string;
  email?: string;
  wallet?: string | null;
  reason?: string;
}

export interface XrunWalletLookupResult {
  found: boolean;
  member?: number;
  guid?: string | null;
  wallet?: string | null;
  reason?: string;
}

function v_06d04c(
  v_8f00b9,
  v_7ecfd1,
): boolean {
  if (v_8f00b9.status === 404) return true;
  if (v_7ecfd1?.code === 404) return true;
  const v_badeaf = (v_7ecfd1?.message ?? "").toLowerCase();
  return /not\s*found|no\s*such\s*member|not\s*exist|withdrawn|inactive\s*member/.test(v_badeaf);
}

export async function v_8ae861(env: v_273a0c, v_88fe80): Promise<void> {
  try {
    const v_8f00b9 = await v_c9c489.DB
      .prepare(
        `UPDATE users
            SET xrun_member_id = NULL,
                xrun_guid = NULL,
                xrun_wallet = NULL,
                xrun_linked_at = NULL
          WHERE xrun_member_id = ?`,
      )
      .bind(v_88fe80)
      .run();
    if ((v_8f00b9.meta?.changes ?? 0) > 0) {
      console.log(
        `[xrun] markXrunUnlinked member=${v_88fe80} rows=${v_8f00b9.meta?.changes ?? 0}`,
      );
    }
  } catch (v_49263d) {
    console.warn("[xrun] markXrunUnlinked error:", (v_49263d as Error).message);
  }
}

function v_b35290(): string {
  const v_83ee53 = new Uint8Array(16);
  crypto.getRandomValues(v_83ee53);
  return Array.from(v_83ee53)
    .map((v_148ff6) => v_148ff6.toString(16).padStart(2, "0"))
    .join("");
}

function v_c9bfd6(v_e13cd0): { firstname: string; lastname: string } {
  const v_2f361a = v_e13cd0.trim();
  if (v_2f361a.length === 0) return { firstname: "user", lastname: "" };
  const v_468545 = v_2f361a.split(/\s+/);
  if (v_468545.length >= 2) {
    return { firstname: v_468545[0]!, lastname: v_468545.slice(1).join(" ") };
  }

  if (/^[가-힯]{2,}$/.test(v_2f361a)) {
    return { firstname: v_2f361a.slice(1), lastname: v_2f361a.slice(0, 1) };
  }
  return { firstname: v_2f361a, lastname: "" };
}

function v_845bdb(v_206b88): number {
  if (v_206b88 === "male") return 2110;
  if (v_206b88 === "female") return 2111;
  return 2100;
}

function v_ea45fe(v_2694bd): number | null {
  if (typeof v_2694bd !== "number" || !Number.isFinite(v_2694bd) || v_2694bd < 10) return null;
  if (v_2694bd >= 60) return 2260;

  const v_74f5e8 = Math.floor(v_2694bd / 10);
  return 2200 + v_74f5e8 * 10; 
}

export interface AfterlifeRegisterContext {
  email: string;
  name: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  age?: number;

  country?: string;
  mobileCode?: number;
  region?: string;
}

function v_b6cf08(v_16e2dd): {
  countrycode: string;
  country: number;
  region: number;
  mobilecode: string;
} {
  const v_f6504f = (v_16e2dd.country ?? "KR").toUpperCase();
  const v_15594c = typeof v_16e2dd.mobileCode === "number" ? v_16e2dd.mobileCode : 82;
  const v_5cf162 = (() => {
    const v_cb35cb = v_16e2dd.region;
    if (!v_cb35cb) return 0;
    const v_f4e98d = Number(v_cb35cb);
    return Number.isFinite(v_f4e98d) ? Math.floor(v_f4e98d) : 0;
  })();
  return {
    countrycode: v_f6504f,
    country: v_15594c,
    region: v_5cf162,
    mobilecode: String(v_15594c),
  };
}

export async function v_6e4cc8(
  env: v_273a0c,
  v_16e2dd,
): Promise<XrunRegisterResult> {
  const { firstname: v_54d565, lastname: v_9517dc } = v_c9bfd6(v_16e2dd.name);
  const v_99e8e7 = v_b6cf08(v_16e2dd);
  const v_42b696 = v_ea45fe(v_16e2dd.age);
  const v_4d33b2 = {
    email: v_16e2dd.email,
    pin: v_b35290(),
    firstname: v_54d565,
    lastname: v_9517dc,
    mobile: v_16e2dd.phone ?? "",
    mobilecode: v_99e8e7.mobilecode,
    gender: v_845bdb(v_16e2dd.gender),
    countrycode: v_99e8e7.countrycode,
    country: v_99e8e7.country,
    region: v_99e8e7.region,

    age: v_42b696 ?? 0,
    recommand: 0,
    social_code: 0,

    app_source: "afterlife",
  };

  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v_4d33b2),
    });
  } catch (v_49263d) {
    return { status: "failed", reason: `network: ${(v_49263d as Error).message}` };
  }

  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return { status: "failed", reason: `non-json (${v_8f00b9.status})` };
  }

  if (v_7ecfd1?.code === 409 || /already exists/i.test(v_7ecfd1?.message ?? "")) {

    try {
      await v_36f334(v_c9c489, v_16e2dd);
    } catch (v_49263d) {
      console.warn("[xrun] update-from-afterlife failed:", (v_49263d as Error).message);
    }
    return { status: "duplicate", email: v_16e2dd.email };
  }

  const v_ea719c = Array.isArray(v_7ecfd1?.data) ? v_7ecfd1.data[0] : null;
  if (v_7ecfd1?.status === "success" && v_ea719c?.member) {
    return {
      status: "created",
      member: v_ea719c.member,
      guid: v_ea719c.guid ?? undefined,
      wallet: v_ea719c.address ?? null,
      email: v_ea719c.email ?? v_16e2dd.email,
    };
  }

  return {
    status: "failed",
    reason: `xrun ${v_8f00b9.status} ${v_7ecfd1?.code ?? ""}: ${v_7ecfd1?.message ?? "unknown"}`,
  };
}

async function v_36f334(
  env: v_273a0c,
  v_16e2dd,
): Promise<void> {
  const { firstname: v_54d565, lastname: v_9517dc } = v_c9bfd6(v_16e2dd.name);
  const v_99e8e7 = v_b6cf08(v_16e2dd);
  const v_42b696 = v_ea45fe(v_16e2dd.age);
  const v_4d33b2 = {
    email: v_16e2dd.email,
    firstname: v_54d565,
    lastname: v_9517dc,
    mobile: v_16e2dd.phone ?? null,
    mobilecode: v_99e8e7.mobilecode,
    gender: v_845bdb(v_16e2dd.gender),

    age: v_42b696,
    countrycode: v_99e8e7.countrycode,
    country: v_99e8e7.country,
    region: v_99e8e7.region,
    app_source: "afterlife",
  };
  const v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/oth-path`, {
    method: "POST",
    headers: v_4d1f4f(v_c9c489),
    body: JSON.stringify(v_4d33b2),
  });
  if (!v_8f00b9.ok) {
    throw new Error(`HTTP ${v_8f00b9.status}`);
  }
  const v_7ecfd1 = (await v_8f00b9.json()) as { status?: string; code?: number; message?: string };
  if (v_7ecfd1.status !== "success") {
    throw new Error(`xrun update failed: ${v_7ecfd1.message}`);
  }
}

export async function v_937e23(
  env: v_273a0c,
  v_e0c7e8,
  v_6bee94,
): Promise<XrunWalletLookupResult> {
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: v_e0c7e8, pin: v_6bee94 }),
    });
  } catch (v_49263d) {
    return { found: false, reason: `network: ${(v_49263d as Error).message}` };
  }
  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return { found: false, reason: `non-json (${v_8f00b9.status})` };
  }
  if (v_7ecfd1?.status === "success" && v_7ecfd1?.data?.member) {
    return { found: true, member: v_7ecfd1.data.member, guid: v_7ecfd1.data.guid ?? null, wallet: v_7ecfd1.data.wallet ?? null };
  }
  if (v_8f00b9.status === 401 || v_7ecfd1?.code === 401) return { found: false, reason: "invalid credentials" };
  if (v_8f00b9.status === 404 || v_7ecfd1?.code === 404) return { found: false };
  return { found: false, reason: `xrun verify ${v_8f00b9.status} ${v_7ecfd1?.code ?? ""}: ${v_7ecfd1?.message ?? "unknown"}` };
}

export async function v_a0ec33(
  env: v_273a0c,
  v_e0c7e8,
): Promise<XrunWalletLookupResult> {
  const v_f71b56 = `${v_c9c489.XRUN_API_URL}/oth-path?email=${encodeURIComponent(v_e0c7e8)}`;
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(v_f71b56, { method: "GET" });
  } catch (v_49263d) {
    return { found: false, reason: `network: ${(v_49263d as Error).message}` };
  }

  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return { found: false, reason: `non-json (${v_8f00b9.status})` };
  }

  if (v_7ecfd1?.status === "success" && v_7ecfd1?.data?.member) {
    return {
      found: true,
      member: v_7ecfd1.data.member,
      guid: v_7ecfd1.data.guid ?? null,
      wallet: v_7ecfd1.data.wallet ?? null,
    };
  }

  if (v_8f00b9.status === 404 || v_7ecfd1?.code === 404) return { found: false };

  return { found: false, reason: `xrun lookup ${v_8f00b9.status} ${v_7ecfd1?.code ?? ""}: ${v_7ecfd1?.message ?? "unknown"}` };
}

export interface PaymentPinStatus {
  ok: boolean;
  hasPin: boolean;
  reason?: string;
}

export interface PaymentPinVerifyResult {
  ok: boolean;
  match: boolean;
  hasPin: boolean;
  reason?: string;
}

function v_4d1f4f(env: v_273a0c): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${v_c9c489.XRUN_GATEWAY_TOKEN ?? ""}`,
  };
}

export async function v_807b74(env: v_273a0c, v_660822): Promise<PaymentPinStatus> {
  if (!v_c9c489.XRUN_GATEWAY_TOKEN) return { ok: false, hasPin: false, reason: "missing XRUN_GATEWAY_TOKEN" };
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(
      `${v_c9c489.XRUN_API_URL}/oth-path?member=${encodeURIComponent(String(v_660822))}`,
      { method: "GET", headers: v_4d1f4f(v_c9c489) },
    );
  } catch (v_49263d) {
    return { ok: false, hasPin: false, reason: `network: ${(v_49263d as Error).message}` };
  }
  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return { ok: false, hasPin: false, reason: `non-json (${v_8f00b9.status})` };
  }
  if (v_8f00b9.ok && v_7ecfd1?.status === "success") {
    return { ok: true, hasPin: !!v_7ecfd1.data?.[0]?.hasPin };
  }
  if (v_06d04c(v_8f00b9, v_7ecfd1)) {
    await v_8ae861(v_c9c489, v_660822);
  }
  return { ok: false, hasPin: false, reason: `xrun ${v_8f00b9.status} ${v_7ecfd1?.code ?? ""}: ${v_7ecfd1?.message ?? "unknown"}` };
}

export async function v_de391e(
  env: v_273a0c,
  v_660822,
  v_6bee94,
): Promise<PaymentPinVerifyResult> {
  if (!v_c9c489.XRUN_GATEWAY_TOKEN) return { ok: false, match: false, hasPin: false, reason: "missing XRUN_GATEWAY_TOKEN" };
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: v_4d1f4f(v_c9c489),
      body: JSON.stringify({ member: v_660822, pin: v_6bee94 }),
    });
  } catch (v_49263d) {
    return { ok: false, match: false, hasPin: false, reason: `network: ${(v_49263d as Error).message}` };
  }
  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return { ok: false, match: false, hasPin: false, reason: `non-json (${v_8f00b9.status})` };
  }
  if (v_8f00b9.ok && v_7ecfd1?.status === "success") {
    const v_ea719c = v_7ecfd1.data?.[0] ?? {};
    return { ok: true, match: !!v_ea719c.match, hasPin: !!v_ea719c.hasPin };
  }
  if (v_06d04c(v_8f00b9, v_7ecfd1)) {
    await v_8ae861(v_c9c489, v_660822);
  }
  return { ok: false, match: false, hasPin: false, reason: `xrun ${v_8f00b9.status} ${v_7ecfd1?.code ?? ""}: ${v_7ecfd1?.message ?? "unknown"}` };
}

export interface XrunWalletBalance {
  wallet: number;
  address: string | null;
  currency: number;
  amount: string; 
  symbol: string | null;
}

export interface XrunBalancesResult {
  ok: boolean;
  balances: XrunWalletBalance[];
  reason?: string;
}

export interface XrunCloseResult {
  ok: boolean;
  closed: boolean;
  reason?: string;
}

export async function v_a23589(
  env: v_273a0c,
  v_660822,
): Promise<{ ok: boolean; reason?: string }> {
  if (!v_c9c489.XRUN_GATEWAY_TOKEN) {
    return { ok: false, reason: "missing XRUN_GATEWAY_TOKEN" };
  }
  try {
    const v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: v_4d1f4f(v_c9c489),
      body: JSON.stringify({ member: v_660822 }),
    });
    if (!v_8f00b9.ok) {
      return { ok: false, reason: `HTTP ${v_8f00b9.status}` };
    }
    const v_7ecfd1 = (await v_8f00b9.json()) as { status?: string; message?: string };
    if (v_7ecfd1.status === "success") return { ok: true };
    return { ok: false, reason: v_7ecfd1.message ?? "unknown" };
  } catch (v_49263d) {
    return { ok: false, reason: `network: ${(v_49263d as Error).message}` };
  }
}

export async function v_d19f98(
  env: v_273a0c,
  v_660822,
): Promise<
  | { ok: true; appSource: string | null; status: number }
  | { ok: false; reason: string; missing?: boolean }
> {
  if (!v_c9c489.XRUN_GATEWAY_TOKEN) {
    return { ok: false, reason: "missing XRUN_GATEWAY_TOKEN" };
  }
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: v_4d1f4f(v_c9c489),
      body: JSON.stringify({ member: v_660822 }),
    });
  } catch (v_49263d) {
    return { ok: false, reason: `network: ${(v_49263d as Error).message}` };
  }
  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return { ok: false, reason: `non-json (${v_8f00b9.status})` };
  }
  if (v_8f00b9.ok && v_7ecfd1?.status === "success" && v_7ecfd1.data) {
    return {
      ok: true,
      appSource: v_7ecfd1.data.app_source ?? null,
      status: v_7ecfd1.data.status,
    };
  }
  if (v_06d04c(v_8f00b9, v_7ecfd1)) {
    await v_8ae861(v_c9c489, v_660822);
    return { ok: false, reason: "member not found", missing: true };
  }
  return {
    ok: false,
    reason: `xrun ${v_8f00b9.status} ${v_7ecfd1?.code ?? ""}: ${v_7ecfd1?.message ?? "unknown"}`,
  };
}

export async function v_a33f6b(env: v_273a0c, v_660822): Promise<XrunCloseResult> {
  if (!v_c9c489.XRUN_GATEWAY_TOKEN) {
    return { ok: false, closed: false, reason: "missing XRUN_GATEWAY_TOKEN" };
  }
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: v_4d1f4f(v_c9c489),
      body: JSON.stringify({ member: v_660822, source: "afterlife" }),
    });
  } catch (v_49263d) {
    return { ok: false, closed: false, reason: `network: ${(v_49263d as Error).message}` };
  }
  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return { ok: false, closed: false, reason: `non-json (${v_8f00b9.status})` };
  }
  if (v_8f00b9.ok && v_7ecfd1?.status === "success") {

    await v_8ae861(v_c9c489, v_660822);
    return { ok: true, closed: true };
  }

  if (v_06d04c(v_8f00b9, v_7ecfd1)) {
    await v_8ae861(v_c9c489, v_660822);
    return { ok: true, closed: false, reason: "member not found (already closed?)" };
  }
  return {
    ok: false,
    closed: false,
    reason: `xrun ${v_8f00b9.status} ${v_7ecfd1?.code ?? ""}: ${v_7ecfd1?.message ?? "unknown"}`,
  };
}

export async function v_5f6369(env: v_273a0c, v_660822): Promise<XrunBalancesResult> {
  if (!v_c9c489.XRUN_GATEWAY_TOKEN) {
    return { ok: false, balances: [], reason: "missing XRUN_GATEWAY_TOKEN" };
  }

  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(
      `${v_c9c489.XRUN_API_URL}/oth-path?member=${encodeURIComponent(String(v_660822))}`,
      { method: "GET", headers: v_4d1f4f(v_c9c489) },
    );
  } catch (v_49263d) {
    return { ok: false, balances: [], reason: `network: ${(v_49263d as Error).message}` };
  }
  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return { ok: false, balances: [], reason: `non-json (${v_8f00b9.status})` };
  }
  if (v_8f00b9.ok && v_7ecfd1?.status === "success") {
    const v_18b8bf = Array.isArray(v_7ecfd1.data) ? v_7ecfd1.data : [];
    const v_ceed0b = v_18b8bf

      .filter((v_cb35cb) => v_cb35cb.currency != null && Number.isFinite(Number(v_cb35cb.currency)))
      .map((v_cb35cb) => ({
        wallet: Number(v_cb35cb.wallet ?? 0),
        address: v_cb35cb.address ?? null,
        currency: Number(v_cb35cb.currency),
        amount: String(v_cb35cb.amount ?? "0"),
        symbol: v_cb35cb.symbol ?? null,
      }));
    return { ok: true, balances: v_ceed0b };
  }

  if (v_06d04c(v_8f00b9, v_7ecfd1)) {
    await v_8ae861(v_c9c489, v_660822);
  }
  return {
    ok: false,
    balances: [],
    reason: `xrun ${v_8f00b9.status} ${v_7ecfd1?.code ?? ""}: ${v_7ecfd1?.message ?? "unknown"}`,
  };
}

export async function v_1166ee(
  env: v_273a0c,
  v_660822,
): Promise<number | null> {
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: v_4d1f4f(v_c9c489),
      body: JSON.stringify({ member: v_660822 }),
    });
  } catch {
    return null;
  }
  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return null;
  }
  if (v_8f00b9.ok && v_7ecfd1?.status === "success" && v_7ecfd1.data?.balance != null) {
    const v_f4e98d = Number(v_7ecfd1.data.balance);
    return Number.isFinite(v_f4e98d) ? v_f4e98d : null;
  }
  return null;
}

export interface TransferRecipient {

  toAddress?: string;

  toMember?: number;
  amount: string; 
}
export interface TransferSplitResult {
  ok: boolean;
  txs: Array<{ toAddress: string; amount: string; txHash: string | null }>;
  newBalance: string | null;
  reason?: string;
  code?: number;
}

export async function v_7a6fc0(
  env: v_273a0c,
  v_4317d1,
): Promise<TransferSplitResult> {
  if (!v_c9c489.XRUN_GATEWAY_TOKEN) {
    return { ok: false, txs: [], newBalance: null, reason: "missing XRUN_GATEWAY_TOKEN" };
  }
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: v_4d1f4f(v_c9c489),
      body: JSON.stringify({
        fromMember: v_4317d1.fromMember,
        recipients: v_4317d1.recipients,
        currency: v_4317d1.currency,
        pin: v_4317d1.pin,
        source: v_4317d1.source ?? "afterlife",
      }),
    });
  } catch (v_49263d) {
    return { ok: false, txs: [], newBalance: null, reason: `network: ${(v_49263d as Error).message}` };
  }
  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return { ok: false, txs: [], newBalance: null, code: v_8f00b9.status, reason: `non-json (${v_8f00b9.status})` };
  }
  if (v_8f00b9.ok && v_7ecfd1?.status === "success" && v_7ecfd1.data) {
    return {
      ok: true,
      txs: (v_7ecfd1.data.txs ?? []).map((v_8d41d7) => ({
        toAddress: v_8d41d7.toAddress ?? "",
        amount: v_8d41d7.amount ?? "",
        txHash: v_8d41d7.txHash ?? null,
      })),
      newBalance:
        v_7ecfd1.data.newBalance == null ? null : String(v_7ecfd1.data.newBalance),
    };
  }
  if (v_06d04c(v_8f00b9, v_7ecfd1)) {
    await v_8ae861(v_c9c489, v_4317d1.fromMember);
  }
  return {
    ok: false,
    txs: [],
    newBalance: null,
    code: v_8f00b9.status,
    reason: `xrun transfer ${v_8f00b9.status} ${v_7ecfd1?.code ?? ""}: ${v_7ecfd1?.message ?? "unknown"}`,
  };
}
