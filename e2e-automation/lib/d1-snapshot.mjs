

import { execFileSync } from "node:child_process";
import { readdirSync, mkdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveLocalD1, sql, SNAPSHOT_DIR } from "./local-db.mjs";

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

const KEEP = Number(process.env.KEEP ?? 3);
const PREFIX = "local-d1_";
const KEEP_PREFIX = "keep-";

function kstStamp() {
  const s = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }); 
  return s.replace(/[-:]/g, "").replace(" ", "-") + "KST";
}

function rotatable() {
  return readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.startsWith(PREFIX) && f.endsWith(".sqlite"))
    .map((f) => ({ name: f, mtime: statSync(join(SNAPSHOT_DIR, f)).mtimeMs }))
    .sort((a, b) => a.mtime - b.mtime);
}

export function rotate(keep = KEEP) {
  const all = rotatable();
  const doomed = all.slice(0, Math.max(0, all.length - keep));
  for (const { name } of doomed) {
    for (const suffix of ["", "-wal", "-shm"]) {
      const p = join(SNAPSHOT_DIR, name + suffix);
      if (existsSync(p)) unlinkSync(p);
    }
    console.log(`  회전 삭제: ${name}`);
  }
  if (doomed.length === 0) console.log(`  회전 삭제: 없음 (보관 ${all.length}/${keep})`);
  return doomed.length;
}

export function snapshot(reason = "manual") {
  if (!existsSync(SNAPSHOT_DIR)) mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const src = resolveLocalD1();
  const safeReason = reason.replace(/[^A-Za-z0-9._-]/g, "-");
  const name = `${PREFIX}${kstStamp()}_${safeReason}.sqlite`;
  const dest = join(SNAPSHOT_DIR, name);

  execFileSync("sqlite3", [src, `.backup '${dest}'`], { stdio: ["ignore", "pipe", "pipe"] });
  execFileSync(
    "sqlite3",
    [dest, "PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode=DELETE;"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  const srcTables = Number(sql(src, "SELECT count(*) FROM sqlite_master WHERE type='table';")[0][0]);
  const dstTables = Number(sql(dest, "SELECT count(*) FROM sqlite_master WHERE type='table';")[0][0]);
  if (srcTables !== dstTables) {
    throw new Error(`스냅샷 검증 실패: 원본 테이블 ${srcTables}개 vs 스냅샷 ${dstTables}개`);
  }

  for (const suffix of ["-wal", "-shm"]) {
    const p = dest + suffix;
    if (existsSync(p)) unlinkSync(p);
  }

  const mb = (statSync(dest).size / 1024 / 1024).toFixed(1);
  console.log(`스냅샷: d1-snapshots/${name}  (${mb}MB · 테이블 ${dstTables}개 일치 ✅)`);
  return dest;
}

export function list() {
  if (!existsSync(SNAPSHOT_DIR)) return console.log("d1-snapshots/ 없음");
  const files = readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".sqlite"))
    .sort();
  if (files.length === 0) return console.log("보관된 스냅샷 없음");
  for (const f of files) {
    const mb = (statSync(join(SNAPSHOT_DIR, f)).size / 1024 / 1024).toFixed(1);
    const kept = f.startsWith(KEEP_PREFIX) ? " [회전 제외]" : "";
    console.log(`  ${mb.padStart(6)}MB  ${f}${kept}`);
  }
}

if (isMain) {
  const argv = process.argv.slice(2);
  if (argv.includes("--list")) list();
  else if (argv.includes("--rotate")) rotate();
  else {
    snapshot(argv.find((a) => !a.startsWith("--")) ?? "manual");
    rotate();
    list();
  }
}
