

import { sha1 } from "@noble/hashes/legacy.js";

export interface HibpOptions {
  minHitsToReject?: number; 
  timeoutMs?: number;       
  skipInDev?: boolean;      
}

function toHexUpper(bytes: Uint8Array): string {
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex.toUpperCase();
}

export interface HibpResult {
  breached: boolean;
  hits: number;
  skipped: boolean;
  reason?: string;
}

export async function checkPwnedPassword(
  password: string,
  env: { ENVIRONMENT?: string },
  opts: HibpOptions = {},
): Promise<HibpResult> {
  const minHits = opts.minHitsToReject ?? 100;
  const timeoutMs = opts.timeoutMs ?? 3000;
  if (opts.skipInDev !== false && env.ENVIRONMENT !== "production") {
    return { breached: false, hits: 0, skipped: true, reason: "non-prod" };
  }

  const hashHex = toHexUpper(sha1(new TextEncoder().encode(password)));
  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://oth-path.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: ctl.signal,
    });
    if (!res.ok) {
      return { breached: false, hits: 0, skipped: true, reason: `http_${res.status}` };
    }
    const body = await res.text();
    for (const line of body.split("\n")) {
      const [sfx, countStr] = line.trim().split(":");
      if (sfx?.toUpperCase() === suffix) {
        const hits = Number(countStr ?? "0");
        return { breached: hits >= minHits, hits, skipped: false };
      }
    }
    return { breached: false, hits: 0, skipped: false };
  } catch (err) {
    console.error(`[HIBP_FAIL] ${(err as Error).message}`);
    return { breached: false, hits: 0, skipped: true, reason: "network" };
  } finally {
    clearTimeout(t);
  }
}
