import { v_2a805f, v_4d37e3, type v_dea07e } from "tblnxrbjvhejiddj";

import { v_5401ae } from "xpcpcyatayyxwjmftxi";
import {
  v_e6e000,
  v_4aea06,
  v_ff687d,
  v_182fdb,
  v_b08cc6,
  type v_6edea3,
} from "../lib/rn/session";
import { v_597fc8 } from "../lib/local-db.mjs";
import { v_d308b5 } from "../lib/seed.mjs";

import { v_6eff18 } from "../index/screens";

const v_1441fe = v_597fc8();
const v_a46f12 = v_d308b5(v_1441fe);
if (!v_a46f12 || !v_a46f12.clone) {
  throw new Error(
    "E2E 픽스처가 없습니다 — 먼저 `npm run db:seed` 를 실행하세요.",
  );
}

const v_e11ce9 = Number(process.env.E2E_CLONE_ID ?? v_a46f12.clone.id);

const v_08d446 = v_6eff18("rn-web", "clone-edit")({ userId: v_a46f12.userId, cloneId: v_e11ce9 });

const v_83500a = "e2e-web-";

let session: v_6edea3;

let v_595ec2 = null;

const v_0b13af = Symbol("poll-error") as unknown as string;
let v_cb9570 = null;

async function v_776876(page: v_dea07e, v_9fe22d) {
  await v_4aea06(v_2365e9);

  await v_2365e9.addInitScript(
    ([v_fa53ec, v_21cc31, v_43e90c]) => {
      const v_0eb677 = v_fa53ec as typeof v_e6e000;
      const v_206b88 = globalThis as any;
      v_206b88.localStorage.setItem(v_0eb677.accessToken, v_21cc31 as string);
      if (v_43e90c) v_206b88.localStorage.setItem(v_0eb677.currentUserId, String(v_43e90c));
      v_206b88.localStorage.setItem(v_0eb677.sessionExpiresAt, String(Date.now() + 24 * 60 * 60 * 1000));
    },
    [v_e6e000, v_a3ff5a.accessToken, v_a3ff5a.userId] as const,
  );
  await v_2365e9.goto(v_9fe22d);
}

v_2a805f.describe("RN 웹 — 클론 편집(소개글 왕복)", () => {

  v_2a805f.skip(() => v_2a805f.info().project.name !== "rn-web", "rn-web 프로젝트 전용");

  v_2a805f.describe.configure({ mode: "serial" });

  v_2a805f.beforeAll(async () => {
    v_a3ff5a = await v_182fdb(v_b08cc6());
  });

  v_2a805f("한 줄 소개를 고치면 서버에 반영된다 (개행 포함)", async ({ page: v_2365e9 }) => {

    const v_67cd67 = `${Date.now()}`.slice(-6);
    const v_f60c5d = `${v_83500a}${v_67cd67}\n두 번째 줄`;

    await v_776876(v_2365e9, v_08d446);

    const v_41b99d = v_2365e9.getByTestId(v_5401ae.cloneEdit.descInput);
    const v_054741 = v_2365e9.getByTestId(v_5401ae.cloneEdit.descCounter);

    await v_4d37e3(v_41b99d, "편집 화면에 도달하지 못했습니다. CLONE_ID 소유자와 세션을 확인하세요.").toBeVisible({
      timeout: 60_000,
    });

    await v_41b99d.fill(v_f60c5d);

    await v_4d37e3(v_054741).toHaveText(`${v_f60c5d.length}/500`);

    await v_2365e9.getByTestId(v_5401ae.cloneEdit.save).click();

    await v_4d37e3
      .poll(
        async () => {
          try {
            return await v_ff687d(v_a3ff5a.accessToken, v_e11ce9);
          } catch (v_9e86fd) {
            v_cb9570 = (v_9e86fd as Error).message;
            return v_0b13af; 
          }
        },
        {
          timeout: 20_000,
          intervals: [500, 1000, 2000],
          message:
            "저장 후 서버 값이 새 값으로 바뀌지 않았습니다. " +
            "(조회 자체가 계속 실패했다면 아래 lastPollError 를 볼 것)",
        },
      )
      .toBe(v_f60c5d);

    v_4d37e3(v_cb9570, `서버 조회가 실패했습니다: ${v_cb9570}`).toBeNull();

    v_595ec2 = v_f60c5d; 
  });

  v_2a805f("개행이 D1 왕복에서 살아남는다", async ({ page: v_2365e9 }) => {

    v_2a805f.skip(v_595ec2 === null, "선행 테스트가 실행되지 않아 대조할 값이 없습니다.");

    const v_5885b8 = await v_ff687d(v_a3ff5a.accessToken, v_e11ce9);
    v_4d37e3(v_5885b8, "서버에 저장된 값이 없습니다.").toBe(v_595ec2);
    v_4d37e3(v_5885b8!.split("\n")).toHaveLength(2);

    await v_776876(v_2365e9, v_08d446);
    await v_4d37e3(v_2365e9.getByTestId(v_5401ae.cloneEdit.descInput)).toHaveValue(v_5885b8!, {
      timeout: 60_000,
    });
  });
});
