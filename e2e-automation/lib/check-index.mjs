

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);
const SKIP_DIR = new Set(["node_modules", ".git", "dist", "build", ".expo", "web-stubs"]);

export function collectIds(tid) {
  const out = new Set();
  const walk = (o) => {
    for (const v of Object.values(o)) {
      if (typeof v === "string") out.add(v);
      else if (v && typeof v === "object") walk(v);
    }
  };
  walk(tid);
  return out;
}

function* walkFiles(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIR.has(e.name)) continue;
      yield* walkFiles(join(dir, e.name));
    } else if (SOURCE_EXT.has(extname(e.name))) {
      yield join(dir, e.name);
    }
  }
}

const PATTERNS = [
  /(?:data-testid|testID)\s*=\s*["']([^"']+)["']/g,
  /(?:data-testid|testID)\s*=\s*\{\s*`([^`$]+)\$\{/g,
];

export function scanSourceIds(dirs) {
  const out = [];
  for (const dir of dirs) {
    let ok = true;
    try { ok = statSync(dir).isDirectory(); } catch { ok = false; }
    if (!ok) continue;
    for (const file of walkFiles(dir)) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        for (const re of PATTERNS) {
          re.lastIndex = 0;
          let m;
          while ((m = re.exec(line))) {

            out.push({ value: m[1].replace(/-$/, ""), file, line: i + 1 });
          }
        }
      });
    }
  }
  return out;
}

export function ruleLiteralsRegistered(tid, dirs) {
  const known = collectIds(tid);
  return scanSourceIds(dirs)
    .filter((f) => !known.has(f.value))
    .map(
      (f) =>
        `[규칙1] 패키지에 없는 식별자 "${f.value}" — ${f.file}:${f.line}\n` +
        `        packages/test-ids/src/index.ts 에 추가하거나, 소스에서 TID 를 import 해 쓰세요.`,
    );
}

import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolvePath(process.argv[1])).href;

if (isMain) {
  const { TID } = await import("@afterlife/test-ids");
  const SOURCE_DIRS = ["afterlifeadmin/src", "afterlifeRN/src"];
  const violations = ruleLiteralsRegistered(TID, SOURCE_DIRS);
  if (violations.length) {
    console.error(`검사기 위반 ${violations.length}건:\n`);
    console.error(violations.join("\n\n"));
    process.exit(1);
  }
  console.log(`검사기 통과 — 식별자 ${collectIds(TID).size}개`);
}
