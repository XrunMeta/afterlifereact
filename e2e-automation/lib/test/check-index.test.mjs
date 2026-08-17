import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { collectIds, scanSourceIds, ruleLiteralsRegistered } from "../check-index.mjs";

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

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..", "..");
const TSX_BIN = join(ROOT, "node_modules", ".bin", "tsx");
const CLI_SCRIPT = join(here, "..", "check-index.mjs");

test("CLI 로 실행하면 미등록 리터럴이 있을 때 비정상 종료하고 위반 식별자를 이름으로 지목한다", () => {
  const res = spawnSync(TSX_BIN, [CLI_SCRIPT], { cwd: ROOT, encoding: "utf8" });
  assert.notEqual(res.status, 0, `stdout: ${res.stdout}\nstderr: ${res.stderr}`);
  assert.match(res.stderr, /\[규칙1\] 패키지에 없는 식별자 "[a-z0-9-]+" — .+\.tsx?:\d+/);
});
