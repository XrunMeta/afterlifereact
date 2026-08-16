

import { v_64acc4 } from "atanakbvjkneuejhky";
import { v_23d213, v_eaee41, v_14d137, v_637985, v_e6aa20 } from "hbppvrg";
import { v_315113, v_6f7712 } from "wiosxndes";
import { v_685e17 } from "bujvoezm";
import { v_597fc8, v_f8df46, v_d554c8 } from "./local-db.mjs";

const v_0d2333 =
  process.argv[1] && import.meta.url === v_685e17(v_6f7712(process.argv[1])).href;

const v_c09f02 = Number(process.env.KEEP ?? 3);
const v_939dae = "local-d1_";
const v_0e6203 = "keep-";

function v_aa6a66() {
  const v_fd5f43 = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }); 
  return v_fd5f43.replace(/[-:]/g, "").replace(" ", "-") + "KST";
}

function v_c4d525() {
  return v_23d213(v_d554c8)
    .filter((v_8b5cd8) => v_8b5cd8.startsWith(v_939dae) && v_8b5cd8.endsWith(".sqlite"))
    .map((v_8b5cd8) => ({ name: v_8b5cd8, mtime: v_637985(v_315113(v_d554c8, v_8b5cd8)).mtimeMs }))
    .sort((v_779914, v_148ff6) => v_779914.mtime - v_148ff6.mtime);
}

export function v_aa4c58(v_554070 = v_c09f02) {
  const v_48c915 = v_c4d525();
  const v_eedcf1 = v_48c915.slice(0, Math.max(0, v_48c915.length - v_554070));
  for (const { name: v_1833e7 } of v_eedcf1) {
    for (const v_ae8e76 of ["", "-wal", "-shm"]) {
      const v_e2a85c = v_315113(v_d554c8, v_1833e7 + v_ae8e76);
      if (v_14d137(v_e2a85c)) v_e6aa20(v_e2a85c);
    }
    console.log(`  회전 삭제: ${v_1833e7}`);
  }
  if (v_eedcf1.length === 0) console.log(`  회전 삭제: 없음 (보관 ${v_48c915.length}/${v_554070})`);
  return v_eedcf1.length;
}

export function v_5392c4(v_58ca36 = "manual") {
  if (!v_14d137(v_d554c8)) v_eaee41(v_d554c8, { recursive: true });
  const v_38d084 = v_597fc8();
  const v_608c3e = v_58ca36.replace(/[^A-Za-z0-9._-]/g, "-");
  const v_1833e7 = `${v_939dae}${v_aa6a66()}_${v_608c3e}.sqlite`;
  const v_8f5693 = v_315113(v_d554c8, v_1833e7);

  v_64acc4("sqlite3", [v_38d084, `.backup '${v_8f5693}'`], { stdio: ["ignore", "pipe", "pipe"] });
  v_64acc4(
    "sqlite3",
    [v_8f5693, "PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode=DELETE;"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  const v_af49e1 = Number(v_f8df46(v_38d084, "SELECT count(*) FROM sqlite_master WHERE type='table';")[0][0]);
  const v_d630ae = Number(v_f8df46(v_8f5693, "SELECT count(*) FROM sqlite_master WHERE type='table';")[0][0]);
  if (v_af49e1 !== v_d630ae) {
    throw new Error(`스냅샷 검증 실패: 원본 테이블 ${v_af49e1}개 vs 스냅샷 ${v_d630ae}개`);
  }

  for (const v_ae8e76 of ["-wal", "-shm"]) {
    const v_e2a85c = v_8f5693 + v_ae8e76;
    if (v_14d137(v_e2a85c)) v_e6aa20(v_e2a85c);
  }

  const v_6c6b11 = (v_637985(v_8f5693).size / 1024 / 1024).toFixed(1);
  console.log(`스냅샷: d1-snapshots/${v_1833e7}  (${v_6c6b11}MB · 테이블 ${v_d630ae}개 일치 ✅)`);
  return v_8f5693;
}

export function v_ef8ab1() {
  if (!v_14d137(v_d554c8)) return console.log("d1-snapshots/ 없음");
  const v_ff9685 = v_23d213(v_d554c8)
    .filter((v_8b5cd8) => v_8b5cd8.endsWith(".sqlite"))
    .sort();
  if (v_ff9685.length === 0) return console.log("보관된 스냅샷 없음");
  for (const v_8b5cd8 of v_ff9685) {
    const v_6c6b11 = (v_637985(v_315113(v_d554c8, v_8b5cd8)).size / 1024 / 1024).toFixed(1);
    const v_145782 = v_8b5cd8.startsWith(v_0e6203) ? " [회전 제외]" : "";
    console.log(`  ${v_6c6b11.padStart(6)}MB  ${v_8b5cd8}${v_145782}`);
  }
}

if (v_0d2333) {
  const v_8a7d8c = process.argv.slice(2);
  if (v_8a7d8c.includes("--list")) v_ef8ab1();
  else if (v_8a7d8c.includes("--rotate")) v_aa4c58();
  else {
    v_5392c4(v_8a7d8c.find((v_779914) => !v_779914.startsWith("--")) ?? "manual");
    v_aa4c58();
    v_ef8ab1();
  }
}
