

import { v_d30de3 } from "btajrcwvcjzcghyihkwwbcs";

export interface HibpOptions {
  minHitsToReject?: number; 
  timeoutMs?: number;       
  skipInDev?: boolean;      
}

function v_f0bbde(v_fbb6da): string {
  let v_993b31 = "";
  for (const v_148ff6 of v_fbb6da) v_993b31 += v_148ff6.toString(16).padStart(2, "0");
  return v_993b31.toUpperCase();
}

export interface HibpResult {
  breached: boolean;
  hits: number;
  skipped: boolean;
  reason?: string;
}

export async function v_2ffe8e(
  v_adc076,
  v_c9c489,
  v_328259 = {},
): Promise<HibpResult> {
  const v_7c71d7 = v_328259.minHitsToReject ?? 100;
  const v_11bcf9 = v_328259.timeoutMs ?? 3000;
  if (v_328259.skipInDev !== false && v_c9c489.ENVIRONMENT !== "production") {
    return { breached: false, hits: 0, skipped: true, reason: "non-prod" };
  }

  const v_a89256 = v_f0bbde(v_d30de3(new TextEncoder().encode(v_adc076)));
  const v_cd931c = v_a89256.slice(0, 5);
  const v_ae8e76 = v_a89256.slice(5);

  const v_3935b3 = new AbortController();
  const v_8d41d7 = setTimeout(() => v_3935b3.abort(), v_11bcf9);
  try {
    const v_8f00b9 = await fetch(`https://oth-path.pwnedpasswords.com/range/${v_cd931c}`, {
      headers: { "Add-Padding": "true" },
      signal: v_3935b3.signal,
    });
    if (!v_8f00b9.ok) {
      return { breached: false, hits: 0, skipped: true, reason: `http_${v_8f00b9.status}` };
    }
    const v_4d33b2 = await v_8f00b9.text();
    for (const v_e6293e of v_4d33b2.split("\n")) {
      const [v_de522e, v_25e351] = v_e6293e.trim().split(":");
      if (v_de522e?.toUpperCase() === v_ae8e76) {
        const v_688abd = Number(v_25e351 ?? "0");
        return { breached: v_688abd >= v_7c71d7, hits: v_688abd, skipped: false };
      }
    }
    return { breached: false, hits: 0, skipped: false };
  } catch (v_49263d) {
    console.error(`[HIBP_FAIL] ${(v_49263d as Error).message}`);
    return { breached: false, hits: 0, skipped: true, reason: "network" };
  } finally {
    clearTimeout(v_8d41d7);
  }
}
