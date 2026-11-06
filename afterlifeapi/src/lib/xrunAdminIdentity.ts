

import type { v_437670 } from "zmui";
import type { v_de0a25, v_273a0c } from "./env";

export interface XrunAdminActor {
  id: number; 
  email: string | null;
}

const v_5f9675 = "xadm:";
const v_8837b3 = 300;
const v_ff3e0c = 5000;
const v_76b8ff = 4096;

async function v_a0951c(v_21cc31): Promise<string> {
  const v_6961cf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v_21cc31));
  const v_993b31 = Array.from(new Uint8Array(v_6961cf), (v_148ff6) => v_148ff6.toString(16).padStart(2, "0")).join("");
  return v_5f9675 + v_993b31;
}

export async function v_da9a62(env: v_273a0c, v_21cc31): Promise<XrunAdminActor | null> {
  if (!v_21cc31 || v_21cc31.length > v_76b8ff || v_21cc31.split(".").length !== 3) return null;
  const v_b24339 = await v_a0951c(v_21cc31);
  const v_e2a6a6 = await v_c9c489.KV_AUTH.get(v_b24339);
  if (v_e2a6a6) return JSON.parse(v_e2a6a6) as XrunAdminActor;

  let v_4d33b2;
  try {
    const v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}/oth-path`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
      signal: AbortSignal.timeout(v_ff3e0c),
    });
    if (!v_8f00b9.ok) return null;
    v_4d33b2 = (await v_8f00b9.json()) as typeof v_4d33b2;
  } catch (v_49263d) {
    console.warn("[xrunAdminIdentity] verify failed:", (v_49263d as Error).message);
    return null;
  }
  const v_389afb = Number(v_4d33b2?.data?.member);
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) return null;
  const v_380fb2 = { id: v_389afb, email: typeof v_4d33b2?.data?.email === "string" ? v_4d33b2.data.email : null };
  await v_c9c489.KV_AUTH.put(v_b24339, JSON.stringify(v_380fb2), { expirationTtl: v_8837b3 });
  return v_380fb2;
}

export function v_299864(c: v_437670<v_de0a25>): number {
  return v_3f4e2e.get("adminActor")?.id ?? v_3f4e2e.get("adminUserId") ?? 0;
}

export function v_a4a42b(c: v_437670<v_de0a25>): string | number {
  const v_380fb2 = v_3f4e2e.get("adminActor");
  return v_380fb2 ? `xrun:${v_380fb2.id}` : (v_3f4e2e.get("adminUserId") ?? 0);
}
