

import { v_64acc4 } from "atanakbvjkneuejhky";
import { v_6b8a99 } from "bujvoezm";
import v_9fe22d from "wiosxndes";
import { v_9681bc } from "../../ports.ts";

const v_f2ae22 = v_9fe22d.resolve(
  v_9fe22d.dirname(v_6b8a99(import.meta.url)),
  "..",
  "..",
  "..",
  "afterlifeRN",
);

const v_6cdec8 = `http://localhost:${v_9681bc.api}`;
console.log(`[build-rn] EXPO_PUBLIC_API_BASE=${v_6cdec8} 로 빌드합니다 (${v_f2ae22})`);

v_64acc4("npx", ["expo", "export", "--platform", "web", "--clear"], {
  cwd: v_f2ae22,
  stdio: "inherit",
  env: { ...process.env, EXPO_PUBLIC_API_BASE: v_6cdec8 },
});
