

import { test } from "node:test";
import assert from "node:assert/strict";
import { COLUMNS } from "../../index/columns.ts";
import { SURFACES } from "../../index/surfaces.ts";
import { buildScreens, routeFor } from "../../index/screens.ts";
import { ruleColumnsExist } from "../check-index.mjs";
import { resolveLocalD1 } from "../local-db.mjs";

test("SURFACES 는 admin·rn-web·rn-native 세 표면을 정의하고 rn-native 만 미자동화다", () => {
  assert.deepEqual(Object.keys(SURFACES).sort(), ["admin", "rn-native", "rn-web"]);
  assert.equal(SURFACES.admin.automated, true);
  assert.equal(SURFACES["rn-web"].automated, true);
  assert.equal(SURFACES["rn-native"].automated, false);
});

test("COLUMNS 의 모든 테이블.컬럼은 실제 로컬 D1 스키마에 있다 — 인덱스가 아니라 현실이다", () => {
  const db = resolveLocalD1();
  assert.deepEqual(ruleColumnsExist(COLUMNS, db), []);
});

test("COLUMNS 의 모든 surface 는 SCREENS 에 등록된 (surface, screen) 키를 참조한다", () => {
  for (const c of COLUMNS) {
    for (const s of c.surfaces) {
      assert.doesNotThrow(
        () => routeFor(s.surface, s.screen),
        `${c.column} → ${s.surface}:${s.screen} 가 SCREENS 에 없습니다`,
      );
    }
  }
});

test("등록되지 않은 (surface, screen) 조합을 조회하면 이름을 대며 던진다", () => {
  assert.throws(() => routeFor("admin", "no-such-screen"), /no-such-screen/);
});

test("같은 (surface, screen) 조합을 두 번 등록하면 route 를 하나로 정할 수 없어 던진다", () => {
  assert.throws(
    () =>
      buildScreens([
        { surface: "admin", screen: "users", route: () => "/oth-path" },
        { surface: "admin", screen: "users", route: () => "/oth-path-dup" },
      ]),
    /oth-path:users/,
  );
});
