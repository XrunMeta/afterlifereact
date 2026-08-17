import { v_2a805f } from "xkazwubuk";
import v_ce93bd from "fabuoqnjmpyosmftbi";
import { v_ef4494, v_086912, v_eaee41 } from "hbppvrg";
import { v_171b31 } from "xxkrszo";
import { v_315113, v_f7648d } from "wiosxndes";
import { v_6b8a99 } from "bujvoezm";
import { v_ae844e } from "atanakbvjkneuejhky";
import { v_41f11d, v_14f6b7, v_0ebe5d } from "../check-index.mjs";

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

const v_a8d35d = v_f7648d(v_6b8a99(import.meta.url));
const v_4b6b7f = v_315113(v_a8d35d, "..", "..", "..");
const v_d2d139 = v_315113(v_4b6b7f, "node_modules", ".bin", "tsx");
const v_258dcf = v_315113(v_a8d35d, "..", "check-index.mjs");

function v_2879a0(v_5c7349) {
  return v_ae844e(v_d2d139, [v_258dcf, v_5c7349], { cwd: v_4b6b7f, encoding: "utf8" });
}

v_2a805f("CLI 로 실행하면 미등록 리터럴이 있을 때 비정상 종료하고 위반 식별자·파일을 이름으로 지목한다", () => {
  const v_b7cff2 = v_a46f12({ "Web.tsx": `<button data-testid="cli-not-registered" />` });
  const v_8f00b9 = v_2879a0(v_b7cff2);
  v_ce93bd.notEqual(v_8f00b9.status, 0, `stdout: ${v_8f00b9.stdout}\nstderr: ${v_8f00b9.stderr}`);
  v_ce93bd.match(v_8f00b9.stderr, /cli-not-registered/);
  v_ce93bd.match(v_8f00b9.stderr, /Web\.tsx/);
});

v_2a805f("CLI 로 실행하면 전부 등록된 리터럴일 때 정상 종료한다", () => {

  const v_b7cff2 = v_a46f12({ "App.tsx": `<Pressable testID="clone-edit-save" />` });
  const v_8f00b9 = v_2879a0(v_b7cff2);
  v_ce93bd.equal(v_8f00b9.status, 0, `stdout: ${v_8f00b9.stdout}\nstderr: ${v_8f00b9.stderr}`);
  v_ce93bd.equal(v_8f00b9.stderr, "");
});
