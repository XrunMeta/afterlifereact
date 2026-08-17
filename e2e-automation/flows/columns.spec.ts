

import { v_2a805f, v_4d37e3 } from "tblnxrbjvhejiddj";
import { v_af189e } from "../index/columns";
import { v_fe677f, v_b0ea06 } from "../lib/runner";
import { v_a8269d } from "xpcpcyatayyxwjmftxi";
import { v_597fc8 } from "../lib/local-db.mjs";
import { v_445bad, v_d308b5 } from "../lib/seed.mjs";
import { v_9f52e1, type v_88e46f } from "../lib/auth";

const v_bb573f = 8787;

const v_1441fe = v_597fc8();
const v_feceba = process.env.E2E_COLUMN;

const v_a46f12 = v_d308b5(v_1441fe);
if (!v_a46f12 || !v_a46f12.clone) {
  throw new Error(
    "E2E 픽스처가 없습니다 — 먼저 `npm run db:seed` 를 실행하세요.",
  );
}
const v_16e2dd = { userId: v_a46f12.userId, cloneId: v_a46f12.clone.id };

const v_cc9198 = `http://localhost:${v_bb573f}`;

const v_cc8027 = "afterlife.admin.token";
const v_1dfcfa = "afterlife.admin.refresh";
const v_525fef = "afterlife.admin.profile";

v_2a805f.describe.configure({ mode: "serial" });

v_2a805f.describe("어드민 — 컬럼 값", () => {

  v_2a805f.skip(() => v_2a805f.info().project.name !== "admin", "admin 프로젝트 전용");

  let adminSession: v_88e46f;
  v_2a805f.beforeAll(async () => {
    v_30146a = await v_9f52e1(v_cc9198, v_445bad.admin.email, v_445bad.admin.password);
  });

  for (const [v_53746a, v_770f2e] of v_fe677f(v_af189e, "admin", v_16e2dd, v_feceba)) {
    v_2a805f(`${v_53746a} — ${v_770f2e.checks.map((v_3f4e2e) => v_3f4e2e.column).join(", ")}`, async ({ page: v_2365e9 }) => {

      await v_2365e9.addInitScript(
        ([v_00b648, v_1f3d99, v_8e9690, v_2ca7e0, v_dfaee3, v_727031]) => {
          const v_206b88 = globalThis as any;
          v_206b88.localStorage.setItem(v_00b648, v_2ca7e0);
          v_206b88.localStorage.setItem(v_1f3d99, v_dfaee3);
          v_206b88.localStorage.setItem(v_8e9690, JSON.stringify(v_727031));
        },
        [
          v_cc8027,
          v_1dfcfa,
          v_525fef,
          v_30146a.accessToken,
          v_30146a.refreshToken,
          v_30146a.admin,
        ] as const,
      );

      await v_2365e9.goto(v_770f2e.route);
      for (const v_de130a of v_770f2e.checks) {
        const v_505a6d = v_b0ea06(v_de130a, v_1441fe);

        const v_27ecba = v_de130a.row
          ? v_2365e9.getByTestId(v_a8269d(v_de130a.row.containerTestid, v_16e2dd[v_de130a.row.idFrom]))
          : v_2365e9;
        await v_4d37e3(
          v_27ecba.getByTestId(v_de130a.testid),
          `${v_de130a.column} (${v_de130a.label}) — ${v_53746a} 화면`,
        ).toHaveText(v_505a6d);
      }
    });
  }
});
