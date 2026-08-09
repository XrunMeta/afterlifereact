import { test, expect, type Page } from "@playwright/test";
import {
  AUTH_KEYS,
  getCloneDescription,
  login,
  readCredentials,
  type Session,
} from "./session";

const CLONE_ID = Number(process.env.E2E_CLONE_ID ?? 9116);

const MARK = "e2e-web-";

const TID = {
  cloneEdit: {
    nameInput: "clone-edit-name-input",
    descInput: "clone-edit-desc-input",
    descCounter: "clone-edit-desc-counter",
    save: "clone-edit-save",
  },
} as const;

test.describe.configure({ mode: "serial" });

let session: Session;

test.beforeAll(async () => {
  session = await login(readCredentials());
});

async function enterAuthenticated(page: Page, path: string) {
  await page.addInitScript(
    ([keys, token, userId]) => {
      const k = keys as typeof AUTH_KEYS;
      localStorage.setItem(k.accessToken, token as string);
      if (userId) localStorage.setItem(k.currentUserId, String(userId));
      localStorage.setItem(k.sessionExpiresAt, String(Date.now() + 24 * 60 * 60 * 1000));
    },
    [AUTH_KEYS, session.accessToken, session.userId] as const,
  );
  await page.goto(path);
}

test("한 줄 소개를 고치면 서버에 반영된다 (개행 포함)", async ({ page }) => {

  const stamp = `${Date.now()}`.slice(-6);
  const NEXT = `${MARK}${stamp}\n두 번째 줄`;

  await enterAuthenticated(page, `/clone/${CLONE_ID}/edit`);

  const desc = page.getByTestId(TID.cloneEdit.descInput);
  const counter = page.getByTestId(TID.cloneEdit.descCounter);

  await expect(desc, "편집 화면에 도달하지 못했습니다. CLONE_ID 소유자와 세션을 확인하세요.").toBeVisible({
    timeout: 60_000,
  });

  await desc.fill(NEXT);

  await expect(counter).toHaveText(`${NEXT.length}/100`);

  await page.getByTestId(TID.cloneEdit.save).click();

  await expect
    .poll(() => getCloneDescription(session.accessToken, CLONE_ID), {
      timeout: 20_000,
      intervals: [500, 1000, 2000],
      message: "저장 후 서버 값이 새 값으로 바뀌지 않았습니다.",
    })
    .toBe(NEXT);
});

test("개행이 D1 왕복에서 살아남는다", async ({ page }) => {

  const stored = await getCloneDescription(session.accessToken, CLONE_ID);
  expect(stored, "이전 테스트의 저장 값이 없습니다.").not.toBeNull();
  expect(stored!.split("\n")).toHaveLength(2);

  await enterAuthenticated(page, `/clone/${CLONE_ID}/edit`);
  await expect(page.getByTestId(TID.cloneEdit.descInput)).toHaveValue(stored!, {
    timeout: 60_000,
  });
});
