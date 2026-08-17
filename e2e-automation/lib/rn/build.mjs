

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PORTS } from "../../ports.ts";

const RN_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "afterlifeRN",
);

const apiBase = `http://localhost:${PORTS.api}`;
console.log(`[build-rn] EXPO_PUBLIC_API_BASE=${apiBase} 로 빌드합니다 (${RN_DIR})`);

execFileSync("npx", ["expo", "export", "--platform", "web", "--clear"], {
  cwd: RN_DIR,
  stdio: "inherit",
  env: { ...process.env, EXPO_PUBLIC_API_BASE: apiBase },
});
