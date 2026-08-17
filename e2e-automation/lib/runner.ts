

import type { v_df31fc, v_4ba6cc, v_fb686a, v_86b929 } from "../index/types";
import { v_6eff18 } from "../index/screens";
import { v_f8df46 } from "./local-db.mjs";

export interface Check {
  column: string;
  label: string;
  testid: string;

  row?: v_fb686a;
  format?: (v: unknown) => string;
  where: string;
}

export interface ScreenPlan {
  route: string;
  checks: Check[];
}

export function v_fe677f(
  columns: v_df31fc[],
  surfaceId: v_86b929,
  ctx: v_4ba6cc,
  v_78c274,
): Map<string, ScreenPlan> {
  const v_8d4337 = new Map<string, ScreenPlan>();
  for (const v_2b8338 of v_b9fa58) {
    if (v_78c274 && v_2b8338.column !== v_78c274) continue;
    for (const v_fd5f43 of v_2b8338.surfaces) {
      if (v_fd5f43.surface !== v_3c4c85) continue;

      const v_770f2e = v_8d4337.get(v_fd5f43.screen) ?? { route: v_6eff18(v_fd5f43.surface, v_fd5f43.screen)(v_16e2dd), checks: [] };
      v_770f2e.checks.push({
        column: v_2b8338.column,
        label: v_2b8338.label,
        testid: v_fd5f43.testid,
        row: v_fd5f43.row,
        format: v_2b8338.format,
        where: v_2b8338.where(v_16e2dd),
      });
      v_8d4337.set(v_fd5f43.screen, v_770f2e);
    }
  }
  return v_8d4337;
}

export function v_b0ea06(v_de130a, v_fdef12): string {
  const [v_cb9428, v_c8b83f] = v_de130a.column.split(".");
  const v_18b8bf = v_f8df46(v_fdef12, `SELECT "${v_c8b83f}" FROM "${v_cb9428}" WHERE ${v_de130a.where};`);
  if (v_18b8bf.length === 0) {
    throw new Error(`${v_de130a.column} 의 픽스처 행을 찾지 못했습니다: WHERE ${v_de130a.where}`);
  }
  const v_479f05 = v_18b8bf[0][0];
  return v_de130a.format ? v_de130a.format(v_479f05) : String(v_479f05 ?? "");
}
