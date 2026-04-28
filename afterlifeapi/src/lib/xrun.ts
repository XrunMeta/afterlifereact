

import type { Bindings } from "./env";

export interface XrunUserPayload {
  email: string;
  pin: string;          
  firstname: string;
  lastname: string;
  mobile: string;
  gender: "male" | "female" | "other";
  age?: number;
}

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

function base64Encode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function splitName(full: string): { firstname: string; lastname: string } {
  const trimmed = full.trim();
  if (trimmed.length === 0) return { firstname: "user", lastname: "-" };
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return { firstname: parts[0]!, lastname: parts.slice(1).join(" ") };
  }

  if (/^[가-힯]{2,}$/.test(trimmed)) {
    return { firstname: trimmed.slice(1), lastname: trimmed.slice(0, 1) };
  }
  return { firstname: trimmed, lastname: "-" };
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
  const payload: XrunUserPayload = {
    email: ctx.email,
    pin: generatePin(),
    firstname,
    lastname,
    mobile: ctx.phone ?? "0000000000",
    gender: ctx.gender ?? "other",
    age: ctx.age,
  };

  const data = base64Encode(JSON.stringify(payload));

  let res: Response;
  try {
    res = await fetch(`${env.XRUN_API_URL}/external/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
  } catch (err) {
    return { status: "failed", reason: `network: ${(err as Error).message}` };
  }

  let json: { status?: string; data?: { member?: number; guid?: string; email?: string }; errorType?: string; message?: string };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { status: "failed", reason: `non-json response (${res.status})` };
  }

  if (res.status === 200 && json?.data?.member && json?.data?.guid) {
    return {
      status: "created",
      member: json.data.member,
      guid: json.data.guid,
      email: json.data.email ?? ctx.email,
    };
  }

  if (res.status === 409 || json?.errorType === "EMAIL_DUPLICATE") {
    return { status: "duplicate", email: ctx.email };
  }

  return {
    status: "failed",
    reason: `xrun ${res.status}: ${json?.message ?? json?.errorType ?? "unknown"}`,
  };
}

export async function lookupXrunWalletByEmail(
  env: Bindings,
  email: string,
): Promise<XrunWalletLookupResult> {
  const url = `${env.XRUN_API_URL}/external/wallet-by-email?email=${encodeURIComponent(email)}`;
  let res: Response;
  try {
    res = await fetch(url, { method: "GET" });
  } catch (err) {
    return { found: false, reason: `network: ${(err as Error).message}` };
  }

  let json: { status?: string; data?: { member?: number; guid?: string | null; wallet?: string | null }; message?: string };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { found: false, reason: `non-json (${res.status})` };
  }

  if (res.status === 200 && json?.data?.member) {
    return {
      found: true,
      member: json.data.member,
      guid: json.data.guid ?? null,
      wallet: json.data.wallet ?? null,
    };
  }

  if (res.status === 404) return { found: false };

  return { found: false, reason: `xrun lookup ${res.status}: ${json?.message ?? "unknown"}` };
}
