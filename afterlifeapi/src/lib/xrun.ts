

import type { Bindings } from "./env";

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

function isXrunMemberMissing(
  res: Response,
  json: { status?: string; code?: number; message?: string } | undefined,
): boolean {
  if (res.status === 404) return true;
  if (json?.code === 404) return true;
  const msg = (json?.message ?? "").toLowerCase();
  return /not\s*found|no\s*such\s*member|not\s*exist|withdrawn|inactive\s*member/.test(msg);
}

export async function markXrunUnlinked(env: Bindings, xrunMember: number): Promise<void> {
  try {
    const res = await env.DB
      .prepare(
        `UPDATE users
            SET xrun_member_id = NULL,
                xrun_guid = NULL,
                xrun_wallet = NULL,
                xrun_linked_at = NULL
          WHERE xrun_member_id = ?`,
      )
      .bind(xrunMember)
      .run();
    if ((res.meta?.changes ?? 0) > 0) {
      console.log(
        `[xrun] markXrunUnlinked member=${xrunMember} rows=${res.meta?.changes ?? 0}`,
      );
    }
  } catch (err) {
    console.warn("[xrun] markXrunUnlinked error:", (err as Error).message);
  }
}

function generatePin(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function splitName(full: string): { firstname: string; lastname: string } {
  const trimmed = full.trim();
  if (trimmed.length === 0) return { firstname: "user", lastname: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return { firstname: parts[0]!, lastname: parts.slice(1).join(" ") };
  }

  if (/^[가-힯]{2,}$/.test(trimmed)) {
    return { firstname: trimmed.slice(1), lastname: trimmed.slice(0, 1) };
  }
  return { firstname: trimmed, lastname: "" };
}

function mapGender(g?: "male" | "female" | "other"): number {
  if (g === "male") return 2101;
  if (g === "female") return 2102;
  return 2100;
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

function mapLocation(ctx: AfterlifeRegisterContext): {
  countrycode: string;
  country: number;
  region: number;
  mobilecode: string;
} {
  const countrycode = (ctx.country ?? "KR").toUpperCase();
  const mobileCodeNum = typeof ctx.mobileCode === "number" ? ctx.mobileCode : 82;
  const regionNum = (() => {
    const r = ctx.region;
    if (!r) return 0;
    const n = Number(r);
    return Number.isFinite(n) ? Math.floor(n) : 0;
  })();
  return {
    countrycode,
    country: mobileCodeNum,
    region: regionNum,
    mobilecode: String(mobileCodeNum),
  };
}

export async function registerXrunForAfterlifeUser(
  env: Bindings,
  ctx: AfterlifeRegisterContext,
): Promise<XrunRegisterResult> {
  const { firstname, lastname } = splitName(ctx.name);
  const loc = mapLocation(ctx);
  const body = {
    email: ctx.email,
    pin: generatePin(),
    firstname,
    lastname,
    mobile: ctx.phone ?? "",
    mobilecode: loc.mobilecode,
    gender: mapGender(ctx.gender),
    countrycode: loc.countrycode,
    country: loc.country,
    region: loc.region,
    age: ctx.age ?? 0,
    recommand: 0,
    social_code: 0,

    app_source: "afterlife",
  };

  let res: Response;
  try {
    res = await fetch(`${env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { status: "failed", reason: `network: ${(err as Error).message}` };
  }

  let json: {
    status?: string;
    code?: number;
    message?: string;
    data?: Array<{ member?: number; guid?: string; address?: string; email?: string }> | null;
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { status: "failed", reason: `non-json (${res.status})` };
  }

  if (json?.code === 409 || /already exists/i.test(json?.message ?? "")) {

    try {
      await updateXrunFromAfterlife(env, ctx);
    } catch (err) {
      console.warn("[xrun] update-from-afterlife failed:", (err as Error).message);
    }
    return { status: "duplicate", email: ctx.email };
  }

  const first = Array.isArray(json?.data) ? json.data[0] : null;
  if (json?.status === "success" && first?.member) {
    return {
      status: "created",
      member: first.member,
      guid: first.guid ?? undefined,
      wallet: first.address ?? null,
      email: first.email ?? ctx.email,
    };
  }

  return {
    status: "failed",
    reason: `xrun ${res.status} ${json?.code ?? ""}: ${json?.message ?? "unknown"}`,
  };
}

async function updateXrunFromAfterlife(
  env: Bindings,
  ctx: AfterlifeRegisterContext,
): Promise<void> {
  const { firstname, lastname } = splitName(ctx.name);
  const loc = mapLocation(ctx);
  const body: Record<string, unknown> = {
    email: ctx.email,
    firstname,
    lastname,
    mobile: ctx.phone ?? null,
    mobilecode: loc.mobilecode,
    gender: mapGender(ctx.gender),
    age: ctx.age ?? null,
    countrycode: loc.countrycode,
    country: loc.country,
    region: loc.region,
    app_source: "afterlife",
  };
  const res = await fetch(`${env.XRUN_API_URL}/oth-path`, {
    method: "POST",
    headers: gatewayHeaders(env),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = (await res.json()) as { status?: string; code?: number; message?: string };
  if (json.status !== "success") {
    throw new Error(`xrun update failed: ${json.message}`);
  }
}

export async function verifyXrunCredentials(
  env: Bindings,
  email: string,
  pin: string,
): Promise<XrunWalletLookupResult> {
  let res: Response;
  try {
    res = await fetch(`${env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin }),
    });
  } catch (err) {
    return { found: false, reason: `network: ${(err as Error).message}` };
  }
  let json: { status?: string; code?: number; message?: string; data?: { member?: number; guid?: string | null; wallet?: string | null } | null };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { found: false, reason: `non-json (${res.status})` };
  }
  if (json?.status === "success" && json?.data?.member) {
    return { found: true, member: json.data.member, guid: json.data.guid ?? null, wallet: json.data.wallet ?? null };
  }
  if (res.status === 401 || json?.code === 401) return { found: false, reason: "invalid credentials" };
  if (res.status === 404 || json?.code === 404) return { found: false };
  return { found: false, reason: `xrun verify ${res.status} ${json?.code ?? ""}: ${json?.message ?? "unknown"}` };
}

export async function lookupXrunWalletByEmail(
  env: Bindings,
  email: string,
): Promise<XrunWalletLookupResult> {
  const url = `${env.XRUN_API_URL}/oth-path?email=${encodeURIComponent(email)}`;
  let res: Response;
  try {
    res = await fetch(url, { method: "GET" });
  } catch (err) {
    return { found: false, reason: `network: ${(err as Error).message}` };
  }

  let json: {
    status?: string;
    code?: number;
    message?: string;
    data?: { member?: number; guid?: string | null; wallet?: string | null } | null;
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { found: false, reason: `non-json (${res.status})` };
  }

  if (json?.status === "success" && json?.data?.member) {
    return {
      found: true,
      member: json.data.member,
      guid: json.data.guid ?? null,
      wallet: json.data.wallet ?? null,
    };
  }

  if (res.status === 404 || json?.code === 404) return { found: false };

  return { found: false, reason: `xrun lookup ${res.status} ${json?.code ?? ""}: ${json?.message ?? "unknown"}` };
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

function gatewayHeaders(env: Bindings): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.XRUN_GATEWAY_TOKEN ?? ""}`,
  };
}

export async function hasXrunPaymentPin(env: Bindings, member: number): Promise<PaymentPinStatus> {
  if (!env.XRUN_GATEWAY_TOKEN) return { ok: false, hasPin: false, reason: "missing XRUN_GATEWAY_TOKEN" };
  let res: Response;
  try {
    res = await fetch(
      `${env.XRUN_API_URL}/oth-path?member=${encodeURIComponent(String(member))}`,
      { method: "GET", headers: gatewayHeaders(env) },
    );
  } catch (err) {
    return { ok: false, hasPin: false, reason: `network: ${(err as Error).message}` };
  }
  let json: { status?: string; code?: number; message?: string; data?: Array<{ hasPin?: boolean }> | null };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, hasPin: false, reason: `non-json (${res.status})` };
  }
  if (res.ok && json?.status === "success") {
    return { ok: true, hasPin: !!json.data?.[0]?.hasPin };
  }
  if (isXrunMemberMissing(res, json)) {
    await markXrunUnlinked(env, member);
  }
  return { ok: false, hasPin: false, reason: `xrun ${res.status} ${json?.code ?? ""}: ${json?.message ?? "unknown"}` };
}

export async function verifyXrunPaymentPin(
  env: Bindings,
  member: number,
  pin: string,
): Promise<PaymentPinVerifyResult> {
  if (!env.XRUN_GATEWAY_TOKEN) return { ok: false, match: false, hasPin: false, reason: "missing XRUN_GATEWAY_TOKEN" };
  let res: Response;
  try {
    res = await fetch(`${env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: gatewayHeaders(env),
      body: JSON.stringify({ member, pin }),
    });
  } catch (err) {
    return { ok: false, match: false, hasPin: false, reason: `network: ${(err as Error).message}` };
  }
  let json: { status?: string; code?: number; message?: string; data?: Array<{ match?: boolean; hasPin?: boolean }> | null };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, match: false, hasPin: false, reason: `non-json (${res.status})` };
  }
  if (res.ok && json?.status === "success") {
    const first = json.data?.[0] ?? {};
    return { ok: true, match: !!first.match, hasPin: !!first.hasPin };
  }
  if (isXrunMemberMissing(res, json)) {
    await markXrunUnlinked(env, member);
  }
  return { ok: false, match: false, hasPin: false, reason: `xrun ${res.status} ${json?.code ?? ""}: ${json?.message ?? "unknown"}` };
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

export async function markAfterlifeDeletedOnXrun(
  env: Bindings,
  member: number,
): Promise<{ ok: boolean; reason?: string }> {
  if (!env.XRUN_GATEWAY_TOKEN) {
    return { ok: false, reason: "missing XRUN_GATEWAY_TOKEN" };
  }
  try {
    const res = await fetch(`${env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: gatewayHeaders(env),
      body: JSON.stringify({ member }),
    });
    if (!res.ok) {
      return { ok: false, reason: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { status?: string; message?: string };
    if (json.status === "success") return { ok: true };
    return { ok: false, reason: json.message ?? "unknown" };
  } catch (err) {
    return { ok: false, reason: `network: ${(err as Error).message}` };
  }
}

export async function getXrunMemberInfo(
  env: Bindings,
  member: number,
): Promise<
  | { ok: true; appSource: string | null; status: number }
  | { ok: false; reason: string; missing?: boolean }
> {
  if (!env.XRUN_GATEWAY_TOKEN) {
    return { ok: false, reason: "missing XRUN_GATEWAY_TOKEN" };
  }
  let res: Response;
  try {
    res = await fetch(`${env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: gatewayHeaders(env),
      body: JSON.stringify({ member }),
    });
  } catch (err) {
    return { ok: false, reason: `network: ${(err as Error).message}` };
  }
  let json: {
    status?: string;
    code?: number;
    message?: string;
    data?: { member: number; app_source: string | null; status: number } | null;
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, reason: `non-json (${res.status})` };
  }
  if (res.ok && json?.status === "success" && json.data) {
    return {
      ok: true,
      appSource: json.data.app_source ?? null,
      status: json.data.status,
    };
  }
  if (isXrunMemberMissing(res, json)) {
    await markXrunUnlinked(env, member);
    return { ok: false, reason: "member not found", missing: true };
  }
  return {
    ok: false,
    reason: `xrun ${res.status} ${json?.code ?? ""}: ${json?.message ?? "unknown"}`,
  };
}

export async function closeXrunMember(env: Bindings, member: number): Promise<XrunCloseResult> {
  if (!env.XRUN_GATEWAY_TOKEN) {
    return { ok: false, closed: false, reason: "missing XRUN_GATEWAY_TOKEN" };
  }
  let res: Response;
  try {
    res = await fetch(`${env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: gatewayHeaders(env),
      body: JSON.stringify({ member, source: "afterlife" }),
    });
  } catch (err) {
    return { ok: false, closed: false, reason: `network: ${(err as Error).message}` };
  }
  let json: { status?: string; code?: number; message?: string; data?: unknown };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, closed: false, reason: `non-json (${res.status})` };
  }
  if (res.ok && json?.status === "success") {

    await markXrunUnlinked(env, member);
    return { ok: true, closed: true };
  }

  if (isXrunMemberMissing(res, json)) {
    await markXrunUnlinked(env, member);
    return { ok: true, closed: false, reason: "member not found (already closed?)" };
  }
  return {
    ok: false,
    closed: false,
    reason: `xrun ${res.status} ${json?.code ?? ""}: ${json?.message ?? "unknown"}`,
  };
}

export async function getXrunBalances(env: Bindings, member: number): Promise<XrunBalancesResult> {
  if (!env.XRUN_GATEWAY_TOKEN) {
    return { ok: false, balances: [], reason: "missing XRUN_GATEWAY_TOKEN" };
  }
  let res: Response;
  try {
    res = await fetch(`${env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: gatewayHeaders(env),
      body: JSON.stringify({ member }),
    });
  } catch (err) {
    return { ok: false, balances: [], reason: `network: ${(err as Error).message}` };
  }
  let json: { status?: string; code?: number; message?: string; data?: XrunWalletBalance[] | null };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, balances: [], reason: `non-json (${res.status})` };
  }
  if (res.ok && json?.status === "success") {
    return { ok: true, balances: json.data ?? [] };
  }

  if (isXrunMemberMissing(res, json)) {
    await markXrunUnlinked(env, member);
  }
  return {
    ok: false,
    balances: [],
    reason: `xrun ${res.status} ${json?.code ?? ""}: ${json?.message ?? "unknown"}`,
  };
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

export async function externalTransferSplit(
  env: Bindings,
  args: {
    fromMember: number;
    recipients: TransferRecipient[];
    currency: number;
    pin: string;
    source?: string;
  },
): Promise<TransferSplitResult> {
  if (!env.XRUN_GATEWAY_TOKEN) {
    return { ok: false, txs: [], newBalance: null, reason: "missing XRUN_GATEWAY_TOKEN" };
  }
  let res: Response;
  try {
    res = await fetch(`${env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: gatewayHeaders(env),
      body: JSON.stringify({
        fromMember: args.fromMember,
        recipients: args.recipients,
        currency: args.currency,
        pin: args.pin,
        source: args.source ?? "afterlife",
      }),
    });
  } catch (err) {
    return { ok: false, txs: [], newBalance: null, reason: `network: ${(err as Error).message}` };
  }
  let json: {
    status?: string;
    code?: number;
    message?: string;
    data?: {
      txs?: Array<{ toAddress?: string; amount?: string; txHash?: string | null }>;
      newBalance?: string | number | null;
    } | null;
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, txs: [], newBalance: null, code: res.status, reason: `non-json (${res.status})` };
  }
  if (res.ok && json?.status === "success" && json.data) {
    return {
      ok: true,
      txs: (json.data.txs ?? []).map((t) => ({
        toAddress: t.toAddress ?? "",
        amount: t.amount ?? "",
        txHash: t.txHash ?? null,
      })),
      newBalance:
        json.data.newBalance == null ? null : String(json.data.newBalance),
    };
  }
  if (isXrunMemberMissing(res, json)) {
    await markXrunUnlinked(env, args.fromMember);
  }
  return {
    ok: false,
    txs: [],
    newBalance: null,
    code: res.status,
    reason: `xrun transfer ${res.status} ${json?.code ?? ""}: ${json?.message ?? "unknown"}`,
  };
}
