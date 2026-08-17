

import { v_23d213, v_f2e4af, v_637985 } from "hbppvrg";
import { v_315113, v_84bf7c } from "wiosxndes";
import { v_f8df46 } from "./local-db.mjs";

const v_3cd62e = new Set([".ts", ".tsx", ".js", ".jsx"]);
const v_2edffa = new Set(["node_modules", ".git", "dist", "build", ".expo", "web-stubs"]);

export function v_41f11d(v_035f12) {
  const v_8d4337 = new Set();

  const v_847981 = (v_b6c474) => {
    for (const v_81e2ef of Object.values(v_b6c474)) {
      if (typeof v_81e2ef === "string") v_8d4337.add(v_81e2ef);
      else if (v_81e2ef && typeof v_81e2ef === "object") v_847981(v_81e2ef);
    }
  };
  v_847981(v_035f12);
  return v_8d4337;
}

function* v_1fa513(v_b7cff2) {
  for (const v_9e86fd of v_23d213(v_b7cff2, { withFileTypes: true })) {
    if (v_9e86fd.isDirectory()) {
      if (v_2edffa.has(v_9e86fd.name)) continue;
      yield* v_1fa513(v_315113(v_b7cff2, v_9e86fd.name));
    } else if (v_3cd62e.has(v_84bf7c(v_9e86fd.name))) {
      yield v_315113(v_b7cff2, v_9e86fd.name);
    }
  }
}

const v_f6bcc4 = [
  { re: /(?:data-testid|testID)\s*=\s*["']([^"']+)["']/g, prefix: false },
  { re: /(?:data-testid|testID)\s*=\s*\{\s*`([^`$]+)\$\{/g, prefix: true },

  { re: /(?:data-testid|testID)\s*=\s*\{\s*`([^`$]+)`\s*\}/g, prefix: false },
];

export function v_14f6b7(v_47e920) {
  const v_8d4337 = [];
  for (const v_b7cff2 of v_47e920) {
    let v_3ed4c3 = true;
    try { v_3ed4c3 = v_637985(v_b7cff2).isDirectory(); } catch { v_3ed4c3 = false; }
    if (!v_3ed4c3) continue;
    for (const v_4de33e of v_1fa513(v_b7cff2)) {
      const v_9b6134 = v_f2e4af(v_4de33e, "utf8");
      for (const { re: v_d95200, prefix: v_cd931c } of v_f6bcc4) {
        v_d95200.lastIndex = 0;
        let v_35f85c;
        while ((v_35f85c = v_d95200.exec(v_9b6134))) {
          const v_e6293e = v_9b6134.slice(0, v_35f85c.index).split("\n").length;

          const v_3b402b = v_cd931c ? v_35f85c[1].replace(/-$/, "") : v_35f85c[1];
          v_8d4337.push({ value: v_3b402b, file: v_4de33e, line: v_e6293e });
        }
      }
    }
  }
  return v_8d4337;
}

export function v_0ebe5d(v_035f12, v_47e920) {
  const v_d81543 = v_41f11d(v_035f12);
  return v_14f6b7(v_47e920)
    .filter((v_8b5cd8) => !v_d81543.has(v_8b5cd8.value))
    .map(
      (v_8b5cd8) =>
        `[규칙1] 패키지에 없는 식별자 "${v_8b5cd8.value}" — ${v_8b5cd8.file}:${v_8b5cd8.line}\n` +
        `        packages/test-ids/src/index.ts 에 추가하거나, 소스에서 TID 를 import 해 쓰세요.`,
    );
}

export function v_18a15c(v_035f12, v_b9fa58, v_5c820c) {
  const v_87cbd5 = new Set();
  for (const v_3f4e2e of v_b9fa58) {
    for (const v_fd5f43 of v_3f4e2e.surfaces) {
      v_87cbd5.add(v_fd5f43.testid);
      if (v_fd5f43.row?.containerTestid) v_87cbd5.add(v_fd5f43.row.containerTestid);
    }
  }
  const v_133edd = [];
  for (const v_389afb of v_41f11d(v_035f12)) {
    if (v_87cbd5.has(v_389afb)) continue;
    const v_58ca36 = v_5c820c[v_389afb];

    if (typeof v_58ca36 === "string" && v_58ca36.trim().length > 0) continue;
    v_133edd.push(
      `[규칙2] 인덱스에 연결되지 않은 식별자 "${v_389afb}"\n` +
        `        e2e-automation/index/columns.ts 에 컬럼을 추가하거나,\n` +
        `        exemptions 에 **사유**와 함께 면제하세요 (빈 사유는 면제로 인정하지 않습니다).`,
    );
  }
  return v_133edd;
}

const v_479c55 = /^[A-Za-z_]\w*$/;

export function v_dc0903(v_b9fa58, v_fdef12) {
  const v_133edd = [];
  for (const v_3f4e2e of v_b9fa58) {
    const [v_cb9428, v_c8b83f] = v_3f4e2e.column.split(".");
    if (!v_cb9428 || !v_c8b83f) {
      v_133edd.push(`[규칙3] 형식이 "테이블.컬럼" 이 아닙니다: "${v_3f4e2e.column}"`);
      continue;
    }
    if (!v_479c55.test(v_cb9428) || !v_479c55.test(v_c8b83f)) {
      v_133edd.push(
        `[규칙3] "${v_3f4e2e.column}" 의 테이블·컬럼 이름에 허용되지 않는 문자가 있습니다\n` +
          `        영문/숫자/밑줄만 허용합니다(SQL 에 그대로 꽂히므로 인젝션 방지).`,
      );
      continue;
    }
    try {
      const v_18b8bf = v_f8df46(v_fdef12, `SELECT count(*) FROM pragma_table_info('${v_cb9428}') WHERE name='${v_c8b83f}';`);
      const v_9e8c70 = v_18b8bf[0]?.[0];
      if (v_9e8c70 !== "1") {
        v_133edd.push(
          `[규칙3] 실제 스키마에 없는 컬럼 "${v_3f4e2e.column}"\n` +
            `        마이그 추적 테이블이 아니라 pragma_table_info 로 확인했습니다.\n` +
            `        컬럼명이 바뀌었거나 오타입니다.`,
        );
      }
    } catch (v_49263d) {

      const v_cde5d5 = v_49263d instanceof Error ? v_49263d.message : String(v_49263d);
      v_133edd.push(
        `[규칙3] "${v_3f4e2e.column}" 존재 확인 자체가 실패했습니다: ${v_cde5d5}\n` +
          `        sqlite3 실행 파일이 있는지, DB 경로가 올바른지 확인하세요: ${v_fdef12}`,
      );
    }
  }
  return v_133edd;
}

import { v_685e17 } from "bujvoezm";
import { v_6f7712 as v_7cfe5a } from "wiosxndes";

const v_0d2333 = process.argv[1] && import.meta.url === v_685e17(v_7cfe5a(process.argv[1])).href;

if (v_0d2333) {
  const { TID: v_5401ae } = await import("xpcpcyatayyxwjmftxi");
  const { COLUMNS: v_af189e } = await import("../index/columns.ts");
  const { EXEMPTIONS: v_5580a7 } = await import("../index/exemptions.ts");
  const { resolveLocalD1: v_597fc8 } = await import("./local-db.mjs");

  const v_82ed24 = process.argv.slice(2).length ? process.argv.slice(2) : ["afterlifeadmin/src", "afterlifeRN/src"];
  const v_133edd = [
    ...v_0ebe5d(v_5401ae, v_82ed24),
    ...v_18a15c(v_5401ae, v_af189e, v_5580a7),
    ...v_dc0903(v_af189e, v_597fc8()),
  ];

  if (v_133edd.length) {
    console.error(`검사기 위반 ${v_133edd.length}건:\n`);
    console.error(v_133edd.join("\n\n"));
    process.exit(1);
  }
  console.log(`검사기 통과 — 식별자 ${v_41f11d(v_5401ae).size}개 · 컬럼 ${v_af189e.length}개`);
}
