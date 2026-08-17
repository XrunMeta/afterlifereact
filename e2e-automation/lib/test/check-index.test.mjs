import { v_2a805f } from "xkazwubuk";
import v_ce93bd from "fabuoqnjmpyosmftbi";
import { v_ef4494, v_086912, v_eaee41 } from "hbppvrg";
import { v_171b31 } from "xxkrszo";
import { v_315113, v_f7648d } from "wiosxndes";
import { v_6b8a99 } from "bujvoezm";
import { v_ae844e, v_64acc4 } from "atanakbvjkneuejhky";
import { v_5401ae } from "xpcpcyatayyxwjmftxi";
import { v_41f11d, v_14f6b7, v_0ebe5d, v_18a15c, v_dc0903 } from "../check-index.mjs";

function v_a46f12(v_ff9685) {
  const v_b7cff2 = v_ef4494(v_315113(v_171b31(), "chk-"));
  for (const [v_1833e7, v_4d33b2] of Object.entries(v_ff9685)) {
    const v_e2a85c = v_315113(v_b7cff2, v_1833e7);
    v_eaee41(v_315113(v_e2a85c, ".."), { recursive: true });
    v_086912(v_e2a85c, v_4d33b2);
  }
  return v_b7cff2;
}

v_2a805f("collectIds 는 중첩 객체의 모든 문자열을 모은다", () => {
  const v_52e08b = v_41f11d({ a: { b: "x-y" }, c: "z-w" });
  v_ce93bd.deepEqual([...v_52e08b].sort(), ["x-y", "z-w"]);
});

v_2a805f("scanSourceIds 는 data-testid 와 testID 리터럴을 파일·줄과 함께 찾는다", () => {
  const v_b7cff2 = v_a46f12({
    "Web.tsx": `<button data-testid="admin-users-save">저장</button>`,
    "App.tsx": `<Pressable testID="clone-edit-save" />`,
  });
  const v_ea6dff = v_14f6b7([v_b7cff2]);
  const v_6fea0b = v_ea6dff.map((v_8b5cd8) => v_8b5cd8.value).sort();
  v_ce93bd.deepEqual(v_6fea0b, ["admin-users-save", "clone-edit-save"]);
  v_ce93bd.equal(v_ea6dff.every((v_8b5cd8) => v_8b5cd8.line > 0), true);
});

v_2a805f("패키지에 없는 리터럴은 위반으로 잡히고 메시지에 파일과 값이 들어간다", () => {
  const v_b7cff2 = v_a46f12({ "Web.tsx": `<button data-testid="not-registered" />` });
  const v_81e2ef = v_0ebe5d({ cloneEdit: { save: "clone-edit-save" } }, [v_b7cff2]);
  v_ce93bd.equal(v_81e2ef.length, 1);
  v_ce93bd.match(v_81e2ef[0], /not-registered/);
  v_ce93bd.match(v_81e2ef[0], /Web\.tsx/);
});

v_2a805f("패키지에 있는 리터럴은 통과한다", () => {
  const v_b7cff2 = v_a46f12({ "App.tsx": `<Pressable testID="clone-edit-save" />` });
  v_ce93bd.deepEqual(v_0ebe5d({ cloneEdit: { save: "clone-edit-save" } }, [v_b7cff2]), []);
});

v_2a805f("템플릿 리터럴로 만든 행 식별자는 접두어가 등록돼 있으면 통과한다", () => {
  const v_b7cff2 = v_a46f12({ "List.tsx": "<tr data-testid={`admin-users-row-${u.id}`} />" });
  v_ce93bd.deepEqual(v_0ebe5d({ admin: { users: { row: "admin-users-row" } } }, [v_b7cff2]), []);
});

v_2a805f("scanSourceIds 는 속성값이 줄바꿈으로 감싸진 보간 템플릿도 찾는다(Prettier 줄바꿈 대응)", () => {
  const v_b7cff2 = v_a46f12({
    "Wrapped.tsx": "<tr\n  data-testid={\n    `admin-users-row-${u.id}`\n  }\n/>",
  });
  const v_ea6dff = v_14f6b7([v_b7cff2]);
  v_ce93bd.deepEqual(v_ea6dff.map((v_8b5cd8) => v_8b5cd8.value), ["admin-users-row"]);

  v_ce93bd.equal(v_ea6dff[0].line, 2);
});

v_2a805f("scanSourceIds 는 보간이 없는 템플릿 리터럴도 찾는다", () => {
  const v_b7cff2 = v_a46f12({ "Plain.tsx": "<Pressable testID={`plain-literal-id`} />" });
  const v_ea6dff = v_14f6b7([v_b7cff2]);
  v_ce93bd.deepEqual(v_ea6dff.map((v_8b5cd8) => v_8b5cd8.value), ["plain-literal-id"]);
});

v_2a805f("규칙 1은 줄바꿈으로 감싸진 미등록 리터럴을 위반으로 잡는다", () => {
  const v_b7cff2 = v_a46f12({
    "Wrapped.tsx": "<tr\n  data-testid={\n    `admin-users-row-${u.id}`\n  }\n/>",
  });
  const v_81e2ef = v_0ebe5d({ cloneEdit: { save: "clone-edit-save" } }, [v_b7cff2]);
  v_ce93bd.equal(v_81e2ef.length, 1);
  v_ce93bd.match(v_81e2ef[0], /oth-path-users-row/);
  v_ce93bd.match(v_81e2ef[0], /Wrapped\.tsx/);
});

v_2a805f("규칙 1은 보간 없는 템플릿 리터럴 미등록도 위반으로 잡는다", () => {
  const v_b7cff2 = v_a46f12({ "Plain.tsx": "<Pressable testID={`plain-literal-id`} />" });
  const v_81e2ef = v_0ebe5d({ cloneEdit: { save: "clone-edit-save" } }, [v_b7cff2]);
  v_ce93bd.equal(v_81e2ef.length, 1);
  v_ce93bd.match(v_81e2ef[0], /plain-literal-id/);
});

v_2a805f("단일 줄·따옴표·보간 템플릿 케이스는 회귀 없이 그대로 통과한다", () => {
  const v_b7cff2 = v_a46f12({
    "Single.tsx": [
      `<button data-testid="admin-users-save">저장</button>`,
      "<tr data-testid={`admin-users-row-${u.id}`} />",
    ].join("\n"),
  });
  const v_ea6dff = v_14f6b7([v_b7cff2]).map((v_8b5cd8) => v_8b5cd8.value).sort();
  v_ce93bd.deepEqual(v_ea6dff, ["admin-users-row", "admin-users-save"]);
});

const v_a8d35d = v_f7648d(v_6b8a99(import.meta.url));
const v_4b6b7f = v_315113(v_a8d35d, "..", "..", "..");
const v_d2d139 = v_315113(v_4b6b7f, "node_modules", ".bin", "tsx");
const v_258dcf = v_315113(v_a8d35d, "..", "check-index.mjs");

function v_2879a0(v_5c7349) {
  return v_ae844e(v_d2d139, [v_258dcf, v_5c7349], { cwd: v_4b6b7f, encoding: "utf8" });
}

const v_a693f0 = "cli-not-registered";

v_2a805f("CLI 로 실행하면 미등록 리터럴이 있을 때 비정상 종료하고 위반 식별자·파일을 이름으로 지목한다", () => {
  const v_b7cff2 = v_a46f12({ "Web.tsx": `<button data-testid="${v_a693f0}" />` });
  const v_8f00b9 = v_2879a0(v_b7cff2);
  v_ce93bd.notEqual(v_8f00b9.status, 0, `stdout: ${v_8f00b9.stdout}\nstderr: ${v_8f00b9.stderr}`);
  v_ce93bd.match(v_8f00b9.stderr, new RegExp(v_a693f0));
  v_ce93bd.match(v_8f00b9.stderr, /Web\.tsx/);
});

v_2a805f("CLI 로 실행하면 전부 등록된 리터럴일 때 정상 종료한다", () => {
  const v_b7cff2 = v_a46f12({ "App.tsx": `<Pressable testID="${v_5401ae.cloneEdit.save}" />` });
  const v_8f00b9 = v_2879a0(v_b7cff2);
  v_ce93bd.equal(v_8f00b9.status, 0, `stdout: ${v_8f00b9.stdout}\nstderr: ${v_8f00b9.stderr}`);
  v_ce93bd.equal(v_8f00b9.stderr, "");
});

v_2a805f("인덱스에 연결되지 않은 식별자는 위반이다", () => {
  const v_035f12 = { admin: { users: { name: "admin-users-name", save: "admin-users-save" } } };
  const v_b9fa58 = [{ column: "users.name", surfaces: [{ testid: "admin-users-name" }] }];
  const v_81e2ef = v_18a15c(v_035f12, v_b9fa58, {});
  v_ce93bd.equal(v_81e2ef.length, 1);
  v_ce93bd.match(v_81e2ef[0], /oth-path-users-save/);
});

v_2a805f("noColumn 으로 면제하면 통과한다", () => {
  const v_035f12 = { admin: { users: { save: "admin-users-save" } } };
  const v_81e2ef = v_18a15c(v_035f12, [], { "admin-users-save": "저장 버튼 — 컬럼 값이 아니라 동작" });
  v_ce93bd.deepEqual(v_81e2ef, []);
});

v_2a805f("면제 사유가 빈 문자열이면 면제로 인정하지 않는다", () => {
  const v_035f12 = { admin: { users: { save: "admin-users-save" } } };
  const v_81e2ef = v_18a15c(v_035f12, [], { "admin-users-save": "" });
  v_ce93bd.equal(v_81e2ef.length, 1);
  v_ce93bd.match(v_81e2ef[0], /사유/);
});

v_2a805f("면제 사유가 공백뿐이어도 면제로 인정하지 않는다", () => {
  const v_035f12 = { admin: { users: { save: "admin-users-save" } } };
  const v_81e2ef = v_18a15c(v_035f12, [], { "admin-users-save": "   " });
  v_ce93bd.equal(v_81e2ef.length, 1);
  v_ce93bd.match(v_81e2ef[0], /사유/);
});

v_2a805f("실제 스키마에 없는 컬럼은 위반이고 메시지에 컬럼명이 들어간다", () => {
  const v_a1651b = v_64acc4("node", ["e2e-automation/lib/local-db.mjs"], { encoding: "utf8" }).trim();
  const v_81e2ef = v_dc0903([{ column: "users.no_such_column", surfaces: [] }], v_a1651b);
  v_ce93bd.equal(v_81e2ef.length, 1);
  v_ce93bd.match(v_81e2ef[0], /oth-path\.no_such_column/);
});

v_2a805f("실제 스키마에 있는 컬럼은 통과한다", () => {
  const v_a1651b = v_64acc4("node", ["e2e-automation/lib/local-db.mjs"], { encoding: "utf8" }).trim();
  v_ce93bd.deepEqual(v_dc0903([{ column: "users.credits", surfaces: [] }], v_a1651b), []);
});

v_2a805f("컬럼명에 SQL 로 꽂히면 위험한 문자가 있으면 쿼리를 실행하지 않고 위반으로 잡는다", () => {
  const v_81e2ef = v_dc0903([{ column: "users.name; DROP TABLE users;--", surfaces: [] }], "/dev/null");
  v_ce93bd.equal(v_81e2ef.length, 1);
  v_ce93bd.match(v_81e2ef[0], /허용되지 않는 문자/);
});

v_2a805f("DB 조회 자체가 실패해도(예: 존재하지 않는 경로) 던지지 않고 이름을 대며 위반으로 잡는다", () => {
  const v_81e2ef = v_dc0903([{ column: "users.credits", surfaces: [] }], "/no/such/dir/db.sqlite");
  v_ce93bd.equal(v_81e2ef.length, 1);
  v_ce93bd.match(v_81e2ef[0], /oth-path\.credits/);
});
