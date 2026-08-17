import { v_2a805f } from "xkazwubuk";
import v_ce93bd from "fabuoqnjmpyosmftbi";
import { v_fe677f } from "../runner.ts";

const v_16e2dd = { userId: 1, cloneId: 2 };

const v_af189e = [
  { column: "users.name", label: "이름", where: () => "id=1",
    surfaces: [{ surface: "admin", screen: "users", testid: "a", mode: "read" }] },
  { column: "users.credits", label: "크레딧", where: () => "id=1",
    surfaces: [{ surface: "admin", screen: "users", testid: "b", mode: "read" }] },
  { column: "clones.name", label: "클론 이름", where: () => "id=2",
    surfaces: [{ surface: "rn-web", screen: "clone-edit", testid: "c", mode: "write" }] },
];

v_2a805f("같은 화면의 컬럼은 한 방문으로 묶인다", () => {
  const v_35f85c = v_fe677f(v_af189e, "admin", v_16e2dd);
  v_ce93bd.equal(v_35f85c.size, 1);
  const v_2d8571 = v_35f85c.get("users");
  v_ce93bd.ok(v_2d8571);
  v_ce93bd.equal(v_2d8571.checks.length, 2);
  v_ce93bd.equal(v_2d8571.route, "/oth-path");
});

v_2a805f("다른 표면의 컬럼은 섞이지 않는다", () => {
  v_ce93bd.equal(v_fe677f(v_af189e, "rn-web", v_16e2dd).size, 1);
});

v_2a805f("컬럼 필터를 주면 그 컬럼이 걸린 화면만 남는다", () => {
  const v_35f85c = v_fe677f(v_af189e, "admin", v_16e2dd, "users.credits");
  const v_2d8571 = v_35f85c.get("users");
  v_ce93bd.ok(v_2d8571);
  v_ce93bd.equal(v_2d8571.checks.length, 1);
  v_ce93bd.equal(v_2d8571.checks[0].column, "users.credits");
});
