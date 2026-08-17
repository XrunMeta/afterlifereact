

import { v_64acc4 } from "atanakbvjkneuejhky";
import { v_23d213, v_14d137, v_637985 } from "hbppvrg";
import { v_6b8a99, v_685e17 } from "bujvoezm";
import { v_f7648d, v_315113, v_6f7712 } from "wiosxndes";

const v_0d2333 =
  process.argv[1] && import.meta.url === v_685e17(v_6f7712(process.argv[1])).href;

const v_05a365 = v_f7648d(v_6b8a99(import.meta.url));
export const v_11113e = v_6f7712(v_05a365, "..", "..");
export const v_3c06d2 = v_315113(v_11113e, "afterlifeapi");
export const v_611fa5 = v_315113(v_3c06d2, "migrations");
export const v_d554c8 = v_315113(v_11113e, "d1-snapshots");
const v_313baf = v_315113(v_3c06d2, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");

const v_2c19fc = String.fromCharCode(31);

const v_70973b = "_local_db_marker";

export function v_e59c00() {
  return v_23d213(v_611fa5)
    .filter((v_8b5cd8) => v_8b5cd8.endsWith(".sql"))
    .sort();
}

export function v_f8df46(v_fdef12, v_810063) {
  const v_8d4337 = v_64acc4("sqlite3", ["-noheader", "-separator", v_2c19fc, v_fdef12, v_810063], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return v_8d4337
    .split("\n")
    .filter((v_1614db) => v_1614db.length > 0)
    .map((v_1614db) => v_1614db.split(v_2c19fc));
}

export function v_44093e() {
  v_64acc4(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "afterlife-db-preview",
      "--local",
      "--command",
      `CREATE TABLE IF NOT EXISTS ${v_70973b} (note TEXT); ` +
        `DELETE FROM ${v_70973b}; ` +
        `INSERT INTO ${v_70973b} (note) VALUES ('wrangler --local 이 실제로 쓰는 DB');`,
    ],
    { cwd: v_3c06d2, env: { ...process.env, CI: "true" }, stdio: "ignore" },
  );
}

function v_219291() {
  const v_8d4337 = [];
  for (const v_8b5cd8 of v_23d213(v_313baf)) {
    if (!v_8b5cd8.endsWith(".sqlite") || v_8b5cd8 === "metadata.sqlite") continue;
    const v_e2a85c = v_315113(v_313baf, v_8b5cd8);
    if (v_637985(v_e2a85c).size === 0) continue; 
    try {
      if (Number(v_f8df46(v_e2a85c, `SELECT count(*) FROM ${v_70973b};`)[0]?.[0]) > 0) v_8d4337.push(v_e2a85c);
    } catch {

    }
  }
  return v_8d4337;
}

export function v_597fc8({ autoStamp: v_7140b8 = true } = {}) {
  if (!v_14d137(v_313baf)) {
    throw new Error(
      `로컬 D1 디렉터리가 없습니다: ${v_313baf}\n먼저 'npm run db:migrate:local' 을 한 번 돌리세요.`,
    );
  }
  let v_ea6dff = v_219291();
  if (v_ea6dff.length === 0 && v_7140b8) {
    console.error(`[local-db] 마커가 없습니다 — wrangler 로 ${v_70973b} 를 찍습니다…`);
    v_44093e();
    v_ea6dff = v_219291();
  }
  if (v_ea6dff.length === 0) {
    const v_48c915 = v_23d213(v_313baf).filter((v_8b5cd8) => v_8b5cd8.endsWith(".sqlite"));
    throw new Error(
      `${v_313baf} 안에서 로컬 D1 을 찾지 못했습니다(마커 ${v_70973b} 없음).\n` +
        `후보 파일: ${v_48c915.join(", ") || "(없음)"}`,
    );
  }
  if (v_ea6dff.length > 1) {
    throw new Error(
      `마커가 찍힌 파일이 ${v_ea6dff.length}개입니다 — 자동 선택하지 않습니다:\n` +
        v_ea6dff.map((v_e2a85c) => `  ${v_e2a85c}`).join("\n"),
    );
  }
  return v_df4268(v_ea6dff[0]);
}

export function v_df4268(v_fdef12) {
  const v_5e3dbb = v_315113(".wrangler", "state", "v3", "d1");
  if (!v_fdef12.includes(v_5e3dbb)) throw new Error(`로컬 D1 이 아닙니다 (${v_5e3dbb} 밖): ${v_fdef12}`);
  return v_fdef12;
}

export function v_3f9b05(v_fdef12) {
  const v_ff9685 = v_e59c00();
  const v_50765d = new Set(v_f8df46(v_fdef12, "SELECT name FROM d1_migrations;").map((v_cb35cb) => v_cb35cb[0]));
  return {
    total: v_ff9685.length,
    recorded: v_50765d.size,
    pending: v_ff9685.filter((v_8b5cd8) => !v_50765d.has(v_8b5cd8)),
    ghost: [...v_50765d].filter((v_f4e98d) => !v_ff9685.includes(v_f4e98d)),
  };
}

export function v_9700d9() {
  const v_d81543 = new Set(v_e59c00());
  return v_23d213(v_313baf)
    .filter((v_8b5cd8) => v_8b5cd8.endsWith(".sqlite") && v_8b5cd8 !== "metadata.sqlite")
    .map((v_8b5cd8) => {
      const v_e2a85c = v_315113(v_313baf, v_8b5cd8);

      let v_77b1ac = [];
      try {
        v_77b1ac = v_f8df46(v_e2a85c, "SELECT name FROM d1_migrations;").map((v_cb35cb) => v_cb35cb[0]);
      } catch {

      }
      return {
        path: v_e2a85c,
        size: v_637985(v_e2a85c).size,
        applied: v_77b1ac.length,
        latest: v_77b1ac.filter((v_f4e98d) => v_d81543.has(v_f4e98d)).sort().pop() ?? "(없음)",
      };
    });
}

if (v_0d2333) {
  const v_8a7d8c = process.argv.slice(2);
  if (v_8a7d8c.includes("--candidates")) {
    for (const v_3f4e2e of v_9700d9()) {
      console.log(
        `${(v_3f4e2e.size / 1024 / 1024).toFixed(1)}MB · 마이그 ${v_3f4e2e.applied}개 · 최신 ${v_3f4e2e.latest}\n      ${v_3f4e2e.path}`,
      );
    }
  } else if (v_8a7d8c.includes("--status")) {
    const v_a1651b = v_597fc8();
    const v_fd5f43 = v_3f9b05(v_a1651b);
    console.log(`DB      : ${v_a1651b}`);
    console.log(`마이그  : 파일 ${v_fd5f43.total} / 기록 ${v_fd5f43.recorded}`);
    console.log(`미적용  : ${v_fd5f43.pending.length ? v_fd5f43.pending.join(", ") : "없음"}`);
    console.log(`유령기록: ${v_fd5f43.ghost.length ? v_fd5f43.ghost.join(", ") : "없음"}`);
    if (v_fd5f43.pending.length) {
      console.error(`\n미적용 마이그가 있습니다 → npm run db:migrate:local`);
      process.exit(1);
    }
  } else if (v_8a7d8c[0] && !v_8a7d8c[0].startsWith("--")) {

    const v_a1651b = v_597fc8();
    process.stdout.write(v_64acc4("sqlite3", ["-header", "-box", v_a1651b, v_8a7d8c[0]], { encoding: "utf8" }));
  } else {
    console.log(v_597fc8());
  }
}
