

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { sql } from "./local-db.mjs";

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
  { re: /(?:data-testid|testID)\s*=\s*["']([^"']+)["']/g, prefix: false },
  { re: /(?:data-testid|testID)\s*=\s*\{\s*`([^`$]+)\$\{/g, prefix: true },

  { re: /(?:data-testid|testID)\s*=\s*\{\s*`([^`$]+)`\s*\}/g, prefix: false },
];

export function scanSourceIds(dirs) {
  const out = [];
  for (const dir of dirs) {
    let ok = true;
    try { ok = statSync(dir).isDirectory(); } catch { ok = false; }
    if (!ok) continue;
    for (const file of walkFiles(dir)) {
      const text = readFileSync(file, "utf8");
      for (const { re, prefix } of PATTERNS) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text))) {
          const line = text.slice(0, m.index).split("\n").length;

          const value = prefix ? m[1].replace(/-$/, "") : m[1];
          out.push({ value, file, line });
        }
      }
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

export function ruleIdsIndexed(tid, columns, exemptions) {
  const used = new Set();
  for (const c of columns) {
    for (const s of c.surfaces) {
      used.add(s.testid);
      if (s.row?.containerTestid) used.add(s.row.containerTestid);
    }
  }
  const violations = [];
  for (const id of collectIds(tid)) {
    if (used.has(id)) continue;
    const reason = exemptions[id];

    if (typeof reason === "string" && reason.trim().length > 0) continue;
    violations.push(
      `[규칙2] 인덱스에 연결되지 않은 식별자 "${id}"\n` +
        `        e2e-automation/index/columns.ts 에 컬럼을 추가하거나,\n` +
        `        exemptions 에 **사유**와 함께 면제하세요 (빈 사유는 면제로 인정하지 않습니다).`,
    );
  }
  return violations;
}

const SQL_IDENTIFIER = /^[A-Za-z_]\w*$/;

export function ruleColumnsExist(columns, dbPath) {
  const violations = [];
  for (const c of columns) {
    const [table, col] = c.column.split(".");
    if (!table || !col) {
      violations.push(`[규칙3] 형식이 "테이블.컬럼" 이 아닙니다: "${c.column}"`);
      continue;
    }
    if (!SQL_IDENTIFIER.test(table) || !SQL_IDENTIFIER.test(col)) {
      violations.push(
        `[규칙3] "${c.column}" 의 테이블·컬럼 이름에 허용되지 않는 문자가 있습니다\n` +
          `        영문/숫자/밑줄만 허용합니다(SQL 에 그대로 꽂히므로 인젝션 방지).`,
      );
      continue;
    }
    try {
      const rows = sql(dbPath, `SELECT count(*) FROM pragma_table_info('${table}') WHERE name='${col}';`);
      const count = rows[0]?.[0];
      if (count !== "1") {
        violations.push(
          `[규칙3] 실제 스키마에 없는 컬럼 "${c.column}"\n` +
            `        마이그 추적 테이블이 아니라 pragma_table_info 로 확인했습니다.\n` +
            `        컬럼명이 바뀌었거나 오타입니다.`,
        );
      }
    } catch (err) {

      const cause = err instanceof Error ? err.message : String(err);
      violations.push(
        `[규칙3] "${c.column}" 존재 확인 자체가 실패했습니다: ${cause}\n` +
          `        sqlite3 실행 파일이 있는지, DB 경로가 올바른지 확인하세요: ${dbPath}`,
      );
    }
  }
  return violations;
}

import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolvePath(process.argv[1])).href;

if (isMain) {
  const { TID } = await import("@afterlife/test-ids");
  const { COLUMNS } = await import("../index/columns.ts");
  const { EXEMPTIONS } = await import("../index/exemptions.ts");
  const { resolveLocalD1 } = await import("./local-db.mjs");

  const SOURCE_DIRS = process.argv.slice(2).length ? process.argv.slice(2) : ["afterlifeadmin/src", "afterlifeRN/src"];
  const violations = [
    ...ruleLiteralsRegistered(TID, SOURCE_DIRS),
    ...ruleIdsIndexed(TID, COLUMNS, EXEMPTIONS),
    ...ruleColumnsExist(COLUMNS, resolveLocalD1()),
  ];

  if (violations.length) {
    console.error(`검사기 위반 ${violations.length}건:\n`);
    console.error(violations.join("\n\n"));
    process.exit(1);
  }
  console.log(`검사기 통과 — 식별자 ${collectIds(TID).size}개 · 컬럼 ${COLUMNS.length}개`);
}
