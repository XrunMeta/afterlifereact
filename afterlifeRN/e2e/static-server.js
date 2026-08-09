

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 5174);

const MIME = {
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

if (!fs.existsSync(path.join(ROOT, "index.html"))) {
  console.error(
    `[static-server] ${ROOT}/index.html 이 없습니다.\n` +
      `먼저 빌드하세요:  npx expo export --platform web`,
  );
  process.exit(1);
}

http
  .createServer((req, res) => {

    const urlPath = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
    const resolved = path.resolve(ROOT, "." + urlPath);
    const safe = resolved.startsWith(ROOT) ? resolved : ROOT;

    let filePath = safe;
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {

      filePath = path.join(ROOT, "index.html");
    }

    const body = fs.readFileSync(filePath);

    const isEntry = path.basename(filePath) === "index.html";
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath)] ?? "application/octet-stream",
      "Cache-Control": isEntry ? "no-store" : "public, max-age=3600",
    });
    res.end(body);
  })
  .listen(PORT, () => {
    console.log(`[static-server] ${ROOT} → http://localhost:${PORT}`);
  });
