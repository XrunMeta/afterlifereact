

import { test, expect } from "@playwright/test";
import { COLUMNS } from "../index/columns";
import { byScreen, expectedValue } from "../lib/runner";
import { rowId } from "@afterlife/test-ids";
import { resolveLocalD1 } from "../lib/local-db.mjs";
import { FIXTURE, status } from "../lib/seed.mjs";
import { adminAccessToken, type AdminSession } from "../lib/auth";
import { PORTS } from "../ports";

const DB = resolveLocalD1();
const ONLY = process.env.E2E_COLUMN;

const fixture = status(DB);
if (!fixture || !fixture.clone) {
  throw new Error(
    "E2E 픽스처가 없습니다 — 먼저 `npm run db:seed` 를 실행하세요.",
  );
}
const ctx = { userId: fixture.userId, cloneId: fixture.clone.id };

const API_BASE = `http://localhost:${PORTS.api}`;

const ADMIN_TOKEN_KEY = "afterlife.admin.token";
const ADMIN_REFRESH_KEY = "afterlife.admin.refresh";
const ADMIN_PROFILE_KEY = "afterlife.admin.profile";

test.describe.configure({ mode: "serial" });

test.describe("어드민 — 컬럼 값", () => {

  test.skip(() => test.info().project.name !== "admin", "admin 프로젝트 전용");

  let adminSession: AdminSession;
  test.beforeAll(async () => {
    adminSession = await adminAccessToken(API_BASE, FIXTURE.admin.email, FIXTURE.admin.password);
  });

  for (const [screen, plan] of byScreen(COLUMNS, "admin", ctx, ONLY)) {
    test(`${screen} — ${plan.checks.map((c) => c.column).join(", ")}`, async ({ page }) => {

      await page.addInitScript(
        ([tokenKey, refreshKey, profileKey, accessToken, refreshToken, profile]) => {
          const g = globalThis as any;
          g.localStorage.setItem(tokenKey, accessToken);
          g.localStorage.setItem(refreshKey, refreshToken);
          g.localStorage.setItem(profileKey, JSON.stringify(profile));
        },
        [
          ADMIN_TOKEN_KEY,
          ADMIN_REFRESH_KEY,
          ADMIN_PROFILE_KEY,
          adminSession.accessToken,
          adminSession.refreshToken,
          adminSession.admin,
        ] as const,
      );

      await page.goto(plan.route);
      for (const check of plan.checks) {
        const expected = expectedValue(check, DB);

        const scope = check.row
          ? page.getByTestId(rowId(check.row.containerTestid, ctx[check.row.idFrom]))
          : page;
        await expect(
          scope.getByTestId(check.testid),
          `${check.column} (${check.label}) — ${screen} 화면`,
        ).toHaveText(expected);
      }
    });
  }
});
