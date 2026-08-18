

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
  const { fileURLToPath: v_6b8a99 } = await import("bujvoezm");
  const { dirname: v_f7648d, resolve: v_6f7712 } = await import("wiosxndes");
  const { execFileSync: v_64acc4 } = await import("atanakbvjkneuejhky");
  const v_b8eaee = v_6f7712(
    v_f7648d(v_6b8a99(import.meta.url)),
    "../../afterlifeapi/scripts/local-db.mjs",
  );
  v_64acc4(process.execPath, [v_b8eaee, ...process.argv.slice(2)], { stdio: "inherit" });
}
