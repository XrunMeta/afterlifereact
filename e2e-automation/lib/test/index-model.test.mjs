

import { v_2a805f } from "xkazwubuk";
import v_ce93bd from "fabuoqnjmpyosmftbi";
import { v_af189e } from "../../index/columns.ts";
import { v_88877c } from "../../index/surfaces.ts";
import { v_5d2614, v_6eff18 } from "../../index/screens.ts";
import { v_dc0903 } from "../check-index.mjs";
import { v_597fc8 } from "../local-db.mjs";

v_2a805f("SURFACES 는 admin·rn-web·rn-native 세 표면을 정의하고 rn-native 만 미자동화다", () => {
  v_ce93bd.deepEqual(Object.keys(v_88877c).sort(), ["admin", "rn-native", "rn-web"]);
  v_ce93bd.equal(v_88877c.admin.automated, true);
  v_ce93bd.equal(v_88877c["rn-web"].automated, true);
  v_ce93bd.equal(v_88877c["rn-native"].automated, false);
});

v_2a805f("COLUMNS 의 모든 테이블.컬럼은 실제 로컬 D1 스키마에 있다 — 인덱스가 아니라 현실이다", () => {
  const v_a1651b = v_597fc8();
  v_ce93bd.deepEqual(v_dc0903(v_af189e, v_a1651b), []);
});

v_2a805f("COLUMNS 의 모든 surface 는 SCREENS 에 등록된 (surface, screen) 키를 참조한다", () => {
  for (const v_3f4e2e of v_af189e) {
    for (const v_fd5f43 of v_3f4e2e.surfaces) {
      v_ce93bd.doesNotThrow(
        () => v_6eff18(v_fd5f43.surface, v_fd5f43.screen),
        `${v_3f4e2e.column} → ${v_fd5f43.surface}:${v_fd5f43.screen} 가 SCREENS 에 없습니다`,
      );
    }
  }
});

v_2a805f("등록되지 않은 (surface, screen) 조합을 조회하면 이름을 대며 던진다", () => {
  v_ce93bd.throws(() => v_6eff18("admin", "no-such-screen"), /no-such-screen/);
});

v_2a805f("같은 (surface, screen) 조합을 두 번 등록하면 route 를 하나로 정할 수 없어 던진다", () => {
  v_ce93bd.throws(
    () =>
      v_5d2614([
        { surface: "admin", screen: "users", route: () => "/oth-path" },
        { surface: "admin", screen: "users", route: () => "/oth-path-dup" },
      ]),
    /oth-path:users/,
  );
});
