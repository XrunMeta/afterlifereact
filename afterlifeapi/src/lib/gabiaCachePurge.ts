

import type { v_273a0c } from "./env";

export type GabiaPurgeStage = "quarantine" | "cold" | "purged";

const v_5df284 = {
  quarantine: "/purge/quarantine",
  cold: "/purge/cold",
  purged: "/purge/full",
};

const v_821e1f = {
  quarantine: "POST",
  cold: "POST",
  purged: "DELETE",
};

export async function v_79af37(
  env: v_273a0c,
  v_2ae4e7,
  v_6e0fd3,
): Promise<boolean> {
  const v_d20c84 = (v_c9c489 as v_273a0c & { GABIA_PURGE_ENABLED?: string }).GABIA_PURGE_ENABLED === "1";
  if (!v_d20c84) {

    console.log(`[gabia-purge] (disabled) stage=${v_2ae4e7} clone=${v_6e0fd3} — advancing timestamp only`);
    return true;
  }
  const v_694b25 = (v_c9c489.CALL_PRETHIRD_BASE ?? "https://rtc.example.invalid/prethird").replace(/\/+$/, "");
  const v_f71b56 = `${v_694b25}${v_5df284[v_2ae4e7]}/${v_6e0fd3}`;
  const v_43fd42 = (v_c9c489 as v_273a0c & { PRETHIRD_PURGE_SECRET?: string }).PRETHIRD_PURGE_SECRET ?? "";
  const v_22d288 = new AbortController();
  const v_cb36b1 = setTimeout(() => v_22d288.abort(), 15_000);
  try {
    const v_8f00b9 = await fetch(v_f71b56, {
      method: v_821e1f[v_2ae4e7],
      signal: v_22d288.signal,
      headers: v_43fd42 ? { Authorization: `Bearer ${v_43fd42}` } : {},
    });
    if (v_8f00b9.status === 404) {

      console.warn(`[gabia-purge] 404 ${v_2ae4e7} clone=${v_6e0fd3} — endpoint not implemented, treating as success`);
      return true;
    }
    if (v_8f00b9.status >= 500 || v_8f00b9.status === 408 || v_8f00b9.status === 429) {
      console.error(`[gabia-purge] ${v_8f00b9.status} ${v_2ae4e7} clone=${v_6e0fd3} — retry next tick`);
      return false;
    }
    return v_8f00b9.ok; 
  } catch (v_9e86fd) {
    console.error(`[gabia-purge] network ${v_2ae4e7} clone=${v_6e0fd3}:`, v_9e86fd);
    return false;
  } finally {
    clearTimeout(v_cb36b1);
  }
}

export interface GabiaPurgeAdvanceResult {
  quarantineTried: number;
  quarantineOk: number;
  coldTried: number;
  coldOk: number;
  purgedTried: number;
  purgedOk: number;
}

export async function v_fafc3e(env: v_273a0c): Promise<GabiaPurgeAdvanceResult> {
  const v_43c42e = {
    quarantineTried: 0, quarantineOk: 0,
    coldTried: 0, coldOk: 0,
    purgedTried: 0, purgedOk: 0,
  };

  const v_9c23ee = await v_c9c489.DB
    .prepare(
      `SELECT id FROM clones
        WHERE deletion_state = 'soft_deleted'
          AND soft_deleted_at IS NOT NULL
          AND gabia_quarantine_at IS NULL
        LIMIT 100`,
    )
    .all<{ id: number }>();
  for (const { id: v_389afb } of v_9c23ee.results ?? []) {
    v_43c42e.quarantineTried += 1;
    const v_3ed4c3 = await v_79af37(v_c9c489, "quarantine", v_389afb);
    if (v_3ed4c3) {
      await v_c9c489.DB.prepare(`UPDATE clones SET gabia_quarantine_at = unixepoch() WHERE id = ?`).bind(v_389afb).run();
      v_43c42e.quarantineOk += 1;
    }
  }

  const v_37d2e5 = await v_c9c489.DB
    .prepare(
      `SELECT id FROM clones
        WHERE gabia_quarantine_at IS NOT NULL
          AND gabia_quarantine_at < unixepoch() - 7 * 86400
          AND gabia_cold_at IS NULL
        LIMIT 100`,
    )
    .all<{ id: number }>();
  for (const { id: v_389afb } of v_37d2e5.results ?? []) {
    v_43c42e.coldTried += 1;
    const v_3ed4c3 = await v_79af37(v_c9c489, "cold", v_389afb);
    if (v_3ed4c3) {
      await v_c9c489.DB.prepare(`UPDATE clones SET gabia_cold_at = unixepoch() WHERE id = ?`).bind(v_389afb).run();
      v_43c42e.coldOk += 1;
    }
  }

  const v_d2667a = await v_c9c489.DB
    .prepare(
      `SELECT id FROM clones
        WHERE gabia_quarantine_at IS NOT NULL
          AND gabia_quarantine_at < unixepoch() - 30 * 86400
          AND gabia_purged_at IS NULL
        LIMIT 100`,
    )
    .all<{ id: number }>();
  for (const { id: v_389afb } of v_d2667a.results ?? []) {
    v_43c42e.purgedTried += 1;
    const v_3ed4c3 = await v_79af37(v_c9c489, "purged", v_389afb);
    if (v_3ed4c3) {
      await v_c9c489.DB.prepare(`UPDATE clones SET gabia_purged_at = unixepoch() WHERE id = ?`).bind(v_389afb).run();
      v_43c42e.purgedOk += 1;
    }
  }

  return v_43c42e;
}
