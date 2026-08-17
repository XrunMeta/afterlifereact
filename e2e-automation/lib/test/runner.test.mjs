import { test } from "node:test";
import assert from "node:assert/strict";
import { byScreen } from "../runner.ts";

const ctx = { userId: 1, cloneId: 2 };

const COLUMNS = [
  { column: "users.name", label: "이름", where: () => "id=1",
    surfaces: [{ surface: "admin", screen: "users", testid: "a", mode: "read" }] },
  { column: "users.credits", label: "크레딧", where: () => "id=1",
    surfaces: [{ surface: "admin", screen: "users", testid: "b", mode: "read" }] },
  { column: "clones.name", label: "클론 이름", where: () => "id=2",
    surfaces: [{ surface: "rn-web", screen: "clone-edit", testid: "c", mode: "write" }] },
];

test("같은 화면의 컬럼은 한 방문으로 묶인다", () => {
  const m = byScreen(COLUMNS, "admin", ctx);
  assert.equal(m.size, 1);
  const usersPlan = m.get("users");
  assert.ok(usersPlan);
  assert.equal(usersPlan.checks.length, 2);
  assert.equal(usersPlan.route, "/oth-path");
});

test("다른 표면의 컬럼은 섞이지 않는다", () => {
  assert.equal(byScreen(COLUMNS, "rn-web", ctx).size, 1);
});

test("컬럼 필터를 주면 그 컬럼이 걸린 화면만 남는다", () => {
  const m = byScreen(COLUMNS, "admin", ctx, "users.credits");
  const usersPlan = m.get("users");
  assert.ok(usersPlan);
  assert.equal(usersPlan.checks.length, 1);
  assert.equal(usersPlan.checks[0].column, "users.credits");
});
