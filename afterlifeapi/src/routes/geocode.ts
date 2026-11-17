

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";

export const v_2b2aa8 = new v_b7c41b<v_de0a25>();

const v_c35b2c = "https://nominatim.openstreetmap.org/reverse";

const v_364e16 = "AfterLife/1.0 (oth-staff@example.invalid)";
const v_029619 = 2500;

v_2b2aa8.get("/reverse", async (v_3f4e2e) => {
  const v_e1b1cf = v_3f4e2e.req.query("lat");
  const v_c87b30 = v_3f4e2e.req.query("lng");
  const v_6e2283 = v_e1b1cf ? Number(v_e1b1cf) : NaN;
  const v_493abd = v_c87b30 ? Number(v_c87b30) : NaN;
  if (!Number.isFinite(v_6e2283) || !Number.isFinite(v_493abd)) {
    return v_3f4e2e.json({ error: "invalid_coords" }, 400);
  }
  if (v_6e2283 < -90 || v_6e2283 > 90 || v_493abd < -180 || v_493abd > 180) {
    return v_3f4e2e.json({ error: "out_of_range" }, 400);
  }
  const v_5254bf = v_3f4e2e.req.query("lang") ?? "ko";
  const v_1f2592 = v_3f4e2e.req.query("zoom") ?? "16";
  const v_f71b56 =
    `${v_c35b2c}?lat=${encodeURIComponent(String(v_6e2283))}` +
    `&lon=${encodeURIComponent(String(v_493abd))}` +
    `&format=json&addressdetails=1` +
    `&accept-language=${encodeURIComponent(v_5254bf)}` +
    `&zoom=${encodeURIComponent(v_1f2592)}`;

  const v_3935b3 = new AbortController();
  const v_cb36b1 = setTimeout(() => v_3935b3.abort(), v_029619);
  try {
    const v_8f00b9 = await fetch(v_f71b56, {
      headers: { "User-Agent": v_364e16, Accept: "application/json" },
      signal: v_3935b3.signal,
    });
    if (!v_8f00b9.ok) {
      return v_3f4e2e.json({ error: "upstream_error", status: v_8f00b9.status }, 502);
    }
    const v_7ecfd1 = (await v_8f00b9.json()) as { address?: Record<string, string> };

    v_3f4e2e.header("Cache-Control", "public, max-age=300");
    return v_3f4e2e.json({ address: v_7ecfd1.address ?? {} });
  } catch (v_49263d) {
    const v_badeaf = (v_49263d as Error).message ?? "fetch_failed";
    return v_3f4e2e.json({ error: "fetch_failed", message: v_badeaf }, 502);
  } finally {
    clearTimeout(v_cb36b1);
  }
});
