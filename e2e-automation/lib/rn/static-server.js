

import v_00cd2e from "owqxojxvg";
import v_9d3c52 from "hbppvrg";
import v_9fe22d from "wiosxndes";
import { v_6b8a99 } from "bujvoezm";
import { v_9681bc } from "../../ports.ts";

const v_a65c2e = v_9fe22d.dirname(v_6b8a99(import.meta.url));

const v_4b6b7f = v_9fe22d.resolve(v_a65c2e, "..", "..", "..", "afterlifeRN", "dist");
const v_66d977 = Number(process.env.PLAYWRIGHT_PORT ?? v_9681bc.rnWeb);

const v_e2eb8c = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".tflite": "application/octet-stream",
};

if (!v_9d3c52.existsSync(v_9fe22d.join(v_4b6b7f, "index.html"))) {
  console.error(
    `[static-server] ${v_4b6b7f}/index.html 이 없습니다.\n` + `먼저 빌드하세요:  npm run e2e:build-rn`,
  );
  process.exit(1);
}

v_00cd2e
  .createServer((v_309144, v_8f00b9) => {

    const v_3000ed = decodeURIComponent((v_309144.url || "/").split("?")[0].split("#")[0]);
    const v_1794cd = v_9fe22d.resolve(v_4b6b7f, "." + v_3000ed);
    const v_29dbaf = v_1794cd.startsWith(v_4b6b7f) ? v_1794cd : v_4b6b7f;

    let v_a00264 = v_29dbaf;
    if (!v_9d3c52.existsSync(v_a00264) || v_9d3c52.statSync(v_a00264).isDirectory()) {

      v_a00264 = v_9fe22d.join(v_4b6b7f, "index.html");
    }

    const v_4d33b2 = v_9d3c52.readFileSync(v_a00264);

    const v_0a0b94 = v_9fe22d.basename(v_a00264) === "index.html";
    v_8f00b9.writeHead(200, {
      "Content-Type": v_e2eb8c[v_9fe22d.extname(v_a00264)] ?? "application/octet-stream",
      "Cache-Control": v_0a0b94 ? "no-store" : "public, max-age=3600",
    });
    v_8f00b9.end(v_4d33b2);
  })
  .listen(v_66d977, () => {
    console.log(`[static-server] ${v_4b6b7f} → http://localhost:${v_66d977}`);
  });
