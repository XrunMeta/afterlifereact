

export {
  API_DIR,
  MIGRATIONS_DIR,
  SNAPSHOT_DIR,
  migrationFiles,
  sql,
  stampMarker,
  resolveLocalD1,
  assertLocal,
  migrationStatus,
  listCandidates,
} from "../../afterlifeapi/scripts/local-db.mjs";

if (process.argv[1] && process.argv[1].endsWith("local-db.mjs")) {
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const canonical = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../afterlifeapi/scripts/local-db.mjs",
  );
  execFileSync(process.execPath, [canonical, ...process.argv.slice(2)], { stdio: "inherit" });
}
