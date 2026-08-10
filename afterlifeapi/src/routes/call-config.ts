

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";

const KEYS = {
  prethirdBase: "call.prethird_base",
  callRoute: "call.route",
  secondBase: "call.second_base",

  experimentalBase: "call.experimental_base",
} as const;

const DEFAULTS = {
  prethirdBase: "https://rtc.example.invalid/prethird",
  callRoute: "prethird",
  secondBase: null as string | null,
  experimentalBase: null as string | null,
};

const VALID_ROUTES = new Set(["prethird", "second"]);

interface ConfigRow {
  key: string;
  value: string;
  updated_at: number;
}

export const callConfig = new Hono<AppEnv>();

callConfig.get("/", async (c) => {
  const res = await c.env.DB.prepare(
    "SELECT key, value, updated_at FROM app_config WHERE key IN (?, ?, ?, ?)",
  )
    .bind(KEYS.prethirdBase, KEYS.callRoute, KEYS.secondBase, KEYS.experimentalBase)
    .all<ConfigRow>();

  const rows = res.results ?? [];
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const updatedAt = rows.reduce((m, r) => Math.max(m, r.updated_at ?? 0), 0);

  const prethirdBase =
    map.get(KEYS.prethirdBase) ?? c.env.CALL_PRETHIRD_BASE ?? DEFAULTS.prethirdBase;

  let callRoute = map.get(KEYS.callRoute) ?? c.env.CALL_ROUTE ?? DEFAULTS.callRoute;
  if (!VALID_ROUTES.has(callRoute)) callRoute = DEFAULTS.callRoute;

  const secondBase =
    map.get(KEYS.secondBase) ?? c.env.CALL_SECOND_BASE ?? DEFAULTS.secondBase;

  const experimentalBase =
    map.get(KEYS.experimentalBase) ??
    c.env.CALL_EXPERIMENTAL_BASE ??
    DEFAULTS.experimentalBase;

  c.header("Cache-Control", "public, max-age=60");
  return c.json({ prethirdBase, callRoute, secondBase, experimentalBase, updatedAt });
});
