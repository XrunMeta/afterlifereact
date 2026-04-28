

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
}

export async function registerXrunForAfterlifeUser(
  env: Bindings,
  ctx: AfterlifeRegisterContext,
): Promise<XrunRegisterResult> {
  const { firstname, lastname } = splitName(ctx.name);
  const body = {
    email: ctx.email,
    pin: generatePin(),
    firstname,
    lastname,
    mobile: ctx.phone ?? "",
    mobilecode: "82",
    gender: mapGender(ctx.gender),
    countrycode: "KR",
    country: 0,
    region: 0,
    age: ctx.age ?? 0,
    recommand: 0,
    social_code: 0,
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
