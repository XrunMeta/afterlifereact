

import type { ColumnEntry, FixtureCtx, RowSelector, SurfaceId } from "../index/types";
import { routeFor } from "../index/screens";
import { sql } from "./local-db.mjs";

export interface Check {
  column: string;
  label: string;
  testid: string;

  row?: RowSelector;
  format?: (v: unknown) => string;
  where: string;
}

export interface ScreenPlan {
  route: string;
  checks: Check[];
}

export function byScreen(
  columns: ColumnEntry[],
  surfaceId: SurfaceId,
  ctx: FixtureCtx,
  only?: string,
): Map<string, ScreenPlan> {
  const out = new Map<string, ScreenPlan>();
  for (const entry of columns) {
    if (only && entry.column !== only) continue;
    for (const s of entry.surfaces) {
      if (s.surface !== surfaceId) continue;

      const plan = out.get(s.screen) ?? { route: routeFor(s.surface, s.screen)(ctx), checks: [] };
      plan.checks.push({
        column: entry.column,
        label: entry.label,
        testid: s.testid,
        row: s.row,
        format: entry.format,
        where: entry.where(ctx),
      });
      out.set(s.screen, plan);
    }
  }
  return out;
}

export function expectedValue(check: Check, dbPath: string): string {
  const [table, col] = check.column.split(".");
  const rows = sql(dbPath, `SELECT "${col}" FROM "${table}" WHERE ${check.where};`);
  if (rows.length === 0) {
    throw new Error(`${check.column} 의 픽스처 행을 찾지 못했습니다: WHERE ${check.where}`);
  }
  const raw = rows[0][0];
  return check.format ? check.format(raw) : String(raw ?? "");
}
