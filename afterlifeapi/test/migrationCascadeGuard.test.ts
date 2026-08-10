

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";

type Migration = { name: string; queries: string[] };

const v_2b8fe2 = /(^_bak_|_new$|_old$|_tmp$|^_)/i;

const v_2ae5f3 = new Set([
  "0044_clones_visibility_check_selected",
  "0092_clone_type_expert",
]);

function v_2b7a9f(v_35f85c): string {
  return v_35f85c.name.replace(/\.sql$/i, "");
}

function v_27d5a0(v_f8df46): string {
  return v_f8df46.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
}

function v_f8d4c5(v_f8df46): Array<{ child: string; parent: string }> {
  const v_8d4337 = [];
  const v_1cf158 =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([A-Za-z_][A-Za-z0-9_]*)["`]?\s*\(/gi;
  let v_35f85c;
  while ((v_35f85c = v_1cf158.exec(v_f8df46)) !== null) {
    const v_367d87 = v_35f85c[1];

    let v_c17376 = 0;
    let v_ebec57 = v_35f85c.index + v_35f85c[0].length - 1;
    const v_965edf = v_ebec57;
    for (; v_ebec57 < v_f8df46.length; v_ebec57++) {
      if (v_f8df46[v_ebec57] === "(") v_c17376++;
      else if (v_f8df46[v_ebec57] === ")") {
        v_c17376--;
        if (v_c17376 === 0) break;
      }
    }
    const v_4d33b2 = v_f8df46.slice(v_965edf, v_ebec57 + 1);
    const v_088877 =
      /REFERENCES\s+["`]?([A-Za-z_][A-Za-z0-9_]*)["`]?\s*\([^)]*\)\s*ON\s+DELETE\s+(CASCADE|SET\s+NULL)/gi;
    let v_cb35cb;
    while ((v_cb35cb = v_088877.exec(v_4d33b2)) !== null) {
      v_8d4337.push({ child: v_367d87, parent: v_cb35cb[1] });
    }
  }
  return v_8d4337;
}

function v_6fcc52(v_f8df46): string[] {
  const v_8d4337 = [];
  const v_d95200 =
    /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["`]?([A-Za-z_][A-Za-z0-9_]*)["`]?/gi;
  let v_35f85c;
  while ((v_35f85c = v_d95200.exec(v_f8df46)) !== null) v_8d4337.push(v_35f85c[1]);
  return v_8d4337;
}

function v_40d8d5(v_f8df46): boolean {
  return /_bak_/i.test(v_f8df46);
}

v_469bf2("T-440 마이그레이션 CASCADE 가드", () => {
  const v_9b8aa1 = (v_c9c489.TEST_MIGRATIONS as unknown as Migration[]) ?? [];

  v_23805a("마이그레이션 목록을 읽을 수 있다 (가드 자체의 전제)", () => {

    v_4d37e3(v_9b8aa1.length).toBeGreaterThan(50);
  });

  v_23805a("부모 테이블을 DROP 하는 마이그는 CASCADE 자식을 보상 로직으로 보존해야 한다", () => {

    const v_2af18e = new Map<string, Set<string>>();
    const v_133edd = [];
    const v_bf9627 = new Set(v_2ae5f3);

    for (const v_3ad87d of v_9b8aa1) {
      const v_1833e7 = v_2b7a9f(v_3ad87d);
      const v_f8df46 = v_27d5a0(v_3ad87d.queries.join("\n"));

      for (const v_b0931c of v_6fcc52(v_f8df46)) {
        if (v_2b8fe2.test(v_b0931c)) continue;
        const v_64d505 = v_2af18e.get(v_b0931c);
        if (!v_64d505 || v_64d505.size === 0) continue;
        if (v_40d8d5(v_f8df46)) continue;

        if (v_bf9627.has(v_1833e7)) {
          v_bf9627.delete(v_1833e7);
          continue;
        }
        v_133edd.push(
          `${v_1833e7}: DROP TABLE ${v_b0931c} — CASCADE/SET NULL 자식 ${v_64d505.size}개 ` +
            `(${[...v_64d505].sort().join(", ")}) 가 조용히 삭제된다. ` +
            `보상 로직(_bak_ 백업→복원)을 추가할 것.`,
        );
      }

      for (const { child: v_367d87, parent: v_4eab4b } of v_f8d4c5(v_f8df46)) {
        if (v_2b8fe2.test(v_367d87)) continue;
        if (!v_2af18e.has(v_4eab4b)) v_2af18e.set(v_4eab4b, new Set());
        v_2af18e.get(v_4eab4b)!.add(v_367d87);
      }

      for (const v_b0931c of v_6fcc52(v_f8df46)) {
        if (v_2b8fe2.test(v_b0931c)) continue;
        const v_649121 = new RegExp(
          `RENAME\\s+TO\\s+["\`]?${v_b0931c}["\`]?`,
          "i",
        ).test(v_f8df46);
        if (v_649121) continue; 
        for (const v_64d505 of v_2af18e.values()) v_64d505.delete(v_b0931c);
        v_2af18e.delete(v_b0931c);
      }
    }

    v_4d37e3(v_133edd, `\n${v_133edd.join("\n")}\n`).toEqual([]);

    v_4d37e3(
      [...v_bf9627],
      "KNOWN_PAST_VIOLATIONS 에 더 이상 위반이 아닌 항목이 남아 있다 — 목록을 갱신할 것",
    ).toEqual([]);
  });

  v_23805a("`PRAGMA foreign_keys` 실행문을 가진 마이그가 없다", () => {

    const v_6ae5da = [];
    for (const v_3ad87d of v_9b8aa1) {
      if (/PRAGMA\s+foreign_keys/i.test(v_3ad87d.queries.join("\n"))) {
        v_6ae5da.push(v_2b7a9f(v_3ad87d));
      }
    }
    v_4d37e3(
      v_6ae5da,
      `\nD1 에서 no-op 인 PRAGMA foreign_keys 실행문이 남아 있다 (제거하고 주석으로 사유를 남길 것):\n  ${v_6ae5da.join("\n  ")}\n`,
    ).toEqual([]);
  });
});
