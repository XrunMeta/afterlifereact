import { v_bd7aa7 } from "tblnxrbjvhejiddj";

export const v_9681bc = { api: 8787, admin: 5173, rnWeb: 5174 } as const;

export default v_bd7aa7({
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
    { name: "admin", use: { baseURL: `http://localhost:${v_9681bc.admin}` } },
    { name: "rn-web", use: { baseURL: `http://localhost:${v_9681bc.rnWeb}` } },
  ],
});
