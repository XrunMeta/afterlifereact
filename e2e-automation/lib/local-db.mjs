

import { execFileSync } from "node:child_process";
import { readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, "..", "..");
export const API_DIR = join(REPO_ROOT, "afterlifeapi");
export const MIGRATIONS_DIR = join(API_DIR, "migrations");
export const SNAPSHOT_DIR = join(REPO_ROOT, "d1-snapshots");
const D1_DIR = join(API_DIR, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");

const SEP = String.fromCharCode(31);

const MARKER = "_local_db_marker";

export function migrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export function sql(dbPath, statement) {
  const out = execFileSync("sqlite3", ["-noheader", "-separator", SEP, dbPath, statement], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return out
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => l.split(SEP));
}

export function stampMarker() {
  execFileSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "afterlife-db-preview",
      "--local",
      "--command",
      `CREATE TABLE IF NOT EXISTS ${MARKER} (note TEXT); ` +
        `DELETE FROM ${MARKER}; ` +
        `INSERT INTO ${MARKER} (note) VALUES ('wrangler --local 이 실제로 쓰는 DB');`,
    ],
    { cwd: API_DIR, env: { ...process.env, CI: "true" }, stdio: "ignore" },
  );
}

function markedCandidates() {
  const out = [];
  for (const f of readdirSync(D1_DIR)) {
    if (!f.endsWith(".sqlite") || f === "metadata.sqlite") continue;
    const p = join(D1_DIR, f);
    if (statSync(p).size === 0) continue; 
    try {
      if (Number(sql(p, `SELECT count(*) FROM ${MARKER};`)[0]?.[0]) > 0) out.push(p);
    } catch {

    }
  }
  return out;
}

export function resolveLocalD1({ autoStamp = true } = {}) {
  if (!existsSync(D1_DIR)) {
    throw new Error(
      `로컬 D1 디렉터리가 없습니다: ${D1_DIR}\n먼저 'npm run db:migrate:local' 을 한 번 돌리세요.`,
    );
  }
  let found = markedCandidates();
  if (found.length === 0 && autoStamp) {
    console.error(`[local-db] 마커가 없습니다 — wrangler 로 ${MARKER} 를 찍습니다…`);
    stampMarker();
    found = markedCandidates();
  }
  if (found.length === 0) {
    const all = readdirSync(D1_DIR).filter((f) => f.endsWith(".sqlite"));
    throw new Error(
      `${D1_DIR} 안에서 로컬 D1 을 찾지 못했습니다(마커 ${MARKER} 없음).\n` +
        `후보 파일: ${all.join(", ") || "(없음)"}`,
    );
  }
  if (found.length > 1) {
    throw new Error(
      `마커가 찍힌 파일이 ${found.length}개입니다 — 자동 선택하지 않습니다:\n` +
        found.map((p) => `  ${p}`).join("\n"),
    );
  }
  return assertLocal(found[0]);
}

export function assertLocal(dbPath) {
  const marker = join(".wrangler", "state", "v3", "d1");
  if (!dbPath.includes(marker)) throw new Error(`로컬 D1 이 아닙니다 (${marker} 밖): ${dbPath}`);
  return dbPath;
}

export function migrationStatus(dbPath) {
  const files = migrationFiles();
  const recorded = new Set(sql(dbPath, "SELECT name FROM d1_migrations;").map((r) => r[0]));
  return {
    total: files.length,
    recorded: recorded.size,
    pending: files.filter((f) => !recorded.has(f)),
    ghost: [...recorded].filter((n) => !files.includes(n)),
  };
}

export function listCandidates() {
  const known = new Set(migrationFiles());
  return readdirSync(D1_DIR)
    .filter((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite")
    .map((f) => {
      const p = join(D1_DIR, f);

      let names = [];
      try {
        names = sql(p, "SELECT name FROM d1_migrations;").map((r) => r[0]);
      } catch {

      }
      return {
        path: p,
        size: statSync(p).size,
        applied: names.length,
        latest: names.filter((n) => known.has(n)).sort().pop() ?? "(없음)",
      };
    });
}

if (isMain) {
  const argv = process.argv.slice(2);
  if (argv.includes("--candidates")) {
    for (const c of listCandidates()) {
      console.log(
        `${(c.size / 1024 / 1024).toFixed(1)}MB · 마이그 ${c.applied}개 · 최신 ${c.latest}\n      ${c.path}`,
      );
    }
  } else if (argv.includes("--status")) {
    const db = resolveLocalD1();
    const s = migrationStatus(db);
    console.log(`DB      : ${db}`);
    console.log(`마이그  : 파일 ${s.total} / 기록 ${s.recorded}`);
    console.log(`미적용  : ${s.pending.length ? s.pending.join(", ") : "없음"}`);
    console.log(`유령기록: ${s.ghost.length ? s.ghost.join(", ") : "없음"}`);
    if (s.pending.length) {
      console.error(`\n미적용 마이그가 있습니다 → npm run db:migrate:local`);
      process.exit(1);
    }
  } else if (argv[0] && !argv[0].startsWith("--")) {

    const db = resolveLocalD1();
    process.stdout.write(execFileSync("sqlite3", ["-header", "-box", db, argv[0]], { encoding: "utf8" }));
  } else {
    console.log(resolveLocalD1());
  }
}
