import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";
import { TID } from "@afterlife/test-ids";
import { collectIds, scanSourceIds, ruleLiteralsRegistered, ruleIdsIndexed, ruleColumnsExist } from "../check-index.mjs";

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "chk-"));
  for (const [name, body] of Object.entries(files)) {
    const p = join(dir, name);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, body);
  }
  return dir;
}

test("collectIds 는 중첩 객체의 모든 문자열을 모은다", () => {
  const ids = collectIds({ a: { b: "x-y" }, c: "z-w" });
  assert.deepEqual([...ids].sort(), ["x-y", "z-w"]);
});

test("scanSourceIds 는 data-testid 와 testID 리터럴을 파일·줄과 함께 찾는다", () => {
  const dir = fixture({
    "Web.tsx": `<button data-testid="admin-users-save">저장</button>`,
    "App.tsx": `<Pressable testID="clone-edit-save" />`,
  });
  const found = scanSourceIds([dir]);
  const values = found.map((f) => f.value).sort();
  assert.deepEqual(values, ["admin-users-save", "clone-edit-save"]);
  assert.equal(found.every((f) => f.line > 0), true);
});

test("패키지에 없는 리터럴은 위반으로 잡히고 메시지에 파일과 값이 들어간다", () => {
  const dir = fixture({ "Web.tsx": `<button data-testid="not-registered" />` });
  const v = ruleLiteralsRegistered({ cloneEdit: { save: "clone-edit-save" } }, [dir]);
  assert.equal(v.length, 1);
  assert.match(v[0], /not-registered/);
  assert.match(v[0], /Web\.tsx/);
});

test("패키지에 있는 리터럴은 통과한다", () => {
  const dir = fixture({ "App.tsx": `<Pressable testID="clone-edit-save" />` });
  assert.deepEqual(ruleLiteralsRegistered({ cloneEdit: { save: "clone-edit-save" } }, [dir]), []);
});

test("템플릿 리터럴로 만든 행 식별자는 접두어가 등록돼 있으면 통과한다", () => {
  const dir = fixture({ "List.tsx": "<tr data-testid={`admin-users-row-${u.id}`} />" });
  assert.deepEqual(ruleLiteralsRegistered({ admin: { users: { row: "admin-users-row" } } }, [dir]), []);
});

test("scanSourceIds 는 속성값이 줄바꿈으로 감싸진 보간 템플릿도 찾는다(Prettier 줄바꿈 대응)", () => {
  const dir = fixture({
    "Wrapped.tsx": "<tr\n  data-testid={\n    `admin-users-row-${u.id}`\n  }\n/>",
  });
  const found = scanSourceIds([dir]);
  assert.deepEqual(found.map((f) => f.value), ["admin-users-row"]);

  assert.equal(found[0].line, 2);
});

test("scanSourceIds 는 보간이 없는 템플릿 리터럴도 찾는다", () => {
  const dir = fixture({ "Plain.tsx": "<Pressable testID={`plain-literal-id`} />" });
  const found = scanSourceIds([dir]);
  assert.deepEqual(found.map((f) => f.value), ["plain-literal-id"]);
});

test("규칙 1은 줄바꿈으로 감싸진 미등록 리터럴을 위반으로 잡는다", () => {
  const dir = fixture({
    "Wrapped.tsx": "<tr\n  data-testid={\n    `admin-users-row-${u.id}`\n  }\n/>",
  });
  const v = ruleLiteralsRegistered({ cloneEdit: { save: "clone-edit-save" } }, [dir]);
  assert.equal(v.length, 1);
  assert.match(v[0], /oth-path-users-row/);
  assert.match(v[0], /Wrapped\.tsx/);
});

test("규칙 1은 보간 없는 템플릿 리터럴 미등록도 위반으로 잡는다", () => {
  const dir = fixture({ "Plain.tsx": "<Pressable testID={`plain-literal-id`} />" });
  const v = ruleLiteralsRegistered({ cloneEdit: { save: "clone-edit-save" } }, [dir]);
  assert.equal(v.length, 1);
  assert.match(v[0], /plain-literal-id/);
});

test("단일 줄·따옴표·보간 템플릿 케이스는 회귀 없이 그대로 통과한다", () => {
  const dir = fixture({
    "Single.tsx": [
      `<button data-testid="admin-users-save">저장</button>`,
      "<tr data-testid={`admin-users-row-${u.id}`} />",
    ].join("\n"),
  });
  const found = scanSourceIds([dir]).map((f) => f.value).sort();
  assert.deepEqual(found, ["admin-users-row", "admin-users-save"]);
});

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..", "..");
const TSX_BIN = join(ROOT, "node_modules", ".bin", "tsx");
const CLI_SCRIPT = join(here, "..", "check-index.mjs");

function runCli(fixtureDir) {
  return spawnSync(TSX_BIN, [CLI_SCRIPT, fixtureDir], { cwd: ROOT, encoding: "utf8" });
}

const CLI_UNREGISTERED_ID = "cli-not-registered";

test("CLI 로 실행하면 미등록 리터럴이 있을 때 비정상 종료하고 위반 식별자·파일을 이름으로 지목한다", () => {
  const dir = fixture({ "Web.tsx": `<button data-testid="${CLI_UNREGISTERED_ID}" />` });
  const res = runCli(dir);
  assert.notEqual(res.status, 0, `stdout: ${res.stdout}\nstderr: ${res.stderr}`);
  assert.match(res.stderr, new RegExp(CLI_UNREGISTERED_ID));
  assert.match(res.stderr, /Web\.tsx/);
});

test("CLI 로 실행하면 전부 등록된 리터럴일 때 정상 종료한다", () => {
  const dir = fixture({ "App.tsx": `<Pressable testID="${TID.cloneEdit.save}" />` });
  const res = runCli(dir);
  assert.equal(res.status, 0, `stdout: ${res.stdout}\nstderr: ${res.stderr}`);
  assert.equal(res.stderr, "");
});

test("인덱스에 연결되지 않은 식별자는 위반이다", () => {
  const tid = { admin: { users: { name: "admin-users-name", save: "admin-users-save" } } };
  const columns = [{ column: "users.name", surfaces: [{ testid: "admin-users-name" }] }];
  const v = ruleIdsIndexed(tid, columns, {});
  assert.equal(v.length, 1);
  assert.match(v[0], /oth-path-users-save/);
});

test("noColumn 으로 면제하면 통과한다", () => {
  const tid = { admin: { users: { save: "admin-users-save" } } };
  const v = ruleIdsIndexed(tid, [], { "admin-users-save": "저장 버튼 — 컬럼 값이 아니라 동작" });
  assert.deepEqual(v, []);
});

test("면제 사유가 빈 문자열이면 면제로 인정하지 않는다", () => {
  const tid = { admin: { users: { save: "admin-users-save" } } };
  const v = ruleIdsIndexed(tid, [], { "admin-users-save": "" });
  assert.equal(v.length, 1);
  assert.match(v[0], /사유/);
});

test("면제 사유가 공백뿐이어도 면제로 인정하지 않는다", () => {
  const tid = { admin: { users: { save: "admin-users-save" } } };
  const v = ruleIdsIndexed(tid, [], { "admin-users-save": "   " });
  assert.equal(v.length, 1);
  assert.match(v[0], /사유/);
});

test("실제 스키마에 없는 컬럼은 위반이고 메시지에 컬럼명이 들어간다", () => {
  const db = execFileSync("node", ["e2e-automation/lib/local-db.mjs"], { encoding: "utf8" }).trim();
  const v = ruleColumnsExist([{ column: "users.no_such_column", surfaces: [] }], db);
  assert.equal(v.length, 1);
  assert.match(v[0], /oth-path\.no_such_column/);
});

test("실제 스키마에 있는 컬럼은 통과한다", () => {
  const db = execFileSync("node", ["e2e-automation/lib/local-db.mjs"], { encoding: "utf8" }).trim();
  assert.deepEqual(ruleColumnsExist([{ column: "users.credits", surfaces: [] }], db), []);
});

test("컬럼명에 SQL 로 꽂히면 위험한 문자가 있으면 쿼리를 실행하지 않고 위반으로 잡는다", () => {
  const v = ruleColumnsExist([{ column: "users.name; DROP TABLE users;--", surfaces: [] }], "/dev/null");
  assert.equal(v.length, 1);
  assert.match(v[0], /허용되지 않는 문자/);
});

test("DB 조회 자체가 실패해도(예: 존재하지 않는 경로) 던지지 않고 이름을 대며 위반으로 잡는다", () => {
  const v = ruleColumnsExist([{ column: "users.credits", surfaces: [] }], "/no/such/dir/db.sqlite");
  assert.equal(v.length, 1);
  assert.match(v[0], /oth-path\.credits/);
});
