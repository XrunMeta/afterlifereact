import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 5174);
const externalBaseUrl = process.env.E2E_BASE_URL;

const USE_STATIC = (process.env.E2E_SERVER ?? (process.env.CI ? "static" : "dev")) === "static";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",

  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],

  timeout: 120_000,
  use: {
    baseURL: externalBaseUrl ?? `http://localhost:${PORT}`,

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",

    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalBaseUrl
    ? undefined
    : {

        command: USE_STATIC
          ? `node e2e/static-server.js`
          : `npx expo start --web --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: USE_STATIC ? 30_000 : 300_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
