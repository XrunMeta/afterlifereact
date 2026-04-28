

import type { v_273a0c } from "./env";

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

function v_b35290(): string {

  const v_83ee53 = new Uint8Array(16);
  crypto.getRandomValues(v_83ee53);
  return Array.from(v_83ee53)
    .map((v_148ff6) => v_148ff6.toString(16).padStart(2, "0"))
    .join("");
}

function v_222d64(v_fd5f43): string {
  const v_fbb6da = new TextEncoder().encode(v_fd5f43);
  let v_d8cac9 = "";
  for (const v_148ff6 of v_fbb6da) v_d8cac9 += String.fromCharCode(v_148ff6);
  return btoa(v_d8cac9);
}

function v_c9bfd6(v_e13cd0): { firstname: string; lastname: string } {
  const v_2f361a = v_e13cd0.trim();
  if (v_2f361a.length === 0) return { firstname: "user", lastname: "-" };
  const v_468545 = v_2f361a.split(/\s+/);
  if (v_468545.length >= 2) {
    return { firstname: v_468545[0]!, lastname: v_468545.slice(1).join(" ") };
  }

  if (/^[가-힯]{2,}$/.test(v_2f361a)) {
    return { firstname: v_2f361a.slice(1), lastname: v_2f361a.slice(0, 1) };
  }
  return { firstname: v_2f361a, lastname: "-" };
}

export interface AfterlifeRegisterContext {
  email: string;
  name: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  age?: number;
}

export async function v_6e4cc8(
  env: v_273a0c,
  v_16e2dd,
): Promise<XrunRegisterResult> {
  const { firstname: v_54d565, lastname: v_9517dc } = v_c9bfd6(v_16e2dd.name);
  const v_931bf0 = {
    email: v_16e2dd.email,
    pin: v_b35290(),
    firstname: v_54d565,
    lastname: v_9517dc,
    mobile: v_16e2dd.phone ?? "0000000000",
    gender: v_16e2dd.gender ?? "other",
    age: v_16e2dd.age,
  };

  const v_9390e8 = v_222d64(JSON.stringify(v_931bf0));

  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/external/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: v_9390e8 }),
    });
  } catch (v_49263d) {
    return { status: "failed", reason: `network: ${(v_49263d as Error).message}` };
  }

  let v_7ecfd1;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as typeof v_7ecfd1;
  } catch {
    return { status: "failed", reason: `non-json response (${v_8f00b9.status})` };
  }

  if (v_8f00b9.status === 200 && v_7ecfd1?.data?.member && v_7ecfd1?.data?.guid) {
    return {
      status: "created",
      member: v_7ecfd1.data.member,
      guid: v_7ecfd1.data.guid,
      email: v_7ecfd1.data.email ?? v_16e2dd.email,
    };
  }

  if (v_8f00b9.status === 409 || v_7ecfd1?.errorType === "EMAIL_DUPLICATE") {
    return { status: "duplicate", email: v_16e2dd.email };
  }

  return {
    status: "failed",
    reason: `xrun ${v_8f00b9.status}: ${v_7ecfd1?.message ?? v_7ecfd1?.errorType ?? "unknown"}`,
  };
}

export async function v_a0ec33(
  env: v_273a0c,
  v_e0c7e8,
): Promise<XrunWalletLookupResult> {
  const v_f71b56 = `${v_c9c489.XRUN_API_URL}/external/wallet-by-email?email=${encodeURIComponent(v_e0c7e8)}`;
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

  if (v_8f00b9.status === 200 && v_7ecfd1?.data?.member) {
    return {
      found: true,
      member: v_7ecfd1.data.member,
      guid: v_7ecfd1.data.guid ?? null,
      wallet: v_7ecfd1.data.wallet ?? null,
    };
  }

  if (v_8f00b9.status === 404) return { found: false };

  return { found: false, reason: `xrun lookup ${v_8f00b9.status}: ${v_7ecfd1?.message ?? "unknown"}` };
}
