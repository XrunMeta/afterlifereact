import { defineConfig } from "@playwright/test";
import { PORTS } from "./e2e-automation/ports";

export default defineConfig({
  testDir: "e2e-automation/flows",
  outputDir: "e2e-automation/runs/last-failures",
  globalSetup: "./e2e-automation/global-setup.ts",
  forbidOnly: !!process.env.CI,
  workers: 1, 
  timeout: 120_000, 
  reporter: [["list"]], 
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "admin", use: { baseURL: `http://localhost:${PORTS.admin}` } },
    { name: "rn-web", use: { baseURL: `http://localhost:${PORTS.rnWeb}` } },
  ],
});
