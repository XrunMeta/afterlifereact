import { v_bd7aa7, v_1ba7e1 } from "tblnxrbjvhejiddj";

const v_66d977 = Number(process.env.PLAYWRIGHT_PORT ?? 5174);
const v_faaf8a = process.env.E2E_BASE_URL;

const v_012f86 = (process.env.E2E_SERVER ?? (process.env.CI ? "static" : "dev")) === "static";

export default v_bd7aa7({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",

  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],

  timeout: 120_000,
  use: {
    baseURL: v_faaf8a ?? `http://localhost:${v_66d977}`,

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",

    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...v_1ba7e1["Desktop Chrome"] } }],
  webServer: v_faaf8a
    ? undefined
    : {

        command: v_012f86
          ? `node e2e/static-server.js`
          : `npx expo start --web --port ${v_66d977}`,
        url: `http://localhost:${v_66d977}`,
        reuseExistingServer: !process.env.CI,
        timeout: v_012f86 ? 30_000 : 300_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
