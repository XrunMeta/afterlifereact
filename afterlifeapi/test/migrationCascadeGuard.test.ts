

import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";

type Migration = { name: string; queries: string[] };

const TEMP_TABLE = /(^_bak_|_new$|_old$|_tmp$|^_)/i;

const KNOWN_PAST_VIOLATIONS = new Set([
  "0044_clones_visibility_check_selected",
  "0092_clone_type_expert",
]);

function migrationName(m: Migration): string {
  return m.name.replace(/\.sql$/i, "");
}

function stripComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
}

function parseFkEdges(sql: string): Array<{ child: string; parent: string }> {
  const out: Array<{ child: string; parent: string }> = [];
  const createRe =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([A-Za-z_][A-Za-z0-9_]*)["`]?\s*\(/gi;
  let m: RegExpExecArray | null;
  while ((m = createRe.exec(sql)) !== null) {
    const child = m[1];

    let depth = 0;
    let i = m.index + m[0].length - 1;
    const start = i;
    for (; i < sql.length; i++) {
      if (sql[i] === "(") depth++;
      else if (sql[i] === ")") {
        depth--;
        if (depth === 0) break;
      }
    }
    const body = sql.slice(start, i + 1);
    const refRe =
      /REFERENCES\s+["`]?([A-Za-z_][A-Za-z0-9_]*)["`]?\s*\([^)]*\)\s*ON\s+DELETE\s+(CASCADE|SET\s+NULL)/gi;
    let r: RegExpExecArray | null;
    while ((r = refRe.exec(body)) !== null) {
      out.push({ child, parent: r[1] });
    }
  }
  return out;
}

function parseDrops(sql: string): string[] {
  const out: string[] = [];
  const re =
    /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["`]?([A-Za-z_][A-Za-z0-9_]*)["`]?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) out.push(m[1]);
  return out;
}

function hasCompensation(sql: string): boolean {
  return /_bak_/i.test(sql);
}

describe("T-440 마이그레이션 CASCADE 가드", () => {
  const migrations = (env.TEST_MIGRATIONS as unknown as Migration[]) ?? [];

  it("마이그레이션 목록을 읽을 수 있다 (가드 자체의 전제)", () => {

    expect(migrations.length).toBeGreaterThan(50);
  });

  it("부모 테이블을 DROP 하는 마이그는 CASCADE 자식을 보상 로직으로 보존해야 한다", () => {

    const childrenOf = new Map<string, Set<string>>();
    const violations: string[] = [];
    const staleAllowlist = new Set(KNOWN_PAST_VIOLATIONS);

    for (const mig of migrations) {
      const name = migrationName(mig);
      const sql = stripComments(mig.queries.join("\n"));

      for (const dropped of parseDrops(sql)) {
        if (TEMP_TABLE.test(dropped)) continue;
        const kids = childrenOf.get(dropped);
        if (!kids || kids.size === 0) continue;
        if (hasCompensation(sql)) continue;

        if (staleAllowlist.has(name)) {
          staleAllowlist.delete(name);
          continue;
        }
        violations.push(
          `${name}: DROP TABLE ${dropped} — CASCADE/SET NULL 자식 ${kids.size}개 ` +
            `(${[...kids].sort().join(", ")}) 가 조용히 삭제된다. ` +
            `보상 로직(_bak_ 백업→복원)을 추가할 것.`,
        );
      }

      for (const { child, parent } of parseFkEdges(sql)) {
        if (TEMP_TABLE.test(child)) continue;
        if (!childrenOf.has(parent)) childrenOf.set(parent, new Set());
        childrenOf.get(parent)!.add(child);
      }

      for (const dropped of parseDrops(sql)) {
        if (TEMP_TABLE.test(dropped)) continue;
        const recreated = new RegExp(
          `RENAME\\s+TO\\s+["\`]?${dropped}["\`]?`,
          "i",
        ).test(sql);
        if (recreated) continue; 
        for (const kids of childrenOf.values()) kids.delete(dropped);
        childrenOf.delete(dropped);
      }
    }

    expect(violations, `\n${violations.join("\n")}\n`).toEqual([]);

    expect(
      [...staleAllowlist],
      "KNOWN_PAST_VIOLATIONS 에 더 이상 위반이 아닌 항목이 남아 있다 — 목록을 갱신할 것",
    ).toEqual([]);
  });

  it("`PRAGMA foreign_keys` 실행문을 가진 마이그가 없다", () => {

    const offenders: string[] = [];
    for (const mig of migrations) {
      if (/PRAGMA\s+foreign_keys/i.test(mig.queries.join("\n"))) {
        offenders.push(migrationName(mig));
      }
    }
    expect(
      offenders,
      `\nD1 에서 no-op 인 PRAGMA foreign_keys 실행문이 남아 있다 (제거하고 주석으로 사유를 남길 것):\n  ${offenders.join("\n  ")}\n`,
    ).toEqual([]);
  });
});
